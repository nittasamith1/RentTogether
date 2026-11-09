import uuid
from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import College, User
from apps.marketplace.models import Category, Wishlist
from apps.listings.models import Item


class CollegeIsolationSecurityTests(APITestCase):
    def setUp(self):
        # College A: Aditya University
        self.college_a = College.objects.create(
            name="Aditya University",
            code="ADITYA",
            domain_whitelist=["adityauniversity.in"]
        )
        # College B: VNR VJIET
        self.college_b = College.objects.create(
            name="VNR VJIET",
            code="VNRVJIET",
            domain_whitelist=["vnrvjiet.in"]
        )

        self.student_a = User.objects.create_user(
            email="samith@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Samith",
            last_name="Nitta",
            college=self.college_a,
            email_verified=True,
            is_college_verified=True,
        )

        self.student_a2 = User.objects.create_user(
            email="peer2@adityauniversity.in",
            password="StrongPassword123!",
            first_name="PeerTwo",
            last_name="Aditya",
            college=self.college_a,
            email_verified=True,
            is_college_verified=True,
        )

        self.student_b = User.objects.create_user(
            email="peer@vnrvjiet.in",
            password="StrongPassword123!",
            first_name="Peer",
            last_name="Hyd",
            college=self.college_b,
            email_verified=True,
            is_college_verified=True,
        )

        self.student_b2 = User.objects.create_user(
            email="peer_b2@vnrvjiet.in",
            password="StrongPassword123!",
            first_name="PeerB2",
            last_name="VNR",
            college=self.college_b,
            email_verified=True,
            is_college_verified=True,
        )

        self.category, _ = Category.objects.get_or_create(
            slug="academic-gear",
            defaults={"name": "Academic Gear", "icon_name": "BookOpen", "is_active": True}
        )

        self.item_a = Item.objects.create(
            owner=self.student_a,
            category=self.category,
            title="Aditya Drafter",
            description="Engineering mini drafter at Aditya University campus",
            daily_rental_price=Decimal("30.00"),
            is_published=True,
            status=Item.STATUS_ACTIVE
        )

        self.item_b = Item.objects.create(
            owner=self.student_b,
            category=self.category,
            title="VNR VJIET Lab Kit",
            description="VLSI FPGA experimental board at VNR campus",
            daily_rental_price=Decimal("120.00"),
            is_published=True,
            status=Item.STATUS_ACTIVE
        )

    def test_marketplace_listing_isolates_by_college(self):
        # Peer student A2 in College A should see Aditya Drafter, not VNR VJIET Lab Kit
        self.client.force_authenticate(user=self.student_a2)
        response = self.client.get(reverse('marketplace-items'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', [])
        titles = [r['title'] for r in results]
        self.assertIn("Aditya Drafter", titles)
        self.assertNotIn("VNR VJIET Lab Kit", titles)

        # Peer student B2 in College B should see VNR VJIET Lab Kit, not Aditya Drafter
        self.client.force_authenticate(user=self.student_b2)
        response_b = self.client.get(reverse('marketplace-items'))
        self.assertEqual(response_b.status_code, status.HTTP_200_OK)
        results_b = response_b.data.get('results', [])
        titles_b = [r['title'] for r in results_b]
        self.assertIn("VNR VJIET Lab Kit", titles_b)
        self.assertNotIn("Aditya Drafter", titles_b)
        results_b = response_b.data.get('results', [])
        titles_b = [r['title'] for r in results_b]
        self.assertIn("VNR VJIET Lab Kit", titles_b)
        self.assertNotIn("Aditya Drafter", titles_b)

    def test_item_detail_cross_college_returns_404(self):
        # Student A attempting to inspect Student B's item must get 404
        self.client.force_authenticate(user=self.student_a)
        url = reverse('marketplace-item-detail', kwargs={'item_id': self.item_b.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cross_college_wishlist_returns_404(self):
        # Student A attempting to wishlist Student B's item must get 404
        self.client.force_authenticate(user=self.student_a)
        url = reverse('marketplace-item-wishlist', kwargs={'item_id': self.item_b.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(Wishlist.objects.filter(user=self.student_a, item=self.item_b).exists())

    def test_category_item_counts_are_college_isolated(self):
        # Peer student A2 in College A should see count = 1 for item listed by student A
        self.client.force_authenticate(user=self.student_a2)
        res = self.client.get(reverse('marketplace-categories'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        cat_data = next(c for c in res.data if c['slug'] == 'academic-gear')
        self.assertEqual(cat_data['eligible_item_count'], 1)

    def test_popular_items_enforces_college_isolation(self):
        self.client.force_authenticate(user=self.student_a2)
        res = self.client.get(reverse('marketplace-popular'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        item_ids = [i['id'] for i in res.data]
        self.assertIn(str(self.item_a.id), item_ids)
        self.assertNotIn(str(self.item_b.id), item_ids)
