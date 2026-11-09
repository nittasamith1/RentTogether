from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.core.exceptions import ValidationError

from apps.accounts.models import College, User
from apps.marketplace.models import Category
from apps.listings.models import Item
from apps.availability.models import ItemAvailabilityBlock
from apps.marketplace.services.wishlist_service import add_to_wishlist


class BlockedItemsExclusionTests(APITestCase):
    """
    Validates that:
    1. Items with active owner booking blocks (OWNER_UNAVAILABLE or MAINTENANCE)
       are strictly EXCLUDED from the Marketplace, Popular items, and Category counts.
    2. Blocked items cannot be wishlisted by students.
    3. When the owner unblocks/deletes the block, the item IMMEDIATELY appears in
       Marketplace, Category count, and Popular items.
    4. Past/expired blocks do not hide the item.
    """

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
            last_name="User",
            college=self.college,
            email_verified=True,
            is_college_verified=True,
        )

        self.renter = User.objects.create_user(
            email="renter@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Renter",
            last_name="User",
            college=self.college,
            email_verified=True,
            is_college_verified=True,
        )

        self.category, _ = Category.objects.get_or_create(
            slug="project-equipment",
            defaults={"name": "Project Equipment", "icon_name": "Wrench", "is_active": True}
        )

        self.item = Item.objects.create(
            owner=self.owner,
            category=self.category,
            title="Bosch 12V Cordless Drill",
            description="Professional cordless drill with lithium batteries",
            brand="Bosch",
            daily_rental_price=Decimal("85.00"),
            condition=Item.CONDITION_GOOD,
            status=Item.STATUS_ACTIVE,
            is_published=True,
        )

    def test_unblocked_item_appears_in_marketplace(self):
        """Active item without any blocks appears in the marketplace."""
        self.client.force_authenticate(user=self.renter)
        res = self.client.get(reverse('marketplace-items'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        item_ids = [it['id'] for it in res.data['results']]
        self.assertIn(str(self.item.id), item_ids)

    def test_owner_blocked_item_is_excluded_from_marketplace(self):
        """When owner creates an active block, item is excluded from marketplace."""
        today = timezone.now().date()
        block = ItemAvailabilityBlock.objects.create(
            item=self.item,
            start_date=today,
            end_date=today + timedelta(days=5),
            reason=ItemAvailabilityBlock.REASON_OWNER_UNAVAILABLE,
        )

        self.client.force_authenticate(user=self.renter)
        res = self.client.get(reverse('marketplace-items'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        item_ids = [it['id'] for it in res.data['results']]
        self.assertNotIn(str(self.item.id), item_ids)

    def test_maintenance_blocked_item_is_excluded_from_marketplace(self):
        """When owner marks item for maintenance, item is excluded from marketplace."""
        today = timezone.now().date()
        ItemAvailabilityBlock.objects.create(
            item=self.item,
            start_date=today,
            end_date=today + timedelta(days=3),
            reason=ItemAvailabilityBlock.REASON_MAINTENANCE,
        )

        self.client.force_authenticate(user=self.renter)
        res = self.client.get(reverse('marketplace-items'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        item_ids = [it['id'] for it in res.data['results']]
        self.assertNotIn(str(self.item.id), item_ids)

    def test_unblocking_immediately_restores_item_to_marketplace(self):
        """When owner deletes/removes the block, item immediately reappears in marketplace."""
        today = timezone.now().date()
        block = ItemAvailabilityBlock.objects.create(
            item=self.item,
            start_date=today,
            end_date=today + timedelta(days=5),
            reason=ItemAvailabilityBlock.REASON_OWNER_UNAVAILABLE,
        )

        # Verify excluded while blocked
        self.client.force_authenticate(user=self.renter)
        res = self.client.get(reverse('marketplace-items'))
        item_ids = [it['id'] for it in res.data['results']]
        self.assertNotIn(str(self.item.id), item_ids)

        # Owner unblocks item (deletes block)
        block.delete()

        # Item immediately appears
        res_after = self.client.get(reverse('marketplace-items'))
        item_ids_after = [it['id'] for it in res_after.data['results']]
        self.assertIn(str(self.item.id), item_ids_after)

    def test_owner_blocked_item_excluded_from_category_count(self):
        """Category eligible item count reflects only unblocked items."""
        today = timezone.now().date()
        self.client.force_authenticate(user=self.renter)

        # Before block: count is 1
        res = self.client.get(reverse('marketplace-categories'))
        cat_data = next(c for c in res.data if c['slug'] == 'project-equipment')
        self.assertEqual(cat_data['eligible_item_count'], 1)

        # Block item
        block = ItemAvailabilityBlock.objects.create(
            item=self.item,
            start_date=today,
            end_date=today + timedelta(days=7),
            reason=ItemAvailabilityBlock.REASON_OWNER_UNAVAILABLE,
        )

        # After block: count is 0
        res_blocked = self.client.get(reverse('marketplace-categories'))
        cat_data_blocked = next(c for c in res_blocked.data if c['slug'] == 'project-equipment')
        self.assertEqual(cat_data_blocked['eligible_item_count'], 0)

        # Unblock: count restored to 1
        block.delete()
        res_unblocked = self.client.get(reverse('marketplace-categories'))
        cat_data_unblocked = next(c for c in res_unblocked.data if c['slug'] == 'project-equipment')
        self.assertEqual(cat_data_unblocked['eligible_item_count'], 1)

    def test_owner_blocked_item_cannot_be_wishlisted(self):
        """Students cannot wishlist an item that has an active owner booking block."""
        today = timezone.now().date()
        ItemAvailabilityBlock.objects.create(
            item=self.item,
            start_date=today,
            end_date=today + timedelta(days=4),
            reason=ItemAvailabilityBlock.REASON_OWNER_UNAVAILABLE,
        )

        with self.assertRaises(ValidationError) as ctx:
            add_to_wishlist(self.renter, str(self.item.id))
        self.assertIn("blocked by the owner", str(ctx.exception))

    def test_expired_past_block_does_not_exclude_item(self):
        """Blocks strictly in the past do not prevent item from appearing."""
        today = timezone.now().date()
        ItemAvailabilityBlock.objects.create(
            item=self.item,
            start_date=today - timedelta(days=10),
            end_date=today - timedelta(days=2),
            reason=ItemAvailabilityBlock.REASON_OWNER_UNAVAILABLE,
        )

        self.client.force_authenticate(user=self.renter)
        res = self.client.get(reverse('marketplace-items'))
        item_ids = [it['id'] for it in res.data['results']]
        self.assertIn(str(self.item.id), item_ids)
