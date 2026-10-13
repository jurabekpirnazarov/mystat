from rest_framework.serializers import ModelSerializer
from apps.services.models import ServiceRequestResponse


class ServiceRequestSerializer(ModelSerializer):
    class Meta:
        model = ServiceRequestResponse
        fields = [
            'id', 'status', 'contract', 'package_item',
            'client_input_text', 'client_file', 'admin_input_text',
            'admin_file'
            ]
        read_only_fields = ['id', 'status', 'admin_input_text', 'admin_file']

    def create(self, validated_data):
        instance = ServiceRequestResponse.objects.create(
            contract=validated_data['contract'],
            package_item=validated_data['package_item'],
            client_input_text=validated_data['client_input_text'],
            client_file=validated_data['client_file'],
        )
        return instance


class ServiceResponseSerializer(ModelSerializer):
    class Meta:
        model = ServiceRequestResponse
        fields = ['id', 'status', 'admin_input_text', 'admin_file']
        read_only_fields = ['id',]


    def update(self, instance, validated_data):
        instance.status = validated_data.get('status', instance.status)
        instance.admin_input_text = validated_data.get('admin_input_text', instance.admin_input_text)
        instance.admin_file = validated_data.get('admin_file', instance.admin_file)
        instance.save()
        return instance
