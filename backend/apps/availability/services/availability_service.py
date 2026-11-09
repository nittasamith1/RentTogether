from datetime import date, datetime, time, timedelta
from typing import Optional, Tuple, List, Union
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django.core.exceptions import ValidationError, PermissionDenied

from apps.availability.models import ItemAvailabilityBlock
from apps.listings.models import Item


def normalize_to_datetime(val, default_time=time(0, 0)):
    if val is None:
        return None
    current_tz = timezone.get_current_timezone()
    if isinstance(val, str):
        val = val.strip()
        try:
            if 'T' in val or ' ' in val:
                parsed = datetime.fromisoformat(val.replace('Z', '+00:00'))
                return timezone.make_aware(parsed, current_tz) if timezone.is_naive(parsed) else parsed
            else:
                d = datetime.strptime(val, "%Y-%m-%d").date()
                return timezone.make_aware(datetime.combine(d, default_time), current_tz)
        except ValueError:
            pass
    if isinstance(val, datetime):
        return timezone.make_aware(val, current_tz) if timezone.is_naive(val) else val
    if isinstance(val, date):
        return timezone.make_aware(datetime.combine(val, default_time), current_tz)
    return val


class AvailabilityConflictError(Exception):
    """Raised when an availability block overlaps with an existing reservation or block."""
    def __init__(self, message: str, conflicting_block: Optional[ItemAvailabilityBlock] = None):
        super().__init__(message)
        self.conflicting_block = conflicting_block


class AvailabilityPermissionError(Exception):
    """Raised when an unauthorized user attempts to modify availability."""
    pass


