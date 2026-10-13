"""Demographics API endpointlari.
3 ta endpoint: schema (barcha sectionlar), data (filterlangan ma'lumot), options (qidiruv)."""
from __future__ import annotations

import io
from datetime import datetime

import pandas as pd
from django.http import HttpResponse
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.additional_services.models import DemographicSection
from . import writer


class DemographicsSchemaView(APIView):
    """GET /api/additional-services/demographics/schema/
    Frontend bir marta yuklab oladigan to'liq schema — barcha aktiv sectionlar va ularning filterlari."""
    permission_classes = (AllowAny,)

    def get(self, request):
        sections = []
        qs = DemographicSection.objects.filter(is_active=True, is_published=True).order_by("order", "name")
        for s in qs:
            schema = s.filter_schema or {}
            sections.append({
                "slug": s.slug,
                "name": s.name,
                "description": s.description,
                "icon": s.icon,
                "row_count": s.row_count,
                "value_column": schema.get("value_column", {}),
                "filters": schema.get("filters", []),
            })
        return Response({
            "sections": sections,
        })


class DemographicsDataView(APIView):
    """POST /api/additional-services/demographics/<slug>/data/
    Body: {
      "filters": {"year": [2020, 2024], "region": ["Toshkent shahri"], ...},
      "group_by": ["year"],   // ixtiyoriy
      "limit": 1000
    }"""
    permission_classes = (AllowAny,)

    def post(self, request, slug):
        try:
            section = DemographicSection.objects.get(slug=slug, is_active=True, is_published=True)
        except DemographicSection.DoesNotExist:
            return Response({"detail": "Section topilmadi"}, status=404)

        df = writer.read_section_df(slug)
        if df.empty:
            return Response({"total": 0, "count": 0, "rows": []})

        schema = section.filter_schema or {}
        payload = request.data or {}
        filters = payload.get("filters") or {}
        group_by = payload.get("group_by") or []
        limit = int(payload.get("limit") or 1000)
        limit = max(1, min(limit, 10000))

        df = writer.apply_filters(df, schema, filters)

        value_col = (schema.get("value_column") or {}).get("name") or ""
        total = int(df[value_col].sum()) if value_col and value_col in df.columns else 0

        if group_by:
            df = writer.group_and_aggregate(df, value_col, group_by)

        # Sort by value desc (agar value col bor bo'lsa)
        if value_col in df.columns:
            df = df.sort_values(by=value_col, ascending=False, na_position="last")

        rows = df.head(limit).where(pd.notna(df.head(limit)), None).to_dict("records")
        return Response({
            "total": total,
            "count": int(len(df)),
            "returned": len(rows),
            "rows": rows,
            "value_column": value_col,
        })


class DemographicsExportView(APIView):
    """POST /api/additional-services/demographics/<slug>/export/
    Filterlangan ma'lumotni Excel fayl sifatida qaytaradi.
    Body — DemographicsDataView bilan bir xil format.
    Bu eng qiymatli qism — bu yerda to'lov o'tkazilishi kerak (hozircha yo'q)."""
    permission_classes = (AllowAny,)

    def post(self, request, slug):
        try:
            section = DemographicSection.objects.get(slug=slug, is_active=True, is_published=True)
        except DemographicSection.DoesNotExist:
            return Response({"detail": "Section topilmadi"}, status=404)

        df = writer.read_section_df(slug)
        if df.empty:
            return Response({"detail": "Ma'lumot yo'q"}, status=404)

        schema = section.filter_schema or {}
        payload = request.data or {}
        filters = payload.get("filters") or {}
        df = writer.apply_filters(df, schema, filters)

        # Frontend uchun label'larga mos ustun nomlari qo'yamiz
        label_map = {f["column"]: f.get("label", f["column"]) for f in schema.get("filters", [])}
        value_col_info = schema.get("value_column") or {}
        if value_col_info.get("name"):
            label_map[value_col_info["name"]] = value_col_info.get("label") or value_col_info["name"]

        out_df = df.rename(columns=label_map)

        # Excel buffer'ga yozish
        buf = io.BytesIO()
        with pd.ExcelWriter(buf, engine="openpyxl") as xw:
            sheet_name = (section.name or slug)[:31]  # Excel sheet name limit
            out_df.to_excel(xw, index=False, sheet_name=sheet_name)
        buf.seek(0)

        date_str = datetime.now().strftime("%Y-%m-%d")
        filename = f"demografik_{slug}_{date_str}.xlsx"

        response = HttpResponse(
            buf.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class DemographicsOptionsView(APIView):
    """GET /api/additional-services/demographics/<slug>/options/?column=region&q=tosh
    Searchable filter dropdownlar uchun — birinchi 50 ta mos opsiya."""
    permission_classes = (AllowAny,)

    def get(self, request, slug):
        try:
            section = DemographicSection.objects.get(slug=slug, is_active=True, is_published=True)
        except DemographicSection.DoesNotExist:
            return Response({"detail": "Section topilmadi"}, status=404)

        column = request.query_params.get("column", "")
        q = request.query_params.get("q", "").strip().lower()
        if not column:
            return Response({"options": []})

        schema = section.filter_schema or {}
        # Avval schema'dagi options'dan qidiramiz (tez)
        for f in schema.get("filters", []):
            if f.get("column") == column:
                opts = f.get("options") or []
                if q:
                    opts = [o for o in opts if q in str(o).lower()]
                return Response({"options": opts[:50]})

        return Response({"options": []})
