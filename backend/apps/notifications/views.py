from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.notifications.models import Notification
from apps.notifications.serializers import TYPE_GROUPS, NotificationSerializer


class NotificationListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Ixtiyoriy filtrlar: ?is_read=true|false, ?group=contract|payment|system, ?limit=N"""
        notifications = Notification.objects.filter(recipient=request.user)
        is_read = request.query_params.get("is_read")
        if is_read in ("true", "false"):
            notifications = notifications.filter(is_read=is_read == "true")
        group = request.query_params.get("group")
        if group in TYPE_GROUPS:
            notifications = notifications.filter(notification_type__in=TYPE_GROUPS[group])
        limit = request.query_params.get("limit")
        if limit and limit.isdigit():
            notifications = notifications[: int(limit)]
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)

    def patch(self, request):
        Notification.mark_all_as_read(request.user)
        notifications = Notification.objects.filter(recipient=request.user)
        serializer = NotificationSerializer(notifications, many=True)
        return Response({
            "success": True,
        }, status=status.HTTP_200_OK)


class NotificationDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        return get_object_or_404(Notification, pk=pk, recipient=user)

    def get(self, request, pk):
        notification = self.get_object(pk, request.user)
        serializer = NotificationSerializer(notification)
        return Response(serializer.data)

    def patch(self, request, pk):
        notification = self.get_object(pk, request.user)
        serializer = NotificationSerializer(notification, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NotificationUnreadCountAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({"count": count})
