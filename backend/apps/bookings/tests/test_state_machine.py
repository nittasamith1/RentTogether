from datetime import date, timedelta
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.listings.models import Item
from apps.marketplace.models import Category
from apps.bookings.models import Booking, BookingStatusHistory
from apps.bookings.services.booking_state_machine import (
    BookingStateMachine,
    BookingPermissionError,
    InvalidStateTransitionError,
)
from apps.bookings.services.booking_service import BookingService
from apps.availability.models import ItemAvailabilityBlock

User = get_user_model()


class BookingLifecycleStateMachineTests(TestCase):
    def setUp(self):
        # 1. Create Owner and Renter
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

        # 2. Category & Item
        self.category = Category.objects.create(
            name='Lab Equipment',
            slug='lab-equipment'
        )
        self.item = Item.objects.create(
            owner=self.owner,
            category=self.category,
            title='Digital Oscilloscope 100MHz',
            description='Precision dual-channel oscilloscope for ECE labs.',
            original_price=Decimal('15000.00'),
            item_age_months=6,
            condition='LIKE_NEW',
            rental_price_per_day=Decimal('120.00'),
            security_deposit=Decimal('500.00'),
            min_rental_days=1,
            max_rental_days=14,
            pickup_location='ECE Lab 204'
        )

        self.start_date = date.today() + timedelta(days=2)
        self.end_date = self.start_date + timedelta(days=3)  # 3 days rental

    def test_prevent_self_booking(self):
        with self.assertRaises(ValidationError) as ctx:
            BookingService.create_booking_request(
                renter_user=self.owner,
                item_id=str(self.item.id),
                start_date=self.start_date,
                end_date=self.end_date
            )
        self.assertIn("cannot rent your own listed equipment", str(ctx.exception).lower())

    def test_create_booking_calculates_fees_and_snapshot(self):
        booking = BookingService.create_booking_request(
            renter_user=self.renter,
            item_id=str(self.item.id),
            start_date=self.start_date,
            end_date=self.end_date,
            pickup_spot="ECE Lab 204"
        )

        self.assertEqual(booking.status, Booking.STATUS_PENDING_APPROVAL)
        self.assertEqual(booking.total_days, 3)
        self.assertEqual(booking.daily_rate, Decimal('120.00'))
        self.assertEqual(booking.total_rental_fee, Decimal('360.00'))
        self.assertEqual(booking.security_deposit, Decimal('0.00'))
        self.assertEqual(booking.total_amount, Decimal('360.00'))
        self.assertTrue(booking.booking_code.startswith("RT-"))
        self.assertIsNotNone(booking.approval_deadline)

    def test_owner_approval_creates_availability_hold(self):
        booking = BookingService.create_booking_request(
            renter_user=self.renter,
            item_id=str(self.item.id),
            start_date=self.start_date,
            end_date=self.end_date
        )

        # Owner approves
        approved_booking = BookingStateMachine.approve_by_owner(
            booking_id=str(booking.id),
            owner_user=self.owner
        )
        self.assertEqual(approved_booking.status, Booking.STATUS_APPROVED_PENDING_PAYMENT)
        self.assertIsNotNone(approved_booking.approved_at)
        self.assertIsNotNone(approved_booking.payment_deadline)

        # Check availability block created
        hold_block = ItemAvailabilityBlock.objects.filter(
            item=self.item,
            booking_reference=booking,
            reason='BOOKED'
        ).first()
        self.assertIsNotNone(hold_block)
        self.assertEqual(hold_block.start_date, self.start_date)
        self.assertEqual(hold_block.end_date, self.end_date)
        self.assertIsNotNone(hold_block.expires_at)

    def test_renter_cannot_approve_request(self):
        booking = BookingService.create_booking_request(
            renter_user=self.renter,
            item_id=str(self.item.id),
            start_date=self.start_date,
            end_date=self.end_date
        )

        with self.assertRaises(BookingPermissionError) as ctx:
            BookingStateMachine.approve_by_owner(
                booking_id=str(booking.id),
                owner_user=self.renter
            )
        self.assertIn("only the item owner can approve", str(ctx.exception).lower())

    def test_full_successful_lifecycle(self):
        # 1. Request
        booking = BookingService.create_booking_request(
            renter_user=self.renter,
            item_id=str(self.item.id),
            start_date=self.start_date,
            end_date=self.end_date
        )

        # 2. Approve
        BookingStateMachine.approve_by_owner(
            booking_id=str(booking.id),
            owner_user=self.owner
        )

        # 3. Confirm Payment
        BookingStateMachine.confirm_payment(
            booking_id=str(booking.id),
            payment_id="PAY-TEST-9988"
        )
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.STATUS_PAID_CONFIRMED)
        self.assertIsNotNone(booking.handover_pass_code)
        self.assertTrue(booking.handover_pass_code.startswith("HP-"))
        self.assertEqual(len(booking.handover_pass_code), 9)

        # Block should have permanent hold (expires_at cleared)
        hold_block = ItemAvailabilityBlock.objects.get(booking_reference=booking)
        self.assertIsNone(hold_block.expires_at)

        # 4. Handover verification (owner verifies renter's code)
        code = booking.handover_pass_code
        BookingStateMachine.confirm_handover(
            booking_id=str(booking.id),
            actor_user=self.owner,
            pass_code=code
        )
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.STATUS_ACTIVE)
        self.assertIsNotNone(booking.handover_at)

        # 5. Return initiation by renter
        BookingStateMachine.initiate_return(
            booking_id=str(booking.id),
            renter_user=self.renter
        )
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.STATUS_RETURNED_PENDING_INSPECTION)
        self.assertIsNotNone(booking.returned_at)

        # 6. Inspection by owner (success)
        BookingStateMachine.complete_inspection(
            booking_id=str(booking.id),
            owner_user=self.owner,
            passed=True,
            notes="Item in flawless condition."
        )
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.STATUS_COMPLETED)
        self.assertIsNotNone(booking.completed_at)

    def test_rejection_releases_availability(self):
        booking = BookingService.create_booking_request(
            renter_user=self.renter,
            item_id=str(self.item.id),
            start_date=self.start_date,
            end_date=self.end_date
        )

        # Owner rejects while in PENDING_APPROVAL
        BookingStateMachine.reject_by_owner(
            booking_id=str(booking.id),
            owner_user=self.owner,
            reason="Schedule conflict"
        )
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.STATUS_REJECTED)
        self.assertEqual(ItemAvailabilityBlock.objects.filter(booking_reference=booking).count(), 0)

    def test_cancellation_releases_approved_hold(self):
        booking = BookingService.create_booking_request(
            renter_user=self.renter,
            item_id=str(self.item.id),
            start_date=self.start_date,
            end_date=self.end_date
        )
        BookingStateMachine.approve_by_owner(
            booking_id=str(booking.id),
            owner_user=self.owner
        )
        self.assertEqual(ItemAvailabilityBlock.objects.filter(booking_reference=booking).count(), 1)

        # Renter cancels before paying
        BookingStateMachine.cancel_booking(
            booking_id=str(booking.id),
            user=self.renter,
            reason="Change of plans"
        )
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.STATUS_CANCELLED)
        self.assertEqual(ItemAvailabilityBlock.objects.filter(booking_reference=booking).count(), 0)

    def test_zero_deposit_and_zero_platform_fee(self):
        """V1 Policy: Zero security deposits, zero platform fees, total equals rental fee."""
        booking = BookingService.create_booking_request(
            renter_user=self.renter,
            item_id=str(self.item.id),
            start_date=self.start_date,
            end_date=self.end_date
        )
        self.assertEqual(booking.security_deposit, Decimal('0.00'))
        self.assertEqual(booking.platform_fee, Decimal('0.00'))
        self.assertEqual(booking.total_amount, booking.total_rental_fee)
        self.assertEqual(booking.payment_method, 'OFFLINE_CASH')

    def test_dual_offline_cash_confirmation_workflow(self):
        """
        Tests the V1 dual offline cash confirmation:
        1. Renter confirms cash handed over.
        2. Owner confirms exact cash received.
        3. Only when BOTH have confirmed does status become PAID_CONFIRMED (CASH_PAYMENT_CONFIRMED).
        """
        booking = BookingService.create_booking_request(
            renter_user=self.renter,
            item_id=str(self.item.id),
            start_date=self.start_date,
            end_date=self.end_date
        )
        BookingStateMachine.approve_by_owner(
            booking_id=str(booking.id),
            owner_user=self.owner
        )

        # Step 1: Renter confirms cash handed over
        BookingStateMachine.record_cash_confirmation(str(booking.id), self.renter)
        booking.refresh_from_db()
        self.assertTrue(booking.renter_cash_confirmed)
        self.assertIsNotNone(booking.renter_cash_confirmed_at)
        self.assertFalse(booking.owner_cash_confirmed)
        # Booking still awaiting owner cash confirmation
        self.assertEqual(booking.status, Booking.STATUS_APPROVED_PENDING_PAYMENT)

        # Cannot confirm twice
        from django.core.exceptions import ValidationError
        with self.assertRaises(ValidationError):
            BookingStateMachine.record_cash_confirmation(str(booking.id), self.renter)

        # Step 2: Owner confirms cash received
        BookingStateMachine.record_cash_confirmation(str(booking.id), self.owner)
        booking.refresh_from_db()
        self.assertTrue(booking.owner_cash_confirmed)
        self.assertIsNotNone(booking.owner_cash_confirmed_at)
        # Now BOTH confirmed -> becomes PAID_CONFIRMED (CASH_PAYMENT_CONFIRMED)
        self.assertEqual(booking.status, Booking.STATUS_PAID_CONFIRMED)
        self.assertIsNotNone(booking.paid_at)

    def test_unauthorized_third_party_cannot_confirm_cash(self):
        """Unauthorized users cannot confirm cash for someone else's booking."""
        third_party = User.objects.create_user(
            email="intruder@vnrvjiet.in",
            password="Password123!",
            first_name="Intruder",
            last_name="Student",
            college=self.owner.college,
            is_college_verified=True
        )
        booking = BookingService.create_booking_request(
            renter_user=self.renter,
            item_id=str(self.item.id),
            start_date=self.start_date,
            end_date=self.end_date
        )
        BookingStateMachine.approve_by_owner(
            booking_id=str(booking.id),
            owner_user=self.owner
        )

        with self.assertRaises(BookingPermissionError):
            BookingStateMachine.record_cash_confirmation(str(booking.id), third_party)
