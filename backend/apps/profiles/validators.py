import re
from django.core.exceptions import ValidationError

CAMPUS_SUPPORTED_PICKUP_SPOTS = [
    "Library Ground Floor Counter",
    "Main Canteen Reception",
    "Campus Gate 1 Security Desk",
    "B-Block Chemistry Lab 102",
    "Indoor Sports Complex Lounge",
    "Mechanical Workshop Foyer",
    "Student Center Lobby",
]


def validate_student_phone_number(value: str):
    """
    Validates standard Indian/campus phone number format (10 digits optionally prefixed by +91 or 0).
    """
    if not value:
        return
    cleaned = re.sub(r'[\s\-\(\)]', '', value)
    if not re.match(r'^(\+91|0)?[6-9]\d{9}$', cleaned):
        raise ValidationError(
            "Enter a valid 10-digit mobile number (e.g., 9876543210 or +919876543210)."
        )


def validate_pickup_spots(spots: list):
    """
    Validates that preferred pickup locations are formatted as a list of strings.
    """
    if not isinstance(spots, list):
        raise ValidationError("Preferred pickup spots must be provided as a list.")
    if len(spots) > 5:
        raise ValidationError("You can select up to 5 preferred pickup spots.")
    for spot in spots:
        if not isinstance(spot, str) or not spot.strip():
            raise ValidationError("Each pickup spot must be a non-empty string.")


def validate_avatar_image(file):
    """
    Validates uploaded avatar image size (max 5MB) and mime type.
    """
    if not file:
        return
    max_bytes = 5 * 1024 * 1024
    if file.size > max_bytes:
        raise ValidationError("Avatar image file size must not exceed 5 MB.")

    valid_content_types = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if hasattr(file, 'content_type') and file.content_type.lower() not in valid_content_types:
        raise ValidationError("Avatar must be a valid image format (JPEG, PNG, or WebP).")

