"""Kichik statistik yordamchilar (guruh hajmi kichik — Python'da hisoblash yetarli)."""
from bisect import bisect_left, bisect_right


def quantile(sorted_values, q):
    """Chiziqli interpolyatsiya bilan kvantil (numpy 'linear' bilan bir xil)."""
    if not sorted_values:
        return None
    pos = (len(sorted_values) - 1) * q
    lo = int(pos)
    hi = min(lo + 1, len(sorted_values) - 1)
    return sorted_values[lo] + (sorted_values[hi] - sorted_values[lo]) * (pos - lo)


def percentile_rank(sorted_values, value):
    """Qiymat guruhning necha foizidan yuqori (tenglar yarmi hisobga olinadi), 0..100."""
    if not sorted_values or value is None:
        return None
    below = bisect_left(sorted_values, value)
    equal = bisect_right(sorted_values, value) - below
    return round(100 * (below + equal / 2) / len(sorted_values), 1)
