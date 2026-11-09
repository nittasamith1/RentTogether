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


class ItemAvailabilityBlockModelTest(TestCase):
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

    def test_valid_owner_block_creation(self):
        start = self.today + timedelta(days=2)
        end = self.today + timedelta(days=5)
        block = ItemAvailabilityBlock.objects.create(
            item=self.item,
            start_date=start,
            end_date=end,
            reason=ItemAvailabilityBlock.REASON_OWNER_UNAVAILABLE
        )
        self.assertIsNotNone(block.id)
        self.assertEqual(block.duration_days, 3)
        self.assertTrue(block.is_active)
        self.assertEqual(str(block), f"Scientific Calculator FX-991 [{start} to {end}) (OWNER_UNAVAILABLE)")

    def test_invalid_date_range_start_equals_or_after_end(self):
        start = self.today + timedelta(days=5)
        end = self.today + timedelta(days=2)

        block = ItemAvailabilityBlock(
            item=self.item,
            start_date=start,
            end_date=end,
            reason=ItemAvailabilityBlock.REASON_OWNER_UNAVAILABLE
        )
        with self.assertRaises(ValidationError):
            block.save()

        # Equal start and end
        block.end_date = start
        with self.assertRaises(ValidationError):
            block.save()

    def test_booked_reason_requires_booking_reference(self):
        start = self.today + timedelta(days=2)
        end = self.today + timedelta(days=4)

        block = ItemAvailabilityBlock(
            item=self.item,
            start_date=start,
            end_date=end,
            reason=ItemAvailabilityBlock.REASON_BOOKED,
            booking_reference=None
        )
        with self.assertRaises(ValidationError):
            block.save()

    def test_manual_block_cannot_have_booking_reference(self):
        start = self.today + timedelta(days=2)
        end = self.today + timedelta(days=4)

        booking = Booking.objects.create(
            item=self.item,
            item_title=self.item.title,
            owner=self.owner,
            renter=self.renter,
            start_date=timezone.now() + timedelta(days=2),
            end_date=timezone.now() + timedelta(days=4),
        )

        block = ItemAvailabilityBlock(
            item=self.item,
            start_date=start,
            end_date=end,
            reason=ItemAvailabilityBlock.REASON_OWNER_UNAVAILABLE,
            booking_reference=booking
        )
        with self.assertRaises(ValidationError):
            block.save()

    def test_expires_at_only_allowed_on_booked_blocks(self):
        start = self.today + timedelta(days=2)
        end = self.today + timedelta(days=4)

        block = ItemAvailabilityBlock(
            item=self.item,
            start_date=start,
            end_date=end,
            reason=ItemAvailabilityBlock.REASON_MAINTENANCE,
            expires_at=timezone.now() + timedelta(minutes=10)
        )
        with self.assertRaises(ValidationError):
            block.save()

    def test_removed_item_cannot_have_availability_blocks(self):
        self.item.status = "REMOVED"
        self.item.save()

        start = self.today + timedelta(days=2)
        end = self.today + timedelta(days=4)

        block = ItemAvailabilityBlock(
            item=self.item,
            start_date=start,
            end_date=end,
            reason=ItemAvailabilityBlock.REASON_OWNER_UNAVAILABLE
        )
        with self.assertRaises(ValidationError):
            block.save()

