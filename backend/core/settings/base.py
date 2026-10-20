# settings.py
import os
from pathlib import Path
from decouple import config
from datetime import timedelta
from ..jazzmin_conf import JAZZMIN_SETTINGS
# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-this-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)

# ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')
ALLOWED_HOSTS = ['*']

CSRF_TRUSTED_ORIGINS = [
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "http://172.16.8.140:8000",
    "http://apimy.stat.uz"
]

# Application definition
DJANGO_APPS = [
    "debug_toolbar",
    "jazzmin",
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    'query_counter',
    'ckeditor',
    'ckeditor_uploader',
    'import_export',
    'django_jsonform',
]

LOCAL_APPS = [
    'apps.accounts',
    'apps.common',
    'apps.contracts',
    'apps.monitoring',
    'apps.notifications',
    'apps.services',
    'apps.organizations',
    'apps.payment',
    'apps.book_market',
    'apps.additional_services',
    'apps.analytics',
    'apps.citizens',
    'apps.open_api',
    'apps.consultations',
    'apps.siat',
    'apps.credits',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

if DEBUG:
    MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware',
                   'query_counter.middleware.DjangoQueryCounterMiddleware'
                   ]

# Debug Toolbar sozlamalari
if DEBUG:
    INTERNAL_IPS = [
        '127.0.0.1',
        'localhost',
        '172.16.5.61'
    ]

    # Debug Toolbar konfiguratsiyasi
    DEBUG_TOOLBAR_CONFIG = {
        'SHOW_TOOLBAR_CALLBACK': lambda request: DEBUG,
        'SHOW_TEMPLATE_CONTEXT': True,
    }


ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

AUTH_USER_MODEL = "accounts.User"

WSGI_APPLICATION = 'core.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': config('DB_ENGINE', default='django.db.backends.sqlite3'),
        'NAME': config('DB_NAME', default=BASE_DIR / 'db.sqlite3'),
        'USER': config('DB_USER', default=''),
        'PASSWORD': config('DB_PASSWORD', default=''),
        'HOST': config('DB_HOST', default=''),
        'PORT': config('DB_PORT', default=''),
    }
}
# sslmode faqat PostgreSQL uchun (SQLite noma'lum opsiyada yiqiladi — CI testlari SQLite'da ishlaydi)
if DATABASES['default']['ENGINE'].endswith('postgresql'):
    DATABASES['default']['OPTIONS'] = {'sslmode': 'prefer'}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGES = (
    ('uz', 'Uzbek'),
    ('ru', 'Russian'),
    ('uz-Cyrl', 'Uzbek (Cyrillic)'),
)

# Internationalization
LANGUAGE_CODE = 'ru-Ru'
TIME_ZONE = 'Asia/Tashkent'
USE_I18N = True
USE_L10N = True
USE_TZ = True

LOCALE_PATHS = [
    BASE_DIR / 'locale',
]

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]
DATA_UPLOAD_MAX_MEMORY_SIZE = 500 * 1024 * 1024  # 500 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 500 * 1024 * 1024

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
# Faqat DEBUG: lokal media/ da yo'q fayllar shu manzildan olinadi (masalan https://my.stat.uz/media)
MEDIA_FALLBACK_URL = config('MEDIA_FALLBACK_URL', default='')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        # 'rest_framework.authentication.TokenAuthentication',
        # 'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    "DEFAULT_PAGINATION_CLASS": "apps.common.pagination.CustomLimitOffsetPagination",
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    # 'DEFAULT_THROTTLE_RATES': {
    #     'anon': '100/hour',
    #     'user': '1000/hour'
    # }
}

CKEDITOR_BASEPATH = "/static/ckeditor/ckeditor/"
CKEDITOR_UPLOAD_PATH = "uploads/"
CKEDITOR_RESTRICT_BY_DATE = True
CKEDITOR_FORCE_JPEG_COMPRESSION = True
CKEDITOR_IMAGE_BACKEND = "pillow"
CKEDITOR_ALLOW_NONIMAGE_FILES = True
CKEDITOR_CONFIGS = {
    "default": {
        # 'skin': 'moono',
        "toolbar": "full",
        "height": 300,
        "width": "100%",
        "extraPlugins": ",".join(["image"]),
        "extraAllowedContent": "figure figcaption",
    },
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=300),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'TOKEN_REFRESH_SERIALIZER': 'apps.accounts.serializers.OutstandingTokenRefreshSerializer',
}

