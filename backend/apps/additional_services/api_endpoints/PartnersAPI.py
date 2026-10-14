"""K-04: hamkor/raqobatchi qidiruvi va U-16/K-04 saqlangan so'rovlar.

Manba: real ma'lumot. KTUT jadvalida faqat STIR va nom bor (OKED, hudud yo'q), shuning uchun hudud, tuman va
faoliyat turi bo'yicha filtrlash sanoat mahsulotlari reyestriga (IndustrialProduct: ~39 ming korxona, manzil,
tuman, OKED'ga mos mahsulot kategoriyasi) tayanadi. Tashkiliy-huquqiy shakl korxona nomidan aniqlanadi.

Rejadagi "o'lcham (xodimlar soni)" filtri qo'shilmadi: korxona bo'yicha real xodimlar soni yo'q, alohida
korxonaga o'ylab topilgan raqam biriktirish esa noto'g'ri ma'lumot tarqatadi (S-10 namunasi faqat anonim guruhlar uchun).

Telefon, PINFL va rahbar ma'lumotlari javobga ham, eksportga ham kirmaydi.
"""
import io
import re

from django.core.cache import cache
from django.db.models import Count, Max, Q
from django.http import HttpResponse
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.additional_services.models import IndustrialProduct, IndustrialProductCategory, SavedQuery
from apps.analytics.geo import ADDRESS_PREFIX, REGION_NAME_UZ
from apps.common.models import Region
from apps.common.search import ci_contains
from apps.services.limits import consume

PAGE_SIZE = 50
EXPORT_LIMIT = 1000
EXPORT_SLUG = "partners-export"
CACHE_SECONDS = 10 * 60

# (kod, nom, nomdagi regex) — tartib muhim: "qo'shma"/"xorijiy" MChJ dan oldin
LEGAL_FORMS = [
    ("XK_FOREIGN", "Xorijiy investitsiyali korxona", r"xorijiy|qo.shma korxona"),
    ("AJ", "Aksiyadorlik jamiyati", r"aksiyadorlik|\mAJ\M"),
    ("MCHJ", "Mas'uliyati cheklangan jamiyat", r"mas.uliyati cheklangan|\mMCHJ\M"),
    ("XK", "Xususiy korxona", r"xususiy korxona"),
    ("OK", "Oilaviy korxona", r"oilaviy korxona"),
    ("FX", "Fermer xo'jaligi", r"fermer"),
    ("DUK", "Davlat unitar korxonasi", r"davlat unitar|unitar korxona"),
    ("YATT", "Yakka tartibdagi tadbirkor", r"yakka tartibdagi|\mYaTT\M"),
]
_PY_FORMS = [(code, name, re.compile(rx.replace(r"\m", r"\b").replace(r"\M", r"\b"), re.I)) for code, name, rx in LEGAL_FORMS]


def legal_form(name):
    for code, label, rx in _PY_FORMS:
        if rx.search(name or ""):
            return {"code": code, "name": label}
    return {"code": "OTHER", "name": "Boshqa"}


def region_by_address(address):
    for code, prefix in ADDRESS_PREFIX.items():
        if (address or "").startswith(prefix):
            return code
    return None


def _descendants(category_id):
    tree = cache.get("partners:category_tree")
    if tree is None:
        tree = {}
        for cid, parent in IndustrialProductCategory.objects.values_list("id", "parent_id"):
            tree.setdefault(parent, []).append(cid)
        cache.set("partners:category_tree", tree, CACHE_SECONDS)
    ids, stack = set(), [category_id]
    while stack:
        cid = stack.pop()
        if cid not in ids:
            ids.add(cid)
            stack.extend(tree.get(cid, []))
    return ids


class SearchParams(serializers.Serializer):
    q = serializers.CharField(required=False, allow_blank=True, max_length=100)
    region = serializers.IntegerField(required=False)
    district = serializers.CharField(required=False, allow_blank=True, max_length=60)
    category = serializers.IntegerField(required=False)
    legal_form = serializers.ChoiceField(required=False, choices=[c for c, _n, _r in LEGAL_FORMS] + ["OTHER"])
    page = serializers.IntegerField(required=False, min_value=1, default=1)


