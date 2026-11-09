from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import College, User
from apps.marketplace.models import Category
from apps.listings.models import Item


class SearchServiceTests(APITestCase):
    def setUp(self):
        self.college = College.objects.create(
            name="Aditya University",
            code="ADITYA",
            domain_whitelist=["adityauniversity.in"]
        )
        self.student = User.objects.create_user(
            email="samith@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Samith",
            last_name="Nitta",
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
            slug="creative-media",
            defaults={"name": "Creative & Media", "icon_name": "Camera", "is_active": True}
        )

        self.item1 = Item.objects.create(
            owner=self.student,
            category=self.category,
            title="Sony Alpha A6400 Mirrorless Camera",
            description="Ultra fast 4K filming camera for events.",
            brand="Sony",
            model_name="ILCE-6400",
            daily_rental_price=Decimal("350.00"),
            is_published=True,
            status=Item.STATUS_ACTIVE
        )

        self.item2 = Item.objects.create(
            owner=self.student,
            category=self.category,
            title="GoPro Hero 10 Black",
            description="Waterproof action sports camera with hypersmooth.",
            brand="GoPro",
            model_name="HERO10",
            daily_rental_price=Decimal("250.00"),
            is_published=True,
            status=Item.STATUS_ACTIVE
        )

        self.item3 = Item.objects.create(
            owner=self.student,
            category=self.category,
            title="DJI Ronin SC Gimbal Stabilizer",
            description="3-axis handheld stabilizer for mirrorless cameras.",
            brand="DJI",
            model_name="Ronin SC",
            daily_rental_price=Decimal("150.00"),
            is_published=True,
            status=Item.STATUS_ACTIVE
        )

        self.client.force_authenticate(user=self.renter)
        self.url = reverse('marketplace-items')

    def test_search_by_title_keyword(self):
        response = self.client.get(self.url, {'search': 'GoPro'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['title'], "GoPro Hero 10 Black")

    def test_search_by_brand(self):
        response = self.client.get(self.url, {'search': 'Sony'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['brand'], "Sony")

    def test_search_by_description_keyword(self):
        response = self.client.get(self.url, {'search': 'stabilizer'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['title'], "DJI Ronin SC Gimbal Stabilizer")

    def test_empty_search_returns_all_eligible_items(self):
        response = self.client.get(self.url, {'search': '   '})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', [])
        self.assertEqual(len(results), 3)
