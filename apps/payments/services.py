def reconcile_payment_records(payment):
    # DEPENDS ON: apps.payments.models.ExternalPaymentLog — coordinate with Aliyon
    from apps.payments.models import ExternalPaymentLog

    log = (
        ExternalPaymentLog.objects.filter(reference=getattr(payment, "external_reference", None))
        .order_by("-created_at")
        .first()
    )
    if not log:
        return {"matched": False, "reason": "Missing external log"}

    internal_status = getattr(payment, "status", None)
    external_status = getattr(log, "status", None)
    matched = internal_status == external_status

    if not matched and hasattr(payment, "reconciliation_status"):
        payment.reconciliation_status = "MISMATCH"
        payment.save(update_fields=["reconciliation_status"])

    return {"matched": matched, "internal_status": internal_status, "external_status": external_status}
