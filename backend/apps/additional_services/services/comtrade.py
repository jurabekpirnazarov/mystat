"""UN Comtrade+ mijozi va O'zbekiston ma'lumotini bazaga yuklash (idempotent: qayta yuklash dublikat yaratmaydi).

- Kalit bor (`COMTRADE_API_KEY`): `/data/v1/get` — butun HS6 × hamkor ma'lumoti, so'rovga 100 000 qatorgacha.
- Kalit yo'q: ochiq `/public/v1/preview` — so'rovga 500 qatorgacha, shuning uchun faqat aniq HS kodlar bilan (bittadan so'rov).
Faqat jami qatorlar olinadi: transport turi 0, ikkinchi hamkor 0, bojxona C00 (aks holda bir yozuv takrorlanadi).
"""
import logging
import time
from datetime import date
from decimal import Decimal

import requests
from django.conf import settings
from django.utils import timezone

from apps.additional_services.models.comtrade import UZ_CODE, ComtradeFlow, ComtradeSyncLog
from apps.additional_services.models.ex_trade import Country, Product

log = logging.getLogger(__name__)

BASE = "https://comtradeapi.un.org"
PREVIEW_LIMIT = 500
KEY_HS_CHUNK = 20        # kalit bilan bir so'rovga nechta HS kodi
BATCH = 2000
# Comtrade ba'zi davlatlarga ISO raqamidan farqli kod beradi (savdo kodi -> ISO 3166 raqami)
ISO_ALIAS = {251: 250, 381: 380, 579: 578, 699: 356, 757: 756, 842: 840}
UNIQUE = ["period_type", "year", "month", "reporter_code", "partner_code", "flow", "cmd_code"]
UPDATE = ["partner", "product", "value_usd", "net_weight_kg", "qty", "qty_unit_code", "source"]


class ComtradeError(Exception):
    pass


def _key():
    return settings.COMTRADE_API_KEY or ""


def fetch(freq, period, flow, reporter=UZ_CODE, partner=None, cmd="AG6", session=None, retries=3):
    """Bitta so'rov. -> (qatorlar ro'yxati, kesilgan_mi). Xato bo'lsa ComtradeError."""
    key = _key()
    params = {"reporterCode": reporter, "period": period, "flowCode": flow, "cmdCode": cmd,
              "motCode": 0, "partner2Code": 0, "customsCode": "C00", "includeDesc": "false"}
    if partner is not None:
        params["partnerCode"] = partner
    path = f"/data/v1/get/C/{freq}/HS" if key else f"/public/v1/preview/C/{freq}/HS"
    headers = {"Ocp-Apim-Subscription-Key": key} if key else {}
    sess = session or requests
    last = ""
    for attempt in range(retries):
        try:
            r = sess.get(BASE + path, params=params, headers=headers, timeout=60)
        except requests.RequestException as exc:
            last = str(exc)
        else:
            if r.status_code == 200:
                data = (r.json() or {}).get("data") or []
                return data, (not key and len(data) >= PREVIEW_LIMIT)
            last = f"HTTP {r.status_code}: {r.text[:200]}"
            if r.status_code in (401, 403):
                raise ComtradeError(f"Ruxsat yo'q ({last}). COMTRADE_API_KEY ni tekshiring.")
            if r.status_code == 429:
                time.sleep(max(float(r.headers.get("Retry-After", 0) or 0), 20 * (attempt + 1)))
                continue
            if 400 <= r.status_code < 500:
                raise ComtradeError(last)
        time.sleep(3 * (attempt + 1))
    raise ComtradeError(f"So'rov bajarilmadi: {last}")


