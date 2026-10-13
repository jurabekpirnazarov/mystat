from rest_framework import serializers


class ClickCompleteSerializer(serializers.Serializer):
    click_trans_id = serializers.IntegerField()
    service_id = serializers.IntegerField()
    click_paydoc_id = serializers.IntegerField()
    merchant_trans_id = serializers.CharField()
    merchant_prepare_id = serializers.IntegerField()
    amount = serializers.FloatField()
    action = serializers.IntegerField()
    error = serializers.IntegerField()
    error_note = serializers.CharField()
    sign_time = serializers.CharField()
    sign_string = serializers.CharField()
