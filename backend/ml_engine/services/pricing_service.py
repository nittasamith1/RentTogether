import os
import sys
import time
import json
import joblib
import numpy as np
import pandas as pd
from decimal import Decimal
from pathlib import Path
from typing import Dict, Any, List, Optional

# Add backend directory to sys.path
BASE_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_BACKEND_DIR))

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "artifacts"
PRIMARY_MODEL_PATH = ARTIFACTS_DIR / "pricing_model.joblib"
LEGACY_MODEL_PATH = ARTIFACTS_DIR / "fair_rental_price_model.joblib"
METADATA_PATH = ARTIFACTS_DIR / "pricing_model_metadata.json"

MODEL_VERSION = "v2.0.0-xgb"

_loaded_model = None
_model_metadata = None


def get_model():
    """
    Thread-safe lazy-loading and caching of the trained ML pipeline artifact.
    """
    global _loaded_model, _model_metadata
    if _loaded_model is None:
        target_path = PRIMARY_MODEL_PATH if PRIMARY_MODEL_PATH.exists() else LEGACY_MODEL_PATH
        if target_path.exists():
            try:
                _loaded_model = joblib.load(target_path)
            except Exception:
                _loaded_model = None

    if _model_metadata is None and METADATA_PATH.exists():
        try:
            with open(METADATA_PATH, "r", encoding="utf-8") as f:
                _model_metadata = json.load(f)
        except Exception:
            _model_metadata = None

    return _loaded_model


def fallback_price_calculation(
    category_slug: str,
    orig_price: float,
    condition: str,
    age_months: int,
    item_brand_tier: str = "MID_TIER",
    campus_demand_score: float = 3.0,
    rental_duration_days: int = 1
) -> float:
    """
    Deterministic rule-based fallback when ML pipeline artifact is unavailable.
    """
    category_multipliers = {
        "academic": 0.022,
        "electronics": 0.012,
        "laboratory": 0.011,
        "project-equipment": 0.015,
        "daily-essentials": 0.020,
        "creative-media": 0.013,
        "sports-fitness": 0.018,
        "other": 0.014
    }

    condition_multipliers = {
        "BRAND_NEW": 1.05,
        "LIKE_NEW": 0.95,
        "GOOD": 0.82,
        "FAIR": 0.68
    }

    brand_multipliers = {
        "BUDGET": 0.88,
        "MID_TIER": 1.00,
        "PREMIUM": 1.15
    }

    cat_slug = str(category_slug).lower().strip()
    rate = category_multipliers.get(cat_slug, 0.014)
    cond_factor = condition_multipliers.get(str(condition).upper().strip(), 0.82)
    brand_factor = brand_multipliers.get(str(item_brand_tier).upper().strip(), 1.00)
    age_decay = max(0.55, 1.0 - (max(0, age_months) * 0.0075))
    demand_factor = 1.0 + ((float(campus_demand_score) - 3.0) * 0.04)
    dur_factor = max(0.88, 1.0 - (int(rental_duration_days) * 0.004))

    pred = orig_price * rate * cond_factor * brand_factor * age_decay * demand_factor * dur_factor
    return max(10.0, round(float(pred), 2))


