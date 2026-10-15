"""KR-04: chegaralar fayllari (GeoJSON) SOATO kodi bilan.

Manba: geoBoundaries (gbOpen, UZB): ADM1 — OpenStreetMap (ODbL), ADM2 — OCHA ROCCA (CC BY 3.0 IGO).
Ularda SOATO yo'q, shuning uchun bir martalik moslashtirish shu buyruqda: tuman markazi qaysi viloyat
ichida ekani (nuqta-ko'pburchak) va viloyat ichida nom o'xshashligi; aniq bo'lmaganlari `data/boundary_overrides.json`
da qo'lda yoziladi. Karta esa faqat `properties.soato` bo'yicha ishlaydi (N1).

    python manage.py build_map_boundaries --adm1 ADM1.geojson --adm2 ADM2.geojson --out ../frontend/public/geo
    python manage.py build_map_boundaries --check --out ../frontend/public/geo   # faqat tekshiruv

Natija: regions.geojson, districts.geojson (koordinatalar 3 xona, ~100 m) va Territory.area_km2.
"""
import difflib
import json
import math
import os
import re

from django.core.management.base import BaseCommand, CommandError

from apps.siat.models import Territory

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
OVERRIDES = os.path.join(DATA_DIR, "boundary_overrides.json")
ADM1_SOATO = {
    "Republic of Karakalpakstan": "1735", "Andijan Region": "1703", "Bukhara Region": "1706",
    "Jizzakh Region": "1708", "Qashqadaryo Region": "1710", "Navoiy Region": "1712", "Namangan Region": "1714",
    "Samarqand Region": "1718", "Surxondaryo Region": "1722", "Sirdaryo Region": "1724", "Tashkent": "1726",
    "Tashkent Region": "1727", "Fergana Region": "1730", "Xorazm Region": "1733",
}
PRECISION = 3
EARTH_R = 6371.0088


def _rings(geometry):
    if geometry["type"] == "Polygon":
        return [geometry["coordinates"]]
    if geometry["type"] == "MultiPolygon":
        return geometry["coordinates"]
    return []


def _ring_area(ring):
    """Sferadagi ko'pburchak maydoni, km² (Chamberlain & Duquette)."""
    total = 0.0
    for (x1, y1), (x2, y2) in zip(ring, ring[1:]):
        total += math.radians(x2 - x1) * (2 + math.sin(math.radians(y1)) + math.sin(math.radians(y2)))
    return abs(total) * EARTH_R ** 2 / 2


def area_km2(geometry):
    return sum(_ring_area(poly[0]) - sum(_ring_area(h) for h in poly[1:]) for poly in _rings(geometry))


def _centroid(geometry):
    best = max((poly[0] for poly in _rings(geometry)), key=_ring_area)
    a = cx = cy = 0.0
    for (x1, y1), (x2, y2) in zip(best, best[1:]):
        f = x1 * y2 - x2 * y1
        a += f
        cx += (x1 + x2) * f
        cy += (y1 + y2) * f
    if not a:
        return best[0]
    return cx / (3 * a), cy / (3 * a)


def _inside(point, ring):
    x, y = point
    inside = False
    for (x1, y1), (x2, y2) in zip(ring, ring[1:]):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            inside = not inside
    return inside


def contains(geometry, point):
    return any(_inside(point, poly[0]) and not any(_inside(point, h) for h in poly[1:]) for poly in _rings(geometry))


def _round(geometry):
    def ring(r):
        out = []
        for x, y in r:
            p = [round(x, PRECISION), round(y, PRECISION)]
            if not out or out[-1] != p:
                out.append(p)
        if out[0] != out[-1]:
            out.append(out[0])
        return out if len(out) >= 4 else None

    polys = []
    for poly in _rings(geometry):
        rings = [ring(r) for r in poly]
        if rings[0]:
            polys.append([r for r in rings if r])
    if len(polys) == 1:
        return {"type": "Polygon", "coordinates": polys[0]}
    return {"type": "MultiPolygon", "coordinates": polys}


def name_key(text):
    """Transliteratsiya farqlarini tekislaydi: Kattakurgan / Kattaqo'rg'on / Khanabad / Xonobod."""
    t = (text or "").lower()
    t = re.sub(r"\b(district|city|tumani|shahri|region)\b", " ", t)
    t = re.sub(r"[^a-z]", "", t.replace("ʻ", "").replace("’", ""))
    for a, b in (("dzh", "j"), ("dj", "j"), ("zh", "j"), ("kh", "h"), ("x", "h"), ("q", "k"), ("yu", "u"),
                 ("ya", "a"), ("ye", "e"), ("y", "i"), ("w", "v"), ("ts", "s"), ("gh", "g"), ("oo", "o")):
        t = t.replace(a, b)
    t = t.replace("o", "a").replace("u", "a").replace("e", "i")
    return re.sub(r"(.)\1+", r"\1", t)


