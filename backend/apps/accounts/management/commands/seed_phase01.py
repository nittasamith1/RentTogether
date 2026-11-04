from django.core.management.base import BaseCommand
from apps.accounts.models import College, User
from apps.profiles.models import StudentVerification

class Command(BaseCommand):
    help = 'Seeds initial College entity and demo admin/student user for Phase 01 & 02 verification'

    def handle(self, *args, **options):
        # 1. Create or retrieve active College
        college, created = College.objects.get_or_create(
            code="VNRVJIET",
            defaults={
                "name": "VNR Vignana Jyothi Institute of Engineering & Technology",
                "domain_whitelist": ["vnrvjiet.in", "vnrvjiet.ac.in"],
                "address": "Vignana Jyothi Nagar, Pragathi Nagar, Nizampet, Hyderabad, Telangana 500090",
                "is_active": True,
            }
        )
        if not created and not isinstance(college.domain_whitelist, list):
            college.domain_whitelist = ["vnrvjiet.in", "vnrvjiet.ac.in"]
            college.save()

        if created:
            self.stdout.write(self.style.SUCCESS(f"Created default College: {college.name} ({college.code})"))
        else:
            self.stdout.write(f"Default College already exists: {college.name}")

        # 2. Create demo Superuser / Campus Admin
        admin_email = "admin@vnrvjiet.in"
        admin_user = User.objects.filter(email=admin_email).first()
        if not admin_user:
            admin_user = User.objects.create_superuser(
                email=admin_email,
                username="admin",
                password="AdminPassword123!",
                first_name="Campus",
                last_name="Administrator",
                college=college,
                email_verified=True,
                is_college_verified=True,
            )
            self.stdout.write(self.style.SUCCESS(f"Created Admin user: {admin_user.email} (Password: AdminPassword123!)"))
        else:
            admin_user.email_verified = True
            admin_user.is_college_verified = True
            admin_user.save()
            self.stdout.write(f"Admin user already exists: {admin_email}")

        # 3. Create demo Student (Sai Reddy from dashboard mockup)
        student_email = "sai.reddy@vnrvjiet.in"
        student = User.objects.filter(email=student_email).first()
        if not student:
            student = User.objects.create_user(
                email=student_email,
                username="saireddy",
                password="StudentPassword123!",
                first_name="Sai",
                last_name="Reddy",
                college=college,
                email_verified=True,
                is_college_verified=True,
            )
            self.stdout.write(self.style.SUCCESS(f"Created demo Student: {student.email} (Sai Reddy) matching dashboard mockup!"))
        else:
            student.email_verified = True
            student.is_college_verified = True
            student.save()
            self.stdout.write(f"Student user already exists: {student_email}")

        # Create or update StudentVerification for Sai Reddy
        verification, _ = StudentVerification.objects.get_or_create(
            user=student,
            defaults={
                "college": college,
                "roll_number": "21071A05B8",
                "department": "Computer Science and Engineering",
                "year_of_study": 4,
                "verification_status": StudentVerification.STATUS_VERIFIED,
                "verified_by": admin_user,
            }
        )
        if verification.verification_status != StudentVerification.STATUS_VERIFIED:
            verification.verification_status = StudentVerification.STATUS_VERIFIED
            verification.verified_by = admin_user
            verification.save()

        # Update profile metrics to match UI mockup
        if hasattr(student, 'profile'):
            profile = student.profile
            profile.college = college
            profile.department = "Computer Science and Engineering"
            profile.roll_number = "21071A05B8"
            profile.year_of_study = 4
            profile.bio = "Final year CSE student. Sharing books, Arduino kits, and electronics."
            profile.total_savings = 2450.00
            profile.total_earnings = 1800.00
            profile.is_verified = True
            profile.save()


