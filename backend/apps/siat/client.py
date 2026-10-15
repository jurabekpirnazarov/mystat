"""SIAT bilan tarmoq orqali ishlash (KR-01). Hujjatlashtirilgan API yo'q — "yuklab olish" endpoint'iga tayanadi.

GET https://api.siat.stat.uz/sdmx/{ID}/table/download/?download_format=json fayl haqidagi yozuvni beradi
(`updated_at`, `file`), fayl `file` havolasidan olinadi. Sahifada havola `http://` bilan berilgan, lekin
doim `https://` ishlatiladi (N10: aks holda https sahifada mixed content).
"""
import logging
import re
import time

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

API_BASE = getattr(settings, "SIAT_API_BASE", "https://api.siat.stat.uz")
SITEMAP_URL = getattr(settings, "SIAT_SITEMAP_URL", "https://siat.stat.uz/sitemap.xml")
TIMEOUT = 20
RETRIES = 4
# SIAT ketma-ket so'rovlarda 429 qaytaradi: so'rovlar orasida pauza (soniya) va 429 da Retry-After kutiladi
REQUEST_DELAY = float(getattr(settings, "SIAT_REQUEST_DELAY", 1.5))
_last_request = [0.0]
FILE_RE = re.compile(r"^https?://api\.siat\.stat\.uz/media/")


class SiatError(Exception):
    pass


def https(url):
    return re.sub(r"^http://", "https://", url or "")


def _pause(seconds):
    wait = _last_request[0] + seconds - time.monotonic()
    if wait > 0:
        time.sleep(wait)
    _last_request[0] = time.monotonic()


def _retry_after(response, attempt):
    try:
        return min(120.0, float(response.headers.get("Retry-After", "")))
    except ValueError:
        return 10.0 * 2 ** attempt


def _get(url, **kwargs):
    last = None
    for attempt in range(RETRIES):
        try:
            _pause(REQUEST_DELAY)
            response = requests.get(https(url), timeout=TIMEOUT, headers={"User-Agent": "my.stat.uz siat-sync"}, **kwargs)
            if response.status_code == 404:
                raise SiatError(f"404: {url}")
            if response.status_code == 429:
                last = "429 Too Many Requests"
                if attempt < RETRIES - 1:
                    time.sleep(_retry_after(response, attempt))
                continue
            response.raise_for_status()
            return response
        except SiatError:
            raise
        except requests.RequestException as exc:
            last = exc
            if attempt < RETRIES - 1:
                time.sleep(2 ** attempt)
    raise SiatError(f"{url}: {last}")


def file_info(siat_id):
    """-> {'updated_at': '...', 'file': 'https://...json', 'size': '15.8 KB'}"""
    data = _get(f"{API_BASE}/sdmx/{int(siat_id)}/table/download/", params={"download_format": "json"}).json()
    url = https(data.get("file") or data.get("file_2") or "")
    if not FILE_RE.match(url):
        raise SiatError(f"{siat_id}: kutilmagan fayl havolasi")
    return {"updated_at": data.get("updated_at"), "file": url, "size": data.get("size", "")}


def download(url):
    if not FILE_RE.match(https(url)):
        raise SiatError("Faqat api.siat.stat.uz fayllari yuklanadi")
    return _get(url).json()


def catalog_ids():
    """sitemap.xml dagi barcha ko'rsatkich ID'lari."""
    text = _get(SITEMAP_URL).text
    return sorted({int(m) for m in re.findall(r"/data/(\d+)/", text)})
