import os
from decimal import Decimal
from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
import cloudinary.uploader

from apps.accounts.serializers import UserSummarySerializer
from apps.profiles.models import StudentProfile, StudentVerification, StudentReview
from apps.profiles.validators import (
    validate_student_phone_number,
    validate_pickup_spots,
    validate_avatar_image,
)
from apps.profiles.services.profile_stats_service import (
    calculate_owner_stats,
    calculate_renter_stats,
)
from apps.profiles.services.reputation_service import (
    get_reputation_badge,
    calculate_owner_reputation,
    calculate_renter_reputation,
)
from apps.profiles.services.review_service import submit_student_review


class StudentReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for displaying student reviews.
    Exposes ratings, feedback, and reviewer display information.
    """
    reviewer_name = serializers.CharField(source='reviewer.get_full_name', read_only=True)
    reviewer_avatar = serializers.SerializerMethodField()
    reviewee_name = serializers.CharField(source='reviewee.get_full_name', read_only=True)
    calculated_score = serializers.DecimalField(max_digits=3, decimal_places=2, read_only=True)
    booking_reference = serializers.CharField(source='booking.booking_reference', read_only=True)
    item_title = serializers.CharField(source='booking.item_title', read_only=True)

    class Meta:
        model = StudentReview
        fields = [
            'id',
            'booking_id',
            'booking_reference',
            'item_title',
            'reviewer_id',
            'reviewer_name',
            'reviewer_avatar',
            'reviewee_id',
            'reviewee_name',
            'review_type',
            'condition_accuracy_score',
            'communication_score',
            'punctuality_score',
            'on_time_return_score',
            'item_care_score',
            'calculated_score',
            'overall_comment',
            'created_at',
        ]

    def get_reviewer_avatar(self, obj) -> str:
        if hasattr(obj.reviewer, 'profile') and obj.reviewer.profile.avatar_url:
            return obj.reviewer.profile.avatar_url
        return ""


class StudentReviewCreateSerializer(serializers.Serializer):
    """
    Serializer for submitting a review for a completed rental booking.
    """
    booking_id = serializers.UUIDField(required=True)
    review_type = serializers.ChoiceField(choices=['OWNER', 'RENTER'], required=True)
    condition_accuracy_score = serializers.IntegerField(required=False, min_value=1, max_value=5)
    communication_score = serializers.IntegerField(required=False, min_value=1, max_value=5)
    punctuality_score = serializers.IntegerField(required=False, min_value=1, max_value=5)
    on_time_return_score = serializers.IntegerField(required=False, min_value=1, max_value=5)
    item_care_score = serializers.IntegerField(required=False, min_value=1, max_value=5)
    overall_comment = serializers.CharField(required=False, allow_blank=True, max_length=500)

    def validate(self, attrs):
        review_type = attrs.get('review_type')
        if review_type == 'OWNER':
            if not attrs.get('condition_accuracy_score'):
                raise serializers.ValidationError({
                    'condition_accuracy_score': 'Condition accuracy score is required for owner reviews.'
                })
        elif review_type == 'RENTER':
            if not attrs.get('on_time_return_score'):
                raise serializers.ValidationError({
                    'on_time_return_score': 'On-time return score is required for renter reviews.'
                })
            if not attrs.get('item_care_score'):
                raise serializers.ValidationError({
                    'item_care_score': 'Item care score is required for renter reviews.'
                })
        return attrs

    def create(self, validated_data):
        reviewer = self.context['request'].user
        booking_id = validated_data['booking_id']
        review_type = validated_data['review_type']
        comment = validated_data.get('overall_comment', '')

        scores = {
            'condition_accuracy_score': validated_data.get('condition_accuracy_score'),
            'communication_score': validated_data.get('communication_score'),
            'punctuality_score': validated_data.get('punctuality_score'),
            'on_time_return_score': validated_data.get('on_time_return_score'),
            'item_care_score': validated_data.get('item_care_score'),
        }

        try:
            return submit_student_review(
                booking_id=booking_id,
                reviewer=reviewer,
                review_type=review_type,
                scores=scores,
                overall_comment=comment
            )
        except DjangoValidationError as exc:
            if hasattr(exc, 'message_dict'):
                raise serializers.ValidationError(exc.message_dict)
            raise serializers.ValidationError({"detail": exc.messages})


class StudentProfileSerializer(serializers.ModelSerializer):
    """
    Detailed Student Profile Serializer for the authenticated user (/profiles/me/).
    Contains complete dual-activity statistics, savings, earnings, and badges.
    """
    user = UserSummarySerializer(read_only=True)
    college_name = serializers.CharField(source='college.name', read_only=True)
    college_code = serializers.CharField(source='college.code', read_only=True)
    
    owner_stats = serializers.SerializerMethodField()
    renter_stats = serializers.SerializerMethodField()
    owner_badge = serializers.SerializerMethodField()
    renter_badge = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = [
            'id',
            'user',
            'college_name',
            'college_code',
            'roll_number',
            'department',
            'year_of_study',
            'avatar',
            'avatar_url',
            'bio',
            'phone_number',
            'reputation_as_owner',
            'reputation_as_renter',
            'owner_badge',
            'renter_badge',
            'total_items_lent',
            'total_items_borrowed',
            'total_savings_inr',
            'total_earnings_inr',
            'preferred_pickup_spots',
            'owner_stats',
            'renter_stats',
            'is_verified',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'user',
            'college_name',
            'college_code',
            'roll_number',
            'department',
            'year_of_study',
            'reputation_as_owner',
            'reputation_as_renter',
            'owner_badge',
            'renter_badge',
            'total_items_lent',
            'total_items_borrowed',
            'total_savings_inr',
            'total_earnings_inr',
            'is_verified',
            'created_at',
            'updated_at',
        ]

    def get_owner_stats(self, obj) -> dict:
        return calculate_owner_stats(obj.user)

    def get_renter_stats(self, obj) -> dict:
        return calculate_renter_stats(obj.user)

    def get_owner_badge(self, obj) -> str:
        score, count = calculate_owner_reputation(obj.user_id)
        return get_reputation_badge(score, count)

    def get_renter_badge(self, obj) -> str:
        score, count = calculate_renter_reputation(obj.user_id)
        return get_reputation_badge(score, count)


class StudentProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for PUT / PATCH /profiles/me/.
    Permits updating only allowed student profile fields: bio, phone_number,
    avatar, and preferred_pickup_spots.
    Strictly forbids direct manipulation of reputation, finances, or verification status.
    """
    avatar = serializers.ImageField(required=False, write_only=True)
    preferred_pickup_spots = serializers.ListField(
        child=serializers.CharField(max_length=150),
        required=False
    )

    class Meta:
        model = StudentProfile
        fields = [
            'bio',
            'phone_number',
            'avatar',
            'avatar_url',
            'preferred_pickup_spots',
        ]

    def validate_phone_number(self, value):
        validate_student_phone_number(value)
        return value

    def validate_preferred_pickup_spots(self, value):
        validate_pickup_spots(value)
        return value

    def validate_avatar(self, value):
        validate_avatar_image(value)
        return value

    def update(self, instance, validated_data):
        avatar_file = validated_data.pop('avatar', None)
        if avatar_file:
            instance.avatar = avatar_file
            # Cloudinary secure upload handling if configured
            if os.getenv('CLOUDINARY_CLOUD_NAME'):
                try:
                    upload_res = cloudinary.uploader.upload(
                        avatar_file,
                        folder="renttogether/avatars",
                        transformation=[{'width': 400, 'height': 400, 'crop': 'fill', 'gravity': 'face'}]
                    )
                    instance.avatar_url = upload_res.get('secure_url', '')
                except Exception:
                    instance.avatar_url = instance.avatar.url if hasattr(instance.avatar, 'url') else ''
            else:
                try:
                    instance.avatar_url = instance.avatar.url
                except Exception:
                    instance.avatar_url = f"/media/avatars/{avatar_file.name}"

        return super().update(instance, validated_data)


