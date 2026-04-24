from django.urls import path

from .views import FarmerProfileDetailAPIView

urlpatterns = [
    path("<int:farmer_id>/profile/", FarmerProfileDetailAPIView.as_view(), name="farmer-profile-detail"),
]
