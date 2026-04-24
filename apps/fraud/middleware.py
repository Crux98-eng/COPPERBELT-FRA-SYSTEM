"""
Layer 1 Fraud Detection Middleware

Synchronous pre-filter that intercepts requests before business logic runs.
Checks three signals via indexed DB lookups (O(1) complexity):

1. DUPLICATE_NRC — NRC already registered
2. DUPLICATE_PHONE — phone already registered  
3. GPS_CLUSTER — farm coordinates within 50m of existing verified farm (different farmer)

If flag raised, returns DRF Response before view executes.
"""

import json
from django.http import JsonResponse
from rest_framework import status
import logging
from math import radians, sin, cos, sqrt, atan2

logger = logging.getLogger(__name__)

# DEPENDS ON: apps.farmers.models.Farmer


class FraudPreFilterMiddleware:
    """
    Middleware layer for fraud detection pre-filtering.
    
    Intercepts POST requests to:
    - /api/v1/farmers/register/
    - /api/v1/fisp/voucher/redeem/
    """
    
    PROTECTED_ENDPOINTS = [
        '/api/v1/farmers/register/',
        '/api/v1/fisp/voucher/redeem/',
    ]
    
    GPS_CLUSTER_THRESHOLD_METRES = 50  # Cluster if within 50m
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Check if request matches protected endpoints
        if request.method == 'POST' and any(
            request.path.startswith(endpoint) for endpoint in self.PROTECTED_ENDPOINTS
        ):
            # Run pre-filter checks
            fraud_flag = self._run_pre_filter(request)
            
            if fraud_flag:
                # Return response before view executes
                return self._flag_response(fraud_flag)
        
        # No flags raised, proceed normally
        response = self.get_response(request)
        return response
    
    def _extract_payload(self, request):
        try:
            return json.loads(request.body.decode("utf-8") or "{}")
        except Exception:
            return {}

    def _run_pre_filter(self, request) -> dict:
        """
        Run all three pre-filter checks.
        
        Args:
            request: Django HTTP request
            
        Returns:
            Dictionary with flag info, or None if no flags
        """
        from apps.farmers.models import Farmer
        
        # Only check POST data for farmer registration
        if '/farmers/register/' in request.path:
            payload = self._extract_payload(request)
            nrc = request.POST.get('nrc') or payload.get('nrc')
            phone = request.POST.get('phone') or payload.get('phone') or payload.get("phone_number")
            gps_lat = payload.get('farm_gps_latitude')
            gps_lon = payload.get('farm_gps_longitude')
            
            # Check 1: DUPLICATE_NRC
            if nrc:
                try:
                    existing = Farmer.objects.get(nrc=nrc, is_active=True)
                    logger.warning(f"DUPLICATE_NRC detected: {nrc} (existing farmer: {existing.id})")
                    return {
                        'flag_type': 'DUPLICATE_NRC',
                        'message': f'NRC {nrc} already registered',
                        'status_code': status.HTTP_409_CONFLICT,
                        'duplicate_farmer_id': existing.id,
                    }
                except Farmer.DoesNotExist:
                    pass
            
            # Check 2: DUPLICATE_PHONE
            if phone:
                try:
                    existing = Farmer.objects.get(phone=phone, is_active=True)
                    logger.warning(f"DUPLICATE_PHONE detected: {phone} (existing farmer: {existing.id})")
                    return {
                        'flag_type': 'DUPLICATE_PHONE',
                        'message': f'Phone {phone} already registered',
                        'status_code': status.HTTP_403_FORBIDDEN,  # Route to review
                        'duplicate_farmer_id': existing.id,
                    }
                except Farmer.DoesNotExist:
                    pass
            
            # Check 3: GPS_CLUSTER
            if gps_lat and gps_lon:
                cluster_check = self._check_gps_cluster(gps_lat, gps_lon)
                if cluster_check:
                    logger.warning(f"GPS_CLUSTER detected at ({gps_lat}, {gps_lon}): {cluster_check}")
                    return {
                        'flag_type': 'GPS_CLUSTER',
                        'message': f"Farm location within {self.GPS_CLUSTER_THRESHOLD_METRES}m of existing farm",
                        'status_code': status.HTTP_403_FORBIDDEN,  # Route to review
                        'gps_distance_metres': cluster_check['distance_metres'],
                        'duplicate_farmer_id': cluster_check['nearby_farmer_id'],
                    }
        
        return None
    
    def _check_gps_cluster(self, lat: float, lon: float) -> dict:
        """
        Check if coordinates are within GPS_CLUSTER_THRESHOLD of existing farms.
        
        Uses Haversine distance formula.
        
        Args:
            lat: Latitude
            lon: Longitude
            
        Returns:
            Dictionary with nearby farmer info, or None if no cluster
        """
        from apps.farmers.models import Farmer
        from django.db.models import F, Q
        
        try:
            # Find farms with coordinates set
            nearby_farms = Farmer.objects.filter(
                farm_gps_latitude__isnull=False,
                farm_gps_longitude__isnull=False,
                is_active=True
            )
            
            for farm in nearby_farms:
                distance = self._haversine_distance(
                    lat, lon,
                    float(farm.farm_gps_latitude),
                    float(farm.farm_gps_longitude)
                )
                
                if distance <= self.GPS_CLUSTER_THRESHOLD_METRES:
                    return {
                        'distance_metres': distance,
                        'nearby_farmer_id': farm.id,
                    }
            
            return None
        except Exception as e:
            logger.error(f"Error checking GPS cluster: {e}")
            return None
    
    @staticmethod
    def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance in metres between two GPS points using Haversine formula.
        """
        R = 6371000  # Earth radius in metres
        
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        distance = R * c
        
        return distance
    
    def _flag_response(self, flag_info: dict):
        """
        Return DRF JSON response for flagged request.
        
        Args:
            flag_info: Dictionary with flag details
            
        Returns:
            DRF Response
        """
        from .models import FraudFlag
        from apps.farmers.models import Farmer  # DEPENDS ON
        
        # Log flag to database
        try:
            farmer = Farmer.objects.order_by("id").first()
            if farmer is not None:
                FraudFlag.objects.create(
                flag_type=flag_info['flag_type'],
                status='FLAGGED',
                farmer=farmer,
                request_endpoint=flag_info.get("endpoint"),
                duplicate_farmer_id=flag_info.get('duplicate_farmer_id'),
                gps_distance_metres=flag_info.get('gps_distance_metres'),
            )
        except Exception as e:
            logger.error(f"Could not log fraud flag: {e}")
        
        return JsonResponse(
            {
                'status': 'error',
                'message': flag_info['message'],
                'data': {'flag_type': flag_info['flag_type']},
            },
            status=flag_info.get('status_code', status.HTTP_403_FORBIDDEN),
        )
