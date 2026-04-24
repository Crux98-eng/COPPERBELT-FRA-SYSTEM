from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import PaymentHistorySerializer


class PaymentHistoryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, payment_id):
        # DEPENDS ON: apps.payments.models.Payment, apps.payments.models.PaymentHistory
        from apps.payments.models import Payment, PaymentHistory

        payment = get_object_or_404(Payment.objects.all(), pk=payment_id)
        queryset = PaymentHistory.objects.filter(payment=payment).order_by("-created_at")
        paginator = Paginator(queryset, int(request.query_params.get("page_size", 20)))
        page_number = int(request.query_params.get("page", 1))
        page_obj = paginator.get_page(page_number)
        serializer = PaymentHistorySerializer(page_obj.object_list, many=True)
        return Response(
            {
                "status": "success",
                "data": {
                    "count": paginator.count,
                    "next": page_number + 1 if page_obj.has_next() else None,
                    "previous": page_number - 1 if page_obj.has_previous() else None,
                    "results": serializer.data,
                },
                "message": "Payment history retrieved.",
            },
            status=status.HTTP_200_OK,
        )
