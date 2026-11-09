from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.core.exceptions import ValidationError, PermissionDenied

from apps.bookings.services.booking_service import BookingService
from apps.bookings.services.booking_state_machine import (
    BookingStateMachine,
    InvalidStateTransitionError,
    BookingPermissionError,
    BookingDeadlineExpiredError,
)
from apps.availability.services.availability_service import AvailabilityConflictError
from apps.bookings.serializers import (
    CreateBookingRequestSerializer,
    BookingSummarySerializer,
    BookingDetailSerializer,
    BookingStatusHistorySerializer,
    HandoverConfirmSerializer,
    ActionReasonSerializer,
    CompleteInspectionSerializer,
)


class CreateBookingView(views.APIView):
    """
    POST /api/v1/bookings/create/
    Renter submits a new booking request. Authoritative pricing calculated on backend.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CreateBookingRequestSerializer(data=request.data)
        if not serializer.is_valid():
            first_err = next(iter(serializer.errors.values()), None)
            err_msg = first_err[0] if isinstance(first_err, list) and first_err else str(first_err)
            return Response(
                {"detail": err_msg, "errors": serializer.errors, "error": "VALIDATION_ERROR"},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data

        try:
            booking = BookingService.create_booking_request(
                renter_user=request.user,
                item_id=str(data['item_id']),
                start_date=data.get('start_date'),
                end_date=data.get('end_date'),
                start_datetime=data.get('start_datetime'),
                end_datetime=data.get('end_datetime'),
                pickup_spot=data.get('pickup_spot', '')
            )
        except AvailabilityConflictError as ce:
            return Response(
                {"detail": str(ce), "error": "AVAILABILITY_CONFLICT"},
                status=status.HTTP_409_CONFLICT
            )
        except BookingPermissionError as pe:
            return Response({"detail": str(pe), "error": "PERMISSION_DENIED"}, status=status.HTTP_403_FORBIDDEN)
        except ValidationError as ve:
            return Response({"detail": ve.messages if hasattr(ve, 'messages') else str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"detail": str(e), "error": "BOOKING_REQUEST_FAILED"},
                status=status.HTTP_400_BAD_REQUEST
            )

        response_serializer = BookingDetailSerializer(booking, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class MyRentalsListView(views.APIView):
    """
    GET /api/v1/bookings/my-rentals/
    Returns outgoing equipment rentals requested/borrowed by the authenticated student.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        status_filter = request.query_params.get('status')
        search = request.query_params.get('search')
        qs = BookingService.get_renter_bookings(request.user, status_filter=status_filter, search=search)
        serializer = BookingSummarySerializer(qs, many=True, context={'request': request})
        return Response({
            "count": qs.count(),
            "results": serializer.data
        }, status=status.HTTP_200_OK)


