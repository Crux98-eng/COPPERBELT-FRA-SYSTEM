"""
Isolation Forest Model Training Pipeline

Trains the fraud detection model on historical farmer data via Django ORM.
Saves trained model and scaler to ml/models/ for use by async scoring tasks.

Usage:
    python manage.py shell
    >>> from ml.training.isolation_forest import train_fraud_model
    >>> model, scaler, stats = train_fraud_model(n_samples=None, save=True)
    
Or as a management command (recommended for production):
    python manage.py train_fraud_detector --save --output-dir ml/models/
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import logging
from pathlib import Path
from typing import Tuple, Dict, Optional
from datetime import datetime
import json
import os

logger = logging.getLogger(__name__)

# DEPENDS ON: apps.farmers.models.Farmer
# DEPENDS ON: ml.features.extractor.FraudFeatureExtractor

from ml.features.extractor import FraudFeatureExtractor, FraudFeatureExtractor


class FraudModelTrainer:
    """
    Trains IsolationForest model on farmer transaction history.
    
    All data comes from Django ORM (no raw SQL).
    """
    
    FEATURE_NAMES = FraudFeatureExtractor.FEATURE_NAMES
    MODEL_CONFIG = {
        'contamination': 0.05,
        'random_state': 42,
        'n_estimators': 100,
        'max_samples': 256,
        'max_features': 1.0,
    }
    
    def __init__(self, output_dir: str = 'ml/models'):
        """
        Initialize trainer.
        
        Args:
            output_dir: Directory to save model and scaler
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.model = None
        self.scaler = None
    
    def load_training_data(self, farmer_ids: Optional[list] = None) -> Tuple[np.ndarray, pd.DataFrame]:
        """
        Load training data from database via Django ORM.
        
        Args:
            farmer_ids: Optional list of farmer IDs to use. If None, uses all farmers.
            
        Returns:
            Tuple of (feature matrix, DataFrame with metadata)
        """
        logger.info("Loading farmer data from database...")
        
        from apps.farmers.models import Farmer
        
        if farmer_ids is None:
            farmers = Farmer.objects.all()
        else:
            farmers = Farmer.objects.filter(pk__in=farmer_ids)
        
        records = []
        for farmer in farmers:
            try:
                extractor = FraudFeatureExtractor(farmer.id)
                features = extractor.extract_features()
                features['farmer_id'] = farmer.id
                features['nrc'] = getattr(farmer, 'nrc', None)
                features['created_at'] = farmer.created_at
                records.append(features)
                logger.debug(f"Extracted features for farmer {farmer.id}")
            except Exception as e:
                logger.warning(f"Could not extract features for farmer {farmer.id}: {e}")
                continue
        
        if not records:
            raise ValueError("No training data could be extracted. Ensure farmers exist in database.")
        
        df = pd.DataFrame(records)
        X = df[self.FEATURE_NAMES].values
        
        logger.info(f"Loaded {len(df)} farmer records")
        logger.info(f"Feature matrix shape: {X.shape}")
        
        return X, df
    
    def train(self, X: np.ndarray) -> Tuple[IsolationForest, StandardScaler]:
        """
        Train IsolationForest model on feature matrix.
        
        Args:
            X: Feature matrix of shape (n_samples, 7)
            
        Returns:
            Tuple of (fitted model, fitted scaler)
        """
        logger.info(f"Training Isolation Forest on {X.shape[0]} samples...")
        
        # Standardize features
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model = IsolationForest(**self.MODEL_CONFIG, n_jobs=-1)
        self.model.fit(X_scaled)
        
        # Get predictions and scores
        predictions = self.model.predict(X_scaled)
        scores = self.model.score_samples(X_scaled)
        
        n_anomalies = (predictions == -1).sum()
        n_normal = (predictions == 1).sum()
        
        logger.info(f"Training complete:")
        logger.info(f"  Normal: {n_normal} ({n_normal/len(predictions)*100:.2f}%)")
        logger.info(f"  Anomalies: {n_anomalies} ({n_anomalies/len(predictions)*100:.2f}%)")
        logger.info(f"  Score range: [{scores.min():.4f}, {scores.max():.4f}]")
        
        return self.model, self.scaler
    
    def save_artifacts(self) -> Dict[str, str]:
        """
        Save trained model, scaler, and metadata to disk.
        
        Returns:
            Dictionary with paths to saved files
        """
        if self.model is None or self.scaler is None:
            raise ValueError("Model not trained yet. Call train() first.")
        
        logger.info(f"Saving artifacts to {self.output_dir}...")
        
        # Save model
        model_path = self.output_dir / 'fraud_detector_model.joblib'
        joblib.dump(self.model, model_path)
        logger.info(f"  Model: {model_path}")
        
        # Save scaler
        scaler_path = self.output_dir / 'fraud_detector_scaler.joblib'
        joblib.dump(self.scaler, scaler_path)
        logger.info(f"  Scaler: {scaler_path}")
        
        # Save metadata
        metadata = {
            'timestamp': datetime.now().isoformat(),
            'model_type': 'IsolationForest',
            'features': self.FEATURE_NAMES,
            'feature_count': len(self.FEATURE_NAMES),
            'config': self.MODEL_CONFIG,
            'model_path': str(model_path),
            'scaler_path': str(scaler_path),
        }
        
        metadata_path = self.output_dir / 'fraud_detector_metadata.json'
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        logger.info(f"  Metadata: {metadata_path}")
        
        return {
            'model': str(model_path),
            'scaler': str(scaler_path),
            'metadata': str(metadata_path),
        }
    
    def get_statistics(self, X: np.ndarray, predictions: np.ndarray) -> Dict:
        """
        Calculate training statistics.
        
        Args:
            X: Feature matrix
            predictions: Model predictions
            
        Returns:
            Statistics dictionary
        """
        scores = self.model.score_samples(X)
        
        stats = {
            'total_samples': len(predictions),
            'anomalies': int((predictions == -1).sum()),
            'normal': int((predictions == 1).sum()),
            'contamination_ratio': float((predictions == -1).sum() / len(predictions)),
            'anomaly_score_stats': {
                'min': float(scores.min()),
                'max': float(scores.max()),
                'mean': float(scores.mean()),
                'median': float(np.median(scores)),
                'std': float(scores.std()),
            },
            'feature_stats': {}
        }
        
        for i, feature_name in enumerate(self.FEATURE_NAMES):
            stats['feature_stats'][feature_name] = {
                'mean': float(X[:, i].mean()),
                'std': float(X[:, i].std()),
                'min': float(X[:, i].min()),
                'max': float(X[:, i].max()),
            }
        
        return stats


