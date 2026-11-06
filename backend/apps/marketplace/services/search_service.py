import re
from django.db import connection
from django.db.models import Q


def apply_full_text_search(queryset, search_query: str):
    """
    Applies search across item title, description, category, brand, and model_name.
    Uses PostgreSQL Full-Text Search when on PostgreSQL; falls back to standard
    case-insensitive multi-term Q queries on SQLite.
    """
    if not search_query or not search_query.strip():
        return queryset

    cleaned_query = search_query.strip()
    # Strip dangerous punctuation but preserve words and alphanumeric characters
    cleaned_query = re.sub(r'[^\w\s-]', '', cleaned_query)
    terms = [term for term in cleaned_query.split() if term]

    if not terms:
        return queryset

    # Check database engine
    is_postgres = 'postgresql' in connection.settings_dict.get('ENGINE', '').lower()

    if is_postgres:
        try:
            from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
            vector = (
                SearchVector('title', weight='A') +
                SearchVector('brand', weight='B') +
                SearchVector('model_name', weight='B') +
                SearchVector('category__name', weight='B') +
                SearchVector('description', weight='C')
            )
            # Combine words using & (AND) query for precision
            search_expr = " & ".join(terms)
            query_obj = SearchQuery(search_expr, search_type='raw')
            ranked_qs = queryset.annotate(rank=SearchRank(vector, query_obj)).filter(rank__gt=0.01).order_by('-rank')
            if ranked_qs.exists():
                return ranked_qs
        except Exception:
            # Fall back to multi-word filter if vector search encounters issue
            pass

    # Multi-term fallback for SQLite and non-vector matches
    q_filter = Q()
    for term in terms:
        term_filter = (
            Q(title__icontains=term) |
            Q(description__icontains=term) |
            Q(brand__icontains=term) |
            Q(model_name__icontains=term) |
            Q(category__name__icontains=term)
        )
        q_filter &= term_filter

    return queryset.filter(q_filter)
