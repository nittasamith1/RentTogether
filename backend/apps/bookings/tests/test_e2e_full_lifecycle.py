import io
import uuid
from decimal import Decimal
from datetime import date, timedelta
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User, College
from apps.profiles.models import StudentVerification
from apps.marketplace.models import Category
from apps.listings.models import Item
from apps.bookings.models import Booking, HandoverVerification
from apps.bookings.services.booking_state_machine import BookingStateMachine
from apps.bookings.services.handover_service import HandoverService


def generate_test_image(name="test.jpg", color="blue"):
    file = io.BytesIO()
    image = Image.new("RGB", (100, 100), color)
    image.save(file, 'jpeg')
    file.seek(0)
    return SimpleUploadedFile(name, file.read(), content_type="image/jpeg")


class Phase18EndToEndSmokeTests(APITestCase):
    """
    Phase 18 Comprehensive End-to-End System Smoke Test:
    Student registers -> verifies ID -> lists gear -> peer discovers -> books ->
    owner approves -> payment confirmed -> dual-side QR pickup -> return handover -> completed.
    """
    def setUp(self):
        self.college = College.objects.create(
            name="Aditya Engineering College",
            domain_whitelist=["aec.edu.in"],
            code="AEC",
            is_active=True
        )

        # 1. Register Owner & Renter
        self.owner = User.objects.create_user(
            email="owner_e2e@aec.edu.in",
            password="StrongPassword123!",
            first_name="Pavan",
            last_name="Owner",
            college=self.college,
            email_verified=True,
            is_college_verified=True
        )

        self.renter = User.objects.create_user(
            email="renter_e2e@aec.edu.in",
            password="StrongPassword123!",
            first_name="Kiran",
            last_name="Renter",
            college=self.college,
            email_verified=True,
            is_college_verified=True
        )

        self.category = Category.objects.create(name="Calculators", slug="calculators")

    def test_complete_e2e_campus_rental_lifecycle(self):
        # 1. Owner lists item with image
        self.client.force_authenticate(user=self.owner)
        img = generate_test_image("calc.jpg", "blue")
        listing_res = self.client.post('/api/v1/listings/create/', {
            'title': 'TI-Nspire CX II CAS Graphing Calculator',
            'description': 'Color screen Python graphing calculator for engineering exams.',
            'category_id': str(self.category.id),
            'original_price': '12000.00',
            'rental_price_per_day': '50.00',
            'security_deposit': '0.00',
            'condition': 'LIKE_NEW',
            'pickup_location': 'ECE Department Room 204',
            'images': [img],
        }, format='multipart')
        self.assertEqual(listing_res.status_code, status.HTTP_201_CREATED)
        item_id = listing_res.data['id']

        # 2. Renter discovers item in marketplace
        self.client.force_authenticate(user=self.renter)
        search_res = self.client.get('/api/v1/marketplace/search/?q=TI-Nspire')
        self.assertEqual(search_res.status_code, status.HTTP_200_OK)
        results = search_res.data.get('results', search_res.data)
        self.assertGreaterEqual(len(results), 1)

        # 3. Renter requests booking
        tomorrow = date.today() + timedelta(days=1)
        checkout = date.today() + timedelta(days=3)
        booking_res = self.client.post('/api/v1/bookings/', {
            'item_id': item_id,
            'start_date': str(tomorrow),
            'end_date': str(checkout),
            'pickup_spot': 'Central Library Steps',
        }, format='json')
        self.assertEqual(booking_res.status_code, status.HTTP_201_CREATED)
        booking_id = booking_res.data['id']

        # 4. Owner approves booking request
        self.client.force_authenticate(user=self.owner)
        approve_res = self.client.post(f'/api/v1/bookings/{booking_id}/approve/')
        self.assertEqual(approve_res.status_code, status.HTTP_200_OK)

        # 5. Dual Cash Payment Confirmation (Renter confirms paid, Owner confirms received)
        self.client.force_authenticate(user=self.renter)
        renter_pay = self.client.post(f'/api/v1/bookings/{booking_id}/confirm-cash-payment/')
        self.assertEqual(renter_pay.status_code, status.HTTP_200_OK)

        self.client.force_authenticate(user=self.owner)
        owner_pay = self.client.post(f'/api/v1/bookings/{booking_id}/confirm-cash-payment/')
        self.assertEqual(owner_pay.status_code, status.HTTP_200_OK)

        booking = Booking.objects.get(id=booking_id)
        self.assertEqual(booking.status, Booking.STATUS_PAID_CONFIRMED)

        # 6. Pickup Handover Verification (Dual Party QR/OTP)
        # Owner retrieves pickup pass
        self.client.force_authenticate(user=self.owner)
        pass_res = self.client.get(f'/api/v1/bookings/{booking_id}/handover-pass/')
        self.assertEqual(pass_res.status_code, status.HTTP_200_OK)
        pickup_otp = pass_res.data['otp']

        # Renter inspects & verifies owner's pickup OTP
        self.client.force_authenticate(user=self.renter)
        verify_pickup_res = self.client.post(f'/api/v1/bookings/{booking_id}/verify-pickup/', {
            'method': 'OTP',
            'otp': pickup_otp
        }, format='json')
        self.assertEqual(verify_pickup_res.status_code, status.HTTP_200_OK)

        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.STATUS_ACTIVE)

        # 7. Return Handover Verification (Dual Party QR/OTP)
        # Renter retrieves return pass
        self.client.force_authenticate(user=self.renter)
        return_pass_res = self.client.get(f'/api/v1/bookings/{booking_id}/handover-pass/')
        self.assertEqual(return_pass_res.status_code, status.HTTP_200_OK)
        return_otp = return_pass_res.data['otp']

        # Owner inspects returned item & verifies return OTP
        self.client.force_authenticate(user=self.owner)
        verify_return_res = self.client.post(f'/api/v1/bookings/{booking_id}/verify-return/', {
            'method': 'OTP',
            'otp': return_otp
        }, format='json')
        self.assertEqual(verify_return_res.status_code, status.HTTP_200_OK)

        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.STATUS_RETURNED_PENDING_INSPECTION)

        # 8. Owner completes inspection -> Booking successfully COMPLETED
        inspect_res = self.client.post(f'/api/v1/bookings/{booking_id}/inspection/complete/', {
            'passed': True,
            'notes': 'Returned in like-new condition. Full deposit release.'
        }, format='json')
        self.assertEqual(inspect_res.status_code, status.HTTP_200_OK)

        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.STATUS_COMPLETED)
