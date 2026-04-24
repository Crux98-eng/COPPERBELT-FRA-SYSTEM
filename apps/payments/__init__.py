"""Payments app - Django app configuration.

Primary domain owner: ALIYON (payment model, state machine)
NANETU owns:
  - Payment reconciliation logic
  - Payment retry logic (3 retries → manual review flag)
  - Payment history endpoint
"""

default_app_config = 'apps.payments.apps.PaymentsConfig'
