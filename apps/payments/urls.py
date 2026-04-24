from django.urls import path

from .views import PaymentHistoryAPIView

urlpatterns = [
    path("<int:payment_id>/history/", PaymentHistoryAPIView.as_view(), name="payment-history"),
]
