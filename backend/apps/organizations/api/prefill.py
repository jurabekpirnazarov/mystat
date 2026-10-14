"""K-01: formalarni avtomatik to'ldirish (ISH_REJASI.md 10.1).

Qoidalar:
- faqat foydalanuvchining **o'z** korxonasi (o'z `Organization` STIR'i) bo'yicha;
- manba ustuvorligi: profil/organization > reyestr (keshdagi) > KTUT > sanoat reyestri > oxirgi buyurtma;
- rahbar PINFL'i va boshqa shaxslarning telefonlari hech qachon qaytarilmaydi;
- paket limiti (`UserServicePackageItemUse`) sarflanmaydi — bu xizmat endpoint'i emas;
- tashqi reyestr faqat "reyestrdan yangilash" tugmasida chaqiriladi (OS-10), 3 s timeout, 24 soat kesh.
"""
import logging

from django.core.cache import cache
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.additional_services.models import IndustrialProduct, Ktut
from apps.book_market.models import OrderBook
from apps.common.text import sector_label

logger = logging.getLogger(__name__)

REGISTRY_TIMEOUT = 3
REGISTRY_CACHE_TTL = 24 * 3600
# Reyestrdan faqat shu maydonlar qabul qilinadi (foydalanuvchi tanlaydi)
REGISTRY_FIELDS = {"name": "org_name", "address": "address"}


def _registry_cache_key(tin):
    return f"prefill:registry:{tin}"


def _registry_lookup(tin, force=False):
    """-> (data|None, fetched_at|None). Xato yoki timeout forma ishini to'xtatmaydi."""
    key = _registry_cache_key(tin)
    cached = cache.get(key)
    if cached and not force:
        return cached["data"], cached["fetched_at"]
    if not force:
        return None, None
    try:
        from apps.services.api.services import RegisterService
        raw = RegisterService(timeout=REGISTRY_TIMEOUT).get_organization_detail(stir_number=int(tin))
    except Exception as exc:  # reyestr o'chiq, timeout, 404 — barchasi "ma'lumot yo'q"
        logger.info("Prefill: reyestr javob bermadi (%s)", type(exc).__name__)
        return None, None
    data = _normalize_registry(raw)
    fetched_at = timezone.now().isoformat()
    cache.set(key, {"data": data, "fetched_at": fetched_at}, REGISTRY_CACHE_TTL)
    return data, fetched_at


def _normalize_registry(raw):
    """Reyestr javobidan faqat ochiq maydonlar: nom va manzil (rahbar PINFL, telefonlar olinmaydi)."""
    if not isinstance(raw, dict):
        return {}
    body = raw.get("data") if isinstance(raw.get("data"), dict) else raw
    name = body.get("name") or body.get("full_name") or body.get("short_name")
    address = body.get("address") or body.get("legal_address")
    if isinstance(address, dict):
        address = address.get("full") or address.get("name")
    return {k: v for k, v in {"org_name": name, "address": address}.items() if isinstance(v, str) and v.strip()}


def build_prefill(user):
    fields = {}

    def put(field, value, source, fetched_at=None):
        if value in (None, "") or field in fields:
            return  # yuqoriroq ustuvorlikdagi manba allaqachon to'ldirgan
        fields[field] = {"field": field, "value": value, "source": source, "fetched_at": fetched_at}

    now = timezone.now().isoformat()
    put("full_name", user.full_name.strip() if user.full_name else None, "profile", now)
    put("phone", user.phone_number, "profile", now)
    put("email", user.email if user.email and not user.email.endswith(".invalid") else None, "profile", now)

    org = getattr(user, "organization", None)
    if org is not None:
        put("org_name", org.name, "organization", now)
        put("tin", org.tin, "organization", now)
        put("address", org.address, "organization", now)
        put("org_phone", org.phone, "organization", now)
        put("org_email", org.email, "organization", now)
        put("organization_type", org.organization_type, "organization", now)
        if org.district_id:
            put("district", org.district.name, "organization", now)
            put("district_id", org.district_id, "organization", now)
            put("region", org.district.region.name, "organization", now)
            put("region_id", org.district.region_id, "organization", now)
        if org.sector_id:
            put("sector", sector_label(org.sector), "organization", now)
            put("sector_id", org.sector_id, "organization", now)

        registry, fetched = _registry_lookup(org.tin)
        for key, value in (registry or {}).items():
            put(key, value, "registry", fetched)

        ktut = Ktut.objects.filter(inn=org.tin).only("name").first()
        if ktut:
            put("org_name", ktut.name, "ktut", now)
        producer = IndustrialProduct.objects.filter(inn=org.tin).only("adress_uz", "soato_uz").first()
        if producer:
            put("address", producer.adress_uz, "industry", now)
            put("district", producer.soato_uz, "industry", now)

    last_order = (OrderBook.objects.filter(user=user, postal_location__isnull=False)
                  .select_related("postal_location").order_by("-id").first())
    if last_order:
        loc = last_order.postal_location
        when = last_order.created_at.isoformat() if last_order.created_at else None
        put("postal_location_id", loc.id, "last_order", when)
        put("postal_location", f"{loc.name} ({loc.index})", "last_order", when)

    return {"has_organization": org is not None, "fields": list(fields.values())}


class PrefillView(APIView):
    """GET /api/organizations/me/prefill/"""
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response(build_prefill(request.user))


class RegistryDiffView(APIView):
    """GET — reyestrdagi qiymatlar bilan farq (eski → yangi); POST {"fields": [...]} — tanlanganlarini qabul qilish."""
    permission_classes = (IsAuthenticated,)

    def _diff(self, org):
        registry, fetched = _registry_lookup(org.tin, force=True)
        current = {"org_name": org.name, "address": org.address}
        diff = [{"field": f, "old": current.get(f), "new": v} for f, v in (registry or {}).items()
                if (current.get(f) or "").strip() != v.strip()]
        return registry, fetched, diff

    def get(self, request):
        org = getattr(request.user, "organization", None)
        if org is None:
            return Response({"detail": "Korxona profili topilmadi."}, status=404)
        registry, fetched, diff = self._diff(org)
        return Response({"available": registry is not None, "fetched_at": fetched, "diff": diff})

    def post(self, request):
        org = getattr(request.user, "organization", None)
        if org is None:
            return Response({"detail": "Korxona profili topilmadi."}, status=404)
        wanted = set(request.data.get("fields") or [])
        registry, _fetched = _registry_lookup(org.tin)  # faqat keshdagi (GET dan keyin) qiymatlar
        if not registry:
            return Response({"detail": "Reyestr ma'lumoti yo'q yoki eskirgan. Qaytadan tekshiring."}, status=409)
        model_field = {v: k for k, v in REGISTRY_FIELDS.items()}
        changed = []
        for field in wanted & set(registry) & set(model_field):
            setattr(org, model_field[field], registry[field])
            changed.append(model_field[field])
        if changed:
            org.save(update_fields=changed)
        return Response({"updated": sorted(changed)})
