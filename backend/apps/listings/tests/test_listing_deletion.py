from decimal import Decimal
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import College, User
from apps.marketplace.models import Category
from apps.listings.models import Item
from apps.bookings.models import Booking


class ListingDeletionAPITests(APITestCase):
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
            slug="daily-essentials",
            defaults={"name": "Daily Essentials", "icon_name": "Package", "is_active": True}
        )

        self.item = Item.objects.create(
            owner=self.owner,
            category=self.category,
            title="Folding Bed Study Table",
            original_price=Decimal("1200.00"),
            rental_price_per_day=Decimal("25.00"),
            status=Item.STATUS_ACTIVE
        )

        # Historical completed booking
        self.booking = Booking.objects.create(
            booking_reference="RT-DEL-001",
            item=self.item,
            item_title=self.item.title,
            owner=self.owner,
            renter=self.renter,
            status=Booking.STATUS_COMPLETED,
            start_date=timezone.now() - timezone.timedelta(days=10),
            end_date=timezone.now() - timezone.timedelta(days=7),
            rental_price_inr=Decimal("75.00"),
            reference_purchase_price_inr=Decimal("1200.00")
        )

        self.delete_url = reverse('listing-detail', kwargs={'item_id': self.item.id})

    def test_soft_delete_preserves_record_and_booking_history(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(self.delete_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Database record still exists (soft-deleted)
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, Item.STATUS_REMOVED)
        self.assertIsNotNone(self.item.removed_at)
        self.assertFalse(self.item.is_published)

        # Booking history remains untouched
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.item_id, self.item.id)
        self.assertEqual(self.booking.rental_price_inr, Decimal("75.00"))

