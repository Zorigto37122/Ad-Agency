from celery import Celery
from core.config import settings

celery_app = Celery(
    "ad_agency",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["tasks.email_tasks", "tasks.report_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    task_routes={
        "tasks.email_tasks.*": {"queue": "emails"},
        "tasks.report_tasks.*": {"queue": "reports"},
    },
)
