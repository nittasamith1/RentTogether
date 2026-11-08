from decimal import Decimal
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import College, User
from apps.marketplace.models import Category
from apps.listings.models import Item
from apps.bookings.models import Booking


class ListingUpdatesAPITests(APITestCase):
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

        self.item = Item.objects.create(
            owner=self.owner,
            category=self.category,
            title="Rigol Oscilloscope",
            description="4 channel 100MHz digital scope.",
            original_price=Decimal("38000.00"),
            rental_price_per_day=Decimal("180.00"),
            security_deposit=Decimal("1500.00"),
            min_rental_days=1,
            max_rental_days=10,
            pickup_location="ECE Lab",
            status=Item.STATUS_ACTIVE
        )

        # Existing confirmed booking at ₹180/day
        self.booking = Booking.objects.create(
            booking_reference="RT-UP-001",
            item=self.item,
            item_title=self.item.title,
            owner=self.owner,
            renter=self.renter,
            status=Booking.STATUS_APPROVED,
            start_date=timezone.now() + timezone.timedelta(days=2),
            end_date=timezone.now() + timezone.timedelta(days=5),
            rental_price_inr=Decimal("540.00"),
            reference_purchase_price_inr=Decimal("38000.00")
        )

        self.detail_url = reverse('listing-detail', kwargs={'item_id': self.item.id})

    def test_owner_can_update_permitted_fields(self):
        self.client.force_authenticate(user=self.owner)
        payload = {
            'title': 'Rigol 4-Channel 100MHz Oscilloscope (Upgraded)',
            'rental_price_per_day': '200.00',
            'security_deposit': '1600.00',
            'pickup_location': 'Tech Block Gate 2'
        }
        response = self.client.patch(self.detail_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Rigol 4-Channel 100MHz Oscilloscope (Upgraded)')
        self.assertEqual(Decimal(str(response.data['rental_price_per_day'])), Decimal('200.00'))

        # Existing booking price remains preserved
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.rental_price_inr, Decimal("540.00"))