class PublicStudentProfileSerializer(serializers.Serializer):
    """
    Public Peer Profile Serializer (/profiles/<id>/).
    Exposes only approved peer-facing information for rental decisions:
    reputation badges, review counts, completed rentals, department, year.
    NEVER exposes email, phone, roll number, or private account data.
    """
    id = serializers.UUIDField(source='user.id')
    display_name = serializers.CharField(source='user.get_full_name')
    avatar_url = serializers.CharField()
    college_name = serializers.CharField(source='college.name', default='')
    college_code = serializers.CharField(source='college.code', default='')
    department = serializers.CharField()
    year_of_study = serializers.IntegerField()
    is_verified = serializers.BooleanField()
    
    # Reputation & Reviews
    owner_reputation = serializers.SerializerMethodField()
    owner_badge = serializers.SerializerMethodField()
    owner_review_count = serializers.SerializerMethodField()

    renter_reputation = serializers.SerializerMethodField()
    renter_badge = serializers.SerializerMethodField()
    renter_review_count = serializers.SerializerMethodField()

    total_completed_rentals = serializers.SerializerMethodField()
    member_since = serializers.DateTimeField(source='user.date_joined')
    recent_reviews = serializers.SerializerMethodField()

    def get_owner_reputation(self, obj):
        score, _ = calculate_owner_reputation(obj.user_id)
        return float(score) if score is not None else None

    def get_owner_badge(self, obj):
        score, count = calculate_owner_reputation(obj.user_id)
        return get_reputation_badge(score, count)

    def get_owner_review_count(self, obj):
        _, count = calculate_owner_reputation(obj.user_id)
        return count

    def get_renter_reputation(self, obj):
        score, _ = calculate_renter_reputation(obj.user_id)
        return float(score) if score is not None else None

    def get_renter_badge(self, obj):
        score, count = calculate_renter_reputation(obj.user_id)
        return get_reputation_badge(score, count)

    def get_renter_review_count(self, obj):
        _, count = calculate_renter_reputation(obj.user_id)
        return count

    def get_total_completed_rentals(self, obj):
        return obj.total_items_lent + obj.total_items_borrowed

    def get_recent_reviews(self, obj):
        reviews = StudentReview.objects.filter(
            reviewee=obj.user
        ).order_by('-created_at')[:5]
        return StudentReviewSerializer(reviews, many=True).data


