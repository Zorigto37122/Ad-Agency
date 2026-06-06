import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from worker import celery_app
from core.config import settings
from database import SessionLocal

logger = logging.getLogger(__name__)


def _send_smtp(to: str, subject: str, body_html: str) -> None:
    if not settings.smtp_user:
        logger.info("SMTP not configured — skipping email to %s: %s", to, subject)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from
    msg["To"] = to
    msg.attach(MIMEText(body_html, "html"))

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.starttls()
        server.login(settings.smtp_user, settings.smtp_password)
        server.sendmail(settings.smtp_from, to, msg.as_string())

    logger.info("Email sent to %s: %s", to, subject)


@celery_app.task(name="tasks.email_tasks.send_order_notification", bind=True, max_retries=3)
def send_order_notification(self, order_id: int, event: str) -> dict:
    from models.order import Order
    from models.client import Client

    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return {"status": "skipped", "reason": "order not found"}

        client = db.query(Client).filter(Client.id == order.client_id).first()
        if not client or not client.email:
            return {"status": "skipped", "reason": "no client email"}

        subject_map = {
            "created": f"Заказ #{order_id} создан",
            "updated": f"Заказ #{order_id} обновлён",
            "done": f"Заказ #{order_id} выполнен",
            "cancelled": f"Заказ #{order_id} отменён",
        }
        subject = subject_map.get(event, f"Обновление по заказу #{order_id}")

        body = f"""
        <h2>{subject}</h2>
        <p>Уважаемый {client.name},</p>
        <p>Статус вашего заказа <strong>«{order.title}»</strong> изменился.</p>
        <p>Текущий статус: <strong>{order.status.value}</strong></p>
        <p>Сумма: <strong>{order.total_price} ₽</strong></p>
        <hr>
        <p style="color:#888">Это автоматическое уведомление — не отвечайте на него.</p>
        """

        _send_smtp(client.email, subject, body)
        return {"status": "sent", "to": client.email}
    except Exception as exc:
        logger.exception("send_order_notification failed for order %s", order_id)
        raise self.retry(exc=exc, countdown=60)
    finally:
        db.close()


@celery_app.task(name="tasks.email_tasks.send_payment_confirmation", bind=True, max_retries=3)
def send_payment_confirmation(self, payment_id: int) -> dict:
    from models.payment import Payment, Invoice
    from models.order import Order
    from models.client import Client

    db = SessionLocal()
    try:
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            return {"status": "skipped", "reason": "payment not found"}

        invoice = db.query(Invoice).filter(Invoice.id == payment.invoice_id).first()
        order = db.query(Order).filter(Order.id == invoice.order_id).first() if invoice else None
        client = db.query(Client).filter(Client.id == order.client_id).first() if order else None
        if not client or not client.email:
            return {"status": "skipped", "reason": "no client email"}

        body = f"""
        <h2>Платёж подтверждён</h2>
        <p>Уважаемый {client.name},</p>
        <p>Мы получили ваш платёж на сумму <strong>{payment.amount} ₽</strong>.</p>
        {"<p>Заказ: <strong>" + order.title + "</strong></p>" if order else ""}
        <p>Дата: <strong>{payment.payment_date}</strong></p>
        <hr>
        <p style="color:#888">Это автоматическое уведомление — не отвечайте на него.</p>
        """

        _send_smtp(client.email, f"Подтверждение платежа #{payment_id}", body)
        return {"status": "sent", "to": client.email}
    except Exception as exc:
        logger.exception("send_payment_confirmation failed for payment %s", payment_id)
        raise self.retry(exc=exc, countdown=60)
    finally:
        db.close()
