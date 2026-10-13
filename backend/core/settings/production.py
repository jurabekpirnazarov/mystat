from .base import *  # noqa

DEBUG = False   # faqat ishlashi uchun

USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

CSRF_COOKIE_SECURE = False   # https ishlatmaganingiz uchun shart emas

CORS_ALLOW_ALL_ORIGINS = True   # hamma joydan ishlasin
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = ["*"]

ALLOWED_HOSTS = ["*", "172.16.8.140", "localhost", "127.0.0.1"]
CSRF_TRUSTED_ORIGINS = [
    "http://172.16.8.140:8000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
