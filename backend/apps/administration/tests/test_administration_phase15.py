import uuid
from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User, College
from apps.profiles.models import StudentVerification
from apps.marketplace.models import Category
from apps.listings.models import Item
from apps.bookings.models import Booking
from apps.administration.models import Dispute


class Phase15AdministrationTests(APITestCase):
    def setUp(self):
        self.college = College.objects.create(
            name="Aditya Engineering College",
            domain_whitelist=["aec.edu.in"],
            code="AEC",
            is_active=True
        )

        # Admin user
        self.admin = User.objects.create_user(
            email="admin@aec.edu.in",
            password="StrongPassword123!",
            first_name="Campus",
            last_name="Admin",
            college=self.college,
            is_staff=True,
            is_superuser=True,
            email_verified=True,
            is_college_verified=True
        )

        # Students
        self.renter = User.objects.create_user(
            email="renter@aec.edu.in",
            password="StrongPassword123!",
            first_name="Samith",
            last_name="Renter",
            college=self.college,
            email_verified=True,
            is_college_verified=False
        )

        self.owner = User.objects.create_user(
            email="owner@aec.edu.in",
            password="StrongPassword123!",
            first_name="Rahul",
            last_name="Owner",
            college=self.college,
            email_verified=True,
            is_college_verified=True
        )

        self.category = Category.objects.create(name="Lab Hardware", slug="lab-hardware")

        self.item = Item.objects.create(
            owner=self.owner,
            category=self.category,
            title="Arduino Mega Starter Kit",
            description="Complete embedded microcontroller lab kit",
            daily_rental_price=Decimal("40.00"),
            security_deposit=Decimal("0.00"),
            condition="GOOD",
            status=Item.STATUS_ACTIVE,
            is_published=True
        )

        self.booking = Booking.objects.create(
            renter=self.renter,
            owner=self.owner,
            item=self.item,
            item_title=self.item.title,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=3),
            total_days=3,
            daily_rate=Decimal("40.00"),
            total_rental_fee=Decimal("120.00"),
            security_deposit=Decimal("0.00"),
            status=Booking.STATUS_ACTIVE,
            pickup_spot="Central Library Gate"
        )

        self.verification = StudentVerification.objects.create(
            user=self.renter,
            college=self.college,
            roll_number="21A91A0501",
            department="CSE",
            year_of_study=3,
            verification_status="PENDING"
        )

    def test_admin_pending_verifications_list(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.get('/api/admin/pending-verifications/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data)
        self.assertGreaterEqual(len(results), 1)

    def test_admin_verify_student_approve(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(f'/api/admin/verify-student/{self.verification.id}/', {
            'action': 'APPROVE'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.verification.refresh_from_db()
        self.assertEqual(self.verification.verification_status, 'VERIFIED')
        self.renter.refresh_from_db()
        self.assertTrue(self.renter.is_college_verified)

    def test_admin_verify_student_reject(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(f'/api/admin/verify-student/{self.verification.id}/', {
            'action': 'REJECT',
            'rejection_reason': 'ID card photo blurred and unreadable'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.verification.refresh_from_db()
        self.assertEqual(self.verification.verification_status, 'REJECTED')
        self.assertEqual(self.verification.rejection_reason, 'ID card photo blurred and unreadable')

    def test_student_raise_and_admin_resolve_dispute(self):
        # 1. Renter raises a dispute
        self.client.force_authenticate(user=self.renter)
        dispute_res = self.client.post('/api/disputes/', {
            'booking_id': str(self.booking.id),
            'issue_type': 'DAMAGED_ITEM',
            'description': 'Microcontroller USB port was damaged during lab demonstration.',
            'claimed_compensation': '500.00'
        }, format='json')
        self.assertEqual(dispute_res.status_code, status.HTTP_201_CREATED)
        dispute_id = dispute_res.data['id']

        # Booking is now marked as DISPUTED
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, Booking.STATUS_DISPUTED)

        # 2. Admin views disputes
        self.client.force_authenticate(user=self.admin)
        list_res = self.client.get('/api/admin/disputes/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)

        # 3. Admin adjudicates and resolves dispute
        resolve_res = self.client.post(f'/api/admin/resolve-dispute/{dispute_id}/', {
            'resolution_decision': Dispute.DECISION_FORFEIT_DEPOSIT_TO_OWNER,
            'admin_notes': 'Physical inspection confirmed damaged port. ₹500 repair compensation awarded to owner.'
        }, format='json')
        self.assertEqual(resolve_res.status_code, status.HTTP_200_OK)

        dispute = Dispute.objects.get(id=dispute_id)
        self.assertEqual(dispute.status, Dispute.STATUS_RESOLVED)
        self.assertEqual(dispute.resolution_decision, Dispute.DECISION_FORFEIT_DEPOSIT_TO_OWNER)
        self.assertEqual(dispute.resolved_by, self.admin)

    def test_admin_platform_analytics(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.get('/api/admin/platform-analytics/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('users', res.data)
        self.assertIn('marketplace', res.data)
        self.assertIn('financials', res.data)
        self.assertIn('safety_and_disputes', res.data)
        self.assertGreaterEqual(res.data['users']['total_students'], 2)
