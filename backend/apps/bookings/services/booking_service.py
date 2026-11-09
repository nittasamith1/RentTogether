from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Optional, Union
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django.core.exceptions import ValidationError, PermissionDenied

from apps.bookings.models import Booking
from apps.listings.models import Item
from apps.availability.services.availability_service import (
    AvailabilityService,
    AvailabilityConflictError,
    normalize_to_datetime,
)
from apps.bookings.services.booking_state_machine import (
    BookingStateMachine,
    BookingPermissionError,
)
from apps.notifications.services import send_notification


class BookingService:
    """
    Business service for creating, querying, and managing rental bookings.
    Supports both hourly and daily rentals with exact decimal arithmetic.
    """

    @classmethod
    @transaction.atomic
    def create_booking_request(
        cls,
        renter_user,
        item_id: str,
        start_date: Optional[Union[date, str]] = None,
        end_date: Optional[Union[date, str]] = None,
        start_datetime: Optional[Union[datetime, str]] = None,
        end_datetime: Optional[Union[datetime, str]] = None,
        pickup_spot: str = ""
    ) -> Booking:
        """
        Validates, calculates server-authoritative pricing (daily_rate / 24 * hours),
        and creates a PENDING_APPROVAL booking.
        """
        if not getattr(renter_user, 'is_college_verified', False):
            raise BookingPermissionError("Verified student status is required to request campus rentals.")

        try:
            item = Item.objects.select_for_update(of=('self',)).get(id=item_id)
        except Item.DoesNotExist:
            raise ValidationError("Target equipment listing does not exist.")

        if item.status != 'ACTIVE':
            raise ValidationError(f"This listing is currently {item.status.lower()} and cannot receive rental requests.")

        # Self-booking prevention
        if item.owner_id == renter_user.id:
            raise ValidationError("You cannot rent your own listed equipment.")

        # College tenant isolation
        renter_college = getattr(renter_user, 'college', None)
        owner_college = getattr(item.owner, 'college', None)
        if renter_college and owner_college and renter_college != owner_college:
            raise BookingPermissionError("Cross-college rentals are prohibited. You can only rent items from your campus.")

        # Resolve datetimes
        current_tz = timezone.get_current_timezone()
        if start_datetime and end_datetime:
            start_dt = normalize_to_datetime(start_datetime, time(0, 0))
            end_dt = normalize_to_datetime(end_datetime, time(0, 0))
        elif start_date and end_date:
            start_dt = normalize_to_datetime(start_date, time(0, 0))
            end_dt = normalize_to_datetime(end_date, time(0, 0))
        else:
            raise ValidationError("Rental schedule requires valid start and end dates/times.")

        if start_dt >= end_dt:
            raise ValidationError("End time must be strictly after start time (half-open [start_datetime, end_datetime)).")

        now = timezone.now()
        if start_dt < now - timedelta(minutes=5):
            raise ValidationError("Cannot reserve rental periods starting in the past.")

        diff_seconds = (end_dt - start_dt).total_seconds()
        if diff_seconds <= 0:
            raise ValidationError("Rental duration must be greater than zero.")

        duration_hours = Decimal(str(round(diff_seconds / 3600.0, 4))).quantize(Decimal('0.01'))
        if start_date and end_date:
            if isinstance(start_date, str):
                s_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            else:
                s_date = start_date
            if isinstance(end_date, str):
                e_date = datetime.strptime(end_date, "%Y-%m-%d").date()
            else:
                e_date = end_date
            if e_date <= s_date:
                e_date = s_date + timedelta(days=1)
        else:
            local_start = timezone.localtime(start_dt, current_tz) if timezone.is_aware(start_dt) else start_dt
            local_end = timezone.localtime(end_dt, current_tz) if timezone.is_aware(end_dt) else end_dt
            s_date = local_start.date()
            if local_end.date() > s_date:
                e_date = local_end.date()
            else:
                e_date = s_date + timedelta(days=1)
        total_days = max(1, (e_date - s_date).days)

        if total_days > item.max_rental_days:
            raise ValidationError(f"Maximum rental duration is {item.max_rental_days} days.")

        # Advisory availability check using half-open interval
        is_available, conflict = AvailabilityService.check_item_availability(item, start_dt, end_dt)
        if not is_available:
            raise AvailabilityConflictError(
                f"Item is already unavailable for requested interval [{start_dt} to {end_dt}) due to {conflict.reason}.",
                conflicting_block=conflict
            )

        # Server-authoritative monetary calculations:
        # Hourly Rate = Daily Rental Price / 24
        # Total Rental Amount = Hourly Rate * Total Rental Hours
        daily_rate = Decimal(str(item.rental_price_per_day))
        hourly_rate = (daily_rate / Decimal('24')).quantize(Decimal('0.01'))
        total_rental_fee = (hourly_rate * duration_hours).quantize(Decimal('0.01'))
        security_deposit = Decimal('0.00')
        platform_fee = Decimal('0.00')
        total_amount = total_rental_fee

        approval_deadline = now + timedelta(hours=BookingStateMachine.APPROVAL_WINDOW_HOURS)

        booking = Booking(
            item=item,
            item_title=item.title,
            owner=item.owner,
            renter=renter_user,
            start_date=s_date,
            end_date=e_date,
            start_datetime=start_dt,
            end_datetime=end_dt,
            total_days=total_days,
            total_duration_hours=duration_hours,
            daily_rate=daily_rate,
            hourly_rate=hourly_rate,
            total_rental_fee=total_rental_fee,
            security_deposit=security_deposit,
            platform_fee=platform_fee,
            total_amount=total_amount,
            status=Booking.STATUS_PENDING_APPROVAL,
            approval_deadline=approval_deadline,
            pickup_spot=pickup_spot or item.pickup_location or "Campus Handover Spot"
        )
        booking.full_clean()
        booking.save()

        # Place temporary reservation hold
        AvailabilityService.create_booking_hold(booking)

        # Audit history
        BookingStateMachine.record_transition(
            booking=booking,
            previous_status=None,
            new_status=Booking.STATUS_PENDING_APPROVAL,
            changed_by=renter_user,
            reason="Renter submitted rental booking request.",
            metadata={
                "daily_rate": str(daily_rate),
                "hourly_rate": str(hourly_rate),
                "total_duration_hours": str(duration_hours),
                "total_days": total_days,
                "total_amount": str(total_amount),
            }
        )

        # Notify Owner
        duration_desc = f"{duration_hours} hours" if duration_hours < 24 else f"{total_days} days ({duration_hours} hrs)"
        send_notification(
            recipient=item.owner,
            actor=renter_user,
            event_type="NEW_BOOKING_REQUEST",
            title="New Rental Request Received",
            message=f"{renter_user.first_name} requested to rent {item.title} for {duration_desc} (₹{total_amount}).",
            booking=booking
        )

        return booking

    @classmethod
    def get_renter_bookings(cls, renter_user, status_filter=None, search=None):
        """Returns outgoing rentals for a student with comprehensive search support."""
        qs = Booking.objects.filter(renter=renter_user).select_related(
            'item', 'owner', 'item__owner', 'item__category', 'owner__profile'
        ).prefetch_related('item__images', 'status_history')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if search and search.strip():
            terms = search.strip().split()
            search_q = Q()
            for term in terms:
                term_q = (
                    Q(item_title__icontains=term) |
                    Q(status__icontains=term) |
                    Q(item__brand__icontains=term) |
                    Q(item__model_name__icontains=term) |
                    Q(item__category__name__icontains=term) |
                    Q(owner__first_name__icontains=term) |
                    Q(owner__last_name__icontains=term) |
                    Q(owner__email__icontains=term)
                )
                search_q &= term_q
            qs = qs.filter(search_q)
        return qs.order_by('-created_at')

    @classmethod
    def get_owner_incoming_requests(cls, owner_user, status_filter=None, search=None):
        """Returns incoming rental requests for an owner's equipment with comprehensive search support."""
        qs = Booking.objects.filter(owner=owner_user).select_related(
            'item', 'renter', 'item__owner', 'item__category', 'renter__profile'
        ).prefetch_related('item__images', 'status_history')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if search and search.strip():
            terms = search.strip().split()
            search_q = Q()
            for term in terms:
                term_q = (
                    Q(item_title__icontains=term) |
                    Q(status__icontains=term) |
                    Q(item__brand__icontains=term) |
                    Q(item__model_name__icontains=term) |
                    Q(item__category__name__icontains=term) |
                    Q(renter__first_name__icontains=term) |
                    Q(renter__last_name__icontains=term) |
                    Q(renter__email__icontains=term)
                )
                search_q &= term_q
            qs = qs.filter(search_q)
        return qs.order_by('-created_at')

    @classmethod
    def get_booking_detail(cls, booking_id: str, user) -> Booking:
        """Retrieves booking detail ensuring user is a participant or staff."""
        try:
            booking = Booking.objects.select_related(
                'item', 'owner__college', 'renter__college'
            ).prefetch_related('item__images', 'status_history').get(id=booking_id)
        except Booking.DoesNotExist:
            raise ValidationError("Booking not found.")

        if user != booking.owner and user != booking.renter and not getattr(user, 'is_staff', False):
            raise PermissionDenied("You do not have permission to view this booking.")

        return booking

