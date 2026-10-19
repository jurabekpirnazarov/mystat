"""KR-40 admin: hamyonlar (balans va tarif), ledger (faqat o'qish; qo'shish — faqat `grant`/`adjust`, sabab majburiy),
narxlar. Ledger yozuvlari o'chirilmaydi va o'zgartirilmaydi."""
from django import forms
from django.contrib import admin

from . import service
from .models import CreditLedger, CreditPrice, CreditUnlock, CreditWallet


class _NoDelete(admin.ModelAdmin):
    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(CreditWallet)
class CreditWalletAdmin(admin.ModelAdmin):
    list_display = ("id", "__str__", "plan", "balance_display", "created_at")
    list_filter = ("plan",)
    search_fields = ("organization__name", "organization__tin", "user__username", "user__first_name")
    raw_id_fields = ("organization", "user")

    @admin.display(description="Balans")
    def balance_display(self, obj):
        return service.balance(obj)


class LedgerForm(forms.ModelForm):
    class Meta:
        model = CreditLedger
        fields = ("wallet", "kind", "amount", "expires_at", "reason")

    def clean(self):
        data = super().clean()
        if data.get("kind") not in ("grant", "adjust"):
            raise forms.ValidationError("Qo'lda faqat grant yoki adjust qo'shiladi.")
        if not (data.get("reason") or "").strip():
            raise forms.ValidationError("Sabab majburiy.")
        if data.get("amount") is not None and data["amount"] <= 0:
            raise forms.ValidationError("Miqdor musbat bo'lsin (manfiy tuzatish — servis orqali, FIFO bilan).")
        return data


@admin.register(CreditLedger)
class CreditLedgerAdmin(_NoDelete):
    form = LedgerForm
    list_display = ("created_at", "wallet", "kind", "amount", "action_code", "object_ref", "expires_at", "created_by")
    list_filter = ("kind", "action_code")
    search_fields = ("object_ref", "wallet__organization__tin", "wallet__user__username", "reason")
    raw_id_fields = ("wallet",)

    def get_readonly_fields(self, request, obj=None):
        return [f.name for f in CreditLedger._meta.fields] if obj else []

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(CreditUnlock)
class CreditUnlockAdmin(_NoDelete):
    list_display = ("stir", "level", "wallet", "expires_at", "unlocked_by", "created_at")
    list_filter = ("level",)
    search_fields = ("stir",)
    readonly_fields = ("wallet", "stir", "level", "expires_at", "unlocked_by", "created_at")

    def has_add_permission(self, request):
        return False


@admin.register(CreditPrice)
class CreditPriceAdmin(admin.ModelAdmin):
    list_display = ("action_code", "name", "credits", "is_active")
    list_editable = ("credits", "is_active")
