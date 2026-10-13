"""Admin login flow: parol → reCAPTCHA → 2FA (TOTP) → kirish.

3 ta view:
1) admin_login_view — username/parol + reCAPTCHA tasdiqlash, keyin 2FA verifyga yo'naltirish
2) admin_2fa_verify — TOTP kodni tekshiradi, muvaffaqiyatli bo'lsa Django auth_login chaqiriladi
3) admin_2fa_setup — yangi qurilma uchun QR kod yaratadi va birinchi kodni tekshiradi
"""
from __future__ import annotations

import base64
from io import BytesIO

import pyotp
import qrcode
from django.conf import settings
from django.contrib.auth import authenticate, login as auth_login, get_user_model
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden, HttpResponseRedirect
from django.shortcuts import render, redirect, resolve_url
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_http_methods

from apps.common.models import AdminTOTPDevice
from .forms import AdminLoginForm, AdminOTPForm
from .recaptcha import verify_recaptcha, get_client_ip


User = get_user_model()

SESSION_PENDING_USER = "admin_2fa_user_id"
SESSION_PENDING_BACKEND = "admin_2fa_backend"


# ── Helpers ───────────────────────────────────────────────────────────

def _get_pending_user(request):
    """Sessiondan pending (parol tasdiqlangan, 2FA hali yo'q) foydalanuvchini olamiz."""
    uid = request.session.get(SESSION_PENDING_USER)
    if not uid:
        return None
    try:
        return User.objects.get(pk=uid)
    except User.DoesNotExist:
        request.session.pop(SESSION_PENDING_USER, None)
        request.session.pop(SESSION_PENDING_BACKEND, None)
        return None


def _clear_pending(request):
    request.session.pop(SESSION_PENDING_USER, None)
    request.session.pop(SESSION_PENDING_BACKEND, None)


def _admin_index_url() -> str:
    return resolve_url("admin:index")


def _make_qr_data_url(provisioning_uri: str) -> str:
    """provisioning URI'dan base64 PNG QR yaratish."""
    img = qrcode.make(provisioning_uri)
    buf = BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/png;base64,{b64}"


# ── 1. Login (parol + reCAPTCHA) ──────────────────────────────────────

@never_cache
@csrf_protect
@require_http_methods(["GET", "POST"])
def admin_login_view(request):
    """Birinchi bosqich: foydalanuvchi nomi + parol + reCAPTCHA.
    Muvaffaqiyatli — sessionga pending user ID saqlanadi va 2FA verify'ga redirect."""
    error: str | None = None
    next_url = request.GET.get("next") or request.POST.get("next") or _admin_index_url()

    # Allaqachon login bo'lsa va is_staff — to'g'ridan-to'g'ri admin'ga
    if request.user.is_authenticated and request.user.is_staff:
        return HttpResponseRedirect(next_url)

    form = AdminLoginForm(request.POST or None)

    if request.method == "POST" and form.is_valid():
        username = form.cleaned_data["username"]
        password = form.cleaned_data["password"]
        token = form.cleaned_data.get("recaptcha_response") or request.POST.get("g-recaptcha-response", "")

        # reCAPTCHA
        if not verify_recaptcha(token, remote_ip=get_client_ip(request)):
            error = _("reCAPTCHA tasdiqlanmadi. Iltimos, qaytadan urinib ko'ring.")
        else:
            user = authenticate(request, username=username, password=password)
            if user is None:
                error = _("Login yoki parol noto'g'ri.")
            elif not user.is_staff:
                error = _("Sizda admin paneliga kirish ruxsati yo'q.")
            elif not user.is_active:
                error = _("Foydalanuvchi nofaol.")
            else:
                # auth_login chaqirilmaydi — avval 2FA tekshirilishi kerak
                request.session[SESSION_PENDING_USER] = user.pk
                # backend nomini ham saqlaymiz (login() chaqirilganda kerak bo'ladi)
                request.session[SESSION_PENDING_BACKEND] = (
                    getattr(user, "backend", None) or "django.contrib.auth.backends.ModelBackend"
                )
                request.session["admin_2fa_next"] = next_url
                return redirect(reverse("admin_2fa_verify"))

    context = {
        "form": form,
        "error": error,
        "next": next_url,
        "recaptcha_site_key": getattr(settings, "RECAPTCHA_SITE_KEY", ""),
        "recaptcha_version": getattr(settings, "RECAPTCHA_VERSION", "v2"),
        "title": _("Admin paneliga kirish"),
    }
    return render(request, "admin/login.html", context)


# ── 2. 2FA verify ─────────────────────────────────────────────────────

