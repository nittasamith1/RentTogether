"""
AI Fraud & Anomaly Risk Detection Service (Phase 12).
Evaluates listings and user behaviors with a deterministic risk heuristic engine,
automatically quarantining high-risk anomalies (e.g. ₹5,000/day calculator or duplicate asset hashes).
Replaces heavy Scikit-learn IsolationForest pipeline to keep memory strictly under 300MB.
"""

import logging
from decimal import Decimal
from apps.fraud_management.services.feature_extractor import (
    extract_listing_risk_signals,
)

logger = logging.getLogger(__name__)


class FraudRiskModel:
    """
    Lightweight deterministic risk model.
    """
    def score_risk(self, df_or_dict):
        return [15]


def get_fraud_model():
    """
    Returns the active fraud risk model instance.
    """
    return FraudRiskModel()


def calculate_heuristic_risk_score(signals: dict) -> int:
    """
    Computes a deterministic anomaly risk score (0 to 100) based on extracted signals.
    """
    score = 15  # Baseline safe score
    price_dev = signals.get("price_deviation_ratio", 0.0)
    velocity = signals.get("creation_velocity", 0)
    canc_ratio = signals.get("cancellation_ratio", 0.0)
    acc_age = signals.get("account_age_days", 100)
    reports = signals.get("user_report_count", 0)
    hash_dist = signals.get("duplicate_image_hash_distance", 45)

    if price_dev >= 2.0:
        score += 65
    elif price_dev >= 0.8:
        score += 35

    if velocity >= 5:
        score += 30
    elif velocity >= 3:
        score += 15

    if canc_ratio >= 0.50:
        score += 20

    if reports >= 2:
        score += 35
    elif reports == 1:
        score += 15

    if hash_dist <= 5:
        score += 30

    if acc_age <= 1 and (velocity >= 2 or price_dev >= 1.0):
        score += 25

    return max(5, min(99, score))


def formulate_trigger_reasons(signals: dict) -> list[str]:
    """
    Formulates human-readable risk trigger explanations from extracted signals.
    """
    reasons = []

    price_dev = signals.get("price_deviation_ratio", 0.0)
    listed_price = signals.get("listed_price", 0.0)
    fair_price = signals.get("predicted_fair_price", 25.0)
    velocity = signals.get("creation_velocity", 0)
    canc_ratio = signals.get("cancellation_ratio", 0.0)
    acc_age = signals.get("account_age_days", 100)
    reports = signals.get("user_report_count", 0)
    hash_dist = signals.get("duplicate_image_hash_distance", 45)

    if price_dev >= 2.0:
        pct = int(price_dev * 100)
        reasons.append(
            f"[PRICE_GOUGING] Listed rate ₹{listed_price}/day deviates by {pct}% from AI fair price (₹{fair_price}/day)."
        )
    elif price_dev >= 0.8:
        pct = int(price_dev * 100)
        reasons.append(
            f"[PRICE_ANOMALY] Listed rate ₹{listed_price}/day is {pct}% higher than standard campus benchmark."
        )

    if velocity >= 5:
        reasons.append(
            f"[VELOCITY_SPAM] Abnormal creation burst: {velocity} items listed in under 2 hours."
        )
    elif velocity >= 3:
        reasons.append(
            f"[VELOCITY_ELEVATED] Rapid listing activity: {velocity} items listed recently."
        )

    if canc_ratio >= 0.50:
        pct = int(canc_ratio * 100)
        reasons.append(
            f"[HIGH_CANCELLATION] Account exhibits elevated past cancellation rate ({pct}%)."
        )

    if reports >= 2:
        reasons.append(
            f"[USER_DISPUTES] Account has {reports} prior rental disputes or user complaints."
        )

    if hash_dist <= 5:
        reasons.append(
            f"[DUPLICATE_ASSET] Photograph matches an existing listing (Hamming distance {hash_dist}/64)."
        )

    if acc_age <= 1 and (velocity >= 2 or price_dev >= 1.0):
        reasons.append(
            f"[FRESH_ACCOUNT_RISK] High-velocity/unusual pricing on a brand new account (age {acc_age} days)."
        )

    if not reasons:
        reasons.append("Standard campus activity within safe empirical parameters.")

    return reasons


