import os
import joblib
import numpy as np
from decimal import Decimal
from pathlib import Path
from typing import Dict, Any, List

MODEL_PATH = Path(__file__).resolve().parent.parent / "artifacts" / "fair_rental_price_model.joblib"
MODEL_VERSION = "v1.2.0"

_loaded_model = None


def get_model():
    global _loaded_model
    if _loaded_model is None and MODEL_PATH.exists():
        try:
            _loaded_model = joblib.load(MODEL_PATH)
        except Exception:
            _loaded_model = None
    return _loaded_model


def fallback_price_calculation(
    category_slug: str,
    orig_price: float,
    condition: str,
    age_months: int
) -> float:
    """
    Deterministic rule-based fallback when ML pipeline artifact is unavailable.
    """
    category_multipliers = {
        "academic": 0.022,
        "electronics": 0.012,
        "laboratory": 0.010,
        "project-equipment": 0.015,
        "daily-essentials": 0.020,
        "creative-media": 0.011,
        "sports-fitness": 0.018,
        "other": 0.014
    }

    condition_multipliers = {
        "BRAND_NEW": 1.05,
        "LIKE_NEW": 0.95,
        "GOOD": 0.80,
        "FAIR": 0.65
    }

    cat_slug = str(category_slug).lower().strip()
    rate = category_multipliers.get(cat_slug, 0.014)
    cond_factor = condition_multipliers.get(str(condition).upper().strip(), 0.80)
    age_decay = max(0.60, 1.0 - (max(0, age_months) * 0.008))

    pred = orig_price * rate * cond_factor * age_decay
    return max(10.0, round(float(pred), 2))


def predict_fair_rental_price(
    category: str,
    original_price: Any,
    condition: str,
    item_age_months: int = 0,
    requested_duration_days: int = 1
) -> Dict[str, Any]:
    """
    Predicts intelligent, fair daily campus rental price based on equipment specs,
    condition grade, historical student rental trends, and asset age.
    """
    # Validation & normalization
    try:
        orig_price_float = float(original_price)
        if orig_price_float <= 0:
            raise ValueError("Original purchase price must be greater than zero.")
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Invalid original purchase price: {exc}")

    try:
        age_int = max(0, int(item_age_months))
    except (TypeError, ValueError):
        age_int = 0

    norm_category = str(category).lower().strip()
    norm_condition = str(condition).upper().strip()
    valid_conditions = ["BRAND_NEW", "LIKE_NEW", "GOOD", "FAIR"]
    if norm_condition not in valid_conditions:
        norm_condition = "GOOD"

    model = get_model()
    factors: List[str] = [
        f"Original purchase price of ₹{orig_price_float:,.2f}",
        f"Item condition assessed as {norm_condition.replace('_', ' ').title()}",
    ]

    predicted_float: float = 0.0

    if model is not None:
        try:
            X_input = np.array([[norm_category, norm_condition, orig_price_float, float(age_int)]])
            pred_raw = model.predict(X_input)[0]
            predicted_float = max(10.0, round(float(pred_raw), 2))
            factors.append("Campus regression model trained on verified equipment rentals")
        except Exception:
            predicted_float = fallback_price_calculation(norm_category, orig_price_float, norm_condition, age_int)
            factors.append("Heuristic pricing rule-based engine")
    else:
        predicted_float = fallback_price_calculation(norm_category, orig_price_float, norm_condition, age_int)
        factors.append("Campus asset depreciation rate")

    if age_int > 0:
        factors.append(f"{age_int} months of equipment usage applied to rate")

    # Recommended price boundaries: -15% to +15%
    rec_min = max(10.0, round(predicted_float * 0.85, 2))
    rec_max = max(rec_min + 5.0, round(predicted_float * 1.15, 2))

    return {
        "predicted_price": f"{predicted_float:.2f}",
        "recommended_min": f"{rec_min:.2f}",
        "recommended_max": f"{rec_max:.2f}",
        "currency": "INR",
        "period": "per_day",
        "factors": factors,
        "model_version": MODEL_VERSION
    }

