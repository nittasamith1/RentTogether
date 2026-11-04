from decimal import Decimal
from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import College, User
from apps.bookings.models import Booking
from apps.profiles.models import StudentReview, StudentProfile
from apps.profiles.services.reputation_service import (
    calculate_owner_reputation,
    calculate_renter_reputation,
    get_reputation_badge,
    update_student_reputation,
)


class ReputationEngineTest(TestCase):
    def setUp(self):
        self.college = College.objects.create(
            name="Aditya University",
            code="ADITYA",
            domain_whitelist=["adityauniversity.in"]
        )
        self.user_owner = User.objects.create_user(
            email="lender@adityauniversity.in",
            password="Password123!",
            first_name="Lender",
            last_name="Student",
            college=self.college
        )
        self.user_renter1 = User.objects.create_user(
            email="borrower1@adityauniversity.in",
            password="Password123!",
            first_name="Borrower",
            last_name="One",
            college=self.college
        )
        self.user_renter2 = User.objects.create_user(
            email="borrower2@adityauniversity.in",
            password="Password123!",
            first_name="Borrower",
            last_name="Two",
            college=self.college
        )

        self.booking1 = Booking.objects.create(
            booking_reference="RT-REP-001",
            item_title="TI-84 Plus CE Calculator",
            owner=self.user_owner,
            renter=self.user_renter1,
            status=Booking.STATUS_COMPLETED,
            start_date=timezone.now() - timezone.timedelta(days=10),
            end_date=timezone.now() - timezone.timedelta(days=7),
            rental_price_inr=Decimal('200.00')
        )
        self.booking2 = Booking.objects.create(
            booking_reference="RT-REP-002",
            item_title="Arduino Uno Starter Kit",
            owner=self.user_owner,
            renter=self.user_renter2,
            status=Booking.STATUS_COMPLETED,
            start_date=timezone.now() - timezone.timedelta(days=4),
            end_date=timezone.now() - timezone.timedelta(days=2),
            rental_price_inr=Decimal('150.00')
        )

    def test_badges_thresholds(self):
        self.assertEqual(get_reputation_badge(None, 0), "New Member")
        self.assertEqual(get_reputation_badge(Decimal('4.95'), 5), "Excellent")
        self.assertEqual(get_reputation_badge(Decimal('4.80'), 2), "Excellent")
        self.assertEqual(get_reputation_badge(Decimal('4.65'), 4), "Trusted")
        self.assertEqual(get_reputation_badge(Decimal('4.50'), 1), "Trusted")
        self.assertEqual(get_reputation_badge(Decimal('4.20'), 3), "Reliable")
        self.assertEqual(get_reputation_badge(Decimal('4.00'), 2), "Reliable")
        self.assertEqual(get_reputation_badge(Decimal('3.85'), 6), "Developing")

    def test_owner_reputation_decay_calculation(self):
        # First (older) review: 4.0 condition, 4.0 comm/punct => 4.00
        r1 = StudentReview.objects.create(
            booking=self.booking1,
            reviewer=self.user_renter1,
            reviewee=self.user_owner,
            review_type=StudentReview.REVIEW_TYPE_OWNER,
            condition_accuracy_score=4,
            communication_score=4,
            punctuality_score=4
        )
        # Manually backdate created_at to guarantee order
        StudentReview.objects.filter(id=r1.id).update(created_at=timezone.now() - timezone.timedelta(days=5))

        # Second (newer) review: 5.0 condition, 5.0 comm/punct => 5.00
        StudentReview.objects.create(
            booking=self.booking2,
            reviewer=self.user_renter2,
            reviewee=self.user_owner,
            review_type=StudentReview.REVIEW_TYPE_OWNER,
            condition_accuracy_score=5,
            communication_score=5,
            punctuality_score=5
        )

        score, count = calculate_owner_reputation(self.user_owner.id)
        self.assertEqual(count, 2)
        # Because decay factor gives higher weight (1.0) to newest (5.00) and 0.85 to older (4.00):
        # (1.0 * 5.00 + 0.85 * 4.00) / 1.85 = (5.00 + 3.40) / 1.85 = 8.40 / 1.85 = 4.54
        self.assertEqual(score, Decimal('4.54'))
        self.assertEqual(get_reputation_badge(score, count), "Trusted")

    def test_update_student_reputation_persists_to_profile(self):
        profile = self.user_owner.profile
        StudentReview.objects.create(
            booking=self.booking1,
            reviewer=self.user_renter1,
            reviewee=self.user_owner,
            review_type=StudentReview.REVIEW_TYPE_OWNER,
            condition_accuracy_score=5,
            communication_score=5,
            punctuality_score=5
        )
        update_student_reputation(self.user_owner.id)
        profile.refresh_from_db()
        self.assertEqual(profile.reputation_as_owner, Decimal('5.00'))

