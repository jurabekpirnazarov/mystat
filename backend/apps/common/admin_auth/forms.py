"""Admin 2FA + reCAPTCHA formlar."""
from django import forms
from django.utils.translation import gettext_lazy as _


class AdminLoginForm(forms.Form):
    username = forms.CharField(
        label=_("Foydalanuvchi nomi"),
        max_length=150,
        widget=forms.TextInput(attrs={
            "autofocus": True,
            "autocomplete": "username",
            "class": "vTextField",
        }),
    )
    password = forms.CharField(
        label=_("Parol"),
        strip=False,
        widget=forms.PasswordInput(attrs={
            "autocomplete": "current-password",
            "class": "vTextField",
        }),
    )
    recaptcha_response = forms.CharField(
        required=False,
        widget=forms.HiddenInput(attrs={"id": "id_recaptcha_response"}),
    )


class AdminOTPForm(forms.Form):
    otp_code = forms.CharField(
        label=_("Tasdiqlash kodi"),
        max_length=6,
        min_length=6,
        widget=forms.TextInput(attrs={
            "autofocus": True,
            "autocomplete": "one-time-code",
            "inputmode": "numeric",
            "pattern": "[0-9]{6}",
            "placeholder": "------",
            "class": "vTextField otp-input",
            "maxlength": "6",
        }),
    )

    def clean_otp_code(self):
        code = (self.cleaned_data.get("otp_code") or "").strip()
        if not code.isdigit():
            raise forms.ValidationError(_("Kod faqat raqamlardan iborat bo'lishi kerak."))
        return code
