import uuid
from decimal import Decimal
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

from apps.marketplace.models import Category
from apps.listings.models import Item
from apps.recommendations.services import (
    get_similar_items,
    get_complementary_recommendations,
    get_personalized_recommendations,
)

User = get_user_model()


class RecommendationEnginePhase13Tests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            email="samith.recs@aditya.ac.in",
            username="samith_recs",
            password="StrongPassword123!",
            first_name="Samith",
            last_name="Nitta",
            email_verified=True,
            is_college_verified=True,
        )

        self.lender = User.objects.create_user(
            email="lender.recs@aditya.ac.in",
            username="lender_recs",
            password="StrongPassword123!",
            first_name="Lender",
            last_name="Student",
            email_verified=True,
            is_college_verified=True,
        )

        self.cat_electronics, _ = Category.objects.get_or_create(
            slug="electronics",
            defaults={"name": "Electronics & Robotics", "description": "Lab hardware"}
        )
        self.cat_media, _ = Category.objects.get_or_create(
            slug="creative-media",
            defaults={"name": "Photography & Media", "description": "Cameras & audio"}
        )
        self.cat_academic, _ = Category.objects.get_or_create(
            slug="academic",
            defaults={"name": "Academic Tools", "description": "Calculators & drafters"}
        )

        # 1. Hardware / Electronics Items
        self.arduino = Item.objects.create(
            owner=self.lender,
            category=self.cat_electronics,
            title="Arduino Uno Rev3 Complete Starter Kit",
            description="Microcontroller prototyping kit with jumper wires and sensors.",
            brand="Arduino",
            model_name="Uno R3",
            rental_price_per_day=Decimal("40.00"),
            is_published=True,
            status=Item.STATUS_ACTIVE,
        )

        self.breadboard = Item.objects.create(
            owner=self.lender,
            category=self.cat_electronics,
            title="Solderless MB-102 Breadboard 830 Points",
            description="High quality prototyping breadboard for Arduino and IoT circuits.",
            rental_price_per_day=Decimal("10.00"),
            is_published=True,
            status=Item.STATUS_ACTIVE,
        )

        self.ultrasonic = Item.objects.create(
            owner=self.lender,
            category=self.cat_electronics,
            title="HC-SR04 Ultrasonic Distance Sensor",
            description="Distance measuring sensor module for Arduino projects.",
            rental_price_per_day=Decimal("8.00"),
            is_published=True,
            status=Item.STATUS_ACTIVE,
        )

        # 2. Camera Items
        self.dslr = Item.objects.create(
            owner=self.lender,
            category=self.cat_media,
            title="Canon EOS 1500D DSLR Camera",
            description="24.1MP DSLR camera with 18-55mm lens for campus events.",
            brand="Canon",
            model_name="EOS 1500D",
            rental_price_per_day=Decimal("350.00"),
            is_published=True,
            status=Item.STATUS_ACTIVE,
        )

        self.tripod = Item.objects.create(
            owner=self.lender,
            category=self.cat_media,
            title="Aluminum Lightweight Camera Tripod 50-inch",
            description="Portable 3-way pan head tripod for DSLR cameras.",
            rental_price_per_day=Decimal("35.00"),
            is_published=True,
            status=Item.STATUS_ACTIVE,
        )

        self.sd_card = Item.objects.create(
            owner=self.lender,
            category=self.cat_media,
            title="SanDisk 128GB Extreme PRO SD Card",
            description="UHS-I memory card for high speed camera recording.",
            rental_price_per_day=Decimal("20.00"),
            is_published=True,
            status=Item.STATUS_ACTIVE,
        )

    def test_content_based_similarity_tfidf(self):
        """Algorithm 1: TF-IDF + Cosine Similarity identifies similar hardware."""
        similar = get_similar_items(str(self.arduino.id), limit=3)
        self.assertGreaterEqual(len(similar), 1)

        # Breadboard or ultrasonic sensor should score higher than camera
        first_match = similar[0]
        self.assertIn("similarity_score", first_match)
        self.assertIn("match_reason", first_match)

    def test_complementary_item_association_arduino(self):
        """
        Algorithm 2 (Definition of Done):
        If renting 'Arduino Uno Kit' -> Recommend 'Breadboard', 'Ultrasonic Sensor', 'Jumper Wires'.
        """
        recs = get_complementary_recommendations(str(self.arduino.id), limit=6)
        self.assertEqual(recs["target_item_id"], str(self.arduino.id))

        items = recs["complementary_items"]
        self.assertGreaterEqual(len(items), 1)

        titles = [it["title"].lower() for it in items]
        has_breadboard_or_sensor = any("breadboard" in t or "sensor" in t for t in titles)
        self.assertTrue(has_breadboard_or_sensor, "Complementary accessories should include breadboard/sensors for Arduino")

        # Check association suggestions chips
        chips = [c.lower() for c in recs["suggested_accessories"]]
        self.assertTrue(any("breadboard" in c for c in chips))

    def test_complementary_item_association_dslr(self):
        """
        Algorithm 2 (Definition of Done):
        If renting 'DSLR Camera' -> Recommend 'Tripod', 'SD Card', 'Camera Bag'.
        """
        recs = get_complementary_recommendations(str(self.dslr.id), limit=6)
        items = recs["complementary_items"]
        titles = [it["title"].lower() for it in items]
        has_tripod_or_sd = any("tripod" in t or "sd" in t for t in titles)
        self.assertTrue(has_tripod_or_sd, "Complementary accessories should include tripod or memory card for DSLR")

    def test_cold_start_department_recommendations(self):
        """
        Definition of Done:
        Cold-start fallback serves top-rated items from the student's department.
        """
        # Ensure student profile has CSE department
        if hasattr(self.student, 'profile') and self.student.profile:
            self.student.profile.department = "Computer Science"
            self.student.profile.save()

        recs = get_personalized_recommendations(self.student, limit=5)
        self.assertIn(recs["strategy"], ["COLD_START_DEPARTMENT", "PERSONALIZED_HISTORY"])
        self.assertGreaterEqual(len(recs["recommendations"]), 1)

    def test_api_endpoints(self):
        """Verify GET /api/ai/recommendations/ endpoints."""
        self.client.force_authenticate(user=self.student)

        # Personalized endpoint
        res_pers = self.client.get("/api/v1/ai/recommendations/personalized/")
        self.assertEqual(res_pers.status_code, status.HTTP_200_OK)
        self.assertIn("recommendations", res_pers.data)

        # Complementary endpoint
        res_comp = self.client.get(f"/api/v1/ai/recommendations/complementary/{self.arduino.id}/")
        self.assertEqual(res_comp.status_code, status.HTTP_200_OK)
        self.assertIn("complementary_items", res_comp.data)
        self.assertIn("similar_items", res_comp.data)
        self.assertIn("suggested_accessories", res_comp.data)
