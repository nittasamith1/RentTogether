"""
Isolation Forest Fraud & Anomaly Risk Detection Training Pipeline (Phase 12).
Trains an unsupervised Isolation Forest model to detect suspicious campus rental activities,
price gouging, duplicate listings, and spam accounts.
Exports calibrated model pipeline to backend/ml_engine/artifacts/fraud_isolation_forest.joblib.
"""

import sys
import json
from pathlib import Path

# Add backend directory to sys.path
BASE_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_BACKEND_DIR))

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import RobustScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, roc_auc_score, f1_score

from ml_engine.datasets.generate_fraud_dataset import (
    generate_fraud_dataset,
    FRAUD_DATASET_CSV,
    FEATURE_COLUMNS,
)

BASE_DIR = Path(__file__).resolve().parent.parent
ARTIFACTS_DIR = BASE_DIR / "artifacts"
MODEL_ARTIFACT_PATH = ARTIFACTS_DIR / "fraud_isolation_forest.joblib"
METADATA_PATH = ARTIFACTS_DIR / "fraud_model_metadata.json"


class CalibratedIsolationForest:
    """
    Wrapper around IsolationForest that transforms raw decision_function scores
    into an intuitive 0-100 Campus Risk Score:
      - 0 - 39: Low Risk (Safe / Auto-approved)
      - 40 - 74: Medium Risk (Flagged for monitoring)
      - 75 - 100: High Risk (Hidden & pushed to Admin Review Queue)
    """

    def __init__(self, scaler=None, model=None, min_dec=-0.35, max_dec=0.18):
        self.scaler = scaler or RobustScaler()
        self.model = model or IsolationForest(
            n_estimators=150,
            contamination=0.06,
            max_samples="auto",
            random_state=42,
            n_jobs=-1,
        )
        self.min_dec = min_dec
        self.max_dec = max_dec

    def fit(self, X: pd.DataFrame):
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled)
        dec = self.model.decision_function(X_scaled)
        # Calibrate boundaries using empirical 1st and 99th percentiles
        self.min_dec = float(np.percentile(dec, 1))
        self.max_dec = float(np.percentile(dec, 98))
        return self

    def score_risk(self, X: pd.DataFrame) -> np.ndarray:
        """
        Returns normalized risk scores from 0 (safest) to 100 (highest anomaly).
        """
        X_scaled = self.scaler.transform(X)
        dec = self.model.decision_function(X_scaled)

        # Invert: low decision function -> high risk
        # Clip to min_dec, max_dec bounds
        clipped_dec = np.clip(dec, self.min_dec, self.max_dec)
        raw_risk = (self.max_dec - clipped_dec) / (self.max_dec - self.min_dec)

        # Scale non-linearly to map typical benign to 0-35 and anomalies to 75-100
        risk_scores = np.power(raw_risk, 1.2) * 100.0

        # Heuristic signal safety boosts for extreme edge-case violations
        # e.g. severe price gouging (price deviation > 3.0), velocity spam >= 5
        adjusted_scores = []
        for i in range(len(X)):
            score = float(risk_scores[i])
            row = X.iloc[i]
            # Extreme price deviation guarantee: e.g. ₹5,000 calculator vs ₹25 base
            if row.get("price_deviation_ratio", 0) >= 3.0:
                score = max(score, 78.0 + min(20.0, float(row["price_deviation_ratio"]) * 1.5))
            # Rapid flood creation velocity
            if row.get("creation_velocity", 0) >= 5:
                score = max(score, 76.0)
            # Duplicate scraped image with high cancellation
            if row.get("duplicate_image_hash_distance", 64) <= 3 and row.get("cancellation_ratio", 0) > 0.3:
                score = max(score, 80.0)

            adjusted_scores.append(int(np.clip(round(score), 0, 100)))

        return np.array(adjusted_scores)


def train_and_export_fraud_model():
    """
    Trains the Isolation Forest model and exports the artifact.
    """
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    print("Generating training dataset...")
    df = generate_fraud_dataset(n_samples=5000, anomaly_ratio=0.06, random_state=42)
    X = df[FEATURE_COLUMNS]
    y_true = df["is_anomaly"]

    print("Training Calibrated Isolation Forest...")
    pipeline = CalibratedIsolationForest()
    pipeline.fit(X)

    # Evaluate on the dataset
    predicted_risk = pipeline.score_risk(X)
    pred_binary = (predicted_risk >= 75).astype(int)

    f1 = f1_score(y_true, pred_binary)
    auc = roc_auc_score(y_true, predicted_risk)

    print(f"Evaluation Metrics:")
    print(f"  F1 Score: {f1:.4f}")
    print(f"  ROC-AUC:  {auc:.4f}")
    print("\nClassification Report (High Risk >= 75 as Anomaly):")
    print(classification_report(y_true, pred_binary, target_names=["Safe", "Anomalous"]))

    # Test Sanity Checks
    print("Testing Sanity Scenarios:")
    # Normal item
    normal_case = pd.DataFrame([{
        "price_deviation_ratio": 0.10,
        "creation_velocity": 0,
        "cancellation_ratio": 0.0,
        "account_age_days": 180,
        "user_report_count": 0,
        "duplicate_image_hash_distance": 45,
    }])
    normal_score = pipeline.score_risk(normal_case)[0]
    print(f"  Normal Case Risk Score: {normal_score} (Expected < 40)")

    # Price Gouging: ₹5,000 calculator vs ₹25 base -> deviation = 199.0
    gouging_case = pd.DataFrame([{
        "price_deviation_ratio": 199.0,
        "creation_velocity": 0,
        "cancellation_ratio": 0.0,
        "account_age_days": 60,
        "user_report_count": 0,
        "duplicate_image_hash_distance": 40,
    }])
    gouging_score = pipeline.score_risk(gouging_case)[0]
    print(f"  Price Gouging Risk Score: {gouging_score} (Expected >= 75)")

    # Velocity Spammer
    spammer_case = pd.DataFrame([{
        "price_deviation_ratio": 0.20,
        "creation_velocity": 8,
        "cancellation_ratio": 0.1,
        "account_age_days": 1,
        "user_report_count": 0,
        "duplicate_image_hash_distance": 35,
    }])
    spammer_score = pipeline.score_risk(spammer_case)[0]
    print(f"  Velocity Spammer Risk Score: {spammer_score} (Expected >= 75)")

    assert normal_score < 40, f"Normal case failed: score={normal_score}"
    assert gouging_score >= 75, f"Gouging case failed: score={gouging_score}"
    assert spammer_score >= 75, f"Spammer case failed: score={spammer_score}"

    # Export Model Artifact
    joblib.dump(pipeline, MODEL_ARTIFACT_PATH)
    print(f"\nModel exported successfully to: {MODEL_ARTIFACT_PATH}")

    # Export Metadata
    metadata = {
        "model_type": "IsolationForest",
        "contamination": 0.06,
        "n_estimators": 150,
        "feature_columns": FEATURE_COLUMNS,
        "risk_thresholds": {
            "low_risk": [0, 39],
            "medium_risk": [40, 74],
            "high_risk": [75, 100],
        },
        "evaluation_metrics": {
            "f1_score": round(float(f1), 4),
            "roc_auc": round(float(auc), 4),
        },
        "artifact_file": MODEL_ARTIFACT_PATH.name,
    }
    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Metadata exported to: {METADATA_PATH}")


if __name__ == "__main__":
    train_and_export_fraud_model()

