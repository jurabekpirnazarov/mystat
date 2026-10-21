from rest_framework import serializers
from apps.additional_services.models import IndustrialProduct, IndustrialProductCategory, Skp


def pick_lang(obj, field, lang):
    """name_uz / name_ru / name_cyr (yoki adress_*, soato_*) dan tanlangan til; bo'sh bo'lsa uz, keyin ru."""
    order = {"ru": ("ru", "uz", "cyr"), "cry": ("cyr", "uz", "ru"), "cyr": ("cyr", "uz", "ru")}.get(lang, ("uz", "ru", "cyr"))
    for suffix in order:
        value = getattr(obj, f"{field}_{suffix}", None)
        if value:
            return value
    return ""


class IndustrialProductCategorySerializer(serializers.ModelSerializer):
    """Toifa daraxti. `product_count` — toifa va uning barcha quyi toifalaridagi ishlab chiqaruvchilar soni
    (view `counts` kontekstini beradi). Bo'sh toifalar frontendda yashiriladi."""
    children = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = IndustrialProductCategory
        fields = '__all__'

    def get_children(self, obj):
        children = [c for c in obj.children.all() if c.is_active]
        return IndustrialProductCategorySerializer(children, many=True, context=self.context).data

    def get_product_count(self, obj):
        counts = self.context.get("counts")
        return counts.get(obj.id, 0) if counts is not None else None


class SkpSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = Skp
        fields = '__all__'

    def get_name(self, obj):
        return pick_lang(obj, "name", self.context.get("lang", "uz"))


class IndustrialProductSerializer(serializers.ModelSerializer):
    """Ro'yxat uchun. `adress`, `soato` va `skp.name` — `?lang=uz|ru|cry` bo'yicha (standart uz); `adress_*`/`soato_*`
    asl maydonlar ham qoladi (ochiq API va eski mijozlar uchun)."""
    skp = SkpSerializer(read_only=True)
    category_id = serializers.IntegerField(read_only=True)
    adress = serializers.SerializerMethodField()
    soato = serializers.SerializerMethodField()

    class Meta:
        model = IndustrialProduct
        fields = '__all__'

    def get_adress(self, obj):
        return pick_lang(obj, "adress", self.context.get("lang", "uz"))

    def get_soato(self, obj):
        return pick_lang(obj, "soato", self.context.get("lang", "uz"))
