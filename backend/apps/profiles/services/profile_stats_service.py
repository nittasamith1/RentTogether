from decimal import Decimal
from django.db.models import Sum, Count, Q
from apps.bookings.models import Booking
from apps.profiles.models import StudentProfile
from .reputation_service import (
    calculate_owner_reputation,
    calculate_renter_reputation,
    get_reputation_badge,
)


def calculate_owner_stats(user) -> dict:
    """
    Aggregates authoritative owner (lender) statistics from completed bookings.
    """
    completed_bookings = Booking.objects.filter(
        owner=user,
        status=Booking.STATUS_COMPLETED
    )

    agg = completed_bookings.aggregate(
        total_count=Count('id'),
        total_earnings=Sum('rental_price_inr')
    )

    total_lent = agg['total_count'] or 0
    total_earnings = agg['total_earnings'] or Decimal('0.00')

    # Active listings owned by user (if listings app is present or placeholder)
    try:
        from apps.listings.models import Item
        active_listings = Item.objects.filter(owner=user, status='ACTIVE').count()
    except (ImportError, Exception):
        active_listings = 0

    score, review_count = calculate_owner_reputation(user.id)
    badge = get_reputation_badge(score, review_count)

    return {
        'total_items_lent': total_lent,
        'completed_lending_transactions': total_lent,
        'active_listings': active_listings,
        'total_rental_earnings': total_earnings,
        'owner_reputation': score,
        'owner_review_count': review_count,
        'owner_badge': badge,
        'has_owner_reviews': review_count > 0,
    }


def calculate_renter_stats(user) -> dict:
    """
    Aggregates authoritative renter (borrower) statistics from completed bookings.
    Total savings = sum(reference_purchase_price_inr - rental_price_inr) for items rented.
    """
    completed_bookings = Booking.objects.filter(
        renter=user,
        status=Booking.STATUS_COMPLETED
    )

    active_rentals = Booking.objects.filter(
        renter=user,
        status=Booking.STATUS_ACTIVE
    ).count()

    total_borrowed = completed_bookings.count()

    total_spending = Decimal('0.00')
    total_savings = Decimal('0.00')

    for b in completed_bookings:
        total_spending += b.rental_price_inr
        # Calculate documented savings against purchase price
        if b.reference_purchase_price_inr and b.reference_purchase_price_inr > b.rental_price_inr:
            total_savings += (b.reference_purchase_price_inr - b.rental_price_inr)
        else:
            # Baseline conservative saving: renting costs ~15-20% of buying retail
            estimated_retail = b.rental_price_inr * Decimal('4.00')
            total_savings += (estimated_retail - b.rental_price_inr)

    score, review_count = calculate_renter_reputation(user.id)
    badge = get_reputation_badge(score, review_count)

    return {
        'total_items_borrowed': total_borrowed,
        'completed_rentals': total_borrowed,
        'active_rentals': active_rentals,
        'total_rental_spending': total_spending,
        'total_savings_inr': total_savings,
        'renter_reputation': score,
        'renter_review_count': review_count,
        'renter_badge': badge,
        'has_renter_reviews': review_count > 0,
    }


def sync_profile_stats(user) -> StudentProfile:
    """
    Calculates all statistics and updates the student's StudentProfile record.
    """
    owner_stats = calculate_owner_stats(user)
    renter_stats = calculate_renter_stats(user)

    profile, _ = StudentProfile.objects.get_or_create(
        user=user,
        defaults={'college': user.college}
    )

    profile.total_items_lent = owner_stats['total_items_lent']
    profile.total_earnings_inr = owner_stats['total_rental_earnings']
    if owner_stats['owner_reputation'] is not None:
        profile.reputation_as_owner = owner_stats['owner_reputation']

    profile.total_items_borrowed = renter_stats['total_items_borrowed']
    profile.total_savings_inr = renter_stats['total_savings_inr']
    if renter_stats['renter_reputation'] is not None:
        profile.reputation_as_renter = renter_stats['renter_reputation']

    profile.save(update_fields=[
        'total_items_lent',
        'total_earnings_inr',
        'reputation_as_owner',
        'total_items_borrowed',
        'total_savings_inr',
        'reputation_as_renter',
        'updated_at'
    ])
    return profile

