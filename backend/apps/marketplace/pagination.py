from rest_framework.pagination import PageNumberPagination


class MarketplacePagination(PageNumberPagination):
    """
    Standard pagination for marketplace resource listings.
    Default page size: 12. Maximum page size: 48.
    """
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 48