@never_cache
@csrf_protect
@require_http_methods(["GET", "POST"])
def admin_2fa_verify(request):
    """Ikkinchi bosqich: TOTP kodni tekshirish. Muvaffaqiyatli — auth_login va admin'ga."""
    pending = _get_pending_user(request)
    if pending is None:
        return redirect(reverse("admin_login"))

    if not pending.is_staff:
        _clear_pending(request)
        return HttpResponseForbidden(_("Sizda admin paneliga kirish ruxsati yo'q."))

    device = AdminTOTPDevice.objects.filter(user=pending, is_active=True).first()

    # Qurilma yo'q yoki tasdiqlanmagan — setup'ga yo'naltirish
    if device is None or not device.is_verified:
        return redirect(reverse("admin_2fa_setup"))

    error: str | None = None
    form = AdminOTPForm(request.POST or None)

    if request.method == "POST" and form.is_valid():
        code = form.cleaned_data["otp_code"]
        totp = pyotp.TOTP(device.secret)
        if totp.verify(code, valid_window=1):
            backend = request.session.get(SESSION_PENDING_BACKEND) or "django.contrib.auth.backends.ModelBackend"
            next_url = request.session.get("admin_2fa_next") or _admin_index_url()
            _clear_pending(request)
            request.session.pop("admin_2fa_next", None)
            auth_login(request, pending, backend=backend)
            return HttpResponseRedirect(next_url)
        else:
            error = _("Kod noto'g'ri yoki muddati o'tgan. Iltimos, qaytadan urinib ko'ring.")

    context = {
        "form": form,
        "error": error,
        "username": pending.get_username(),
        "title": _("Ikki bosqichli tasdiqlash"),
    }
    return render(request, "admin/2fa_verify.html", context)


# ── 3. 2FA setup (QR generator + birinchi kod tekshirish) ─────────────

@never_cache
@csrf_protect
@require_http_methods(["GET", "POST"])
def admin_2fa_setup(request):
    """Yangi qurilma: secret yaratiladi, QR ko'rsatiladi, birinchi kod tasdiqlanadi.
    Manba: sessiondagi pending user yoki request.user (superuser reset paytida)."""
    pending = _get_pending_user(request)
    acting_user = pending

    # Pending yo'q va foydalanuvchi authenticated emas — login'ga
    if pending is None and not request.user.is_authenticated:
        return redirect(reverse("admin_login"))

    # Authenticated superuser ham bu sahifaga kirishi mumkin (boshqa users uchun reset emas — o'zi uchun)
    if pending is None and request.user.is_authenticated:
        acting_user = request.user
        if not acting_user.is_staff:
            return HttpResponseForbidden(_("Faqat staff foydalanuvchilar uchun."))

    # Pending bo'lsa — staff bo'lishi shart
    if pending is not None and not pending.is_staff:
        _clear_pending(request)
        return HttpResponseForbidden(_("Sizda admin paneliga kirish ruxsati yo'q."))

    # Qurilma — bor bo'lsa qayta ishlatamiz, yo'q bo'lsa yangisini
    device, created = AdminTOTPDevice.objects.get_or_create(
        user=acting_user,
        defaults={"secret": pyotp.random_base32()},
    )

    # Reset — faqat superuser yoki ?reset=1 va o'ziniki bo'lsa
    if request.GET.get("reset") == "1":
        is_self_reset = (
            request.user.is_authenticated
            and request.user.pk == acting_user.pk
        )
        can_reset = request.user.is_superuser or is_self_reset
        if can_reset:
            device.secret = pyotp.random_base32()
            device.is_verified = False
            device.save()

    issuer = getattr(settings, "ADMIN_2FA_ISSUER", "Django Admin")
    totp = pyotp.TOTP(device.secret)
    provisioning_uri = totp.provisioning_uri(name=acting_user.get_username(), issuer_name=issuer)
    qr_data_url = _make_qr_data_url(provisioning_uri)

    error: str | None = None
    form = AdminOTPForm(request.POST or None)

    if request.method == "POST" and form.is_valid():
        code = form.cleaned_data["otp_code"]
        if totp.verify(code, valid_window=1):
            device.is_verified = True
            device.is_active = True
            device.save()
            # Auto-login — pending bo'lsa yoki o'zi bo'lsa
            if pending is not None:
                backend = request.session.get(SESSION_PENDING_BACKEND) or "django.contrib.auth.backends.ModelBackend"
                next_url = request.session.get("admin_2fa_next") or _admin_index_url()
                _clear_pending(request)
                request.session.pop("admin_2fa_next", None)
                auth_login(request, pending, backend=backend)
                return HttpResponseRedirect(next_url)
            # Allaqachon login — admin'ga qaytaramiz
            return redirect(_admin_index_url())
        else:
            error = _("Kod noto'g'ri. Iltimos, qaytadan urinib ko'ring.")

    context = {
        "form": form,
        "error": error,
        "username": acting_user.get_username(),
        "secret": device.secret,
        "qr_data_url": qr_data_url,
        "issuer": issuer,
        "is_reset": request.GET.get("reset") == "1",
        "can_reset": (
            request.user.is_authenticated
            and (request.user.is_superuser or request.user.pk == acting_user.pk)
        ),
        "title": _("2FA sozlash"),
    }
    return render(request, "admin/2fa_setup.html", context)
