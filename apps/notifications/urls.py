from django.urls import path

from .views import sms_dispatch, ussd_callback

urlpatterns = [
    path("ussd/", ussd_callback, name="notifications-ussd"),
    path("sms/", sms_dispatch, name="notifications-sms"),
]
