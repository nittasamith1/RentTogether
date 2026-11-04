from decimal import Decimal
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.accounts.models import College, User
from apps.bookings.models import Booking
from apps.profiles.models import StudentReview, StudentProfile
from apps.profiles.services.review_service import submit_student_review


class ReviewServiceTest(TestCase):
    def setUp(self):
        self.college = College.objects.create(
            name="Aditya University",
            code="ADITYA",
            domain_whitelist=["adityauniversity.in"]
        )
        self.owner = User.objects.create_user(
            email="owner@adityauniversity.in",
            password="Password123!",
            first_name="Owner",
            last_name="Student",
            college=self.college
        )
        self.renter = User.objects.create_user(
            email="renter@adityauniversity.in",
            password="Password123!",
            first_name="Renter",
            last_name="Student",
            college=self.college
        )
        self.stranger = User.objects.create_user(
            email="stranger@adityauniversity.in",
            password="Password123!",
            first_name="Third",
            last_name="Party",
            college=self.college
        )

        self.booking = Booking.objects.create(
            booking_reference="RT-REV-001",
            item_title="Electronic Lab Breadboard & Components",
            owner=self.owner,
            renter=self.renter,
            status=Booking.STATUS_COMPLETED,
            start_date=timezone.now() - timezone.timedelta(days=3),
            end_date=timezone.now() - timezone.timedelta(days=1),
            rental_price_inr=Decimal('120.00'),
            reference_purchase_price_inr=Decimal('600.00')
        )

    def test_renter_submits_owner_review_successfully(self):
        review = submit_student_review(
            booking_id=self.booking.id,
            reviewer=self.renter,
            review_type=StudentReview.REVIEW_TYPE_OWNER,
            scores={
                'condition_accuracy_score': 5,
                'communication_score': 5,
                'punctuality_score': 5,
            },
            overall_comment="Great experience, perfectly working parts!"
        )
        self.assertIsNotNone(review.id)
        self.assertEqual(review.calculated_score, Decimal('5.00'))

        # Check owner profile updated
        owner_profile = StudentProfile.objects.get(user=self.owner)
        self.assertEqual(owner_profile.reputation_as_owner, Decimal('5.00'))

    def test_prevent_unauthorized_party_from_reviewing(self):
        with self.assertRaises(ValidationError):
            submit_student_review(
                booking_id=self.booking.id,
                reviewer=self.stranger,
                review_type=StudentReview.REVIEW_TYPE_OWNER,
                scores={'condition_accuracy_score': 5}
            )

    def test_prevent_duplicate_review_submission(self):
        submit_student_review(
            booking_id=self.booking.id,
            reviewer=self.renter,
            review_type=StudentReview.REVIEW_TYPE_OWNER,
            scores={'condition_accuracy_score': 5, 'communication_score': 5}
        )
        with self.assertRaises(ValidationError):
            submit_student_review(
                booking_id=self.booking.id,
                reviewer=self.renter,
                review_type=StudentReview.REVIEW_TYPE_OWNER,
                scores={'condition_accuracy_score': 4}
            )

