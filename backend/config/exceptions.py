import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError
from django.conf import settings

logger = logging.getLogger('renttogether.security')


def custom_exception_handler(exc, context):
    """
    Standardized, production-grade exception handler for RentTogether.
    - Preserves field-specific validation error dictionaries (e.g. {'email': [...]})
    - Guarantees standard 'detail' and 'code' fields
    - Converts native Django ValidationError to HTTP 400
    - Prevents internal database / server stack traces from leaking to clients in production
    """
    # Convert Django's native ValidationError to DRF-compatible response
    if isinstance(exc, DjangoValidationError):
        if hasattr(exc, 'message_dict'):
            data = dict(exc.message_dict)
            first_msg = next(iter(data.values()), None)
            detail = first_msg[0] if isinstance(first_msg, list) and first_msg else str(first_msg)
            data['detail'] = detail
            data['code'] = 'VALIDATION_ERROR'
            return Response(data, status=status.HTTP_400_BAD_REQUEST)
        elif hasattr(exc, 'messages'):
            msg = exc.messages if len(exc.messages) > 1 else exc.messages[0]
            return Response({
                "detail": msg,
                "code": "VALIDATION_ERROR"
            }, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({
                "detail": str(exc),
                "code": "VALIDATION_ERROR"
            }, status=status.HTTP_400_BAD_REQUEST)

    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    if response is not None:
        if isinstance(response.data, dict):
            # If detail is missing, extract first message as detail
            if 'detail' not in response.data:
                first_val = next(iter(response.data.values()), None)
                if isinstance(first_val, list) and first_val:
                    response.data['detail'] = first_val[0]
                elif first_val:
                    response.data['detail'] = str(first_val)
                else:
                    response.data['detail'] = 'Invalid request data.'

            error_code = "VALIDATION_ERROR" if response.status_code == 400 else "API_ERROR"
            if response.status_code == 401:
                error_code = "AUTHENTICATION_REQUIRED"
            elif response.status_code == 403:
                error_code = "PERMISSION_DENIED"
            elif response.status_code == 404:
                error_code = "NOT_FOUND"
            elif response.status_code == 409:
                error_code = "CONFLICT"
            elif response.status_code == 429:
                error_code = "THROTTLED"

            response.data.setdefault('code', error_code)
        elif isinstance(response.data, list):
            msg = response.data[0] if response.data else "Invalid request."
            response.data = {
                "detail": msg,
                "code": "VALIDATION_ERROR",
                "errors": response.data
            }
        return response

    # Unhandled 500 server error
    view_name = context.get('view').__class__.__name__ if context and context.get('view') else 'UnknownView'
    logger.error(f"Unhandled exception in {view_name}: {exc}", exc_info=True)

    if settings.DEBUG:
        safe_msg = f"Internal Server Error: {str(exc)}"
    else:
        safe_msg = "An unexpected campus service error occurred. Please try again shortly or contact campus support."

    return Response({
        "detail": safe_msg,
        "code": "INTERNAL_SERVER_ERROR"
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
