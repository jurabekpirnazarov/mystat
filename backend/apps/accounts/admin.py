from django.contrib.auth.admin import UserAdmin
from apps.accounts.models import Accountant, Employee, Subscribe, User
from django.contrib import admin


@admin.register(User)
class UserAdmin(UserAdmin):
    list_display = ("id", "username", "email", "location", "is_staff", "last_login", "date_joined")
    list_display_links = (
        "id",
        "email",
    )
    readonly_fields = ("date_joined", "last_login")
    filter_horizontal = ("groups", "user_permissions")
    search_fields = ("username", "email")
    ordering = ("email",)

    fieldsets = (
        (None, {"fields": ("username", "email", "password")}),
        (
            "Personal info",
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "middle_name",
                    "avatar",
                    "phone_number",
                    "role",
                    "gender",
                    "birth_date",
                    "telegram_chat_id",
                    "location"
                )
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "username",
                    "first_name",
                    "email",
                    "password1",
                    "password2",
                    "role",
                    "is_active",
                    "is_staff",
                    "location"
                ),
            },
        ),
    )

    def get_queryset(self, request):
        """
        Manager faqat o'zi yaratgan yoki o'zi ko'ra oladigan userlarni ko'radi
        """
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        if hasattr(request, 'user') and request.user.role == "manager":
            # Manager barcha userlarni ko'radi
            return qs
        return qs.filter(id=request.user.id)

    def has_add_permission(self, request):
        """
        Manager faqat employee, bugalter, monitoring yarata oladi
        """
        if request.user.is_superuser:
            return True
        if hasattr(request, 'user') and request.user.role == "manager":
            return True
        return False

    def has_change_permission(self, request, obj=None):
        """
        Manager faqat employee, bugalter, monitoring ni o'zgartira oladi
        """
        if request.user.is_superuser:
            return True
        if hasattr(request, 'user') and request.user.role == "manager":
            if obj is None:
                return True
            # Manager faqat employee, bugalter, monitoring ni edit qila oladi
            return obj.role in ["employee", "bugalter", "monitoring"]
        return False

    def has_delete_permission(self, request, obj=None):
        """
        Manager faqat employee, bugalter, monitoring ni o'chira oladi
        """
        if request.user.is_superuser:
            return True
        if hasattr(request, 'user') and request.user.role == "manager":
            if obj is None:
                return True
            return obj.role in ["employee", "bugalter", "monitoring"]
        return False

    def formfield_for_choice_field(self, db_field, request, **kwargs):
        """
        Manager faqat employee, bugalter, monitoring rollarini tanlay oladi
        """
        if db_field.name == "role":
            if hasattr(request, 'user') and request.user.role == "manager":
                kwargs["choices"] = (
                    ("employee", "Xodim"),
                    ("bugalter", "Buxgalter"),
                    ("monitoring", "Monitoring"),
                )
            else:
                kwargs["choices"] = User.ROLE_CHOICES
        
        return super().formfield_for_choice_field(db_field, request, **kwargs)



admin.site.register(Subscribe)

@admin.register(Accountant)
class AccountantAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "created_at", "updated_at")

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "user":
            kwargs["queryset"] = User.objects.filter(role="bugalter")
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "user_phone_number", "created_at", "updated_at")
    search_fields = ("user__username", "user__email")

    def user_phone_number(self, obj):
        return obj.user.phone_number if obj.user else ""
    user_phone_number.short_description = "Phone number"
    user_phone_number.admin_order_field = "user__phone_number"

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "user":
            kwargs["queryset"] = User.objects.filter(role="employee")
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
