from datetime import date, timedelta
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.listings.models import Item
from apps.marketplace.models import Category
from apps.bookings.models import (
    Booking,
    HandoverVerification,
    HandoverVerificationEvent,
)
from apps.bookings.services.booking_state_machine import BookingStateMachine, BookingPermissionError
from apps.bookings.services.booking_service import BookingService
from apps.bookings.services.handover_service import HandoverService, HandoverSecurityError

User = get_user_model()


class HandoverVerificationTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email='owner@aditya.ac.in',
            first_name='Owner',
            last_name='Student',
            password='Password123!',
            email_verified=True,
            is_college_verified=True
        )
        self.renter = User.objects.create_user(
            email='renter@aditya.ac.in',
            first_name='Renter',
            last_name='Student',
            password='Password123!',
            email_verified=True,
            is_college_verified=True
        )
        self.third_party = User.objects.create_user(
            email='third@aditya.ac.in',
            first_name='Third',
            last_name='Student',
            password='Password123!',
            email_verified=True,
            is_college_verified=True
        )

        self.category = Category.objects.create(name='Camera Equipment', slug='camera-equipment')
        self.item = Item.objects.create(
            owner=self.owner,
            category=self.category,
            title='Canon 80D DSLR Kit',
            description='With 18-135mm lens and battery kit.',
            original_price=Decimal('55000.00'),
            item_age_months=12,
            condition='LIKE_NEW',
            rental_price_per_day=Decimal('200.00'),
            security_deposit=Decimal('1500.00'),
            min_rental_days=1,
            max_rental_days=7,
            pickup_location='Library Desk'
        )

        self.start_date = date.today() + timedelta(days=1)
        self.end_date = self.start_date + timedelta(days=2)

    def _setup_paid_booking(self):
        booking = BookingService.create_booking_request(
            renter_user=self.renter,
            item_id=str(self.item.id),
            start_date=self.start_date,
            end_date=self.end_date,
            pickup_spot="Library Desk"
        )
        BookingStateMachine.approve_by_owner(str(booking.id), self.owner)
        BookingStateMachine.confirm_payment(str(booking.id), payment_id="PAY-MOCK-1234")
        booking.refresh_from_db()
        return booking

    def test_owner_generates_pickup_pass(self):
        booking = self._setup_paid_booking()

        # Owner gets pass
        pass_data = HandoverService.get_or_create_pass(booking, self.owner)
        self.assertEqual(pass_data['stage'], 'PICKUP')
        self.assertIsNotNone(pass_data['otp'])
        self.assertEqual(len(pass_data['otp']), 6)
        self.assertTrue(pass_data['qr_payload'].startswith("RT-PASS:PICKUP:"))

        # Check DB stores hash, never plaintext
        verification = HandoverVerification.objects.get(booking=booking)
        self.assertNotEqual(verification.pickup_otp_hash, pass_data['otp'])
        self.assertTrue(HandoverService.verify_secret(pass_data['otp'], verification.pickup_otp_hash))
        self.assertFalse(verification.pickup_verified)

    def test_renter_cannot_generate_pickup_pass(self):
        booking = self._setup_paid_booking()
        with self.assertRaises(BookingPermissionError):
            HandoverService.get_or_create_pass(booking, self.renter)

    def test_renter_verifies_pickup_with_valid_otp(self):
        booking = self._setup_paid_booking()
        pass_data = HandoverService.get_or_create_pass(booking, self.owner)

        # Renter verifies pickup
        updated_booking = HandoverService.verify_pickup(
            booking=booking,
            renter_user=self.renter,
            method='OTP',
            credential=pass_data['otp'],
            pickup_condition='LIKE_NEW',
            pickup_notes='Clean camera kit with battery and charger.'
        )

        self.assertEqual(updated_booking.status, Booking.STATUS_ACTIVE)
        verification = HandoverVerification.objects.get(booking=booking)
        self.assertTrue(verification.pickup_verified)
        self.assertEqual(verification.pickup_confirmed_by, self.renter)
        self.assertEqual(verification.pickup_condition, 'LIKE_NEW')
        # Single-use: OTP hash cleared
        self.assertEqual(verification.pickup_otp_hash, "")

        # Audit event recorded
        event = HandoverVerificationEvent.objects.filter(
            booking=booking,
            event_type='PICKUP_VERIFIED'
        ).first()
        self.assertIsNotNone(event)
        self.assertTrue(event.success)

    def test_invalid_otp_fails_and_rate_limits_after_max_attempts(self):
        booking = self._setup_paid_booking()
        HandoverService.get_or_create_pass(booking, self.owner)

        # 4 failed attempts
        for _ in range(4):
            with self.assertRaises(HandoverSecurityError) as ctx:
                HandoverService.verify_pickup(
                    booking=booking,
                    renter_user=self.renter,
                    method='OTP',
                    credential='000000'
                )
            self.assertIn("incorrect otp", str(ctx.exception).lower())

        verification = HandoverVerification.objects.get(booking=booking)
        self.assertEqual(verification.pickup_attempt_count, 4)

        # 5th failed attempt
        with self.assertRaises(HandoverSecurityError):
            HandoverService.verify_pickup(
                booking=booking,
                renter_user=self.renter,
                method='OTP',
                credential='000000'
            )

        # 6th attempt hits maximum attempt limit
        with self.assertRaises(HandoverSecurityError) as ctx:
            HandoverService.verify_pickup(
                booking=booking,
                renter_user=self.renter,
                method='OTP',
                credential='000000'
            )
        self.assertIn("maximum failed verification attempts", str(ctx.exception).lower())

    def test_return_workflow_and_inspection_separation(self):
        booking = self._setup_paid_booking()
        pickup_pass = HandoverService.get_or_create_pass(booking, self.owner)
        HandoverService.verify_pickup(
            booking=booking,
            renter_user=self.renter,
            method='OTP',
            credential=pickup_pass['otp']
        )
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.STATUS_ACTIVE)

        # Renter gets Return Pass
        return_pass = HandoverService.get_or_create_pass(booking, self.renter)
        self.assertEqual(return_pass['stage'], 'RETURN')

        # Owner cannot get Return Pass (only Renter displays it)
        with self.assertRaises(BookingPermissionError):
            HandoverService.get_or_create_pass(booking, self.owner)

        # Owner verifies return handback
        updated = HandoverService.verify_return(
            booking=booking,
            owner_user=self.owner,
            method='OTP',
            credential=return_pass['otp'],
            return_condition='SAME',
            return_notes='Returned intact.'
        )

        self.assertEqual(updated.status, Booking.STATUS_RETURNED_PENDING_INSPECTION)
        verification = HandoverVerification.objects.get(booking=booking)
        self.assertTrue(verification.return_verified)
        self.assertEqual(verification.return_item_condition, 'SAME')

        # Security deposit is NOT prematurely refunded; still awaiting owner inspection
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.STATUS_RETURNED_PENDING_INSPECTION)
        
        # Complete inspection finishes deposit refund
        BookingStateMachine.complete_inspection(
            booking_id=str(booking.id),
            owner_user=self.owner,
            passed=True
        )
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.STATUS_COMPLETED)
