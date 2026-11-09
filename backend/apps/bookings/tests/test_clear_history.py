from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import College, User
from apps.marketplace.models import Category
from apps.listings.models import Item
from apps.bookings.models import Booking
from apps.availability.models import ItemAvailabilityBlock


class BookingClearHistoryTests(APITestCase):
    def setUp(self):
        self.college = College.objects.create(
            name="Aditya University",
            code="ADITYA",
            domain_whitelist=["adityauniversity.in"]
        )
        self.owner = User.objects.create_user(
            email="owner_clear@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Owner",
            last_name="Student",
            college=self.college,
            email_verified=True,
            is_college_verified=True,
        )
        self.renter = User.objects.create_user(
            email="renter_clear@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Renter",
            last_name="Student",
            college=self.college,
            email_verified=True,
            is_college_verified=True,
        )

        self.category, _ = Category.objects.get_or_create(
            slug="lab-gear",
            defaults={"name": "Lab Gear", "icon_name": "FlaskConical", "is_active": True}
        )

        self.item = Item.objects.create(
            owner=self.owner,
            category=self.category,
            title="Digital Oscilloscope",
            daily_rental_price=Decimal("120.00"),
            is_published=True,
            status=Item.STATUS_ACTIVE
        )

        self.now = timezone.now()
        self.cancelled_booking = Booking.objects.create(
            item=self.item,
            item_title=self.item.title,
            owner=self.owner,
            renter=self.renter,
            start_date=self.now.date() + timedelta(days=5),
            end_date=self.now.date() + timedelta(days=7),
            total_days=2,
            daily_rate=Decimal("120.00"),
            total_rental_fee=Decimal("240.00"),
            security_deposit=Decimal("0.00"),
            platform_fee=Decimal("0.00"),
            total_amount=Decimal("240.00"),
            status=Booking.STATUS_CANCELLED
        )

        # Attach an availability block to test block cleanup
        ItemAvailabilityBlock.objects.create(
            item=self.item,
            start_date=self.cancelled_booking.start_date,
            end_date=self.cancelled_booking.end_date,
            reason=ItemAvailabilityBlock.REASON_BOOKED,
            booking_reference=self.cancelled_booking
        )

    def test_delete_cancelled_booking_record_success(self):
        self.client.force_authenticate(user=self.renter)
        url = reverse('booking-delete-record', kwargs={'booking_id': self.cancelled_booking.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Booking and block should be deleted
        self.assertFalse(Booking.objects.filter(id=self.cancelled_booking.id).exists())
        self.assertFalse(ItemAvailabilityBlock.objects.filter(booking_reference=self.cancelled_booking).exists())

    def test_cannot_delete_active_booking(self):
        active_booking = Booking.objects.create(
            item=self.item,
            item_title=self.item.title,
            owner=self.owner,
            renter=self.renter,
            start_date=self.now.date() + timedelta(days=1),
            end_date=self.now.date() + timedelta(days=3),
            total_days=2,
            daily_rate=Decimal("120.00"),
            total_rental_fee=Decimal("240.00"),
            security_deposit=Decimal("0.00"),
            platform_fee=Decimal("0.00"),
            total_amount=Decimal("240.00"),
            status=Booking.STATUS_ACTIVE
        )
        self.client.force_authenticate(user=self.renter)
        url = reverse('booking-delete-record', kwargs={'booking_id': active_booking.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Booking.objects.filter(id=active_booking.id).exists())

    def test_bulk_clear_cancelled_bookings(self):
        # Create second cancelled booking
        Booking.objects.create(
            item=self.item,
            item_title=self.item.title,
            owner=self.owner,
            renter=self.renter,
            start_date=self.now.date() + timedelta(days=10),
            end_date=self.now.date() + timedelta(days=12),
            total_days=2,
            daily_rate=Decimal("120.00"),
            total_rental_fee=Decimal("240.00"),
            security_deposit=Decimal("0.00"),
            platform_fee=Decimal("0.00"),
            total_amount=Decimal("240.00"),
            status=Booking.STATUS_REJECTED
        )

        self.client.force_authenticate(user=self.renter)
        url = reverse('booking-clear-cancelled')
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('deleted_count'), 2)
        self.assertEqual(Booking.objects.filter(renter=self.renter).count(), 0)

