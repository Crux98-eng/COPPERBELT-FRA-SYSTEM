from rest_framework import serializers


class FarmerProfileSerializer(serializers.ModelSerializer):
    # DEPENDS ON: apps.farmers.models.Farmer — coordinate with Aliyon
    class Meta:
        model = None  # injected lazily in __new__
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")

    def __new__(cls, *args, **kwargs):
        from apps.farmers.models import Farmer  # DEPENDS ON: Farmer

        if cls.Meta.model is None:
            cls.Meta.model = Farmer
        return super().__new__(cls)
