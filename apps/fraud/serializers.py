"""Fraud detection serializers."""

from rest_framework import serializers
from .models import FraudFlag, FraudScore, FraudReviewQueue

# DEPENDS ON: apps.farmers.models.Farmer


class FraudFlagSerializer(serializers.ModelSerializer):
    """Serializer for FraudFlag model."""
    
    farmer_id = serializers.IntegerField(source='farmer.id', read_only=True)
    farmer_nrc = serializers.CharField(source='farmer.nrc', read_only=True)
    flag_type_display = serializers.CharField(source='get_flag_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = FraudFlag
        fields = [
            'id', 'farmer_id', 'farmer_nrc', 'flag_type', 'flag_type_display',
            'status', 'status_display', 'request_endpoint', 'duplicate_farmer_id',
            'gps_distance_metres', 'reviewed_by', 'reviewed_at', 'review_notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class FraudScoreSerializer(serializers.ModelSerializer):
    """Serializer for FraudScore model."""
    
    farmer_id = serializers.IntegerField(source='farmer.id', read_only=True)
    farmer_nrc = serializers.CharField(source='farmer.nrc', read_only=True)
    
    class Meta:
        model = FraudScore
        fields = [
            'id', 'farmer_id', 'farmer_nrc', 'anomaly_score', 'is_flagged',
            'confidence', 'feature_snapshot', 'scoring_run_id', 'model_version',
            'scored_at'
        ]
        read_only_fields = ['id', 'scored_at']


class FraudReviewQueueSerializer(serializers.ModelSerializer):
    """Serializer for FraudReviewQueue model."""
    
    farmer_id = serializers.IntegerField(source='farmer.id', read_only=True)
    farmer_nrc = serializers.CharField(source='farmer.nrc', read_only=True)
    fraud_flag_summary = FraudFlagSerializer(source='fraud_flag', read_only=True)
    fraud_score_summary = FraudScoreSerializer(source='fraud_score', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = FraudReviewQueue
        fields = [
            'id', 'farmer_id', 'farmer_nrc', 'fraud_flag_summary', 'fraud_score_summary',
            'status', 'status_display', 'priority', 'reviewed_by', 'reviewed_at',
            'review_notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
