from collections import defaultdict

from django.db.models import Count, Q
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from apps.additional_services.api_endpoints.IndustrialProductAPI.serializers import (
    IndustrialProductCategorySerializer, IndustrialProductSerializer,
)
from apps.additional_services.models import IndustrialProduct, IndustrialProductCategory


def _lang(request):
    lang = (request.query_params.get("lang") or "uz").lower()
    return lang if lang in ("uz", "ru", "cry", "cyr") else "uz"


def descendant_ids(category_id):
    """Toifa va uning barcha quyi toifalari (daraja soni cheklanmagan, bitta so'rov bilan butun daraxt)."""
    children = defaultdict(list)
    for pk, parent in IndustrialProductCategory.objects.values_list("id", "parent_id"):
        children[parent].append(pk)
    out, stack = [], [category_id]
    while stack:
        cur = stack.pop()
        out.append(cur)
        stack.extend(children.get(cur, []))
    return out


def rollup_counts():
    """{toifa_id: o'zi va quyi toifalaridagi faol ishlab chiqaruvchilar soni}."""
    own = dict(IndustrialProduct.objects.filter(is_active=True).values_list("category").annotate(n=Count("id")))
    parent_of = dict(IndustrialProductCategory.objects.values_list("id", "parent_id"))
    total = defaultdict(int)
    for cid, n in own.items():
        cur = cid
        while cur is not None:
            total[cur] += n
            cur = parent_of.get(cur)
    return total


class IndustrialProductCategoryAPIView(generics.ListAPIView):
    queryset = IndustrialProductCategory.objects.filter(parent__isnull=True, is_active=True).order_by("id")
    serializer_class = IndustrialProductCategorySerializer
    permission_classes = (IsAuthenticated,)

    def get_serializer_context(self):
        return {**super().get_serializer_context(), "counts": rollup_counts()}


class IndustrialProductListAPIView(generics.ListAPIView):
    """GET /industrial-products/<toifa_id>/?limit=&offset=&search=&lang= — toifa VA uning barcha quyi toifalari bo'yicha.
    Ilgari faqat `category_id` ning o'zi qidirilardi: ishlab chiqaruvchilar quyi toifalarga bog'langan bo'lgani uchun
    ko'p toifa bo'sh chiqardi."""
    serializer_class = IndustrialProductSerializer
    permission_classes = (IsAuthenticated,)
    lookup_field = 'category_id'

    def get_queryset(self):
        qs = (IndustrialProduct.objects.filter(is_active=True, category_id__in=descendant_ids(self.kwargs[self.lookup_field]))
              .select_related("skp").order_by("name", "id"))
        q = (self.request.query_params.get("search") or "").strip()
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(inn__startswith=q) | Q(okpo__startswith=q))
        return qs

    def get_serializer_context(self):
        return {**super().get_serializer_context(), "lang": _lang(self.request)}