def filtered_products(params):
    qs = IndustrialProduct.objects.exclude(inn__isnull=True).exclude(inn="")
    if params.get("region"):
        region = Region.objects.filter(pk=params["region"]).first()
        prefix = ADDRESS_PREFIX.get(region.code) if region else None
        qs = qs.filter(adress_uz__startswith=prefix) if prefix else qs.none()
    if params.get("district"):
        qs = qs.filter(soato_uz=params["district"])
    if params.get("category"):
        qs = qs.filter(category_id__in=_descendants(params["category"]))
    q = (params.get("q") or "").strip()
    if q:
        qs = qs.filter(Q(inn__startswith=q)) if q.isdigit() else qs.filter(ci_contains(("name",), q))
    form = params.get("legal_form")
    if form == "OTHER":
        for _c, _n, rx in LEGAL_FORMS:
            qs = qs.exclude(name__iregex=rx)
    elif form:
        rx = next(r for c, _n, r in LEGAL_FORMS if c == form)
        qs = qs.filter(name__iregex=rx)
        for c, _n, earlier in LEGAL_FORMS:  # tartib bo'yicha oldingi shakllarga tushganlar chiqariladi
            if c == form:
                break
            qs = qs.exclude(name__iregex=earlier)
    return qs


def companies(params):
    """inn bo'yicha guruhlangan korxonalar (eng ko'p mahsulotlilar birinchi)."""
    rows = (filtered_products(params).values("inn")
            .annotate(name=Max("name"), address=Max("adress_uz"), district=Max("soato_uz"),
                      products=Count("id"), categories=Count("category", distinct=True))
            .order_by("-products", "name"))
    return rows


def _row(r):
    code = region_by_address(r["address"])
    return {"stir": r["inn"], "name": r["name"], "legal_form": legal_form(r["name"]),
            "region": REGION_NAME_UZ.get(code), "region_code": code, "district": r["district"],
            "products": r["products"], "categories": r["categories"]}


def _cache_key(prefix, params):
    return prefix + ":" + ":".join(f"{k}={params.get(k) or ''}" for k in ("q", "region", "district", "category", "legal_form", "page"))


class PartnerSearchAPIView(APIView):
    """GET /api/additional-services/partners/search/?q=&region=&district=&category=&legal_form=&page="""
    permission_classes = [AllowAny]

    def get(self, request):
        params = SearchParams(data=request.query_params)
        params.is_valid(raise_exception=True)
        p = params.validated_data
        key = _cache_key("partners:search", p)
        data = cache.get(key)
        if data is None:
            rows = companies(p)
            total = rows.count()
            start = (p["page"] - 1) * PAGE_SIZE
            data = {"count": total, "page": p["page"], "page_size": PAGE_SIZE,
                    "results": [_row(r) for r in rows[start:start + PAGE_SIZE]]}
            cache.set(key, data, CACHE_SECONDS)
        return Response(data)


class PartnerMapAPIView(APIView):
    """GET partners/map/?... — filtr bo'yicha viloyatlar kesimida korxonalar soni (aniq manzil yo'q)."""
    permission_classes = [AllowAny]

    def get(self, request):
        params = SearchParams(data=request.query_params)
        params.is_valid(raise_exception=True)
        p = {k: v for k, v in params.validated_data.items() if k != "page"}
        key = _cache_key("partners:map", p)
        data = cache.get(key)
        if data is None:
            counts = {}
            for code, prefix in ADDRESS_PREFIX.items():
                counts[code] = filtered_products(p).filter(adress_uz__startswith=prefix).values("inn").distinct().count()
            regions = {r.code: r.id for r in Region.objects.all()}
            data = [{"region_code": c, "region_id": regions.get(c), "region": REGION_NAME_UZ[c], "count": n}
                    for c, n in counts.items()]
            cache.set(key, data, CACHE_SECONDS)
        return Response(data)


