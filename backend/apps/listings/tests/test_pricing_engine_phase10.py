import time
from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
import numpy as np

from apps.accounts.models import College, User
from apps.marketplace.models import Category
from ml_engine.services.pricing_service import (
    predict_fair_price,
    predict_fair_rental_price,
    get_model,
    PRIMARY_MODEL_PATH,
    METADATA_PATH,
)
from ml_engine.datasets.generate_dataset import (
    generate_campus_rental_dataset,
    CATEGORIES,
    CONDITIONS,
    BRAND_TIERS,
)


class PricingEnginePhase10UnitTests(APITestCase):
    """
    Unit tests for Phase 10: AI Fair Price Prediction Engine
    Validates dataset generation, model artifacts, inference logic, and latency targets.
    """

    def test_dataset_generation_structure_and_types(self):
        df = generate_campus_rental_dataset(n_samples=100, random_seed=99, save_csv=False)
        expected_columns = {
            "category",
            "original_retail_price",
            "age_in_months",
            "condition",
            "item_brand_tier",
            "campus_demand_score",
            "rental_duration_days",
            "fair_rental_price_per_day"
        }
        self.assertTrue(expected_columns.issubset(set(df.columns)))
        self.assertEqual(len(df), 100)
        self.assertTrue((df["original_retail_price"] > 0).all())
        self.assertTrue((df["age_in_months"] >= 0).all())
        self.assertTrue((df["fair_rental_price_per_day"] >= 10.0).all())
        self.assertTrue(set(df["category"]).issubset(set(CATEGORIES)))
        self.assertTrue(set(df["condition"]).issubset(set(CONDITIONS)))
        self.assertTrue(set(df["item_brand_tier"]).issubset(set(BRAND_TIERS)))

    def test_model_artifact_exists_and_loads(self):
        self.assertTrue(PRIMARY_MODEL_PATH.exists(), "Primary model artifact pricing_model.joblib must exist")
        self.assertTrue(METADATA_PATH.exists(), "Model metadata pricing_model_metadata.json must exist")
        model = get_model()
        self.assertIsNotNone(model, "ML model pipeline must be loaded into memory")

    def test_prediction_output_schema_and_boundaries(self):
        res = predict_fair_price(
            category="electronics",
            original_price=15000.0,
            condition="LIKE_NEW",
            age_months=6,
            item_brand_tier="PREMIUM",
            campus_demand_score=4.0,
            rental_duration_days=3,
            current_price=180.0
        )

        # Mandatory Phase 10 Keys
        self.assertIn("recommended_price_per_day", res)
        self.assertIn("min_suggested_price", res)
        self.assertIn("max_suggested_price", res)
        self.assertIn("confidence_score", res)
        self.assertIn("pricing_status", res)
        self.assertIn("inference_latency_ms", res)
        self.assertIn("factors", res)

        rec = float(res["recommended_price_per_day"])
        min_p = float(res["min_suggested_price"])
        max_p = float(res["max_suggested_price"])

        self.assertGreaterEqual(rec, 10.0)
        self.assertLessEqual(min_p, rec)
        self.assertGreaterEqual(max_p, rec)
        self.assertGreaterEqual(res["confidence_score"], 0.80)
        self.assertIn(res["pricing_status"], ["Fair", "Underpriced", "Overpriced"])

    def test_pricing_status_classification(self):
        # Base prediction for 5000 INR item
        res_fair = predict_fair_price("academic", 5000.0, "GOOD", 4, current_price=50.0)
        min_p = float(res_fair["min_suggested_price"])
        max_p = float(res_fair["max_suggested_price"])

        # Underpriced test
        res_under = predict_fair_price("academic", 5000.0, "GOOD", 4, current_price=min_p - 10.0)
        self.assertEqual(res_under["pricing_status"], "Underpriced")

        # Overpriced test
        res_over = predict_fair_price("academic", 5000.0, "GOOD", 4, current_price=max_p + 25.0)
        self.assertEqual(res_over["pricing_status"], "Overpriced")

        # Fair price test
        res_fair_check = predict_fair_price("academic", 5000.0, "GOOD", 4, current_price=(min_p + max_p) / 2.0)
        self.assertEqual(res_fair_check["pricing_status"], "Fair")

    def test_condition_monotonicity(self):
        """Better condition should result in higher or equal recommended rental price."""
        p_new = predict_fair_price("project-equipment", 6000.0, "BRAND_NEW", 2)["recommended_price_per_day"]
        p_like_new = predict_fair_price("project-equipment", 6000.0, "LIKE_NEW", 2)["recommended_price_per_day"]
        p_good = predict_fair_price("project-equipment", 6000.0, "GOOD", 2)["recommended_price_per_day"]
        p_fair = predict_fair_price("project-equipment", 6000.0, "FAIR", 2)["recommended_price_per_day"]

        self.assertGreater(p_new, p_like_new)
        self.assertGreater(p_like_new, p_good)
        self.assertGreater(p_good, p_fair)

    def test_age_depreciation_impact(self):
        """Older equipment should depreciate relative to brand new equipment."""
        p_fresh = predict_fair_price("electronics", 12000.0, "GOOD", age_months=1)["recommended_price_per_day"]
        p_aged = predict_fair_price("electronics", 12000.0, "GOOD", age_months=36)["recommended_price_per_day"]
        self.assertGreater(p_fresh, p_aged)

    def test_inference_latency_under_50ms(self):
        """Definition of Done: Prediction responds in < 50ms."""
        # Warmup call
        predict_fair_price("academic", 2000.0, "GOOD", 6)

        times = []
        for _ in range(10):
            t0 = time.perf_counter()
            predict_fair_price("academic", 2000.0, "GOOD", 6)
            times.append((time.perf_counter() - t0) * 1000)

        avg_latency = float(np.mean(times))
        self.assertLess(avg_latency, 50.0, f"Average inference latency was {avg_latency:.2f}ms, expected < 50ms")


