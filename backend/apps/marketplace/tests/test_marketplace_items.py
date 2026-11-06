import uuid
from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import College, User
from apps.marketplace.models import Category
from apps.listings.models import Item, ItemImage


class MarketplaceItemsAPITests(APITestCase):
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
            slug="electronics",
            defaults={"name": "Electronics", "icon_name": "Laptop", "is_active": True}
        )

        self.active_item = Item.objects.create(
            owner=self.owner,
            category=self.category,
            title="Sony Alpha A6400 Camera",
            description="Professional mirrorless camera with 4K recording and fast AF.",
            condition=Item.CONDITION_LIKE_NEW,
            brand="Sony",
            model_name="A6400",
            daily_rental_price=Decimal("350.00"),
            security_deposit=Decimal("2000.00"),
            pickup_locations=["Library Gate", "Cafeteria"],
            primary_image_url="https://example.com/camera.jpg",
            status=Item.STATUS_ACTIVE,
            is_published=True
        )

        self.draft_item = Item.objects.create(
            owner=self.owner,
            category=self.category,
            title="Draft Arduino Kit",
            description="Draft listing not ready for public viewing.",
            condition=Item.CONDITION_GOOD,
            daily_rental_price=Decimal("50.00"),
            status=Item.STATUS_DRAFT,
            is_published=True
        )

        self.inactive_item = Item.objects.create(
            owner=self.owner,
            category=self.category,
            title="Inactive Oscilloscope",
            description="Inactive listing.",
            condition=Item.CONDITION_GOOD,
            daily_rental_price=Decimal("150.00"),
            status=Item.STATUS_ACTIVE,
            is_published=False
        )

    def test_list_items_returns_only_active_published_resources(self):
        self.client.force_authenticate(user=self.renter)
        response = self.client.get(reverse('marketplace-items'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        results = response.data.get('results', [])
        titles = [item['title'] for item in results]
        self.assertIn("Sony Alpha A6400 Camera", titles)
        self.assertNotIn("Draft Arduino Kit", titles)
        self.assertNotIn("Inactive Oscilloscope", titles)

    def test_item_detail_view_success(self):
        self.client.force_authenticate(user=self.renter)
        url = reverse('marketplace-item-detail', kwargs={'item_id': self.active_item.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], str(self.active_item.id))
        self.assertEqual(response.data['title'], "Sony Alpha A6400 Camera")
        self.assertEqual(response.data['brand'], "Sony")
        self.assertFalse(response.data['is_own_item'])
        self.assertIn('owner', response.data)
        self.assertEqual(response.data['owner']['display_name'], "Owner Student")

    def test_item_detail_for_owner_identifies_ownership(self):
        self.client.force_authenticate(user=self.owner)
        url = reverse('marketplace-item-detail', kwargs={'item_id': self.active_item.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_own_item'])

    def test_item_detail_not_found_for_draft_or_nonexistent(self):
        self.client.force_authenticate(user=self.renter)
        # Draft item
        url_draft = reverse('marketplace-item-detail', kwargs={'item_id': self.draft_item.id})
        res_draft = self.client.get(url_draft)
        self.assertEqual(res_draft.status_code, status.HTTP_404_NOT_FOUND)

        # Random UUID
        url_random = reverse('marketplace-item-detail', kwargs={'item_id': uuid.uuid4()})
        res_random = self.client.get(url_random)
        self.assertEqual(res_random.status_code, status.HTTP_404_NOT_FOUND)
