"""Fraud detection async tasks (Celery)."""

from celery import shared_task
from django.utils import timezone
import logging
import numpy as np
from datetime import datetime

logger = logging.getLogger(__name__)

# DEPENDS ON: apps.farmers.models.Farmer
# DEPENDS ON: ml.features.extractor.extract_farmer_features_array
# DEPENDS ON: ml.models.fraud_detector_model.joblib


@shared_task(bind=True, max_retries=3)
def score_farmer_async(self, farmer_id: int):
    """
    Async task: Score a single farmer using ML model.
    
    Runs when triggered manually or as part of nightly batch.
    Creates/updates FraudScore record.
    Routes flagged farmers to manual review queue.
    
    Args:
        farmer_id: Primary key of farmer to score
        
    Returns:
        Dictionary with scoring result
    """
    from apps.farmers.models import Farmer
    from ml.features.extractor import extract_farmer_features_array
    from .models import FraudScore, FraudReviewQueue
    import joblib
    from pathlib import Path
    
    try:
        farmer = Farmer.objects.get(pk=farmer_id)
    except Farmer.DoesNotExist:
        logger.error(f"Farmer {farmer_id} not found")
        return {'status': 'error', 'message': f'Farmer {farmer_id} not found'}
    
    try:
        # Load model and scaler
        model_path = Path('ml/models/fraud_model.joblib')
        scaler_path = Path('ml/models/fraud_detector_scaler.joblib')
        if model_path.exists():
            model = joblib.load(model_path)
            scaler = None
        else:
            model_path = Path('ml/models/fraud_detector_model.joblib')
            if not model_path.exists() or not scaler_path.exists():
                logger.error("Fraud model artifacts not found. Train model first.")
                return {'status': 'error', 'message': 'Model artifacts not found'}
            model = joblib.load(model_path)
            scaler = joblib.load(scaler_path)
        
        # Extract features
        X = extract_farmer_features_array(farmer_id).reshape(1, -1)
        
        # Score
        scored_input = scaler.transform(X) if scaler is not None else X
        prediction = model.predict(scored_input)[0]
        anomaly_score = model.score_samples(scored_input)[0]
        
        # Determine if flagged
        is_flagged = (prediction == -1)
        confidence = 1.0 if is_flagged else 0.0
        
        # Get feature snapshot
        from ml.features.extractor import FraudFeatureExtractor
        extractor = FraudFeatureExtractor(farmer_id)
        feature_dict = extractor.extract_features()
        
        # Create/update FraudScore
        score_obj, created = FraudScore.objects.update_or_create(
            farmer=farmer,
            defaults={
                'anomaly_score': float(anomaly_score),
                'is_flagged': is_flagged,
                'confidence': confidence,
                'feature_snapshot': feature_dict,
                'model_version': '1.0',
            }
        )
        
        logger.info(f"Scored farmer {farmer_id}: {'FLAGGED' if is_flagged else 'NORMAL'} (score={anomaly_score:.4f})")
        
        # Route to review queue if flagged
        if is_flagged:
            queue_entry, _ = FraudReviewQueue.objects.get_or_create(
                farmer=farmer,
                fraud_score=score_obj,
                defaults={'status': 'PENDING', 'priority': 1}
            )
            logger.info(f"Added farmer {farmer_id} to review queue")
        
        return {
            'status': 'success',
            'farmer_id': farmer_id,
            'is_flagged': is_flagged,
            'anomaly_score': float(anomaly_score),
            'score_id': str(score_obj.id)
        }
        
    except Exception as exc:
        logger.exception(f"Error scoring farmer {farmer_id}: {exc}")
        raise self.retry(exc=exc, countdown=60)


@shared_task
def score_all_farmers_batch():
    """
    Nightly batch task: Score all farmers in database.
    
    Registered in config/celery.py CELERY_BEAT_SCHEDULE to run at 02:00 CAT.
    
    For large farmer bases, this should be split into subtasks.
    """
    from apps.farmers.models import Farmer
    import logging
    
    logger.info("Starting nightly farmer fraud scoring batch...")
    
    farmers = Farmer.objects.all().values_list('id', flat=True)
    total = farmers.count()
    
    logger.info(f"Scoring {total} farmers...")
    
    # Queue individual scoring tasks
    for farmer_id in farmers:
        score_farmer_async.delay(farmer_id)
    
    logger.info(f"Queued {total} scoring tasks")
    
    return {'status': 'success', 'total_queued': total, 'timestamp': timezone.now().isoformat()}
