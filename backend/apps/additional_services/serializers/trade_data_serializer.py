from rest_framework import serializers

class ExcelUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    year = serializers.IntegerField()
    format = serializers.ChoiceField(choices=[("excel", "Excel"), ("csv", "CSV")])
    mode = serializers.ChoiceField(choices=[("replace", "Almashtirish"), ("fill", "Faqat yo'q davrlarni to'ldirish")], default="replace")
