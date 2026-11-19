"""
Content-Based Similarity Recommendation Engine (Phase 13).
Uses TF-IDF Vectorization and Cosine Similarity on title, description, category, and brand
to discover similar campus resources.
"""

from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from apps.listings.models import Item


def get_similar_items(item_id: str, limit: int = 6) -> List[Dict[str, Any]]:
    """
    Finds top similar items to a target item using TF-IDF and Cosine Similarity.
    """
    try:
        target_item = Item.objects.select_related('category', 'owner').get(id=item_id)
    except Exception:
        return []

    # Get active published items (excluding target item)
    candidate_items = list(
        Item.objects.filter(is_published=True, status=Item.STATUS_ACTIVE)
        .exclude(id=target_item.id)
        .select_related('category', 'owner')
        .prefetch_related('images')[:100]
    )

    if not candidate_items:
        return []

    # Build corpus
    def extract_text(item: Item) -> str:
        parts = [
            item.title or '',
            item.category.name if getattr(item, 'category', None) else '',
            item.description or '',
            item.brand or '',
            item.model_name or '',
        ]
        return " ".join(parts).lower()

    target_text = extract_text(target_item)
    corpus = [target_text] + [extract_text(it) for it in candidate_items]

    try:
        vectorizer = TfidfVectorizer(stop_words='english', min_df=1, max_features=1000)
        tfidf_matrix = vectorizer.fit_transform(corpus)
        similarity_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])[0]

        # Rank candidates
        ranked_indices = similarity_scores.argsort()[::-1]

        results = []
        for idx in ranked_indices:
            score = float(similarity_scores[idx])
            it = candidate_items[idx]
            # Primary image
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
                'similarity_score': round(score, 4),
                'match_reason': f"{int(score * 100)}% content similarity match",
            })
            if len(results) >= limit:
                break

        return results
    except Exception:
        # Fallback to category items if TF-IDF fails
        fallback_items = Item.objects.filter(
            category=target_item.category,
            is_published=True,
            status=Item.STATUS_ACTIVE
        ).exclude(id=target_item.id)[:limit]

        return [
            {
                'id': str(it.id),
                'title': it.title,
                'category_name': it.category.name if it.category else '',
                'rental_price_per_day': float(it.rental_price_per_day),
                'condition': it.condition,
                'primary_image_url': it.primary_image_url or '',
                'similarity_score': 0.50,
                'match_reason': "Same category recommendation",
            }
            for it in fallback_items
        ]
