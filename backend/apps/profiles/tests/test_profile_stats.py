from decimal import Decimal
from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import College, User
from apps.bookings.models import Booking
from apps.profiles.models import StudentProfile
from apps.profiles.services.profile_stats_service import (
    calculate_owner_stats,
    calculate_renter_stats,
    sync_profile_stats,
)


class ProfileStatsServiceTest(TestCase):
    def setUp(self):
        self.college = College.objects.create(
            name="Aditya University",
            code="ADITYA",
            domain_whitelist=["adityauniversity.in"]
        )
        self.owner = User.objects.create_user(
            email="samith.owner@adityauniversity.in",
            password="Password123!",
            first_name="Samith",
            last_name="Nitta",
            college=self.college
        )
        self.renter = User.objects.create_user(
            email="renter.student@adityauniversity.in",
            password="Password123!",
            first_name="Peer",
            last_name="Student",
            college=self.college
        )

        # Booking 1: Completed. Rental = 250, Purchase Price = 1200 => Savings = 950
        Booking.objects.create(
            booking_reference="BK-STATS-001",
            item_title="Digital Storage Oscilloscope",
            owner=self.owner,
            renter=self.renter,
            status=Booking.STATUS_COMPLETED,
            start_date=timezone.now() - timezone.timedelta(days=5),
            end_date=timezone.now() - timezone.timedelta(days=2),
            rental_price_inr=Decimal('250.00'),
            reference_purchase_price_inr=Decimal('1200.00')
        )

        # Booking 2: Completed. Rental = 100, Purchase Price = 500 => Savings = 400
        Booking.objects.create(
            booking_reference="BK-STATS-002",
            item_title="Scientific Calculator FX-991CW",
            owner=self.owner,
            renter=self.renter,
            status=Booking.STATUS_COMPLETED,
            start_date=timezone.now() - timezone.timedelta(days=2),
            end_date=timezone.now() - timezone.timedelta(days=1),
            rental_price_inr=Decimal('100.00'),
            reference_purchase_price_inr=Decimal('500.00')
        )

        # Booking 3: Active (in progress, should NOT count towards completed stats)
        Booking.objects.create(
            booking_reference="BK-STATS-003",
            item_title="Robotics Sensor Kit",
            owner=self.owner,
            renter=self.renter,
            status=Booking.STATUS_ACTIVE,
            start_date=timezone.now(),
            end_date=timezone.now() + timezone.timedelta(days=3),
            rental_price_inr=Decimal('180.00')
        )

    def test_owner_stats_calculation(self):
        owner_stats = calculate_owner_stats(self.owner)
        self.assertEqual(owner_stats['total_items_lent'], 2)
        self.assertEqual(owner_stats['completed_lending_transactions'], 2)
        self.assertEqual(owner_stats['total_rental_earnings'], Decimal('350.00'))

    def test_renter_stats_calculation(self):
        renter_stats = calculate_renter_stats(self.renter)
        self.assertEqual(renter_stats['total_items_borrowed'], 2)
        self.assertEqual(renter_stats['active_rentals'], 1)
        self.assertEqual(renter_stats['total_rental_spending'], Decimal('350.00'))
        # 950 + 400 = 1350 savings
        self.assertEqual(renter_stats['total_savings_inr'], Decimal('1350.00'))

    def test_sync_profile_stats_persists_correctly(self):
        profile = sync_profile_stats(self.owner)
        self.assertEqual(profile.total_items_lent, 2)
        self.assertEqual(profile.total_earnings_inr, Decimal('350.00'))

        renter_profile = sync_profile_stats(self.renter)
        self.assertEqual(renter_profile.total_items_borrowed, 2)
        self.assertEqual(renter_profile.total_savings_inr, Decimal('1350.00'))

