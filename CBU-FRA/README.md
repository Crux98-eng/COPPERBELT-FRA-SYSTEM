# CBU-FRA API Data Contracts

This README documents the API data expected by the current frontend.

The codebase currently uses in-component mock data (no live `fetch`/`axios` calls yet), so this file defines the backend contracts needed to wire real APIs without breaking UI behavior.

## 1) Project Areas Scanned

- `src/app/components/auth`
- `src/app/components/dashboard`
- `src/app/components/farmers`
- `src/app/components/transport`
- `src/app/components/shed`
- `src/app/components/fraud`
- `src/app/components/map`
- `src/app/routes.tsx`

## 2) Core Conventions

- Base URL (suggested): `/api`
- IDs are strings like `F001`, `TB127`, `FR008`
- Date strings used by UI:
  - `YYYY-MM-DD` for records
  - `YYYY-MM-DD HH:mm` for dispatch/arrival timestamps
- Coordinates format:
  - Object form: `{ "lat": number, "lng": number }`
  - Polygon form for farm plot: `[[lat, lng], [lat, lng], ...]`

## 3) Shared Types (Frontend Expectations)

```ts
type FarmerStatus = "active" | "pending" | "rejected";
type BiometricStatus = "pending" | "verified";

type TransportStatus = "collected" | "in-transit" | "arrived";
type ShedBatchStatus = "pending-weighing" | "weighed";

type FraudRiskLevel = "high" | "medium" | "low";
type FraudAlertStatus = "under-review" | "pending" | "resolved";

type LocationType = "collection" | "shed";
```

```ts
interface GeoPoint {
  lat: number;
  lng: number;
}
```

## 4) Auth APIs

### `POST /api/auth/login`

Used by password login screen.

Request:

```json
{
  "officerIdOrNrc": "A12345",
  "password": "secret"
}
```

Response:

```json
{
  "token": "jwt-token",
  "user": {
    "id": "OFF001",
    "name": "Operations Officer",
    "role": "fra_officer"
  }
}
```

### `POST /api/auth/biometric-login`

Used by biometric login mode.

Request:

```json
{
  "officerIdOrNrc": "A12345",
  "biometricSample": "base64-or-template-ref",
  "deviceId": "scanner-01"
}
```

Response:

```json
{
  "token": "jwt-token",
  "user": {
    "id": "OFF001",
    "name": "Operations Officer",
    "role": "fra_officer"
  }
}
```

## 5) Farmer Registration + Farmer Management APIs

### Registration Payload

`POST /api/farmers`

Request:

```json
{
  "name": "Joseph Mwansa",
  "nrc": "123456/78/1",
  "phone": "+260977123456",
  "district": "Chipata",
  "village": "Kamoto Village",
  "crop": "Maize",
  "biometricStatus": "verified",
  "fingerprintTemplate": "base64-or-template-ref",
  "facePhoto": "base64-or-file-url",
  "gps": { "lat": -13.6334, "lng": 32.6503 }
}
```

Response:

```json
{
  "id": "F001",
  "status": "active"
}
```

### Farmer List

`GET /api/farmers?search=&status=&page=&pageSize=`

Expected row shape:

```ts
interface FarmerListItem {
  id: string;
  name: string;
  nrc: string;
  location: string; // e.g. "Chipata, Eastern"
  crop: string;
  status: FarmerStatus;
  registered: string; // YYYY-MM-DD
}
```

Suggested response:

```json
{
  "data": [
    {
      "id": "F001",
      "name": "Joseph Mwansa",
      "nrc": "123456/78/1",
      "location": "Chipata, Eastern",
      "crop": "Maize",
      "status": "active",
      "registered": "2026-01-15"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 12458
  }
}
```

### Farmer Detail

`GET /api/farmers/:id`

```ts
interface TransportHistoryItem {
  id: string;        // e.g. TB001
  date: string;      // YYYY-MM-DD
  bags: number;
  status: string;    // currently displayed as text, e.g. "completed"
  shed: string;
}

interface ProcurementHistoryItem {
  date: string;          // YYYY-MM-DD
  declaredBags: number;
  actualWeight: string;  // currently UI-ready text, e.g. "6,000 kg"
  variance: string;      // currently UI-ready text, e.g. "+2.3%"
  payment: string;       // currently UI-ready text, e.g. "ZMW 48,000"
  status: string;        // e.g. "paid"
}

interface FarmerDetail {
  id: string;
  name: string;
  nrc: string;
  phone: string;
  district: string;
  province: string;
  village: string;
  crop: string;
  status: FarmerStatus;
  registered: string;        // YYYY-MM-DD
  biometricStatus: BiometricStatus;
  gpsCoordinates: string;    // currently rendered as text in details panel
  transportHistory: TransportHistoryItem[];
  procurementHistory: ProcurementHistoryItem[];
}
```

Optional farm plot endpoint (used by `mapPlot.tsx` placeholder map):

`GET /api/farmers/:id/farm-plot`

```json
{
  "center": [-12.346, 28.456],
  "polygon": [
    [-12.345, 28.456],
    [-12.346, 28.457],
    [-12.347, 28.455],
    [-12.346, 28.454]
  ]
}
```

## 6) Transport Logistics APIs

### Batch List / Detail

`GET /api/transport/batches`

