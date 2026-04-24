from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import CanManageFarmerProfile
from .serializers import FarmerProfileSerializer


class FarmerProfileDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, CanManageFarmerProfile]

    def get_object(self, farmer_id):
        from apps.farmers.models import Farmer  # DEPENDS ON: Farmer

        return get_object_or_404(Farmer.objects.all(), pk=farmer_id)

    def get(self, request, farmer_id):
        farmer = self.get_object(farmer_id)
        self.check_object_permissions(request, farmer)
        serializer = FarmerProfileSerializer(farmer)
        return Response(
            {"status": "success", "data": serializer.data, "message": "Farmer profile fetched."},
            status=status.HTTP_200_OK,
        )

    def put(self, request, farmer_id):
        farmer = self.get_object(farmer_id)
        self.check_object_permissions(request, farmer)
        serializer = FarmerProfileSerializer(farmer, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"status": "success", "data": serializer.data, "message": "Farmer profile updated."},
            status=status.HTTP_200_OK,
        )
