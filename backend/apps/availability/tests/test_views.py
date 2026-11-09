from datetime import timedelta
from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import College, User
from apps.marketplace.models import Category
from apps.listings.models import Item
from apps.bookings.models import Booking
from apps.availability.models import ItemAvailabilityBlock
from apps.availability.services.availability_service import AvailabilityService


class AvailabilityViewsTest(TestCase):
    def setUp(self):
        self.college = College.objects.create(
            name="Aditya University",
            code="ADITYA",
            domain_whitelist=["adityauniversity.in"]
        )
        self.other_college = College.objects.create(
            name="Other University",
            code="OTHER",
            domain_whitelist=["other.edu"]
        )

        self.owner = User.objects.create_user(
            email="owner@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Owner",
            last_name="Student",
            college=self.college,
            email_verified=True,
            is_college_verified=True,
        )
        self.renter = User.objects.create_user(
            email="renter@adityauniversity.in",
            password="StrongPassword123!",
            first_name="Renter",
            last_name="Student",
            college=self.college,
            email_verified=True,
            is_college_verified=True,
        )
        self.cross_college_user = User.objects.create_user(
            email="hacker@other.edu",
            password="StrongPassword123!",
            first_name="Cross",
            last_name="User",
            college=self.other_college,
            email_verified=True,
            is_college_verified=True,
        )

        self.category, _ = Category.objects.get_or_create(
            slug="academic",
            defaults={"name": "Academic", "icon_name": "BookOpen", "is_active": True}
        )
        self.item = Item.objects.create(
            owner=self.owner,
            category=self.category,
            title="Scientific Calculator FX-991",
            description="Engineering calculator in mint condition.",
            original_price=Decimal("1200.00"),
            rental_price_per_day=Decimal("30.00"),
            security_deposit=Decimal("150.00"),
            min_rental_days=1,
            max_rental_days=15,
            item_age_months=4,
            condition="LIKE_NEW",
            pickup_location="Library Ground Floor",
            status="ACTIVE"
        )
        self.today = timezone.now().date()
        self.client = APIClient()

    def test_get_item_availability_public_privacy(self):
        # Create a booking hold
        booking = Booking.objects.create(
            item=self.item,
            item_title=self.item.title,
            owner=self.owner,
            renter=self.renter,
            start_date=timezone.now() + timedelta(days=2),
            end_date=timezone.now() + timedelta(days=5),
        )
        AvailabilityService.create_booking_hold(booking)

        # Authenticate as peer student
        self.client.force_authenticate(user=self.renter)
        url = reverse('item-availability', kwargs={'item_id': str(self.item.id)})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['item_id'], str(self.item.id))
        self.assertEqual(len(data['availability']), 1)

        block_data = data['availability'][0]
        self.assertEqual(block_data['reason'], 'BOOKED')
        # Crucial privacy requirement: ensure renter identity & booking ID are omitted from public availability
        self.assertNotIn('booking_reference', block_data)
        self.assertNotIn('renter', block_data)
        self.assertNotIn('renter_id', block_data)
        self.assertNotIn('renter_email', block_data)

    def test_get_item_availability_cross_college_forbidden(self):
        self.client.force_authenticate(user=self.cross_college_user)
        url = reverse('item-availability', kwargs={'item_id': str(self.item.id)})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_check_item_availability_endpoint(self):
        self.client.force_authenticate(user=self.renter)
        url = reverse('check-item-availability', kwargs={'item_id': str(self.item.id)})

        # Check available dates
        s = str(self.today + timedelta(days=2))
        e = str(self.today + timedelta(days=5))
        res = self.client.get(f"{url}?start_date={s}&end_date={e}")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.json()['available'])
        self.assertIsNone(res.json()['conflict'])

        # Now owner blocks dates
        AvailabilityService.create_owner_block(
            item_id=str(self.item.id),
            start_date=self.today + timedelta(days=2),
            end_date=self.today + timedelta(days=5),
            reason=ItemAvailabilityBlock.REASON_OWNER_UNAVAILABLE,
            user=self.owner
        )

        res2 = self.client.get(f"{url}?start_date={s}&end_date={e}")
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertFalse(res2.json()['available'])
        self.assertEqual(res2.json()['conflict']['reason'], 'OWNER_UNAVAILABLE')

    def test_create_manual_block_by_owner(self):
        self.client.force_authenticate(user=self.owner)
        url = reverse('create-manual-block', kwargs={'item_id': str(self.item.id)})

        payload = {
            "start_date": str(self.today + timedelta(days=6)),
            "end_date": str(self.today + timedelta(days=9)),
            "reason": "OWNER_UNAVAILABLE"
        }
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.json()['reason'], 'OWNER_UNAVAILABLE')

        # Re-creating overlapping block returns 409 Conflict
        res_conflict = self.client.post(url, payload, format='json')
        self.assertEqual(res_conflict.status_code, status.HTTP_409_CONFLICT)

    def test_create_manual_block_rejects_booked_reason(self):
        self.client.force_authenticate(user=self.owner)
        url = reverse('create-manual-block', kwargs={'item_id': str(self.item.id)})

        payload = {
            "start_date": str(self.today + timedelta(days=6)),
            "end_date": str(self.today + timedelta(days=9)),
            "reason": "BOOKED"  # Clients cannot manually forge BOOKED blocks!
        }
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_manual_block_permissions(self):
        block = AvailabilityService.create_owner_block(
            item_id=str(self.item.id),
            start_date=self.today + timedelta(days=6),
            end_date=self.today + timedelta(days=9),
            reason=ItemAvailabilityBlock.REASON_MAINTENANCE,
            user=self.owner
        )
        url = reverse('delete-manual-block', kwargs={'block_id': str(block.id)})

        # Non-owner attempt -> 403
        self.client.force_authenticate(user=self.renter)
        res_forbidden = self.client.delete(url)
        self.assertEqual(res_forbidden.status_code, status.HTTP_403_FORBIDDEN)

        # Owner attempt -> 204
        self.client.force_authenticate(user=self.owner)
        res_ok = self.client.delete(url)
        self.assertEqual(res_ok.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ItemAvailabilityBlock.objects.filter(id=block.id).exists())

    def test_owner_calendar_view(self):
        # Create one owner block and one booking
        AvailabilityService.create_owner_block(
            item_id=str(self.item.id),
            start_date=self.today + timedelta(days=2),
            end_date=self.today + timedelta(days=4),
            reason=ItemAvailabilityBlock.REASON_OWNER_UNAVAILABLE,
            user=self.owner
        )

        booking = Booking.objects.create(
            item=self.item,
            item_title=self.item.title,
            owner=self.owner,
            renter=self.renter,
            start_date=timezone.now() + timedelta(days=10),
            end_date=timezone.now() + timedelta(days=12),
        )
        AvailabilityService.create_booking_hold(booking)

        self.client.force_authenticate(user=self.owner)
        url = reverse('owner-calendar')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['count'], 2)
        reasons = [b['reason'] for b in data['results']]
        self.assertIn('OWNER_UNAVAILABLE', reasons)
        self.assertIn('BOOKED', reasons)

