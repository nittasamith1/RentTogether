from decimal import Decimal
from django.core.management.base import BaseCommand
from apps.accounts.models import College, User
from apps.profiles.models import StudentVerification

class Command(BaseCommand):
    help = 'Seeds initial College entity and demo admin/student user for Phase 01 & 02 verification'

    def handle(self, *args, **options):
        # 1. Create or retrieve active College: Aditya University
        college, created = College.objects.get_or_create(
            code="ADITYA",
            defaults={
                "name": "Aditya University",
                "domain_whitelist": ["adityauniversity.in", "aditya.ac.in", "vnrvjiet.in", "vnrvjiet.ac.in"],
                "address": "Aditya Nagar, ADB Road, Surampalem, Kakinada District, Andhra Pradesh 533437",
                "is_active": True,
            }
        )
        if not created:
            college.name = "Aditya University"
            college.domain_whitelist = ["adityauniversity.in", "aditya.ac.in", "vnrvjiet.in", "vnrvjiet.ac.in"]
            college.address = "Aditya Nagar, ADB Road, Surampalem, Kakinada District, Andhra Pradesh 533437"
            college.save()

        self.stdout.write(self.style.SUCCESS(f"Active College: {college.name} ({college.code})"))

        # 2. Create demo Superuser / Campus Admin (Aditya University)
        admin_emails = ["admin@adityauniversity.in", "admin@vnrvjiet.in"]
        for admin_email in admin_emails:
            admin_user = User.objects.filter(email=admin_email).first()
            if not admin_user:
                admin_user = User.objects.create_superuser(
                    email=admin_email,
                    username=admin_email.split('@')[0],
                    password="AdminPassword123!",
                    first_name="Campus",
                    last_name="Administrator",
                    college=college,
                    email_verified=True,
                    is_college_verified=True,
                )
                self.stdout.write(self.style.SUCCESS(f"Created Admin user: {admin_user.email} (Password: AdminPassword123!)"))
            else:
                admin_user.college = college
                admin_user.email_verified = True
                admin_user.is_college_verified = True
                admin_user.save()

        # 3. Create demo Student (Sai Reddy)
        student_emails = ["sai.reddy@adityauniversity.in", "sai.reddy@vnrvjiet.in"]
        for student_email in student_emails:
            student = User.objects.filter(email=student_email).first()
            if not student:
                student = User.objects.create_user(
                    email=student_email,
                    username=student_email.split('@')[0],
                    password="StudentPassword123!",
                    first_name="Sai",
                    last_name="Reddy",
                    college=college,
                    email_verified=True,
                    is_college_verified=True,
                )
                self.stdout.write(self.style.SUCCESS(f"Created demo Student: {student.email}"))
            else:
                student.college = college
                student.email_verified = True
                student.is_college_verified = True
                student.save()

            # Create or update StudentVerification for student
            roll = "21A91A05B8" if "aditya" in student_email else "21071A05B8"
            verification, _ = StudentVerification.objects.get_or_create(
                user=student,
                defaults={
                    "college": college,
                    "roll_number": roll,
                    "department": "Computer Science and Engineering",
                    "year_of_study": 4,
                    "verification_status": StudentVerification.STATUS_VERIFIED,
                }
            )
            verification.college = college
            verification.verification_status = StudentVerification.STATUS_VERIFIED
            verification.save()

            # Update profile metrics to match UI mockup
            if hasattr(student, 'profile'):
                profile = student.profile
                profile.college = college
                profile.department = "Computer Science and Engineering"
                profile.roll_number = roll
                profile.year_of_study = 4
                profile.bio = "Final year CSE student at Aditya University. Sharing books, Arduino kits, and electronics."
                profile.total_savings_inr = Decimal("2450.00")
                profile.total_earnings_inr = Decimal("1800.00")
                profile.is_verified = True
                profile.save()


