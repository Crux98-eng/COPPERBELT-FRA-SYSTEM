"""
Feature Engineering Pipeline for FRA Fraud Detection

Computes 7-dimensional feature vectors from farmer transaction history via Django ORM.
Used by both training (historical data) and inference (live scoring).

Features:
1. registration_to_redemption_days — days from farmer registration to first voucher redemption
2. geographic_activity_spread — standard deviation of GPS coordinates across redemption locations
3. voucher_redemption_velocity — redemptions per month
4. delivery_compliance_ratio — completed deliveries / scheduled deliveries
5. redemption_location_deviation — distance between registered farm and actual redemption GPS
6. agent_association_density — unique agents / total vouchers processed
7. inter_season_reregistration_rate — re-registration attempts across seasons
"""

import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Tuple, List, Optional
import logging

logger = logging.getLogger(__name__)

# DEPENDS ON: apps.farmers.models.Farmer
# DEPENDS ON: apps.fisp.models.Voucher
# DEPENDS ON: apps.logistics.models.Produce
# DEPENDS ON: apps.payments.models.Payment


class FraudFeatureExtractor:
    """
    Extracts fraud detection features from farmer transaction history.
    
    All computations use Django ORM querysets — no raw SQL.
    Handles missing data gracefully (defaults to legitimate-like values).
    """
    
    FEATURE_NAMES = [
        'registration_to_redemption_days',
        'geographic_activity_spread',
        'voucher_redemption_velocity',
        'delivery_compliance_ratio',
        'redemption_location_deviation',
        'agent_association_density',
        'inter_season_reregistration_rate'
    ]
    
    def __init__(self, farmer_id: int):
        """
        Initialize feature extractor for a specific farmer.
        
        Args:
            farmer_id: Primary key of the farmer
        """
        self.farmer_id = farmer_id
        # DEPENDS ON: apps.farmers.models.Farmer
        # Will be lazily imported when needed
        self.farmer = None
        self.vouchers = None
        self.produces = None
        self.payments = None
    
    def load_farmer_data(self):
        """Load farmer and related data from database."""
        from apps.farmers.models import Farmer
        from apps.fisp.models import Voucher
        from apps.logistics.models import Produce
        from apps.payments.models import Payment
        
        try:
            self.farmer = Farmer.objects.get(pk=self.farmer_id)
            self.vouchers = Voucher.objects.filter(farmer=self.farmer).order_by('created_at')
            self.produces = Produce.objects.filter(farmer=self.farmer)
            self.payments = Payment.objects.filter(farmer=self.farmer)
        except Exception as e:
            logger.warning(f"Could not load data for farmer {self.farmer_id}: {e}")
            return False
        
        return True
    
    def extract_features(self) -> Dict[str, float]:
        """
        Extract all 7 features for this farmer.
        
        Returns:
            Dictionary with feature names as keys and computed values as floats.
            If any computation fails, defaults to value indicating legitimate activity.
        """
        if not self.load_farmer_data():
            return self._get_default_features()
        
        features = {
            'registration_to_redemption_days': self._compute_registration_to_redemption_days(),
            'geographic_activity_spread': self._compute_geographic_activity_spread(),
            'voucher_redemption_velocity': self._compute_voucher_redemption_velocity(),
            'delivery_compliance_ratio': self._compute_delivery_compliance_ratio(),
            'redemption_location_deviation': self._compute_redemption_location_deviation(),
            'agent_association_density': self._compute_agent_association_density(),
            'inter_season_reregistration_rate': self._compute_inter_season_reregistration_rate(),
        }
        
        return features
    
    def extract_features_array(self) -> np.ndarray:
        """
        Extract features as numpy array for ML model input.
        
        Returns:
            1D numpy array of shape (7,) with features in standard order.
        """
        features_dict = self.extract_features()
        return np.array([features_dict[name] for name in self.FEATURE_NAMES])
    
    def _compute_registration_to_redemption_days(self) -> float:
        """
        Days between farmer registration and first voucher redemption.
        
        Legitimate farmers: typically 1-30 days
        Fraudsters: often < 1 day (quick exploitation)
        """
        if not self.farmer or not self.vouchers.exists():
            return 7.0  # Default: legitimate-like value
        
        first_voucher = self.vouchers.first()
        if not first_voucher or not first_voucher.created_at:
            return 7.0
        
        delta = first_voucher.created_at - self.farmer.created_at
        days = delta.total_seconds() / (24 * 3600)
        return max(0.0, days)
    
    def _compute_geographic_activity_spread(self) -> float:
        """
        Standard deviation of GPS coordinates across all redemption locations.
        
        Measured in km² (variance of lat/lon points).
        Legitimate farmers: concentrated redemption (low spread, ~1-2 km²)
        Fraudsters: dispersed activity (high spread, >5 km²)
        """
        if not self.produces.exists():
            return 0.0  # No activity
        
        # Extract GPS coordinates (latitude, longitude)
        # DEPENDS ON: apps.logistics.models.Produce — assumes location fields
        gps_points = []
        for produce in self.produces:
            # Assumes Produce model has 'collection_gps_latitude', 'collection_gps_longitude'
            if hasattr(produce, 'collection_gps_latitude') and hasattr(produce, 'collection_gps_longitude'):
                gps_points.append((produce.collection_gps_latitude, produce.collection_gps_longitude))
        
        if len(gps_points) < 2:
            return 0.0
        
        # Calculate variance (simplified: use lat/lon variance)
        lats = np.array([p[0] for p in gps_points])
        lons = np.array([p[1] for p in gps_points])
        
        # Approximate km² using coordinate variance
        spread = np.var(lats) + np.var(lons)
        return float(spread)
    
    def _compute_voucher_redemption_velocity(self) -> float:
        """
        Redemptions per month.
        
        Legitimate farmers: 0.5-2 per month
        Fraudsters: rapid volume (3-10+ per month)
        """
        if not self.vouchers.exists():
            return 0.0
        
        first_voucher = self.vouchers.first()
        last_voucher = self.vouchers.last()
        
        if not first_voucher or not last_voucher or first_voucher == last_voucher:
            return 0.0
        
        time_span = last_voucher.created_at - first_voucher.created_at
        months = time_span.total_seconds() / (30 * 24 * 3600)
        
        if months < 0.01:
            months = 0.01  # Avoid division by zero
        
        velocity = self.vouchers.count() / months
        return float(velocity)
    
    def _compute_delivery_compliance_ratio(self) -> float:
        """
        Completed deliveries / scheduled deliveries.
        
        Legitimate farmers: >0.8 (high compliance)
        Fraudsters: <0.3 (low compliance, many pending/failed)
        """
        if not self.produces.exists():
            return 0.85  # Default: legitimate-like
        
        # DEPENDS ON: apps.logistics.models.Produce — assumes status field
        try:
            total = self.produces.count()
            # Assumes Produce has status field with value 'STORED' or similar for completed
            completed = self.produces.filter(status='STORED').count()
            
            if total == 0:
                return 0.85
            
            ratio = completed / total
            return float(ratio)
        except Exception as e:
            logger.warning(f"Could not compute delivery compliance for farmer {self.farmer_id}: {e}")
            return 0.85
    
    def _compute_redemption_location_deviation(self) -> float:
        """
        Distance (km) between registered farm location and actual redemption locations.
        
        Legitimate farmers: close to home location (0-3 km)
        Fraudsters: far from registered location (>5 km)
        """
        if not self.farmer or not self.produces.exists():
            return 0.0
        
        # DEPENDS ON: apps.farmers.models.Farmer — assumes farm_gps_latitude, farm_gps_longitude
        if not hasattr(self.farmer, 'farm_gps_latitude') or not hasattr(self.farmer, 'farm_gps_longitude'):
            return 0.0
        
        home_lat = self.farmer.farm_gps_latitude
        home_lon = self.farmer.farm_gps_longitude
        
        if not home_lat or not home_lon:
            return 0.0
        
        distances = []
        for produce in self.produces:
            if hasattr(produce, 'collection_gps_latitude') and hasattr(produce, 'collection_gps_longitude'):
                if produce.collection_gps_latitude and produce.collection_gps_longitude:
                    # Haversine distance approximation (simplified)
                    lat_diff = abs(produce.collection_gps_latitude - home_lat)
                    lon_diff = abs(produce.collection_gps_longitude - home_lon)
                    distance_km = np.sqrt(lat_diff**2 + lon_diff**2) * 111  # ~111 km per degree
                    distances.append(distance_km)
        
        if not distances:
            return 0.0
        
        return float(np.std(distances))
    
    def _compute_agent_association_density(self) -> float:
        """
        Unique redemption agents / total vouchers processed.
        
        Legitimate farmers: 1-3 agents (consistent relationships)
        Fraudsters: many agents (0.8-1.0 density, ring structure)
        """
        if not self.vouchers.exists():
            return 0.0
        
        total_vouchers = self.vouchers.count()
        if total_vouchers == 0:
            return 0.0
        
        # DEPENDS ON: apps.fisp.models.Voucher — assumes redeemed_by_agent field
        try:
            unique_agents = self.vouchers.filter(
                redeemed_by_agent__isnull=False
            ).values('redeemed_by_agent').distinct().count()
            
            if total_vouchers == 0:
                return 0.0
            
            density = unique_agents / total_vouchers
            return float(min(density, 1.0))
        except Exception as e:
            logger.warning(f"Could not compute agent density for farmer {self.farmer_id}: {e}")
            return 0.0
    
    def _compute_inter_season_reregistration_rate(self) -> float:
        """
        Re-registration attempts across seasons / total registrations.
        
        Legitimate farmers: 0.0-0.2 (rarely re-register)
        Fraudsters: 0.3-1.0 (frequent re-registration to evade detection)
        """
        # DEPENDS ON: apps.farmers.models.Farmer — needs registration history or FISPApplication model
        try:
            # Assumes FISPApplication or similar tracking re-applications
            from apps.fisp.models import FISPApplication  # DEPENDS ON: not yet implemented
            
            all_applications = FISPApplication.objects.filter(farmer=self.farmer)
            if not all_applications.exists():
                return 0.0
            
            total = all_applications.count()
            # Assume first application is original registration
            reregistrations = total - 1
            
            if total == 0:
                return 0.0
            
            rate = reregistrations / total
            return float(rate)
        except Exception as e:
            logger.warning(f"Could not compute re-registration rate for farmer {self.farmer_id}: {e}")
            return 0.0
    
    @staticmethod
    def _get_default_features() -> Dict[str, float]:
        """
        Return default features (legitimate-like) when data cannot be loaded.
        
        Used as fallback for farmers with incomplete history.
        """
        return {
            'registration_to_redemption_days': 7.0,
            'geographic_activity_spread': 0.5,
            'voucher_redemption_velocity': 1.0,
            'delivery_compliance_ratio': 0.85,
            'redemption_location_deviation': 1.0,
            'agent_association_density': 0.3,
            'inter_season_reregistration_rate': 0.05,
        }


def extract_farmer_features(farmer_id: int) -> Dict[str, float]:
    """
    Convenience function to extract features for a single farmer.
    
    Args:
        farmer_id: Primary key of the farmer
        
    Returns:
        Dictionary with 7 features
    """
    extractor = FraudFeatureExtractor(farmer_id)
    return extractor.extract_features()


def extract_farmer_features_array(farmer_id: int) -> np.ndarray:
    """
    Convenience function to extract features as numpy array.
    
    Args:
        farmer_id: Primary key of the farmer
        
    Returns:
        1D numpy array of shape (7,)
    """
    extractor = FraudFeatureExtractor(farmer_id)
    return extractor.extract_features_array()
