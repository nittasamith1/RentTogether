import io
from PIL import Image
from django.test import TestCase
from django.urls import reverse
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import College, User, EmailOTP
from apps.profiles.models import StudentVerification


def generate_test_image():
    file = io.BytesIO()
    image = Image.new('RGB', (100, 100), color='blue')
    image.save(file, 'jpeg')
    file.seek(0)
    return SimpleUploadedFile("test_id.jpg", file.read(), content_type="image/jpeg")


class Phase02AuthTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.college = College.objects.create(
            name="VNR Vignana Jyothi Institute of Engineering & Technology",
            code="VNRVJIET",
            domain_whitelist=["vnrvjiet.in", "vnrvjiet.ac.in"],
            address="Hyderabad, Telangana",
            is_active=True
        )

        # Create Admin
        self.admin = User.objects.create_superuser(
            email="admin@vnrvjiet.in",
            username="admin",
            password="AdminPassword123!",
            first_name="Campus",
            last_name="Admin",
            college=self.college,
            email_verified=True,
            is_college_verified=True
        )

    def test_01_get_active_college(self):
        response = self.client.get(reverse('college-active'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], "VNRVJIET")
        self.assertIn("vnrvjiet.in", response.data['domain_whitelist'])

    def test_02_registration_rejects_non_institutional_email(self):
        payload = {
            "full_name": "John Doe",
            "email": "john.doe@gmail.com",  # Non-institutional
            "password": "SecurePassword123!",
            "roll_number": "22071A0501",
            "department": "CSE",
            "year_of_study": 2,
        }
        response = self.client.post(reverse('auth-register'), payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_03_registration_success_and_otp_dispatch(self):
        payload = {
            "full_name": "Ravi Kumar",
            "email": "ravi.kumar@vnrvjiet.in",
            "password": "StudentPassword123!",
            "roll_number": "22071A0502",
            "department": "Computer Science",
            "year_of_study": 3,
            "id_card_image": generate_test_image(),
        }
        response = self.client.post(reverse('auth-register'), payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(email="ravi.kumar@vnrvjiet.in")
        self.assertFalse(user.email_verified)
        self.assertFalse(user.is_college_verified)

        # Check verification record
        verification = StudentVerification.objects.get(user=user)
        self.assertEqual(verification.verification_status, StudentVerification.STATUS_PENDING)
        self.assertEqual(verification.roll_number, "22071A0502")

        # Check email sent
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("RentTogether — Your Verification Code", mail.outbox[0].subject)

    def test_04_rejects_duplicate_roll_number_in_same_college(self):
        # First registration
        payload1 = {
            "full_name": "Student One",
            "email": "student1@vnrvjiet.in",
            "password": "Password123!",
            "roll_number": "22071A0599",
            "department": "CSE",
            "year_of_study": 2,
        }
        res1 = self.client.post(reverse('auth-register'), payload1)
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        # Second registration with same roll number
        payload2 = {
            "full_name": "Student Two",
            "email": "student2@vnrvjiet.in",
            "password": "Password123!",
            "roll_number": "22071A0599",  # duplicate!
            "department": "IT",
            "year_of_study": 2,
        }
        res2 = self.client.post(reverse('auth-register'), payload2)
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("roll_number", res2.data)

    def test_05_otp_verification_flow(self):
        # Register user
        user = User.objects.create_user(
            email="test.student@vnrvjiet.in",
            password="Password123!",
            college=self.college,
            email_verified=False,
            is_college_verified=False
        )
        otp_record, raw_otp = EmailOTP.create_for_user(user)

        # 1. Invalid OTP
        res_fail = self.client.post(reverse('auth-verify-email'), {
            "email": user.email,
            "otp": "000000"
        })
        self.assertEqual(res_fail.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Valid OTP
        res_success = self.client.post(reverse('auth-verify-email'), {
            "email": user.email,
            "otp": raw_otp
        })
        self.assertEqual(res_success.status_code, status.HTTP_200_OK)
        self.assertIn("access", res_success.data)
        user.refresh_from_db()
        self.assertTrue(user.email_verified)

    def test_06_unverified_student_login_blocked(self):
        user = User.objects.create_user(
            email="unverified@vnrvjiet.in",
            password="Password123!",
            college=self.college,
            email_verified=True,
            is_college_verified=False
        )
        StudentVerification.objects.create(
            user=user,
            college=self.college,
            roll_number="22071A0588",
            department="CSE",
            year_of_study=3,
            verification_status=StudentVerification.STATUS_PENDING
        )

        res = self.client.post(reverse('auth-login'), {
            "email": "unverified@vnrvjiet.in",
            "password": "Password123!"
        })
        # Should be blocked from direct login until approved
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res.data['code'], "COLLEGE_VERIFICATION_PENDING")

    def test_07_admin_approval_and_subsequent_login(self):
        user = User.objects.create_user(
            email="applicant@vnrvjiet.in",
            password="Password123!",
            college=self.college,
            email_verified=True,
            is_college_verified=False
        )
        verification = StudentVerification.objects.create(
            user=user,
            college=self.college,
            roll_number="22071A0577",
            department="ECE",
            year_of_study=2,
            verification_status=StudentVerification.STATUS_PENDING
        )

        # Admin logs in
        self.client.force_authenticate(user=self.admin)

        # Admin views pending list
        list_res = self.client.get(reverse('admin-verifications-list'))
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data['results'] if 'results' in list_res.data else list_res.data), 1)

        # Admin approves
        approve_res = self.client.post(reverse('admin-verification-approve', kwargs={'id': verification.id}))
        self.assertEqual(approve_res.status_code, status.HTTP_200_OK)

        verification.refresh_from_db()
        user.refresh_from_db()
        self.assertEqual(verification.verification_status, StudentVerification.STATUS_VERIFIED)
        self.assertTrue(user.is_college_verified)

        # Now student logs in
        self.client.force_authenticate(user=None)
        login_res = self.client.post(reverse('auth-login'), {
            "email": "applicant@vnrvjiet.in",
            "password": "Password123!"
        })
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertIn("access", login_res.data)
        self.assertTrue(login_res.data['user']['is_college_verified'])

    def test_08_admin_reject_and_student_resubmit(self):
        user = User.objects.create_user(
            email="rejectee@vnrvjiet.in",
            password="Password123!",
            college=self.college,
            email_verified=True,
            is_college_verified=False
        )
        verification = StudentVerification.objects.create(
            user=user,
            college=self.college,
            roll_number="22071A0566",
            department="MECH",
            year_of_study=1,
            verification_status=StudentVerification.STATUS_PENDING
        )

        # Admin rejects
        self.client.force_authenticate(user=self.admin)
        reject_res = self.client.post(
            reverse('admin-verification-reject', kwargs={'id': verification.id}),
            {"reason": "ID card photo is blurry. Please upload a clear photo."}
        )
        self.assertEqual(reject_res.status_code, status.HTTP_200_OK)

        verification.refresh_from_db()
        self.assertEqual(verification.verification_status, StudentVerification.STATUS_REJECTED)
        self.assertIn("blurry", verification.rejection_reason)

        # Student resubmits
        self.client.force_authenticate(user=user)
        resubmit_res = self.client.post(
            reverse('verification-resubmit'),
            {"id_card_image": generate_test_image()},
            format='multipart'
        )
        self.assertEqual(resubmit_res.status_code, status.HTTP_200_OK)
        verification.refresh_from_db()
        self.assertEqual(verification.verification_status, StudentVerification.STATUS_PENDING)
        self.assertEqual(verification.rejection_reason, "")

    def test_09_logout_blacklists_refresh_token(self):
        self.client.force_authenticate(user=self.admin)
        from rest_framework_simplejwt.tokens import RefreshToken
        token = RefreshToken.for_user(self.admin)

        logout_res = self.client.post(reverse('auth-logout'), {"refresh": str(token)})
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)

        # Re-using the same refresh token should now fail
        refresh_res = self.client.post(reverse('token_refresh'), {"refresh": str(token)})
        self.assertEqual(refresh_res.status_code, status.HTTP_401_UNAUTHORIZED)
