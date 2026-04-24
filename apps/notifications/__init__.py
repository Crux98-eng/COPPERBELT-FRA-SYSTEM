"""Notifications app - Django app configuration.

Primary domain owner: ALIYON (notification templates, settings)
NANETU owns:
  - Africa's Talking SMS adapter
  - Async SMS dispatch tasks
  - USSD session handler
"""

default_app_config = 'apps.notifications.apps.NotificationsConfig'
