# config/__init__.py
# Celery setup will be imported here when celery is enabled
__all__ = ('celery_app',)

try:
    from .celery import app as celery_app
except ImportError:
    celery_app = None

