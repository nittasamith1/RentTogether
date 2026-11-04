from django.urls import path
from apps.profiles.views import (
    StudentProfileMeView,
    PublicStudentProfileView,
    StudentReviewCreateView,
    PublicReviewListView,
    VerificationStatusView,
    VerificationResubmitView,
)

urlpatterns = [
    # Authenticated Student Profile
    path('me/', StudentProfileMeView.as_view(), name='profile-me'),

    # Reviews (Created by authenticated participant, or listed for public peer review)
    path('reviews/', StudentReviewCreateView.as_view(), name='review-create'),

    # Student Onboarding & Verification status
    path('verification-status/', VerificationStatusView.as_view(), name='verification-status'),
    path('verification/resubmit/', VerificationResubmitView.as_view(), name='verification-resubmit'),

    # Peer Profile Inspection (UUID scoped)
    path('<uuid:student_id>/', PublicStudentProfileView.as_view(), name='profile-public'),
    path('<uuid:student_id>/reviews/', PublicReviewListView.as_view(), name='profile-public-reviews'),
]

