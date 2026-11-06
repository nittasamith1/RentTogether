import uuid
from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import College, User
from apps.marketplace.models import Category
from apps.listings.models import Item


class CategoryCatalogTests(APITestCase):
    def setUp(self):
        self.college = College.objects.create(
            name="Aditya University",
            code="ADITYA",
            domain_whitelist=["adityauniversity.in"]
        )
        self.verified_student = User.objects.create_user(
            email="samith@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Samith",
            last_name="Nitta",
            college=self.college,
            email_verified=True,
            is_college_verified=True,
        )
        self.unverified_student = User.objects.create_user(
            email="unverified@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Pending",
            last_name="Student",
            college=self.college,
            email_verified=True,
            is_college_verified=False,
        )

        self.cat_active1, _ = Category.objects.get_or_create(
            slug="electronics",
            defaults={"name": "Electronics", "icon_name": "Laptop", "display_order": 1, "is_active": True}
        )
        self.cat_active2, _ = Category.objects.get_or_create(
            slug="academic",
            defaults={"name": "Academic", "icon_name": "BookOpen", "display_order": 2, "is_active": True}
        )
        self.cat_inactive, _ = Category.objects.get_or_create(
            slug="hidden",
            defaults={"name": "Hidden Category", "icon_name": "EyeOff", "display_order": 99, "is_active": False}
        )
        self.cat_inactive.is_active = False
        self.cat_inactive.save()

        # Create one item in Academic
        Item.objects.create(
            owner=self.verified_student,
            category=self.cat_active2,
            title="Scientific Calculator",
            description="Casio calculator for exams",
            condition=Item.CONDITION_LIKE_NEW,
            daily_rental_price=Decimal("30.00"),
            is_published=True,
            status=Item.STATUS_ACTIVE
        )

        self.url = reverse('marketplace-categories')

    def test_anonymous_user_cannot_access_categories(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unverified_student_cannot_access_categories(self):
        self.client.force_authenticate(user=self.unverified_student)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_verified_student_receives_active_categories_with_item_counts(self):
        self.client.force_authenticate(user=self.verified_student)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        slugs = [c['slug'] for c in response.data]
        self.assertIn('electronics', slugs)
        self.assertIn('academic', slugs)
        self.assertNotIn('hidden', slugs)

        # Check eligible item count
        academic_cat = next(c for c in response.data if c['slug'] == 'academic')
        self.assertEqual(academic_cat['eligible_item_count'], 1)

        electronics_cat = next(c for c in response.data if c['slug'] == 'electronics')
        self.assertEqual(electronics_cat['eligible_item_count'], 0)
