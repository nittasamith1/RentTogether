from datetime import date
from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User, College
from apps.profiles.models import StudentProfile
from apps.marketplace.models import Category, Wishlist
from apps.listings.models import Item
from apps.bookings.models import Booking
from apps.notifications.models import Notification


class GlobalSearchFeatureTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.college = College.objects.create(name="Aditya University", code="ADITYA")
        self.other_college = College.objects.create(name="Other University", code="OTHER")

        # Users
        self.alice = User.objects.create_user(
            email="alice@aditya.ac.in",
            password="password123",
            college=self.college,
            first_name="Alice",
            last_name="Sharma",
            email_verified=True,
            is_college_verified=True,
        )

        self.bob = User.objects.create_user(
            email="bob@aditya.ac.in",
            password="password123",
            college=self.college,
            first_name="Bob",
            last_name="Verma",
            email_verified=True,
            is_college_verified=True,
        )

        # Categories
        self.cat_calc, _ = Category.objects.get_or_create(
            slug="academic-tools", defaults={"name": "Academic Tools", "is_active": True}
        )
        self.cat_elec, _ = Category.objects.get_or_create(
            slug="electronics", defaults={"name": "Electronics", "is_active": True}
        )

        # Bob's items (discoverable by Alice in Marketplace)
        self.calc_item = Item.objects.create(
            owner=self.bob,
            title="Casio fx-991EX Scientific Calculator",
            description="ClassWiz high-resolution solar calculator for engineering maths.",
            category=self.cat_calc,
            brand="Casio",
            model_name="fx-991EX",
            daily_rental_price=Decimal("24.00"),
            status=Item.STATUS_ACTIVE,
            is_published=True,
            pickup_locations=["Central Library", "Main Canteen"]
        )

        self.drill_item = Item.objects.create(
            owner=self.bob,
            title="Bosch 12V Cordless Drill & Screwdriver",
            description="Li-ion battery drill with 2-speed gearbox for workshop projects.",
            category=self.cat_elec,
            brand="Bosch",
            model_name="GSR 120-LI",
            daily_rental_price=Decimal("48.00"),
            status=Item.STATUS_ACTIVE,
            is_published=True,
            pickup_locations=["Mechanical Workshop"]
        )

        # Alice's own item (discoverable in My Listings, but excluded from Marketplace)
        self.alice_item = Item.objects.create(
            owner=self.alice,
            title="Mini Drafter for Engineering Drawing",
            description="Steel arms mini drafter with clamp.",
            category=self.cat_calc,
            brand="Omega",
            daily_rental_price=Decimal("15.00"),
            status=Item.STATUS_ACTIVE,
            is_published=True,
            pickup_locations=["Civil Dept"]
        )

    def test_marketplace_partial_search(self):
        """Typing partial keyword 'calc' returns the Casio calculator but not the drill."""
        self.client.force_authenticate(user=self.alice)
        url = reverse('marketplace-items')
        res = self.client.get(url, {'search': 'calc'})

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', [])
        titles = [item['title'] for item in results]

        self.assertIn(self.calc_item.title, titles)
        self.assertNotIn(self.drill_item.title, titles)
        self.assertNotIn(self.alice_item.title, titles)

    def test_marketplace_multi_word_search(self):
        """Searching 'cordless bosch' matches the drill regardless of word order."""
        self.client.force_authenticate(user=self.alice)
        url = reverse('marketplace-items')
        res = self.client.get(url, {'search': 'cordless bosch'})

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', [])
        titles = [item['title'] for item in results]

        self.assertIn(self.drill_item.title, titles)
        self.assertNotIn(self.calc_item.title, titles)

    def test_wishlist_search(self):
        """Wishlist backend search filters saved items by keyword."""
        self.client.force_authenticate(user=self.alice)
        # Alice wishlists both Bob's items
        Wishlist.objects.create(user=self.alice, item=self.calc_item)
        Wishlist.objects.create(user=self.alice, item=self.drill_item)

        url = reverse('marketplace-wishlist')
        # Search for 'bosch'
        res = self.client.get(url, {'search': 'bosch'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', [])
        titles = [item['title'] for item in results]

        self.assertEqual(len(results), 1)
        self.assertIn(self.drill_item.title, titles)

    def test_my_listings_search(self):
        """Owner can search their own listings by keyword or category."""
        self.client.force_authenticate(user=self.alice)
        url = reverse('listing-my-listings')
        res = self.client.get(url, {'search': 'drafter'})

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', [])
        titles = [item['title'] for item in results]

        self.assertIn(self.alice_item.title, titles)
        self.assertEqual(len(results), 1)

    def test_my_rentals_search(self):
        """Renter can search bookings by item title or status."""
        self.client.force_authenticate(user=self.alice)
        booking = Booking.objects.create(
            item=self.calc_item,
            owner=self.bob,
            renter=self.alice,
            item_title=self.calc_item.title,
            start_date=date(2026, 11, 10),
            end_date=date(2026, 11, 11),
            total_duration_hours=Decimal("24.00"),
            hourly_rate=Decimal("1.00"),
            total_amount=Decimal("24.00"),
            status=Booking.STATUS_ACTIVE
        )

        url = reverse('my-rentals')
        # Search by item keyword
        res = self.client.get(url, {'search': 'casio'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data.get('results', [])), 1)

        # Search by status keyword
        res_status = self.client.get(url, {'search': 'active'})
        self.assertEqual(res_status.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_status.data.get('results', [])), 1)

    def test_notifications_search(self):
        """Student can search notifications by title or message."""
        self.client.force_authenticate(user=self.alice)
        Notification.objects.create(
            recipient=self.alice,
            event_type="BOOKING_APPROVED",
            title="Calculator rental approved",
            message="Bob accepted your rental request for Casio fx-991EX."
        )
        Notification.objects.create(
            recipient=self.alice,
            event_type="SYSTEM_ALERT",
            title="Campus library hours update",
            message="Central library closes at 9 PM during exams."
        )

        url = reverse('notification-list')
        res = self.client.get(url, {'search': 'calculator'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['title'], "Calculator rental approved")
