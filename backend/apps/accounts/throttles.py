"""ISH_REJASI 2.1: login, parol tiklash va murojaat formalariga IP bo'yicha chegara (parol terish va spamga qarshi).

Tezliklar settings'da (`AUTH_THROTTLE_RATE`, `FORM_THROTTLE_RATE`), standart: 20/min va 30/soat.
"""
from django.conf import settings
from rest_framework.throttling import SimpleRateThrottle


class _IpThrottle(SimpleRateThrottle):
    setting_name = ""
    default_rate = ""

    def get_rate(self):
        return getattr(settings, self.setting_name, self.default_rate)

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}


class AuthRateThrottle(_IpThrottle):
    scope = "auth"
    setting_name = "AUTH_THROTTLE_RATE"
    default_rate = "20/min"


class FormRateThrottle(_IpThrottle):
    scope = "form"
    setting_name = "FORM_THROTTLE_RATE"
    default_rate = "30/hour"
