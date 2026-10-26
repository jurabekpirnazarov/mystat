"""HT-01: hisobot muddatlarini davr qoidasidan hisoblash (yagona manba).

Kalendar, "Hisobotlarim", eslatma, korxona pasporti va scoring faqat shu modulga tayanadi:
`ReportList.deadline` boshqa joyda to'g'ridan-to'g'ri o'qilmaydi.

Qoida (`ReportList.deadline_rule`, stat-hisobot ANALIZ V2 bilan bir xil sintaksis):
  `<P>+<N>d`   davr tugagandan keyin N kun. P: M (oy), Q (chorak), H (yarim yil), Y (yil). `Q+25d`.
  `Y+MM-DD`    yillik: hisobot yilidan keyingi yilning shu sanasi (kabisa yilida siljimaydi). `Y+03-15`.

Qoida bo'sh bo'lsa eski `deadline` sanasi zaxira sifatida ishlatiladi (davr nomisiz): admin ro'yxatida
"Qoida kiritilmagan" filtri bilan chiqadi.
"""
import calendar
import re
from datetime import date, timedelta

RULE_RE = re.compile(r"^(?:(?P<p>[MQHY])\+(?P<n>\d{1,3})d|Y\+(?P<mm>\d{2})-(?P<dd>\d{2}))$")
PERIOD_NAMES = {"M": "oy", "Q": "chorak", "H": "yarim yil", "Y": "yil"}
KIND_TO_P = {"monthly": "M", "quarterly": "Q", "yearly": "Y"}


def parse_rule(rule):
    """Qoidani (`kind`, `n` | (`mm`, `dd`)) ko'rinishiga o'tkazadi; yaroqsiz bo'lsa None."""
    m = RULE_RE.match((rule or "").strip())
    if not m:
        return None
    if m.group("p"):
        return m.group("p"), int(m.group("n"))
    mm, dd = int(m.group("mm")), int(m.group("dd"))
    try:
        date(2001, mm, dd)
    except ValueError:
        return None
    return "YF", (mm, dd)


def _safe_date(year, month, day):
    return date(year, month, min(day, calendar.monthrange(year, month)[1]))


def _periods(p, year):
    """`year` yilda tugaydigan davrlar: (kalit, nom, tugash sanasi)."""
    if p == "M":
        return [(f"{year}-M{m:02d}", f"{year}-yil {m}-oy", date(year, m, calendar.monthrange(year, m)[1]))
                for m in range(1, 13)]
    if p == "Q":
        return [(f"{year}-Q{q}", f"{year}-yil {q}-chorak", date(year, 3 * q, calendar.monthrange(year, 3 * q)[1]))
                for q in range(1, 5)]
    if p == "H":
        return [(f"{year}-H{h}", f"{year}-yil {h}-yarim yillik", date(year, 6 * h, calendar.monthrange(year, 6 * h)[1]))
                for h in (1, 2)]
    return [(f"{year}-Y", f"{year}-yil", date(year, 12, 31))]


def _holidays(start, end):
    from apps.additional_services.models import Holiday
    return set(Holiday.objects.filter(date__gte=start, date__lte=end).values_list("date", flat=True))


def shift_enabled():
    from apps.common.models import SiteSettings
    return bool(SiteSettings.objects.filter(pk=1).values_list("deadline_shift_to_workday", flat=True).first())


def shift_to_workday(day, holidays):
    """HT-10: shanba, yakshanba va bayramga tushsa keyingi ish kuniga."""
    while day.weekday() >= 5 or day in holidays:
        day += timedelta(days=1)
    return day


def _overrides(report):
    """`prefetch_related("deadline_overrides")` bo'lsa qo'shimcha so'rov bermaydi."""
    return {o.period: o for o in report.deadline_overrides.all()}


def _legacy(report, year):
    """Qoida yo'q: eski `deadline` + `report_type` bo'yicha takrorlash (davr nomisiz)."""
    d = report.deadline
    if d is None:
        return []
    kind = report.report_type
    if kind == "monthly":
        return [_safe_date(year, m, d.day) for m in range(1, 13)]
    if kind == "quarterly":
        return [_safe_date(year, m, d.day) for m in range(1, 13) if (m - d.month) % 3 == 0]
    if kind == "yearly":
        return [_safe_date(year, d.month, d.day)]
    return [d] if d.year == year else []


def deadlines_for(report, year, *, shift=None, overrides=None, holidays=None):
    """`year` kalendar yiliga tushadigan muddatlar: [{"period", "period_label", "due", "source"}], sana bo'yicha.

    `source`: "rule" | "override" | "legacy". `shift` — HT-10 bayrog'i (None: SiteSettings dan).
    """
    parsed = parse_rule(report.deadline_rule)
    overrides = _overrides(report) if overrides is None else overrides
    out = []
    if parsed is None:
        for due in _legacy(report, year):
            out.append({"period": None, "period_label": None, "due": due, "source": "legacy"})
    else:
        kind, arg = parsed
        p = "Y" if kind == "YF" else kind
        for rep_year in (year - 1, year):  # davr oxiri o'tgan yilda, muddat shu yilda bo'lishi mumkin
            for key, label, end in _periods(p, rep_year):
                due = _safe_date(rep_year + 1, *arg) if kind == "YF" else end + timedelta(days=arg)
                ov = overrides.get(key)
                src = "rule"
                if ov is not None:
                    due, src = ov.date, "override"
                if due.year == year:
                    out.append({"period": key, "period_label": label, "due": due, "source": src})
    if shift is None:
        shift = shift_enabled()
    if shift and out:
        hol = _holidays(date(year, 1, 1), date(year, 12, 31) + timedelta(days=14)) if holidays is None else holidays
        for row in out:
            if row["source"] != "override":
                row["due"] = shift_to_workday(row["due"], hol)
    out.sort(key=lambda r: r["due"])
    return out


def occurrences_in_month(report, year, month, **kw):
    return [r["due"] for r in deadlines_for(report, year, **kw) if r["due"].month == month]


def next_occurrence(report, today):
    """Bugundan boshlab eng yaqin muddat (24 oy ichida)."""
    for year in (today.year, today.year + 1, today.year + 2):
        for row in deadlines_for(report, year):
            if row["due"] >= today:
                return row["due"]
    return None


def previous_occurrence(report, today):
    """Bugungacha bo'lgan eng so'nggi muddat (13 oy ichida)."""
    best = None
    for year in (today.year - 1, today.year):
        for row in deadlines_for(report, year):
            if row["due"] < today and (best is None or row["due"] > best):
                best = row["due"]
    return best if best and (today - best).days <= 400 else None


def infer_rule(report_type, deadline):
    """Eski `deadline` sanasidan qoida chiqarish (data migratsiya). Ishonchli bo'lmasa bo'sh qator."""
    if deadline is None or report_type not in KIND_TO_P:
        return ""
    if report_type == "monthly":
        return f"M+{deadline.day}d"
    if report_type == "quarterly":
        # chorak tugagan oydan keyingi oyda (yan, apr, iyul, okt) bo'lsa muddat = shu oyning kuni
        return f"Q+{deadline.day}d" if deadline.month in (1, 4, 7, 10) else ""
    # yillik: hisobot yilidan keyingi yilning dekabrgacha bo'lgan sanasi; kech sana (iyul..dek) noaniq
    return f"Y+{deadline.month:02d}-{deadline.day:02d}" if deadline.month <= 6 else ""
