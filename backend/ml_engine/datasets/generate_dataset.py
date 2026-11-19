import os
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Tuple

DATASETS_DIR = Path(__file__).resolve().parent
DATASET_CSV = DATASETS_DIR / "campus_rental_pricing.csv"

CATEGORIES = [
    "academic", "electronics", "laboratory", "project-equipment",
    "daily-essentials", "creative-media", "sports-fitness", "other"
]

CONDITIONS = ["BRAND_NEW", "LIKE_NEW", "GOOD", "FAIR"]

BRAND_TIERS = ["BUDGET", "MID_TIER", "PREMIUM"]

CATEGORY_BASE_RATES = {
    "academic": 0.022,          # Textbooks, calculators, drafters (2.2% of MSRP)
    "electronics": 0.012,       # Laptops, Arduino, tablets, displays (1.2% of MSRP)
    "laboratory": 0.011,        # Multimeters, breadboards, sensors (1.1% of MSRP)
    "project-equipment": 0.015, # Power tools, soldering stations, drills (1.5% of MSRP)
    "daily-essentials": 0.020,  # Study lamps, portable desks, fans (2.0% of MSRP)
    "creative-media": 0.013,    # DSLR cameras, gimbals, microphones (1.3% of MSRP)
    "sports-fitness": 0.018,    # Badminton, dumbbells, sports gear (1.8% of MSRP)
    "other": 0.014
}

CONDITION_MULTIPLIERS = {
    "BRAND_NEW": 1.05,
    "LIKE_NEW": 0.95,
    "GOOD": 0.82,
    "FAIR": 0.68
}

BRAND_TIER_MULTIPLIERS = {
    "BUDGET": 0.88,
    "MID_TIER": 1.00,
    "PREMIUM": 1.15
}


def generate_campus_rental_dataset(
    n_samples: int = 3500,
    random_seed: int = 42,
    save_csv: bool = True
) -> pd.DataFrame:
    """
    Generates a realistic, statistically grounded synthetic campus rental pricing dataset.
    Reflects student economy, equipment depreciation, category demand, brand tier, and rental duration.
    """
    np.random.seed(random_seed)

    cat_choices = np.random.choice(CATEGORIES, size=n_samples)
    cond_choices = np.random.choice(CONDITIONS, size=n_samples, p=[0.15, 0.40, 0.35, 0.10])
    brand_choices = np.random.choice(BRAND_TIERS, size=n_samples, p=[0.30, 0.50, 0.20])

    # Retail prices across typical student resources (₹200 to ₹18,000)
    raw_prices = np.random.exponential(scale=2400, size=n_samples) + 200
    orig_prices = np.clip(np.round(raw_prices, 2), 200.0, 18000.0)

    # Item age in months (0 to 48 months)
    ages = np.random.randint(0, 49, size=n_samples)

    # Campus demand score (1.0 to 5.0)
    demand_scores = np.random.choice([1.0, 2.0, 3.0, 4.0, 5.0], size=n_samples, p=[0.10, 0.20, 0.40, 0.20, 0.10])

    # Rental duration days (1 to 30)
    durations = np.random.choice([1, 2, 3, 5, 7, 10, 14, 21, 30], size=n_samples)

    daily_targets = []
    for cat, cond, brand, price, age, demand, dur in zip(
        cat_choices, cond_choices, brand_choices, orig_prices, ages, demand_scores, durations
    ):
        base_rate = price * CATEGORY_BASE_RATES[cat]
        cond_mult = CONDITION_MULTIPLIERS[cond]
        brand_mult = BRAND_TIER_MULTIPLIERS[brand]

        # Depreciation curve: max 45% depreciation over 48 months
        age_decay = max(0.55, 1.0 - (age * 0.0075))

        # Demand adjustment: demand 1 (-8%) to demand 5 (+10%)
        demand_factor = 1.0 + ((demand - 3.0) * 0.04)

        # Duration bulk discount on daily rate (1-2 days = 1.0, up to 30 days = 0.88)
        dur_factor = max(0.88, 1.0 - (dur * 0.004))

        ideal_daily = base_rate * cond_mult * brand_mult * age_decay * demand_factor * dur_factor

        # Standard market variation (std = 0.85)
        noise = np.random.normal(0, 0.85)
        final_price = max(10.0, round(float(ideal_daily + noise), 2))
        daily_targets.append(final_price)

    df = pd.DataFrame({
        "category": cat_choices,
        "original_retail_price": orig_prices,
        "age_in_months": ages,
        "condition": cond_choices,
        "item_brand_tier": brand_choices,
        "campus_demand_score": demand_scores,
        "rental_duration_days": durations,
        "fair_rental_price_per_day": daily_targets
    })

    if save_csv:
        DATASETS_DIR.mkdir(parents=True, exist_ok=True)
        df.to_csv(DATASET_CSV, index=False)
        print(f"Dataset generated with {len(df)} samples and saved to {DATASET_CSV}")

    return df


def load_dataset() -> pd.DataFrame:
    """
    Loads the campus rental pricing dataset, creating it if it doesn't already exist.
    """
    if DATASET_CSV.exists():
        return pd.read_csv(DATASET_CSV)
    return generate_campus_rental_dataset()


if __name__ == "__main__":
    generate_campus_rental_dataset()
