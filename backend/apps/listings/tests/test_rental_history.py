import uuid
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.marketplace.models import Category
from apps.listings.models import Item
from apps.bookings.models import Booking

User = get_user_model()


class RentalHistoryViewTests(APITestCase):
    def setUp(self):
        # Create Owner
        self.owner = User.objects.create_user(
            email="owner.student@aditya.ac.in",
            username="owner_student",
            password="StrongPassword123!",
            first_name="Owner",
            last_name="Student",
            email_verified=True,
            is_college_verified=True,
        )

        # Create Renter
        self.renter = User.objects.create_user(
            email="renter.student@aditya.ac.in",
            username="renter_student",
            password="StrongPassword123!",
            first_name="Renter",
            last_name="Borrower",
            email_verified=True,
            is_college_verified=True,
        )

        # Create Third-Party Student
        self.other_student = User.objects.create_user(
            email="other.student@aditya.ac.in",
            username="other_student",
            password="StrongPassword123!",
            email_verified=True,
            is_college_verified=True,
        )

        # Category
        self.category, _ = Category.objects.get_or_create(
            slug="calculators",
            defaults={"name": "Scientific Calculators", "description": "Calculators"}
        )

        # Item owned by self.owner
        self.item = Item.objects.create(
            owner=self.owner,
            category=self.category,
            title="Casio fx-991CW ClassWiz Scientific Calculator",
            description="Official exam-approved calculator in pristine condition.",
            rental_price_per_day=Decimal("10.00"),
            security_deposit=Decimal("0.00"),
            condition="LIKE_NEW",
            status=Item.STATUS_ACTIVE,
        )

    def test_owner_can_fetch_empty_rental_history(self):
        """Owner can view rental history when no bookings exist yet."""
        self.client.force_authenticate(user=self.owner)
        url = f"/api/v1/listings/{self.item.id}/rental-history/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["item_id"], str(self.item.id))
        self.assertEqual(response.data["item_title"], self.item.title)
        self.assertEqual(response.data["rental_history"], [])

    def test_owner_can_fetch_populated_rental_history(self):
        """Owner receives detailed booking history records with zero deposit guarantee."""
        # Create a completed booking
        now = timezone.now().date()
        booking = Booking.objects.create(
            booking_code=f"RT-{uuid.uuid4().hex[:6].upper()}",
            item=self.item,
            item_title=self.item.title,
            owner=self.owner,
            renter=self.renter,
            start_date=now - timedelta(days=5),
            end_date=now - timedelta(days=2),
            total_days=3,
            daily_rate=Decimal("10.00"),
            total_rental_fee=Decimal("30.00"),
            security_deposit=Decimal("0.00"),
            total_amount=Decimal("30.00"),
            status=Booking.STATUS_COMPLETED,
            pickup_spot="Central Library Gate",
            returned_at=timezone.now(),
        )

        self.client.force_authenticate(user=self.owner)
        url = f"/api/v1/listings/{self.item.id}/rental-history/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        history = response.data["rental_history"]
        self.assertEqual(len(history), 1)
        record = history[0]
        self.assertEqual(record["id"], str(booking.id))
        self.assertEqual(record["renter_name"], "Renter Borrower")
        self.assertEqual(record["status"], Booking.STATUS_COMPLETED)
        self.assertEqual(record["rental_price_inr"], 30.0)
        self.assertEqual(record["deposit_amount_inr"], 0.0)
        self.assertEqual(record["pickup_spot"], "Central Library Gate")

    def test_other_student_cannot_view_rental_history(self):
        """Students cannot view rental history of items they do not own."""
        self.client.force_authenticate(user=self.other_student)
        url = f"/api/v1/listings/{self.item.id}/rental-history/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_user_rejected(self):
        """Unauthenticated requests are rejected with 401."""
        url = f"/api/v1/listings/{self.item.id}/rental-history/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_nonexistent_item_returns_404(self):
        """Requests for non-existent item UUID return 404."""
        self.client.force_authenticate(user=self.owner)
        url = f"/api/v1/listings/{uuid.uuid4()}/rental-history/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

