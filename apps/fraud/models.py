"""Fraud detection models."""

from django.db import models
import uuid

# DEPENDS ON: apps.farmers.models.Farmer


class FraudFlag(models.Model):
    """
    Records a fraud flag raised by synchronous pre-filter middleware.
    
    Layer 1: Pre-request validation (middleware.py)
    - DUPLICATE_NRC — farmer NRC already registered
    - DUPLICATE_PHONE — phone number already registered
    - GPS_CLUSTER — farm coordinates within 50m of existing verified farm
    """
    
    FLAG_TYPES = (
        ('DUPLICATE_NRC', 'Duplicate NRC'),
        ('DUPLICATE_PHONE', 'Duplicate Phone'),
        ('GPS_CLUSTER', 'GPS Cluster Detected'),
    )
    
    STATUS_CHOICES = (
        ('FLAGGED', 'Flagged'),
        ('REVIEWED', 'Reviewed'),
        ('RESOLVED', 'Resolved'),
        ('DISMISSED', 'Dismissed'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    farmer = models.ForeignKey('farmers.Farmer', on_delete=models.CASCADE, related_name='fraud_flags')
    flag_type = models.CharField(max_length=20, choices=FLAG_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='FLAGGED')
    
    # Context
    request_endpoint = models.CharField(max_length=255, null=True, blank=True)
    duplicate_farmer_id = models.IntegerField(null=True, blank=True)  # For DUPLICATE_* flags
    gps_distance_metres = models.FloatField(null=True, blank=True)  # For GPS_CLUSTER
    
    # Review
    reviewed_by = models.ForeignKey('auth_service.User', on_delete=models.SET_NULL, null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'fraud_flags'
        indexes = [
            models.Index(fields=['farmer', '-created_at']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['flag_type']),
        ]
    
    def __str__(self):
        return f"{self.get_flag_type_display()} - {self.farmer.id} ({self.status})"


class FraudScore(models.Model):
    """
    ML anomaly score for a farmer (output of Layer 2 nightly scoring).
    
    Layer 2: Async ML scoring (tasks.py)
    - Runs nightly via Celery
    - Scores all farmers using Isolation Forest
    - Flags anomalies for manual review (does NOT auto-reject)
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    farmer = models.ForeignKey('farmers.Farmer', on_delete=models.CASCADE, related_name='fraud_scores')
    
    # ML output
    anomaly_score = models.FloatField(help_text="Isolation Forest anomaly score (lower = more anomalous)")
    is_flagged = models.BooleanField(default=False, help_text="True if score indicates high anomaly")
    confidence = models.FloatField(default=0.0, help_text="Confidence of anomaly detection (0-1)")
    
    # Feature snapshot (for audit trail and debugging)
    feature_snapshot = models.JSONField(
        help_text="7-dimensional feature vector used for scoring",
        default=dict
    )
    
    # Context
    scoring_run_id = models.CharField(max_length=255, null=True, blank=True)
    model_version = models.CharField(max_length=50, default='1.0')
    
    scored_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'fraud_scores'
        indexes = [
            models.Index(fields=['farmer', '-scored_at']),
            models.Index(fields=['is_flagged', '-scored_at']),
            models.Index(fields=['-scored_at']),
        ]
        ordering = ['-scored_at']
    
    def __str__(self):
        return f"Farmer {self.farmer.id} - Score: {self.anomaly_score:.4f} {'(FLAGGED)' if self.is_flagged else ''}"


class FraudReviewQueue(models.Model):
    """
    Manual review queue for flagged farmers.
    
    Flagged farmers (either from Layer 1 or Layer 2) enter this queue.
    Supervisors review and decide: APPROVE, REJECT, or NEEDS_MORE_INFO.
    """
    
    STATUS_CHOICES = (
        ('PENDING', 'Pending Review'),
        ('APPROVED', 'Approved - Legitimate'),
        ('REJECTED', 'Rejected - Fraudulent'),
        ('NEEDS_MORE_INFO', 'Needs More Information'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    farmer = models.ForeignKey('farmers.Farmer', on_delete=models.CASCADE, related_name='review_queue_entries')
    
    # What triggered the review
    fraud_flag = models.ForeignKey(FraudFlag, on_delete=models.SET_NULL, null=True, blank=True)
    fraud_score = models.ForeignKey(FraudScore, on_delete=models.SET_NULL, null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    priority = models.PositiveIntegerField(default=0, help_text="Higher = more urgent")
    
    # Reviewer feedback
    reviewed_by = models.ForeignKey('auth_service.User', on_delete=models.SET_NULL, null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'fraud_review_queue'
        indexes = [
            models.Index(fields=['status', '-priority', '-created_at']),
            models.Index(fields=['farmer', '-created_at']),
        ]
        ordering = ['-priority', 'created_at']
    
    def __str__(self):
        return f"Review: Farmer {self.farmer.id} - {self.status}"
