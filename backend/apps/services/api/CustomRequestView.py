"""K-06: buyurtma asosida statistik ma'lumot.

Narx faqat backend'da: (asos + ko'rsatkichlar × k + yillar × k + hududlar × k) × shoshilinchlik, BHM × SiteSettings.bhm_value.
Onlayn to'lov qo'shilmaydi: xodim narxni tasdiqlaydi, keyin mavjud oqim (shartnoma/paket, bank o'tkazmasi).
Xodim interfeysi: role employee/manager/admin yoki is_staff.
"""
from decimal import ROUND_HALF_UP, Decimal

from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.models import Region, SiteSettings
from apps.common.synthetic import SyntheticFlagField
from apps.notifications.models import Notification
from apps.services.models import CustomDataRequest, CustomRequestTariff

STAFF_ROLES = ("employee", "manager", "admin")
MAX_YEARS = 30
INDICATORS = {
    "trade": ["Eksport hajmi", "Import hajmi", "Tovar tuzilmasi (HS)", "Hamkor davlatlar", "O'rtacha narxlar"],
    "enterprise": ["Korxonalar soni", "Yangi ochilganlar", "Faoliyati to'xtatilganlar", "Tarmoq tuzilmasi", "Mulkchilik shakli"],
    "industry": ["Ishlab chiqarish hajmi", "Mahsulot turlari", "Indekslar", "Ishlab chiqaruvchilar soni"],
    "demography": ["Aholi soni", "Tug'ilish", "O'lim", "Migratsiya", "Yosh-jins tarkibi"],
    "prices": ["ISN (CPI)", "Ishlab chiqaruvchilar narxi indeksi", "Mahsulot narxlari"],
    "other": ["Boshqa (izohda yozing)"],
}


def is_staff_user(user):
    return bool(user.is_staff or getattr(user, "role", None) in STAFF_ROLES)


def quote(tariff, indicators, year_from, year_to, regions, urgent):
    years = year_to - year_from + 1
    bhm = (tariff.base_bhm + tariff.per_indicator_bhm * len(indicators) + tariff.per_year_bhm * years
           + tariff.per_region_bhm * max(1, len(regions)))
    if urgent:
        bhm *= Decimal(str(tariff.urgency_multiplier))
    bhm = bhm.quantize(Decimal("0.01"), ROUND_HALF_UP)
    settings_obj = SiteSettings.load()
    bhm_value = Decimal(settings_obj.bhm_value or 0) if settings_obj else Decimal(0)
    return {"price_bhm": bhm, "bhm_value": bhm_value, "price_sum": (bhm * bhm_value).quantize(Decimal("0.01"))}


def _notify(user, title, message, obj):
    Notification.objects.create(recipient=user, title=title, message=message, notification_type="info",
                                content_type=ContentType.objects.get_for_model(obj), object_id=obj.pk,
                                extra_data={"custom_request_id": obj.pk})


class SpecSerializer(serializers.Serializer):
    data_type = serializers.ChoiceField(choices=[c for c, _ in CustomRequestTariff.DATA_TYPES])
    indicators = serializers.ListField(child=serializers.CharField(max_length=120), min_length=1, max_length=20)
    year_from = serializers.IntegerField(min_value=1991, max_value=2100)
    year_to = serializers.IntegerField(min_value=1991, max_value=2100)
    regions = serializers.ListField(child=serializers.IntegerField(), required=False, default=list, max_length=14)
    output_format = serializers.ChoiceField(choices=["xlsx", "pdf"], default="xlsx")
    urgent = serializers.BooleanField(default=False)
    comment = serializers.CharField(required=False, allow_blank=True, max_length=2000)

    def validate(self, attrs):
        if attrs["year_to"] < attrs["year_from"]:
            raise serializers.ValidationError({"year_to": "Oxirgi yil boshlang'ichdan kichik."})
        if attrs["year_to"] - attrs["year_from"] + 1 > MAX_YEARS:
            raise serializers.ValidationError({"year_to": f"Ko'pi bilan {MAX_YEARS} yil."})
        known = set(Region.objects.filter(pk__in=attrs.get("regions") or []).values_list("pk", flat=True))
        if set(attrs.get("regions") or []) - known:
            raise serializers.ValidationError({"regions": "Noma'lum hudud."})
        tariff = CustomRequestTariff.objects.filter(data_type=attrs["data_type"]).first()
        if tariff is None:
            raise serializers.ValidationError({"data_type": "Bu ma'lumot turi uchun tarif hali belgilanmagan."})
        attrs["tariff"] = tariff
        return attrs