class Command(BaseCommand):
    help = "geoBoundaries ADM1/ADM2 -> SOATO kodli regions.geojson va districts.geojson (KR-04)"

    def add_arguments(self, parser):
        parser.add_argument("--adm1", help="geoBoundaries UZB ADM1 (simplified) GeoJSON")
        parser.add_argument("--adm2", help="geoBoundaries UZB ADM2 (simplified) GeoJSON")
        parser.add_argument("--out", required=True, help="Chiqish papkasi (frontend/public/geo)")
        parser.add_argument("--check", action="store_true", help="Faqat tekshiruv: SIAT kodlari va polygonlar")

    def handle(self, *args, adm1=None, adm2=None, out=None, check=False, **options):
        if not Territory.objects.filter(level="district").exists():
            raise CommandError("Territory jadvali bo'sh: avval `sync_siat` (kamida 246) ishga tushiring")
        if check:
            return self.check_files(out)
        if not (adm1 and adm2):
            raise CommandError("--adm1 va --adm2 kerak (yoki --check)")
        with open(adm1, encoding="utf-8") as fh:
            regions = json.load(fh)["features"]
        with open(adm2, encoding="utf-8") as fh:
            districts = json.load(fh)["features"]
        overrides = {}
        if os.path.exists(OVERRIDES):
            with open(OVERRIDES, encoding="utf-8") as fh:
                overrides = json.load(fh)

        names = {t.soato: t for t in Territory.objects.exclude(level="country")}
        region_features, areas = [], {}
        region_geoms = {}
        for f in regions:
            code = ADM1_SOATO.get(f["properties"]["shapeName"])
            if not code:
                raise CommandError(f"Noma'lum ADM1: {f['properties']['shapeName']}")
            region_geoms[code] = f["geometry"]
            areas[code] = area_km2(f["geometry"])
            region_features.append(self.feature(code, names, f["geometry"]))

        matched, unmatched, used = [], [], set()
        candidates = []
        for f in districts:
            shape = f["properties"]["shapeName"]
            center = _centroid(f["geometry"])
            region = next((c for c, g in region_geoms.items() if contains(g, center)), None)
            if region is None:
                region = min(region_geoms, key=lambda c: math.dist(center, _centroid(region_geoms[c])))
            key = f"{region}:{shape}"
            if key in overrides:
                code = overrides[key]
                if code:
                    candidates.append((2.0, code, f, shape))
                else:
                    unmatched.append(f"{shape} ({region}) — overrides'da o'tkazib yuborilgan")
                continue
            is_city = shape.lower().endswith(" city")
            best = []
            for t in names.values():
                if t.level != "district" or t.parent_id != region or (t.kind == "city") != is_city:
                    continue
                score = max(difflib.SequenceMatcher(None, name_key(shape), name_key(n)).ratio()
                            for n in (t.name_en, t.name_uz) if n)
                best.append((score, t.soato))
            best.sort(reverse=True)
            if best and best[0][0] >= 0.75:
                candidates.append((best[0][0], best[0][1], f, shape))
            else:
                hint = ", ".join(f"{names[c].name_uz}={s:.2f}" for s, c in best[:3])
                unmatched.append(f'"{key}": ""   # {hint}')
        # Bir kodga bir nechta polygon tushsa — eng o'xshashi olinadi
        for score, code, f, shape in sorted(candidates, key=lambda c: -c[0]):
            if code in used:
                unmatched.append(f'"{code[:4]}:{shape}": ""   # {code} allaqachon band ({names[code].name_uz})')
                continue
            used.add(code)
            if options.get("verbosity", 1) > 1:
                self.stdout.write(f"  {shape:22} -> {code} {names[code].name_uz} ({score:.2f})")
            areas[code] = area_km2(f["geometry"])
            matched.append(self.feature(code, names, f["geometry"]))

        os.makedirs(out, exist_ok=True)
        self.write(os.path.join(out, "regions.geojson"), region_features, "geoBoundaries UZB ADM1 (OpenStreetMap, ODbL)")
        self.write(os.path.join(out, "districts.geojson"), matched,
                   "geoBoundaries UZB ADM2 (OCHA ROCCA, CC BY 3.0 IGO)")
        for code, value in areas.items():
            Territory.objects.filter(soato=code).update(area_km2=round(value, 1))
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(os.path.join(DATA_DIR, "areas.json"), "w", encoding="utf-8") as fh:
            json.dump({k: round(v, 1) for k, v in sorted(areas.items())}, fh, ensure_ascii=False, indent=0)
        self.stdout.write(f"Viloyatlar: {len(region_features)}, tumanlar: {len(matched)} / {len(districts)}")
        if unmatched:
            self.stdout.write(self.style.WARNING("Moslashtirilmadi (boundary_overrides.json ga yozing):"))
            for line in unmatched:
                self.stdout.write("  " + line)
        self.check_files(out)

    @staticmethod
    def feature(code, names, geometry):
        t = names.get(code)
        props = {"soato": code}
        if t:
            props.update({"name_uz": t.name_uz, "name_ru": t.name_ru, "name_en": t.name_en})
        return {"type": "Feature", "properties": props, "geometry": _round(geometry)}

    @staticmethod
    def write(path, features, source):
        data = {"type": "FeatureCollection", "source": source, "features": features}
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(data, fh, ensure_ascii=False, separators=(",", ":"))

    def check_files(self, out):
        """KR-04, 4-qadam: SIAT'dagi har kod uchun polygon bormi, ortiqchasi yo'qmi."""
        result = {}
        for level, filename in (("region", "regions.geojson"), ("district", "districts.geojson")):
            path = os.path.join(out, filename)
            if not os.path.exists(path):
                raise CommandError(f"{path} topilmadi")
            with open(path, encoding="utf-8") as fh:
                codes = {f["properties"].get("soato") for f in json.load(fh)["features"]}
            expected = dict(Territory.objects.filter(level=level).values_list("soato", "name_uz"))
            missing = sorted(set(expected) - codes)
            extra = sorted(codes - set(expected))
            result[level] = missing
            style = self.style.SUCCESS if not missing and not extra else self.style.WARNING
            self.stdout.write(style(f"{filename}: {len(codes)} polygon, SIAT'da {len(expected)} hudud, "
                                    f"polygoni yo'q: {len(missing)}, ortiqcha: {len(extra)}"))
            for code in missing:
                self.stdout.write(f"  yo'q: {code} {expected[code]}")
            for code in extra:
                self.stdout.write(f"  ortiqcha: {code}")
        return None
