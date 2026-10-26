"""K-05: hisobot topshirish yordamchisi — korxona o'z STIR'i bo'yicha qaysi hisobotlarni qachon topshiradi.

Topshirilgan/topshirilmagan holati manbasi yo'q (`submitted-report` qattiq yozilgan stub, OS-11),
shuning uchun faqat muddatlar ko'rsatiladi.
"""
from datetime import date

from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.additional_services.models import KtutReportList, ReportGuide, ReportList, ReportReminder
from apps.common.synthetic import synthetic_ids

from apps.additional_services.deadlines import deadlines_for, next_occurrence, previous_occurrence
from apps.additional_services.report_status import deadline_flag, legend, resolve_status, STATUS_LABELS, FLAG_LABELS
from apps.common.text import clean_excel_text


def _period_rows(report, today, reminders):
    """HT-02: majburiyat × davr qatorlari — o'tgan va joriy yil, keyingi yildan faqat eng yaqin bittasi."""
    due_rows = deadlines_for(report, today.year - 1) + deadlines_for(report, today.year)
    future = deadlines_for(report, today.year + 1)
    if future:
        due_rows.append(future[0])
    out = []
    for r in due_rows:
        status = resolve_status(None)  # OS-11: topshirish manbasi yo'q
        flag = deadline_flag(r["due"], today, status)
        out.append({
            "report_id": report.id,
            "type_uz": clean_excel_text(report.type_uz or report.type),
            "formsname_uz": clean_excel_text(report.formsname_uz or report.formsname),
            "report_type": report.report_type,
            "period": r["period"],
            "period_label": r["period_label"],
            "due": r["due"].isoformat(),
            "days_left": (r["due"] - today).days,
            "deadline_source": r["source"],
            "status": status,
            "status_label": STATUS_LABELS[status],
            "flag": flag,
            "flag_label": FLAG_LABELS.get(flag),
            "submitted_at": None,
            "reminded": report.id in reminders,
        })
    return out


def _submit_system():
    """HT-07: rasmiy topshirish tizimi (admin sozlamasi); bo'sh bo'lsa None — blok ko'rinmaydi."""
    from apps.common.models import SiteSettings
    name, url = (SiteSettings.objects.filter(pk=1).values_list("report_submit_system_name", "report_submit_system_url").first()
                 or ("", ""))
    return {"name": name, "url": url} if name and url else None


def _list_as_of(inn):
    """HT-05: KTUT yozuvi oxirgi yangilangan sana (ro'yxat holati)."""
    from apps.additional_services.models import Ktut
    ts = Ktut.objects.filter(inn=inn).values_list("updated_at", flat=True).first()
    return ts.date().isoformat() if ts else None


class MyReportsAPIView(APIView):
    """GET /api/additional-services/my-reports/?year=2026"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        org = getattr(request.user, "organization", None)
        if org is None:
            return Response({"detail": "Korxona profili topilmadi.", "code": "no_organization"}, status=404)
        links = KtutReportList.objects.filter(ktut__inn=org.tin).select_related("reportlist")
        reports = [link.reportlist for link in links if link.reportlist.is_active]
        if not reports:
            return Response({"detail": "Bizning ro'yxatda sizning STIR bo'yicha majburiy hisobot topilmadi. "
                                       "Yangi ro'yxatdan o'tgan bo'lsangiz yoki shubha bo'lsa, hududiy statistika "
                                       "bo'limiga murojaat qiling.",
                             "code": "no_ktut", "list_as_of": _list_as_of(org.tin), "submit_system": _submit_system()},
                            status=404)

        today = date.today()
        try:
            year = int(request.query_params.get("year") or today.year)
        except ValueError:
            year = today.year
        reminders = {r.report_id: r.days_before for r in ReportReminder.objects.filter(user=request.user)}
        guides = set(ReportGuide.objects.filter(report__in=reports).values_list("report_id", flat=True))
        synthetic_links = synthetic_ids(KtutReportList)

        items = []
        rows = []
        for report in sorted(reports, key=lambda r: r.id):
            year_rows = deadlines_for(report, year)
            nxt = next_occurrence(report, today)
            prev = previous_occurrence(report, today)
            items.append({
                "report_id": report.id,
                "type_uz": report.type_uz or report.type,
                "formsname_uz": (report.formsname_uz or report.formsname).strip(),
                "srok_uz": clean_excel_text(report.srok_uz or ""),
                "report_type": report.report_type,
                "next_deadline": nxt.isoformat() if nxt else None,
                "days_left": (nxt - today).days if nxt else None,
                "last_deadline": prev.isoformat() if prev else None,
                "reminded": report.id in reminders,
                "days_before": reminders.get(report.id),
                "has_guide": report.id in guides,
                "year_deadlines": [r["due"].isoformat() for r in year_rows],
            })
            rows.extend(_period_rows(report, today, reminders))
        items.sort(key=lambda i: (i["next_deadline"] or "9999", i["type_uz"]))
        rows.sort(key=lambda r: (r["due"], r["type_uz"]))
        is_synthetic = bool(synthetic_links) and all(str(link.pk) in synthetic_links for link in links)
        return Response({
            "organization": {"name": org.name, "tin": org.tin},
            "year": year,
            "today": today.isoformat(),
            "submission_status_available": False,
            "is_synthetic": is_synthetic,
            "items": items,
            "rows": rows,
            "status_legend": legend(),
            "submit_system": _submit_system(),
            "list_as_of": _list_as_of(org.tin),
        })


def _guide_auto(report):
    """HT-08: yo'riqnomaning avtomatik qismi (real ma'lumotdan): kim topshiradi, davriylik, muddat qoidasi."""
    from apps.additional_services.models import KtutReportList
    links = KtutReportList.objects.filter(reportlist=report)
    nxt = next_occurrence(report, date.today())
    return {
        "organizations_count": links.count(),
        "periodicity": {"monthly": "Oylik", "quarterly": "Choraklik", "yearly": "Yillik"}.get(report.report_type or ""),
        "rule": report.deadline_rule or None,
        "next_deadline": nxt.isoformat() if nxt else None,
        "regulations_path": "/reglaments",
    }


class ReportGuideAPIView(APIView):
    """GET /api/additional-services/report-guide/<report_id>/"""
    permission_classes = [AllowAny]

    def get(self, request, report_id):
        report = ReportList.objects.filter(pk=report_id).first()
        if report is None:
            return Response({"detail": "Hisobot shakli topilmadi."}, status=404)
        guide = ReportGuide.objects.filter(report=report).first()
        auto = _guide_auto(report)
        base = {"auto": auto, "report_id": report.id, "type_uz": report.type_uz, "formsname_uz": report.formsname_uz.strip(),
                "srok_uz": (report.srok_uz or "").replace("_x000D_", " ").strip(), "report_type": report.report_type}
        if guide is None:
            return Response({**base, "guide": None})
        return Response({**base, "guide": {
            "summary": guide.summary_uz,
            "steps": guide.steps_uz,
            "common_errors": guide.common_errors_uz,
            "legal_basis": guide.legal_basis,
            "sample_file": request.build_absolute_uri(guide.sample_file.url) if guide.sample_file else None,
            "is_synthetic": str(guide.pk) in synthetic_ids(ReportGuide),
        }})
