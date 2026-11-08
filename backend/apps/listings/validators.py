from decimal import Decimal
from django.core.exceptions import ValidationError


def validate_positive_price(value):
    if value is not None and Decimal(str(value)) <= Decimal('0.00'):
        raise ValidationError("Rental price must be greater than zero.")


def validate_non_negative_deposit(value):
    if value is not None and Decimal(str(value)) < Decimal('0.00'):
        raise ValidationError("Security deposit cannot be negative.")


def validate_rental_duration_bounds(min_days: int, max_days: int):
    if min_days < 1:
        raise ValidationError("Minimum rental duration must be at least 1 day.")
    if max_days < min_days:
        raise ValidationError("Maximum rental duration must be greater than or equal to minimum rental duration.")

