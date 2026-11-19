import os
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
from sklearn.model_selection import train_test_split, KFold, cross_val_score
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score
from xgboost import XGBRegressor

from ml_engine.datasets.generate_dataset import load_dataset, DATASET_CSV

BASE_DIR = Path(__file__).resolve().parent.parent
ARTIFACTS_DIR = BASE_DIR / "artifacts"
PRIMARY_ARTIFACT_PATH = ARTIFACTS_DIR / "pricing_model.joblib"
LEGACY_ARTIFACT_PATH = ARTIFACTS_DIR / "fair_rental_price_model.joblib"
METADATA_PATH = ARTIFACTS_DIR / "pricing_model_metadata.json"

CATEGORICAL_FEATURES = ["category", "condition", "item_brand_tier"]
NUMERICAL_FEATURES = [
    "original_retail_price",
    "age_in_months",
    "campus_demand_score",
    "rental_duration_days"
]
ALL_FEATURES = CATEGORICAL_FEATURES + NUMERICAL_FEATURES
TARGET = "fair_rental_price_per_day"


def build_preprocessor() -> ColumnTransformer:
    """
    Constructs the ColumnTransformer for one-hot encoding categoricals and scaling numericals.
    """
    return ColumnTransformer(
        transformers=[
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL_FEATURES
            ),
            (
                "num",
                StandardScaler(),
                NUMERICAL_FEATURES
            )
        ]
    )


def train_and_evaluate_models():
    """
    Trains, compares, and evaluates Baseline (Linear Regression), Random Forest, and XGBoost models.
    Selects the winning model, verifies Target metrics (RMSE < 5.0, R² > 0.92),
    and exports the winning pipeline to artifacts.
    """
    print("=" * 70)
    print("PHASE 10: AI FAIR PRICE PREDICTION ENGINE — MODEL TRAINING PIPELINE")
    print("=" * 70)

    df = load_dataset()
    print(f"Loaded dataset: {len(df)} records across {len(df.columns)} columns.")

    X = df[ALL_FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )
    print(f"Dataset split: Train={len(X_train)} samples, Test={len(X_test)} samples.\n")

    # Candidate Models
    candidates = {
        "Linear Regression (Baseline)": Pipeline([
            ("prep", build_preprocessor()),
            ("model", LinearRegression())
        ]),
        "Random Forest Regressor": Pipeline([
            ("prep", build_preprocessor()),
            ("model", RandomForestRegressor(
                n_estimators=150,
                max_depth=14,
                min_samples_split=4,
                random_state=42,
                n_jobs=-1
            ))
        ]),
        "XGBoost Regressor (Gradient Boosting)": Pipeline([
            ("prep", build_preprocessor()),
            ("model", XGBRegressor(
                n_estimators=250,
                max_depth=6,
                learning_rate=0.05,
                subsample=0.88,
                colsample_bytree=0.88,
                random_state=42,
                n_jobs=-1
            ))
        ])
    }

    results = {}
    best_name = None
    best_pipeline = None
    best_r2 = -float("inf")
    best_rmse = float("inf")

    cv = KFold(n_splits=5, shuffle=True, random_state=42)

    for name, pipeline in candidates.items():
        print(f"Evaluating {name}...")

        # 5-Fold Cross Validation on Train Split
        cv_scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring="r2", n_jobs=-1)
        mean_cv_r2 = float(np.mean(cv_scores))

        # Train on full train split
        pipeline.fit(X_train, y_train)

        # Predict on Test Split
        y_pred = pipeline.predict(X_test)

        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(root_mean_squared_error(y_test, y_pred))
        r2 = float(r2_score(y_test, y_pred))

        results[name] = {
            "cv_r2_mean": round(mean_cv_r2, 4),
            "test_mae": round(mae, 4),
            "test_rmse": round(rmse, 4),
            "test_r2": round(r2, 4)
        }

        print(f"   CV R² Mean: {mean_cv_r2:.4f}")
        print(f"   Test MAE:   ₹{mae:.2f}")
        print(f"   Test RMSE:  ₹{rmse:.2f}")
        print(f"   Test R²:    {r2:.4f}\n")

        # Select model with highest R² and lowest RMSE
        if r2 > best_r2:
            best_r2 = r2
            best_rmse = rmse
            best_name = name
            best_pipeline = pipeline

    print("-" * 70)
    print(f"WINNING MODEL: {best_name}")
    print(f"Winning Metrics -> Test R²: {best_r2:.4f} (Target > 0.92), Test RMSE: ₹{best_rmse:.2f} (Target < 5.0)")
    print("-" * 70)

    # Export model artifact
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(best_pipeline, PRIMARY_ARTIFACT_PATH)
    joblib.dump(best_pipeline, LEGACY_ARTIFACT_PATH)
    print(f"Model exported to {PRIMARY_ARTIFACT_PATH}")
    print(f"Backward-compatible link exported to {LEGACY_ARTIFACT_PATH}")

    metadata = {
        "winning_model": best_name,
        "features": {
            "categorical": CATEGORICAL_FEATURES,
            "numerical": NUMERICAL_FEATURES,
            "all": ALL_FEATURES
        },
        "target": TARGET,
        "metrics": results[best_name],
        "all_model_comparisons": results,
        "test_sample_count": len(X_test),
        "train_sample_count": len(X_train),
        "definition_of_done": {
            "r2_exceeds_target": bool(best_r2 > 0.92),
            "rmse_below_target": bool(best_rmse < 5.0)
        }
    }

    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Metadata exported to {METADATA_PATH}")

    return best_pipeline, metadata


if __name__ == "__main__":
    train_and_evaluate_models()
