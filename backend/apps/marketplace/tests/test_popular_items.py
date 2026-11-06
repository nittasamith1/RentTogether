from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import College, User
from apps.marketplace.models import Category, Wishlist
from apps.listings.models import Item
from apps.bookings.models import Booking


class PopularItemsEngineTests(APITestCase):
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
        self.renter1 = User.objects.create_user(
            email="renter1@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Renter",
            last_name="One",
            college=self.college,
            email_verified=True,
            is_college_verified=True,
        )
        self.renter2 = User.objects.create_user(
            email="renter2@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Renter",
            last_name="Two",
            college=self.college,
            email_verified=True,
            is_college_verified=True,
        )

        self.category, _ = Category.objects.get_or_create(
            slug="electronics",
            defaults={"name": "Electronics", "icon_name": "Laptop", "is_active": True}
        )

        self.item_low = Item.objects.create(
            owner=self.owner,
            category=self.category,
            title="Regular Keyboard",
            daily_rental_price=Decimal("20.00"),
            is_published=True,
            status=Item.STATUS_ACTIVE
        )

        self.item_popular = Item.objects.create(
            owner=self.owner,
            category=self.category,
            title="Popular Camera Drone",
            daily_rental_price=Decimal("400.00"),
            is_published=True,
            status=Item.STATUS_ACTIVE
        )

        # Give item_popular 2 wishlists
        Wishlist.objects.create(user=self.renter1, item=self.item_popular)
        Wishlist.objects.create(user=self.renter2, item=self.item_popular)

        self.client.force_authenticate(user=self.renter1)
        self.url = reverse('marketplace-popular')

    def test_popular_items_returns_ranked_results(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        items = response.data
        self.assertTrue(len(items) >= 1)
        # item_popular has wishlists, so it should rank higher
        self.assertEqual(items[0]['id'], str(self.item_popular.id))
