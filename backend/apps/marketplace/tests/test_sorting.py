from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import College, User
from apps.marketplace.models import Category
from apps.listings.models import Item


class SortingEngineTests(APITestCase):
    def setUp(self):
        self.college = College.objects.create(
            name="Aditya University",
            code="ADITYA",
            domain_whitelist=["adityauniversity.in"]
        )
        self.user = User.objects.create_user(
            email="samith@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Samith",
            last_name="Nitta",
            college=self.college,
            email_verified=True,
            is_college_verified=True,
        )

        self.category, _ = Category.objects.get_or_create(
            slug="tools",
            defaults={"name": "Tools", "icon_name": "Wrench", "is_active": True}
        )

        self.item_a = Item.objects.create(
            owner=self.user,
            category=self.category,
            title="Item A - Cheap",
            daily_rental_price=Decimal("10.00"),
            is_published=True,
            status=Item.STATUS_ACTIVE
        )
        self.item_b = Item.objects.create(
            owner=self.user,
            category=self.category,
            title="Item B - Expensive",
            daily_rental_price=Decimal("500.00"),
            is_published=True,
            status=Item.STATUS_ACTIVE
        )
        self.item_c = Item.objects.create(
            owner=self.user,
            category=self.category,
            title="Item C - Mid",
            daily_rental_price=Decimal("150.00"),
            is_published=True,
            status=Item.STATUS_ACTIVE
        )

        self.client.force_authenticate(user=self.user)
        self.url = reverse('marketplace-items')

    def test_sort_price_low_to_high(self):
        response = self.client.get(self.url, {'ordering': 'price_low'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', [])
        prices = [Decimal(str(r['daily_rental_price'])) for r in results]
        self.assertEqual(prices, [Decimal('10.00'), Decimal('150.00'), Decimal('500.00')])

    def test_sort_price_high_to_low(self):
        response = self.client.get(self.url, {'ordering': 'price_high'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', [])
        prices = [Decimal(str(r['daily_rental_price'])) for r in results]
        self.assertEqual(prices, [Decimal('500.00'), Decimal('150.00'), Decimal('10.00')])
