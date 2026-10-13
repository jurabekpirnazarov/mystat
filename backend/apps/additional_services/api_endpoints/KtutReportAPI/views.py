from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.utils import timezone
from django.db.models import Q

from apps.additional_services.models import Ktut, ReportList
from apps.additional_services.api_endpoints.KtutReportAPI.serializers import ReportListSerializer, KtutSerializer


class KtutReportListAPIView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, stir_number: int):
        if len(str(stir_number)) != 9:
            return Response({"detail": "Noto'g'ri STIR raqami"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            ktut = Ktut.objects.get(inn=stir_number)
        except Ktut.DoesNotExist:
            return Response({"detail": "Ushbu STIR raqamiga ega korxona topilmadi"}, status=status.HTTP_404_NOT_FOUND)

        ktut_reports = ktut.reportlists.all()
        reports = ktut_reports.values_list('reportlist_id', flat=True)
        ktut_reports = ReportList.objects.filter(id__in=reports, is_active=True).order_by('deadline')
        serializer = ReportListSerializer(ktut_reports, many=True)

        data = {
            "org_name": ktut.name,
            "data": serializer.data
        }
        return Response(data=data, status=status.HTTP_200_OK)


class KtutDetailAPIView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, stir_number: int):
        if len(str(stir_number)) != 9:
            return Response({"detail": "Noto'g'ri STIR raqami"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            ktut = Ktut.objects.get(inn=stir_number)

        except Ktut.DoesNotExist:
            return Response({"detail": "Ushbu STIR raqamiga ega korxona topilmadi"}, status=status.HTTP_404_NOT_FOUND)

        serializer = KtutSerializer(ktut)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

class ReportListAPIView(APIView):

    def get(self, request):
        now = timezone.now()
        year = int(request.query_params.get('year', now.year))
        month = int(request.query_params.get('month', now.month))
        day = request.query_params.get('day')

        period = ["monthly"]
        if month in [3, 6, 9, 12]:
                period.append("quarterly")
        
        reports = ReportList.objects.filter(
            Q(is_active=True,
            deadline__year=year,
            deadline__month=month,
            report_type="yearly") |
            Q(report_type__in=period)
        )
        
        month_count = reports.count()
        has_reports_days = list(
            reports.values_list('deadline__day', flat=True).distinct().order_by('deadline__day')
        )
        
        if day:
            day = int(day)
            reports = reports.filter(deadline__day=day)
        
        reports = reports.order_by('deadline')
        
        serializer = ReportListSerializer(reports, many=True)
        
        return Response({
            "data": serializer.data,
            "meta": {
                "month_count": month_count,   
                "has_reports_days": has_reports_days
            }
        }, status=status.HTTP_200_OK)