from django.urls import path
from apps.bookings.views import (
    CreateBookingView,
    MyRentalsListView,
    MyIncomingRequestsListView,
    BookingDetailView,
    AcceptBookingView,
    RejectBookingView,
    CancelBookingView,
    ConfirmCashPaymentView,
    InitiatePaymentView,
    ConfirmHandoverView,
    InitiateReturnView,
    CompleteInspectionView,
    BookingHistoryView,
    HandoverPassView,
    RegenerateHandoverPassView,
    VerifyPickupView,
    VerifyReturnView,
    HandoverEvidenceView,
    DeleteBookingRecordView,
    ClearCancelledBookingsView,
)

urlpatterns = [
    # Creation & Queries
    path('create/', CreateBookingView.as_view(), name='booking-create'),
    path('my-rentals/', MyRentalsListView.as_view(), name='my-rentals'),
    path('my-requests/', MyIncomingRequestsListView.as_view(), name='my-incoming-requests'),
    path('clear-cancelled/', ClearCancelledBookingsView.as_view(), name='booking-clear-cancelled'),
    path('<uuid:booking_id>/', BookingDetailView.as_view(), name='booking-detail'),
    path('<uuid:booking_id>/delete/', DeleteBookingRecordView.as_view(), name='booking-delete-record'),

    # Lifecycle State Transitions
    path('<uuid:booking_id>/accept/', AcceptBookingView.as_view(), name='booking-accept'),
    path('<uuid:booking_id>/reject/', RejectBookingView.as_view(), name='booking-reject'),
    path('<uuid:booking_id>/cancel/', CancelBookingView.as_view(), name='booking-cancel'),
    path('<uuid:booking_id>/confirm-cash/', ConfirmCashPaymentView.as_view(), name='booking-confirm-cash'),
    path('<uuid:booking_id>/cash/confirm/', ConfirmCashPaymentView.as_view(), name='booking-cash-confirm'),
    path('<uuid:booking_id>/payment/initiate/', InitiatePaymentView.as_view(), name='booking-payment-initiate'),
    path('<uuid:booking_id>/handover/confirm/', ConfirmHandoverView.as_view(), name='booking-handover-confirm'),
    path('<uuid:booking_id>/return/', InitiateReturnView.as_view(), name='booking-return'),
    path('<uuid:booking_id>/inspection/complete/', CompleteInspectionView.as_view(), name='booking-inspection-complete'),
    path('<uuid:booking_id>/history/', BookingHistoryView.as_view(), name='booking-history'),

    # Phase 08: In-Person Campus Handover, Return Verification & Pass Credentials
    path('<uuid:booking_id>/handover-pass/', HandoverPassView.as_view(), name='booking-handover-pass'),
    path('<uuid:booking_id>/handover-pass/regenerate/', RegenerateHandoverPassView.as_view(), name='booking-handover-pass-regenerate'),
    path('<uuid:booking_id>/verify-pickup/', VerifyPickupView.as_view(), name='booking-verify-pickup'),
    path('<uuid:booking_id>/verify-return/', VerifyReturnView.as_view(), name='booking-verify-return'),
    path('<uuid:booking_id>/evidence/', HandoverEvidenceView.as_view(), name='booking-evidence'),
]

