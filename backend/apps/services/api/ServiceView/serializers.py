from django.db.models import Count
from rest_framework import serializers
from django.utils.timesince import timesince

from apps.accounts.models import User
from apps.organizations.api.OrganizationView.serializers import OrganizationSerializer
from apps.services.models import (
    PackageServiceItem, Service, ServiceCategory, ServiceItem,
    ServicePackage, PackageService, ServiceRating, UserServicePackage, UserServicePackageItemUse
)
from django.db.models import Avg, Count


class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = [
            "id", "name"
        ]


class ServiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceItem
        fields = [
            "id", "service",
            "name_uz", "name_ru", "name_cry",
            "description_uz", "description_ru", "description_cry",
            "is_active"
        ]


class MiniUserSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name", "display_name")

    def get_display_name(self, obj):
        full = f"{obj.first_name} {obj.last_name}".strip()
        return full or obj.username


class ServiceReviewSerializer(serializers.ModelSerializer):
    user = MiniUserSerializer(read_only=True)
    created_humanized = serializers.SerializerMethodField()

    class Meta:
        model = ServiceRating
        fields = ("id", "value", "comment", "created_at", "created_humanized", "user")

    def get_created_humanized(self, obj):
        return timesince(obj.created_at) + " oldin"


class ServiceSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    organization = OrganizationSerializer(read_only=True)
    average_rating = serializers.SerializerMethodField()
    ratings_total = serializers.SerializerMethodField()
    rating_counts = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()
    user_rating = serializers.SerializerMethodField()
    user_limit = serializers.SerializerMethodField()
    used_count = serializers.SerializerMethodField()
    slug = serializers.SerializerMethodField(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)


    class Meta:
        model = Service
        fields = [
            "id",
            "orders",
            "category_name",
            "items",
            "organization",
            "youtube_link",
            "reglament",
            'oferta',
            "name_uz", "name_ru", "name_cry",
            "description_uz", "description_ru", "description_cry",
            "duration", "slug", "icon",
            "is_free", "requires_login", "is_active", "is_popular",
            "average_rating",
            "ratings_total",
            "rating_counts",
            "reviews",
            "user_rating",
            "in_package",
            "user_limit",
            "used_count",
        ]

    def get_items(self, obj):
        active_items = obj.items.filter(is_active=True)
        return ServiceItemSerializer(active_items, many=True).data

    def get_user_limit(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        psi_id = 4
        user_package = UserServicePackage.objects.filter(
            created_by_user=request.user,
        ).select_related("service").first()

        if not user_package:
            return None

        if not psi_id:
            return None
        psi_id = int(psi_id)

        try:
            psi = PackageServiceItem.objects.get(
                package_service__id=psi_id,
                package=user_package.service
            )
        except PackageServiceItem.DoesNotExist:
            return None

        return psi.limit if psi else None

    def get_used_count(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None

        psi_id = 4
        user_package = UserServicePackage.objects.filter(
            created_by_user=request.user,
        ).select_related("service").first()

        if not user_package:
            return None

        if not psi_id:
            return None
        psi_id = int(psi_id)

        try:
            psi = PackageServiceItem.objects.get(
                package_service__id=psi_id,
                package=user_package.service
            )
        except PackageServiceItem.DoesNotExist:
            return None

        uses_count = UserServicePackageItemUse.objects.filter(
            usp=user_package,
            psi=psi
        ).count()

        return uses_count

    def get_slug(self, obj):
        has_package = obj.in_package is not None
        return obj.in_package.slug if has_package else obj.slug

    def get_average_rating(self, obj):
        avg = getattr(obj, "_avg", None)
        if avg is None:
            agg = obj.service_ratings.aggregate(avg=Avg("value"))
            avg = agg["avg"]
        return round(avg or 0.0, 2)

    def get_ratings_total(self, obj):
        total = getattr(obj, "_total", None)
        if total is None:
            total = obj.service_ratings.count()
        return total

    def get_rating_counts(self, obj):
        base = {str(i): 0 for i in range(1, 6)}
        qs = obj.service_ratings.values("value").annotate(c=Count("id"))
        for row in qs:
            base[str(row["value"])] = row["c"]
        return base

    def get_reviews(self, obj):
        qs = obj.service_ratings.select_related("user").order_by("-created_at")[:10]
        return ServiceReviewSerializer(qs, many=True, context=self.context).data

    def get_user_rating(self, obj):
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            return None
        r = obj.service_ratings.filter(user=request.user).only("value").first()
        return r.value if r else None


class PackageServiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackageServiceItem
        fields = [
            "id", "package", "package_service",
            "name_uz", "name_ru", "name_cry", "limit"
        ]


class PlainNameMixin:
    """PackageService nomlari admin'da RichTextField: API oddiy matn qaytaradi (`<p>`, `&lsquo;` siz)."""

    def to_representation(self, instance):
        data = super().to_representation(instance)
        from apps.common.text import rich_to_plain

        for field in ("name_uz", "name_ru", "name_cry"):
            if field in data:
                data[field] = rich_to_plain(data[field])
        return data


class PackageServiceWithItemsSerializer(PlainNameMixin, serializers.ModelSerializer):
    service_items = serializers.SerializerMethodField()

    class Meta:
        model = PackageService
        fields = ["id", "name_uz", "name_ru", "name_cry", "slug", "service_items"]

    def get_service_items(self, obj):
        package = self.context.get("package")
        prefetched_items = self.context.get("prefetched_items", {})
        
        if not package:
            return []
        
        items = prefetched_items.get(obj.id, [])
        return PackageServiceItemSerializer(items, many=True).data


class ServicePackageSerializer(serializers.ModelSerializer):
    package_services = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField(read_only=True)
    price_range = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ServicePackage
        fields = [
            "id", "name_uz", "name_ru", "name_cry",
            "description_uz", "description_ru", "description_cry",
            "price", "price_range", "is_active", "duration_days", "file",
            "package_services",
        ]

    def get_price_range(self, obj):
        """Bosh sahifa va tariflar uchun: narx tarmoqqa qarab (pricing.py: koeffitsient yozilmagan tarmoq — 1).
        `personal` — narx foydalanuvchi tashkilotining tarmog'i bo'yicha hisoblangan (`price`). QQSsiz."""
        bhm_value = self.context.get("bhm_value", 0)
        if not bhm_value:
            return None
        multipliers = [p.bhm_count for p in obj.prices.all()] + [1]
        base = obj.base_bhm_count * bhm_value
        user = self.context.get("user")
        org = getattr(user, "organization", None) if user and user.is_authenticated else None
        return {"min": base * min(multipliers), "max": base * max(multipliers),
                "personal": bool(org and org.sector_id), "vat_included": False}

    def get_package_services(self, obj):
        items = obj.package_service_items.all()
        
        services_dict = {}
        items_by_service = {}
        
        for item in items:
            pkg_service = item.package_service
            if pkg_service.id not in services_dict:
                services_dict[pkg_service.id] = pkg_service
                items_by_service[pkg_service.id] = []
            items_by_service[pkg_service.id].append(item)
        
        context = {
            "package": obj,
            "prefetched_items": items_by_service
        }
        
        services_list = list(services_dict.values())
        serializer = PackageServiceWithItemsSerializer(
            services_list, 
            many=True, 
            context=context
        )
        return serializer.data

    def get_price(self, obj):
        user = self.context.get('user')
        bhm_value = self.context.get('bhm_value', 0)
        
        if not bhm_value:
            return 0
        
        multiplier = 1
        
        if user and user.is_authenticated:
            if hasattr(user, 'organization') and user.organization and user.organization.sector:
                user_sector = user.organization.sector
                if hasattr(obj, 'prices') and obj.prices:
                    for price_obj in obj.prices.all():
                        if price_obj.sector_id == user_sector.id:
                            multiplier = price_obj.bhm_count
                            break
        
        return obj.base_bhm_count * bhm_value * multiplier
    
class ServiceRatingPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceRating
        fields = [
            "service", "value", "comment"
        ]

    def validate_value(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user
        validated_data["user"] = user
        return super().create(validated_data)
