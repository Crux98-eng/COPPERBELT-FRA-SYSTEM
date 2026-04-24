"""FISP (Food Insecurity Safety Programme) voucher app.

Primary domain owner: ALIYON (voucher state machine, registration)
NANETU owns:
  - Auto redeeming code generation
  - Voucher expiry and grace period logic
"""

default_app_config = 'apps.fisp.apps.FISPConfig'
