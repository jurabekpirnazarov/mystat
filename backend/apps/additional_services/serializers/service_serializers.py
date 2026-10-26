from rest_framework import serializers


class SubmittedReportSerializer(serializers.Serializer):
    stir_number = serializers.CharField()

    def validate_stir_number(self, value):
        value = str(value).strip()
        if len(value) != 9 or not value.isdigit():
            raise serializers.ValidationError("Invalid stir number")
        return value