class MyIncomingRequestsListView(views.APIView):
    """
    GET /api/v1/bookings/my-requests/
    Returns incoming rental requests for the student's listed equipment (Owner desk).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        status_filter = request.query_params.get('status')
        search = request.query_params.get('search')
        qs = BookingService.get_owner_incoming_requests(request.user, status_filter=status_filter, search=search)
        serializer = BookingSummarySerializer(qs, many=True, context={'request': request})
        return Response({
            "count": qs.count(),
            "results": serializer.data
        }, status=status.HTTP_200_OK)


class BookingDetailView(views.APIView):
    """
    GET /api/v1/bookings/<uuid:booking_id>/
    Returns comprehensive booking agreement details, deadlines, and allowed actions.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, booking_id):
        try:
            booking = BookingService.get_booking_detail(str(booking_id), request.user)
        except ValidationError as ve:
            return Response({"detail": str(ve)}, status=status.HTTP_404_NOT_FOUND)
        except PermissionDenied as pd:
            return Response({"detail": str(pd)}, status=status.HTTP_403_FORBIDDEN)

        serializer = BookingDetailSerializer(booking, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class AcceptBookingView(views.APIView):
    """
    POST /api/v1/bookings/<uuid:booking_id>/accept/
    Owner approves booking request and establishes a transactional 12-hour payment hold.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        try:
            booking = BookingStateMachine.approve_by_owner(str(booking_id), request.user)
        except AvailabilityConflictError as ce:
            return Response({"detail": str(ce), "error": "CONFLICT"}, status=status.HTTP_409_CONFLICT)
        except InvalidStateTransitionError as te:
            return Response({"detail": str(te), "error": "INVALID_STATE"}, status=status.HTTP_409_CONFLICT)
        except BookingDeadlineExpiredError as de:
            return Response({"detail": str(de), "error": "DEADLINE_EXPIRED"}, status=status.HTTP_400_BAD_REQUEST)
        except BookingPermissionError as pe:
            return Response({"detail": str(pe)}, status=status.HTTP_403_FORBIDDEN)

        serializer = BookingDetailSerializer(booking, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class RejectBookingView(views.APIView):
    """
    POST /api/v1/bookings/<uuid:booking_id>/reject/
    Owner declines booking request with an optional reason.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        reason_serializer = ActionReasonSerializer(data=request.data)
        reason_serializer.is_valid()
        reason = reason_serializer.validated_data.get('reason', '')

        try:
            booking = BookingStateMachine.reject_by_owner(str(booking_id), request.user, reason=reason)
        except InvalidStateTransitionError as te:
            return Response({"detail": str(te)}, status=status.HTTP_409_CONFLICT)
        except BookingPermissionError as pe:
            return Response({"detail": str(pe)}, status=status.HTTP_403_FORBIDDEN)

        serializer = BookingDetailSerializer(booking, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class CancelBookingView(views.APIView):
    """
    POST /api/v1/bookings/<uuid:booking_id>/cancel/
    Authorized cancellation workflow.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        reason_serializer = ActionReasonSerializer(data=request.data)
        reason_serializer.is_valid()
        reason = reason_serializer.validated_data.get('reason', '')

        try:
            booking = BookingStateMachine.cancel_booking(str(booking_id), user=request.user, reason=reason)
        except InvalidStateTransitionError as te:
            return Response({"detail": str(te)}, status=status.HTTP_409_CONFLICT)
        except BookingPermissionError as pe:
            return Response({"detail": str(pe)}, status=status.HTTP_403_FORBIDDEN)

        serializer = BookingDetailSerializer(booking, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ConfirmCashPaymentView(views.APIView):
    """
    POST /api/v1/bookings/<uuid:booking_id>/confirm-cash/
    Dual-confirmation in-person offline cash payment:
      - Renter confirms: 'I Have Paid (Cash)'
      - Owner confirms: 'Cash Received'
      - When both confirm, booking transitions to CASH_PAYMENT_CONFIRMED.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        try:
            booking = BookingService.get_booking_detail(str(booking_id), request.user)
        except (ValidationError, PermissionDenied) as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            updated_booking = BookingStateMachine.record_cash_confirmation(str(booking.id), request.user)
        except ValidationError as ve:
            return Response({"detail": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except BookingDeadlineExpiredError as de:
            return Response({"detail": str(de)}, status=status.HTTP_400_BAD_REQUEST)
        except BookingPermissionError as pe:
            return Response({"detail": str(pe)}, status=status.HTTP_403_FORBIDDEN)
        except InvalidStateTransitionError as te:
            return Response({"detail": str(te)}, status=status.HTTP_409_CONFLICT)

        serializer = BookingDetailSerializer(updated_booking, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class InitiatePaymentView(views.APIView):
    """
    POST /api/v1/bookings/<uuid:booking_id>/payment/initiate/
    Offline cash confirmation gateway endpoint (backward-compatible).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        try:
            booking = BookingService.get_booking_detail(str(booking_id), request.user)
        except (ValidationError, PermissionDenied) as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            updated_booking = BookingStateMachine.record_cash_confirmation(str(booking.id), request.user)
        except ValidationError as ve:
            return Response({"detail": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except BookingDeadlineExpiredError as de:
            return Response({"detail": str(de)}, status=status.HTTP_400_BAD_REQUEST)
        except BookingPermissionError as pe:
            return Response({"detail": str(pe)}, status=status.HTTP_403_FORBIDDEN)
        except InvalidStateTransitionError as te:
            return Response({"detail": str(te)}, status=status.HTTP_409_CONFLICT)

        serializer = BookingDetailSerializer(updated_booking, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ConfirmHandoverView(views.APIView):
    """
    POST /api/v1/bookings/<uuid:booking_id>/handover/confirm/
    Verifies single-use handover pass code and changes status to ACTIVE rental.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        serializer = HandoverConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        pass_code = serializer.validated_data['pass_code']

        try:
            booking = BookingStateMachine.confirm_handover(str(booking_id), request.user, pass_code=pass_code)
        except ValidationError as ve:
            return Response({"detail": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except InvalidStateTransitionError as te:
            return Response({"detail": str(te)}, status=status.HTTP_409_CONFLICT)
        except BookingPermissionError as pe:
            return Response({"detail": str(pe)}, status=status.HTTP_403_FORBIDDEN)

        detail_serializer = BookingDetailSerializer(booking, context={'request': request})
        return Response(detail_serializer.data, status=status.HTTP_200_OK)


class InitiateReturnView(views.APIView):
    """
    POST /api/v1/bookings/<uuid:booking_id>/return/
    Renter indicates equipment has been handed back on campus.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        reason_serializer = ActionReasonSerializer(data=request.data)
        reason_serializer.is_valid()
        notes = reason_serializer.validated_data.get('reason', '')

        try:
            booking = BookingStateMachine.initiate_return(str(booking_id), request.user, return_notes=notes)
        except InvalidStateTransitionError as te:
            return Response({"detail": str(te)}, status=status.HTTP_409_CONFLICT)
        except BookingPermissionError as pe:
            return Response({"detail": str(pe)}, status=status.HTTP_403_FORBIDDEN)

        serializer = BookingDetailSerializer(booking, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class CompleteInspectionView(views.APIView):
    """
    POST /api/v1/bookings/<uuid:booking_id>/inspection/complete/
    Owner completes post-rental equipment check (pass -> COMPLETED, fail -> DISPUTED).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        serializer = CompleteInspectionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        passed = serializer.validated_data.get('passed', True)
        notes = serializer.validated_data.get('notes', '')

        try:
            booking = BookingStateMachine.complete_inspection(
                str(booking_id),
                owner_user=request.user,
                passed=passed,
                notes=notes
            )
        except InvalidStateTransitionError as te:
            return Response({"detail": str(te)}, status=status.HTTP_409_CONFLICT)
        except BookingPermissionError as pe:
            return Response({"detail": str(pe)}, status=status.HTTP_403_FORBIDDEN)

        detail_serializer = BookingDetailSerializer(booking, context={'request': request})
        return Response(detail_serializer.data, status=status.HTTP_200_OK)


class BookingHistoryView(views.APIView):
    """
    GET /api/v1/bookings/<uuid:booking_id>/history/
    Audit trail of transitions for this booking.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, booking_id):
        try:
            booking = BookingService.get_booking_detail(str(booking_id), request.user)
        except (ValidationError, PermissionDenied) as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)

        history = booking.status_history.all().order_by('-created_at')
        serializer = BookingStatusHistorySerializer(history, many=True)
        return Response({
            "booking_code": booking.booking_code,
            "count": history.count(),
            "results": serializer.data
        }, status=status.HTTP_200_OK)


# ==============================================================================
# PHASE 08: IN-PERSON CAMPUS HANDOVER & RETURN VERIFICATION VIEWS
# ==============================================================================

from apps.bookings.services.handover_service import (
    HandoverService,
    HandoverSecurityError,
)
from apps.bookings.serializers import (
    VerifyPickupSerializer,
    VerifyReturnSerializer,
    HandoverEvidenceSerializer,
)


class HandoverPassView(views.APIView):
    """
    GET /api/v1/bookings/<uuid:booking_id>/handover-pass/
    Returns ephemeral pickup pass (to Owner) or return pass (to Renter).
    Enforces Cache-Control: no-store.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, booking_id):
        try:
            booking = BookingService.get_booking_detail(str(booking_id), request.user)
        except (ValidationError, PermissionDenied) as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)

        try:
            pass_data = HandoverService.get_or_create_pass(booking, request.user)
        except BookingPermissionError as pe:
            return Response({"detail": str(pe)}, status=status.HTTP_403_FORBIDDEN)
        except ValidationError as ve:
            return Response({"detail": str(ve)}, status=status.HTTP_400_BAD_REQUEST)

        response = Response(pass_data, status=status.HTTP_200_OK)
        response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        return response


class RegenerateHandoverPassView(views.APIView):
    """
    POST /api/v1/bookings/<uuid:booking_id>/handover-pass/regenerate/
    Regenerates fresh OTP and QR token for the authorized participant.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        try:
            booking = BookingService.get_booking_detail(str(booking_id), request.user)
        except (ValidationError, PermissionDenied) as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)

        try:
            pass_data = HandoverService.get_or_create_pass(booking, request.user, force_regenerate=True)
        except BookingPermissionError as pe:
            return Response({"detail": str(pe)}, status=status.HTTP_403_FORBIDDEN)
        except ValidationError as ve:
            return Response({"detail": str(ve)}, status=status.HTTP_400_BAD_REQUEST)

        response = Response(pass_data, status=status.HTTP_200_OK)
        response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        return response


class VerifyPickupView(views.APIView):
    """
    POST /api/v1/bookings/<uuid:booking_id>/verify-pickup/
    Renter scans Owner's QR code or enters OTP to verify physical possession.
    Transitions booking to ACTIVE.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        serializer = VerifyPickupSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            booking = BookingService.get_booking_detail(str(booking_id), request.user)
        except (ValidationError, PermissionDenied) as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)

        method = serializer.validated_data['method']
        credential = serializer.validated_data.get('otp') or serializer.validated_data.get('token')
        condition = serializer.validated_data.get('pickup_condition', 'GOOD')
        notes = serializer.validated_data.get('pickup_notes', '')

        try:
            updated_booking = HandoverService.verify_pickup(
                booking=booking,
                renter_user=request.user,
                method=method,
                credential=credential,
                pickup_condition=condition,
                pickup_notes=notes
            )
        except BookingPermissionError as pe:
            return Response({"detail": str(pe)}, status=status.HTTP_403_FORBIDDEN)
        except InvalidStateTransitionError as te:
            return Response({"detail": str(te)}, status=status.HTTP_409_CONFLICT)
        except HandoverSecurityError as se:
            status_code = status.HTTP_429_TOO_MANY_REQUESTS if "maximum" in str(se).lower() else status.HTTP_400_BAD_REQUEST
            return Response({"detail": str(se)}, status=status_code)

        detail_serializer = BookingDetailSerializer(updated_booking, context={'request': request})
        return Response(detail_serializer.data, status=status.HTTP_200_OK)


class VerifyReturnView(views.APIView):
    """
    POST /api/v1/bookings/<uuid:booking_id>/verify-return/
    Owner scans Renter's QR code or enters OTP to verify physical return handback.
    Transitions booking to RETURNED_PENDING_INSPECTION.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        serializer = VerifyReturnSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            booking = BookingService.get_booking_detail(str(booking_id), request.user)
        except (ValidationError, PermissionDenied) as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)

        method = serializer.validated_data['method']
        credential = serializer.validated_data.get('otp') or serializer.validated_data.get('token')
        condition = serializer.validated_data.get('return_item_condition', 'SAME')
        notes = serializer.validated_data.get('return_notes', '')

        try:
            updated_booking = HandoverService.verify_return(
                booking=booking,
                owner_user=request.user,
                method=method,
                credential=credential,
                return_condition=condition,
                return_notes=notes
            )
        except BookingPermissionError as pe:
            return Response({"detail": str(pe)}, status=status.HTTP_403_FORBIDDEN)
        except InvalidStateTransitionError as te:
            return Response({"detail": str(te)}, status=status.HTTP_409_CONFLICT)
        except HandoverSecurityError as se:
            status_code = status.HTTP_429_TOO_MANY_REQUESTS if "maximum" in str(se).lower() else status.HTTP_400_BAD_REQUEST
            return Response({"detail": str(se)}, status=status_code)

        detail_serializer = BookingDetailSerializer(updated_booking, context={'request': request})
        return Response(detail_serializer.data, status=status.HTTP_200_OK)


class HandoverEvidenceView(views.APIView):
    """
    POST /api/v1/bookings/<uuid:booking_id>/evidence/
    Attaches pickup or return photographic evidence.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        serializer = HandoverEvidenceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            booking = BookingService.get_booking_detail(str(booking_id), request.user)
        except (ValidationError, PermissionDenied) as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)

        stage = serializer.validated_data['stage']
        image_url = serializer.validated_data['image_url']
        caption = serializer.validated_data.get('caption', '')

        try:
            evidence = HandoverService.record_evidence(
                booking=booking,
                user=request.user,
                stage=stage,
                image_url=image_url,
                caption=caption
            )
        except BookingPermissionError as pe:
            return Response({"detail": str(pe)}, status=status.HTTP_403_FORBIDDEN)

        return Response({
            "id": str(evidence.id),
            "stage": evidence.evidence_stage,
            "image_url": evidence.image_url,
            "caption": evidence.caption,
            "created_at": evidence.created_at.isoformat()
        }, status=status.HTTP_201_CREATED)


class DeleteBookingRecordView(views.APIView):
    """
    DELETE /api/v1/bookings/<uuid:booking_id>/delete/
    Permanently deletes a cancelled or rejected booking record and its related
    status history, verification, and notification rows to reclaim database storage.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, booking_id):
        from apps.bookings.models import Booking
        booking = get_object_or_404(Booking, id=booking_id)

        # Ensure user is either renter or owner
        if booking.renter_id != request.user.id and booking.owner_id != request.user.id:
            return Response({"detail": "You do not have permission to delete this booking."}, status=status.HTTP_403_FORBIDDEN)

        # Safety: Can only delete inactive, cancelled, or rejected bookings
        deletable_statuses = [
            Booking.STATUS_CANCELLED,
            Booking.STATUS_REJECTED,
        ]
        if booking.status not in deletable_statuses:
            return Response({
                "detail": f"Only cancelled or rejected bookings can be cleared from history. Current status is {booking.status}."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Release any associated availability block if still lingering
        from apps.availability.models import ItemAvailabilityBlock
        ItemAvailabilityBlock.objects.filter(booking_reference=booking).delete()

        ref = booking.booking_reference
        booking.delete()

        return Response({
            "detail": f"Booking {ref} and associated history records permanently cleared.",
            "booking_reference": ref
        }, status=status.HTTP_200_OK)

    def post(self, request, booking_id):
        return self.delete(request, booking_id)


class ClearCancelledBookingsView(views.APIView):
    """
    DELETE /api/v1/bookings/clear-cancelled/
    Bulk cleans all cancelled and rejected bookings for the authenticated student
    (either as renter or owner) to reclaim database storage.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        from apps.bookings.models import Booking
        deletable_statuses = [
            Booking.STATUS_CANCELLED,
            Booking.STATUS_REJECTED,
        ]
        qs = Booking.objects.filter(
            Q(renter=request.user) | Q(owner=request.user),
            status__in=deletable_statuses
        )
        count = qs.count()
        if count == 0:
            return Response({
                "detail": "No cancelled or rejected booking history to clear.",
                "deleted_count": 0
            }, status=status.HTTP_200_OK)

        # Release any lingering blocks
        from apps.availability.models import ItemAvailabilityBlock
        ItemAvailabilityBlock.objects.filter(booking_reference__in=qs).delete()

        deleted_count, _ = qs.delete()

        return Response({
            "detail": f"Successfully cleared {deleted_count} cancelled/rejected bookings from history. Database storage reclaimed.",
            "deleted_count": deleted_count
        }, status=status.HTTP_200_OK)

    def post(self, request):
        return self.delete(request)



