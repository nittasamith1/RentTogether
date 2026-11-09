from decimal import Decimal
from datetime import timedelta
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import College, User
from apps.marketplace.models import Category
from apps.listings.models import Item
from apps.bookings.models import Booking


class HourlyRentalsAPITests(APITestCase):
    """
    Validates hourly & daily rental pricing and half-open availability intervals.
    Formula:
      Hourly Rate = Daily Rental Price / 24
      Total Rental Amount = Hourly Rate * Total Rental Hours
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
            last_name="Student",
            college=self.college,
            email_verified=True,
            is_college_verified=True,
        )

        self.renter = User.objects.create_user(
            email="renter@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Renter",
            last_name="Student",
            college=self.college,
            email_verified=True,
            is_college_verified=True,
        )

        self.category, _ = Category.objects.get_or_create(
            slug="electronics",
            defaults={"name": "Electronics", "icon_name": "Laptop", "is_active": True}
        )

        # Item with daily price of 240.00 => Hourly = 10.00
        self.item = Item.objects.create(
            owner=self.owner,
            category=self.category,
            title="Scientific Equipment Bundle",
            daily_rental_price=Decimal("240.00"),
            security_deposit=Decimal("0.00"),
            pickup_locations=["Campus Gate 1"],
            status=Item.STATUS_ACTIVE,
            is_published=True,
            min_rental_days=1,
            max_rental_days=30,
        )

    def test_one_hour_booking(self):
        self.client.force_authenticate(user=self.renter)
        start = timezone.now() + timedelta(days=1)
        end = start + timedelta(hours=1)

        payload = {
            "item_id": str(self.item.id),
            "start_datetime": start.isoformat(),
            "end_datetime": end.isoformat(),
        }
        response = self.client.post(reverse("booking-create"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(str(response.data["total_rental_fee"])), Decimal("10.00"))
        self.assertEqual(Decimal(str(response.data["hourly_rate"])), Decimal("10.00"))

    def test_five_hour_booking(self):
        self.client.force_authenticate(user=self.renter)
        start = timezone.now() + timedelta(days=2)
        end = start + timedelta(hours=5)

        payload = {
            "item_id": str(self.item.id),
            "start_datetime": start.isoformat(),
            "end_datetime": end.isoformat(),
        }
        response = self.client.post(reverse("booking-create"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(str(response.data["total_rental_fee"])), Decimal("50.00"))

    def test_partial_hour_booking(self):
        # 1.5 hours: 10.00 * 1.5 = 15.00
        self.client.force_authenticate(user=self.renter)
        start = timezone.now() + timedelta(days=3)
        end = start + timedelta(minutes=90)

        payload = {
            "item_id": str(self.item.id),
            "start_datetime": start.isoformat(),
            "end_datetime": end.isoformat(),
        }
        response = self.client.post(reverse("booking-create"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(str(response.data["total_rental_fee"])), Decimal("15.00"))

    def test_thirty_hour_booking(self):
        # 30 hours: 10.00 * 30 = 300.00
        self.client.force_authenticate(user=self.renter)
        start = timezone.now() + timedelta(days=4)
        end = start + timedelta(hours=30)

        payload = {
            "item_id": str(self.item.id),
            "start_datetime": start.isoformat(),
            "end_datetime": end.isoformat(),
        }
        response = self.client.post(reverse("booking-create"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(str(response.data["total_rental_fee"])), Decimal("300.00"))

    def test_cross_midnight_booking(self):
        self.client.force_authenticate(user=self.renter)
        base_date = timezone.now().date() + timedelta(days=5)
        current_tz = timezone.get_current_timezone()
        # 22:00 to 02:00 next day = 4 hours => 40.00
        start = timezone.make_aware(timezone.datetime.combine(base_date, timezone.datetime.min.time()), current_tz) + timedelta(hours=22)
        end = start + timedelta(hours=4)

        payload = {
            "item_id": str(self.item.id),
            "start_datetime": start.isoformat(),
            "end_datetime": end.isoformat(),
        }
        response = self.client.post(reverse("booking-create"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(str(response.data["total_rental_fee"])), Decimal("40.00"))

    def test_adjacent_half_open_bookings_do_not_conflict(self):
        # Booking 1: [10:00, 12:00)
        # Booking 2: [12:00, 14:00)
        # Must both succeed without conflict
        self.client.force_authenticate(user=self.renter)
        base = timezone.now() + timedelta(days=7)
        b1_start = base.replace(hour=10, minute=0, second=0, microsecond=0)
        b1_end = base.replace(hour=12, minute=0, second=0, microsecond=0)
        b2_start = base.replace(hour=12, minute=0, second=0, microsecond=0)
        b2_end = base.replace(hour=14, minute=0, second=0, microsecond=0)

        res1 = self.client.post(reverse("booking-create"), {
            "item_id": str(self.item.id),
            "start_datetime": b1_start.isoformat(),
            "end_datetime": b1_end.isoformat(),
        }, format="json")
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        res2 = self.client.post(reverse("booking-create"), {
            "item_id": str(self.item.id),
            "start_datetime": b2_start.isoformat(),
            "end_datetime": b2_end.isoformat(),
        }, format="json")
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)

    def test_overlapping_booking_rejected_with_conflict(self):
        # Booking 1: [10:00, 14:00)
        # Booking 2: [12:00, 16:00) => Overlaps! Must be 409 CONFLICT
        self.client.force_authenticate(user=self.renter)
        base = timezone.now() + timedelta(days=9)
        b1_start = base.replace(hour=10, minute=0, second=0, microsecond=0)
        b1_end = base.replace(hour=14, minute=0, second=0, microsecond=0)
        b2_start = base.replace(hour=12, minute=0, second=0, microsecond=0)
        b2_end = base.replace(hour=16, minute=0, second=0, microsecond=0)

        res1 = self.client.post(reverse("booking-create"), {
            "item_id": str(self.item.id),
            "start_datetime": b1_start.isoformat(),
            "end_datetime": b1_end.isoformat(),
        }, format="json")
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        res2 = self.client.post(reverse("booking-create"), {
            "item_id": str(self.item.id),
            "start_datetime": b2_start.isoformat(),
            "end_datetime": b2_end.isoformat(),
        }, format="json")
        self.assertEqual(res2.status_code, status.HTTP_409_CONFLICT)

    def test_frontend_exact_payload_same_start_and_end_date(self):
        # Frontend sends startDate == endDate and start_datetime < end_datetime
        self.client.force_authenticate(user=self.renter)
        tomorrow = timezone.now().date() + timedelta(days=5)
        start_dt = timezone.now() + timedelta(days=5)
        start_dt = start_dt.replace(hour=9, minute=0, second=0, microsecond=0)
        end_dt = start_dt.replace(hour=14, minute=0, second=0, microsecond=0)

        payload = {
            "item_id": str(self.item.id),
            "start_datetime": start_dt.isoformat(),
            "end_datetime": end_dt.isoformat(),
            "start_date": str(tomorrow),
            "end_date": str(tomorrow),
            "message_to_owner": "Need for project",
        }
        res = self.client.post(reverse("booking-create"), payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)


