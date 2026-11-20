import os
import uuid
from typing import List, Tuple, Any
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.exceptions import ValidationError
from apps.listings.models import Item, ItemImage

try:
    import sys
    import cloudinary
    import cloudinary.uploader
    _cloud_url = getattr(settings, 'CLOUDINARY_URL', '').strip()
    _cloud_name = getattr(settings, 'CLOUDINARY_CLOUD_NAME', '').strip()
    IS_TESTING = 'test' in sys.argv or getattr(settings, 'IS_TESTING', False)
    CLOUDINARY_AVAILABLE = (not IS_TESTING) and bool(
        _cloud_url or (
            _cloud_name and
            getattr(settings, 'CLOUDINARY_API_KEY', '').strip() and
            getattr(settings, 'CLOUDINARY_API_SECRET', '').strip()
        )
    )
except ImportError:
    CLOUDINARY_AVAILABLE = False

MAX_IMAGES_PER_ITEM = 5
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']


def validate_image_file(file_obj):
    """
    Validates file size and MIME type for resource listing photographs.
    """
    if file_obj.size > MAX_IMAGE_SIZE_BYTES:
        raise ValidationError(f"Image '{file_obj.name}' exceeds the 5 MB maximum size limit.")

    content_type = getattr(file_obj, 'content_type', '').lower()
    # Check by extension fallback
    ext = os.path.splitext(file_obj.name)[1].lower()
    allowed_exts = ['.jpg', '.jpeg', '.png', '.webp']

    if content_type and content_type not in ALLOWED_CONTENT_TYPES and ext not in allowed_exts:
        raise ValidationError(f"Image format not supported for '{file_obj.name}'. Allowed: JPEG, PNG, WebP.")


CATEGORY_FALLBACK_IMAGES = {
    'academic-lab': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
    'academic': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
    'electronics': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    'photography': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    'sports': 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
    'mechanical': 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80',
    'tools': 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80',
    'stationery': 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80',
    'default': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
}


def upload_image_to_storage(file_obj, item_id: str, category_slug: str = "") -> Tuple[str, str]:
    """
    Uploads an image directly to Cloudinary CDN for ultra-low-latency real-time delivery.
    Stores and retrieves images directly from Cloudinary.
    Falls back to storing the authentic uploaded file in local/persistent storage
    if Cloudinary is temporarily unreachable or misconfigured.
    NEVER replaces user-uploaded photographs with generic stock images.
    Returns (image_url, cloudinary_public_id).
    """
    if CLOUDINARY_AVAILABLE:
        try:
            if hasattr(file_obj, 'seek'):
                file_obj.seek(0)
            folder_path = f"renttogether/items/{item_id}"
            res = cloudinary.uploader.upload(
                file_obj,
                folder=folder_path,
                timeout=25,
                resource_type="image",
                transformation=[
                    {"width": 1200, "height": 900, "crop": "limit", "quality": "auto:good"},
                    {"fetch_format": "auto"}
                ]
            )
            secure_url = res.get('secure_url', '')
            public_id = res.get('public_id', '')
            if secure_url:
                return secure_url, public_id
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning(
                f"Cloudinary upload failed ({exc}); storing actual user uploaded file to fallback storage."
            )
            if hasattr(file_obj, 'seek'):
                file_obj.seek(0)

    # Save the user's authentic uploaded file directly to storage so their real image is preserved
    if hasattr(file_obj, 'seek'):
        file_obj.seek(0)
    ext = os.path.splitext(getattr(file_obj, 'name', 'image.jpg'))[1] or '.jpg'
    filename = f"items/{item_id}/{uuid.uuid4().hex}{ext}"
    saved_path = default_storage.save(filename, file_obj)
    url = default_storage.url(saved_path)
    return url, ""


def process_and_save_item_images(item: Item, files: List[Any], primary_index: int = 0) -> List[ItemImage]:
    """
    Validates, uploads, and links a batch of image files to an Item.
    Enforces the 5-image total limit and assigns primary status.
    """
    existing_count = item.images.count()
    if existing_count + len(files) > MAX_IMAGES_PER_ITEM:
        raise ValidationError(
            f"Cannot exceed {MAX_IMAGES_PER_ITEM} total images per item. Current: {existing_count}, Uploading: {len(files)}."
        )

    for f in files:
        validate_image_file(f)

    created_images = []
    has_existing_primary = item.images.filter(is_primary=True).exists()
    cat_slug = getattr(getattr(item, 'category', None), 'slug', '')

    for idx, f in enumerate(files):
        url, public_id = upload_image_to_storage(f, str(item.id), category_slug=cat_slug)
        display_order = existing_count + idx

        # First image becomes primary if no primary currently exists or if specified by primary_index
        is_primary = False
        if not has_existing_primary and idx == primary_index:
            is_primary = True
            has_existing_primary = True

        img = ItemImage.objects.create(
            item=item,
            image_url=url,
            cloudinary_public_id=public_id,
            is_primary=is_primary,
            display_order=display_order
        )
        created_images.append(img)

    # Ensure at least one image is primary
    if not item.images.filter(is_primary=True).exists():
        first_img = item.images.first()
        if first_img:
            first_img.is_primary = True
            first_img.save(update_fields=['is_primary'])
            item.primary_image_url = first_img.image_url
            item.save(update_fields=['primary_image_url'])
    elif created_images and any(img.is_primary for img in created_images):
        primary_img = item.images.filter(is_primary=True).first()
        if primary_img:
            item.primary_image_url = primary_img.image_url
            item.save(update_fields=['primary_image_url'])

    return created_images


def delete_item_image(item: Item, image_id: str) -> None:
    """
    Safely deletes an image associated with an item.
    Enforces the rule that an item cannot have 0 images.
    If deleting the primary image, promotes the next available image to primary.
    """
    total_images = item.images.count()
    if total_images <= 1:
        raise ValidationError("Cannot remove the only remaining image. An item must have at least one photograph.")

    try:
        img = item.images.get(id=image_id)
    except ItemImage.DoesNotExist:
        raise ValidationError("Image not found on this listing.")

    was_primary = img.is_primary
    public_id = img.cloudinary_public_id

    # Delete DB record
    img.delete()

    # Cloudinary asset cleanup
    if public_id and CLOUDINARY_AVAILABLE:
        try:
            cloudinary.uploader.destroy(public_id)
        except Exception:
            pass

    # If primary was removed, promote the next image
    if was_primary:
        next_img = ItemImage.objects.filter(item=item).first()
        if next_img:
            next_img.is_primary = True
            next_img.save(update_fields=['is_primary'])
            item.primary_image_url = next_img.image_url
            item.save(update_fields=['primary_image_url'])
        else:
            item.primary_image_url = ""
            item.save(update_fields=['primary_image_url'])
