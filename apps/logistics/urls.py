from django.urls import path

from .views import BatchCollectAPIView, BatchReceiveAPIView

urlpatterns = [
    path("batch/<int:batch_id>/receive/", BatchReceiveAPIView.as_view(), name="logistics-batch-receive"),
    path("batch/<int:batch_id>/collect/", BatchCollectAPIView.as_view(), name="logistics-batch-collect"),
]
