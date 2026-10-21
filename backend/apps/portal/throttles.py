from apps.accounts.throttles import _IpThrottle


class UsageRateThrottle(_IpThrottle):
    """Foydalanish hisoblagichini sun'iy ko'paytirishga qarshi (IP bo'yicha)."""
    scope = "portal_usage"
    setting_name = "PORTAL_USAGE_THROTTLE_RATE"
    default_rate = "60/hour"
