"""Fraud Detection Engine - Django App

NANETU (Backend + AI) owns this entire app.

Implements two layers:
1. Synchronous pre-filter middleware — intercepts requests at middleware level
2. Async ML scoring — runs nightly via Celery to flag anomalous farmers
"""

default_app_config = 'apps.fraud.apps.FraudConfig'
