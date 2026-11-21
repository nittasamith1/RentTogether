"""
Campus Sustainability Impact Analytics Engine (Phase 14).
Calculates embodied electronic/academic waste avoided, monetary savings vs retail buying,
and aggregate campus environmental impact metrics.
"""

from decimal import Decimal
from typing import Dict, Any, List
from django.db.models import Sum, Count, Q
from apps.bookings.models import Booking
from apps.listings.models import Item

# Authoritative Category Embodied Waste Factor Map (kg waste avoided per completed rental)
CATEGORY_EMBODIED_WASTE_KG = {
    # Textbook / Academic: 0.8 kg waste avoided
    'textbook': 0.8,
    'textbooks': 0.8,
    'academic': 0.8,
    'books': 0.8,

    # Calculator / Electronics: 1.2 kg waste avoided
    'calculator': 1.2,
    'calculators': 1.2,
    'electronics': 1.2,
    'electronic': 1.2,

    # Laptop / Computer: 8.5 kg waste avoided
    'laptop': 8.5,
    'laptops': 8.5,
    'computer': 8.5,
    'computers': 8.5,

    # Lab Kit / Hardware: 2.4 kg waste avoided
    'lab': 2.4,
    'laboratory': 2.4,
    'hardware': 2.4,
    'kit': 2.4,
    'tools': 2.4,

    # Bicycle / Daily Use: 14.0 kg waste avoided
    'bicycle': 14.0,
    'bicycles': 14.0,
    'cycle': 14.0,
    'daily-use': 14.0,
    'mobility': 14.0,
}


def get_category_waste_factor(category_slug: str, title: str = '') -> float:
    """
    Returns the embodied waste weight (in kg) avoided when an item in this category is shared.
    """
    slug_lower = (category_slug or '').lower()
    title_lower = (title or '').lower()

    # Check title overrides first
    if 'laptop' in title_lower or 'macbook' in title_lower:
        return CATEGORY_EMBODIED_WASTE_KG['laptop']
    if 'bicycle' in title_lower or 'cycle' in title_lower:
        return CATEGORY_EMBODIED_WASTE_KG['bicycle']
    if 'calculator' in title_lower or 'casio' in title_lower:
        return CATEGORY_EMBODIED_WASTE_KG['calculator']
    if 'arduino' in title_lower or 'multimeter' in title_lower or 'lab' in title_lower or 'kit' in title_lower:
        return CATEGORY_EMBODIED_WASTE_KG['lab']
    if 'book' in title_lower or 'textbook' in title_lower or 'drafter' in title_lower:
        return CATEGORY_EMBODIED_WASTE_KG['textbook']

    # Match category slug
    for key, weight in CATEGORY_EMBODIED_WASTE_KG.items():
        if key in slug_lower:
            return weight

    return 1.5  # General campus resource default


