from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import StudentProfile

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_or_update_student_profile(sender, instance, created, **kwargs):
    if created:
        StudentProfile.objects.create(
            user=instance,
            college=instance.college
        )
    else:
        # Sync college if profile exists
        if hasattr(instance, 'profile'):
            if instance.profile.college != instance.college:
                instance.profile.college = instance.college
                instance.profile.save()