def train_fraud_model(farmer_ids: Optional[list] = None, 
                     save: bool = True,
                     output_dir: str = 'ml/models') -> Tuple:
    """
    Main entry point for model training.
    
    Args:
        farmer_ids: Optional list of farmer IDs to train on. If None, uses all.
        save: Whether to save artifacts to disk
        output_dir: Directory to save model and scaler
        
    Returns:
        Tuple of (model, scaler, statistics dictionary)
    """
    logger.info("Starting fraud detection model training...")
    
    trainer = FraudModelTrainer(output_dir=output_dir)
    
    # Load data
    X, df = trainer.load_training_data(farmer_ids=farmer_ids)
    
    # Train model
    model, scaler = trainer.train(X)
    
    # Get statistics
    predictions = model.predict(scaler.transform(X))
    stats = trainer.get_statistics(X, predictions)
    
    logger.info(f"\nTraining Statistics:")
    logger.info(f"  Total: {stats['total_samples']}")
    logger.info(f"  Anomalies: {stats['anomalies']} ({stats['contamination_ratio']*100:.2f}%)")
    
    # Save artifacts
    if save:
        artifacts = trainer.save_artifacts()
        logger.info(f"\nArtifacts saved successfully")
    
    return model, scaler, stats


if __name__ == '__main__':
    # Requires Django setup
    import django
    import os
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    django.setup()
    
    model, scaler, stats = train_fraud_model(save=True)
