# Backend API Data Contract

This document describes the current frontend expectations for backend request/response shapes and the mock data formats used in the app.

## Base API URL

The frontend reads the backend base URL from the environment variable:

- `VITE_API_BASE_URL`

If this variable is not defined, the frontend falls back to:

- `https://fra-backend-vh1s.onrender.com/api`

All endpoints are requested relative to this base URL.

## Auth endpoints

### 1. POST `/auth/login`

Used for password-based authentication.

Request body:

```json
{
  "officerIdOrNrc": "string",
  "password": "string"
}
```

Response body expected by frontend:

```json
{
  "token": "string",
  "user": {
    "id": "string",
    "name": "string",
    "role": "string"
  }
}
```

Notes:

- The frontend stores the returned token and user data in local storage.
- The token is later sent as a `Bearer` token in the `Authorization` header for requests requiring authentication.

### 2. POST `/auth/biometric-login`

Used for biometric authentication.

Request body:

```json //skip it for now
{
  "officerIdOrNrc": "string",
  "biometricSample": "string",
  "deviceId": "string"
}
```

Response body is the same as `/auth/login`.

Notes:

- The frontend currently sends placeholder biometric values from the web client:
  - `biometricSample`: `"browser-biometric-sample"`
  - `deviceId`: `"web-client"`

## agent registration endpoint

### POST `/agent`

Used by the farmer registration form.

Request body:

```json
{
  "name": "string",
  "nrc": "string",
  "phone": "string",
  "district": "string",

}
```


## Mock data structures currently used by UI pages

Several UI pages are still driven by frontend mock data. The backend team should use these formats when replacing the mocks or exposing new endpoints.

### Farmer management record

Used by `src/app/components/farmers/FarmerManagement.tsx`.

```json
{
  "id": "string",
  "name": "string",
  "nrc": "string",
  "location": "string",
  "crop": "string",
  "status": "active" | "pending" | "rejected",
  "registered": "YYYY-MM-DD"
}
```

Example:

```json
{
  "id": "F001",
  "name": "Joseph Mwansa",
  "nrc": "123456/78/1",
  "location": "Chipata, Eastern",
  "crop": "Maize",
  "status": "active",
  "registered": "2026-01-15"
}
```

### Fraud alert record

Used by `src/app/components/fraud/FraudDetection.tsx`.

```json
{
  "id": "string",
  "farmerId": "string",
  "farmerName": "string",
  "riskLevel": "high" | "medium" | "low",
  "flags": ["string"],
  "date": "YYYY-MM-DD",
  "status": "under-review" | "pending" | "resolved"
}
```

Example:

```json
{
  "id": "FR008",
  "farmerId": "F012",
  "farmerName": "Simon Hachileka",
  "riskLevel": "high",
  "flags": [
    "Weight variance > 15%",
    "Duplicate NRC detected",
    "Location mismatch"
  ],
  "date": "2026-04-21",
  "status": "under-review"
}
```

### Transport batch record

Used by `src/app/components/transport/TransportLogistics.tsx`.

```json
{
  "id": "string",
  "farmerId": "string",
  "farmerName": "string",
  "crop": "string",
  "declaredBags": number,
  "status": "collected" | "in-transit" | "arrived",
  "collectionPoint": "string",
  "shed": "string",
  "agent": "string",
  "dispatchTime": "YYYY-MM-DD HH:mm",
  "arrivalTime": "YYYY-MM-DD HH:mm" | null,
  "gps": {
    "lat": number,
    "lng": number
  }
}
```

Example:

```json
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
```

### Shed procurement batch record

Used by `src/app/components/shed/ShedProcurement.tsx`.

```json
{
  "id": "string",
  "farmerId": "string",
  "farmerName": "string",
  "crop": "string",
  "declaredBags": number,
  "arrivalTime": "YYYY-MM-DD HH:mm",
  "status": "pending-weighing" | "weighed",
  "actualWeight": number | null,
  "variance": number | null
}
```

Example:

```json
{
  "id": "TB127",
  "farmerId": "F001",
  "farmerName": "Joseph Mwansa",
  "crop": "Maize",
  "declaredBags": 120,
  "arrivalTime": "2026-04-21 14:15",
  "status": "pending-weighing",
  "actualWeight": null,
  "variance": null
}
```

### Logistics map data formats

Used by `src/app/components/map/LogisticsMap.tsx`.

#### Location object

```json
{
  "id": "string",
  "name": "string",
  "city": "string",
  "type": "collection" | "shed",
  "coordinates": {
    "lat": number,
    "lng": number
  }
}
```

Example:

```json
{
  "id": "lusaka_cc",
  "name": "Lusaka Collection Center",
  "city": "Lusaka",
  "type": "collection",
  "coordinates": { "lat": -15.4167, "lng": 28.2833 }
}
```

#### Route object

```json
{
  "id": number,
  "fromId": "string",
  "toId": "string"
}
```

Example:

```json
{
  "id": 1,
  "fromId": "lusaka_cc",
  "toId": "lusaka_shed"
}
```

#### Truck object

```json
{
  "id": "string",
  "label": "string",
  "routeId": number,
  "position": [number, number],
  "speed": number,
  "status": "in_transit" | "at_shed" | "loading" | "delayed",
  "cargo": "string",
  "driver": "string",
  "eta": "string",
  "arrived": boolean,
  "progressPct": number,
  "startPosition": [number, number]
}
```

Example:

```json
{
  "id": "T1",
  "label": "ZMB-001",
  "routeId": 1,
  "position": [28.2833, -15.4167],
  "speed": 60,
  "status": "in_transit",
  "cargo": "Soya beans",
  "driver": "Chanda Mwamba",
  "eta": "—",
  "arrived": false,
  "progressPct": 35,
  "startPosition": [28.2833, -15.4167]
}
```

## Authentication header format

For protected requests, the frontend sends:

```
Authorization: Bearer <token>
```

## Important assumptions

- The frontend uses JSON payloads exclusively.
- `Content-Type: application/json` is always set.
- Any non-2xx response is treated as an error.
- If the backend returns JSON with a `message` field, the frontend will use it for error display.

## Current backend routes wired in the frontend

- `POST /auth/login`
- `POST /auth/biometric-login`
- `POST /farmers`

## Backend endpoints recommended for future integration

These pages are currently using frontend mock objects and should be considered when adding API support:

- Farmer management data list
- Fraud alert list and detail
- Transport batches / live truck tracking
- Logistics map locations, routes, and trucks
- Shed procurement batch details and weighing results

## Additional notes for backend team

- The frontend is built as a token-based authenticated app.
- `user` must include `id`, `name`, and `role`.
- Ensure CORS allows the frontend origin.
- Any future API should preserve the exact mock field names and enum values shown above unless the frontend is updated.
