from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.accounts.models import EmailOTP
from apps.notifications.models import Notification


class Command(BaseCommand):
    help = "Purge expired OTPs, old read notifications, and stale tokens to free up database storage."

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Purge read notifications older than this many days (default: 30)'
        )

    def handle(self, *args, **options):
        now = timezone.now()
        days = options['days']

        # 1. Clean up expired OTPs (expired > 1 day ago or already used > 1 day ago)
        otp_cutoff = now - timedelta(days=1)
        expired_otps = EmailOTP.objects.filter(expires_at__lt=otp_cutoff)
        otp_count = expired_otps.count()
        expired_otps.delete()
        self.stdout.write(self.style.SUCCESS(f"Purged {otp_count} expired/stale OTP verification records."))

        # 2. Clean up old read notifications
        notif_cutoff = now - timedelta(days=days)
        old_notifs = Notification.objects.filter(is_read=True, created_at__lt=notif_cutoff)
        notif_count = old_notifs.count()
        old_notifs.delete()
        self.stdout.write(self.style.SUCCESS(f"Purged {notif_count} old read notifications (older than {days} days)."))

        # 3. Flush expired JWT blacklisted tokens if django-rest-framework-simplejwt token_blacklist is present
        try:
            from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
            expired_tokens = OutstandingToken.objects.filter(expires_at__lt=now)
            token_count = expired_tokens.count()
            expired_tokens.delete()
            self.stdout.write(self.style.SUCCESS(f"Purged {token_count} expired JWT tokens."))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"Token blacklist flush skipped: {e}"))

        self.stdout.write(self.style.SUCCESS("Database storage cleanup completed successfully."))