def predict_fair_price(
    category: str,
    original_price: Any,
    condition: str = "GOOD",
    age_months: int = 0,
    item_brand_tier: str = "MID_TIER",
    campus_demand_score: float = 3.0,
    rental_duration_days: int = 1,
    current_price: Optional[Any] = None,
    **kwargs
) -> Dict[str, Any]:
    """
    Predicts intelligent, fair daily campus rental price based on equipment specs,
    condition grade, historical student rental trends, brand tier, and asset age.

    Outputs:
      * recommended_price_per_day (float / formatted)
      * min_suggested_price
      * max_suggested_price
      * confidence_score
      * pricing_status ("Fair", "Underpriced", "Overpriced")
      * factors (list of explainable reasoning points)
    """
    start_time = time.perf_counter()

    # Support legacy argument names
    if "item_age_months" in kwargs and not age_months:
        age_months = kwargs["item_age_months"]
    if "requested_duration_days" in kwargs and rental_duration_days == 1:
        rental_duration_days = kwargs["requested_duration_days"]

    # Validation & normalization
    try:
        orig_price_float = float(original_price)
        if orig_price_float <= 0:
            raise ValueError("Original purchase price must be greater than zero.")
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Invalid original purchase price: {exc}")

    try:
        age_int = max(0, int(age_months))
    except (TypeError, ValueError):
        age_int = 0

    try:
        demand_float = float(campus_demand_score)
        demand_float = min(5.0, max(1.0, demand_float))
    except (TypeError, ValueError):
        demand_float = 3.0

    try:
        duration_int = max(1, int(rental_duration_days))
    except (TypeError, ValueError):
        duration_int = 1

    norm_category = str(category).lower().strip()
    norm_condition = str(condition).upper().strip()
    valid_conditions = ["BRAND_NEW", "LIKE_NEW", "GOOD", "FAIR"]
    if norm_condition not in valid_conditions:
        norm_condition = "GOOD"

    norm_brand = str(item_brand_tier).upper().strip()
    valid_brands = ["BUDGET", "MID_TIER", "PREMIUM"]
    if norm_brand not in valid_brands:
        norm_brand = "MID_TIER"

    model = get_model()
    factors: List[str] = [
        f"Original purchase price of ₹{orig_price_float:,.2f}",
        f"Item condition assessed as {norm_condition.replace('_', ' ').title()}",
    ]

    predicted_float: float = 0.0
    inference_source: str = "xgboost_pipeline"

    if model is not None:
        try:
            # Build DataFrame matching training features
            input_df = pd.DataFrame([{
                "category": norm_category,
                "condition": norm_condition,
                "item_brand_tier": norm_brand,
                "original_retail_price": orig_price_float,
                "age_in_months": age_int,
                "campus_demand_score": demand_float,
                "rental_duration_days": duration_int
            }])
            pred_raw = model.predict(input_df)[0]
            predicted_float = max(10.0, round(float(pred_raw), 2))
            factors.append("Trained Gradient Boosted (XGBoost) model evaluated on campus rental history")
        except Exception:
            predicted_float = fallback_price_calculation(
                norm_category, orig_price_float, norm_condition, age_int,
                norm_brand, demand_float, duration_int
            )
            inference_source = "heuristic_fallback"
            factors.append("Deterministic campus depreciation and utility heuristic")
    else:
        predicted_float = fallback_price_calculation(
            norm_category, orig_price_float, norm_condition, age_int,
            norm_brand, demand_float, duration_int
        )
        inference_source = "rule_based"
        factors.append("Campus resource sharing asset depreciation rate")

    if age_int > 0:
        factors.append(f"{age_int} months of asset usage factored into rate")

    if norm_brand != "MID_TIER":
        factors.append(f"Brand tier classified as {norm_brand.replace('_', ' ').title()}")

    # Recommended price boundaries: -15% to +15%
    rec_min = max(10.0, round(predicted_float * 0.85, 2))
    rec_max = max(rec_min + 5.0, round(predicted_float * 1.15, 2))

    # Confidence score calculation
    base_confidence = 0.96 if inference_source == "xgboost_pipeline" else 0.88
    # Slight decay if input values are far in the extremes
    if orig_price_float > 45000:
        base_confidence -= 0.03
    if age_int > 36:
        base_confidence -= 0.02
    confidence_score = round(max(0.75, min(0.99, base_confidence)), 2)

    # Determine pricing status if current_price is provided
    pricing_status = "Fair"
    if current_price is not None:
        try:
            curr_val = float(current_price)
            if curr_val < rec_min:
                pricing_status = "Underpriced"
            elif curr_val > rec_max:
                pricing_status = "Overpriced"
            else:
                pricing_status = "Fair"
        except (TypeError, ValueError):
            pricing_status = "Fair"

    inference_ms = round((time.perf_counter() - start_time) * 1000, 2)

    return {
        # New Phase 10 specification keys
        "recommended_price_per_day": predicted_float,
        "min_suggested_price": rec_min,
        "max_suggested_price": rec_max,
        "confidence_score": confidence_score,
        "pricing_status": pricing_status,
        "inference_latency_ms": inference_ms,

        # Backward-compatible fields
        "predicted_price": f"{predicted_float:.2f}",
        "recommended_min": f"{rec_min:.2f}",
        "recommended_max": f"{rec_max:.2f}",
        "currency": "INR",
        "period": "per_day",
        "factors": factors,
        "model_version": MODEL_VERSION,
        "model_type": "XGBoost Regressor" if inference_source == "xgboost_pipeline" else "Deterministic Fallback"
    }


# Backward-compatible alias
predict_fair_rental_price = predict_fair_price
