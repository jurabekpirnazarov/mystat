from rest_framework import serializers
from apps.common.models import Branch, QuestionAnswer, Contact, Region, District, Byulleten, AboutPortal
from .models import InformationModel


class QuestionAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionAnswer
        fields = ['id', 'question_uz', 'question_ru', 'question_cry', 'answer_uz', 'answer_ru', 'answer_cry']


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['id', 'name', 'region', 'inn', 'address']


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ['name', 'surname', 'phone_number', 'email', 'text']


class InformationSerializer(serializers.ModelSerializer):
    district_name = serializers.CharField(source='district.name', read_only=True)

    class Meta:
        model = InformationModel
        fields = [
            'id',
            'district',
            'district_name',
            'is_main',
            'file',
        ]


class ByulletenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Byulleten
        fields = ['id', 'name_uz', 'name_ru', 'name_cyr']


# class MyByulletenSerializer(serializers.ModelSerializer):
#     file_url = serializers.SerializerMethodField()
#
#     class Meta:
#         model = Byulleten
#         fields = ['id', 'name', "file_url"]
#
#     def get_file_url(self, obj):
#         request = self.context.get("request")
#         if obj.file and request:
#             return request.build_absolute_uri(obj.file.url)
#         return None



class AboutPortalSerializer(serializers.ModelSerializer):
    class Meta:
        model = AboutPortal
        fields = ['id', 'video_rolik', 'pdf_file', 'consulting_file']
