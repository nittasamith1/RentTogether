from datetime import datetime
from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.core.exceptions import ValidationError, PermissionDenied
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date

from apps.listings.models import Item
from apps.availability.models import ItemAvailabilityBlock
from apps.availability.serializers import (
    ItemAvailabilityPublicSerializer,
    CreateManualBlockSerializer,
    CheckAvailabilityQuerySerializer,
    OwnerCalendarBlockSerializer,
)
from apps.availability.services.availability_service import (
    AvailabilityService,
    AvailabilityConflictError,
    AvailabilityPermissionError,
)


class ItemAvailabilityView(views.APIView):
    """
    GET /api/v1/availability/items/<uuid:item_id>/
    Returns unavailable date intervals for an item within the same college.
    Privacy-safe: omits renter identities, booking IDs, and payment references.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, item_id):
        item = get_object_or_404(Item.objects.select_related('owner__college'), id=item_id)

        # Enforce intra-campus isolation
        user_college = getattr(request.user, 'college', None)
        item_college = getattr(item.owner, 'college', None)
        if user_college and item_college and user_college != item_college:
            return Response(
                {"detail": "You cannot access resource availability outside your college campus."},
                status=status.HTTP_403_FORBIDDEN
            )

        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        start_date = parse_date(start_date_str) if start_date_str else None
        end_date = parse_date(end_date_str) if end_date_str else None

        blocks = AvailabilityService.get_item_availability(item, start_date=start_date, end_date=end_date)
        serializer = ItemAvailabilityPublicSerializer(blocks, many=True, context={'request': request})

        return Response({
            "item_id": str(item.id),
            "timezone": "Asia/Kolkata",
            "availability": serializer.data
        }, status=status.HTTP_200_OK)


class CheckItemAvailabilityView(views.APIView):
    """
    GET /api/v1/availability/items/<uuid:item_id>/check/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
    Pre-flight availability verification for requested rental dates.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, item_id):
        item = get_object_or_404(Item.objects.select_related('owner__college'), id=item_id)

        query_serializer = CheckAvailabilityQuerySerializer(data=request.query_params)
        if not query_serializer.is_valid():
            return Response(query_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        start_bound = query_serializer.validated_data.get('start_datetime') or query_serializer.validated_data.get('start_date')
        end_bound = query_serializer.validated_data.get('end_datetime') or query_serializer.validated_data.get('end_date')

        is_available, conflict = AvailabilityService.check_item_availability(item, start_bound, end_bound)

        if is_available:
            return Response({
                "item_id": str(item.id),
                "available": True,
                "conflict": None
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                "item_id": str(item.id),
                "available": False,
                "conflict": {
                    "reason": conflict.reason,
                    "start_date": conflict.start_date,
                    "end_date": conflict.end_date,
                    "start_datetime": conflict.start_datetime,
                    "end_datetime": conflict.end_datetime
                }
            }, status=status.HTTP_200_OK)


class CreateManualBlockView(views.APIView):
    """
    POST /api/v1/availability/items/<uuid:item_id>/blocks/
    Allows the verified item owner to mark dates unavailable (OWNER_UNAVAILABLE or MAINTENANCE).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, item_id):
        serializer = CreateManualBlockSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            block = AvailabilityService.create_owner_block(
                item_id=str(item_id),
                start_date=data['start_date'],
                end_date=data['end_date'],
                reason=data['reason'],
                user=request.user
            )
        except AvailabilityConflictError as ce:
            return Response(
                {"detail": str(ce), "conflict": getattr(ce.conflicting_block, 'reason', None)},
                status=status.HTTP_409_CONFLICT
            )
        except AvailabilityPermissionError as pe:
            return Response({"detail": str(pe)}, status=status.HTTP_403_FORBIDDEN)
        except ValidationError as ve:
            return Response({"detail": ve.messages if hasattr(ve, 'messages') else str(ve)}, status=status.HTTP_400_BAD_REQUEST)

        response_serializer = ItemAvailabilityPublicSerializer(block, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class DeleteManualBlockView(views.APIView):
    """
    DELETE /api/v1/availability/blocks/<uuid:block_id>/
    Removes a manual owner/maintenance block. Prevents deletion of BOOKED blocks.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, block_id):
        try:
            AvailabilityService.remove_owner_block(str(block_id), request.user)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except AvailabilityPermissionError as pe:
            return Response({"detail": str(pe)}, status=status.HTTP_403_FORBIDDEN)
        except ValidationError as ve:
            return Response({"detail": str(ve)}, status=status.HTTP_404_NOT_FOUND)


class OwnerCalendarView(views.APIView):
    """
    GET /api/v1/availability/my-calendar/
    Returns full schedule of all blocks for items owned by the authenticated student.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        AvailabilityService.cleanup_expired_holds()

        qs = ItemAvailabilityBlock.objects.filter(
            item__owner=request.user
        ).select_related('item', 'booking_reference').prefetch_related('item__images')

        item_id = request.query_params.get('item_id')
        if item_id:
            qs = qs.filter(item_id=item_id)

        reason = request.query_params.get('reason')
        if reason:
            qs = qs.filter(reason=reason)

        start_date = parse_date(request.query_params.get('start_date', ''))
        end_date = parse_date(request.query_params.get('end_date', ''))

        if start_date and end_date:
            qs = qs.filter(start_date__lt=end_date, end_date__gt=start_date)
        elif start_date:
            qs = qs.filter(end_date__gt=start_date)
        elif end_date:
            qs = qs.filter(start_date__lt=end_date)

        serializer = OwnerCalendarBlockSerializer(qs.order_by('start_date'), many=True)
        return Response({
            "count": qs.count(),
            "results": serializer.data
        }, status=status.HTTP_200_OK)
