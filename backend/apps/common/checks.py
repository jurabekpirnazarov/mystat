"""OS-21: production'da xabar kanallari sozlanmagan bo'lsa `manage.py check` ogohlantiradi.

Sozlanmagan kanal ishlash vaqtida jim o'tkaziladi (A-02), shuning uchun buni deploy paytida ko'rish kerak.
"""
from django.conf import settings
from django.core.checks import Warning, register


@register(deploy=True)
def notification_channels(app_configs, **kwargs):
    warnings = []
    if "console" in settings.EMAIL_BACKEND or "locmem" in settings.EMAIL_BACKEND or not settings.EMAIL_HOST_USER:
        warnings.append(Warning(
            "Email sozlanmagan: obuna dayjestlari va hodisa xabarlari yuborilmaydi.",
            hint="EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD",
            id="common.W001"))
    if not getattr(settings, "TELEGRAM_BOT_TOKEN", ""):
        warnings.append(Warning(
            "TELEGRAM_BOT_TOKEN bo'sh: Telegram xabarlari yuborilmaydi.",
            hint="BotFather tokenini .env ga TELEGRAM_BOT_TOKEN sifatida yozing",
            id="common.W002"))
    return warnings


@register(deploy=True)
def open_hosts(app_configs, **kwargs):
    """ISH_REJASI 2.1: ochiq hostlar va CORS — production'da .env orqali yopilishi kerak."""
    warnings = []
    if "*" in settings.ALLOWED_HOSTS:
        warnings.append(Warning(
            "ALLOWED_HOSTS da '*': istalgan Host sarlavhasi qabul qilinadi (parol tiklash havolasini soxtalash xavfi).",
            hint="Masalan: ALLOWED_HOSTS=my.stat.uz,172.16.8.140",
            id="common.W003"))
    if getattr(settings, "CORS_ALLOW_ALL_ORIGINS", False) and getattr(settings, "CORS_ALLOW_CREDENTIALS", False):
        warnings.append(Warning(
            "CORS barcha domenlar uchun ochiq va credentials bilan.",
            hint="Frontend bitta domenda bo'lsa: CORS_ALLOWED_ORIGINS=https://my.stat.uz",
            id="common.W004"))
    return warnings
