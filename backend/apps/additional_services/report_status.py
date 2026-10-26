"""HT-03: hisobot holatlarining yagona lug'ati (stat-hisobot ANALIZ 7.3 bilan bir xil kodlar).

`due_soon` va `overdue` holat emas, muddatdan hisoblanadigan belgi (`flag`). Topshirish manbasi (OS-11)
ulanmaguncha holat faqat `unknown`: "Topshirilmagan" deb yozilmaydi, chunki korxona topshirgan bo'lishi mumkin.
"""
from datetime import date

DUE_SOON_DAYS = 5  # MS 5.2 AlertStrip chegarasi bilan bir xil

STATUS_LABELS = {
    "not_started": "Topshirilmagan",
    "submitted": "Topshirilgan",
    "accepted": "Qabul qilingan",
    "rejected": "Rad etilgan",
    "unknown": "Ma'lumot yo'q",
}
FLAG_LABELS = {"due_soon": "Muddati yaqin", "overdue": "Muddati o'tgan"}
# Rang tokenlari (--ds-*), frontend shu kalitlar bo'yicha tanlaydi
STATUS_TONES = {"not_started": "neutral", "submitted": "info", "accepted": "success", "rejected": "danger",
                "unknown": "neutral"}
FLAG_TONES = {"due_soon": "warning", "overdue": "danger"}


def deadline_flag(due, today, status):
    """Topshirilgan/qabul qilingan bo'lsa belgi yo'q; aks holda muddatga qarab."""
    if status in ("submitted", "accepted"):
        return None
    days = (due - today).days
    if days < 0:
        return "overdue"
    if days <= DUE_SOON_DAYS:
        return "due_soon"
    return None


def resolve_status(submission=None):
    """`submission` — topshirish manbasidan kelgan yozuv (`{"status": ...}`) yoki None. Manba yo'q: `unknown`."""
    if submission and submission.get("status") in STATUS_LABELS:
        return submission["status"]
    return "unknown"


def legend():
    return {"statuses": [{"code": c, "label": l, "tone": STATUS_TONES[c]} for c, l in STATUS_LABELS.items()],
            "flags": [{"code": c, "label": l, "tone": FLAG_TONES[c]} for c, l in FLAG_LABELS.items()],
            "due_soon_days": DUE_SOON_DAYS}
