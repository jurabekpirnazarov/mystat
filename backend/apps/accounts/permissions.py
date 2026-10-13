from rest_framework import permissions
from rest_framework import exceptions
from rest_framework import status
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken


class BAD_REQUESTException(exceptions.APIException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_code = 'error'

    def __init__(self, detail, status_code=None):
        self.detail = detail
        if status_code is not None:
            self.status_code = status_code


class IsOwnUserOrReadOnly(permissions.BasePermission):
    @staticmethod
    def has_object_permission(request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.id == request.user.id


class IsAuthenticated(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.id is None:
            return False

        user = request.user
        try:
            tokens = OutstandingToken.objects.filter(user=user).order_by('-id')
            if not tokens.exists():
                # If no tokens are found for the user, raise an exception
                raise BAD_REQUESTException({'detail': "No tokens found for this user."})

            # Get the latest token
            token = tokens.first()
            is_blacklisted = BlacklistedToken.objects.filter(token=token).exists()

            # Allow access if the token is not blacklisted
            return not is_blacklisted
        except Exception as e:
            raise BAD_REQUESTException({'detail': str(e)})

        return False


class IsAccountant(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.is_authenticated and request.user.role=='bugalter':
            return True
        return False