class PricingEnginePhase10IntegrationAPITests(APITestCase):
    """
    Integration tests for AI Fair Price Prediction REST API Endpoints.
    """

    def setUp(self):
        self.college = College.objects.create(
            name="Aditya University",
            code="ADITYA",
            domain_whitelist=["adityauniversity.in"]
        )
        self.user = User.objects.create_user(
            email="nitta.samith@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Samith",
            last_name="Nitta",
            college=self.college,
            email_verified=True,
            is_college_verified=True,
        )
        self.category, _ = Category.objects.get_or_create(
            slug="academic",
            defaults={"name": "Academic Resources", "icon_name": "BookOpen"}
        )
        self.root_api_url = "/api/ai/predict-price/"
        self.v1_ai_url = "/api/v1/ai/predict-price/"
        self.listing_price_url = reverse("listing-price-recommendation")

    def test_post_api_ai_predict_price_root_endpoint_success(self):
        payload = {
            "category": "academic",
            "original_retail_price": "1800.00",
            "condition": "LIKE_NEW",
            "age_in_months": 4,
            "item_brand_tier": "PREMIUM",
            "campus_demand_score": 4.5,
            "rental_duration_days": 3,
            "current_price": "30.00"
        }
        response = self.client.post(self.root_api_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertIn("recommended_price_per_day", data)
        self.assertIn("min_suggested_price", data)
        self.assertIn("max_suggested_price", data)
        self.assertIn("confidence_score", data)
        self.assertIn("pricing_status", data)
        self.assertIn("inference_latency_ms", data)
        self.assertEqual(data["currency"], "INR")

    def test_post_api_v1_ai_predict_price_with_category_id(self):
        payload = {
            "category_id": str(self.category.id),
            "original_price": "4500.00",
            "condition": "GOOD",
            "item_age_months": 8
        }
        response = self.client.post(self.v1_ai_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertTrue(float(data["recommended_price_per_day"]) >= 10.0)

    def test_listing_price_recommendation_endpoint_backward_compatibility(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "category": "laboratory",
            "original_price": "8500.00",
            "condition": "BRAND_NEW",
            "item_age_months": 1,
            "requested_duration_days": 5
        }
        response = self.client.post(self.listing_price_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        # Both new and legacy keys must be present
        self.assertIn("recommended_price_per_day", data)
        self.assertIn("predicted_price", data)
        self.assertIn("recommended_min", data)
        self.assertIn("recommended_max", data)

    def test_predict_price_validates_required_fields(self):
        # Missing both category and category_id
        res1 = self.client.post(self.v1_ai_url, {"original_price": "1000.00"}, format="json")
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)

        # Invalid zero price
        res2 = self.client.post(
            self.v1_ai_url,
            {"category": "academic", "original_price": "0.00"},
            format="json"
        )
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

        # Negative price
        res3 = self.client.post(
            self.v1_ai_url,
            {"category": "academic", "original_price": "-250.00"},
            format="json"
        )
        self.assertEqual(res3.status_code, status.HTTP_400_BAD_REQUEST)

    def test_api_latency_under_50ms(self):
        """Integration latency test: HTTP API response should be fast and responsive."""
        payload = {
            "category": "academic",
            "original_price": "2000.00",
            "condition": "GOOD"
        }
        # Warmup
        self.client.post(self.v1_ai_url, payload, format="json")

        t0 = time.perf_counter()
        response = self.client.post(self.v1_ai_url, payload, format="json")
        elapsed_ms = (time.perf_counter() - t0) * 1000

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify ML internal latency
        internal_ms = response.data.get("inference_latency_ms", 0)
        self.assertLess(internal_ms, 50.0)
