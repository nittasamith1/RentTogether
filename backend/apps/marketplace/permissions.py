from rest_framework.permissions import BasePermission


class IsVerifiedStudent(BasePermission):
    """
    Grants access only to authenticated students whose institutional email
    and college student identity have been fully verified (or campus staff).
    """
    message = "Only verified students belonging to this institution can access the campus marketplace."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated or not user.is_active:
            return False

        if user.is_staff:
            return True

        return bool(user.email_verified and user.is_college_verified and user.college_id)
