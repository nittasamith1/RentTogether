import os
from rest_framework import serializers
from apps.profiles.models import StudentProfile, StudentVerification
from apps.accounts.serializers import UserSummarySerializer


class StudentProfileSerializer(serializers.ModelSerializer):
    """
    Detailed Student Profile Serializer covering dual-reputation, savings, and earnings.
    """
    user = UserSummarySerializer(read_only=True)
    college_name = serializers.CharField(source='college.name', read_only=True)
    college_code = serializers.CharField(source='college.code', read_only=True)

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
            'avatar_url',
            'bio',
            'phone_number',
            'reputation_as_owner',
            'reputation_as_renter',
            'total_savings',
            'total_earnings',
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
            'total_savings',
            'total_earnings',
            'is_verified',
            'created_at',
            'updated_at',
        ]


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
    Allows rejected students to update their credentials and re-upload their ID card.
    """
    roll_number = serializers.CharField(max_length=50, required=False)
    department = serializers.CharField(max_length=100, required=False)
    year_of_study = serializers.IntegerField(min_value=1, max_value=4, required=False)
    id_card_image = serializers.ImageField(required=True)

    def validate(self, attrs):
        user = self.context['request'].user
        verification = getattr(user, 'verification', None)
        if not verification:
            raise serializers.ValidationError("No verification record found to resubmit.")
        
        if verification.verification_status != StudentVerification.STATUS_REJECTED:
            raise serializers.ValidationError(
                f"Resubmission is only allowed for REJECTED applications. Current status: {verification.verification_status}"
            )
        return attrs

    def save(self):
        user = self.context['request'].user
        verification = user.verification
        image = self.validated_data['id_card_image']

        if 'roll_number' in self.validated_data:
            verification.roll_number = self.validated_data['roll_number'].strip().upper()
        if 'department' in self.validated_data:
            verification.department = self.validated_data['department'].strip()
        if 'year_of_study' in self.validated_data:
            verification.year_of_study = self.validated_data['year_of_study']

        verification.id_card_image = image

        # Cloudinary upload if available
        try:
            import cloudinary.uploader
            if os.getenv('CLOUDINARY_CLOUD_NAME'):
                upload_result = cloudinary.uploader.upload(
                    image,
                    folder=f"renttogether/{verification.college.code.lower()}/id_cards",
                    resource_type="image"
                )
                verification.id_card_url = upload_result.get('secure_url', '')
        except Exception:
            pass

        verification.verification_status = StudentVerification.STATUS_PENDING
        verification.rejection_reason = ""
        verification.save()
        return verification


class VerificationRejectSerializer(serializers.Serializer):
    """
    Administrator payload to reject a verification submission with reason.
    """
    reason = serializers.CharField(required=True, min_length=5, max_length=500)

