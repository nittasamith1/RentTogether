from decimal import Decimal
from django.test import TestCase
from django.core.exceptions import ValidationError
from apps.accounts.models import College, User
from apps.marketplace.models import Category
from apps.listings.models import Item, ItemImage


class ListingModelsTest(TestCase):
    def setUp(self):
        self.college = College.objects.create(
            name="Aditya University",
            code="ADITYA",
            domain_whitelist=["adityauniversity.in"]
        )
        self.user = User.objects.create_user(
            email="samith@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Samith",
            last_name="Nitta",
            college=self.college,
            email_verified=True,
            is_college_verified=True,
        )
        self.category, _ = Category.objects.get_or_create(
            slug="academic",
            defaults={"name": "Academic", "icon_name": "BookOpen", "is_active": True}
        )

    def test_item_valid_creation(self):
        item = Item.objects.create(
            owner=self.user,
            category=self.category,
            title="Scientific Calculator",
            description="Casio ClassWiz fx-991CW for exam prep",
            original_price=Decimal("1500.00"),
            rental_price_per_day=Decimal("35.00"),
            security_deposit=Decimal("200.00"),
            min_rental_days=1,
            max_rental_days=14,
            pickup_location="Library Gate",
            status=Item.STATUS_ACTIVE
        )
        self.assertEqual(item.status, Item.STATUS_ACTIVE)
        self.assertTrue(item.is_published)
        self.assertEqual(item.rental_price_per_day, Decimal("35.00"))
        self.assertEqual(item.daily_rental_price, Decimal("35.00"))
        self.assertEqual(item.pickup_locations, ["Library Gate"])

    def test_item_clean_rejects_zero_or_negative_price(self):
        item = Item(
            owner=self.user,
            category=self.category,
            title="Free Item",
            description="Description",
            original_price=Decimal("1000.00"),
            rental_price_per_day=Decimal("0.00"),
            min_rental_days=1,
            max_rental_days=5
        )
        with self.assertRaises(ValidationError):
            item.clean()

    def test_item_clean_rejects_invalid_duration(self):
        item = Item(
            owner=self.user,
            category=self.category,
            title="Item",
            description="Description",
            original_price=Decimal("1000.00"),
            rental_price_per_day=Decimal("20.00"),
            min_rental_days=5,
            max_rental_days=2  # max < min
        )
        with self.assertRaises(ValidationError):
            item.clean()

    def test_item_image_primary_exclusivity(self):
        item = Item.objects.create(
            owner=self.user,
            category=self.category,
            title="Item with images",
            description="Description",
            original_price=Decimal("1000.00"),
            rental_price_per_day=Decimal("20.00")
        )
        img1 = ItemImage.objects.create(item=item, image_url="https://example.com/1.jpg", is_primary=True)
        img2 = ItemImage.objects.create(item=item, image_url="https://example.com/2.jpg", is_primary=True)

        img1.refresh_from_db()
        img2.refresh_from_db()
        self.assertFalse(img1.is_primary)
        self.assertTrue(img2.is_primary)
        self.assertEqual(item.primary_image_url, "https://example.com/2.jpg")

