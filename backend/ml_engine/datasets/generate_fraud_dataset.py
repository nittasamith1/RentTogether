"""
Dataset Generator for Campus Fraud & Anomaly Risk Detection (Phase 12).
Synthesizes baseline peer-to-peer campus rental activities and realistic fraud patterns.
"""

import os
from pathlib import Path
import numpy as np
import pandas as pd

DATASETS_DIR = Path(__file__).resolve().parent
FRAUD_DATASET_CSV = DATASETS_DIR / "campus_fraud_dataset.csv"

FEATURE_COLUMNS = [
    "price_deviation_ratio",
    "creation_velocity",
    "cancellation_ratio",
    "account_age_days",
    "user_report_count",
    "duplicate_image_hash_distance",
]


def generate_fraud_dataset(n_samples: int = 4000, anomaly_ratio: float = 0.06, random_state: int = 42) -> pd.DataFrame:
    """
    Generates a realistic feature dataset with benign campus listings (94%)
    and anomalous behavior patterns (6%).
    """
    np.random.seed(random_state)
    n_anomalies = int(n_samples * anomaly_ratio)
    n_normal = n_samples - n_anomalies

    # 1. Benign / Safe Campus Listings
    normal_price_dev = np.clip(np.random.gamma(shape=1.5, scale=0.15, size=n_normal), 0.0, 0.65)
    normal_velocity = np.random.choice([0, 1, 2], size=n_normal, p=[0.70, 0.24, 0.06])
    normal_cancellation = np.clip(np.random.beta(a=0.5, b=6.0, size=n_normal), 0.0, 0.25)
    normal_account_age = np.clip(np.random.normal(loc=120, scale=80, size=n_normal), 5, 730)
    normal_reports = np.random.choice([0, 1], size=n_normal, p=[0.96, 0.04])
    normal_hash_dist = np.clip(np.random.normal(loc=38, scale=10, size=n_normal), 15, 64)

    df_normal = pd.DataFrame({
        "price_deviation_ratio": normal_price_dev,
        "creation_velocity": normal_velocity,
        "cancellation_ratio": normal_cancellation,
        "account_age_days": normal_account_age,
        "user_report_count": normal_reports,
        "duplicate_image_hash_distance": normal_hash_dist,
        "is_anomaly": 0
    })

    # 2. Anomalous / Suspicious Patterns
    # Subtype A: Massive Price Gouging (e.g. ₹5,000 for a calculator)
    nA = n_anomalies // 3
    dev_A = np.random.uniform(2.5, 50.0, size=nA)
    vel_A = np.random.choice([0, 1, 3], size=nA)
    canc_A = np.random.uniform(0.0, 0.3, size=nA)
    age_A = np.random.uniform(1, 90, size=nA)
    rep_A = np.random.choice([0, 1], size=nA)
    hash_A = np.random.uniform(20, 60, size=nA)

    # Subtype B: Rapid Spammer / Account Velocity Burst
    nB = n_anomalies // 3
    dev_B = np.random.uniform(0.1, 1.2, size=nB)
    vel_B = np.random.randint(5, 20, size=nB)
    canc_B = np.random.uniform(0.1, 0.4, size=nB)
    age_B = np.random.uniform(0, 5, size=nB) # Fresh 0-5 day old account
    rep_B = np.random.choice([0, 1, 2], size=nB)
    hash_B = np.random.uniform(18, 55, size=nB)

    # Subtype C: Serial Scammer / Duplicate Photos & Prior Disputes
    nC = n_anomalies - nA - nB
    dev_C = np.random.uniform(0.5, 3.0, size=nC)
    vel_C = np.random.choice([1, 2, 4], size=nC)
    canc_C = np.random.uniform(0.5, 1.0, size=nC) # Extreme cancellations
    age_C = np.random.uniform(1, 40, size=nC)
    rep_C = np.random.randint(2, 8, size=nC) # Multiple user reports
    hash_C = np.random.uniform(0, 6, size=nC) # Duplicate image hash

    df_anomalies = pd.DataFrame({
        "price_deviation_ratio": np.concatenate([dev_A, dev_B, dev_C]),
        "creation_velocity": np.concatenate([vel_A, vel_B, vel_C]),
        "cancellation_ratio": np.concatenate([canc_A, canc_B, canc_C]),
        "account_age_days": np.concatenate([age_A, age_B, age_C]),
        "user_report_count": np.concatenate([rep_A, rep_B, rep_C]),
        "duplicate_image_hash_distance": np.concatenate([hash_A, hash_B, hash_C]),
        "is_anomaly": 1
    })

    df = pd.concat([df_normal, df_anomalies], ignore_index=True)
    df = df.sample(frac=1.0, random_state=random_state).reset_index(drop=True)

    DATASETS_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(FRAUD_DATASET_CSV, index=False)
    return df


if __name__ == "__main__":
    df = generate_fraud_dataset()
    print(f"Generated fraud dataset with {len(df)} samples ({df['is_anomaly'].sum()} anomalies). Saved to {FRAUD_DATASET_CSV}")

