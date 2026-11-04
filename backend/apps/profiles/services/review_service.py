from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ValidationError
from apps.bookings.models import Booking
from apps.profiles.models import StudentReview
from .reputation_service import update_student_reputation
from .profile_stats_service import sync_profile_stats


def submit_student_review(
    booking_id,
    reviewer,
    review_type: str,
    scores: dict,
    overall_comment: str = ""
) -> StudentReview:
    """
    Submits an authoritative review for a completed booking.
    Executes in a single database transaction and automatically recalculates
    reputation and profile statistics for the reviewee.
    """
    with transaction.atomic():
        try:
            booking = Booking.objects.select_for_update().get(id=booking_id)
        except Booking.DoesNotExist:
            raise ValidationError({"booking": "Specified booking was not found."})

        if booking.status != Booking.STATUS_COMPLETED:
            raise ValidationError({"booking": "Reviews can only be submitted for completed bookings."})

        # Determine reviewee based on review type and role
        if review_type == StudentReview.REVIEW_TYPE_OWNER:
            if reviewer.id != booking.renter_id:
                raise ValidationError({"reviewer": "Only the renter can submit an owner review."})
            reviewee = booking.owner
        elif review_type == StudentReview.REVIEW_TYPE_RENTER:
            if reviewer.id != booking.owner_id:
                raise ValidationError({"reviewer": "Only the owner can submit a renter review."})
            reviewee = booking.renter
        else:
            raise ValidationError({"review_type": "Invalid review type. Must be OWNER or RENTER."})

        if reviewer.id == reviewee.id:
            raise ValidationError("Students cannot review themselves.")

        # Check duplicate
        if StudentReview.objects.filter(booking=booking, reviewer=reviewer, review_type=review_type).exists():
            raise ValidationError({"non_field_errors": "You have already submitted this review for this booking."})

        # Extract criteria scores
        condition_accuracy = scores.get('condition_accuracy_score')
        communication = scores.get('communication_score')
        punctuality = scores.get('punctuality_score')
        on_time_return = scores.get('on_time_return_score')
        item_care = scores.get('item_care_score')

        review = StudentReview(
            booking=booking,
            reviewer=reviewer,
            reviewee=reviewee,
            review_type=review_type,
            condition_accuracy_score=condition_accuracy,
            communication_score=communication,
            punctuality_score=punctuality,
            on_time_return_score=on_time_return,
            item_care_score=item_care,
            overall_comment=overall_comment.strip() if overall_comment else ""
        )
        # full_clean validates criteria presence and score bounds
        review.full_clean()
        review.save()

        # Recalculate reputation & stats for reviewee
        update_student_reputation(reviewee.id)
        sync_profile_stats(reviewee)

        return review

