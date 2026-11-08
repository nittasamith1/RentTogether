from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import College, User
from apps.marketplace.models import Category
from apps.listings.models import Item


class ListingStatusAPITests(APITestCase):
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
            slug="creative-media",
            defaults={"name": "Creative & Media", "icon_name": "Camera", "is_active": True}
        )

        self.item = Item.objects.create(
            owner=self.owner,
            category=self.category,
            title="GoPro Hero 10",
            original_price=Decimal("38000.00"),
            rental_price_per_day=Decimal("250.00"),
            status=Item.STATUS_ACTIVE
        )

        self.status_url = reverse('listing-status-update', kwargs={'item_id': self.item.id})

    def test_owner_can_pause_and_resume_listing(self):
        self.client.force_authenticate(user=self.owner)

        # 1. Pause
        res_pause = self.client.patch(self.status_url, {'status': 'PAUSED'}, format='json')
        self.assertEqual(res_pause.status_code, status.HTTP_200_OK)
        self.assertEqual(res_pause.data['status'], Item.STATUS_PAUSED)
        self.assertFalse(res_pause.data['is_published'])

        # Renter should not see paused item in marketplace
        self.client.force_authenticate(user=self.renter)
        marketplace_res = self.client.get(reverse('marketplace-items'))
        item_ids = [i['id'] for i in marketplace_res.data.get('results', [])]
        self.assertNotIn(str(self.item.id), item_ids)

        # 2. Resume
        self.client.force_authenticate(user=self.owner)
        res_resume = self.client.patch(self.status_url, {'status': 'ACTIVE'}, format='json')
        self.assertEqual(res_resume.status_code, status.HTTP_200_OK)
        self.assertEqual(res_resume.data['status'], Item.STATUS_ACTIVE)
        self.assertTrue(res_resume.data['is_published'])

    def test_invalid_status_transition_rejected(self):
        self.client.force_authenticate(user=self.owner)
        res = self.client.patch(self.status_url, {'status': 'BOGUS'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

