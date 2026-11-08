from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import College, User
from apps.marketplace.models import Category
from apps.listings.models import Item, ItemImage
from apps.listings.tests.test_listing_creation import generate_test_image


class ImageUploadsAPITests(APITestCase):
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
        self.category, _ = Category.objects.get_or_create(
            slug="electronics",
            defaults={"name": "Electronics", "icon_name": "Laptop", "is_active": True}
        )

        self.item = Item.objects.create(
            owner=self.owner,
            category=self.category,
            title="Sony Alpha A6400",
            original_price=Decimal("75000.00"),
            rental_price_per_day=Decimal("350.00"),
            status=Item.STATUS_ACTIVE
        )

        self.img1 = ItemImage.objects.create(
            item=self.item,
            image_url="https://example.com/img1.jpg",
            is_primary=True,
            display_order=0
        )
        self.img2 = ItemImage.objects.create(
            item=self.item,
            image_url="https://example.com/img2.jpg",
            is_primary=False,
            display_order=1
        )

        self.images_url = reverse('listing-images-add', kwargs={'item_id': self.item.id})

    def test_owner_can_add_additional_images(self):
        self.client.force_authenticate(user=self.owner)
        img3 = generate_test_image("img3.jpg", "yellow")
        res = self.client.post(self.images_url, {'images': [img3]}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.item.images.count(), 3)

    def test_owner_cannot_delete_only_remaining_image(self):
        self.client.force_authenticate(user=self.owner)
        # Delete img2 first
        del_url_2 = reverse('listing-image-delete', kwargs={'item_id': self.item.id, 'image_id': self.img2.id})
        res2 = self.client.delete(del_url_2)
        self.assertEqual(res2.status_code, status.HTTP_200_OK)

        # Now only img1 remains. Attempting to delete img1 should fail (HTTP 400)
        del_url_1 = reverse('listing-image-delete', kwargs={'item_id': self.item.id, 'image_id': self.img1.id})
        res1 = self.client.delete(del_url_1)
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)

    def test_deleting_primary_image_promotes_next_image(self):
        self.client.force_authenticate(user=self.owner)
        del_url_1 = reverse('listing-image-delete', kwargs={'item_id': self.item.id, 'image_id': self.img1.id})
        res = self.client.delete(del_url_1)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.img2.refresh_from_db()
        self.assertTrue(self.img2.is_primary)
        self.item.refresh_from_db()
        self.assertEqual(self.item.primary_image_url, self.img2.image_url)

