from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.utils import timezone
from datetime import date

from apps.additional_services.deadlines import occurrences_in_month, next_occurrence, shift_enabled
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
        today = timezone.localdate()
        ktut_reports = sorted(ReportList.objects.filter(id__in=reports, is_active=True),
                              key=lambda r: (next_occurrence(r, today) or date.max, r.id))
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

        # HT-01: oy ichidagi muddatlar yagona servisdan
        rows = []
        shift = shift_enabled()
        for report in ReportList.objects.filter(is_active=True).prefetch_related("deadline_overrides"):
            for due in occurrences_in_month(report, year, month, shift=shift):
                rows.append((due, report))
        month_count = len(rows)
        has_reports_days = sorted({due.day for due, _ in rows})
        if day:
            rows = [(due, r) for due, r in rows if due.day == int(day)]
        rows.sort(key=lambda x: (x[0], x[1].id))
        reports = [r for _, r in rows]

        serializer = ReportListSerializer(reports, many=True)
        
        return Response({
            "data": serializer.data,
            "meta": {
                "month_count": month_count,   
                "has_reports_days": has_reports_days
            }
        }, status=status.HTTP_200_OK)