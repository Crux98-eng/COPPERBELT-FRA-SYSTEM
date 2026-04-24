from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FraudFlag
from .serializers import FraudFlagSerializer, FraudScoreSerializer
from .tasks import score_farmer_async


class FraudFlagsListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        queryset = FraudFlag.objects.filter(status="FLAGGED").select_related("farmer").order_by("-created_at")
        serializer = FraudFlagSerializer(queryset, many=True)
        return Response(
            {"status": "success", "data": serializer.data, "message": "Flagged farmers list retrieved."},
            status=status.HTTP_200_OK,
        )


class FraudManualRescoreAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, farmer_id):
        # DEPENDS ON: apps.farmers.models.Farmer — coordinate with Aliyon
        from apps.farmers.models import Farmer
        from .models import FraudScore

        farmer = get_object_or_404(Farmer.objects.all(), pk=farmer_id)
        score_farmer_async(farmer.id)
        latest = FraudScore.objects.filter(farmer=farmer).order_by("-scored_at").first()
        data = FraudScoreSerializer(latest).data if latest else {}
        return Response(
            {"status": "success", "data": data, "message": "Farmer re-score completed."},
            status=status.HTTP_200_OK,
        )
