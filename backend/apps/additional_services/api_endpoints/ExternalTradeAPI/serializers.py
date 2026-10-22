from rest_framework import serializers
from apps.additional_services.models.ex_trade import (
    CountryGroup, Country, Unit, Region, SITC, Year, Product, TradeData
)


class CountryGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = CountryGroup
        fields = ['id', 'name_uz', 'name_ru', 'name_en', 'name_cry', 'code']


class CountrySerializer(serializers.ModelSerializer):
    country_group_name = serializers.SerializerMethodField()
    country_group = serializers.PrimaryKeyRelatedField(
        many=True,
        read_only=True
    )

    class Meta:
        model = Country
        fields = [
            'id', 'ctrana', 'name', 'name_uz', 'name_ru', 'name_en', 'name_cry', 
            'kod_kont', 'country_group', 'country_group_name'
        ]

    def get_country_group_name(self, obj):
        return [cg.name_uz for cg in obj.country_group.all()]


class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = ['id', 'code', 'name', 'short_name']


class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ['id', 'name_uz', 'name_ru', 'name_en', 'name_cry', 'soato']


class SITCSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name_uz', read_only=True)
    level_display = serializers.SerializerMethodField()
    
    class Meta:
        model = SITC
        fields = ['id', 'code', 'name_uz', 'name_ru', 'name_cry', 'parent', 'parent_name', 'level', 'level_display']
    
    def get_level_display(self, obj):
        if obj.is_section:
            return "Bo'lim (SITC1)"
        elif obj.is_division:
            return "Bo'lim (SITC2)"
        elif obj.is_group:
            return "Guruh (SITC3)"
        elif obj.is_subgroup:
            return "Subguruh (SITC4/5)"
        return f"SITC{obj.level}"


class YearSerializer(serializers.ModelSerializer):
    class Meta:
        model = Year
        fields = ['id', 'year']


class ProductSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name_uz', read_only=True)
    level_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = ['id', 'code', 'name_uz', 'name_ru', 'name_cry', 'name_cry2', 'parent', 'parent_name', 'level', 'level_display']
    
    def get_level_display(self, obj):
        if obj.is_category:
            return "Kategoriya (2 xona)"
        elif obj.is_subcategory:
            return "Subkategoriya (4 xona)"
        elif obj.is_product:
            return "Mahsulot (6 xona)"
        return f"Level {obj.level}"


class TradeDataSerializer(serializers.ModelSerializer):
    # ForeignKey ma'lumotlarni ko'rsatish uchun
    product_name = serializers.CharField(source='product.name_uz', read_only=True)
    unit_name = serializers.CharField(source='unit.name', read_only=True)
    year_value = serializers.IntegerField(source='year.year', read_only=True)
    country_name = serializers.CharField(source='country.name_uz', read_only=True)
    region_name = serializers.CharField(source='region.name_uz', read_only=True)
    sitc_name = serializers.CharField(source='sitc.name_uz', read_only=True)
    trade_type_display = serializers.CharField(source='get_trade_type_display', read_only=True)
    month_display = serializers.CharField(source='get_month_display', read_only=True)
    
    class Meta:
        model = TradeData
        fields = [
            'id', 'trade_type', 'trade_type_display', 'product', 'product_name', 
            'unit', 'unit_name', 'year', 'year_value', 'month', 'month_display',
            'country', 'country_name', 'region', 'region_name', 
            'sitc', 'sitc_name', 'value', 'quantity'
        ]


# Chuqur ma'lumot uchun (detail viewlarda)
class CountryDetailSerializer(CountrySerializer):
    country_group = CountryGroupSerializer(read_only=True)
    
    class Meta(CountrySerializer.Meta):
        fields = CountrySerializer.Meta.fields + []  # Keraksiz qo'shimcha maydonlar bo'lsa qo'shish mumkin


class SITCDetailSerializer(SITCSerializer):
    parent = SITCSerializer(read_only=True)
    children = SITCSerializer(many=True, read_only=True)
    
    class Meta(SITCSerializer.Meta):
        fields = SITCSerializer.Meta.fields + ['children']


class ProductDetailSerializer(ProductSerializer):
    parent = ProductSerializer(read_only=True)
    children = ProductSerializer(many=True, read_only=True)
    
    class Meta(ProductSerializer.Meta):
        fields = ProductSerializer.Meta.fields + ['children']


class TradeDataDetailSerializer(TradeDataSerializer):
    product = ProductSerializer(read_only=True)
    unit = UnitSerializer(read_only=True)
    year = YearSerializer(read_only=True)
    country = CountrySerializer(read_only=True)
    region = RegionSerializer(read_only=True)
    sitc = SITCSerializer(read_only=True)
    
    class Meta(TradeDataSerializer.Meta):
        fields = TradeDataSerializer.Meta.fields + []  # Barcha maydonlar TradeDataSerializer-dan meros olingan



