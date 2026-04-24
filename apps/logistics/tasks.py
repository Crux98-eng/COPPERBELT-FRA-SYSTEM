import base64
from io import BytesIO
from celery import shared_task
from django.conf import settings
import logging
import qrcode

logger = logging.getLogger(__name__)


def _create_qr_payload(batch):
    return f"FRA-BATCH:{batch.id}:{getattr(batch, 'farmer_id', 'NA')}"


@shared_task
def generate_qr_code_on_collection(produce_batch_id: int):
    # DEPENDS ON: apps.logistics.models.ProduceBatch — coordinate with Aliyon
    from apps.logistics.models import ProduceBatch

    batch = ProduceBatch.objects.get(pk=produce_batch_id)
    qr = qrcode.make(_create_qr_payload(batch))
    buffer = BytesIO()
    qr.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    if hasattr(batch, "qr_code"):
        batch.qr_code = encoded
    if hasattr(batch, "status"):
        batch.status = "COLLECTED"
    fields = [f for f in ["qr_code", "status"] if hasattr(batch, f)]
    if fields:
        batch.save(update_fields=fields)
    return {"status": "success", "data": {"batch_id": batch.id, "qr_code": encoded}, "message": "QR generated."}


def evaluate_weight_discrepancy(received_weight: float, dispatched_weight: float):
    threshold = float(getattr(settings, "WEIGHT_VARIANCE_THRESHOLD", 0.1))
    variance_ratio = abs(dispatched_weight - received_weight) / max(dispatched_weight, 1.0)
    return variance_ratio > threshold, variance_ratio


@shared_task
def detect_weight_discrepancies():
    # DEPENDS ON: apps.logistics.models.ProduceBatch — coordinate with Aliyon
    from apps.logistics.models import ProduceBatch

    flagged = []
    for batch in ProduceBatch.objects.all():
        rw = float(getattr(batch, "received_weight", 0) or 0)
        dw = float(getattr(batch, "dispatched_weight", 0) or 0)
        if dw <= 0:
            continue
        is_flagged, ratio = evaluate_weight_discrepancy(rw, dw)
        if is_flagged and hasattr(batch, "discrepancy_flag"):
            batch.discrepancy_flag = True
            batch.save(update_fields=["discrepancy_flag"])
            flagged.append({"batch_id": batch.id, "variance_ratio": ratio})
    return {"status": "success", "data": {"flagged_batches": flagged}, "message": "Weight discrepancy scan complete."}
