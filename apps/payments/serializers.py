from rest_framework import serializers


class PaymentHistorySerializer(serializers.ModelSerializer):
    # DEPENDS ON: apps.payments.models.PaymentHistory — coordinate with Aliyon
    class Meta:
        model = None
        fields = "__all__"

    def __new__(cls, *args, **kwargs):
        from apps.payments.models import PaymentHistory

        if cls.Meta.model is None:
            cls.Meta.model = PaymentHistory
        return super().__new__(cls)
