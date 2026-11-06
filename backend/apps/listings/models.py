import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class Item(models.Model):
    """
    Item Listing model for intra-campus sharable goods.
    Belongs to an authenticated student (owner) within their verified college.
    """
    CONDITION_BRAND_NEW = 'BRAND_NEW'
    CONDITION_LIKE_NEW = 'LIKE_NEW'
    CONDITION_GOOD = 'GOOD'
    CONDITION_FAIR = 'FAIR'

    CONDITION_CHOICES = [
        (CONDITION_BRAND_NEW, 'Brand New'),
        (CONDITION_LIKE_NEW, 'Like New'),
        (CONDITION_GOOD, 'Good'),
        (CONDITION_FAIR, 'Fair'),
    ]

    STATUS_ACTIVE = 'ACTIVE'
    STATUS_INACTIVE = 'INACTIVE'
    STATUS_RENTED = 'RENTED'
    STATUS_DRAFT = 'DRAFT'

    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_INACTIVE, 'Inactive'),
        (STATUS_RENTED, 'Rented'),
        (STATUS_DRAFT, 'Draft'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="listed_items",
        help_text="Student who listed this resource"
    )
    category = models.ForeignKey(
        'marketplace.Category',
        on_delete=models.PROTECT,
        related_name="items",
        help_text="Standardized category of the item"
    )
    title = models.CharField(max_length=200, db_index=True, help_text="Resource title")
    description = models.TextField(help_text="Detailed description of features, specs, and usage guidelines")
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default=CONDITION_GOOD)
    brand = models.CharField(max_length=100, blank=True, default="", help_text="Brand or manufacturer")
    model_name = models.CharField(max_length=100, blank=True, default="", help_text="Model or part number")
    
    # Financial details
    original_purchase_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Reference retail cost to compute renter savings vs buying new"
    )
    daily_rental_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Per-day rental rate in INR"
    )
    security_deposit = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Refundable escrow deposit in INR"
    )

    # Rental constraints
    min_rental_days = models.PositiveSmallIntegerField(default=1, help_text="Minimum rental duration in days")
    max_rental_days = models.PositiveSmallIntegerField(default=30, help_text="Maximum rental duration in days")
    
    # Campus pickup & meeting spots
    pickup_locations = models.JSONField(
        default=list,
        blank=True,
        help_text="List of acceptable campus spots for physical handover"
    )
    
    primary_image_url = models.URLField(max_length=500, blank=True, default="", help_text="Primary display photo")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE, db_index=True)
    is_published = models.BooleanField(default=True, db_index=True, help_text="Controls public visibility in marketplace")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Resource Item'
        verbose_name_plural = 'Resource Items'
        indexes = [
            models.Index(fields=['status', 'is_published']),
            models.Index(fields=['category', 'daily_rental_price']),
            models.Index(fields=['owner', 'status']),
        ]

    def __str__(self):
        return f"{self.title} [₹{self.daily_rental_price}/day] ({self.owner.email})"

    @property
    def college(self):
        return self.owner.college


class ItemImage(models.Model):
    """
    Supplementary and gallery images for an item listing.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="items/%Y/%m/", blank=True, null=True)
    image_url = models.URLField(max_length=500, blank=True, default="")
    is_primary = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['display_order', '-created_at']
        verbose_name = 'Item Image'
        verbose_name_plural = 'Item Images'

    def __str__(self):
        return f"Image for {self.item.title} ({'Primary' if self.is_primary else 'Gallery'})"
