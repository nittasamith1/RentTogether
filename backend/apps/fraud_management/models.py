import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class FraudAlert(models.Model):
    """
    Authoritative record of AI-detected suspicious activities, anomalies,
    price gouging, duplicate items, or malicious account behavior.
    """

    STATUS_PENDING_REVIEW = 'PENDING_REVIEW'
    STATUS_DISMISSED = 'DISMISSED'
    STATUS_ACTION_TAKEN = 'ACTION_TAKEN'

    STATUS_CHOICES = [
        (STATUS_PENDING_REVIEW, 'Pending Review'),
        (STATUS_DISMISSED, 'Dismissed (Approved Safe)'),
        (STATUS_ACTION_TAKEN, 'Action Taken (Quarantined / Suspended)'),
    ]

    RISK_LOW = 'LOW'
    RISK_MEDIUM = 'MEDIUM'
    RISK_HIGH = 'HIGH'

    RISK_LEVEL_CHOICES = [
        (RISK_LOW, 'Low Risk (0-39)'),
        (RISK_MEDIUM, 'Medium Risk (40-74)'),
        (RISK_HIGH, 'High Risk (75-100)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    listing = models.ForeignKey(
        'listings.Item',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='fraud_alerts',
        help_text="Flagged equipment listing (null if activity is user-level cancellation spam)"
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='fraud_alerts',
        help_text="Student account associated with the anomaly"
    )

    risk_score = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Normalized AI anomaly score (0 to 100)"
    )

    risk_level = models.CharField(
        max_length=20,
        choices=RISK_LEVEL_CHOICES,
        default=RISK_LOW,
        db_index=True
    )

    trigger_signals = models.JSONField(
        default=dict,
        blank=True,
        help_text="Extracted feature snapshot & reasons (e.g. price deviation, creation velocity)"
    )

    status = models.CharField(
        max_length=25,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING_REVIEW,
        db_index=True
    )

    review_notes = models.TextField(
        blank=True,
        default="",
        help_text="Admin notes on mediation, investigation, or justification"
    )

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reviewed_fraud_alerts'
    )

    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'fraud_alerts'
        ordering = ['-created_at']
        verbose_name = 'Fraud Alert'
        verbose_name_plural = 'Fraud Alerts'

    def __str__(self):
        target = f"Listing {self.listing.title}" if self.listing else f"User {self.user.email}"
        return f"[{self.risk_level} - {self.risk_score}] {target} ({self.status})"

