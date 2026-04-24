"""Notifications endpoints for USSD and SMS."""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .sms_ussd import USSDSessionHandler, dispatch_event_sms
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
def ussd_callback(request):
    """
    Handle USSD callback from Africa's Talking.
    
    Expected POST data:
    - sessionId
    - phoneNumber
    - text (user input)
    - networkCode
    
    Returns:
    - USSD response menu
    """
    try:
        phone = request.query_params.get('phoneNumber', '')
        text = request.query_params.get('text', '')
        session_id = request.query_params.get('sessionId', '')
        network_code = request.query_params.get('serviceCode', '')
        
        if not phone or not session_id:
            return Response({'status': 'error', 'data': {}, 'message': 'Missing required fields'}, status=400)
        
        # Handle USSD session
        handler = USSDSessionHandler()
        response_menu = handler.handle_ussd_callback(phone, text, session_id, network_code)
        
        logger.info(f"USSD response sent to {phone}")
        
        return Response({'status': 'success', 'data': {'response': response_menu}, 'message': 'USSD handled.'}, status=200)
        
    except Exception as e:
        logger.exception(f"USSD callback error: {e}")
        return Response({'status': 'error', 'data': {}, 'message': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sms_dispatch(request):
    farmer_id = request.data.get("farmer_id")
    event = request.data.get("event")
    message = request.data.get("message")
    # DEPENDS ON: apps.farmers.models.Farmer.phone_number — coordinate with Aliyon
    from apps.farmers.models import Farmer

    farmer = Farmer.objects.filter(pk=farmer_id).first()
    if not farmer:
        return Response({'status': 'error', 'data': {}, 'message': 'Farmer not found.'}, status=404)
    phone = getattr(farmer, "phone_number", None) or getattr(farmer, "phone", None)
    if not phone:
        return Response({'status': 'error', 'data': {}, 'message': 'Farmer phone missing.'}, status=400)

    result = dispatch_event_sms(event=event, recipients=[phone], message=message)
    code = 200 if result["status"] == "success" else 400
    return Response(result, status=code)
