import joblib
import numpy as np
from pathlib import Path
from sklearn.ensemble import IsolationForest

from ml.features.feature_extractor import extract_farmer_features_array


def train_isolation_forest_model(farmer_queryset):
    feature_rows = [extract_farmer_features_array(f.id) for f in farmer_queryset]
    X = np.array(feature_rows)
    model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    model.fit(X)
    output_path = Path("ml/models/fraud_model.joblib")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, output_path)
    return model, str(output_path)
