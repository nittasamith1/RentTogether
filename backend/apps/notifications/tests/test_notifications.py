from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import College, User
from apps.notifications.models import Notification
from apps.notifications.services import send_notification


class NotificationsAPITests(APITestCase):
    def setUp(self):
        self.college = College.objects.create(
            name="Aditya University",
            code="ADITYA",
            domain_whitelist=["adityauniversity.in"]
        )

        self.user_a = User.objects.create_user(
            email="user_a@adityauniversity.in",
            password="StrongPassword123!",
            first_name="User",
            last_name="A",
            college=self.college,
            email_verified=True,
            is_college_verified=True,
        )

        self.user_b = User.objects.create_user(
            email="user_b@adityauniversity.in",
            password="StrongPassword123!",
            first_name="User",
            last_name="B",
            college=self.college,
            email_verified=True,
            is_college_verified=True,
        )

        # Create notifications for User A
        self.notif1 = send_notification(
            recipient=self.user_a,
            event_type="WELCOME",
            title="Welcome to RentTogether",
            message="Your account is ready."
        )
        self.notif2 = send_notification(
            recipient=self.user_a,
            event_type="BOOKING_APPROVED",
            title="Booking Approved",
            message="Your booking request was approved."
        )

        # Create notification for User B
        self.notif_b = send_notification(
            recipient=self.user_b,
            event_type="BOOKING_APPROVED",
            title="User B Alert",
            message="Private alert for user B."
        )

    def test_list_notifications_isolated_to_authenticated_user(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(reverse("notification-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = response.data.get("results", [])
        self.assertEqual(len(results), 2)
        returned_ids = {n["id"] for n in results}
        self.assertIn(str(self.notif1.id), returned_ids)
        self.assertIn(str(self.notif2.id), returned_ids)
        self.assertNotIn(str(self.notif_b.id), returned_ids)

    def test_unread_count(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(reverse("notification-unread-count"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("unread_count"), 2)

    def test_mark_single_notification_read(self):
        self.client.force_authenticate(user=self.user_a)
        url = reverse("notification-mark-read", kwargs={"id": self.notif1.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get("is_read"))
        self.assertIsNotNone(response.data.get("read_at"))

        # Verify unread count decremented
        count_res = self.client.get(reverse("notification-unread-count"))
        self.assertEqual(count_res.data.get("unread_count"), 1)

    def test_mark_all_notifications_read(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.post(reverse("notification-read-all"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("updated_count"), 2)

        count_res = self.client.get(reverse("notification-unread-count"))
        self.assertEqual(count_res.data.get("unread_count"), 0)

    def test_cannot_access_or_modify_other_user_notification(self):
        self.client.force_authenticate(user=self.user_a)
        # Attempt to mark user B's notification as read
        url = reverse("notification-mark-read", kwargs={"id": self.notif_b.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Attempt to delete user B's notification
        del_url = reverse("notification-delete", kwargs={"id": self.notif_b.id})
        del_res = self.client.delete(del_url)
        self.assertEqual(del_res.status_code, status.HTTP_404_NOT_FOUND)

    def test_clear_read_notifications_history(self):
        self.client.force_authenticate(user=self.user_a)
        # Mark notif1 as read
        self.notif1.is_read = True
        self.notif1.save()

        # Call clear with scope=read
        clear_url = reverse("notification-clear-history")
        response = self.client.delete(f"{clear_url}?scope=read")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("deleted_count"), 1)

        # notif1 should be deleted from DB, notif2 remains
        self.assertFalse(Notification.objects.filter(id=self.notif1.id).exists())
        self.assertTrue(Notification.objects.filter(id=self.notif2.id).exists())
        # User B's notification untouched
        self.assertTrue(Notification.objects.filter(id=self.notif_b.id).exists())

    def test_clear_all_notifications_history(self):
        self.client.force_authenticate(user=self.user_a)
        clear_url = reverse("notification-clear-history")
        response = self.client.delete(f"{clear_url}?scope=all")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("deleted_count"), 2)

        # All notifications for user_a should be deleted from DB
        self.assertEqual(Notification.objects.filter(recipient=self.user_a).count(), 0)
        # User B's notification untouched
        self.assertTrue(Notification.objects.filter(id=self.notif_b.id).exists())


