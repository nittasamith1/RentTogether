from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import College, User
from apps.marketplace.models import Category
from apps.listings.models import Item
from apps.profiles.models import StudentProfile


class FilterEngineTests(APITestCase):
    def setUp(self):
        self.college = College.objects.create(
            name="Aditya University",
            code="ADITYA",
            domain_whitelist=["adityauniversity.in"]
        )
        self.owner_good = User.objects.create_user(
            email="topowner@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Top",
            last_name="Owner",
            college=self.college,
            email_verified=True,
            is_college_verified=True,
        )
        profile_good = self.owner_good.profile
        profile_good.reputation_as_owner = Decimal('4.90')
        profile_good.save()

        self.owner_low = User.objects.create_user(
            email="lowowner@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Low",
            last_name="Owner",
            college=self.college,
            email_verified=True,
            is_college_verified=True,
        )
        profile_low = self.owner_low.profile
        profile_low.reputation_as_owner = Decimal('3.50')
        profile_low.save()

        self.renter = User.objects.create_user(
            email="renter@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Renter",
            last_name="Student",
            college=self.college,
            email_verified=True,
            is_college_verified=True,
        )

        self.cat_tech, _ = Category.objects.get_or_create(
            slug="electronics",
            defaults={"name": "Electronics", "icon_name": "Laptop", "is_active": True}
        )
        self.cat_acad, _ = Category.objects.get_or_create(
            slug="academic",
            defaults={"name": "Academic", "icon_name": "BookOpen", "is_active": True}
        )

        self.item_cheap = Item.objects.create(
            owner=self.owner_good,
            category=self.cat_acad,
            title="Standard Calculator",
            condition=Item.CONDITION_GOOD,
            daily_rental_price=Decimal("20.00"),
            pickup_locations=["Library", "Main Gate"],
            is_published=True,
            status=Item.STATUS_ACTIVE
        )

        self.item_mid = Item.objects.create(
            owner=self.owner_good,
            category=self.cat_tech,
            title="Arduino Starter Set",
            condition=Item.CONDITION_LIKE_NEW,
            daily_rental_price=Decimal("60.00"),
            pickup_locations=["Cotton Bhavan"],
            is_published=True,
            status=Item.STATUS_ACTIVE
        )

        self.item_expensive = Item.objects.create(
            owner=self.owner_low,
            category=self.cat_tech,
            title="High-End Projector",
            condition=Item.CONDITION_BRAND_NEW,
            daily_rental_price=Decimal("200.00"),
            pickup_locations=["Library"],
            is_published=True,
            status=Item.STATUS_ACTIVE
        )

        self.client.force_authenticate(user=self.renter)
        self.url = reverse('marketplace-items')

    def test_filter_by_category_slug(self):
        response = self.client.get(self.url, {'category': 'academic'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['title'], "Standard Calculator")

    def test_filter_by_price_range(self):
        # Items between 30 and 100
        response = self.client.get(self.url, {'min_price': '30', 'max_price': '100'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['title'], "Arduino Starter Set")

    def test_filter_by_condition(self):
        response = self.client.get(self.url, {'condition': 'LIKE_NEW'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['title'], "Arduino Starter Set")

    def test_filter_by_pickup_location(self):
        response = self.client.get(self.url, {'pickup_spot': 'Library'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', [])
        self.assertEqual(len(results), 2)
        titles = [r['title'] for r in results]
        self.assertIn("Standard Calculator", titles)
        self.assertIn("High-End Projector", titles)

    def test_filter_by_min_reputation(self):
        # Filter owners with reputation >= 4.5
        response = self.client.get(self.url, {'min_rating': '4.5'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', [])
        titles = [r['title'] for r in results]
        self.assertIn("Standard Calculator", titles)
        self.assertIn("Arduino Starter Set", titles)
        self.assertNotIn("High-End Projector", titles)
