from django.core.management.base import BaseCommand
from apps.accounts.models import College, User

class Command(BaseCommand):
    help = 'Seeds initial College entity and demo admin/student user for Phase 01 verification'

    def handle(self, *args, **options):
        # 1. Create or retrieve active College
        college, created = College.objects.get_or_create(
            code="VNRVJIET",
            defaults={
                "name": "VNR Vignana Jyothi Institute of Engineering & Technology",
                "domain_whitelist": "vnrvjiet.in, vnrvjiet.ac.in, college.edu",
                "address": "Vignana Jyothi Nagar, Pragathi Nagar, Nizampet, Hyderabad, Telangana 500090",
                "is_active": True,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created default College: {college.name} ({college.code})"))
        else:
            self.stdout.write(f"Default College already exists: {college.name}")

        # 2. Create demo Superuser / Campus Admin
        admin_email = "admin@vnrvjiet.in"
        if not User.objects.filter(email=admin_email).exists():
            admin_user = User.objects.create_superuser(
                email=admin_email,
                username="admin",
                password="AdminPassword123!",
                first_name="Campus",
                last_name="Administrator",
                college=college,
                is_college_verified=True,
            )
            self.stdout.write(self.style.SUCCESS(f"Created Admin user: {admin_user.email} (Password: AdminPassword123!)"))
        else:
            self.stdout.write(f"Admin user already exists: {admin_email}")

        # 3. Create demo Student (Sai Reddy from dashboard mockup)
        student_email = "sai.reddy@vnrvjiet.in"
        if not User.objects.filter(email=student_email).exists():
            student = User.objects.create_user(
                email=student_email,
                username="saireddy",
                password="StudentPassword123!",
                first_name="Sai",
                last_name="Reddy",
                college=college,
                is_college_verified=True,
            )
            # Update profile metrics to match UI mockup
            profile = student.profile
            profile.department = "Computer Science and Engineering"
            profile.roll_number = "21071A05B8"
            profile.year_of_study = 4
            profile.bio = "Final year CSE student. Sharing books, Arduino kits, and electronics."
            profile.total_savings = 2450.00
            profile.total_earnings = 1800.00
            profile.is_verified = True
            profile.save()

            self.stdout.write(self.style.SUCCESS(f"Created demo Student: {student.email} (Sai Reddy) matching dashboard mockup!"))
        else:
            self.stdout.write(f"Student user already exists: {student_email}")
