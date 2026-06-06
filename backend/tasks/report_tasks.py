import csv
import logging
import os
from datetime import datetime

from worker import celery_app
from database import SessionLocal

logger = logging.getLogger(__name__)

REPORTS_DIR = os.environ.get("REPORTS_DIR", "/app/uploads/reports")


def _ensure_reports_dir() -> None:
    os.makedirs(REPORTS_DIR, exist_ok=True)


@celery_app.task(name="tasks.report_tasks.generate_campaign_report", bind=True, max_retries=2)
def generate_campaign_report(self, campaign_id: int) -> dict:
    from models.campaign import Campaign
    from models.order import Order

    db = SessionLocal()
    try:
        _ensure_reports_dir()

        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            return {"status": "error", "reason": "campaign not found"}

        orders = db.query(Order).filter(Order.campaign_id == campaign_id).all()

        filename = f"campaign_{campaign_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        filepath = os.path.join(REPORTS_DIR, filename)

        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["order_id", "title", "status", "total_price", "created_at", "deadline"])
            for o in orders:
                writer.writerow([
                    o.id,
                    o.title,
                    o.status.value,
                    o.total_price,
                    o.created_at.isoformat() if o.created_at else "",
                    o.deadline.isoformat() if o.deadline else "",
                ])

        logger.info("Campaign report generated: %s (%d orders)", filename, len(orders))
        return {"status": "done", "file": filename, "orders": len(orders)}
    except Exception as exc:
        logger.exception("generate_campaign_report failed for campaign %s", campaign_id)
        raise self.retry(exc=exc, countdown=30)
    finally:
        db.close()


@celery_app.task(name="tasks.report_tasks.generate_client_report", bind=True, max_retries=2)
def generate_client_report(self, client_id: int) -> dict:
    from models.client import Client
    from models.order import Order
    from models.payment import Payment

    db = SessionLocal()
    try:
        _ensure_reports_dir()

        client = db.query(Client).filter(Client.id == client_id).first()
        if not client:
            return {"status": "error", "reason": "client not found"}

        orders = db.query(Order).filter(Order.client_id == client_id).all()
        order_ids = [o.id for o in orders]
        payments = db.query(Payment).filter(Payment.order_id.in_(order_ids)).all() if order_ids else []

        filename = f"client_{client_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        filepath = os.path.join(REPORTS_DIR, filename)

        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["section", "id", "title_or_description", "amount", "status", "date"])
            for o in orders:
                writer.writerow([
                    "order",
                    o.id,
                    o.title,
                    o.total_price,
                    o.status.value,
                    o.created_at.isoformat() if o.created_at else "",
                ])
            for p in payments:
                writer.writerow([
                    "payment",
                    p.id,
                    f"order#{p.order_id}",
                    p.amount,
                    p.status.value if hasattr(p.status, "value") else p.status,
                    p.payment_date.isoformat() if p.payment_date else "",
                ])

        logger.info("Client report generated: %s", filename)
        return {"status": "done", "file": filename, "orders": len(orders), "payments": len(payments)}
    except Exception as exc:
        logger.exception("generate_client_report failed for client %s", client_id)
        raise self.retry(exc=exc, countdown=30)
    finally:
        db.close()
