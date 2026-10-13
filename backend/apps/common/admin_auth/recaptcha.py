"""Google reCAPTCHA verifier (v2/v3)."""
import requests
from django.conf import settings


VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"


def verify_recaptcha(response_token: str, remote_ip: str | None = None) -> bool:
    """reCAPTCHA tokenni Google API orqali tekshirish.

    - SECRET_KEY bo'sh va DEBUG=True bo'lsa — bypass (lokal dev qulayligi uchun)
    - v3 bo'lsa — score RECAPTCHA_SCORE_THRESHOLD'dan past bo'lmasligi kerak
    """
    secret = getattr(settings, "RECAPTCHA_SECRET_KEY", "") or ""
    if not secret:
        # Lokal dev — secret yo'q bo'lsa, DEBUG=True paytida tekshirilmaydi
        return bool(getattr(settings, "DEBUG", False))

    if not response_token:
        return False

    data = {"secret": secret, "response": response_token}
    if remote_ip:
        data["remoteip"] = remote_ip

    try:
        resp = requests.post(VERIFY_URL, data=data, timeout=5)
        payload = resp.json() if resp.ok else {}
    except Exception:
        return False

    if not payload.get("success"):
        return False

    if getattr(settings, "RECAPTCHA_VERSION", "v2") == "v3":
        threshold = float(getattr(settings, "RECAPTCHA_SCORE_THRESHOLD", 0.5))
        return float(payload.get("score") or 0) >= threshold

    return True


def get_client_ip(request) -> str | None:
    """X-Forwarded-For yoki REMOTE_ADDR'dan IP olish."""
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")
