from django.apps import AppConfig


class FispConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.fisp"

    def ready(self):
        try:
            from .signals import register_deposit_confirmation_signal

            register_deposit_confirmation_signal()
        except Exception:
            pass
