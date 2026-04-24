from django.urls import path

from .views import FraudFlagsListAPIView, FraudManualRescoreAPIView

urlpatterns = [
    path("flags/", FraudFlagsListAPIView.as_view(), name="fraud-flags"),
    path("score/<int:farmer_id>/", FraudManualRescoreAPIView.as_view(), name="fraud-manual-rescore"),
]