`GET /api/transport/batches/:id`

```ts
interface TransportBatch {
  id: string;                    // TB127
  farmerId: string;              // F001
  farmerName: string;
  crop: string;
  declaredBags: number;
  status: TransportStatus;
  collectionPoint: string;
  shed: string;
  agent: string;
  dispatchTime: string;          // YYYY-MM-DD HH:mm
  arrivalTime: string | null;    // null when not arrived
  gps: GeoPoint;
}
```

Example response:

```json
{
  "data": [
    {
      "id": "TB127",
      "farmerId": "F001",
      "farmerName": "Joseph Mwansa",
      "crop": "Maize",
      "declaredBags": 120,
      "status": "arrived",
      "collectionPoint": "Chipata Collection Center",
      "shed": "Chipata Central Shed",
      "agent": "Michael Phiri",
      "dispatchTime": "2026-04-21 08:30",
      "arrivalTime": "2026-04-21 14:15",
      "gps": { "lat": -13.6334, "lng": 32.6503 }
    }
  ]
}
```

## 7) Shed Procurement APIs

### Arrived Batches

`GET /api/shed/arrived-batches`

```ts
interface ShedBatch {
  id: string;
  farmerId: string;
  farmerName: string;
  crop: string;
  declaredBags: number;
  arrivalTime: string;           // YYYY-MM-DD HH:mm
  status: ShedBatchStatus;
  actualWeight: number | null;   // kg
  variance: number | null;       // percentage, e.g. 2.3
}
```

### Submit Weighing

`POST /api/shed/batches/:id/weigh`

Request:

```json
{
  "actualWeight": 6000
}
```

Response:

```json
{
  "id": "TB127",
  "status": "weighed",
  "declaredBags": 120,
  "actualWeight": 6000,
  "variance": 0
}
```

### Payment Generation

`POST /api/payments`

Request:

```json
{
  "batchId": "TB127",
  "farmerId": "F001",
  "weightKg": 6000,
  "pricePerKg": 8
}
```

Response:

```json
{
  "paymentId": "PAY-001",
  "amount": 48000,
  "currency": "ZMW",
  "status": "approved"
}
```

## 8) Fraud Detection APIs

### Fraud Alerts

`GET /api/fraud/alerts?riskLevel=high|medium|low`

```ts
interface FraudAlert {
  id: string;                    // FR008
  farmerId: string;
  farmerName: string;
  riskLevel: FraudRiskLevel;
  flags: string[];
  date: string;                  // YYYY-MM-DD
  status: FraudAlertStatus;
}
```

### Fraud Stats

`GET /api/fraud/stats`

```ts
interface FraudRiskStats {
  high: number;
  medium: number;
  low: number;
  total: number;
}
```

### Update Investigation State

`PATCH /api/fraud/alerts/:id`

Request:

```json
{
  "status": "resolved"
}
```

## 9) Logistics Map APIs

### Locations

`GET /api/logistics/locations?type=collection|shed`

```ts
interface BaseLocation {
  id: number;
  name: string;
  type: LocationType;
  district: string;
  coordinates: GeoPoint;
}

interface CollectionLocation extends BaseLocation {
  type: "collection";
  farmers: number;
  activeBatches: number;
}

interface ShedLocation extends BaseLocation {
  type: "shed";
  capacity: string; // currently text in UI, e.g. "25,000 bags"
  current: string;  // currently text in UI, e.g. "18,450 bags"
}

type LogisticsLocation = CollectionLocation | ShedLocation;
```

### Routes

`GET /api/logistics/routes`

```ts
interface LogisticsRoute {
  id: number;
  from: string;
  to: string;
  batches: number;
  status: string; // currently "active"
}
```

## 10) Dashboard APIs

The dashboard currently expects these datasets:

```ts
interface FarmersByRegionItem {
  region: string;
  farmers: number;
  growth: number; // percent
}

interface CropDistributionItem {
  name: string;
  value: number;
  color: string; // hex
}

interface TransportSuccessItem {
  month: string;   // Oct, Nov, ...
  success: number; // percent
  target: number;  // percent
}

interface ProcurementVolumeItem {
  month: string;
  bags: number;
  revenue: number; // thousands of ZMW in current chart label
}

interface RecentActivityItem {
  id: number;
  action: string;
  time: string; // e.g. "8 minutes ago"
  type: "transport" | "alert" | "payment" | "registration";
}
```

Suggested endpoint shape:

`GET /api/dashboard`

```json
{
  "summary": {
    "totalFarmers": 12458,
    "newFarmersThisMonth": 342,
    "transportBatches": 127,
    "inTransitBatches": 18,
    "pendingArrivals": 43,
    "fraudAlerts": 8,
    "highPriorityFraudCases": 2
  },
  "farmersByRegion": [],
  "cropDistribution": [],
  "transportSuccess": [],
  "procurementVolume": [],
  "recentActivity": []
}
```

## 11) Notes for Backend Integration

- The frontend currently mixes raw numeric values and pre-formatted strings (for example `payment` and `actualWeight` in farmer procurement history). Keeping API responses consistent will reduce UI cleanup work.
- Once real APIs are added, consider centralizing types in a shared file like `src/app/types/api.ts`.
- If you normalize all numeric/currency/date fields in API responses, update components to format on the frontend rather than storing formatted text.

