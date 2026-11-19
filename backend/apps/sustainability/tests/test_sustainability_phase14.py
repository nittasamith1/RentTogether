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
from apps.sustainability.services.impact_calculator import (
    get_category_waste_factor,
    calculate_student_impact,
    calculate_campus_impact,
)

User = get_user_model()


class SustainabilityImpactPhase14Tests(APITestCase):
    def setUp(self):
        self.renter = User.objects.create_user(
            email="eco.renter@aditya.ac.in",
            username="eco_renter",
            password="StrongPassword123!",
            first_name="Eco",
            last_name="Borrower",
            email_verified=True,
            is_college_verified=True,
        )

        self.owner = User.objects.create_user(
            email="eco.owner@aditya.ac.in",
            username="eco_owner",
            password="StrongPassword123!",
            first_name="Eco",
            last_name="Lender",
            email_verified=True,
            is_college_verified=True,
        )

        # Categories
        self.cat_calc, _ = Category.objects.get_or_create(slug="calculators", defaults={"name": "Calculators"})
        self.cat_laptop, _ = Category.objects.get_or_create(slug="computers", defaults={"name": "Laptops & Computers"})
        self.cat_bike, _ = Category.objects.get_or_create(slug="daily-use", defaults={"name": "Bicycles & Mobility"})
        self.cat_academic, _ = Category.objects.get_or_create(slug="academic", defaults={"name": "Academic Textbooks"})
        self.cat_lab, _ = Category.objects.get_or_create(slug="laboratory", defaults={"name": "Lab Hardware Kits"})

    def test_category_waste_avoided_factors(self):
        """
        14.1 Impact Calculation Logic:
        Embodied waste weights:
          - Textbook / Academic: 0.8 kg waste avoided
          - Calculator / Electronics: 1.2 kg waste avoided
          - Laptop / Computer: 8.5 kg waste avoided
          - Lab Kit / Hardware: 2.4 kg waste avoided
          - Bicycle / Daily Use: 14.0 kg waste avoided
        """
        self.assertEqual(get_category_waste_factor("academic", "Engineering Mathematics"), 0.8)
        self.assertEqual(get_category_waste_factor("calculators", "Casio fx-991CW"), 1.2)
        self.assertEqual(get_category_waste_factor("computers", "Dell XPS 15 Laptop"), 8.5)
        self.assertEqual(get_category_waste_factor("laboratory", "Arduino Uno Lab Kit"), 2.4)
        self.assertEqual(get_category_waste_factor("daily-use", "Hero Sprint Bicycle"), 14.0)

    def test_money_saved_and_kpi_dynamic_update(self):
        """
        Definition of Done:
        KPI numbers update dynamically after every completed rental.
        Formula: Money Saved = Item Original Price - Total Rental Price Paid.
        """
        calculator_item = Item.objects.create(
            owner=self.owner,
            category=self.cat_calc,
            title="Casio fx-991EX ClassWiz",
            rental_price_per_day=Decimal("15.00"),
            original_price=Decimal("1200.00"), # Retail price
            status=Item.STATUS_ACTIVE,
            is_published=True,
        )

        # Pre-booking state: 0 completed rentals
        impact_before = calculate_student_impact(self.renter)
        self.assertEqual(impact_before["completed_rentals"], 0)
        self.assertEqual(impact_before["money_saved_inr"], 0.0)

        # Complete a 2-day rental (Rental fee: ₹30, Retail: ₹1,200 -> Saved: ₹1,170)
        now = timezone.now().date()
        booking = Booking.objects.create(
            booking_code=f"RT-ECO-{uuid.uuid4().hex[:6].upper()}",
            item=calculator_item,
            item_title=calculator_item.title,
            owner=self.owner,
            renter=self.renter,
            start_date=now - timedelta(days=3),
            end_date=now - timedelta(days=1),
            total_days=2,
            daily_rate=Decimal("15.00"),
            total_rental_fee=Decimal("30.00"),
            reference_purchase_price_inr=Decimal("1200.00"),
            status=Booking.STATUS_COMPLETED,
        )

        impact_after = calculate_student_impact(self.renter)
        self.assertEqual(impact_after["completed_rentals"], 1)
        self.assertEqual(impact_after["money_saved_inr"], 1170.0)
        self.assertEqual(impact_after["waste_avoided_kg"], 1.2)
        self.assertGreater(impact_after["co2_saved_kg"], 0.0)

    def test_api_endpoints(self):
        """Verify GET /api/sustainability/ endpoints."""
        self.client.force_authenticate(user=self.renter)

        # Student personal impact
        res_my = self.client.get("/api/v1/sustainability/my-impact/")
        self.assertEqual(res_my.status_code, status.HTTP_200_OK)
        self.assertIn("active_rentals", res_my.data)
        self.assertIn("completed_rentals", res_my.data)
        self.assertIn("money_saved_inr", res_my.data)
        self.assertIn("waste_avoided_kg", res_my.data)
        self.assertIn("contribution_percentile", res_my.data)

        # Campus aggregate impact
        res_campus = self.client.get("/api/v1/sustainability/campus-impact/")
        self.assertEqual(res_campus.status_code, status.HTTP_200_OK)
        self.assertIn("total_resources_reused", res_campus.data)
        self.assertIn("total_money_saved_inr", res_campus.data)
        self.assertIn("total_waste_avoided_kg", res_campus.data)
