from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import College, User
from apps.marketplace.models import Category
from apps.listings.models import Item


class OwnListingsExclusionTests(APITestCase):
    """
    Validates the strict business rule:
    A student must NEVER see their own listed items in:
    - Marketplace listings
    - Popular items
    - Category eligible item counts
    - Related items
    And cannot book or wishlist their own items.
    """

    def setUp(self):
        self.college = College.objects.create(
            name="Aditya University",
            code="ADITYA",
            domain_whitelist=["adityauniversity.in"]
        )

        self.student_a = User.objects.create_user(
            email="student_a@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Student",
            last_name="A",
            college=self.college,
            email_verified=True,
            is_college_verified=True,
        )

        self.student_b = User.objects.create_user(
            email="student_b@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Student",
            last_name="B",
            college=self.college,
            email_verified=True,
            is_college_verified=True,
        )

        self.cat_academic, _ = Category.objects.get_or_create(
            slug="academic",
            defaults={"name": "Academic", "icon_name": "BookOpen", "is_active": True}
        )

        self.cat_electronics, _ = Category.objects.get_or_create(
            slug="electronics",
            defaults={"name": "Electronics", "icon_name": "Laptop", "is_active": True}
        )

        # Student A creates 3 items
        self.a_item1 = Item.objects.create(
            owner=self.student_a,
            category=self.cat_academic,
            title="A Engineering Mathematics",
            condition=Item.CONDITION_LIKE_NEW,
            daily_rental_price=Decimal("40.00"),
            pickup_locations=["Library Gate"],
            status=Item.STATUS_ACTIVE,
            is_published=True,
        )
        self.a_item2 = Item.objects.create(
            owner=self.student_a,
            category=self.cat_electronics,
            title="A Arduino Kit",
            condition=Item.CONDITION_GOOD,
            daily_rental_price=Decimal("60.00"),
            pickup_locations=["Cafeteria"],
            status=Item.STATUS_ACTIVE,
            is_published=True,
        )
        self.a_item3 = Item.objects.create(
            owner=self.student_a,
            category=self.cat_electronics,
            title="A Digital Multimeter",
            condition=Item.CONDITION_GOOD,
            daily_rental_price=Decimal("50.00"),
            pickup_locations=["Cafeteria"],
            status=Item.STATUS_ACTIVE,
            is_published=True,
        )

        # Student B creates 2 items
        self.b_item1 = Item.objects.create(
            owner=self.student_b,
            category=self.cat_academic,
            title="B Data Structures Book",
            condition=Item.CONDITION_LIKE_NEW,
            daily_rental_price=Decimal("35.00"),
            pickup_locations=["Main Block"],
            status=Item.STATUS_ACTIVE,
            is_published=True,
        )
        self.b_item2 = Item.objects.create(
            owner=self.student_b,
            category=self.cat_electronics,
            title="B Raspberry Pi 4",
            condition=Item.CONDITION_BRAND_NEW,
            daily_rental_price=Decimal("90.00"),
            pickup_locations=["Tech Park"],
            status=Item.STATUS_ACTIVE,
            is_published=True,
        )

    def test_student_a_sees_only_student_b_items_in_marketplace(self):
        self.client.force_authenticate(user=self.student_a)
        response = self.client.get(reverse("marketplace-items"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        items = response.data.get("results", [])
        self.assertEqual(len(items), 2)
        returned_ids = {item["id"] for item in items}
        self.assertIn(str(self.b_item1.id), returned_ids)
        self.assertIn(str(self.b_item2.id), returned_ids)
        self.assertNotIn(str(self.a_item1.id), returned_ids)
        self.assertNotIn(str(self.a_item2.id), returned_ids)
        self.assertNotIn(str(self.a_item3.id), returned_ids)

    def test_student_b_sees_only_student_a_items_in_marketplace(self):
        self.client.force_authenticate(user=self.student_b)
        response = self.client.get(reverse("marketplace-items"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        items = response.data.get("results", [])
        self.assertEqual(len(items), 3)
        returned_ids = {item["id"] for item in items}
        self.assertIn(str(self.a_item1.id), returned_ids)
        self.assertIn(str(self.a_item2.id), returned_ids)
        self.assertIn(str(self.a_item3.id), returned_ids)
        self.assertNotIn(str(self.b_item1.id), returned_ids)
        self.assertNotIn(str(self.b_item2.id), returned_ids)

    def test_popular_items_excludes_own_listings(self):
        self.client.force_authenticate(user=self.student_a)
        response = self.client.get(reverse("marketplace-popular"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        returned_ids = {item["id"] for item in response.data}
        self.assertNotIn(str(self.a_item1.id), returned_ids)
        self.assertNotIn(str(self.a_item2.id), returned_ids)
        self.assertNotIn(str(self.a_item3.id), returned_ids)

    def test_category_counts_exclude_own_listings(self):
        # Student A has 1 academic and 2 electronics; Student B has 1 academic and 1 electronics
        # Student A should see Academic: 1, Electronics: 1
        self.client.force_authenticate(user=self.student_a)
        response = self.client.get(reverse("marketplace-categories"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        cats_by_slug = {c["slug"]: c["eligible_item_count"] for c in response.data}
        self.assertEqual(cats_by_slug.get("academic"), 1)
        self.assertEqual(cats_by_slug.get("electronics"), 1)

        # Student B should see Academic: 1, Electronics: 2
        self.client.force_authenticate(user=self.student_b)
        response_b = self.client.get(reverse("marketplace-categories"))
        cats_by_slug_b = {c["slug"]: c["eligible_item_count"] for c in response_b.data}
        self.assertEqual(cats_by_slug_b.get("academic"), 1)
        self.assertEqual(cats_by_slug_b.get("electronics"), 2)

    def test_student_cannot_book_own_item(self):
        self.client.force_authenticate(user=self.student_a)
        url = reverse("booking-create")
        payload = {
            "item_id": str(self.a_item1.id),
            "start_date": "2026-11-15",
            "end_date": "2026-11-18",
            "message_to_owner": "Test booking"
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_student_cannot_wishlist_own_item(self):
        self.client.force_authenticate(user=self.student_a)
        url = reverse("marketplace-item-wishlist", kwargs={"item_id": self.a_item1.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
