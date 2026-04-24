from celery import shared_task
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def process_payment_with_retries(self, payment_id: int):
    # DEPENDS ON: apps.payments.models.Payment — coordinate with Aliyon
    from apps.payments.models import Payment

    payment = Payment.objects.get(pk=payment_id)
    try:
        if hasattr(payment, "process"):
            payment.process()
        payment.status = "SUCCESS"
        payment.save(update_fields=["status"])
        return {"status": "success", "data": {"payment_id": payment_id}, "message": "Payment processed."}
    except Exception as exc:
        retries = self.request.retries + 1
        if retries >= 3:
            payment.status = "MANUAL_REVIEW"
            if hasattr(payment, "requires_admin_review"):
                payment.requires_admin_review = True
                payment.save(update_fields=["status", "requires_admin_review"])
            else:
                payment.save(update_fields=["status"])
            return {
                "status": "error",
                "data": {"payment_id": payment_id, "retries": retries},
                "message": "Payment moved to manual review after retries.",
            }
        raise self.retry(exc=exc)


@shared_task
def reconcile_payments_with_providers():
    # DEPENDS ON: apps.payments.models.Payment, apps.payments.models.ExternalPaymentLog — coordinate with Aliyon
    from apps.payments.models import Payment
    from apps.payments.services import reconcile_payment_records

    reconciled = 0
    mismatches = []
    for payment in Payment.objects.all():
        result = reconcile_payment_records(payment)
        reconciled += 1
        if not result["matched"]:
            mismatches.append(payment.id)

    return {
        "status": "success",
        "data": {"reconciled": reconciled, "mismatches": mismatches, "run_at": timezone.now().isoformat()},
        "message": "Payment reconciliation completed.",
    }