class StudentVerificationSerializer(serializers.ModelSerializer):
    """
    Serializer for Student Identity Verification.
    Used by students to inspect verification status and by administrators to review applications.
    """
    user_email = serializers.EmailField(source='user.email', read_only=True)
    student_name = serializers.CharField(source='user.get_full_name', read_only=True)
    college_code = serializers.CharField(source='college.code', read_only=True)
    college_name = serializers.CharField(source='college.name', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True, default='')

    class Meta:
        model = StudentVerification
        fields = [
            'id',
            'user_email',
            'student_name',
            'college_code',
            'college_name',
            'roll_number',
            'department',
            'year_of_study',
            'id_card_image',
            'id_card_url',
            'verification_status',
            'rejection_reason',
            'submitted_at',
            'verified_at',
            'verified_by_name',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'user_email',
            'student_name',
            'college_code',
            'college_name',
            'verification_status',
            'rejection_reason',
            'submitted_at',
            'verified_at',
            'verified_by_name',
            'updated_at',
        ]


class StudentVerificationResubmitSerializer(serializers.Serializer):
    """
    Serializer for resubmitting a rejected student verification application.
    """
    roll_number = serializers.CharField(max_length=50, required=False)
    department = serializers.CharField(max_length=100, required=False)
    year_of_study = serializers.IntegerField(min_value=1, max_value=4, required=False)
    id_card_image = serializers.ImageField(required=True)

    def validate_id_card_image(self, value):
        max_bytes = 5 * 1024 * 1024
        if value.size > max_bytes:
            raise serializers.ValidationError("ID card image size must not exceed 5 MB.")
        valid_extensions = ['.jpg', '.jpeg', '.png', '.webp']
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in valid_extensions:
            raise serializers.ValidationError("Uploaded file must be a valid image (.jpg, .jpeg, .png, .webp).")
        return value

    def save(self):
        user = self.context['request'].user
        verification = getattr(user, 'verification', None)
        if not verification:
            raise serializers.ValidationError("No verification record found to resubmit.")

        validated = self.validated_data
        if 'roll_number' in validated:
            verification.roll_number = validated['roll_number'].strip()
        if 'department' in validated:
            verification.department = validated['department'].strip()
        if 'year_of_study' in validated:
            verification.year_of_study = validated['year_of_study']

        image_file = validated['id_card_image']
        verification.id_card_image = image_file

        if os.getenv('CLOUDINARY_CLOUD_NAME'):
            try:
                upload_res = cloudinary.uploader.upload(
                    image_file,
                    folder="renttogether/student_ids",
                    type="authenticated"
                )
                verification.id_card_url = upload_res.get('secure_url', '')
            except Exception:
                verification.id_card_url = verification.id_card_image.url if hasattr(verification.id_card_image, 'url') else ''
        else:
            try:
                verification.id_card_url = verification.id_card_image.url
            except Exception:
                verification.id_card_url = f"/media/id_cards/{image_file.name}"

        verification.verification_status = StudentVerification.STATUS_PENDING
        verification.rejection_reason = ""
        verification.verified_by = None
        verification.verified_at = None
        verification.save()

        return verification


class VerificationRejectSerializer(serializers.Serializer):
    """
    Serializer for admin rejection reason.
    """
    reason = serializers.CharField(
        required=True,
        min_length=5,
        max_length=500,
        help_text="Detailed explanation of rejection reasons to guide student resubmission."
    )

