from datetime import timedelta
import secrets
from celery import shared_task
from django.conf import settings
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


def _new_code():
    return f"FISP-{secrets.token_hex(4).upper()}"


@shared_task
def generate_redemption_codes_batch():
    # DEPENDS ON: apps.fisp.models.Voucher — coordinate with Aliyon
    from apps.fisp.models import Voucher

    updated = 0
    for voucher in Voucher.objects.filter(redeeming_code__isnull=True):
        voucher.redeeming_code = _new_code()
        voucher.save(update_fields=["redeeming_code"])
        updated += 1
    return {"status": "success", "data": {"generated": updated}, "message": "Redeeming codes generated."}


@shared_task
def handle_deposit_confirmation(voucher_id: int):
    # Triggerable via signal/service when deposit is confirmed.
    from apps.fisp.models import Voucher  # DEPENDS ON: Voucher

    voucher = Voucher.objects.get(pk=voucher_id)
    if not getattr(voucher, "redeeming_code", None):
        voucher.redeeming_code = _new_code()
    if hasattr(voucher, "deposit_confirmed_at"):
        voucher.deposit_confirmed_at = timezone.now()
    voucher.save()
    return {"status": "success", "data": {"voucher_id": voucher.id, "redeeming_code": voucher.redeeming_code}, "message": "Code issued on deposit confirmation."}


@shared_task
def apply_voucher_expiry_and_grace():
    # DEPENDS ON: apps.fisp.models.Voucher — coordinate with Aliyon
    from apps.fisp.models import Voucher

    expiry_days = int(getattr(settings, "VOUCHER_EXPIRY_DAYS", 14))
    grace_days = int(getattr(settings, "VOUCHER_GRACE_DAYS", 3))
    now = timezone.now()
    expired = 0
    grace = 0
    for voucher in Voucher.objects.filter(status__in=["ISSUED", "EXPIRED"]):
        issued_at = getattr(voucher, "issued_at", None) or getattr(voucher, "created_at", None)
        if not issued_at:
            continue
        expiry_at = issued_at + timedelta(days=expiry_days)
        grace_until = expiry_at + timedelta(days=grace_days)
        if now > expiry_at and now <= grace_until and hasattr(voucher, "within_grace_period"):
            voucher.status = "EXPIRED"
            voucher.within_grace_period = True
            grace += 1
            voucher.save(update_fields=["status", "within_grace_period"])
        elif now > grace_until:
            voucher.status = "EXPIRED"
            if hasattr(voucher, "within_grace_period"):
                voucher.within_grace_period = False
                voucher.save(update_fields=["status", "within_grace_period"])
            else:
                voucher.save(update_fields=["status"])
            expired += 1
    return {
        "status": "success",
        "data": {"expired": expired, "grace_period": grace, "expiry_days": expiry_days},
        "message": "Voucher expiry and grace period applied.",
    }


def approve_voucher_grace(voucher, agent_user):
    # DEPENDS ON: Voucher.grace_approved_by/grace_approved_at — coordinate with Aliyon
    voucher.status = "APPROVED_IN_GRACE"
    if hasattr(voucher, "grace_approved_by"):
        voucher.grace_approved_by = agent_user
    if hasattr(voucher, "grace_approved_at"):
        voucher.grace_approved_at = timezone.now()
    voucher.save()
