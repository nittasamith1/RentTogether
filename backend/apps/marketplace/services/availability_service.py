from datetime import datetime, date, time
from django.utils import timezone
from django.db.models import Q
from apps.bookings.models import Booking
from apps.availability.models import ItemAvailabilityBlock


CONFLICTING_STATUSES = [
    Booking.STATUS_APPROVED_PENDING_PAYMENT,
    Booking.STATUS_PAID_CONFIRMED,
    Booking.STATUS_ACTIVE,
]


def parse_date_boundary(date_val, is_end=False):
    """
    Normalizes a string or date object into a timezone-aware datetime at midnight or end-of-day.
    """
    if isinstance(date_val, str):
        date_obj = datetime.strptime(date_val.strip(), "%Y-%m-%d").date()
    elif isinstance(date_val, datetime):
        return timezone.make_aware(date_val) if timezone.is_naive(date_val) else date_val
    elif isinstance(date_val, date):
        date_obj = date_val
    else:
        return None

    if is_end:
        dt = datetime.combine(date_obj, time.max)
    else:
        dt = datetime.combine(date_obj, time.min)

    current_tz = timezone.get_current_timezone()
    return timezone.make_aware(dt, current_tz)


def is_item_available(item, start_dt=None, end_dt=None) -> bool:
    """
    Determines if an item is available for the specified date range.
    Uses the consistent booking-overlap rule:
    existing_start < requested_end AND existing_end > requested_start
    Also checks if the item is blocked by the owner or under maintenance.
    """
    if item.status != 'ACTIVE' or not item.is_published:
        return False

    now = timezone.now()
    today = now.date()
    if not start_dt:
        start_dt = now
    if not end_dt:
        end_dt = start_dt + timezone.timedelta(days=1)

    start_date = start_dt.date() if hasattr(start_dt, 'date') else start_dt
    end_date = end_dt.date() if hasattr(end_dt, 'date') else end_dt

    # Check if item is manually blocked by owner
    owner_blocked = ItemAvailabilityBlock.objects.filter(
        item=item,
        reason__in=[
            ItemAvailabilityBlock.REASON_OWNER_UNAVAILABLE,
            ItemAvailabilityBlock.REASON_MAINTENANCE
        ],
        end_date__gt=today
    ).exists()
    if owner_blocked:
        return False

    # Check active availability blocks overlapping requested interval
    has_block = ItemAvailabilityBlock.objects.filter(
        item=item,
        start_date__lt=end_date,
        end_date__gt=start_date
    ).filter(
        Q(expires_at__isnull=True) | Q(expires_at__gt=now)
    ).exists()
    if has_block:
        return False

    # Check conflicting confirmed/active bookings using half-open datetime overlap
    conflicts = Booking.objects.filter(
        item=item,
        status__in=CONFLICTING_STATUSES
    ).filter(
        Q(start_datetime__isnull=False, end_datetime__isnull=False, start_datetime__lt=end_dt, end_datetime__gt=start_dt) |
        Q(start_datetime__isnull=True, start_date__lt=end_dt, end_date__gt=start_dt)
    ).exists()

    return not conflicts


def filter_available_items(queryset, available_now: bool = False, start_date=None, end_date=None):
    """
    Filters an Item queryset by availability constraints.
    """
    now = timezone.now()
    today = now.date()

    if available_now:
        # Exclude items currently checked out or blocked
        currently_rented_item_ids = Booking.objects.filter(
            status__in=CONFLICTING_STATUSES,
            start_date__lte=today,
            end_date__gte=today,
            item__isnull=False
        ).values_list('item_id', flat=True)

        currently_blocked_item_ids = ItemAvailabilityBlock.objects.filter(
            start_date__lte=today,
            end_date__gt=today
        ).values_list('item_id', flat=True)

        return queryset.exclude(id__in=currently_rented_item_ids).exclude(id__in=currently_blocked_item_ids)

    if start_date and end_date:
        start_dt = parse_date_boundary(start_date, is_end=False)
        end_dt = parse_date_boundary(end_date, is_end=True)

        if start_dt and end_dt:
            s_date = start_dt.date()
            e_date = end_dt.date()

            conflicting_item_ids = Booking.objects.filter(
                status__in=CONFLICTING_STATUSES,
                start_date__lt=end_dt,
                end_date__gt=start_dt,
                item__isnull=False
            ).values_list('item_id', flat=True)

            blocked_item_ids = ItemAvailabilityBlock.objects.filter(
                start_date__lt=e_date,
                end_date__gt=s_date
            ).values_list('item_id', flat=True)

            return queryset.exclude(id__in=conflicting_item_ids).exclude(id__in=blocked_item_ids)

    return queryset

