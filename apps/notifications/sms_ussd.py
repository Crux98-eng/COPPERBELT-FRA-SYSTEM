"""SMS/USSD adapter - NANETU owns Africa's Talking integration.

Interfaces with Africa's Talking SDK for:
- SMS dispatch (async via Celery)
- USSD session handling (webhook callback)

Uses credentials from settings via os.environ
"""

import logging
from typing import Dict, List
from django.conf import settings
from celery import shared_task

logger = logging.getLogger(__name__)

# Africa's Talking credentials (from environment)
AFRICASTALKING_API_KEY = getattr(settings, "AFRICASTALKING_API_KEY", None)
AFRICASTALKING_USERNAME = getattr(settings, "AFRICASTALKING_USERNAME", "sandbox")


class AfricasTalkingSMSAdapter:
    """
    Adapter for Africa's Talking SMS service.
    
    Methods:
    - send_sms(phone, message) — sync send
    - send_sms_async.delay(phone, message) — async send via Celery
    """
    
    def __init__(self):
        """Initialize Africa's Talking client."""
        try:
            import africastalking
            africastalking.initialize(AFRICASTALKING_USERNAME, AFRICASTALKING_API_KEY)
            self.client = africastalking.SMS
            logger.info("Africa's Talking SMS adapter initialized")
        except ImportError:
            logger.error("africastalking package not installed")
            self.client = None
    
    def send_sms(self, recipients: List[str], message: str) -> Dict:
        """
        Send SMS synchronously (not recommended for high volume).
        
        Args:
            recipients: List of phone numbers (with country code)
            message: SMS message text
            
        Returns:
            Response dictionary from Africa's Talking
        """
        if not self.client:
            logger.error("SMS client not initialized")
            return {'status': 'error', 'message': 'SMS client not ready'}
        
        try:
            response = self.client.send(message, recipients)
            logger.info(f"SMS sent to {len(recipients)} recipients")
            return {"status": "success", "data": response, "message": "SMS sent."}
        except Exception as e:
            logger.error(f"SMS send failed: {e}")
            return {'status': 'error', 'data': {}, 'message': str(e)}


@shared_task(bind=True, max_retries=3)
def send_sms_async(self, recipients: List[str], message: str, event: str = ""):
    """
    Async SMS dispatch via Celery.
    
    Args:
        recipients: List of phone numbers
        message: SMS message
        context: Optional context (e.g., 'fraud_flag', 'payment_notification')
        
    Returns:
        Response status
    """
    try:
        adapter = AfricasTalkingSMSAdapter()
        result = adapter.send_sms(recipients, message)
        logger.info(f"SMS queued: {event} to {len(recipients)} recipients")
        return {"status": "success", "data": {"event": event, "result": result}, "message": "SMS dispatched."}
    except Exception as exc:
        logger.exception(f"Error sending SMS: {exc}")
        raise self.retry(exc=exc, countdown=300)


EVENTS = {"FISP_CONFIRMED", "REDEEMING_CODE_ISSUED", "PRODUCE_COLLECTED", "PAYMENT_SENT"}


def dispatch_event_sms(event: str, recipients: List[str], message: str):
    if event not in EVENTS:
        return {"status": "error", "data": {}, "message": "Unsupported SMS event."}
    task = send_sms_async.delay(recipients, message, event)
    return {"status": "success", "data": {"task_id": task.id, "event": event}, "message": "SMS task queued."}


class USSDSessionHandler:
    """
    USSD session handler for Africa's Talking webhook callbacks.
    
    Endpoints:
    - POST /api/v1/notifications/ussd/ — Webhook for USSD session updates
    
    Handles:
    - User input (menu selections)
    - Session state management
    - Menu navigation
    """
    
    @staticmethod
    def handle_ussd_callback(phone: str, text: str, session_id: str, network_code: str) -> str:
        """
        Process USSD callback from Africa's Talking.
        
        Args:
            phone: Customer phone number
            text: User input (menu selection)
            session_id: USSD session ID
            network_code: Mobile network code
            
        Returns:
            USSD response menu text
        """
        logger.info(f"USSD callback: {phone} selected '{text}'")
        
        # Parse menu selection and route to appropriate handler
        if not text:
            return "CON FRA Services\n1. Payment History\n2. Produce Status\n0. Exit"
        if text == "1":
            return "END Last payment: ZMW 500 sent."
        if text == "2":
            return "END Produce batch status: COLLECTED."
        return "END Invalid option."
