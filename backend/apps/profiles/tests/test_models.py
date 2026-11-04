import uuid
from decimal import Decimal
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from django.utils import timezone

from apps.accounts.models import College, User
from apps.bookings.models import Booking
from apps.profiles.models import StudentProfile, StudentReview


class StudentProfileModelTest(TestCase):
    def setUp(self):
        self.college = College.objects.create(
            name="Aditya University",
            code="ADITYA",
            domain_whitelist=["adityauniversity.in", "aditya.ac.in"]
        )
        self.user = User.objects.create_user(
            email="samith@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Samith",
            last_name="Nitta",
            college=self.college
        )

    def test_profile_creation_and_defaults(self):
        profile = self.user.profile
        profile.roll_number = "21A91A0501"
        profile.department = "Computer Science"
        profile.year_of_study = 3
        profile.save()

        self.assertEqual(profile.reputation_as_owner, Decimal('5.00'))
        self.assertEqual(profile.reputation_as_renter, Decimal('5.00'))
        self.assertEqual(profile.total_items_lent, 0)
        self.assertEqual(profile.total_items_borrowed, 0)
        self.assertEqual(profile.total_savings_inr, Decimal('0.00'))
        self.assertEqual(profile.total_earnings_inr, Decimal('0.00'))
        self.assertEqual(profile.preferred_pickup_spots, [])
        self.assertFalse(profile.is_verified)


class StudentReviewModelTest(TestCase):
    def setUp(self):
        self.college = College.objects.create(
            name="Aditya University",
            code="ADITYA",
            domain_whitelist=["adityauniversity.in"]
        )
        self.owner = User.objects.create_user(
            email="owner@adityauniversity.in",
            password="Password123!",
            first_name="Alice",
            last_name="Owner",
            college=self.college
        )
        self.renter = User.objects.create_user(
            email="renter@adityauniversity.in",
            password="Password123!",
            first_name="Bob",
            last_name="Renter",
            college=self.college
        )
        self.booking = Booking.objects.create(
            booking_reference="RT-20261104-001",
            item_title="Engineering Graphics Drafter",
            owner=self.owner,
            renter=self.renter,
            status=Booking.STATUS_COMPLETED,
            start_date=timezone.now(),
            end_date=timezone.now() + timezone.timedelta(days=3),
            rental_price_inr=Decimal('150.00'),
            reference_purchase_price_inr=Decimal('800.00')
        )

    def test_prevent_self_review(self):
        with self.assertRaises((ValidationError, IntegrityError)):
            review = StudentReview(
                booking=self.booking,
                reviewer=self.owner,
                reviewee=self.owner,
                review_type=StudentReview.REVIEW_TYPE_OWNER,
                condition_accuracy_score=5
            )
            review.full_clean()
            review.save()

    def test_valid_owner_review_score_calculation(self):
        # Renter reviewing Owner
        review = StudentReview.objects.create(
            booking=self.booking,
            reviewer=self.renter,
            reviewee=self.owner,
            review_type=StudentReview.REVIEW_TYPE_OWNER,
            condition_accuracy_score=5,
            communication_score=4,
            punctuality_score=4,
            overall_comment="Item was in brand new condition, on time delivery!"
        )
        # Condition (5 * 0.70) = 3.50 + Comm/Punct (4 * 0.30) = 1.20 => 4.70
        self.assertEqual(review.calculated_score, Decimal('4.70'))

    def test_valid_renter_review_score_calculation(self):
        # Owner reviewing Renter
        review = StudentReview.objects.create(
            booking=self.booking,
            reviewer=self.owner,
            reviewee=self.renter,
            review_type=StudentReview.REVIEW_TYPE_RENTER,
            on_time_return_score=5,
            item_care_score=4,
            overall_comment="Returned completely intact on time."
        )
        # On-Time (5 * 0.60) = 3.00 + Item Care (4 * 0.40) = 1.60 => 4.60
        self.assertEqual(review.calculated_score, Decimal('4.60'))

    def test_prevent_review_on_non_completed_booking(self):
        pending_booking = Booking.objects.create(
            booking_reference="RT-20261104-002",
            item_title="Lab Coat & Safety Glasses",
            owner=self.owner,
            renter=self.renter,
            status=Booking.STATUS_ACTIVE,
            start_date=timezone.now(),
            end_date=timezone.now() + timezone.timedelta(days=2),
            rental_price_inr=Decimal('80.00')
        )
        with self.assertRaises(ValidationError):
            review = StudentReview(
                booking=pending_booking,
                reviewer=self.renter,
                reviewee=self.owner,
                review_type=StudentReview.REVIEW_TYPE_OWNER,
                condition_accuracy_score=5
            )
            review.full_clean()
            review.save()

