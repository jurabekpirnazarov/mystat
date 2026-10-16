"""Prognoz usullari (10.2). Barchasi o'zgartirilgan fazoda ishlaydi: f = log(y) (hajm) yoki f = y (foiz).

Har usul `delta(series, origin, h)` qaytaradi: f(y[origin+h]) − f(y[origin]) bashorati. Seriya — {yil: f}.
Ichki kodlar (M0..M4) faqat hisobot va admin uchun; foydalanuvchiga ko'rsatilmaydi.
"""
import math

import numpy as np

NAIVE, DRIFT, DAMPED, PANEL, ENSEMBLE = "M0", "M1", "M2", "M3", "M4"
SIMPLE = (NAIVE, DRIFT, DAMPED)


def to_f(value, kind):
    if value is None:
        return None
    if kind == "level":
        return math.log(value) if value > 0 else None
    return float(value)


def from_f(f, kind):
    return math.exp(f) if kind == "level" else f


def history(series, origin):
    """Origin yiligacha (shu yil ham) uzluksiz oxirgi qism: [(yil, f), ...]."""
    years = sorted(y for y in series if y <= origin)
    if not years or years[-1] != origin:
        return []
    run = [origin]
    for y in reversed(years[:-1]):
        if y == run[-1] - 1:
            run.append(y)
        else:
            break
    return [(y, series[y]) for y in reversed(run)]


def naive(series, origin, h):
    return 0.0 if history(series, origin) else None


def drift(series, origin, h, window=5):
    """Oxirgi 3–5 yillik o'rtacha o'sish (log fazoda CAGR)."""
    hist = history(series, origin)
    if len(hist) < 2:
        return None
    tail = hist[-(window + 1):]
    diffs = [b[1] - a[1] for a, b in zip(tail, tail[1:])]
    return h * sum(diffs) / len(diffs)


_GRID = [(a, b, phi) for a in (0.3, 0.5, 0.7, 0.9) for b in (0.05, 0.15, 0.3) for phi in (0.8, 0.9, 0.98)]


def damped(series, origin, h, min_points=8):
    """So'nuvchi trendli Holt (ETS A,Ad,N). Parametrlar bir qadamli xato kvadratlari yig'indisi bo'yicha tanlanadi."""
    hist = history(series, origin)
    if len(hist) < min_points:
        return None
    ys = [f for _, f in hist]
    best = None
    for alpha, beta, phi in _GRID:
        level, trend = ys[0], ys[1] - ys[0]
        sse = 0.0
        for y in ys[1:]:
            pred = level + phi * trend
            sse += (y - pred) ** 2
            new_level = alpha * y + (1 - alpha) * pred
            trend = beta * (new_level - level) + (1 - beta) * phi * trend
            level = new_level
        if best is None or sse < best[0]:
            best = (sse, level, trend, phi)
    _, level, trend, phi = best
    damp = sum(phi ** i for i in range(1, h + 1))
    return level + damp * trend - ys[-1]


def simple(method, series, origin, h):
    return {NAIVE: naive, DRIFT: drift, DAMPED: damped}[method](series, origin, h)


class PanelModel:
    """Global gradient boosting (XGBoost): barcha tumanlar bitta jadvalda, maqsad — h yildan keyingi o'sish.

    Kichik va konservativ giperparametrlar (10.3). xgboost o'rnatilmagan bo'lsa `available()` False — oddiy usullar
    qoladi.
    """

    PARAMS = {"max_depth": 3, "n_estimators": 200, "learning_rate": 0.05, "min_child_weight": 5, "subsample": 0.8,
              "colsample_bytree": 0.8, "reg_lambda": 1.0}

    def __init__(self, seed, **overrides):
        self.seed = seed
        self.params = {**self.PARAMS, **overrides}
        self.model = None
        self.features = None

    @staticmethod
    def available():
        try:
            import xgboost  # noqa: F401
        except Exception:  # noqa: BLE001 — kutubxona yoki uning tizim kutubxonasi (libgomp) yo'q
            return False
        return True

    def fit(self, X, y, features):
        import xgboost as xgb

        self.features = list(features)
        params = {k: v for k, v in self.params.items() if k != "n_estimators"}
        params.update({"objective": "reg:squarederror", "seed": self.seed, "nthread": 1, "tree_method": "hist",
                       "eta": params.pop("learning_rate")})
        dtrain = xgb.DMatrix(np.asarray(X, dtype=float), label=np.asarray(y, dtype=float))
        self.model = xgb.train(params, dtrain, num_boost_round=int(self.params["n_estimators"]))
        return self

    def predict(self, X):
        import xgboost as xgb

        return self.model.predict(xgb.DMatrix(np.asarray(X, dtype=float)))

    def contributions(self, X):
        """SHAP qiymatlari (xgboost'ning o'zida, TreeSHAP): (n, features + 1) — oxirgisi bazaviy qiymat."""
        import xgboost as xgb

        return self.model.predict(xgb.DMatrix(np.asarray(X, dtype=float)), pred_contribs=True)


def winsorize(values, low=1, high=99):
    arr = np.asarray(values, dtype=float)
    if len(arr) < 10:
        return arr
    lo, hi = np.percentile(arr, [low, high])
    return np.clip(arr, lo, hi)
