from django.apps import apps
from django.db.models.signals import post_save

from .tasks import handle_deposit_confirmation


def trigger_code_on_deposit_confirmation(sender, instance, created, **kwargs):
    if getattr(instance, "status", None) == "CONFIRMED" and getattr(instance, "voucher_id", None):
        handle_deposit_confirmation.delay(instance.voucher_id)


def register_deposit_confirmation_signal():
    # DEPENDS ON: apps.payments.models.Payment — coordinate with Aliyon
    payment_model = apps.get_model("payments", "Payment")
    post_save.connect(trigger_code_on_deposit_confirmation, sender=payment_model, weak=False)
