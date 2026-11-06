import uuid
from django.db import models
from django.conf import settings


class Category(models.Model):
    """
    Resource Category model.
    Represents standardized classifications for intra-campus sharable goods.
    Categories are managed by platform administrators.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True, help_text="Category name (e.g. Academic, Electronics)")
    slug = models.SlugField(max_length=100, unique=True, db_index=True, help_text="URL-friendly slug (e.g. academic, electronics)")
    description = models.TextField(blank=True, default="", help_text="Category description for students")
    icon_name = models.CharField(max_length=50, help_text="Lucide icon name (e.g. BookOpen, Laptop, FlaskConical)")
    image_url = models.URLField(max_length=500, blank=True, null=True, default="", help_text="Optional banner/cover image URL")
    is_active = models.BooleanField(default=True, db_index=True, help_text="Controls visibility in marketplace browsing")
    display_order = models.PositiveIntegerField(default=0, help_text="Ordering rank in category navigation")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'name']
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


class Wishlist(models.Model):
    """
    Wishlist model for students to bookmark resources for future rentals.
    Enforces college isolation so students can only wishlist items from their own institution.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wishlist_entries",
        help_text="Student who saved the resource"
    )
    item = models.ForeignKey(
        'listings.Item',
        on_delete=models.CASCADE,
        related_name="wishlist_entries",
        help_text="The saved marketplace item"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Wishlist Entry'
        verbose_name_plural = 'Wishlist Entries'
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'item'],
                name='unique_user_item_wishlist'
            )
        ]

    def __str__(self):
        return f"{self.user.email} saved {self.item.title}"