class TradeDataGetDataSerializer(serializers.Serializer):
    years = serializers.ListField(
        child=serializers.IntegerField(min_value=2000, max_value=2030), 
        default=[2022]
    )
    quarters = serializers.ListField(
        child=serializers.ChoiceField(choices=[
            ('Q1', 'Q1'), ('Q2', 'Q2'), ('Q3', 'Q3'), ('Q4', 'Q4')
        ]), 
        required=False
    )
    months = serializers.ListField(
        child=serializers.ChoiceField(choices=[
            ('M1', 'M1'), ('M2', 'M2'), ('M3', 'M3'), ('M4', 'M4'), 
            ('M5', 'M5'), ('M6', 'M6'), ('M7', 'M7'), ('M8', 'M8'), 
            ('M9', 'M9'), ('M10', 'M10'), ('M11', 'M11'), ('M12', 'M12')
        ]), 
        required=False
    )
    
    trade_type = serializers.ChoiceField(
        choices=[(1, 'Export'), (2, 'Import'), (3, 'Turnover')],  # 3 = aylanma (eksport + import), TI-02
        default=1
    )
    
    # Location filters
    countries = serializers.ListField(
        child=serializers.CharField(max_length=100), 
        required=False,
        default=["global"]
    )
    country_groups = serializers.ListField(
        child=serializers.CharField(max_length=10), 
        required=False
    )
    regions = serializers.ListField(
        child=serializers.CharField(max_length=10), 
        required=False
    )
    
    # Classification - HS hierarchy
    hs2_codes = serializers.ListField(
        child=serializers.CharField(max_length=2), 
        required=False,
        help_text="2-digit HS codes"
    )
    hs4_codes = serializers.ListField(
        child=serializers.CharField(max_length=4), 
        required=False,
        help_text="4-digit HS codes"
    )
    hs6_codes = serializers.ListField(
        child=serializers.CharField(max_length=6), 
        required=False,
        help_text="6-digit HS codes"
    )
    
    # SITC hierarchy
    sitc1_codes = serializers.ListField(
        child=serializers.CharField(max_length=1), 
        required=False,
        help_text="1-digit SITC codes"
    )
    sitc2_codes = serializers.ListField(
        child=serializers.CharField(max_length=2), 
        required=False,
        help_text="2-digit SITC codes"
    )
    sitc3_codes = serializers.ListField(
        child=serializers.CharField(max_length=3), 
        required=False,
        help_text="3-digit SITC codes"
    )
    sitc4_codes = serializers.ListField(
        child=serializers.CharField(max_length=6), 
        required=False,
        help_text="4-digit SITC codes"
    )
    
    # Group by - ikki xil kombinatsiya
    group_by = serializers.ListField(
        child=serializers.ChoiceField(choices=[
            'country_group', 'country', 'region', 'hs', 'sitc', 'year', 'quarter', 'month'
        ]), 
        required=False
    )
    lang = serializers.CharField(max_length=10)

    def validate(self, data):
        if data.get('quarters') and data.get('months'):
            raise serializers.ValidationError(
                "Quarter va month bir vaqtda tanlab bo'lmaydi"
            )
        
        hs_fields = ['hs2_codes', 'hs4_codes', 'hs6_codes']
        sitc_fields = ['sitc1_codes', 'sitc2_codes', 'sitc3_codes', 'sitc4_codes']
        
        has_hs = any(data.get(field) for field in hs_fields)
        has_sitc = any(data.get(field) for field in sitc_fields)
        
        if has_hs and has_sitc:
            raise serializers.ValidationError(
                "HS va SITC bir vaqtda tanlab bo'lmaydi"
            )
        
        # Group by validation
        group_by = data.get('group_by', [])
        has_hs = 'hs' in group_by
        has_sitc = 'sitc' in group_by
        
        if has_hs and has_sitc:
            raise serializers.ValidationError(
                "Group by da HS va SITC bir vaqtda bo'lishi mumkin emas"
            )  
        return data
    
class TradeDataExportResponseSerializer(serializers.Serializer):
    """Export response uchun serializer"""
    
    # Group by fields (dynamic)
    country_group_code = serializers.CharField(required=False)
    country_group_name = serializers.CharField(required=False)
    country_code = serializers.CharField(required=False)
    country_name = serializers.CharField(required=False)
    region_code = serializers.CharField(required=False)
    region_name = serializers.CharField(required=False)
    hs_code = serializers.CharField(required=False)
    hs_name = serializers.CharField(required=False)
    sitc_code = serializers.CharField(required=False)
    sitc_name = serializers.CharField(required=False)
    year = serializers.IntegerField(required=False)
    quarter = serializers.CharField(required=False)
    month = serializers.CharField(required=False)
    
    # Aggregated values
    total_value = serializers.DecimalField(max_digits=20, decimal_places=2)
    total_quantity = serializers.DecimalField(max_digits=20, decimal_places=2)
    record_count = serializers.IntegerField()