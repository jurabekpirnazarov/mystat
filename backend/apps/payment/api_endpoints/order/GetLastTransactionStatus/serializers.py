from rest_framework import serializers

from apps.payment.models import Transaction


class GetLastTransactionStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ["id", "status"]