# Spectacular (Swagger) Settings
SPECTACULAR_SETTINGS = {
    'TITLE': 'Django DRF API',
    'DESCRIPTION': 'API documentation',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SCHEMA_PATH_PREFIX': '/api/',
    
}

# CORS Settings
CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOW_CREDENTIALS = True

# Security Settings
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# Email Settings
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@example.com')

# Cache Settings
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://127.0.0.1:6379/1'),
    }
} if config('USE_REDIS', default=False, cast=bool) else {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}


PROVIDERS = {
    'click': {
        'url':config("CLICK_URL"),
        'merchant_id': config("MERCHANT_ID"),
        'merchant_service_id':config("MERCHANT_SERVICE_ID"),
        'merchant_user_id': config("MERCHANT_USER_ID"),
        'secret_key': config("CLICK_SECRET_KEY"),
    },
    'return_url': config("RETURN_URL"),
}

# GoodSign (DIDOX) stage — `common/didox/*` sinov endpoint'lari uchun (faqat admin)
GOODSIGN_TAX_ID = config('GOODSIGN_TAX_ID', default='')
GOODSIGN_PASSWORD = config('GOODSIGN_PASSWORD', default='')
GOODSIGN_COMPANY_ID = config('GOODSIGN_COMPANY_ID', default='')

# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'filters': {
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'filters': ['require_debug_true'],
            'class': 'logging.StreamHandler',
            'formatter': 'simple'
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'error.log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
        },
        'django.request': {
            'handlers': ['error_file'],
            'level': 'ERROR',
            'propagate': True,
        },
        'myapp': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
        'apps.payment': {  # Add logger for payment app
            'handlers': ['console', 'file', 'error_file'],
            'level': 'INFO',
            'propagate': False,  # Prevent logs from bubbling up to root logger
        },
    },
}

# Custom
API_VERSION = 'v1'
PAGINATION_PAGE_SIZE = config('PAGINATION_PAGE_SIZE', default=20, cast=int)
MAX_UPLOAD_SIZE = config('MAX_UPLOAD_SIZE', default=5242880, cast=int)  # 5MB

