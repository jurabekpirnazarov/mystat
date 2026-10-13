from rest_framework.serializers import ModelSerializer
from rest_framework import serializers

from apps.common.synthetic import SyntheticFlagField
from apps.services.models import ServiceRequestResponse


class ServiceRequestSerializer(ModelSerializer):
    is_synthetic = SyntheticFlagField()
    package_item_name = serializers.CharField(source="package_item.name_uz", read_only=True)
    contract_number = serializers.CharField(source="contract.contract_number", read_only=True)

    class Meta:
        model = ServiceRequestResponse
        fields = [
            'id', 'status', 'contract', 'package_item',
            'client_input_text', 'client_file', 'admin_input_text',
            'admin_file', 'created_at', 'updated_at',
            'package_item_name', 'contract_number', 'is_synthetic',
            ]
        read_only_fields = ['id', 'status', 'admin_input_text', 'admin_file', 'created_at', 'updated_at']

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
