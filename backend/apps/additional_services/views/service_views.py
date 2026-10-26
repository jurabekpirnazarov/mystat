from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.additional_services.serializers.service_serializers import SubmittedReportSerializer


class SubmittedReportAPIView(APIView):
    """HT-04: faqat kirgan foydalanuvchi va faqat o'z tashkiloti STIR'i uchun; begona STIR — 404.

    Javob hozircha qattiq yozilgan namuna (haqiqiy topshirish manbasi yo'q, OS-11). Agregat intizom
    ko'rsatkichi (`/check`, scoring) bu endpoint'dan emas, ichki servisdan olinadi.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = SubmittedReportSerializer(data=request.query_params or request.data)
        serializer.is_valid(raise_exception=True)
        org = getattr(request.user, "organization", None)
        if org is None or str(org.tin) != serializer.validated_data["stir_number"]:
            return Response({"detail": "Topilmadi."}, status=status.HTTP_404_NOT_FOUND)
        data = [
            {
                "tax": {"physical": 2400, "legal": 1800, "all": 4200},
                "business": {"physical": 800, "legal": 2200, "all": 3000},
                "report": {"physical": 600, "legal": 1900, "all": 2500},
                "consult": {"physical": 400, "legal": 1200, "all": 1600},
                "audition": {"physical": 200, "legal": 1000, "all": 1200},
            }
        ]
        return Response(data, status=status.HTTP_200_OK)