def parse(rows, source):
    """API qatorlarini model maydonlariga o'giradi; takroriy kesimlar (transport, ikkinchi hamkor, bojxona) tashlanadi."""
    out = []
    for r in rows:
        if r.get("motCode") not in (0, None) or r.get("partner2Code") not in (0, None) or (r.get("customsCode") or "C00") != "C00":
            continue
        freq, year = r.get("freqCode") or "A", r.get("refYear")
        month = r.get("refMonth") or 0
        out.append({
            "period_type": freq, "year": int(year), "month": int(month) if freq == "M" and month and month <= 12 else 0,
            "flow": r["flowCode"], "reporter_code": int(r["reporterCode"]), "partner_code": int(r["partnerCode"]),
            "cmd_code": str(r["cmdCode"]), "value_usd": _dec(r.get("primaryValue")), "net_weight_kg": _dec(r.get("netWgt")),
            "qty": _dec(r.get("qty")), "qty_unit_code": r.get("qtyUnitCode"), "source": source,
        })
    return out


def _dec(v):
    return None if v is None else Decimal(str(v))


def save(parsed):
    """Qatorlarni FK'lar (davlat ISO raqami, HS6) bilan bog'lab upsert qiladi. -> saqlangan qatorlar soni."""
    if not parsed:
        return 0
    countries = {c: i for c, i in Country.objects.exclude(ctrana__isnull=True).values_list("ctrana", "id")}
    products = {c: i for c, i in Product.objects.filter(code__in={p["cmd_code"] for p in parsed if len(p["cmd_code"]) == 6})
                .values_list("code", "id")}
    objs = [ComtradeFlow(partner_id=countries.get(f"{ISO_ALIAS.get(p['partner_code'], p['partner_code']):03d}") if p["partner_code"] else None,
                         product_id=products.get(p["cmd_code"]), **p) for p in parsed]
    for i in range(0, len(objs), BATCH):
        ComtradeFlow.objects.bulk_create(objs[i:i + BATCH], update_conflicts=True, unique_fields=UNIQUE, update_fields=UPDATE + ["fetched_at"])
    return len(objs)


def default_years(today=None):
    y = (today or date.today()).year
    return [y - 3, y - 2, y - 1, y]


def sync(years=None, flows=("X", "M"), freq="A", months=None, hs=None, session=None, log_obj=None):
    """O'zbekiston (860) ma'lumotini yuklaydi. `hs` — aniq HS kodlari (kalitsiz majburiy).
    -> ComtradeSyncLog."""
    years = list(years or default_years())
    key = bool(_key())
    hs = [h.strip() for h in (hs or []) if h.strip()]
    if not key and not hs:
        raise ComtradeError("Kalit yo'q: ochiq API faqat aniq HS kodlar bilan ishlaydi (masalan --hs 1701). To'liq yuklash uchun COMTRADE_API_KEY kerak.")
    entry = log_obj or ComtradeSyncLog.objects.create(params={"years": years, "flows": list(flows), "freq": freq, "hs": hs, "key": key})
    sess = session or requests.Session()
    periods = [str(y) for y in years] if freq == "A" else [f"{y}{m:02d}" for y in years for m in (months or range(1, 13))]
    cmds = ([",".join(hs[i:i + KEY_HS_CHUNK]) for i in range(0, len(hs), KEY_HS_CHUNK)] if key and hs
            else hs if hs else ["AG6"])
    source = "api" if key else "preview"
    failed = []
    for period in periods:
        for flow in flows:
            for cmd in cmds:
                try:
                    rows, truncated = fetch(freq, period, flow, cmd=cmd, session=sess)
                    entry.calls += 1
                    entry.rows += save(parse(rows, source))
                    if truncated:
                        failed.append(f"{period} {flow} {cmd}: 500 qatorga kesildi (kalit kerak)")
                except ComtradeError as exc:
                    entry.calls += 1
                    failed.append(f"{period} {flow} {cmd}: {exc}")
                    if "Ruxsat yo'q" in str(exc):
                        break
                entry.save(update_fields=["calls", "rows"])
                time.sleep(settings.COMTRADE_PAUSE)
    entry.finished_at = timezone.now()
    entry.error = "\n".join(failed)[:4000]
    entry.status = "failed" if failed and not entry.rows else "partial" if failed else "ok"
    entry.save()
    return entry
