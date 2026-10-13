from django.conf import settings
from rest_framework import serializers


from apps.common.models import SiteSettings
from apps.contracts.models import Contract


class ContractSerializer(serializers.ModelSerializer):
    contract_url = serializers.SerializerMethodField(read_only=True)

    def get_contract_url(self, obj):
        settings_obj = SiteSettings.load()
        if obj.didox_contract_data:
            return f"{settings_obj.didox_client_url}/documents/{obj.didox_contract_data.get('_id')}/"
        return None

    class Meta:
        model = Contract
        fields = '__all__'