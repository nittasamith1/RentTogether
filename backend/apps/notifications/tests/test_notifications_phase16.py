import uuid
from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User, College
from apps.marketplace.models import Category
from apps.listings.models import Item
from apps.bookings.models import Booking
from apps.bookings.tasks import (
    check_unanswered_booking_requests,
    send_return_due_reminders,
    mark_overdue_bookings,
)
from apps.notifications.models import Notification
from apps.notifications.services import send_notification


class Phase16NotificationsAndCeleryTests(APITestCase):
    def setUp(self):
        self.college = College.objects.create(
            name="Aditya Engineering College",
            domain_whitelist=["aec.edu.in"],
            code="AEC",
            is_active=True
        )

        self.renter = User.objects.create_user(
            email="renter_p16@aec.edu.in",
            password="StrongPassword123!",
            first_name="Renter",
            last_name="Student",
            college=self.college,
            email_verified=True,
            is_college_verified=True
        )

        self.owner = User.objects.create_user(
            email="owner_p16@aec.edu.in",
            password="StrongPassword123!",
            first_name="Owner",
            last_name="Student",
            college=self.college,
            email_verified=True,
            is_college_verified=True
        )

        self.category = Category.objects.create(name="Calculators", slug="calculators")

        self.item = Item.objects.create(
            owner=self.owner,
            category=self.category,
            title="Casio fx-991EX ClassWiz",
            description="Scientific calculator for engineering exams",
            daily_rental_price=Decimal("20.00"),
            security_deposit=Decimal("0.00"),
            condition="LIKE_NEW",
            status=Item.STATUS_ACTIVE,
            is_published=True
        )

    def test_check_unanswered_booking_requests_task(self):
        # Create a booking request older than 24 hours
        old_booking = Booking.objects.create(
            renter=self.renter,
            owner=self.owner,
            item=self.item,
            item_title=self.item.title,
            start_date=date.today() + timedelta(days=2),
            end_date=date.today() + timedelta(days=4),
            total_days=2,
            daily_rate=Decimal("20.00"),
            total_rental_fee=Decimal("40.00"),
            status=Booking.STATUS_PENDING_APPROVAL,
            pickup_spot="Tech Gate 1"
        )
        # Artificially set created_at to 26 hours ago
        Booking.objects.filter(id=old_booking.id).update(
            created_at=timezone.now() - timedelta(hours=26)
        )

        cancelled_count = check_unanswered_booking_requests()
        self.assertGreaterEqual(cancelled_count, 1)

        old_booking.refresh_from_db()
        self.assertEqual(old_booking.status, Booking.STATUS_CANCELLED)

        # Verify notifications created
        notifs = Notification.objects.filter(booking=old_booking, event_type="BOOKING_EXPIRED")
        self.assertEqual(notifs.count(), 2)

    def test_send_return_due_reminders_task(self):
        # Create an active booking due in 24 hours
        due_soon_booking = Booking.objects.create(
            renter=self.renter,
            owner=self.owner,
            item=self.item,
            item_title=self.item.title,
            start_date=date.today() - timedelta(days=1),
            end_date=date.today() + timedelta(days=1),
            end_datetime=timezone.now() + timedelta(hours=24),
            total_days=2,
            daily_rate=Decimal("20.00"),
            total_rental_fee=Decimal("40.00"),
            status=Booking.STATUS_ACTIVE,
            pickup_spot="Library"
        )

        reminded_count = send_return_due_reminders()
        self.assertGreaterEqual(reminded_count, 1)

        notif = Notification.objects.filter(
            recipient=self.renter,
            booking=due_soon_booking,
            event_type='RETURN_REMINDER_24H'
        ).first()
        self.assertIsNotNone(notif)
        self.assertIn("Due in 24 Hours", notif.title)

    def test_mark_overdue_bookings_task(self):
        # Create an active booking whose end time has passed
        overdue_booking = Booking.objects.create(
            renter=self.renter,
            owner=self.owner,
            item=self.item,
            item_title=self.item.title,
            start_date=date.today() - timedelta(days=3),
            end_date=date.today() - timedelta(days=1),
            end_datetime=timezone.now() - timedelta(hours=2),
            total_days=2,
            daily_rate=Decimal("20.00"),
            total_rental_fee=Decimal("40.00"),
            status=Booking.STATUS_ACTIVE,
            pickup_spot="Library"
        )

        overdue_count = mark_overdue_bookings()
        self.assertGreaterEqual(overdue_count, 1)

        overdue_booking.refresh_from_db()
        self.assertEqual(overdue_booking.status, Booking.STATUS_OVERDUE)

        renter_notif = Notification.objects.filter(
            recipient=self.renter,
            booking=overdue_booking,
            event_type='RENTAL_OVERDUE'
        ).first()
        self.assertIsNotNone(renter_notif)

    def test_notification_api_endpoints(self):
        # Send sample notifications
        n1 = send_notification(
            recipient=self.renter,
            event_type="SYSTEM_ALERT",
            title="Welcome to RentTogether",
            message="Your account is active.",
            link_url="/marketplace"
        )
        n2 = send_notification(
            recipient=self.renter,
            event_type="DISPUTE_UPDATE",
            title="Dispute Closed",
            message="Your dispute was reviewed.",
            link_url="/profile"
        )

        self.client.force_authenticate(user=self.renter)

        # 1. GET /api/notifications/
        list_res = self.client.get('/api/notifications/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        results = list_res.data.get('results', list_res.data)
        self.assertGreaterEqual(len(results), 2)

        # 2. PATCH /api/notifications/<id>/read/
        patch_res = self.client.patch(f'/api/notifications/{n1.id}/read/')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        n1.refresh_from_db()
        self.assertTrue(n1.is_read)

        # 3. POST /api/notifications/mark-all-read/
        bulk_res = self.client.post('/api/notifications/mark-all-read/')
        self.assertEqual(bulk_res.status_code, status.HTTP_200_OK)
        n2.refresh_from_db()
        self.assertTrue(n2.is_read)
