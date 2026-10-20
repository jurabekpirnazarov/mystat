from .base import *  # noqa

DEBUG = False   # faqat ishlashi uchun
# base.py middleware'ni .env dagi DEBUG ga qarab qo'shadi; production'da toolbar va so'rov hisoblagichi hech qachon
# bo'lmasin (ISH_REJASI 2.1: `__debug__/` ochiq edi). core/urls.py `__debug__/` ni faqat shu middleware bo'lsa ulaydi.
MIDDLEWARE = [m for m in MIDDLEWARE if not m.startswith(("debug_toolbar.", "query_counter."))]  # noqa: F405

USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

CSRF_COOKIE_SECURE = False   # https ishlatmaganingiz uchun shart emas

# ISH_REJASI 2.1: hostlar va CORS .env dan. Standart qiymat hozirgi serverni buzmaslik uchun avvalgicha ("*" va
# hamma uchun CORS); production'da aniq qiymat berilishi kerak — berilmasa `check --deploy` common.W003/W004 beradi.
# Frontend va API bitta domenda (nginx), shuning uchun CORS odatda umuman kerak emas.
from decouple import Csv, config as _config  # noqa: E402

ALLOWED_HOSTS = _config("ALLOWED_HOSTS", default="*,172.16.8.140,localhost,127.0.0.1", cast=Csv())
_CORS_ORIGINS = _config("CORS_ALLOWED_ORIGINS", default="", cast=Csv())
if _CORS_ORIGINS:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = _CORS_ORIGINS
else:
    CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = ["*"]
CSRF_TRUSTED_ORIGINS = [
    "http://172.16.8.140:8000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
