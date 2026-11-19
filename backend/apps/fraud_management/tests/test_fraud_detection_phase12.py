import uuid
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

from apps.marketplace.models import Category
from apps.listings.models import Item
from apps.bookings.models import Booking
from apps.fraud_management.models import FraudAlert
from apps.fraud_management.services import (
    extract_listing_risk_signals,
    evaluate_listing_risk,
    evaluate_cancellation_risk,
    compute_image_dhash,
    compute_hamming_distance,
    get_fraud_model,
)

User = get_user_model()


class FraudDetectionPhase12Tests(APITestCase):
    def setUp(self):
        # Admin User
        self.admin_user = User.objects.create_user(
            email="campus.admin@aditya.ac.in",
            username="campus_admin",
            password="AdminPassword123!",
            first_name="Campus",
            last_name="Admin",
            is_staff=True,
            is_superuser=True,
            email_verified=True,
            is_college_verified=True,
        )

        # Standard Verified Student Owner
        self.student = User.objects.create_user(
            email="samith.student@aditya.ac.in",
            username="samith_student",
            password="StrongPassword123!",
            first_name="Samith",
            last_name="Nitta",
            email_verified=True,
            is_college_verified=True,
        )

        # Category
        self.category, _ = Category.objects.get_or_create(
            slug="calculators",
            defaults={"name": "Scientific Calculators", "description": "Calculators"}
        )

    def test_feature_extraction_and_hashing(self):
        """Test risk feature extraction and perceptual hashing utilities."""
        item = Item.objects.create(
            owner=self.student,
            category=self.category,
            title="Standard Casio fx-991CW",
            description="Good calculator",
            rental_price_per_day=Decimal("15.00"),
            original_price=Decimal("1200.00"),
            condition="GOOD",
        )

        signals = extract_listing_risk_signals(item, self.student)
        self.assertIn("price_deviation_ratio", signals)
        self.assertIn("creation_velocity", signals)
        self.assertIn("cancellation_ratio", signals)
        self.assertIn("account_age_days", signals)
        self.assertIn("user_report_count", signals)
        self.assertIn("duplicate_image_hash_distance", signals)

        # Verify hashing utilities
        dist_same = compute_hamming_distance("ffff", "ffff")
        dist_diff = compute_hamming_distance("ffff", "0000")
        self.assertEqual(dist_same, 0)
        self.assertEqual(dist_diff, 16)

    def test_isolation_forest_flags_abnormal_pricing(self):
        """
        Definition of Done Requirement:
        Isolation Forest flags abnormal pricing (e.g. ₹5,000/day for a calculator).
        """
        # 1. Normal Item: Casio calculator at ₹15/day
        normal_item = Item.objects.create(
            owner=self.student,
            category=self.category,
            title="Casio fx-991CW Fair Rate",
            rental_price_per_day=Decimal("15.00"),
            original_price=Decimal("1200.00"),
            condition="LIKE_NEW",
            status=Item.STATUS_ACTIVE,
            is_published=True,
        )
        normal_eval = evaluate_listing_risk(normal_item, self.student)
        self.assertLess(normal_eval["risk_score"], 40)
        self.assertEqual(normal_eval["risk_level"], FraudAlert.RISK_LOW)
        self.assertFalse(normal_eval["is_quarantined"])

        # 2. Extreme Price Gouging: Casio calculator at ₹5,000/day
        gouged_item = Item.objects.create(
            owner=self.student,
            category=self.category,
            title="Casio fx-991CW Gouged Rate",
            rental_price_per_day=Decimal("5000.00"),
            original_price=Decimal("1200.00"),
            condition="GOOD",
            status=Item.STATUS_ACTIVE,
            is_published=True,
        )
        gouged_eval = evaluate_listing_risk(gouged_item, self.student)

        # Must trigger High Risk (>= 75) and be automatically quarantined
        self.assertGreaterEqual(gouged_eval["risk_score"], 75)
        self.assertEqual(gouged_eval["risk_level"], FraudAlert.RISK_HIGH)
        self.assertTrue(gouged_eval["is_quarantined"])

        # Check that item status was updated in DB
        gouged_item.refresh_from_db()
        self.assertFalse(gouged_item.is_published)
        self.assertEqual(gouged_item.status, Item.STATUS_PAUSED)

        # Check FraudAlert record in DB
        alert = FraudAlert.objects.get(id=gouged_eval["alert_id"])
        self.assertEqual(alert.risk_level, FraudAlert.RISK_HIGH)
        self.assertEqual(alert.status, FraudAlert.STATUS_PENDING_REVIEW)
        self.assertIn("PRICE_GOUGING", str(alert.trigger_signals["reasons"]))

    def test_rapid_cancellations_risk_trigger(self):
        """Test automated safety alert on rapid booking cancellations."""
        now = timezone.now().date()
        for i in range(4):
            Booking.objects.create(
                booking_code=f"RT-CANC-{i}-{uuid.uuid4().hex[:4].upper()}",
                owner=self.admin_user,
                renter=self.student,
                start_date=now + timedelta(days=i + 1),
                end_date=now + timedelta(days=i + 3),
                total_days=2,
                daily_rate=Decimal("10.00"),
                total_amount=Decimal("20.00"),
                status=Booking.STATUS_CANCELLED,
            )

        canc_eval = evaluate_cancellation_risk(self.student)
        self.assertTrue(canc_eval["flagged"])
        self.assertGreaterEqual(canc_eval["risk_score"], 75)
        self.assertTrue(FraudAlert.objects.filter(id=canc_eval["alert_id"]).exists())

    def test_admin_list_and_stats_endpoints(self):
        """Admin can list alerts and view fraud statistics."""
        # Create a sample alert
        alert = FraudAlert.objects.create(
            user=self.student,
            risk_score=85,
            risk_level=FraudAlert.RISK_HIGH,
            trigger_signals={"reasons": ["[PRICE_GOUGING] Extreme outlier"]},
            status=FraudAlert.STATUS_PENDING_REVIEW,
        )

        self.client.force_authenticate(user=self.admin_user)

        # List alerts
        list_res = self.client.get("/api/v1/admin/fraud-alerts/")
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(list_res.data["results"] if "results" in list_res.data else list_res.data), 1)

        # Detail alert
        detail_res = self.client.get(f"/api/v1/admin/fraud-alerts/{alert.id}/")
        self.assertEqual(detail_res.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_res.data["risk_score"], 85)

        # Stats endpoint
        stats_res = self.client.get("/api/v1/admin/fraud-stats/")
        self.assertEqual(stats_res.status_code, status.HTTP_200_OK)
        self.assertIn("total_alerts", stats_res.data)
        self.assertIn("high_risk_alerts", stats_res.data)

    def test_admin_action_approve_restores_listing(self):
        """Admin APPROVE action dismisses alert and republishes the quarantined item."""
        quarantined_item = Item.objects.create(
            owner=self.student,
            category=self.category,
            title="Quarantined High End Item",
            rental_price_per_day=Decimal("4500.00"),
            is_published=False,
            status=Item.STATUS_PAUSED,
        )

        alert = FraudAlert.objects.create(
            listing=quarantined_item,
            user=self.student,
            risk_score=88,
            risk_level=FraudAlert.RISK_HIGH,
            status=FraudAlert.STATUS_PENDING_REVIEW,
        )

        self.client.force_authenticate(user=self.admin_user)
        action_url = f"/api/v1/admin/fraud-alerts/{alert.id}/action/"
        response = self.client.post(action_url, {"action": "APPROVE", "notes": "Verified genuine specialized kit."})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        alert.refresh_from_db()
        self.assertEqual(alert.status, FraudAlert.STATUS_DISMISSED)
        self.assertEqual(alert.reviewed_by, self.admin_user)

        # Item should now be restored and published
        quarantined_item.refresh_from_db()
        self.assertTrue(quarantined_item.is_published)
        self.assertEqual(quarantined_item.status, Item.STATUS_ACTIVE)

    def test_admin_action_quarantine_removes_listing(self):
        """Admin QUARANTINE action confirms action taken and removes listing."""
        item = Item.objects.create(
            owner=self.student,
            category=self.category,
            title="Scam Item",
            rental_price_per_day=Decimal("9999.00"),
            is_published=False,
            status=Item.STATUS_PAUSED,
        )

        alert = FraudAlert.objects.create(
            listing=item,
            user=self.student,
            risk_score=95,
            risk_level=FraudAlert.RISK_HIGH,
            status=FraudAlert.STATUS_PENDING_REVIEW,
        )

        self.client.force_authenticate(user=self.admin_user)
        action_url = f"/api/v1/admin/fraud-alerts/{alert.id}/action/"
        response = self.client.post(action_url, {"action": "QUARANTINE", "notes": "Confirmed malicious price gouging."})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        alert.refresh_from_db()
        self.assertEqual(alert.status, FraudAlert.STATUS_ACTION_TAKEN)

        item.refresh_from_db()
        self.assertFalse(item.is_published)
        self.assertEqual(item.status, Item.STATUS_REMOVED)

    def test_non_admin_cannot_access_fraud_alerts(self):
        """Non-admin students are rejected with 403 Forbidden."""
        self.client.force_authenticate(user=self.student)
        response = self.client.get("/api/v1/admin/fraud-alerts/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

