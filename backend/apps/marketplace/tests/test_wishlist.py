from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import College, User
from apps.marketplace.models import Category, Wishlist
from apps.listings.models import Item


class WishlistEngineTests(APITestCase):
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
            slug="tech",
            defaults={"name": "Tech", "icon_name": "Laptop", "is_active": True}
        )

        self.item = Item.objects.create(
            owner=self.owner,
            category=self.category,
            title="Noise Cancelling Headphones",
            daily_rental_price=Decimal("45.00"),
            is_published=True,
            status=Item.STATUS_ACTIVE
        )

    def test_add_item_to_wishlist_success(self):
        self.client.force_authenticate(user=self.renter)
        url = reverse('marketplace-item-wishlist', kwargs={'item_id': self.item.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Wishlist.objects.filter(user=self.renter, item=self.item).exists())

    def test_add_duplicate_wishlist_is_idempotent(self):
        self.client.force_authenticate(user=self.renter)
        url = reverse('marketplace-item-wishlist', kwargs={'item_id': self.item.id})
        self.client.post(url)
        response = self.client.post(url)
        # Idempotent: 200 or 201
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        self.assertEqual(Wishlist.objects.filter(user=self.renter, item=self.item).count(), 1)

    def test_owner_cannot_wishlist_own_item(self):
        self.client.force_authenticate(user=self.owner)
        url = reverse('marketplace-item-wishlist', kwargs={'item_id': self.item.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_remove_item_from_wishlist(self):
        Wishlist.objects.create(user=self.renter, item=self.item)
        self.client.force_authenticate(user=self.renter)
        url = reverse('marketplace-item-wishlist', kwargs={'item_id': self.item.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Wishlist.objects.filter(user=self.renter, item=self.item).exists())

    def test_list_wishlist_returns_user_items_only(self):
        Wishlist.objects.create(user=self.renter, item=self.item)
        self.client.force_authenticate(user=self.renter)
        url = reverse('marketplace-wishlist')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], str(self.item.id))

    def test_clear_wishlist_history(self):
        item2 = Item.objects.create(
            owner=self.owner,
            category=self.category,
            title="Scientific Calculator",
            daily_rental_price=Decimal("20.00"),
            is_published=True,
            status=Item.STATUS_ACTIVE
        )
        Wishlist.objects.create(user=self.renter, item=self.item)
        Wishlist.objects.create(user=self.renter, item=item2)
        self.assertEqual(Wishlist.objects.filter(user=self.renter).count(), 2)

        self.client.force_authenticate(user=self.renter)
        clear_url = reverse('marketplace-wishlist-clear')
        response = self.client.delete(clear_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('deleted_count'), 2)
        self.assertEqual(Wishlist.objects.filter(user=self.renter).count(), 0)

