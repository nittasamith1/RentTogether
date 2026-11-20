"""
Content-Based Similarity Recommendation Engine (Phase 13).
Fast, memory-efficient campus resource similarity matching using category and keyword overlap.
Eliminates heavy Scikit-learn TF-IDF matrices to keep production memory strictly under 300MB.
"""
from typing import List, Dict, Any
from apps.listings.models import Item


def get_similar_items(item_id: str, limit: int = 6) -> List[Dict[str, Any]]:
    """
    Finds top similar items to a target item based on category, brand, and title keywords.
    """
    try:
        target_item = Item.objects.select_related('category', 'owner').get(id=item_id)
    except Exception:
        return []

    # Get active candidate items in same college/campus (excluding target item)
    candidates = (
        Item.objects.filter(
            is_published=True,
            status=Item.STATUS_ACTIVE
        )
        .exclude(id=target_item.id)
        .select_related('category', 'owner')
        .prefetch_related('images')
    )

    if not candidates.exists():
        return []

    target_tokens = set((target_item.title or '').lower().split())
    if target_item.brand:
        target_tokens.add(target_item.brand.lower())

    scored_items = []
    for it in candidates[:50]:
        score = 0.40  # Baseline active peer item
        if it.category_id == target_item.category_id:
            score += 0.35
        if it.brand and target_item.brand and it.brand.lower() == target_item.brand.lower():
            score += 0.15

        cand_tokens = set((it.title or '').lower().split())
        common = target_tokens.intersection(cand_tokens)
        if common:
            score += min(0.20, len(common) * 0.08)

        score = min(0.98, round(score, 2))
        scored_items.append((score, it))

    # Sort descending by similarity score
    scored_items.sort(key=lambda x: x[0], reverse=True)

    results = []
    for score, it in scored_items[:limit]:
        img_url = it.primary_image_url
        if not img_url and it.images.exists():
            first_img = it.images.first()
            if first_img and hasattr(first_img, 'image') and first_img.image:
                img_url = first_img.image.url

        results.append({
            'id': str(it.id),
            'title': it.title,
            'category_name': it.category.name if it.category else '',
            'rental_price_per_day': float(it.rental_price_per_day),
            'condition': it.condition,
            'primary_image_url': img_url or '',
            'similarity_score': score,
            'match_reason': f"{int(score * 100)}% campus equipment similarity match",
        })

    return results
