from datetime import date, timedelta
from decimal import Decimal
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.accounts.models import College, User
from apps.marketplace.models import Category
from apps.listings.models import Item
from apps.bookings.models import Booking
from apps.availability.models import ItemAvailabilityBlock
from apps.availability.services.availability_service import (
    AvailabilityService,
    AvailabilityConflictError,
    AvailabilityPermissionError,
)


class AvailabilityServiceTest(TestCase):
    def setUp(self):
        self.college = College.objects.create(
            name="Aditya University",
            code="ADITYA",
            domain_whitelist=["adityauniversity.in"]
        )
        self.owner = User.objects.create_user(
            email="owner@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Owner",
            last_name="Student",
            college=self.college,
            email_verified=True,
            is_college_verified=True,
        )
        self.renter = User.objects.create_user(
            email="renter@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Renter",
            last_name="Student",
            college=self.college,
            email_verified=True,
            is_college_verified=True,
        )
        self.other_user = User.objects.create_user(
            email="other@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Other",
            last_name="Student",
            college=self.college,
            email_verified=True,
            is_college_verified=True,
        )
        self.category, _ = Category.objects.get_or_create(
            slug="academic",
            defaults={"name": "Academic", "icon_name": "BookOpen", "is_active": True}
        )
        self.item = Item.objects.create(
            owner=self.owner,
            category=self.category,
            title="Scientific Calculator FX-991",
            description="Engineering calculator in mint condition.",
            original_price=Decimal("1200.00"),
            rental_price_per_day=Decimal("30.00"),
            security_deposit=Decimal("150.00"),
            min_rental_days=1,
            max_rental_days=15,
            item_age_months=4,
            condition="LIKE_NEW",
            pickup_location="Library Ground Floor",
            status="ACTIVE"
        )
        self.today = timezone.now().date()

    def test_overlap_detection_half_open_boundaries(self):
        # Create block for days [10, 13)
        start_d = self.today + timedelta(days=10)
        end_d = self.today + timedelta(days=13)
        AvailabilityService.create_owner_block(
            item_id=str(self.item.id),
            start_date=start_d,
            end_date=end_d,
            reason=ItemAvailabilityBlock.REASON_OWNER_UNAVAILABLE,
            user=self.owner
        )

        # 1. Overlap inside: [11, 12) -> CONFLICT
        is_avail, conflict = AvailabilityService.check_item_availability(
            self.item,
            self.today + timedelta(days=11),
            self.today + timedelta(days=12)
        )
        self.assertFalse(is_avail)
        self.assertIsNotNone(conflict)

        # 2. Overlap cross end: [12, 15) -> CONFLICT
        is_avail, conflict = AvailabilityService.check_item_availability(
            self.item,
            self.today + timedelta(days=12),
            self.today + timedelta(days=15)
        )
        self.assertFalse(is_avail)

        # 3. Overlap cross start: [8, 11) -> CONFLICT
        is_avail, conflict = AvailabilityService.check_item_availability(
            self.item,
            self.today + timedelta(days=8),
            self.today + timedelta(days=11)
        )
        self.assertFalse(is_avail)

        # 4. Strict half-open consecutive interval: [13, 16) -> AVAILABLE!
        # Because previous checkout ends on day 13 morning, next rental can begin on day 13!
        is_avail, conflict = AvailabilityService.check_item_availability(
            self.item,
            self.today + timedelta(days=13),
            self.today + timedelta(days=16)
        )
        self.assertTrue(is_avail)
        self.assertIsNone(conflict)

        # 5. Preceding consecutive interval: [7, 10) -> AVAILABLE!
        is_avail, conflict = AvailabilityService.check_item_availability(
            self.item,
            self.today + timedelta(days=7),
            self.today + timedelta(days=10)
        )
        self.assertTrue(is_avail)
        self.assertIsNone(conflict)

    def test_create_owner_block_conflicts_prevented(self):
        start = self.today + timedelta(days=5)
        end = self.today + timedelta(days=8)

        AvailabilityService.create_owner_block(
            item_id=str(self.item.id),
            start_date=start,
            end_date=end,
            reason=ItemAvailabilityBlock.REASON_OWNER_UNAVAILABLE,
            user=self.owner
        )

        # Attempt to create overlapping maintenance block
        with self.assertRaises(AvailabilityConflictError):
            AvailabilityService.create_owner_block(
                item_id=str(self.item.id),
                start_date=start + timedelta(days=1),
                end_date=end + timedelta(days=2),
                reason=ItemAvailabilityBlock.REASON_MAINTENANCE,
                user=self.owner
            )

    def test_non_owner_cannot_create_or_delete_blocks(self):
        start = self.today + timedelta(days=5)
        end = self.today + timedelta(days=8)

        with self.assertRaises(AvailabilityPermissionError):
            AvailabilityService.create_owner_block(
                item_id=str(self.item.id),
                start_date=start,
                end_date=end,
                reason=ItemAvailabilityBlock.REASON_OWNER_UNAVAILABLE,
                user=self.other_user
            )

        # Create block as owner
        block = AvailabilityService.create_owner_block(
            item_id=str(self.item.id),
            start_date=start,
            end_date=end,
            reason=ItemAvailabilityBlock.REASON_OWNER_UNAVAILABLE,
            user=self.owner
        )

        # Other user tries to remove it
        with self.assertRaises(AvailabilityPermissionError):
            AvailabilityService.remove_owner_block(str(block.id), self.other_user)

        # Owner can remove it
        deleted = AvailabilityService.remove_owner_block(str(block.id), self.owner)
        self.assertTrue(deleted)
        self.assertEqual(ItemAvailabilityBlock.objects.count(), 0)

    def test_booking_temporary_hold_and_cleanup(self):
        booking = Booking.objects.create(
            item=self.item,
            item_title=self.item.title,
            owner=self.owner,
            renter=self.renter,
            start_date=timezone.now() + timedelta(days=4),
            end_date=timezone.now() + timedelta(days=7),
        )

        hold_block = AvailabilityService.create_booking_hold(booking, expires_in_minutes=10)
        self.assertIsNotNone(hold_block)
        self.assertEqual(hold_block.reason, ItemAvailabilityBlock.REASON_BOOKED)
        self.assertIsNotNone(hold_block.expires_at)
        self.assertTrue(hold_block.is_active)

        # While hold is active, dates are unavailable
        is_avail, _ = AvailabilityService.check_item_availability(
            self.item,
            (timezone.now() + timedelta(days=5)).date(),
            (timezone.now() + timedelta(days=6)).date()
        )
        self.assertFalse(is_avail)

        # Simulate hold expiration
        hold_block.expires_at = timezone.now() - timedelta(minutes=1)
        hold_block.save(update_fields=['expires_at'])

        # Now check availability -> expired hold automatically cleaned up!
        is_avail, _ = AvailabilityService.check_item_availability(
            self.item,
            (timezone.now() + timedelta(days=5)).date(),
            (timezone.now() + timedelta(days=6)).date()
        )
        self.assertTrue(is_avail)
        self.assertEqual(ItemAvailabilityBlock.objects.filter(booking_reference=booking).count(), 0)

    def test_booking_hold_confirmation_and_release(self):
        booking = Booking.objects.create(
            item=self.item,
            item_title=self.item.title,
            owner=self.owner,
            renter=self.renter,
            start_date=timezone.now() + timedelta(days=4),
            end_date=timezone.now() + timedelta(days=7),
        )

        AvailabilityService.create_booking_hold(booking, expires_in_minutes=10)

        # Confirm booking on payment success
        confirmed_block = AvailabilityService.confirm_booking_block(booking)
        self.assertIsNone(confirmed_block.expires_at)  # Permanent reservation

        # Owner cannot manually delete confirmed booking block
        with self.assertRaises(AvailabilityPermissionError):
            AvailabilityService.remove_owner_block(str(confirmed_block.id), self.owner)

        # When booking cancelled/released, block is cleared
        deleted_count = AvailabilityService.release_booking_block(booking)
        self.assertEqual(deleted_count, 1)
        self.assertEqual(ItemAvailabilityBlock.objects.filter(booking_reference=booking).count(), 0)