# Celery
CELERY_BROKER_URL = config('CELERY_BROKER_URL', default='redis://localhost:6379')
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default='redis://localhost:6379')
CELERY_ACCEPT_CONTENT = ['application/json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Celery Beat jadvali (B-06). Vaqtlar .env dan o'zgartiriladi; jadval egasi bilan tasdiqlanadi (ISH_REJASI OS-05).
from celery.schedules import crontab  # noqa: E402

CELERY_BEAT_SCHEDULE = {
    "didox-documents-check": {
        "task": "apps.contracts.tasks.periodic_didox_check",
        "schedule": config("BEAT_DIDOX_CHECK_MINUTES", default=15, cast=int) * 60,
    },
    "report-deadline-notifications": {
        "task": "apps.additional_services.tasks.send_report_notifications_task",
        "schedule": crontab(
            hour=config("BEAT_REPORT_NOTIFY_HOUR", default=9, cast=int),
            minute=config("BEAT_REPORT_NOTIFY_MINUTE", default=0, cast=int),
        ),
    },
    "report-reminder-notifications": {
        "task": "apps.additional_services.tasks.report_reminder_notifications_task",
        "schedule": crontab(
            hour=config("BEAT_REPORT_NOTIFY_HOUR", default=9, cast=int),
            minute=config("BEAT_REPORT_NOTIFY_MINUTE", default=0, cast=int),
        ),
    },
    # A-02: ko'rsatkich yangilanishlari (har soat) va oylik dayjest (har oyning 1-kuni 10:00)
    "indicator-updates": {
        "task": "apps.notifications.tasks.dispatch_indicator_updates",
        "schedule": crontab(minute=5),
    },
    "consultation-reminders": {
        "task": "apps.consultations.tasks.consultation_reminders",
        "schedule": 15 * 60,
    },
    "monthly-digest": {
        "task": "apps.notifications.tasks.monthly_digest",
        "schedule": crontab(day_of_month=1, hour=10, minute=0),
    },
    # SIAT_KARTA_TAHLIL KR-01: SIAT ko'rsatkichlari har kuni kechasi (faqat o'zgarganlari yuklanadi)
    "siat-sync": {
        "task": "apps.siat.tasks.sync_siat_task",
        "schedule": crontab(
            hour=config("BEAT_SIAT_SYNC_HOUR", default=3, cast=int),
            minute=config("BEAT_SIAT_SYNC_MINUTE", default=30, cast=int),
        ),
    },
    # JT-02: aholi soati — stat.uz hisoblagichi (u oy boshida yangilanadi); yangi nuqta bo'lsa qo'shiladi
    "population-clock-sync": {
        "task": "apps.siat.tasks.sync_population_clock_task",
        "schedule": crontab(minute=20, hour="*/6"),
    },
    # KORXONA_SCORING KR-40: muddati o'tgan kreditlar har kecha yopiladi
    "credits-expire": {
        "task": "apps.credits.tasks.expire_credits_task",
        "schedule": crontab(hour=2, minute=10),
    },
}

DIDOX_BASE_URL = config('DIDOX_BASE_URL', default='https://api.didox.com')
DIDOX_PARTNER_TOKEN = config('DIDOX_PARTNER_TOKEN', default='')
DIDOX_USER_PINFL = config('DIDOX_USER_PINFL', default='')
DIDOX_USER_PASSWORD = config('DIDOX_USER_PASSWORD', default='')

TELEGRAM_BOT_TOKEN = config('TELEGRAM_BOT_TOKEN', default='')
TELEGRAM_BOT_USERNAME = config('TELEGRAM_BOT_USERNAME', default='')

MAIN_URL = config('MAIN_URL', default='https://my.stat.uz')
SITE_URL = config('SITE_URL', default='https://my.stat.uz')
BACKEND_URL = config('BACKEND_URL', default='localhost:8000')
ONE_ID_CLIENT_ID = config('ONE_ID_CLIENT_ID', default='')
ONE_ID_CLIENT_SECRET = config('ONE_ID_CLIENT_SECRET', default='')

TESTING = config('TESTING', default=False, cast=bool)

DATA_UPLOAD_MAX_NUMBER_FIELDS = 20000


REGISTER_BASE_URL = config('REGISTER_BASE_URL', default='')

# ISH_REJASI 2.1: apps/accounts/throttles.py — login, parol tiklash, murojaat formalari (IP bo'yicha)
AUTH_THROTTLE_RATE = config('AUTH_THROTTLE_RATE', default='20/min')
FORM_THROTTLE_RATE = config('FORM_THROTTLE_RATE', default='30/hour')
X_DEVICE_ID = config('X_DEVICE_ID', default='')

# Admin URL — .env'dan konfiguratsiyalanadi (default: markaz/)
# Trailing slash bilan, leading slash'siz. Masalan: 'markaz/', 'boshqaruv/', 'cp/'
ADMIN_URL = config('ADMIN_URL', default='markaz/').strip('/') + '/'

# Admin 2FA + reCAPTCHA
RECAPTCHA_SITE_KEY = config('RECAPTCHA_SITE_KEY', default='')
RECAPTCHA_SECRET_KEY = config('RECAPTCHA_SECRET_KEY', default='')
RECAPTCHA_VERSION = config('RECAPTCHA_VERSION', default='v2')  # 'v2' yoki 'v3'
RECAPTCHA_SCORE_THRESHOLD = config('RECAPTCHA_SCORE_THRESHOLD', default=0.5, cast=float)
ADMIN_2FA_ISSUER = config('ADMIN_2FA_ISSUER', default='my.stat.uz Admin')
LOGIN_URL = '/' + ADMIN_URL + 'login/'