class CustomRequestSerializer(serializers.ModelSerializer):
    data_type_label = serializers.CharField(source="get_data_type_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    region_names = serializers.SerializerMethodField()
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    assigned_to_name = serializers.CharField(source="assigned_to.full_name", read_only=True, default=None)
    is_synthetic = SyntheticFlagField()

    class Meta:
        model = CustomDataRequest
        fields = ("id", "data_type", "data_type_label", "indicators", "year_from", "year_to", "regions", "region_names",
                  "output_format", "urgent", "comment", "price_bhm", "price_sum", "approved_price_sum", "status",
                  "status_label", "staff_comment", "result_file", "user_name", "assigned_to_name", "created_at",
                  "updated_at", "is_synthetic")

    def get_region_names(self, obj):
        if not obj.regions:
            return ["Respublika bo'yicha"]
        return list(Region.objects.filter(pk__in=obj.regions).values_list("name", flat=True))


class CustomRequestOptionsView(APIView):
    """GET — ma'lumot turlari, ko'rsatkichlar, hududlar, tariflar mavjudligi."""
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        tariffs = set(CustomRequestTariff.objects.values_list("data_type", flat=True))
        return Response({
            "data_types": [{"code": c, "name": str(n), "indicators": INDICATORS[c], "available": c in tariffs}
                           for c, n in CustomRequestTariff.DATA_TYPES],
            "regions": [{"id": r.id, "name": r.name} for r in Region.objects.order_by("code")],
            "max_years": MAX_YEARS,
            "is_staff": is_staff_user(request.user),
        })


class CustomRequestQuoteView(APIView):
    """POST — narx (bazaga yozmaydi)."""
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        s = SpecSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        q = quote(d["tariff"], d["indicators"], d["year_from"], d["year_to"], d.get("regions") or [], d["urgent"])
        return Response({k: str(v) for k, v in q.items()})


class CustomRequestListView(APIView):
    """GET — o'z buyurtmalari (xodim uchun hammasi, ?mine=1 — o'ziga biriktirilganlar); POST — yangi buyurtma."""
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        qs = CustomDataRequest.objects.select_related("user", "assigned_to")
        if is_staff_user(request.user) and request.query_params.get("scope") == "staff":
            if request.query_params.get("mine"):
                qs = qs.filter(Q(assigned_to=request.user) | Q(assigned_to__isnull=True))
        else:
            qs = qs.filter(user=request.user)
        if request.query_params.get("status"):
            qs = qs.filter(status=request.query_params["status"])
        return Response(CustomRequestSerializer(qs[:200], many=True, context={"request": request}).data)

    def post(self, request):
        s = SpecSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        q = quote(d["tariff"], d["indicators"], d["year_from"], d["year_to"], d.get("regions") or [], d["urgent"])
        # Mas'ul xodim: mijozning oxirgi shartnomasiga biriktirilgan xodim (bo'lmasa — admin taqsimlaydi)
        from apps.contracts.models import Contract
        contract = Contract.objects.filter(user=request.user, attached_user__isnull=False).order_by("-id").first()
        obj = CustomDataRequest.objects.create(
            user=request.user, data_type=d["data_type"], indicators=d["indicators"], year_from=d["year_from"],
            year_to=d["year_to"], regions=d.get("regions") or [], output_format=d["output_format"], urgent=d["urgent"],
            comment=d.get("comment", ""), price_bhm=q["price_bhm"], price_sum=q["price_sum"],
            assigned_to=contract.attached_user if contract else None)
        if obj.assigned_to:
            _notify(obj.assigned_to, "Yangi individual ma'lumot buyurtmasi",
                    f"#{obj.pk}: {obj.get_data_type_display()}, {obj.year_from}–{obj.year_to}.", obj)
        return Response(CustomRequestSerializer(obj, context={"request": request}).data, status=status.HTTP_201_CREATED)


class StaffUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[c for c, _ in CustomDataRequest.STATUSES], required=False)
    approved_price_sum = serializers.DecimalField(max_digits=14, decimal_places=2, required=False, min_value=Decimal("0"))
    staff_comment = serializers.CharField(required=False, allow_blank=True, max_length=2000)
    result_file = serializers.FileField(required=False)


class CustomRequestDetailView(APIView):
    """GET — mijoz o'ziniki, xodim hammasini; PATCH — faqat xodim (narx, holat, natija fayli); DELETE — mijoz bekor qiladi."""
    permission_classes = (IsAuthenticated,)

    def _get(self, request, pk):
        qs = CustomDataRequest.objects.all() if is_staff_user(request.user) else CustomDataRequest.objects.filter(user=request.user)
        return get_object_or_404(qs, pk=pk)

    def get(self, request, pk):
        return Response(CustomRequestSerializer(self._get(request, pk), context={"request": request}).data)

    def patch(self, request, pk):
        if not is_staff_user(request.user):
            return Response({"detail": "Faqat xodim o'zgartira oladi."}, status=status.HTTP_403_FORBIDDEN)
        obj = self._get(request, pk)
        s = StaffUpdateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        before = obj.status
        for field in ("approved_price_sum", "staff_comment", "result_file"):
            if field in d:
                setattr(obj, field, d[field])
        if "approved_price_sum" in d and "status" not in d and obj.status == "created":
            obj.status = "priced"
        if "result_file" in d and "status" not in d:
            obj.status = "completed"
        if "status" in d:
            obj.status = d["status"]
        if obj.assigned_to_id is None:
            obj.assigned_to = request.user
        obj.save()
        if obj.status != before:
            _notify(obj.user, "Buyurtma holati o'zgardi", f"#{obj.pk}: {obj.get_status_display()}.", obj)
        return Response(CustomRequestSerializer(obj, context={"request": request}).data)

    def delete(self, request, pk):
        obj = get_object_or_404(CustomDataRequest, pk=pk, user=request.user)
        if obj.status not in ("created", "priced"):
            return Response({"detail": "Bajarilayotgan buyurtmani bekor qilib bo'lmaydi."}, status=400)
        obj.status = "cancelled"
        obj.save(update_fields=["status", "updated_at"])
        return Response(CustomRequestSerializer(obj, context={"request": request}).data)
