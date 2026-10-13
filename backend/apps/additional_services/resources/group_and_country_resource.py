# apps/geo/resources.py
from import_export import resources, fields
from django.core.exceptions import ValidationError
from apps.additional_services.models import CountryGroup, Country
from .loaders import CachedInstanceLoader, CachedFKWidget



class CountryGroupResource(resources.ModelResource):
    code     = fields.Field(attribute='code',     column_name='KOD_GRSTR')
    name_uz  = fields.Field(attribute='name_uz',  column_name='NAME_UZ')
    name_ru  = fields.Field(attribute='name_ru',  column_name='NAME_RU')
    name_en  = fields.Field(attribute='name_en',  column_name='NAME_EN')
    name_cry = fields.Field(attribute='name_cry', column_name='NAME_CRY')

    class Meta:
        model = CountryGroup
        import_id_fields   = ['code']          # upsert by code
        fields             = ('code','name_uz','name_ru','name_en','name_cry')
        skip_unchanged     = True
        report_skipped     = True
        use_bulk           = True


class CountryResource(resources.ModelResource):
    ctrana   = fields.Field(attribute='ctrana',   column_name='CTRANA')
    zar0     = fields.Field(attribute='zar0',     column_name='ZAR0')   # yoki ZAR_0 bo‘lsa shuni yozing
    zar1     = fields.Field(attribute='zar1',     column_name='ZAR1')   # yoki ZAR_1
    zar      = fields.Field(attribute='zar',      column_name='ZAR')
    name_uz  = fields.Field(attribute='name_uz',  column_name='NAIM_uzlat')
    name_ru  = fields.Field(attribute='name_ru',  column_name='NAIM_ru')
    name_en  = fields.Field(attribute='name_en',  column_name='NAIM_eng')
    name_cry = fields.Field(attribute='name_cry', column_name='NAIM_uzkir')
    kod_kont = fields.Field(attribute='kod_kont', column_name='KOD_KONT')
    country_group = fields.Field(
        attribute='country_group',
        column_name='KOD_GRSTR',
        widget=CachedFKWidget(CountryGroup, 'code')  # ixtiyoriy, lekin tez va barqaror
    )

    class Meta:
        model = Country
        import_id_fields   = ['ctrana']       # upsert by CTRANA
        fields             = ('ctrana','zar0','zar1','zar','name_uz','name_ru','name_en','name_cry','kod_kont','country_group')
        skip_unchanged     = True
        report_skipped     = True
        use_bulk           = True             # xohlasangiz True; konflikt bo‘lsa False qilib ko‘ring
