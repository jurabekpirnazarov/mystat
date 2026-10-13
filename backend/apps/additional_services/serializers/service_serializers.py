from rest_framework import serializers


class SubmittedReportSerializer(serializers.Serializer):
    stir_number = serializers.CharField()

    def validate_stir_number(self, value):
        if not len(value) != 9 or not str(value).isdigit():
            raise serializers.ValidationError("Invalid stir number")
