"""
Dispute and Campus Administration Models — Phase 15
"""
import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings


class Dispute(models.Model):
    """
    On-Ground and In-App Dispute Mediation Model.
    Tracks issues raised between students during rentals (damaged items, late returns, etc.)
    and enables college administrators to arbitrate and resolve them.
    """
    # Issue Types
    ISSUE_DAMAGED_ITEM = 'DAMAGED_ITEM'
    ISSUE_LATE_RETURN = 'LATE_RETURN'
    ISSUE_WRONG_ITEM = 'WRONG_ITEM'
    ISSUE_NOT_RETURNED = 'NOT_RETURNED'

    ISSUE_TYPE_CHOICES = [
        (ISSUE_DAMAGED_ITEM, 'Damaged Equipment / Hardware Defect'),
        (ISSUE_LATE_RETURN, 'Overdue / Late Return Without Notice'),
        (ISSUE_WRONG_ITEM, 'Wrong or Mismatched Item Provided'),
        (ISSUE_NOT_RETURNED, 'Item Never Returned / Suspected Loss'),
    ]

    # Dispute Statuses
    STATUS_OPEN = 'OPEN'
    STATUS_UNDER_INVESTIGATION = 'UNDER_INVESTIGATION'
    STATUS_RESOLVED = 'RESOLVED'
    STATUS_DISMISSED = 'DISMISSED'

    STATUS_CHOICES = [
        (STATUS_OPEN, 'Open - Pending Review'),
        (STATUS_UNDER_INVESTIGATION, 'Under Campus Investigation'),
        (STATUS_RESOLVED, 'Resolved by Administrator'),
        (STATUS_DISMISSED, 'Dismissed'),
    ]

    # Resolution Decisions
    DECISION_FULL_REFUND_RENTER = 'FULL_REFUND_RENTER'
    DECISION_FORFEIT_DEPOSIT_TO_OWNER = 'FORFEIT_DEPOSIT_TO_OWNER'
    DECISION_SPLIT = 'SPLIT'

    DECISION_CHOICES = [
        (DECISION_FULL_REFUND_RENTER, 'Full Refund to Renter'),
        (DECISION_FORFEIT_DEPOSIT_TO_OWNER, 'Forfeit Deposit / Compensation to Owner'),
        (DECISION_SPLIT, 'Split Settlement Between Parties'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='disputes',
        help_text="Associated rental booking"
    )
    raised_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='disputes_raised',
        help_text="Student who initiated the dispute"
    )
    against_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='disputes_against',
        help_text="Student against whom the dispute is raised"
    )
    issue_type = models.CharField(
        max_length=40,
        choices=ISSUE_TYPE_CHOICES,
        default=ISSUE_DAMAGED_ITEM
    )
    description = models.TextField(help_text="Detailed description of the dispute")
    evidence_image_urls = models.JSONField(
        default=list,
        blank=True,
        help_text="Array of photo evidence URLs demonstrating damage or handover issues"
    )
    claimed_compensation = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Claimed compensation amount in INR"
    )
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default=STATUS_OPEN,
        db_index=True
    )
    resolution_decision = models.CharField(
        max_length=40,
        choices=DECISION_CHOICES,
        null=True,
        blank=True
    )
    admin_notes = models.TextField(
        blank=True,
        default='',
        help_text="Official college administrator arbitration findings and notes"
    )
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='disputes_resolved'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'administration_dispute'
        ordering = ['-created_at']
        verbose_name = 'Dispute'
        verbose_name_plural = 'Disputes'

    def __str__(self):
        return f"Dispute #{str(self.id)[:8]} - {self.issue_type} ({self.status})"
