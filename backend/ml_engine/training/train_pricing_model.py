import os
import joblib
import numpy as np
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score

BASE_DIR = Path(__file__).resolve().parent.parent
ARTIFACT_PATH = BASE_DIR / "artifacts" / "fair_rental_price_model.joblib"


def generate_synthetic_campus_dataset(n_samples: int = 1500, random_seed: int = 42):
    """
    Generates realistic campus rental pricing dataset for training regression models.
    Reflects student economy, asset depreciation, equipment categories, and item wear.
    """
    np.random.seed(random_seed)

    categories = [
        "academic", "electronics", "laboratory", "project-equipment",
        "daily-essentials", "creative-media", "sports-fitness", "other"
    ]
    conditions = ["BRAND_NEW", "LIKE_NEW", "GOOD", "FAIR"]

    category_rate_multipliers = {
        "academic": 0.022,          # Textbooks, drafters, calculators (shorter bursts, ~2.2% of MSRP)
        "electronics": 0.012,       # Laptops, monitors, Arduino, Raspberry Pi (~1.2% of MSRP)
        "laboratory": 0.010,        # Multimeters, oscilloscopes, sensors (~1.0% of MSRP)
        "project-equipment": 0.015, # Power drills, saws, socket sets (~1.5% of MSRP)
        "daily-essentials": 0.020,  # Study tables, bed trays, lamps (~2.0% of MSRP)
        "creative-media": 0.011,    # DSLR cameras, gimbals, microphones (~1.1% of MSRP)
        "sports-fitness": 0.018,    # Badminton sets, dumbbells, cricket gear (~1.8% of MSRP)
        "other": 0.014
    }

    condition_multipliers = {
        "BRAND_NEW": 1.05,
        "LIKE_NEW": 0.95,
        "GOOD": 0.80,
        "FAIR": 0.65
    }

    cat_choices = np.random.choice(categories, size=n_samples)
    cond_choices = np.random.choice(conditions, size=n_samples, p=[0.15, 0.35, 0.35, 0.15])
    orig_prices = np.random.exponential(scale=5000, size=n_samples) + 200
    orig_prices = np.clip(orig_prices, 200, 85000)
    ages = np.random.randint(0, 48, size=n_samples)

    daily_prices = []
    for c, cond, p, age in zip(cat_choices, cond_choices, orig_prices, ages):
        base_rate = p * category_rate_multipliers[c]
        cond_rate = base_rate * condition_multipliers[cond]
        # Age depreciation curve: slight decay up to 48 months
        age_decay = max(0.60, 1.0 - (age * 0.008))
        price = cond_rate * age_decay
        # Campus minimum price floor ₹10, capped at realistic student day rate
        price = max(10.0, round(float(price) + np.random.normal(0, 3), 2))
        daily_prices.append(price)

    return cat_choices, cond_choices, orig_prices, ages, np.array(daily_prices)


def train_and_export_model():
    print("Generating campus rental dataset for training...")
    cat_data, cond_data, price_data, age_data, y = generate_synthetic_campus_dataset()

    X = np.column_stack([cat_data, cond_data, price_data.astype(float), age_data.astype(float)])

    # Split train/test (80/20)
    indices = np.arange(len(y))
    np.random.shuffle(indices)
    split = int(0.8 * len(y))
    train_idx, test_idx = indices[:split], indices[split:]

    X_train, X_test = X[train_idx], X[test_idx]
    y_train, y_test = y[train_idx], y[test_idx]

    # Preprocessing
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), [0, 1]),
            ('num', StandardScaler(), [2, 3])
        ]
    )

    # 1. Baseline Ridge Regressor
    ridge_pipeline = Pipeline([
        ('prep', preprocessor),
        ('reg', Ridge(alpha=1.0))
    ])
    ridge_pipeline.fit(X_train, y_train)
    y_pred_ridge = ridge_pipeline.predict(X_test)
    r2_ridge = r2_score(y_test, y_pred_ridge)
    mae_ridge = mean_absolute_error(y_test, y_pred_ridge)
    print(f"Baseline Ridge: MAE=₹{mae_ridge:.2f}, R²={r2_ridge:.4f}")

    # 2. Random Forest Regressor
    rf_pipeline = Pipeline([
        ('prep', preprocessor),
        ('reg', RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42))
    ])
    rf_pipeline.fit(X_train, y_train)
    y_pred_rf = rf_pipeline.predict(X_test)
    r2_rf = r2_score(y_test, y_pred_rf)
    mae_rf = mean_absolute_error(y_test, y_pred_rf)
    rmse_rf = root_mean_squared_error(y_test, y_pred_rf)
    print(f"Random Forest Regressor: MAE=₹{mae_rf:.2f}, RMSE=₹{rmse_rf:.2f}, R²={r2_rf:.4f}")

    # Choose best performing model
    best_pipeline = rf_pipeline if r2_rf >= r2_ridge else ridge_pipeline

    ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(best_pipeline, ARTIFACT_PATH)
    print(f"Model exported successfully to {ARTIFACT_PATH}")
    return best_pipeline


if __name__ == "__main__":
    train_and_export_model()

