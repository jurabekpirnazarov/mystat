import json
from django.core.serializers.json import DjangoJSONEncoder

from apps.additional_services.models.ex_trade import Region
from ..models import CountryGroup, Country, Unit, SITC, Year, Product, TradeData

def generate_trade_json():
    countries = [
        {
            "value": country.ctrana,
            "label": f"{country.ctrana or ''} {country.name_uz}",
            "group_code": [country.country_group.code] if country.country_group else []
        }
        for country in Country.objects.all()
    ]

    # 3. countryGroups: CountryGroup model
    country_groups = [
        {
            "value": group.code,
            "label": group.name_uz,
        }
        for group in CountryGroup.objects.all()
    ]

    # 4. hs2: Product level 1 (ZNAK_2)
    hs2 = [
        {
            "value": product.code,
            "label": f"{product.code} {product.name_uz}",
        }
        for product in Product.objects.filter(level=1)
    ]

    # 5. hs4: Product level 2 (ZNAK_4)
    hs4 = [
        {
            "value": product.code,
            "label": f"{product.code} {product.name_uz}",
            "parent_code": product.parent.code if product.parent else None,
        }
        for product in Product.objects.filter(level=2)
    ]

    # 6. hs6: Product level 3 (ZNAK_6)
    hs6 = [
        {
            "value": product.code,
            "label": f"{product.code} {product.name_uz}",
            "parent_code": product.parent.code if product.parent else None
        }
        for product in Product.objects.filter(level=3)
    ]

    # 7. sitc1: SITC level 1 (assuming same as bec1)
    sitc1 = [
        {
            "value": sitc.code,
            "label": f"{sitc.code} {sitc.name_uz}",
            "parent_code": sitc.parent.code if sitc.parent else None
        }
        for sitc in SITC.objects.filter(level=1)
    ]

    sitc2 = [
        {
            "value": sitc.code,
            "label": f"{sitc.code} {sitc.name_uz}",
            "parent_code": sitc.parent.code if sitc.parent else None
        }
        for sitc in SITC.objects.filter(level=2)
    ]
    sitc3 = [
        {
            "value": sitc.code,
            "label": f"{sitc.code} {sitc.name_uz}",
            "parent_code": sitc.parent.code if sitc.parent else None
        }
        for sitc in SITC.objects.filter(level=3)
    ]
    sitc4 = [
        {
            "value": sitc.code,
            "label": f"{sitc.code} {sitc.name_uz}",
            "parent_code": sitc.parent.code if sitc.parent else None
        }
        for sitc in SITC.objects.filter(level=4)
    ]

    # 8. measurementUnits: Unit model
    measurement_units = [
        {"value":"1K_USD","label":"Thousands USD"},
        {"value":"1M_USD","label":"Millions USD"},
    ]

    # 9. month: Derived from TradeData.MONTH_CHOICES
    month = [
        {"value": code, "label": label}
        for code, label in TradeData.MONTH_CHOICES
    ]

    # 10. quarter: Derived from TradeData.MONTH_CHOICES for quarters
    quarter = [
        {"value": "Q1", "label": "I quarter"},  # M3
        {"value": "Q2", "label": "II quarter"},  # M6
        {"value": "Q3", "label": "III quarter"},  # M9
        {"value": "Q4", "label": "IV quarter"}   # M12
    ]



    # 14. types: TradeData trade_type with additional "Domestic Export"
    trade_types = TradeData.TRADE_TYPE
    types = [
        {"value": value, "label": label}
        for value, label in trade_types
    ]

    # 15. year: Year model
    year = [
        {"value": year.year, "label": str(year.year)}
        for year in Year.objects.all()
    ]

    regions = [
        {"value": region.soato, "label": region.name_uz}
        for region in Region.objects.all()
    ]

    # Combine all into a single JSON object
    data = {
        "countries": countries,
        "countryGroups": country_groups,
        "hs2": hs2,
        "hs4": hs4,
        "hs6": hs6,
        "sitc1": sitc1,
        "sitc2": sitc2,
        "sitc3": sitc3,
        "sitc4": sitc4,
        "measurementUnits": measurement_units,
        "month": month,
        "quarter": quarter,
        "types": types,
        "year": year,
        "regions": regions,
    }

    # Serialize to JSON
    return json.dumps(data, cls=DjangoJSONEncoder, ensure_ascii=False)

# Example usage: Run in Django shell or view
if __name__ == "__main__":
    json_output = generate_trade_json()
    print(json_output)