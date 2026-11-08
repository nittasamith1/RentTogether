from datetime import datetime, date, time
from django.utils import timezone
from django.db.models import Q
from apps.bookings.models import Booking


CONFLICTING_STATUSES = [Booking.STATUS_APPROVED, Booking.STATUS_ACTIVE]


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
    """
    if item.status != 'ACTIVE' or not item.is_published:
        return False

    now = timezone.now()
    if not start_dt:
        start_dt = now
    if not end_dt:
        end_dt = start_dt + timezone.timedelta(days=1)

    # Check conflicting confirmed/active bookings
    conflicts = Booking.objects.filter(
        item=item,
        status__in=CONFLICTING_STATUSES,
        start_date__lt=end_dt,
        end_date__gt=start_dt
    ).exists()

    return not conflicts


def filter_available_items(queryset, available_now: bool = False, start_date=None, end_date=None):
    """
    Filters an Item queryset by availability constraints.
    """
    now = timezone.now()

    if available_now:
        # Exclude items currently checked out
        currently_rented_item_ids = Booking.objects.filter(
            status__in=CONFLICTING_STATUSES,
            start_date__lte=now,
            end_date__gte=now,
            item__isnull=False
        ).values_list('item_id', flat=True)
        return queryset.exclude(id__in=currently_rented_item_ids)

    if start_date and end_date:
        start_dt = parse_date_boundary(start_date, is_end=False)
        end_dt = parse_date_boundary(end_date, is_end=True)

        if start_dt and end_dt:
            conflicting_item_ids = Booking.objects.filter(
                status__in=CONFLICTING_STATUSES,
                start_date__lt=end_dt,
                end_date__gt=start_dt,
                item__isnull=False
            ).values_list('item_id', flat=True)
            return queryset.exclude(id__in=conflicting_item_ids)

    return queryset