def evaluate_listing_risk(item, user, image_file=None) -> dict:
    """
    Evaluates risk for a given item listing.
    If risk_score >= 75 (High Risk):
      - Quarantines item: is_published = False, status = Item.STATUS_PAUSED
      - Creates FraudAlert in apps/fraud_management
      - Returns assessment dictionary.
    """
    from apps.fraud_management.models import FraudAlert
    from apps.listings.models import Item

    signals = extract_listing_risk_signals(item, user, image_file=image_file)
    risk_score = calculate_heuristic_risk_score(signals)

    if risk_score >= 75:
        risk_level = FraudAlert.RISK_HIGH
    elif risk_score >= 40:
        risk_level = FraudAlert.RISK_MEDIUM
    else:
        risk_level = FraudAlert.RISK_LOW

    reasons = formulate_trigger_reasons(signals)
    signals["reasons"] = reasons

    is_quarantined = False
    alert_obj = None

    if risk_level == FraudAlert.RISK_HIGH:
        # High Risk: Automatically quarantine item until admin review
        item.is_published = False
        item.status = Item.STATUS_PAUSED
        item.save(update_fields=['is_published', 'status'])
        is_quarantined = True

        alert_obj = FraudAlert.objects.create(
            listing=item,
            user=user,
            risk_score=risk_score,
            risk_level=risk_level,
            trigger_signals=signals,
            status=FraudAlert.STATUS_PENDING_REVIEW,
            review_notes="Automated quarantine triggered by campus risk heuristic engine."
        )

        # Notify administrators
        try:
            from apps.accounts.models import User as RTUser
            from apps.notifications.services import send_notification
            admins = RTUser.objects.filter(is_staff=True)[:5]
            for admin_user in admins:
                send_notification(
                    recipient=admin_user,
                    actor=user,
                    event_type="FRAUD_ALERT_HIGH",
                    title="⚠️ High-Risk Item Quarantined",
                    message=f"Item '{item.title}' by {user.email} flagged with Risk Score {risk_score}/100 and held for review.",
                    metadata={"alert_id": str(alert_obj.id), "item_id": str(item.id)}
                )
        except Exception as exc:
            logger.warning(f"Failed to notify admins of fraud alert: {exc}")

    elif risk_level == FraudAlert.RISK_MEDIUM:
        # Medium Risk: Flag for monitoring without disrupting safe student flow
        alert_obj = FraudAlert.objects.create(
            listing=item,
            user=user,
            risk_score=risk_score,
            risk_level=risk_level,
            trigger_signals=signals,
            status=FraudAlert.STATUS_PENDING_REVIEW,
            review_notes="Medium anomaly score recorded for monitoring."
        )

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "is_quarantined": is_quarantined,
        "trigger_signals": signals,
        "reasons": reasons,
        "alert_id": str(alert_obj.id) if alert_obj else None,
    }


def evaluate_cancellation_risk(user) -> dict:
    """
    Evaluates sudden cancellation spikes on a student account.
    """
    from apps.bookings.models import Booking
    from apps.fraud_management.models import FraudAlert

    recent_cancellations = Booking.objects.filter(
        renter=user,
        status=Booking.STATUS_CANCELLED
    ).count()

    total_bookings = Booking.objects.filter(renter=user).count()

    if total_bookings >= 3 and (recent_cancellations / total_bookings) >= 0.70:
        alert = FraudAlert.objects.create(
            listing=None,
            user=user,
            risk_score=78,
            risk_level=FraudAlert.RISK_HIGH,
            trigger_signals={
                "event": "RAPID_CANCELLATION_SPIKE",
                "cancellations": recent_cancellations,
                "total_bookings": total_bookings,
                "cancellation_ratio": recent_cancellations / total_bookings,
                "reasons": [f"Student has cancelled {recent_cancellations} out of {total_bookings} bookings."]
            },
            status=FraudAlert.STATUS_PENDING_REVIEW,
            review_notes="Automated trigger: Excessive rental cancellations detected."
        )
        return {"flagged": True, "alert_id": str(alert.id), "risk_score": 78}

    return {"flagged": False, "alert_id": None, "risk_score": 15}
