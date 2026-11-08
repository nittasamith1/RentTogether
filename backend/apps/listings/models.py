import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone


class Item(models.Model):
    """
    Resource Listing model for intra-campus sharable goods.
    Enables verified students (Owners) to list, price, manage, pause, and remove equipment.
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
    STATUS_PAUSED = 'PAUSED'
    STATUS_REMOVED = 'REMOVED'

    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_PAUSED, 'Paused'),
        (STATUS_REMOVED, 'Removed'),
    ]

    # Legacy choice aliases for backwards compatibility
    STATUS_INACTIVE = 'PAUSED'
    STATUS_DRAFT = 'PAUSED'
    STATUS_RENTED = 'ACTIVE'

    # Identification & Ownership
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="listed_items",
        help_text="Student who listed this resource"
    )
    category = models.ForeignKey(
        'marketplace.Category',
        on_delete=models.PROTECT,
        related_name="items",
        help_text="Standardized category of the item"
    )

    # Basic Information
    title = models.CharField(max_length=150, db_index=True, help_text="Resource title")
    description = models.TextField(max_length=2000, help_text="Detailed description of features, specs, and guidelines")
    brand = models.CharField(max_length=100, blank=True, default="", help_text="Brand or manufacturer")
    model_name = models.CharField(max_length=100, blank=True, default="", help_text="Model or part number")

    # Purchase Information
    original_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Original purchase price in INR"
    )
    original_purchase_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Backwards-compatible purchase price field"
    )
    item_age_months = models.PositiveIntegerField(default=0, help_text="Age of the item in months")
    purchase_date = models.DateField(null=True, blank=True, help_text="Date when item was acquired")

    # Item Condition
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default=CONDITION_GOOD)

    # Rental Pricing & Escrow
    rental_price_per_day = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('10.00'),
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Daily rental rate in INR"
    )
    daily_rental_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('10.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Backwards-compatible daily rental price field"
    )
    security_deposit = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Refundable escrow deposit in INR"
    )

    # Rental Duration Rules
    min_rental_days = models.PositiveSmallIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text="Minimum rental duration in days"
    )
    max_rental_days = models.PositiveSmallIntegerField(
        default=30,
        validators=[MinValueValidator(1)],
        help_text="Maximum rental duration in days"
    )

    # Campus Pickup Information
    pickup_location = models.CharField(
        max_length=150,
        default="",
        help_text="Primary on-campus meeting or handover spot"
    )
    pickup_instructions = models.CharField(
        max_length=500,
        blank=True,
        default="",
        help_text="Instructions for physical handover"
    )
    pickup_locations = models.JSONField(
        default=list,
        blank=True,
        help_text="Backwards-compatible list of acceptable campus spots"
    )

    # Status, Visibility & Image Reference
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_ACTIVE,
        db_index=True
    )
    is_published = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Controls public discovery in marketplace"
    )
    primary_image_url = models.URLField(
        max_length=500,
        blank=True,
        default="",
        help_text="Primary display photo URL"
    )

    # Statistics & Timestamps
    rental_count = models.PositiveIntegerField(
        default=0,
        help_text="Historical count of completed rentals"
    )
    published_at = models.DateTimeField(null=True, blank=True)
    removed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Resource Item'
        verbose_name_plural = 'Resource Items'
        indexes = [
            models.Index(fields=['status', 'is_published']),
            models.Index(fields=['category', 'rental_price_per_day']),
            models.Index(fields=['owner', 'status']),
        ]

    def __str__(self):
        return f"{self.title} [₹{self.rental_price_per_day}/day] ({self.owner.email})"

    @property
    def college(self):
        return getattr(self.owner, 'college', None)

    def clean(self):
        super().clean()
        if self.original_price is not None and self.original_price <= Decimal('0.00'):
            raise ValidationError({'original_price': 'Original purchase price must be greater than zero.'})

        if self.rental_price_per_day is not None and self.rental_price_per_day <= Decimal('0.00'):
            raise ValidationError({'rental_price_per_day': 'Rental price per day must be greater than zero.'})

        if self.security_deposit is not None and self.security_deposit < Decimal('0.00'):
            raise ValidationError({'security_deposit': 'Security deposit cannot be negative.'})

        if self.min_rental_days < 1:
            raise ValidationError({'min_rental_days': 'Minimum rental duration must be at least 1 day.'})

        if self.max_rental_days < self.min_rental_days:
            raise ValidationError({'max_rental_days': 'Maximum rental duration must be greater than or equal to minimum rental duration.'})

        if self.category and not getattr(self.category, 'is_active', True):
            raise ValidationError({'category': 'Selected category is not active.'})

    def save(self, *args, **kwargs):
        # Sync dual price fields
        if self.rental_price_per_day:
            self.daily_rental_price = self.rental_price_per_day
        elif self.daily_rental_price:
            self.rental_price_per_day = self.daily_rental_price

        if self.original_price:
            self.original_purchase_price = self.original_price
        elif self.original_purchase_price:
            self.original_price = self.original_purchase_price

        # Sync pickup locations list
        if self.pickup_location and (not self.pickup_locations or self.pickup_location not in self.pickup_locations):
            self.pickup_locations = [self.pickup_location]
        elif not self.pickup_location and self.pickup_locations:
            self.pickup_location = str(self.pickup_locations[0])

        # Sync published status
        if self.status == self.STATUS_ACTIVE:
            self.is_published = True
            if not self.published_at:
                self.published_at = timezone.now()
        else:
            self.is_published = False

        if self.status == self.STATUS_REMOVED and not self.removed_at:
            self.removed_at = timezone.now()

        super().save(*args, **kwargs)


class ItemImage(models.Model):
    """
    Supplementary and gallery photographs associated with an Item listing.
    Supports Cloudinary asset tracking and primary photo ordering.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name="images"
    )
    image = models.ImageField(upload_to="items/%Y/%m/", blank=True, null=True)
    image_url = models.URLField(max_length=500, blank=True, default="")
    cloudinary_public_id = models.CharField(max_length=255, blank=True, default="")
    is_primary = models.BooleanField(default=False)
    display_order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['display_order', '-created_at']
        verbose_name = 'Item Image'
        verbose_name_plural = 'Item Images'

    def __str__(self):
        return f"Image for {self.item.title} ({'Primary' if self.is_primary else 'Gallery'})"

    def save(self, *args, **kwargs):
        # If this image is designated primary, demote any other existing primary image for this item
        if self.is_primary:
            ItemImage.objects.filter(item=self.item, is_primary=True).exclude(pk=self.pk).update(is_primary=False)
            if self.image_url:
                self.item.primary_image_url = self.image_url
                self.item.save(update_fields=['primary_image_url'])
        super().save(*args, **kwargs)
