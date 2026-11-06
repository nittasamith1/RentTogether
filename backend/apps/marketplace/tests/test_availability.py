from datetime import timedelta
from decimal import Decimal
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import College, User
from apps.marketplace.models import Category
from apps.listings.models import Item
from apps.bookings.models import Booking


class AvailabilityEngineTests(APITestCase):
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
            slug="laboratory",
            defaults={"name": "Laboratory", "icon_name": "FlaskConical", "is_active": True}
        )

        self.item_booked = Item.objects.create(
            owner=self.owner,
            category=self.category,
            title="Booked Microscope",
            daily_rental_price=Decimal("120.00"),
            is_published=True,
            status=Item.STATUS_ACTIVE
        )

        self.item_free = Item.objects.create(
            owner=self.owner,
            category=self.category,
            title="Free Spectrophotometer",
            daily_rental_price=Decimal("150.00"),
            is_published=True,
            status=Item.STATUS_ACTIVE
        )

        # Booking active next week (Day +5 to Day +10)
        now = timezone.now()
        Booking.objects.create(
            item=self.item_booked,
            item_title=self.item_booked.title,
            booking_reference="RT-AVAIL-01",
            owner=self.owner,
            renter=self.renter,
            status=Booking.STATUS_APPROVED,
            start_date=now + timedelta(days=5),
            end_date=now + timedelta(days=10),
            rental_price_inr=Decimal("600.00"),
            reference_purchase_price_inr=Decimal("5000.00")
        )

        self.client.force_authenticate(user=self.renter)
        self.url = reverse('marketplace-items')

    def test_filter_by_conflicting_dates_excludes_booked_item(self):
        now = timezone.now()
        # Request overlapping window: Day +6 to Day +8
        params = {
            'start_date': (now + timedelta(days=6)).date().isoformat(),
            'end_date': (now + timedelta(days=8)).date().isoformat()
        }
        response = self.client.get(self.url, params)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', [])
        titles = [r['title'] for r in results]
        
        self.assertNotIn("Booked Microscope", titles)
        self.assertIn("Free Spectrophotometer", titles)

    def test_filter_by_non_conflicting_dates_includes_both_items(self):
        now = timezone.now()
        # Request window before the booking: Day +1 to Day +4
        params = {
            'start_date': (now + timedelta(days=1)).date().isoformat(),
            'end_date': (now + timedelta(days=4)).date().isoformat()
        }
        response = self.client.get(self.url, params)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', [])
        titles = [r['title'] for r in results]
        
        self.assertIn("Booked Microscope", titles)
        self.assertIn("Free Spectrophotometer", titles)
