import os

from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.production')

app = Celery('core')
# settings'dagi CELERY_* sozlamalarini o'qiydi (CELERY_BROKER_URL va h.k.)
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
