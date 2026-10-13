from rest_framework import serializers

from apps.common.synthetic import SyntheticFlagField

from .models import Notification

# UI'dagi filtr guruhlari (U-03)
TYPE_GROUPS = {
    "contract": ("contract_created", "contract_signed", "document_pending", "document_rejected"),
    "payment": ("payment_received",),
    "system": ("info", "success", "warning", "error"),
}


class NotificationSerializer(serializers.ModelSerializer):
    is_synthetic = SyntheticFlagField()
    group = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'is_read', 'created_at', 'notification_type', 'group', 'is_synthetic']
        read_only_fields = ['id', 'title', 'message', 'created_at', 'notification_type']

    def get_group(self, obj):
        for group, types in TYPE_GROUPS.items():
            if obj.notification_type in types:
                return group
        return "system"

    def update(self, instance, validated_data):
        instance.is_read = True
        instance.save(update_fields=['is_read'])
        return instance
