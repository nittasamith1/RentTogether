from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import College, User
from apps.marketplace.models import Category
from apps.listings.models import Item


class OwnershipPermissionsTests(APITestCase):
    def setUp(self):
        self.college = College.objects.create(
            name="Aditya University",
            code="ADITYA",
            domain_whitelist=["adityauniversity.in"]
        )
        self.student_a = User.objects.create_user(
            email="studenta@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Student",
            last_name="A",
            college=self.college,
            email_verified=True,
            is_college_verified=True,
        )
        self.student_b = User.objects.create_user(
            email="studentb@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Student",
            last_name="B",
            college=self.college,
            email_verified=True,
            is_college_verified=True,
        )

        self.category, _ = Category.objects.get_or_create(
            slug="sports-fitness",
            defaults={"name": "Sports & Fitness", "icon_name": "Dumbbell", "is_active": True}
        )

        self.item_a = Item.objects.create(
            owner=self.student_a,
            category=self.category,
            title="Yonex Badminton Pair",
            original_price=Decimal("3000.00"),
            rental_price_per_day=Decimal("40.00"),
            status=Item.STATUS_ACTIVE
        )

        self.url = reverse('listing-detail', kwargs={'item_id': self.item_a.id})
        self.status_url = reverse('listing-status-update', kwargs={'item_id': self.item_a.id})

    def test_student_b_cannot_access_owner_management_detail_for_student_a_item(self):
        self.client.force_authenticate(user=self.student_b)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_student_b_cannot_update_student_a_item(self):
        self.client.force_authenticate(user=self.student_b)
        response = self.client.patch(self.url, {'title': 'Hacked Title'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_student_b_cannot_pause_student_a_item(self):
        self.client.force_authenticate(user=self.student_b)
        response = self.client.patch(self.status_url, {'status': 'PAUSED'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_student_b_cannot_delete_student_a_item(self):
        self.client.force_authenticate(user=self.student_b)
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

