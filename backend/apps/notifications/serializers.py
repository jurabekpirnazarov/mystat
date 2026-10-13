from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'title', 'message', 'created_at']

    def update(self, instance, validated_data):
        instance.is_read = True
        instance.save(update_fields=['is_read'])
        return instance