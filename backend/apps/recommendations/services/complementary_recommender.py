"""
Complementary Equipment Association Engine (Phase 13).
Associates complementary gear, tools, and accessories that students frequently rent together.
Example:
  - Arduino Uno Kit -> Breadboard, Ultrasonic Sensor, Jumper Wires, Multimeter
  - DSLR Camera -> Tripod, SD Card, Camera Bag, Extra Battery, Gimbal
"""

from typing import List, Dict, Any
from django.db.models import Q
from apps.listings.models import Item

# Predefined Knowledge Graph of Campus Complementary Item Associations
COMPLEMENTARY_ASSOCIATION_GRAPH = {
    'arduino': [
        ('breadboard', 'Essential breadboard for circuit prototyping'),
        ('sensor', 'Ultrasonic / Infrared sensor pack for robotics'),
        ('jumper wire', 'Male-to-Male jumper cables for breadboard connections'),
        ('multimeter', 'Digital multimeter to measure circuit voltages'),
        ('servo', 'Micro servo motor for embedded projects'),
    ],
    'raspberry': [
        ('display', 'Touchscreen display for mini computing'),
        ('sensor', 'GPIO sensor kit'),
        ('power', 'Type-C high-amperage power supply'),
        ('sd card', 'Class-10 MicroSD card with OS image'),
    ],
    'camera': [
        ('tripod', 'Stable aluminum tripod for blur-free photography'),
        ('sd card', 'High-speed 128GB SD card for 4K video'),
        ('bag', 'Padded protective camera bag with lens compartments'),
        ('gimbal', '3-axis handheld stabilizer for smooth footage'),
        ('light', 'Portable LED panel for indoor filming'),
    ],
    'dslr': [
        ('tripod', 'Heavy-duty camera tripod'),
        ('sd card', 'Ultra-fast SDXC memory card'),
        ('bag', 'Water-resistant camera backpack'),
        ('lens', 'Prime portrait lens (50mm f/1.8)'),
    ],
    'calculator': [
        ('drafter', 'Mini drafter for engineering graphics exam'),
        ('scale', 'Engineering steel ruler and geometry kit'),
        ('book', 'Higher Engineering Mathematics reference guide'),
    ],
    'casio': [
        ('drafter', 'Engineering drawing board & mini drafter'),
        ('notes', 'Formula sheet booklet & quick exam review'),
    ],
    'laptop': [
        ('charger', 'Universal Type-C 65W/100W laptop charger'),
        ('hub', 'Multi-port USB-C adapter with HDMI output'),
        ('mouse', 'Ergonomic wireless optical mouse'),
        ('stand', 'Adjustable aluminum laptop riser'),
    ],
    'macbook': [
        ('hub', 'Type-C multi-display dock with HDMI and USB 3.0'),
        ('charger', 'Apple MagSafe 3 / Type-C fast charger'),
        ('sleeve', 'Shockproof padded laptop sleeve'),
    ],
    'drafter': [
        ('calculator', 'Scientific calculator for engineering computations'),
        ('sheet', 'A2 engineering graphics drawing sheets'),
        ('clips', 'Board clips and drafting tape set'),
    ],
    'bicycle': [
        ('helmet', 'Campus safety bicycle helmet'),
        ('lock', 'Heavy-duty combination cable lock'),
        ('light', 'Rechargeable LED headlight and tail warning light'),
    ],
    'cycle': [
        ('lock', 'Anti-theft combination cycle lock'),
        ('pump', 'Compact portable tire pressure pump'),
    ],
}


def get_complementary_recommendations(item_id: str, limit: int = 6) -> Dict[str, Any]:
    """
    Returns items associated with the target equipment that students frequently rent together.
    """
    try:
        target_item = Item.objects.select_related('category', 'owner').get(id=item_id)
    except Exception:
        return {
            'target_item_id': item_id,
            'target_item_title': '',
            'complementary_items': [],
            'suggested_accessories': [],
        }

    title_lower = target_item.title.lower()
    desc_lower = (target_item.description or '').lower()
    cat_lower = (target_item.category.name if target_item.category else '').lower()

    # Find matched keywords in knowledge graph
    matched_associations = []
    for keyword, associations in COMPLEMENTARY_ASSOCIATION_GRAPH.items():
        if keyword in title_lower or keyword in desc_lower or keyword in cat_lower:
            matched_associations.extend(associations)

    # If no exact graph match, default to related accessories from electronics/academic
    if not matched_associations:
        if 'academic' in cat_lower or 'book' in cat_lower:
            matched_associations = COMPLEMENTARY_ASSOCIATION_GRAPH['calculator']
        elif 'electronic' in cat_lower or 'hardware' in cat_lower:
            matched_associations = COMPLEMENTARY_ASSOCIATION_GRAPH['arduino']
        else:
            matched_associations = [
                ('accessory', 'Popular student companion gear'),
                ('tool', 'Frequently requested project equipment'),
            ]

    # Query active marketplace listings that match complementary association keywords
    complementary_items = []
    seen_ids = {str(target_item.id)}

    for search_term, pair_reason in matched_associations:
        matched_db_items = Item.objects.filter(
            is_published=True,
            status=Item.STATUS_ACTIVE
        ).exclude(id__in=seen_ids).filter(
            Q(title__icontains=search_term) |
            Q(description__icontains=search_term) |
            Q(model_name__icontains=search_term)
        ).select_related('category', 'owner').prefetch_related('images')[:2]

        for it in matched_db_items:
            seen_ids.add(str(it.id))
            img_url = it.primary_image_url
            if not img_url and it.images.exists():
                first_img = it.images.first()
                if first_img and hasattr(first_img, 'image') and first_img.image:
                    img_url = first_img.image.url

            complementary_items.append({
                'id': str(it.id),
                'title': it.title,
                'category_name': it.category.name if it.category else '',
                'rental_price_per_day': float(it.rental_price_per_day),
                'condition': it.condition,
                'primary_image_url': img_url or '',
                'paired_reason': pair_reason,
                'is_available': (it.status == Item.STATUS_ACTIVE and it.is_published),
            })
            if len(complementary_items) >= limit:
                break
        if len(complementary_items) >= limit:
            break

    # If campus inventory is low on specific companion items, backfill with active items in relevant categories
    if len(complementary_items) < limit:
        backfill_qs = Item.objects.filter(
            is_published=True,
            status=Item.STATUS_ACTIVE
        ).exclude(id__in=seen_ids).order_by('-rental_count', '-created_at')[:limit - len(complementary_items)]

        for it in backfill_qs:
            seen_ids.add(str(it.id))
            img_url = it.primary_image_url
            if not img_url and it.images.exists():
                first_img = it.images.first()
                if first_img and hasattr(first_img, 'image') and first_img.image:
                    img_url = first_img.image.url

            complementary_items.append({
                'id': str(it.id),
                'title': it.title,
                'category_name': it.category.name if it.category else '',
                'rental_price_per_day': float(it.rental_price_per_day),
                'condition': it.condition,
                'primary_image_url': img_url or '',
                'paired_reason': f"Popular companion item in {it.category.name if it.category else 'campus'}",
                'is_available': (it.status == Item.STATUS_ACTIVE and it.is_published),
            })

    # Suggestions list (names for UI chips like "Breadboard", "Ultrasonic Sensor")
    suggested_chips = [term.title() for term, _ in matched_associations[:5]]

    return {
        'target_item_id': str(target_item.id),
        'target_item_title': target_item.title,
        'complementary_items': complementary_items,
        'suggested_accessories': suggested_chips,
    }
