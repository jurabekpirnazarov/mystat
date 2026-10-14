"""S-10 korxona ko'rsatkichlari va S-11 hududiy ko'rsatkichlar (to'liq namuna, OS-13)."""
import math
from decimal import Decimal

from apps.analytics.models import EnterpriseIndicator, RegionIndicator
from apps.common.models import District, Region
from apps.organizations.models import Organization

from . import Seeder
from .demo_users import demo_users

YEARS = list(range(2019, 2026))
SECTIONS = "ABCDEFGHIJKLMNPQRS"  # O (davlat boshqaruvi), T, U — korxona benchmarki uchun ma'nosiz
PEERS_PER_GROUP = 12
# Xodim boshiga yillik tushum (ming so'm) — tarmoq bo'yicha taxminiy daraja
REVENUE_PER_EMPLOYEE = {
    "A": 90_000, "B": 600_000, "C": 320_000, "D": 700_000, "E": 150_000, "F": 220_000, "G": 450_000,
    "H": 260_000, "I": 120_000, "J": 380_000, "K": 900_000, "L": 300_000, "M": 240_000, "N": 140_000,
    "P": 80_000, "Q": 95_000, "R": 110_000, "S": 100_000,
}
PRODUCING = set("ABCDEF")
EXPORTING = set("ABCGH")
REGION_FACTOR = {"1726": 1.55, "1727": 1.15, "1730": 1.0, "1718": 0.98, "1703": 0.97, "1706": 0.95}


def section_of(sector):
    """OKED daraxtidagi har qanday tugun -> bo'lim harfi (A..U)."""
    while sector is not None and sector.parent_id:
        sector = sector.parent
    return sector.code if sector else None


class EnterpriseIndicatorsSeeder(Seeder):
    name = "enterprise_indicators"
    depends_on = ("demo_users",)

    def _series(self, employees, section, region_code):
        """2025 dan orqaga: har yil ±5–20% o'zgarish."""
        per_emp = REVENUE_PER_EMPLOYEE[section] * REGION_FACTOR.get(region_code, 0.9)
        rows, emp, growth = {}, employees, 1.0
        for year in reversed(YEARS):
            revenue = emp * per_emp * self.rnd.uniform(0.6, 1.5) * growth
            output = revenue * (self.rnd.uniform(0.6, 0.9) if section in PRODUCING else self.rnd.uniform(0.05, 0.25))
            export = None
            if section in EXPORTING and self.rnd.random() < 0.3:
                export = revenue * self.rnd.uniform(0.05, 0.4) / 12_500  # ming so'm -> ming AQSh $
            rows[year] = dict(revenue=Decimal(f"{revenue:.1f}"), employees=max(1, int(emp)),
                              output_value=Decimal(f"{output:.1f}"),
                              export_value=Decimal(f"{export:.1f}") if export else None)
            step = self.rnd.uniform(0.05, 0.20) * (1 if self.rnd.random() < 0.75 else -1)
            growth /= (1 + step)
            emp = max(1, emp / (1 + step * self.rnd.uniform(0.3, 0.8)))
        return rows

    def seed(self):
        regions = list(Region.objects.order_by("code"))
        items = []
        for section in SECTIONS:
            for region in regions:
                for n in range(PEERS_PER_GROUP):
                    stir = f"P{section}{region.code}{n:02d}"
                    employees = min(5000, max(1, int(math.exp(self.rnd.gauss(2.8, 1.25)))))
                    for year, values in self._series(employees, section, region.code).items():
                        items.append((f"{stir}:{year}", dict(stir=stir, year=year, oked_section=section,
                                                             region=region, is_peer=True, **values)))

        orgs = Organization.objects.filter(user__in=demo_users().values()).select_related("sector", "district__region")
        for org in orgs:
            section = section_of(org.sector)
            if not section or not org.district_id or section not in REVENUE_PER_EMPLOYEE:
                continue
            employees = self.rnd.choice([8, 24, 65, 140, 320])
            for year, values in self._series(employees, section, org.district.region.code).items():
                items.append((f"{org.tin}:{year}", dict(stir=org.tin, year=year, oked_section=section,
                                                        region=org.district.region, is_peer=False, **values)))
        self.bulk(EnterpriseIndicator, items)


# (ko'rsatkich, birlik, respublika bazasi 2018, yillik o'sish, Toshkent sh. koeffitsienti, choraklik?)
REGION_INDICATORS = [
    ("population", "ming kishi", 2300, 0.019, 1.2, False),
    ("avg_salary", "ming so'm", 2100, 0.17, 1.75, True),
    ("unemployment_rate", "%", 9.3, -0.025, 0.75, True),
    ("grp_per_capita", "mln so'm", 13.5, 0.15, 2.6, False),
    ("births", "kishi", 52000, 0.012, 0.9, False),
    ("deaths", "kishi", 11500, 0.008, 1.0, False),
    ("migration_net", "kishi", -1800, 0.0, -2.5, False),
    ("retail_turnover", "mlrd so'm", 8200, 0.18, 3.1, True),
    ("housing_built", "ming m²", 520, 0.09, 1.4, False),
    ("industry_output", "mlrd so'm", 14500, 0.16, 2.2, True),
]
DISTRICT_INDICATORS = ("population", "avg_salary", "unemployment_rate", "births")
FLOW_INDICATORS = ("retail_turnover", "industry_output")  # chorak = yilning bir qismi
REGION_YEARS = list(range(2018, 2026))


class RegionIndicatorsSeeder(Seeder):
    name = "region_indicators"

    def _value(self, base, growth, factor, year, noise=0.04):
        v = base * factor * (1 + growth) ** (year - 2018) * self.rnd.uniform(1 - noise, 1 + noise)
        return Decimal(f"{v:.2f}")

    def seed(self):
        items = []
        for region in Region.objects.order_by("code"):
            # Toshkent sh. o'z koeffitsienti bilan; boshqa viloyatlar 0.6–1.25 oralig'ida barqaror farq
            regional = self.rnd.uniform(0.6, 1.25)
            for key, unit, base, growth, capital, quarterly in REGION_INDICATORS:
                factor = capital if region.code == "1726" else regional
                if key == "unemployment_rate" and region.code != "1726":
                    factor = self.rnd.uniform(0.85, 1.25)
                for year in REGION_YEARS:
                    value = self._value(base, growth, factor, year)
                    items.append((f"{region.code}:{key}:{year}:Y", dict(
                        region=region, district=None, indicator=key, year=year, period="Y", value=value, unit=unit)))
                    if not quarterly:
                        continue
                    for q in range(1, 5):
                        qv = float(value) / 4 if key in FLOW_INDICATORS else float(value)
                        items.append((f"{region.code}:{key}:{year}:Q{q}", dict(
                            region=region, district=None, indicator=key, year=year, period=f"Q{q}",
                            value=Decimal(f"{qv * self.rnd.uniform(0.9, 1.1):.2f}"), unit=unit)))

        for district in District.objects.select_related("region").order_by("id"):
            share = self.rnd.uniform(0.03, 0.12)
            for key, unit, base, growth, capital, _quarterly in REGION_INDICATORS:
                if key not in DISTRICT_INDICATORS:
                    continue
                if key in ("population", "births"):
                    factor = share
                else:
                    factor = self.rnd.uniform(0.75, 1.15) * (capital if district.region.code == "1726" else 1)
                for year in REGION_YEARS:
                    items.append((f"d{district.id}:{key}:{year}", dict(
                        region=district.region, district=district, indicator=key, year=year, period="Y",
                        value=self._value(base, growth, factor, year), unit=unit)))
        self.bulk(RegionIndicator, items)
