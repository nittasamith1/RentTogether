from rest_framework.permissions import BasePermission, IsAuthenticated, SAFE_METHODS


class IsEmailVerified(BasePermission):
    """
    Allows access only to authenticated users who have verified their institutional email.
    """
    message = "You must verify your institutional email address to access this resource."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.email_verified
        )


class IsCollegeVerified(BasePermission):
    """
    Allows access only to authenticated users whose college identity (student ID card)
    has been verified and approved by the campus administrator.
    """
    message = "Your student identity verification is pending administrator approval."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.email_verified and
            request.user.is_college_verified
        )


class IsAdminUser(BasePermission):
    """
    Allows access only to staff or superuser administrators.
    """
    message = "Access restricted to authorized campus administrators."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_staff or request.user.is_superuser)
        )


class IsVerifiedOrReadOnly(BasePermission):
    """
    Allows read-only access to unverified students, but write actions
    require full college verification.
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_college_verified
        )
