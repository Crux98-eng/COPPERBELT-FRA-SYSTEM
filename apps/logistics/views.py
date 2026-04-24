from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .tasks import evaluate_weight_discrepancy, generate_qr_code_on_collection


class BatchReceiveAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, batch_id):
        # DEPENDS ON: apps.logistics.models.ProduceBatch — coordinate with Aliyon
        from apps.logistics.models import ProduceBatch

        batch = get_object_or_404(ProduceBatch.objects.all(), pk=batch_id)
        received_weight = float(request.data.get("received_weight", 0))
        dispatched_weight = float(request.data.get("dispatched_weight", 0))
        flagged, variance_ratio = evaluate_weight_discrepancy(received_weight, dispatched_weight)
        for field, value in {
            "received_weight": received_weight,
            "dispatched_weight": dispatched_weight,
            "discrepancy_flag": flagged,
        }.items():
            if hasattr(batch, field):
                setattr(batch, field, value)
        save_fields = [f for f in ["received_weight", "dispatched_weight", "discrepancy_flag"] if hasattr(batch, f)]
        if save_fields:
            batch.save(update_fields=save_fields)
        return Response(
            {
                "status": "success",
                "data": {"batch_id": batch.id, "discrepancy_flag": flagged, "variance_ratio": variance_ratio},
                "message": "Batch receive processed.",
            },
            status=status.HTTP_200_OK,
        )


class BatchCollectAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, batch_id):
        result = generate_qr_code_on_collection(produce_batch_id=batch_id)
        return Response(result, status=status.HTTP_200_OK)
