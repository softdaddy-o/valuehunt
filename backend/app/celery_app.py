"""Celery Application Configuration"""

from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

# Create Celery app
celery_app = Celery(
    "valuehunt",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Seoul",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
)

# Periodic tasks schedule
celery_app.conf.beat_schedule = {
    # Daily stock data collection - Every weekday at 6 AM
    "collect-stock-list-daily": {
        "task": "app.tasks.data_tasks.collect_stock_list_task",
        "schedule": crontab(hour=6, minute=0, day_of_week="1-5"),
    },
    # Daily price update - Every weekday at 4 PM (after market close)
    "collect-stock-prices-daily": {
        "task": "app.tasks.data_tasks.collect_all_stock_prices_task",
        "schedule": crontab(hour=16, minute=0, day_of_week="1-5"),
    },
    # Daily Value Score calculation - Every weekday at 7 PM
    "calculate-value-scores-daily": {
        "task": "app.tasks.data_tasks.calculate_all_value_scores_task",
        "schedule": crontab(hour=19, minute=0, day_of_week="1-5"),
    },
}
