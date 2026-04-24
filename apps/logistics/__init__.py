"""Logistics app - Django app configuration.

Primary domain owner: ALIYON (produce model, state machine)
NANETU owns:
  - QR code generation on COLLECTED transition
  - Weight discrepancy detection
"""

default_app_config = 'apps.logistics.apps.LogisticsConfig'
