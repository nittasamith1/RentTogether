from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, Tuple
from django.db.models import QuerySet
from apps.profiles.models import StudentReview, StudentProfile

# Default decay factor for recency-weighted moving average
DEFAULT_DECAY_FACTOR = Decimal('0.85')


def calculate_review_score(review: StudentReview) -> Decimal:
    """
    Computes single review score using Phase 03 specified weightings:
    Owner Review:
      Condition Accuracy: 70%
      Communication & Punctuality: 30%
    Renter Review:
      On-Time Return: 60%
      Item Care & Cleanliness: 40%
    """
    return review.calculated_score


def calculate_weighted_reputation(
    reviews: QuerySet,
    decay_factor: Decimal = DEFAULT_DECAY_FACTOR
) -> Tuple[Optional[Decimal], int]:
    """
    Computes a recency-weighted moving average over an ordered sequence of reviews.
    The reviews queryset must be ordered by created_at DESC (newest first).

    Formula:
      Weight for review i (0 is newest): w_i = decay_factor ** i
      Weighted Average = (sum(w_i * score_i)) / sum(w_i)
    Returns:
      (reputation_score, review_count)
    """
    review_list = list(reviews)
    count = len(review_list)
    if count == 0:
        return None, 0

    total_weighted_sum = Decimal('0.0000')
    total_weights = Decimal('0.0000')

    current_weight = Decimal('1.0000')
    for review in review_list:
        score = calculate_review_score(review)
        total_weighted_sum += current_weight * score
        total_weights += current_weight
        current_weight *= decay_factor

    if total_weights == Decimal('0.0000'):
        return None, 0

    final_score = (total_weighted_sum / total_weights).quantize(
        Decimal('0.01'),
        rounding=ROUND_HALF_UP
    )
    # Bound within 0.00 to 5.00
    final_score = max(Decimal('0.00'), min(Decimal('5.00'), final_score))
    return final_score, count


def calculate_owner_reputation(user_id) -> Tuple[Optional[Decimal], int]:
    """
    Calculates owner (lender) reputation for a student from received owner reviews.
    """
    reviews = StudentReview.objects.filter(
        reviewee_id=user_id,
        review_type=StudentReview.REVIEW_TYPE_OWNER
    ).order_by('-created_at')
    return calculate_weighted_reputation(reviews)


def calculate_renter_reputation(user_id) -> Tuple[Optional[Decimal], int]:
    """
    Calculates renter (borrower) reputation for a student from received renter reviews.
    """
    reviews = StudentReview.objects.filter(
        reviewee_id=user_id,
        review_type=StudentReview.REVIEW_TYPE_RENTER
    ).order_by('-created_at')
    return calculate_weighted_reputation(reviews)


def get_reputation_badge(score: Optional[Decimal], review_count: int) -> str:
    """
    Informational badges per Phase 03 specifications:
      - 4.80 - 5.00: Excellent
      - 4.50 - 4.79: Trusted
      - 4.00 - 4.49: Reliable
      - Below 4.00: Developing
      - No reviews (or 0 count): New Member
    """
    if review_count == 0 or score is None:
        return "New Member"
    if score >= Decimal('4.80'):
        return "Excellent"
    if score >= Decimal('4.50'):
        return "Trusted"
    if score >= Decimal('4.00'):
        return "Reliable"
    return "Developing"


def update_student_reputation(user_id) -> StudentProfile:
    """
    Recalculates both Owner and Renter reputations and persists them to the StudentProfile.
    """
    owner_score, owner_count = calculate_owner_reputation(user_id)
    renter_score, renter_count = calculate_renter_reputation(user_id)

    profile = StudentProfile.objects.filter(user_id=user_id).first()
    if profile:
        profile.reputation_as_owner = owner_score if owner_score is not None else Decimal('5.00')
        profile.reputation_as_renter = renter_score if renter_score is not None else Decimal('5.00')
        profile.save(update_fields=['reputation_as_owner', 'reputation_as_renter', 'updated_at'])
    return profile