class AvailabilityService:
    """
    Centralized business logic for conflict-free item availability scheduling.
    Enforces half-open interval [start_datetime, end_datetime):
      - start_datetime is inclusive
      - end_datetime is exclusive
    """

    DEFAULT_HOLD_MINUTES = 10

    @classmethod
    def cleanup_expired_holds(cls, item: Optional[Item] = None) -> int:
        """
        Deletes expired temporary booking holds so dates become available again.
        """
        now = timezone.now()
        qs = ItemAvailabilityBlock.objects.filter(
            reason=ItemAvailabilityBlock.REASON_BOOKED,
            expires_at__isnull=False,
            expires_at__lte=now
        )
        if item:
            qs = qs.filter(item=item)
        
        count, _ = qs.delete()
        return count

    @classmethod
    def get_item_availability(
        cls,
        item: Item,
        start_date: Optional[Union[date, datetime]] = None,
        end_date: Optional[Union[date, datetime]] = None
    ) -> List[ItemAvailabilityBlock]:
        """
        Returns all active unavailable blocks for an item within an optional window.
        Automatically purges expired payment holds first.
        """
        cls.cleanup_expired_holds(item)

        now = timezone.now()
        today = now.date()
        qs = ItemAvailabilityBlock.objects.filter(item=item).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=now)
        )

        start_dt = normalize_to_datetime(start_date, time(0, 0)) if start_date else None
        end_dt = normalize_to_datetime(end_date, time(0, 0)) if end_date else None

        if start_dt and end_dt:
            # Half-open overlap condition: start_dt < block.end_datetime AND end_dt > block.start_datetime
            qs = qs.filter(start_datetime__lt=end_dt, end_datetime__gt=start_dt)
        elif start_dt:
            qs = qs.filter(end_datetime__gt=start_dt)
        elif end_dt:
            qs = qs.filter(start_datetime__lt=end_dt)
        else:
            qs = qs.filter(Q(end_datetime__gt=now) | Q(end_date__gte=today))

        return list(qs.order_by('start_datetime', 'end_datetime'))

    @classmethod
    def check_item_availability(
        cls,
        item: Item,
        start_date: Union[date, datetime],
        end_date: Union[date, datetime],
        exclude_block_id: Optional[str] = None
    ) -> Tuple[bool, Optional[ItemAvailabilityBlock]]:
        """
        Checks whether an item is available for rental between start and end [start, end).
        Returns (True, None) if completely available, or (False, conflicting_block) if a conflict exists.
        """
        start_dt = normalize_to_datetime(start_date, time(0, 0))
        end_dt = normalize_to_datetime(end_date, time(0, 0))

        if start_dt >= end_dt:
            raise ValidationError("End time must be strictly after start time (half-open [start, end)).")

        cls.cleanup_expired_holds(item)

        now = timezone.now()
        qs = ItemAvailabilityBlock.objects.filter(
            item=item,
            start_datetime__lt=end_dt,
            end_datetime__gt=start_dt
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=now)
        )

        if exclude_block_id:
            qs = qs.exclude(id=exclude_block_id)

        conflicting_block = qs.first()
        if conflicting_block:
            return False, conflicting_block

        return True, None

    @classmethod
    @transaction.atomic
    def create_owner_block(
        cls,
        item_id: str,
        start_date: date,
        end_date: date,
        reason: str,
        user
    ) -> ItemAvailabilityBlock:
        """
        Creates a manual owner block (OWNER_UNAVAILABLE or MAINTENANCE) with strict row-locking
        and conflict detection.
        """
        if reason not in (ItemAvailabilityBlock.REASON_OWNER_UNAVAILABLE, ItemAvailabilityBlock.REASON_MAINTENANCE):
            raise ValidationError(f"Invalid manual block reason: '{reason}'. Allowed: OWNER_UNAVAILABLE, MAINTENANCE.")

        if start_date >= end_date:
            raise ValidationError("End date must be strictly after start date.")

        today = timezone.now().date()
        if start_date < today:
            raise ValidationError("Cannot create availability blocks for past dates.")

        # Row-lock item
        try:
            item = Item.objects.select_for_update(of=('self',)).get(id=item_id)
        except Item.DoesNotExist:
            raise ValidationError("Item does not exist.")

        # Verify permissions
        if item.owner != user:
            raise AvailabilityPermissionError("Only the item owner can manage availability blocks for this item.")

        if item.status == 'REMOVED':
            raise ValidationError("Cannot manage availability for permanently removed items.")

        # Check college isolation
        if getattr(user, 'college', None) and getattr(item.owner, 'college', None) and item.owner.college != user.college:
            raise AvailabilityPermissionError("Cross-college availability operations are forbidden.")

        # Check overlap
        is_available, conflict = cls.check_item_availability(item, start_date, end_date)
        if not is_available:
            raise AvailabilityConflictError(
                f"Selected dates [{start_date} to {end_date}) conflict with an existing {conflict.reason} block.",
                conflicting_block=conflict
            )

        block = ItemAvailabilityBlock(
            item=item,
            start_date=start_date,
            end_date=end_date,
            reason=reason,
            booking_reference=None,
            expires_at=None
        )
        block.full_clean()
        block.save()
        return block

    @classmethod
    @transaction.atomic
    def remove_owner_block(cls, block_id: str, user) -> bool:
        """
        Deletes a manual availability block. Rejects deleting booking-generated blocks.
        """
        try:
            block = ItemAvailabilityBlock.objects.select_for_update(of=('self',)).get(id=block_id)
        except ItemAvailabilityBlock.DoesNotExist:
            raise ValidationError("Availability block not found.")

        if block.reason == ItemAvailabilityBlock.REASON_BOOKED or block.booking_reference is not None:
            raise AvailabilityPermissionError("Booking-generated availability blocks cannot be manually removed.")

        if block.item.owner != user:
            raise AvailabilityPermissionError("Only the item owner can delete their manual availability blocks.")

        block.delete()
        return True

    @classmethod
    @transaction.atomic
    def create_booking_hold(
        cls,
        booking,
        expires_in_minutes: int = DEFAULT_HOLD_MINUTES
    ) -> ItemAvailabilityBlock:
        """
        Places a concurrency-safe temporary reservation hold for a booking during checkout/payment.
        Uses select_for_update() row locking to guarantee serialization.
        """
        item = Item.objects.select_for_update(of=('self',)).get(id=booking.item_id)
        
        # Normalize datetimes and dates
        start_date = booking.start_date
        end_date = booking.end_date
        start_dt = booking.start_datetime or normalize_to_datetime(start_date, time(0, 0))
        end_dt = booking.end_datetime or normalize_to_datetime(end_date, time(0, 0))

        if not start_date or not end_date:
            current_tz = timezone.get_current_timezone()
            local_start = timezone.localtime(start_dt, current_tz) if timezone.is_aware(start_dt) else start_dt
            local_end = timezone.localtime(end_dt, current_tz) if timezone.is_aware(end_dt) else end_dt
            start_date = local_start.date()
            if local_end.date() > start_date:
                end_date = local_end.date()
            else:
                end_date = start_date + timedelta(days=1)
        elif end_date <= start_date:
            end_date = start_date + timedelta(days=1)

        if start_dt >= end_dt:
            raise ValidationError("Rental end time must be strictly after rental start time.")

        cls.cleanup_expired_holds(item)

        # Check conflict excluding existing block for this booking (if re-attempting)
        existing_block = ItemAvailabilityBlock.objects.filter(booking_reference=booking).first()
        exclude_id = str(existing_block.id) if existing_block else None

        is_available, conflict = cls.check_item_availability(item, start_dt, end_dt, exclude_block_id=exclude_id)
        if not is_available:
            raise AvailabilityConflictError(
                f"Item is not available for requested period [{start_dt} to {end_dt}). Conflicting with {conflict.reason}.",
                conflicting_block=conflict
            )

        expires_at = timezone.now() + timedelta(minutes=expires_in_minutes)

        if existing_block:
            existing_block.start_date = start_date
            existing_block.end_date = end_date
            existing_block.start_datetime = start_dt
            existing_block.end_datetime = end_dt
            existing_block.expires_at = expires_at
            existing_block.reason = ItemAvailabilityBlock.REASON_BOOKED
            existing_block.save()
            return existing_block
        else:
            block = ItemAvailabilityBlock.objects.create(
                item=item,
                start_date=start_date,
                end_date=end_date,
                start_datetime=start_dt,
                end_datetime=end_dt,
                reason=ItemAvailabilityBlock.REASON_BOOKED,
                booking_reference=booking,
                expires_at=expires_at
            )
            return block

    @classmethod
    @transaction.atomic
    def confirm_booking_block(cls, booking) -> Optional[ItemAvailabilityBlock]:
        """
        Confirms a booking hold upon verified payment success, making it permanent (expires_at=None).
        """
        try:
            block = ItemAvailabilityBlock.objects.select_for_update(of=('self',)).get(booking_reference=booking)
            block.expires_at = None
            block.save(update_fields=['expires_at', 'updated_at'])
            return block
        except ItemAvailabilityBlock.DoesNotExist:
            # If for some reason block was deleted, recreate it permanently if dates still free
            start_date = booking.start_date
            end_date = booking.end_date
            start_dt = booking.start_datetime or normalize_to_datetime(start_date, time(0, 0))
            end_dt = booking.end_datetime or normalize_to_datetime(end_date, time(0, 0))
            if not start_date or not end_date:
                current_tz = timezone.get_current_timezone()
                local_start = timezone.localtime(start_dt, current_tz) if timezone.is_aware(start_dt) else start_dt
                local_end = timezone.localtime(end_dt, current_tz) if timezone.is_aware(end_dt) else end_dt
                start_date = local_start.date()
                if local_end.date() > start_date:
                    end_date = local_end.date()
                else:
                    end_date = start_date + timedelta(days=1)
            elif end_date <= start_date:
                end_date = start_date + timedelta(days=1)
            block = ItemAvailabilityBlock.objects.create(
                item=booking.item,
                start_date=start_date,
                end_date=end_date,
                start_datetime=start_dt,
                end_datetime=end_dt,
                reason=ItemAvailabilityBlock.REASON_BOOKED,
                booking_reference=booking,
                expires_at=None
            )
            return block

    @classmethod
    @transaction.atomic
    def release_booking_block(cls, booking) -> int:
        """
        Releases dates reserved for a booking when payment fails, expires, or booking is cancelled.
        """
        deleted_count, _ = ItemAvailabilityBlock.objects.filter(booking_reference=booking).delete()
        return deleted_count

    @classmethod
    @transaction.atomic
    def extend_booking_block(cls, booking, new_end_date: date) -> ItemAvailabilityBlock:
        """
        Extends an active rental period transactionally after verifying no overlapping conflicts.
        """
        block = ItemAvailabilityBlock.objects.select_for_update(of=('self',)).get(booking_reference=booking)
        if new_end_date <= block.end_date:
            raise ValidationError("Extended end date must be after current rental end date.")

        # Check availability for extension portion [block.end_date, new_end_date)
        is_available, conflict = cls.check_item_availability(
            block.item,
            block.end_date,
            new_end_date,
            exclude_block_id=str(block.id)
        )
        if not is_available:
            raise AvailabilityConflictError(
                f"Extension dates conflict with an existing {conflict.reason} block.",
                conflicting_block=conflict
            )

        block.end_date = new_end_date
        block.save(update_fields=['end_date', 'updated_at'])
        return block
