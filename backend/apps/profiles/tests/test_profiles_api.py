import uuid
from decimal import Decimal
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import College, User
from apps.bookings.models import Booking
from apps.profiles.models import StudentProfile, StudentReview
from apps.profiles.services.profile_stats_service import sync_profile_stats


class ProfilesAPITest(APITestCase):
    def setUp(self):
        self.college = College.objects.create(
            name="Aditya University",
            code="ADITYA",
            domain_whitelist=["adityauniversity.in"]
        )
        self.user1 = User.objects.create_user(
            email="samith@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Samith",
            last_name="Nitta",
            college=self.college
        )
        self.profile1 = self.user1.profile
        self.profile1.roll_number = "21A91A0501"
        self.profile1.department = "CSE"
        self.profile1.year_of_study = 3
        self.profile1.phone_number = "9876543210"
        self.profile1.bio = "CS Undergrad enthusiastic about robotics and mechanical gadgets."
        self.profile1.save()

        self.user2 = User.objects.create_user(
            email="peer@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Peer",
            last_name="Student",
            college=self.college
        )
        self.profile2 = self.user2.profile
        self.profile2.roll_number = "21A91A0502"
        self.profile2.department = "ECE"
        self.profile2.year_of_study = 3
        self.profile2.phone_number = "9123456780"
        self.profile2.save()

        self.booking = Booking.objects.create(
            booking_reference="RT-API-001",
            item_title="Digital Multimeter",
            owner=self.user1,
            renter=self.user2,
            status=Booking.STATUS_COMPLETED,
            start_date=timezone.now() - timezone.timedelta(days=2),
            end_date=timezone.now() - timezone.timedelta(days=1),
            rental_price_inr=Decimal('100.00'),
            reference_purchase_price_inr=Decimal('600.00')
        )
        sync_profile_stats(self.user1)

    def test_get_profile_me(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse('profile-me')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data['user']['email'], "samith@adityauniversity.in")
        self.assertEqual(data['college_code'], "ADITYA")
        self.assertEqual(data['phone_number'], "9876543210")
        self.assertIn('owner_stats', data)
        self.assertIn('renter_stats', data)
        self.assertIn('owner_badge', data)
        self.assertIn('renter_badge', data)

    def test_patch_profile_me_allowed_fields(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse('profile-me')
        payload = {
            "bio": "Updated bio for campus peer-to-peer sharing.",
            "phone_number": "9988776655",
            "preferred_pickup_spots": ["Central Library", "Main Canteen"]
        }
        response = self.client.patch(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.profile1.refresh_from_db()
        self.assertEqual(self.profile1.bio, payload["bio"])
        self.assertEqual(self.profile1.phone_number, payload["phone_number"])
        self.assertEqual(self.profile1.preferred_pickup_spots, payload["preferred_pickup_spots"])

    def test_patch_profile_me_ignores_tampering_with_reputation_or_finances(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse('profile-me')
        payload = {
            "reputation_as_owner": "5.00",
            "total_earnings_inr": "999999.00",
            "is_verified": True
        }
        response = self.client.patch(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.profile1.refresh_from_db()
        # Earnings should remain 100.00 from completed booking, not the forged payload
        self.assertEqual(self.profile1.total_earnings_inr, Decimal('100.00'))

    def test_get_public_profile_protects_sensitive_data(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse('profile-public', kwargs={'student_id': self.user2.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data['display_name'], "Peer Student")
        self.assertEqual(data['college_code'], "ADITYA")
        self.assertIn('owner_reputation', data)
        self.assertIn('renter_reputation', data)

        # Ensure sensitive data is strictly withheld
        self.assertNotIn('email', data)
        self.assertNotIn('phone_number', data)
        self.assertNotIn('roll_number', data)
        self.assertNotIn('id_card_image', data)

    def test_submit_review_api_and_listing(self):
        self.client.force_authenticate(user=self.user2)
        url = reverse('review-create')
        payload = {
            "booking_id": str(self.booking.id),
            "review_type": "OWNER",
            "condition_accuracy_score": 5,
            "communication_score": 5,
            "punctuality_score": 4,
            "overall_comment": "Excellent gear, quick meetup!"
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['condition_accuracy_score'], 5)

        # Check public review listing for user1
        list_url = reverse('profile-public-reviews', kwargs={'student_id': self.user1.id})
        list_res = self.client.get(list_url)
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        # Results could be paginated
        results = list_res.data.get('results', list_res.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['review_type'], "OWNER")