def calculate_student_impact(user) -> Dict[str, Any]:
    """
    Calculates individual student environmental savings, money saved, and resources reused.
    Calculations strictly reflect items the student borrowed (as renter), where retail purchase
    was avoided and actual monetary savings and waste reductions were realized.
    """
    if not user or not user.is_authenticated:
        return _empty_student_impact()

    # Completed bookings where the user is the renter (borrower)
    renter_completed = Booking.objects.filter(
        renter=user,
        status=Booking.STATUS_COMPLETED
    ).select_related('item', 'item__category')

    active_rentals_count = Booking.objects.filter(
        Q(renter=user) | Q(owner=user),
        status__in=['ACTIVE', 'PAID_CONFIRMED']
    ).count()

    total_completed = renter_completed.count()

    total_money_saved = 0.0
    total_waste_avoided = 0.0
    category_counter: Dict[str, Dict[str, Any]] = {}

    for b in renter_completed:
        # Savings formula: Item Original Price - Total Rental Price Paid
        # Only use verified database values; do not fallback to arbitrary defaults
        retail_price = 0.0
        if b.reference_purchase_price_inr and float(b.reference_purchase_price_inr) > 0:
            retail_price = float(b.reference_purchase_price_inr)
        elif b.item and b.item.original_price and float(b.item.original_price) > 0:
            retail_price = float(b.item.original_price)

        rental_fee = float(b.total_rental_fee or 0.0)
        saving = max(0.0, retail_price - rental_fee) if retail_price > 0 else 0.0
        total_money_saved += saving

        cat_slug = b.item.category.slug if (b.item and b.item.category) else 'general'
        cat_name = b.item.category.name if (b.item and b.item.category) else 'Campus Gear'
        waste_kg = get_category_waste_factor(cat_slug, b.item_title or (b.item.title if b.item else ''))
        total_waste_avoided += waste_kg

        if cat_name not in category_counter:
            category_counter[cat_name] = {'count': 0, 'waste_kg': 0.0, 'money_saved': 0.0}
        category_counter[cat_name]['count'] += 1
        category_counter[cat_name]['waste_kg'] += waste_kg
        category_counter[cat_name]['money_saved'] += saving

    co2_saved_kg = round(total_waste_avoided * 2.1, 2)
    trees_equivalent = round(co2_saved_kg / 21.0, 2)

    # Campus percentile contribution benchmark based strictly on actual database completed bookings
    campus_completed_qs = Booking.objects.filter(status=Booking.STATUS_COMPLETED)
    college_id = getattr(user, 'college_id', None)
    if college_id:
        campus_completed_qs = campus_completed_qs.filter(owner__college_id=college_id)
    campus_total = campus_completed_qs.count()

    if campus_total > 0 and total_completed > 0:
        contribution_percentile = round((total_completed / campus_total) * 100)
    else:
        contribution_percentile = 0

    breakdown_list = [
        {
            'category': name,
            'completed_rentals': stats['count'],
            'waste_avoided_kg': round(stats['waste_kg'], 1),
            'money_saved_inr': round(stats['money_saved'], 2),
        }
        for name, stats in category_counter.items()
    ]

    return {
        'active_rentals': active_rentals_count,
        'completed_rentals': total_completed,
        'money_saved_inr': round(total_money_saved, 2),
        'waste_avoided_kg': round(total_waste_avoided, 1),
        'co2_saved_kg': co2_saved_kg,
        'trees_equivalent': trees_equivalent,
        'contribution_percentile': contribution_percentile,
        'category_breakdown': breakdown_list,
    }


def calculate_campus_impact(college=None) -> Dict[str, Any]:
    """
    Calculates aggregate campus-wide sustainability impact strictly from database records.
    """
    bookings_qs = Booking.objects.filter(status=Booking.STATUS_COMPLETED).select_related('item', 'item__category')
    if college:
        bookings_qs = bookings_qs.filter(owner__college=college)

    total_completed = bookings_qs.count()

    total_money_saved = 0.0
    total_waste_avoided = 0.0
    category_summary: Dict[str, float] = {}

    for b in bookings_qs:
        retail_price = 0.0
        if b.reference_purchase_price_inr and float(b.reference_purchase_price_inr) > 0:
            retail_price = float(b.reference_purchase_price_inr)
        elif b.item and b.item.original_price and float(b.item.original_price) > 0:
            retail_price = float(b.item.original_price)

        rental_fee = float(b.total_rental_fee or 0.0)
        saving = max(0.0, retail_price - rental_fee) if retail_price > 0 else 0.0
        total_money_saved += saving

        cat_slug = b.item.category.slug if (b.item and b.item.category) else 'general'
        cat_name = b.item.category.name if (b.item and b.item.category) else 'Campus Resources'
        waste_kg = get_category_waste_factor(cat_slug, b.item_title or (b.item.title if b.item else ''))
        total_waste_avoided += waste_kg

        category_summary[cat_name] = category_summary.get(cat_name, 0.0) + waste_kg

    co2_saved_kg = round(total_waste_avoided * 2.1, 2)
    trees_equivalent = round(co2_saved_kg / 21.0, 1)

    top_categories = sorted(
        [{'category': k, 'waste_avoided_kg': round(v, 1)} for k, v in category_summary.items()],
        key=lambda x: x['waste_avoided_kg'],
        reverse=True
    )[:5]

    if college:
        college_name = getattr(college, 'name', '')
    else:
        from apps.accounts.models import College
        active_col = College.objects.filter(is_active=True).first()
        college_name = active_col.name if active_col else 'Campus'

    return {
        'college_name': college_name,
        'total_resources_reused': total_completed,
        'total_money_saved_inr': round(total_money_saved, 2),
        'total_waste_avoided_kg': round(total_waste_avoided, 1),
        'total_co2_saved_kg': co2_saved_kg,
        'trees_equivalent': trees_equivalent,
        'top_sustainable_categories': top_categories,
    }


def _empty_student_impact() -> Dict[str, Any]:
    return {
        'active_rentals': 0,
        'completed_rentals': 0,
        'money_saved_inr': 0.0,
        'waste_avoided_kg': 0.0,
        'co2_saved_kg': 0.0,
        'trees_equivalent': 0.0,
        'contribution_percentile': 0,
        'category_breakdown': [],
    }
