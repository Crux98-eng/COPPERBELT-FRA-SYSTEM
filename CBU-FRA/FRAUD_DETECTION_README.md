# Fraud Detection System - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Layer 1: Pre-Filter Middleware](#layer-1-pre-filter-middleware)
4. [Layer 2: ML-Based Scoring](#layer-2-ml-based-scoring)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Data Structures](#data-structures)
8. [Frontend Integration](#frontend-integration)
9. [Configuration](#configuration)

---

## Overview

The fraud detection system is a two-layer approach combining real-time synchronous checks and automated ML-based analysis:

- **Layer 1 (Real-time)**: Synchronous middleware checks at request time
  - Runs during farmer registration and voucher redemption
  - Instant response (409 for critical issues, 200 for warnings)
  
- **Layer 2 (Batch)**: Nightly ML scoring using Isolation Forest
  - Runs at 02:00 CAT / 00:00 UTC
  - Analyzes 7-dimension behavioral feature vectors
  - Flags anomalies for manual review

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Application                     │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────▼────────┐
        │  Fraud API      │
        │ /api/fraud/*    │
        └────────┬────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌─────────┐ ┌─────────┐ ┌──────────┐
│ Pre-    │ │ ML      │ │ Review   │
│ Filter  │ │ Scoring │ │ Queue    │
│         │ │ (Batch) │ │ Mgmt     │
└────┬────┘ └────┬────┘ └──────┬───┘
     │           │             │
     └───────────┼─────────────┘
                 ▼
        ┌────────────────┐
        │  PostgreSQL DB │
        └────────────────┘
        - fraud_flags
        - fraud_score
        - fraud_review_queue
        - audit_log
```

---

## Layer 1: Pre-Filter Middleware

### When It Runs
- **Triggers**: POST `/farmers/register/` (registration) and POST `/fisp/redeem/` (voucher redemption)
- **Timing**: Synchronous - before request reaches application logic
- **Performance**: O(1) indexed lookups only

### Check 1: DUPLICATE_NRC
**Purpose**: Prevent re-registration using same NRC (identity document)

**Logic**:
```
IF farmer.nrc_number exists in database:
  → Create FraudFlag with type="DUPLICATE_NRC"
  → Return 409 CONFLICT immediately
  → Deny registration
```

**Response**:
```json
{
  "status": "error",
  "message": "This NRC has already been registered",
  "code": "DUPLICATE_NRC",
  "duplicate_farmer_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Frontend Action**: Show error, suggest login or contact support

---

### Check 2: DUPLICATE_PHONE
**Purpose**: Flag suspicious phone reuse (not rejected, but monitored)

**Logic**:
```
IF farmer.phone_number exists in database:
  → Create FraudFlag with type="DUPLICATE_PHONE"
  → Status = FLAGGED (supervisor review required)
  → Return 200 OK (allow registration to proceed)
  → Route to manual review queue
```

**Response**:
```json
{
  "status": "success",
  "message": "Farmer registered. Note: Phone number flagged for review.",
  "farmer_id": "660f8500-f39c-52e5-b827-557655551111",
  "fraud_warning": {
    "flag_type": "DUPLICATE_PHONE",
    "status": "FLAGGED",
    "original_farmer_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Frontend Action**: Show warning, allow proceed with notice that admin will review

---

### Check 3: GPS_CLUSTER
**Purpose**: Prevent ghost registrations (multiple farmers at same verified location)

**Logic**:
```
IF farm_gps coordinates within 50 meters of existing verified farm:
  AND verified_farm belongs to different farmer:
  → Create FraudFlag with type="GPS_CLUSTER"
  → Record distance in gps_distance_metres
  → Status = FLAGGED
  → Route to manual review queue
  → Return 200 OK (allow, but flag)
```

**Response**:
```json
{
  "status": "success",
  "message": "Farmer registered. Location flagged for review.",
  "farmer_id": "660f8500-f39c-52e5-b827-557655551111",
  "fraud_warning": {
    "flag_type": "GPS_CLUSTER",
    "status": "FLAGGED",
    "gps_distance_metres": 35.5,
    "nearby_farmer_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Frontend Action**: Show warning with map visualization of nearby registered farms

---

### FraudFlag Model (Database)
```
fraud_flags table:
├── flag_id (UUID, PK)
├── farmer_id (UUID, FK)
├── flag_type (VARCHAR): DUPLICATE_NRC | DUPLICATE_PHONE | GPS_CLUSTER
├── status (ENUM): FLAGGED | REVIEWED | RESOLVED | DISMISSED
├── request_endpoint (VARCHAR): /farmers/register, /fisp/redeem, etc
├── duplicate_farmer_id (UUID, FK): Link to original farmer (if applicable)
├── gps_distance_metres (FLOAT): Distance to nearby verified farm (if applicable)
├── reviewed_by_id (UUID, FK): User who reviewed the flag
├── reviewed_at (DATETIME): When supervisor reviewed
├── review_notes (TEXT): Supervisor's decision notes
├── created_at (DATETIME): Auto timestamp
└── updated_at (DATETIME): Auto timestamp
```

---

## Layer 2: ML-Based Scoring

### Overview
- **Algorithm**: Isolation Forest (unsupervised anomaly detection)
- **Schedule**: Nightly at 02:00 CAT (00:00 UTC)
- **Contamination**: 0.05 (expects ~5% anomalies)
- **Execution**: Celery task `score_all_farmers`

### How It Works

#### Step 1: Feature Extraction
For each farmer, compute 7-dimension behavioral feature vector:

```
Feature 1: registration_to_redemption_days
├─ Definition: Days between farmer registration and first voucher redemption
├─ Normal Range: 0-365 days
├─ Anomaly Signal: Immediate redemption (0 days = suspicious)
└─ Example: 120 days (normal)

Feature 2: geographic_activity_spread
├─ Definition: Standard deviation of GPS coordinates across all farms
├─ Normal Range: 0-0.5 degrees (≈50km)
├─ Anomaly Signal: High spread = multiple unrelated locations
└─ Example: 0.05 degrees (normal)

Feature 3: voucher_redemption_velocity
├─ Definition: Total redemptions / months since registration
├─ Normal Range: 0-10 redemptions per month
├─ Anomaly Signal: Unrealistic speed (10+ per month)
└─ Example: 2.5 redemptions/month (normal)

Feature 4: delivery_compliance_ratio
├─ Definition: Completed deliveries / scheduled deliveries
├─ Normal Range: 0.0 - 1.0
├─ Anomaly Signal: Very low compliance (<0.5) or perfect (1.0)
└─ Example: 0.92 (normal)

Feature 5: redemption_location_deviation
├─ Definition: Haversine distance (meters) between registered farm and redemption GPS
├─ Normal Range: 0-2000 meters
├─ Anomaly Signal: Large deviation (>1000m) = redemption far from registered location
└─ Example: 250 meters (normal)

Feature 6: agent_association_density
├─ Definition: Count of distinct agents who processed farmer's transactions
├─ Normal Range: 1-10 agents
├─ Anomaly Signal: Single agent (1) or many agents (10+)
└─ Example: 3 agents (normal)

Feature 7: inter_season_reregistration_rate
├─ Definition: Number of re-registration attempts across seasons
├─ Normal Range: 0-5 attempts
├─ Anomaly Signal: Multiple re-registrations = account switching
└─ Example: 0 (normal, no re-registrations)
```

#### Step 2: Model Scoring
```python
model = IsolationForest(contamination=0.05, random_state=42)
features = np.array([f1, f2, f3, f4, f5, f6, f7])

anomaly_score = model.decision_function([features])  # Range: [-1, 1]
is_flagged = model.predict([features]) == -1  # True if anomaly
```

**Score Interpretation**:
- `anomaly_score > 0`: Normal behavior
- `anomaly_score < 0`: Suspicious behavior
- Closer to -1: More anomalous
- Closer to 0: Borderline cases

#### Step 3: Flag & Queue
```
IF is_flagged:
  → Create FraudScore record (stores all 7 features for audit)
  → Create FraudReviewQueue entry (status=PENDING, priority=1)
  → Add to supervisor review dashboard
```

### FraudScore Model (Database)
```
fraud_score table:
├── score_id (UUID, PK)
├── farmer_id (UUID, FK)
├── scored_at (DATETIME): When scoring occurred
├── anomaly_score (FLOAT): Decision function value [-1, 1]
├── is_flagged (BOOLEAN): Whether model classified as anomaly
├── feature_snapshot (JSON): All 7 dimensions + values for audit
│   {
│     "dimensions": [
│       "registration_to_redemption_days",
│       "geographic_activity_spread",
│       "voucher_redemption_velocity",
│       "delivery_compliance_ratio",
│       "redemption_location_deviation",
│       "agent_association_density",
│       "inter_season_reregistration_rate"
│     ],
│     "values": [120, 0.05, 2.5, 0.92, 250, 3, 0]
│   }
├── review_action (ENUM, nullable): APPROVE | REJECT | INVESTIGATE
│   (Set by supervisor after manual review)
├── created_at (DATETIME): Auto timestamp
└── updated_at (DATETIME): Auto timestamp
```

### Example: Identifying an Anomaly

**Scenario**: Farmer "John Doe"
```
Registration: Jan 1, 2024
Feature Vector:
  [0, 2.5, 15.8, 0.2, 1800, 1, 3]
   ↑  ↑    ↑    ↑    ↑     ↑  ↑
   |  |    |    |    |     |  └─ 3 re-registrations (suspicious)
   |  |    |    |    |     └──── 1 agent (suspicious - no diversity)
   |  |    |    |    └────────── 1800m deviation (redemption far from farm)
   |  |    |    └────────────── 20% compliance (very low)
   |  |    └─────────────────── 15.8 redemptions/month (unrealistic)
   |  └──────────────────────── 2.5° spread (very high - multiple locations)
   └─────────────────────────── 0 days to first redemption (instant)
```

**Result**: `anomaly_score = -0.87` → `is_flagged = True`
→ Added to review queue for supervisor decision

---

## Database Schema

### Core Fraud Tables

#### 1. fraud_flags (Layer 1 - Real-time)
```sql
CREATE TABLE fraud_flags (
  flag_id UUID PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES farmer(farmer_id),
  flag_type VARCHAR(20) NOT NULL,
  status ENUM('FLAGGED', 'REVIEWED', 'RESOLVED', 'DISMISSED'),
  request_endpoint VARCHAR(255),
  duplicate_farmer_id UUID REFERENCES farmer(farmer_id),
  gps_distance_metres FLOAT,
  reviewed_by_id UUID REFERENCES "user"(user_id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_farmer_id (farmer_id),
  INDEX idx_flag_type (flag_type),
  INDEX idx_status (status)
);
```

#### 2. fraud_score (Layer 2 - ML Batch)
```sql
CREATE TABLE fraud_score (
  score_id UUID PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES farmer(farmer_id),
  scored_at TIMESTAMP DEFAULT NOW(),
  anomaly_score FLOAT NOT NULL,
  is_flagged BOOLEAN DEFAULT FALSE,
  feature_snapshot JSONB NOT NULL,
  review_action ENUM('APPROVE', 'REJECT', 'INVESTIGATE'),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_farmer_id (farmer_id),
  INDEX idx_is_flagged (is_flagged),
  INDEX idx_scored_at (scored_at)
);
```

#### 3. fraud_review_queue (Manual Review)
```sql
CREATE TABLE fraud_review_queue (
  queue_id UUID PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES farmer(farmer_id),
  fraud_flag_id UUID REFERENCES fraud_flags(flag_id),
  fraud_score_id UUID REFERENCES fraud_score(score_id),
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_MORE_INFO'),
  priority INTEGER DEFAULT 0,
  reviewed_by_id UUID REFERENCES "user"(user_id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_farmer_id (farmer_id),
  INDEX idx_status (status),
  INDEX idx_priority (priority)
);
```

#### 4. audit_log (Compliance & Audit Trail)
```sql
CREATE TABLE audit_log (
  log_id UUID PRIMARY KEY,
  entity_type VARCHAR NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR NOT NULL,
  before_state JSONB,
  after_state JSONB NOT NULL,
  performed_by UUID NOT NULL REFERENCES "user"(user_id),
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_entity_type_id (entity_type, entity_id),
  INDEX idx_timestamp (timestamp)
);
```

---

## API Endpoints

### Base URL
```
/api/v1/fraud
```

### 1. Get All Fraud Flags
**Endpoint**: `GET /api/v1/fraud/flags`

**Query Parameters**:
```
- farmer_id (optional): UUID - Filter by farmer
- flag_type (optional): DUPLICATE_NRC | DUPLICATE_PHONE | GPS_CLUSTER
- status (optional): FLAGGED | REVIEWED | RESOLVED | DISMISSED
- skip (default: 0): Pagination offset
- limit (default: 50): Pagination limit
```

**Response** (200):
```json
{
  "total": 45,
  "flags": [
    {
      "flag_id": "550e8400-e29b-41d4-a716-446655440000",
      "farmer_id": "660f8500-f39c-52e5-b827-557655551111",
      "flag_type": "DUPLICATE_NRC",
      "status": "FLAGGED",
      "request_endpoint": "/farmers/register/",
      "duplicate_farmer_id": "770g9601-g40d-63f6-c938-668766662222",
      "gps_distance_metres": null,
      "review_notes": null,
      "created_at": "2024-01-15T10:30:00Z",
      "reviewed_at": null,
      "reviewed_by": null
    }
  ]
}
```

---

### 2. Get Fraud Flag Details
**Endpoint**: `GET /api/v1/fraud/flags/{flag_id}`

**Response** (200):
```json
{
  "flag_id": "550e8400-e29b-41d4-a716-446655440000",
  "farmer": {
    "farmer_id": "660f8500-f39c-52e5-b827-557655551111",
    "full_name": "John Doe",
    "nrc_number": "123456789012",
    "phone_number": "+260978123456",
    "district": "Central",
    "created_at": "2024-01-15T10:00:00Z"
  },
  "flag_type": "DUPLICATE_NRC",
  "status": "FLAGGED",
  "duplicate_farmer_info": {
    "farmer_id": "770g9601-g40d-63f6-c938-668766662222",
    "full_name": "John D.",
    "created_at": "2024-01-10T08:00:00Z"
  },
  "request_endpoint": "/farmers/register/",
  "review_notes": null,
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

### 3. Review/Resolve Fraud Flag
**Endpoint**: `PUT /api/v1/fraud/flags/{flag_id}/review`

**Auth**: Requires ADMIN role

**Request Body**:
```json
{
  "status": "RESOLVED",
  "review_notes": "Legitimate duplicate - farmer updated phone number",
  "action": "APPROVE"
}
```

**Response** (200):
```json
{
  "flag_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "RESOLVED",
  "reviewed_at": "2024-01-16T14:20:00Z",
  "reviewed_by": "admin_user_id",
  "review_notes": "Legitimate duplicate - farmer updated phone number"
}
```

---

### 4. Get Fraud Scores
**Endpoint**: `GET /api/v1/fraud/scores`

**Query Parameters**:
```
- farmer_id (optional): UUID
- is_flagged (optional): true | false
- skip (default: 0)
- limit (default: 50)
- order_by (default: scored_at): scored_at | anomaly_score
```

**Response** (200):
```json
{
  "total": 23,
  "scores": [
    {
      "score_id": "880h0702-h51e-74g7-d049-779877773333",
      "farmer_id": "660f8500-f39c-52e5-b827-557655551111",
      "anomaly_score": -0.87,
      "is_flagged": true,
      "scored_at": "2024-01-16T02:00:00Z",
      "feature_snapshot": {
        "dimensions": [
          "registration_to_redemption_days",
          "geographic_activity_spread",
          "voucher_redemption_velocity",
          "delivery_compliance_ratio",
          "redemption_location_deviation",
          "agent_association_density",
          "inter_season_reregistration_rate"
        ],
        "values": [0, 2.5, 15.8, 0.2, 1800, 1, 3]
      },
      "review_action": null
    }
  ]
}
```

---

### 5. Get Fraud Score Details
**Endpoint**: `GET /api/v1/fraud/scores/{score_id}`

**Response** (200):
```json
{
  "score_id": "880h0702-h51e-74g7-d049-779877773333",
  "farmer": {
    "farmer_id": "660f8500-f39c-52e5-b827-557655551111",
    "full_name": "John Doe",
    "nrc_number": "123456789012",
    "phone_number": "+260978123456",
    "trust_score": 0.0,
    "created_at": "2024-01-15T10:00:00Z"
  },
  "anomaly_score": -0.87,
  "is_flagged": true,
  "scored_at": "2024-01-16T02:00:00Z",
  "features": {
    "registration_to_redemption_days": 0,
    "geographic_activity_spread": 2.5,
    "voucher_redemption_velocity": 15.8,
    "delivery_compliance_ratio": 0.2,
    "redemption_location_deviation": 1800,
    "agent_association_density": 1,
    "inter_season_reregistration_rate": 3
  },
  "created_at": "2024-01-16T02:00:00Z"
}
```

---

### 6. Get Review Queue (Supervisor Dashboard)
**Endpoint**: `GET /api/v1/fraud/review-queue`

**Query Parameters**:
```
- status (optional): PENDING | APPROVED | REJECTED | NEEDS_MORE_INFO
- priority (optional): 0, 1, 2... (higher = more urgent)
- skip (default: 0)
- limit (default: 50)
```

**Response** (200):
```json
{
  "total": 12,
  "queue_entries": [
    {
      "queue_id": "990i1803-i62f-85h8-e150-880988884444",
      "farmer_id": "660f8500-f39c-52e5-b827-557655551111",
      "fraud_flag_id": "550e8400-e29b-41d4-a716-446655440000",
      "fraud_score_id": "880h0702-h51e-74g7-d049-779877773333",
      "status": "PENDING",
      "priority": 1,
      "created_at": "2024-01-16T02:00:00Z",
      "farmer": {
        "farmer_id": "660f8500-f39c-52e5-b827-557655551111",
        "full_name": "John Doe",
        "nrc_number": "123456789012",
        "district": "Central"
      }
    }
  ]
}
```

---

### 7. Make Review Decision
**Endpoint**: `PUT /api/v1/fraud/review-queue/{queue_id}/decision`

**Auth**: Requires ADMIN role

**Request Body**:
```json
{
  "status": "APPROVED",
  "review_notes": "Verified farmer identity. GPS cluster is legitimate - family farm."
}
```

**Response** (200):
```json
{
  "queue_id": "990i1803-i62f-85h8-e150-880988884444",
  "farmer_id": "660f8500-f39c-52e5-b827-557655551111",
  "status": "APPROVED",
  "reviewed_by": "admin_user_id",
  "reviewed_at": "2024-01-16T14:30:00Z",
  "review_notes": "Verified farmer identity. GPS cluster is legitimate - family farm."
}
```

---

### 8. Manual Farmer Re-Score
**Endpoint**: `POST /api/v1/fraud/rescore/{farmer_id}`

**Auth**: Requires ADMIN role

**Purpose**: Manually trigger ML scoring for a single farmer (instead of waiting for nightly task)

**Request Body**:
```json
{
  "reason": "Follow-up investigation after review decision"
}
```

**Response** (201):
```json
{
  "score_id": "aa0j1904-j73g-96i9-f261-991099995555",
  "farmer_id": "660f8500-f39c-52e5-b827-557655551111",
  "anomaly_score": -0.42,
  "is_flagged": false,
  "scored_at": "2024-01-16T14:45:00Z",
  "message": "Farmer re-scored successfully"
}
```

---

### 9. Get Audit Log
**Endpoint**: `GET /api/v1/fraud/audit-log`

**Query Parameters**:
```
- entity_type (optional): Farmer | FraudFlag | FraudScore | FraudReviewQueue
- entity_id (optional): UUID
- action (optional): CREATED | UPDATED | REVIEWED | APPROVED | REJECTED
- skip (default: 0)
- limit (default: 50)
```

**Response** (200):
```json
{
  "total": 156,
  "logs": [
    {
      "log_id": "bb1k2005-k84h-a7j0-g372-aa2100006666",
      "entity_type": "FraudFlag",
      "entity_id": "550e8400-e29b-41d4-a716-446655440000",
      "action": "REVIEWED",
      "before_state": {
        "status": "FLAGGED",
        "review_notes": null
      },
      "after_state": {
        "status": "RESOLVED",
        "review_notes": "Legitimate duplicate"
      },
      "performed_by": "admin_user_id",
      "timestamp": "2024-01-16T14:30:00Z"
    }
  ]
}
```

---

## Data Structures

### FraudFlag Response Schema
```typescript
interface FraudFlag {
  flag_id: string;           // UUID
  farmer_id: string;         // UUID of flagged farmer
  flag_type: string;         // DUPLICATE_NRC | DUPLICATE_PHONE | GPS_CLUSTER
  status: string;            // FLAGGED | REVIEWED | RESOLVED | DISMISSED
  request_endpoint: string;  // /farmers/register, /fisp/redeem, etc
  duplicate_farmer_id?: string;  // UUID (if DUPLICATE_NRC/PHONE)
  gps_distance_metres?: number;  // Meters (if GPS_CLUSTER)
  reviewed_by?: string;      // UUID of admin who reviewed
  reviewed_at?: string;      // ISO 8601 timestamp
  review_notes?: string;     // Supervisor's notes
  created_at: string;        // ISO 8601 timestamp
  updated_at: string;        // ISO 8601 timestamp
}
```

### FraudScore Response Schema
```typescript
interface FraudScore {
  score_id: string;          // UUID
  farmer_id: string;         // UUID
  anomaly_score: number;     // Range: [-1, 1], closer to -1 = more anomalous
  is_flagged: boolean;       // true if model detected anomaly
  scored_at: string;         // ISO 8601 timestamp
  feature_snapshot: {
    dimensions: string[];    // 7 feature names
    values: number[];        // 7 feature values
  };
  review_action?: string;    // APPROVE | REJECT | INVESTIGATE
  created_at: string;        // ISO 8601 timestamp
}
```

### FraudReviewQueue Response Schema
```typescript
interface ReviewQueueEntry {
  queue_id: string;          // UUID
  farmer_id: string;         // UUID
  fraud_flag_id?: string;    // UUID (if from Layer 1)
  fraud_score_id?: string;   // UUID (if from Layer 2)
  status: string;            // PENDING | APPROVED | REJECTED | NEEDS_MORE_INFO
  priority: number;          // 0=low, 1=normal, 2+=high
  reviewed_by?: string;      // UUID of admin
  reviewed_at?: string;      // ISO 8601 timestamp
  review_notes?: string;     // Admin's decision notes
  created_at: string;        // ISO 8601 timestamp
}
```

### Feature Vector Schema
```typescript
interface FeatureSnapshot {
  dimensions: [
    "registration_to_redemption_days",
    "geographic_activity_spread",
    "voucher_redemption_velocity",
    "delivery_compliance_ratio",
    "redemption_location_deviation",
    "agent_association_density",
    "inter_season_reregistration_rate"
  ];
  values: [
    number,  // registration_to_redemption_days (0-365)
    number,  // geographic_activity_spread (0-0.5)
    number,  // voucher_redemption_velocity (0-10)
    number,  // delivery_compliance_ratio (0-1)
    number,  // redemption_location_deviation (0-2000)
    number,  // agent_association_density (1-10)
    number   // inter_season_reregistration_rate (0-5)
  ];
}
```

---

## Frontend Integration

### 1. Registration Flow (Layer 1)
```
User fills registration form
  ↓
Submit POST /api/v1/farmers/register
  ↓
┌─ Layer 1 Checks ─┐
│ • DUPLICATE_NRC  │
│ • DUPLICATE_PHONE│
│ • GPS_CLUSTER    │
└──────────────────┘
  ↓
  ├─ 409 CONFLICT (DUPLICATE_NRC)
  │   └─ Show error modal: "This ID is already registered"
  │
  └─ 200 OK with fraud_warning
      └─ Show warning: "Phone/Location flagged for review"
          ├─ Allow user to proceed
          └─ Add flag record for admin dashboard
```

**Frontend State**:
```typescript
// Handle registration response
if (response.status === 409) {
  // Hard error - registration blocked
  showError(response.data.message);
  return;
}

if (response.status === 200 && response.data.fraud_warning) {
  // Soft warning - allow proceed with notification
  const warning = response.data.fraud_warning;
  showWarning(`Your ${warning.flag_type} has been flagged for review. 
              An admin will contact you if needed.`);
  proceedToNextStep();
}
```

---

### 2. Supervisor Dashboard

#### 2A. Review Queue Page
```
GET /api/v1/fraud/review-queue?status=PENDING
  ↓
Display list of pending reviews:
┌────────────────────────────────────┐
│ Pending Fraud Reviews (12)         │
├────────────────────────────────────┤
│ ☐ John Doe | DUPLICATE_NRC | P:1   │ ← Click to review
│ ☐ Jane Smith | GPS_CLUSTER | P:0   │
│ ☐ Bob Johnson | DUPLICATE_PHONE|P:1│
└────────────────────────────────────┘
```

**Frontend UI Components**:
- Sortable table by `created_at`, `priority`, `flag_type`
- Filter by `status` (PENDING, APPROVED, REJECTED, NEEDS_MORE_INFO)
- Priority badges (color-coded: red for 2+, yellow for 1, gray for 0)
- Click row to open review modal

---

#### 2B. Review Modal
```
GET /api/v1/fraud/flags/{flag_id}
GET /api/v1/fraud/scores/{score_id}  (if ML-flagged)
  ↓
Display:
┌───────────────────────────────────────────┐
│ REVIEW: John Doe (DUPLICATE_NRC)          │
├───────────────────────────────────────────┤
│                                           │
│ Current Farmer Info:                      │
│  • ID: 660f8500-f39c-52e5-b827-557655551 │
│  • Name: John Doe                         │
│  • NRC: 123456789012                      │
│  • Phone: +260978123456                   │
│  • Registered: 2024-01-15 10:00           │
│                                           │
│ Original Farmer Info:                     │
│  • ID: 770g9601-g40d-63f6-c938-668766662 │
│  • Name: John D.                          │
│  • Registered: 2024-01-10 08:00           │
│                                           │
│ Decision:                                 │
│  [⊙ APPROVE] [ ] REJECT [ ] NEEDS_INFO   │
│                                           │
│ Notes:                                    │
│ [_________________________________]      │
│ [Legitimate - same person, new phone] │
│                                           │
│ [Cancel] [Submit Decision]                │
└───────────────────────────────────────────┘
```

**Frontend Action**:
```typescript
PUT /api/v1/fraud/review-queue/{queue_id}/decision
{
  "status": "APPROVED",
  "review_notes": "Legitimate - same person, new phone"
}
```

---

#### 2C. ML Fraud Score Details
```
GET /api/v1/fraud/scores/{score_id}
  ↓
Display anomaly analysis:
┌─────────────────────────────────────────────┐
│ ML FRAUD SCORE: John Doe                    │
├─────────────────────────────────────────────┤
│                                             │
│ Anomaly Score: -0.87 (High Risk) █████░░░░ │
│                                             │
│ Feature Analysis:                           │
│ ┌─────────────────────────────────────────┐ │
│ │ ✓ registration_to_redemption_days: 0   │ │
│ │   (Redeemed immediately - SUSPICIOUS)  │ │
│ │                                         │ │
│ │ ✓ geographic_activity_spread: 2.5     │ │
│ │   (Very high - multiple locations)     │ │
│ │                                         │ │
│ │ ✓ voucher_redemption_velocity: 15.8   │ │
│ │   (Unrealistic speed - SUSPICIOUS)     │ │
│ │                                         │ │
│ │ ✓ delivery_compliance: 0.2             │ │
│ │   (Very low compliance)                │ │
│ │                                         │ │
│ │ ✓ redemption_location_deviation: 1800 │ │
│ │   (1800m from registered farm)         │ │
│ │                                         │ │
│ │ ✓ agent_association: 1 agent          │ │
│ │   (Single agent - no diversity)        │ │
│ │                                         │ │
│ │ ✓ reregistration_rate: 3               │ │
│ │   (3 re-registrations - SUSPICIOUS)    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Scored: 2024-01-16 02:00 UTC               │
│ Decision: [⊙ APPROVE] [ ] REJECT           │
│                                             │
│ Notes:                                      │
│ [_________________________________]        │
│ [Follow-up on re-registration pattern] │
│                                             │
│ [Cancel] [Submit Decision]                  │
└─────────────────────────────────────────────┘
```

---

### 3. Farmer Profile Page (for AGENT)
```
GET /api/v1/fraud/flags?farmer_id={id}
GET /api/v1/fraud/scores?farmer_id={id}
  ↓
Display fraud history:
┌──────────────────────────────────────┐
│ Fraud History: John Doe              │
├──────────────────────────────────────┤
│                                      │
│ ✗ DUPLICATE_NRC (RESOLVED)          │
│  └─ Resolved: 2024-01-16 14:30      │
│     Note: "Legitimate duplicate..."  │
│                                      │
│ ⚠ GPS_CLUSTER (PENDING)             │
│  └─ Created: 2024-01-15 10:35       │
│     Distance: 35.5 meters            │
│     Awaiting supervisor review      │
│                                      │
│ ML Score: -0.42 (Medium Risk)        │
│  └─ Scored: 2024-01-16 02:00        │
│     Status: Pending review           │
│                                      │
└──────────────────────────────────────┘
```

---

### 4. Mobile/SMS Integration (Post-Decision)
```
After supervisor decision on FraudReviewQueue:

IF status = APPROVED:
  → Update fraud records to RESOLVED
  → Send SMS to farmer: "Your account has been verified"
  → Enable normal transactions

IF status = REJECTED:
  → Mark farmer as high-risk
  → Send SMS to agent: "Farmer account rejected - contact supervisor"
  → Block transactions until manual intervention

IF status = NEEDS_MORE_INFO:
  → Queue for follow-up
  → Send SMS to agent: "Please collect additional documents"
  → Farmer can't proceed until provided
```

---

### 5. Key Frontend Endpoints to Implement

| Page/Feature | API Calls | Purpose |
|---|---|---|
| **Registration** | POST `/farmers/register` | Handle Layer 1 checks |
| **Supervisor Dashboard** | GET `/fraud/review-queue?status=PENDING` | List pending reviews |
| **Review Modal** | GET `/fraud/flags/{id}` + PUT `/review-queue/{id}/decision` | Review & decide |
| **ML Scores** | GET `/fraud/scores?is_flagged=true` | Show high-risk farmers |
| **Farmer History** | GET `/fraud/flags?farmer_id={id}` | Show fraud history on profile |
| **Audit Trail** | GET `/fraud/audit-log` | Compliance reporting |
| **Manual Re-Score** | POST `/fraud/rescore/{farmer_id}` | Trigger ML scoring on-demand |

---

## Configuration

### Environment Variables
```bash
# Celery (Nightly ML Task)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
CELERY_BEAT_SCHEDULE_TIMEZONE=Africa/Lusaka

# Fraud Detection
FRAUD_GPS_CLUSTER_THRESHOLD_METERS=50
FRAUD_REVIEW_PRIORITY_DEFAULT=1

# ML Model
FRAUD_MODEL_PATH=ml/models/fraud_model.joblib
FRAUD_MODEL_CONTAMINATION=0.05
```

### Celery Beat Task
```python
# config/celery.py
from celery.schedules import crontab

app.conf.beat_schedule = {
    'nightly-fraud-scoring': {
        'task': 'celery_tasks.fraud_tasks.score_all_farmers',
        'schedule': crontab(hour=2, minute=0),  # 02:00 CAT (00:00 UTC)
    },
}
```

### Model Training
```bash
# Train model once (or monthly update)
python ml/training/train_isolation_forest.py

# Output: ml/models/fraud_model.joblib
```

---

## Summary: What the Frontend Needs to Know

### Layer 1 (Real-time)
- Handles immediately at registration
- Returns 409 if critical (DUPLICATE_NRC)
- Returns 200 with warning if soft flag (DUPLICATE_PHONE, GPS_CLUSTER)
- Frontend must handle both response types

### Layer 2 (Batch - Daily 02:00 CAT)
- Runs every night automatically
- Scores all active farmers
- Adds anomalies to review queue
- Frontend shows in supervisor dashboard

### Manual Review
- Supervisors access `/fraud/review-queue`
- Review details with fraud flag + ML score
- Make decision: APPROVE / REJECT / NEEDS_MORE_INFO
- Decision creates audit log + updates fraud records

### Key Tables for Frontend
1. **fraud_flags** - Real-time checks (Layer 1)
2. **fraud_score** - ML scoring results (Layer 2)
3. **fraud_review_queue** - Supervisor tasks
4. **audit_log** - Compliance trail

### Dashboard Queries
```typescript
// Supervisor Dashboard
GET /fraud/review-queue?status=PENDING&order_by=priority

// Farmer Fraud History
GET /fraud/flags?farmer_id={id}
GET /fraud/scores?farmer_id={id}

// High-Risk Farmers
GET /fraud/scores?is_flagged=true&limit=100

// Compliance Audit Trail
GET /fraud/audit-log?entity_type=FraudFlag
```

---

## Support & Maintenance

### Running Components

1. **Nightly ML Task**: Celery worker must be running
   ```bash
   celery -A celery_tasks worker -l info
   ```

2. **Database**: PostgreSQL with fraud tables
   ```bash
   python migrations/init_db.py
   ```

3. **API Server**: FastAPI backend
   ```bash
   uvicorn main:app --reload
   ```

### Monitoring
- Check celery task logs for nightly scoring errors
- Monitor fraud_score table for anomalies
- Review audit_log for access patterns
- Alert on high volumes of GPS_CLUSTER flags

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-16  
**Author**: Backend Team
