from rest_framework.permissions import BasePermission


class CanManageFarmerProfile(BasePermission):
    message = "You do not have permission to access this farmer profile."

    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_staff:
            return True
        return getattr(request.user, "id", None) == getattr(obj, "user_id", None)
