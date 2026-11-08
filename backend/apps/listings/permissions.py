from rest_framework import permissions


class IsVerifiedStudentOwner(permissions.BasePermission):
    """
    Ensures that only authenticated students with verified institutional emails
    and approved campus student verifications can manage equipment listings.
    """
    message = "Verified student status is required to access equipment inventory management."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and
            user.is_authenticated and
            getattr(user, 'email_verified', False) and
            getattr(user, 'is_college_verified', False)
        )

    def has_object_permission(self, request, view, obj):
        # Enforce that the listing belongs strictly to the authenticated student
        return bool(
            request.user and
            request.user.is_authenticated and
            getattr(obj, 'owner_id', None) == request.user.id
        )

