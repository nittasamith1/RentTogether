"""
Feature Extractor for Campus Fraud & Risk Detection (Phase 12).
Extracts behavioral, pricing, image perceptual, and account signals for ML inference.
"""

from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from django.db.models import Q
import pandas as pd


def compute_image_dhash(image_field_or_path, hash_size: int = 8) -> str:
    """
    Computes a 64-bit difference hash (dhash) using PIL.
    """
    try:
        from PIL import Image
        if hasattr(image_field_or_path, 'open'):
            image_field_or_path.open()
        elif hasattr(image_field_or_path, 'seek'):
            image_field_or_path.seek(0)

        img = Image.open(image_field_or_path).convert('L').resize(
            (hash_size + 1, hash_size),
            Image.Resampling.LANCZOS
        )
        pixels = list(img.getdata())
        diff = []
        for row in range(hash_size):
            for col in range(hash_size):
                p_left = pixels[row * (hash_size + 1) + col]
                p_right = pixels[row * (hash_size + 1) + col + 1]
                diff.append(p_left > p_right)

        decimal_val = 0
        hex_string = []
        for index, value in enumerate(diff):
            if value:
                decimal_val += 2 ** (index % 4)
            if index % 4 == 3:
                hex_string.append(hex(decimal_val)[2:])
                decimal_val = 0
        return "".join(hex_string)
    except Exception:
        return "0" * 16


def compute_hamming_distance(hash1: str, hash2: str) -> int:
    """
    Calculates Hamming distance between two hex hashes (0 = identical, 64 = opposite).
    """
    try:
        val1 = int(hash1, 16)
        val2 = int(hash2, 16)
        return bin(val1 ^ val2).count('1')
    except Exception:
        return 45


def extract_listing_risk_signals(item, user, image_file=None) -> dict:
    """
    Extracts the 6 authoritative risk signals for a listing:
      1. price_deviation_ratio
      2. creation_velocity
      3. cancellation_ratio
      4. account_age_days
      5. user_report_count
      6. duplicate_image_hash_distance
    """
    from apps.bookings.models import Booking
    from apps.listings.models import Item
    from ml_engine.services.pricing_service import predict_fair_rental_price

    # 1. Price Deviation Ratio
    listed_price = float(getattr(item, 'rental_price_per_day', 0.0) or 0.0)
    category_slug = item.category.slug if getattr(item, 'category', None) else 'academic'
    condition = getattr(item, 'condition', 'GOOD')
    original_price = float(getattr(item, 'original_retail_price', 0.0) or 1000.0)

    try:
        ai_pricing = predict_fair_rental_price(
            category=category_slug,
            original_retail_price=original_price if original_price > 0 else 1000.0,
            age_in_months=getattr(item, 'age_in_months', 6) or 6,
            condition=condition
        )
        predicted_fair_price = max(5.0, float(ai_pricing.get('recommended_price_per_day', 25.0)))
    except Exception:
        predicted_fair_price = 25.0

    if predicted_fair_price > 0:
        price_deviation_ratio = abs(listed_price - predicted_fair_price) / predicted_fair_price
    else:
        price_deviation_ratio = 0.0

    # 2. Creation Velocity (items listed in last 2 hours by this user)
    two_hours_ago = timezone.now() - timedelta(hours=2)
    creation_velocity = Item.objects.filter(
        owner=user,
        created_at__gte=two_hours_ago
    ).exclude(id=getattr(item, 'id', None)).count()

    # 3. Cancellation Ratio
    user_bookings = Booking.objects.filter(Q(renter=user) | Q(owner=user))
    total_bookings = user_bookings.count()
    if total_bookings > 0:
        cancelled_count = user_bookings.filter(status=Booking.STATUS_CANCELLED).count()
        cancellation_ratio = cancelled_count / total_bookings
    else:
        cancellation_ratio = 0.0

    # 4. Account Age in Days
    date_joined = getattr(user, 'date_joined', timezone.now())
    account_age_days = max(0, (timezone.now() - date_joined).days)

    # 5. User Report Count (disputed bookings or user flags)
    user_report_count = user_bookings.filter(status=Booking.STATUS_DISPUTED).count()

    # 6. Duplicate Image Hash Distance
    duplicate_image_hash_distance = 45 # Default distinct distance
    if image_file:
        try:
            curr_hash = compute_image_dhash(image_file)
            # Compare with latest existing items
            recent_items = Item.objects.exclude(id=getattr(item, 'id', None)).order_by('-created_at')[:30]
            min_dist = 64
            for other in recent_items:
                other_img = other.images.first()
                if other_img and hasattr(other_img, 'image') and other_img.image:
                    try:
                        other_hash = compute_image_dhash(other_img.image)
                        dist = compute_hamming_distance(curr_hash, other_hash)
                        if dist < min_dist:
                            min_dist = dist
                    except Exception:
                        continue
            if min_dist < 64:
                duplicate_image_hash_distance = min_dist
        except Exception:
            duplicate_image_hash_distance = 45

    signals = {
        "price_deviation_ratio": round(float(price_deviation_ratio), 4),
        "creation_velocity": int(creation_velocity),
        "cancellation_ratio": round(float(cancellation_ratio), 4),
        "account_age_days": int(account_age_days),
        "user_report_count": int(user_report_count),
        "duplicate_image_hash_distance": int(duplicate_image_hash_distance),
        "listed_price": round(listed_price, 2),
        "predicted_fair_price": round(predicted_fair_price, 2),
    }

    return signals

