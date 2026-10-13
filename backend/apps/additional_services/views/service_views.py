from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.additional_services.serializers.service_serializers import SubmittedReportSerializer


class SubmittedReportAPIView(APIView):
    def get(self, request):
        serializer = SubmittedReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = [
            {
                "tax": {
                    "physical": 2400,
                    "legal": 1800,
                    "all": 4200
                },
                "business": {
                    "physical": 800,
                    "legal": 2200,
                    "all": 3000
                },
                "report": {
                    "physical": 600,
                    "legal": 1900,
                    "all": 2500
                },
                "consult": {
                    "physical": 400,
                    "legal": 1200,
                    "all": 1600
                },
                "audition": {
                    "physical": 200,
                    "legal": 1000,
                    "all": 1200
                }
            }
        ]
        return Response(data, status=status.HTTP_200_OK)