class PartnerFiltersAPIView(APIView):
    """GET partners/filters/?region=<id> — viloyatlar, (tanlangan viloyat) tumanlari, kategoriyalar, shakllar."""
    permission_classes = [AllowAny]

    def get(self, request):
        regions = [{"id": r.id, "code": r.code, "name": REGION_NAME_UZ.get(r.code, r.name)}
                   for r in Region.objects.order_by("code") if r.code in ADDRESS_PREFIX]
        districts = []
        region_id = request.query_params.get("region")
        if region_id and region_id.isdigit():
            region = Region.objects.filter(pk=region_id).first()
            prefix = ADDRESS_PREFIX.get(region.code) if region else None
            if prefix:
                districts = sorted(filter(None, IndustrialProduct.objects.filter(adress_uz__startswith=prefix)
                                          .values_list("soato_uz", flat=True).distinct()))
        cats = IndustrialProductCategory.objects.filter(Q(parent__isnull=True) | Q(parent__parent__isnull=True))
        categories = [{"id": c.id, "name": c.name_uz, "parent": c.parent_id} for c in cats.order_by("id")]
        return Response({"regions": regions, "districts": districts, "categories": categories,
                         "legal_forms": [{"code": c, "name": n} for c, n, _ in LEGAL_FORMS] + [{"code": "OTHER", "name": "Boshqa"}]})


class PartnerExportAPIView(APIView):
    """GET partners/export/?... — XLSX, ko'pi bilan 1000 qator; har eksport paket limitidan (slug "partners-export")."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        params = SearchParams(data=request.query_params)
        params.is_valid(raise_exception=True)
        p = params.validated_data
        consume(request.user, EXPORT_SLUG, {k: v for k, v in p.items() if k != "page"})
        from openpyxl import Workbook

        wb = Workbook()
        ws = wb.active
        ws.title = "Korxonalar"
        ws.append(["STIR", "Nomi", "Tashkiliy-huquqiy shakl", "Viloyat", "Tuman", "Mahsulotlar soni", "Mahsulot guruhlari"])
        for r in companies(p)[:EXPORT_LIMIT]:
            row = _row(r)
            ws.append([row["stir"], row["name"], row["legal_form"]["name"], row["region"], row["district"],
                       row["products"], row["categories"]])
        ws.append([])
        ws.append([f"Manba: my.stat.uz, sanoat mahsulotlari reyestri. Ko'pi bilan {EXPORT_LIMIT} qator."])
        buf = io.BytesIO()
        wb.save(buf)
        response = HttpResponse(buf.getvalue(), content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response["Content-Disposition"] = 'attachment; filename="korxonalar.xlsx"'
        return response


class SavedQuerySerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedQuery
        fields = ("id", "kind", "name", "params", "created_at")
        read_only_fields = ("id", "created_at")

    def validate_params(self, value):
        if not isinstance(value, dict) or len(str(value)) > 2000:
            raise serializers.ValidationError("Filtr noto'g'ri yoki juda katta.")
        return value


class SavedQueryListAPIView(APIView):
    """GET/POST /api/additional-services/saved-queries/?kind=trade|partners (faqat o'ziniki)."""
    permission_classes = [IsAuthenticated]
    MAX_PER_KIND = 30

    def get(self, request):
        qs = SavedQuery.objects.filter(user=request.user)
        if request.query_params.get("kind"):
            qs = qs.filter(kind=request.query_params["kind"])
        return Response(SavedQuerySerializer(qs, many=True).data)

    def post(self, request):
        s = SavedQuerySerializer(data=request.data)
        s.is_valid(raise_exception=True)
        if SavedQuery.objects.filter(user=request.user, kind=s.validated_data["kind"]).count() >= self.MAX_PER_KIND:
            return Response({"detail": f"Ko'pi bilan {self.MAX_PER_KIND} ta so'rov saqlash mumkin."}, status=400)
        s.save(user=request.user)
        return Response(s.data, status=status.HTTP_201_CREATED)


class SavedQueryDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        deleted, _ = SavedQuery.objects.filter(user=request.user, pk=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT if deleted else status.HTTP_404_NOT_FOUND)
