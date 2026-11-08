from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import College, User
from ml_engine.services.pricing_service import predict_fair_rental_price


class PricingRecommendationAPITests(APITestCase):
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
        self.client.force_authenticate(user=self.user)
        self.url = reverse('listing-price-recommendation')

    def test_pricing_recommendation_api_success(self):
        payload = {
            'category': 'electronics',
            'original_price': '2499.00',
            'condition': 'LIKE_NEW',
            'item_age_months': 3,
            'requested_duration_days': 7
        }
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertIn('predicted_price', data)
        self.assertIn('recommended_min', data)
        self.assertIn('recommended_max', data)
        self.assertEqual(data['currency'], 'INR')
        self.assertEqual(data['period'], 'per_day')
        self.assertIsInstance(data['factors'], list)
        self.assertTrue(len(data['factors']) >= 2)

        pred = float(data['predicted_price'])
        rec_min = float(data['recommended_min'])
        rec_max = float(data['recommended_max'])
        self.assertTrue(pred >= 10.0)
        self.assertTrue(rec_min <= pred <= rec_max)

    def test_pricing_recommendation_api_rejects_negative_or_zero_price(self):
        payload = {
            'category': 'electronics',
            'original_price': '0.00',
            'condition': 'GOOD'
        }
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_pricing_service_direct_execution(self):
        res = predict_fair_rental_price(
            category="laboratory",
            original_price=Decimal("38000.00"),
            condition="LIKE_NEW",
            item_age_months=6
        )
        self.assertEqual(res['currency'], 'INR')
        self.assertTrue(float(res['predicted_price']) > 50.0)

