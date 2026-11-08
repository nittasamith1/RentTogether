import io
from decimal import Decimal
from PIL import Image
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import College, User
from apps.marketplace.models import Category
from apps.listings.models import Item


def generate_test_image(name="test.jpg", color="blue"):
    file = io.BytesIO()
    image = Image.new("RGB", (100, 100), color)
    image.save(file, 'jpeg')
    file.seek(0)
    return SimpleUploadedFile(name, file.read(), content_type="image/jpeg")


class ListingCreationAPITests(APITestCase):
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

        self.category, _ = Category.objects.get_or_create(
            slug="electronics",
            defaults={"name": "Electronics", "icon_name": "Laptop", "is_active": True}
        )
        self.inactive_cat, _ = Category.objects.get_or_create(
            slug="archived",
            defaults={"name": "Archived", "icon_name": "Archive", "is_active": False}
        )
        self.inactive_cat.is_active = False
        self.inactive_cat.save()

        self.create_url = reverse('listing-create')

    def test_verified_student_can_create_listing(self):
        self.client.force_authenticate(user=self.verified_student)
        img1 = generate_test_image("board1.jpg", "green")
        img2 = generate_test_image("board2.jpg", "red")

        payload = {
            'title': 'Arduino Uno Rev3 Complete Kit',
            'description': 'Includes 35 sensors, jumper wires, servo motor, and LCD display.',
            'category_id': str(self.category.id),
            'brand': 'Arduino',
            'model_name': 'Uno R3',
            'original_price': '2499.00',
            'item_age_months': 3,
            'condition': 'LIKE_NEW',
            'rental_price_per_day': '50.00',
            'security_deposit': '400.00',
            'min_rental_days': 2,
            'max_rental_days': 14,
            'pickup_location': 'Tech Hub Lab 302',
            'pickup_instructions': 'Available between 2 PM and 5 PM on weekdays.',
            'images': [img1, img2]
        }

        response = self.client.post(self.create_url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Arduino Uno Rev3 Complete Kit')
        self.assertEqual(response.data['status'], Item.STATUS_ACTIVE)
        self.assertEqual(len(response.data['images']), 2)
        self.assertTrue(response.data['images'][0]['is_primary'])

        # Verify in database
        item = Item.objects.get(id=response.data['id'])
        self.assertEqual(item.owner, self.verified_student)
        self.assertEqual(item.rental_price_per_day, Decimal('50.00'))

    def test_unverified_student_cannot_create_listing(self):
        self.client.force_authenticate(user=self.unverified_student)
        payload = {
            'title': 'Unauthorized Item',
            'category_id': str(self.category.id),
            'original_price': '1000.00',
            'rental_price_per_day': '20.00',
            'images': [generate_test_image()]
        }
        response = self.client.post(self.create_url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_listing_creation_requires_at_least_one_image(self):
        self.client.force_authenticate(user=self.verified_student)
        payload = {
            'title': 'No Image Item',
            'description': 'Valid description',
            'category_id': str(self.category.id),
            'original_price': '1000.00',
            'rental_price_per_day': '30.00',
            'pickup_location': 'Main Library',
        }
        response = self.client.post(self.create_url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('images', response.data)

    def test_listing_creation_rejects_inactive_category(self):
        self.client.force_authenticate(user=self.verified_student)
        payload = {
            'title': 'Item in Inactive Category',
            'description': 'Description',
            'category_id': str(self.inactive_cat.id),
            'original_price': '1000.00',
            'rental_price_per_day': '30.00',
            'pickup_location': 'Library',
            'images': [generate_test_image()]
        }
        response = self.client.post(self.create_url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_listing_creation_rejects_more_than_five_images(self):
        self.client.force_authenticate(user=self.verified_student)
        payload = {
            'title': 'Six Images Item',
            'description': 'Description',
            'category_id': str(self.category.id),
            'original_price': '1000.00',
            'rental_price_per_day': '30.00',
            'pickup_location': 'Library',
            'images': [generate_test_image(f"img{i}.jpg") for i in range(6)]
        }
        response = self.client.post(self.create_url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_my_listings_endpoint_without_query_params(self):
        self.client.force_authenticate(user=self.verified_student)
        url = reverse('listing-my-listings')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('stats', response.data)
        self.assertIn('results', response.data)



