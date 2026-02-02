# API Contract

**Version:** 0.2.0
**Last Updated:** December 2025

This document defines the API contract between the Therapy Docs frontend and backend. Both sides must adhere to this specification.

**Location:** This is the canonical version (lives in backend repo).
Frontend has a symlink to this file to ensure it's always in sync.

---

## Base Configuration

**Frontend expects:**
- `config.apiEndpoint` - Base API URL
- Example local: `http://localhost:3000`
- Example production: `https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev`

**Authentication:**
- All endpoints (except /auth/*) require: `Authorization: Bearer {JWT_TOKEN}` header
- JWT tokens from AWS Cognito

---

## Authentication Endpoints

### POST /auth/login
**Description:** Initial login with email and password

**Request:**
```json
{
  "email": "alex@example.com",
  "password": "SecurePass123!"
}
```

**Response (Success):**
```json
{
  "requiresMFA": true,
  "session": "cognito-session-token"
}
```

**Response (No MFA):**
```json
{
  "requiresMFA": false,
  "token": "jwt-token-here",
  "user": {
    "id": "user-001",
    "email": "alex@example.com",
    "name": "Alex Thompson",
    "license": "LMFT",
    "role": "admin",
    "groups": ["admin"]
  }
}
```

**Response (MFA Setup Required - first login with mandatory MFA):**
```json
{
  "requiresMFASetup": true,
  "session": "cognito-session-token"
}
```

**Status Codes:**
- 200: Success
- 400: Invalid request
- 401: Invalid credentials

---

### POST /auth/mfa
**Description:** Complete MFA verification

**Request:**
```json
{
  "session": "cognito-session-token",
  "code": "123456",
  "email": "alex@example.com"
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-001",
    "email": "alex@example.com",
    "name": "Alex Thompson",
    "license": "LMFT",
    "role": "admin",
    "groups": ["admin"]
  }
}
```

**Status Codes:**
- 200: Success
- 400: Invalid code
- 401: Session expired

---

### POST /auth/logout
**Description:** Invalidate current JWT token

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
- 200: Success

---

## MFA Setup Endpoints

### GET /auth/mfa/status
**Description:** Check if current user has MFA enabled

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "mfaEnabled": true
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized

---

### POST /auth/mfa/setup
**Description:** Initiate MFA setup. Returns secret code and QR URL for authenticator app.

Supports two flows:
1. **MFA_SETUP challenge flow** (first login with mandatory MFA) - uses session from login
2. **Existing user flow** (already has JWT) - uses Authorization header

**Flow 1: MFA_SETUP Challenge (First Login)**

**Headers:**
```
Content-Type: application/json
```

**Request:**
```json
{
  "session": "session-token-from-login",
  "email": "alex@example.com"
}
```

**Response:**
```json
{
  "secretCode": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "otpauth://totp/TherapyDocs:alex@example.com?secret=JBSWY3DPEHPK3PXP&issuer=TherapyDocs",
  "session": "new-session-token"
}
```

**Flow 2: Existing User (Has JWT)**

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "secretCode": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "otpauth://totp/TherapyDocs:alex@example.com?secret=JBSWY3DPEHPK3PXP&issuer=TherapyDocs"
}
```

**Notes:**
- User scans QR code or enters secret code into authenticator app (Google Authenticator, Authy, etc.)
- After setup, user must verify with POST /auth/mfa/verify-setup
- For MFA_SETUP flow, pass the returned `session` to verify-setup

**Status Codes:**
- 200: Success
- 401: Unauthorized (invalid/expired session or token)

---

### POST /auth/mfa/verify-setup
**Description:** Verify TOTP code and complete MFA setup.

Supports two flows:
1. **MFA_SETUP challenge flow** (first login) - completes auth and returns JWT
2. **Existing user flow** (has JWT) - enables MFA and returns success

**Flow 1: MFA_SETUP Challenge (First Login) - Returns JWT**

**Headers:**
```
Content-Type: application/json
```

**Request:**
```json
{
  "session": "session-token-from-setup",
  "email": "alex@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user-001",
    "email": "alex@example.com",
    "name": "Alex Thompson",
    "license": "LMFT",
    "role": "admin",
    "groups": ["admin"]
  }
}
```

**Flow 2: Existing User (Has JWT)**

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request:**
```json
{
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true
}
```

**Notes:**
- Code must be 6 digits from authenticator app
- For MFA_SETUP flow: completes authentication and returns JWT + user info
- For existing user flow: enables MFA for future logins
- After successful verification, MFA is required for all future logins

**Status Codes:**
- 200: Success
- 400: Invalid code (wrong format or mismatch)
- 401: Unauthorized (invalid/expired session or token)

---

### PATCH /auth/profile
**Description:** Update user's own profile (license, name).

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request:**
```json
{
  "license": "LMFT",
  "name": "Alex Thompson"
}
```

All fields are optional. Only include fields you want to update.

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-001",
    "email": "alex@example.com",
    "name": "Alex Thompson",
    "license": "LMFT",
    "role": "admin",
    "groups": ["admin"]
  }
}
```

**Updatable Fields:**
- `license`: Professional license (e.g., "AMFT", "LMFT", "PhD", "MD"). Freeform string, max 50 chars.
- `name`: Display name

**Notes:**
- Send `null` or empty string to clear a field
- Returns the updated user object

**Status Codes:**
- 200: Success
- 400: Invalid request or no valid fields
- 401: Unauthorized (invalid/expired token)

---

## Admin User Management Endpoints

**Authorization:** All admin endpoints require `admin` or `sysadmin` role.

**Role Hierarchy:**
- `sysadmin`: Technical support role - **read-only access to client data (PHI redacted)**, read-only access to user management
- `admin`: Full clinical access - can view/edit client data, can manage supervisors only
- `supervisor`: Full clinical access - can view/edit client data, cannot manage users

**HIPAA Compliance - Sysadmin Restrictions:**
The sysadmin role follows the HIPAA "minimum necessary" principle. Sysadmins:
- **Cannot** create, update, or delete client data (403 Forbidden)
- **Cannot** submit notes, create diagnoses, or create treatment plans
- **Cannot** generate AI narratives
- **Cannot** invite, delete, or modify users (read-only user management)
- **Can** view client data with PHI fields redacted (e.g., `"name": "[REDACTED - 12 chars]"`)
- **Can** view user list for technical support

**PHI Redaction Format:**
When sysadmin views client data, PHI fields are redacted:
```json
{
  "id": "client-001",
  "name": "[REDACTED - 12 chars]",
  "internalNotes": "[REDACTED - 45 chars]",
  "referralSource": "[REDACTED - 22 chars]",
  "payer": "[REDACTED - 10 chars]",
  "clientType": "Individual",
  "status": "active"
}
```
Non-PHI fields remain visible for debugging purposes.

### GET /admin/users
**Description:** List all users in the system

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Required Role:** admin+

**Response:**
```json
{
  "users": [
    {
      "id": "user-001",
      "email": "alex@example.com",
      "name": "Alex Thompson",
      "license": "LMFT",
      "role": "admin",
      "status": "CONFIRMED",
      "mfaEnabled": true,
      "createdAt": "2025-01-01T00:00:00Z"
    },
    {
      "id": "user-002",
      "email": "supervisor@example.com",
      "name": "Clinical Supervisor",
      "license": null,
      "role": "supervisor",
      "status": "FORCE_CHANGE_PASSWORD",
      "mfaEnabled": false,
      "createdAt": "2025-12-18T10:00:00Z"
    }
  ]
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 403: Forbidden (not admin+)

---

### POST /admin/users/invite
**Description:** Invite a new user. Sends invitation email with temporary password.

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Required Role:** admin+ (admins can only invite supervisors, sysadmin blocked)

**Request:**
```json
{
  "email": "supervisor@example.com",
  "name": "Clinical Supervisor",
  "role": "supervisor"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-002",
    "email": "supervisor@example.com",
    "name": "Clinical Supervisor",
    "role": "supervisor",
    "status": "FORCE_CHANGE_PASSWORD"
  }
}
```

**Notes:**
- Valid roles: "sysadmin", "admin", "supervisor"
- Admins can only invite supervisors
- Only sysadmins can invite admins or other sysadmins
- User receives email with temporary password
- User must change password on first login

**Status Codes:**
- 200: Success
- 400: Invalid request (missing fields, invalid role, user exists)
- 401: Unauthorized
- 403: Forbidden (trying to invite a role you can't manage)

---

### PUT /admin/users/{userId}/role
**Description:** Change a user's role

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Required Role:** admin only (sysadmin blocked - read-only access)

**Request:**
```json
{
  "role": "admin"
}
```

**Response:**
```json
{
  "success": true
}
```

**Notes:**
- Admins can only change roles to/from supervisor
- Only sysadmins can promote to admin or demote from admin
- Cannot change your own role

**Status Codes:**
- 200: Success
- 400: Invalid role
- 401: Unauthorized
- 403: Forbidden (trying to manage a role you can't)
- 404: User not found

---

### DELETE /admin/users/{userId}
**Description:** Delete a user from the system

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Required Role:** admin only (sysadmin blocked - read-only access)

**Response:**
```json
{
  "success": true
}
```

**Notes:**
- Admins can only delete supervisors
- Only sysadmins can delete admins
- Cannot delete yourself

**Status Codes:**
- 200: Success
- 400: Cannot delete yourself
- 401: Unauthorized
- 403: Forbidden (trying to delete a user you can't manage)
- 404: User not found

---

### POST /admin/users/{userId}/reset-mfa
**Description:** Reset MFA for a user. User will need to set up MFA again on next login.

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Required Role:** admin only (sysadmin blocked - read-only access)

**Response:**
```json
{
  "success": true
}
```

**Notes:**
- Disables MFA for the specified user
- User will be prompted to set up MFA on next login (since MFA is mandatory)
- Use when user has lost access to their authenticator

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 403: Forbidden (not admin+)
- 404: User not found

---

## Client Endpoints

### GET /clients
**Description:** List all clients for authenticated user

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Query Parameters:**
- `archived` (optional): Filter by archive status
  - `'true'`: Return only archived clients
  - `'false'`: Return only non-archived clients
  - Omitted (default): Return only non-archived clients

**Response:**
```json
[
  {
    "id": "client-001",
    "name": "Sarah M.",
    "initials": "SM",
    "clientType": "Individual",
    "status": "active",
    "startDate": "2024-01-20",
    "sessionBasis": "weekly",
    "paymentType": "insurance",
    "payer": "Blue Cross",
    "authorizationExpiration": "2025-12-31",
    "sessionsRemaining": 8,
    "riskLevel": "standard",
    "lastRiskAssessment": "2025-01-15",
    "referralSource": "Primary care physician",
    "referralDate": "2024-01-10",
    "internalNotes": "Client prefers morning appointments",
    "sessionAdjustment": 5,
    "lastFormType": "Progress Note",
    "lastDelivery": "In Person",
    "totalSessions": 12,
    "lastSessionDate": "2025-12-14",
    "createdAt": "2024-01-15",
    "isArchived": false,
    "archivedAt": null,
    "completedDocumentTypes": ["progress_note", "diagnosis", "treatment_plan"]
  }
]
```

**Field Definitions:**
- `id` (string): Client identifier
- `name` (string): Client's name
- `initials` (string): Client's initials
- `clientType` (string): Type of therapy (e.g., "Individual", "Couples", "Family")
- `status` (string): One of "active" or "inactive"
- `startDate` (string, optional): Date therapy began in YYYY-MM-DD format (separate from createdAt)
- `sessionBasis` (string, optional): One of "weekly", "biweekly", "as-needed", "other"
- `paymentType` (string): One of "insurance", "private-pay", "sliding-scale". Defaults to "private-pay"
- `payer` (string, optional): Insurance company or payer name
- `authorizationExpiration` (string, optional): Date in YYYY-MM-DD format
- `sessionsRemaining` (number, optional): Number of authorized sessions remaining (auto-decrements when notes are submitted)
- `riskLevel` (string, optional): One of "standard", "elevated", "high"
- `lastRiskAssessment` (string, optional): Date of last risk assessment in YYYY-MM-DD format
- `referralSource` (string, optional): Source of client referral
- `referralDate` (string, optional): Date of referral in YYYY-MM-DD format
- `internalNotes` (string, optional): Private therapist notes about the client
- `sessionAdjustment` (number): Prior sessions before using this app (default: 0). Frontend displays totalSessions + sessionAdjustment
- `lastFormType` (string, optional): Type of last session form submitted
- `lastDelivery` (string, optional): Delivery method of last session
- `totalSessions` (number): Total number of sessions for this client
- `lastSessionDate` (string, optional): Date of most recent session in YYYY-MM-DD format
- `createdAt` (string): Client creation date in YYYY-MM-DD format
- `isArchived` (boolean): Whether the client is archived (soft deleted). Defaults to false
- `archivedAt` (string, optional): ISO timestamp when client was archived, null if not archived
- `completedDocumentTypes` (array): List of document types that have been created for this client (e.g., ["progress_note", "diagnosis", "treatment_plan"]). Sorted alphabetically. Empty array if no documents exist.

**Notes:**
- `status` and `isArchived` are independent fields (a client can be "inactive" but not archived, or vice versa)
- Default behavior (no query parameter): Returns only non-archived clients
- Use `?archived=true` to view archived clients

**Status Codes:**
- 200: Success
- 401: Unauthorized

---

### GET /clients/{clientId}
**Description:** Get single client by ID

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "id": "client-001",
  "name": "Sarah M.",
  "initials": "SM",
  "clientType": "Individual",
  "status": "active",
  "sessionBasis": "weekly",
  "paymentType": "insurance",
  "payer": "Blue Cross",
  "authorizationExpiration": "2025-12-31",
  "sessionsRemaining": 8,
  "riskLevel": "standard",
  "lastRiskAssessment": "2025-01-15",
  "referralSource": "Primary care physician",
  "referralDate": "2024-01-10",
  "internalNotes": "Client prefers morning appointments",
  "lastFormType": "Progress Note",
  "lastDelivery": "In Person",
  "totalSessions": 12,
  "lastSessionDate": "2025-12-14",
  "createdAt": "2024-01-15"
}
```

**Notes:**
- Returns the same fields as GET /clients (see field definitions above)

**Status Codes:**
- 200: Success
- 404: Client not found
- 401: Unauthorized

---

### POST /clients
**Description:** Create new client

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Client display name |
| initials | string | Yes | Client initials |
| id | string | No | Client-provided UUID (36-char). If omitted, server generates UUID. Used for idempotent creates. |
| clientType | string | No | One of: Individual, Partner, Couple, Family, Consultation (default: Individual) |
| status | string | No | One of: active, inactive (default: active) |
| ... | ... | No | See full example below for other optional fields |

**Request (Minimal):**
```json
{
  "name": "James K.",
  "initials": "JK"
}
```

**Request (Full - all optional fields):**
```json
{
  "name": "James K.",
  "initials": "JK",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "clientType": "Individual",
  "status": "active",
  "sessionBasis": "weekly",
  "paymentType": "insurance",
  "payer": "Blue Cross",
  "authorizationExpiration": "2025-12-31",
  "sessionsRemaining": 20,
  "riskLevel": "standard",
  "lastRiskAssessment": "2025-01-15",
  "referralSource": "Primary care physician",
  "referralDate": "2024-01-10",
  "internalNotes": "Client prefers morning appointments"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "James K.",
  "initials": "JK",
  "clientType": "Individual",
  "status": "active",
  "sessionBasis": "weekly",
  "paymentType": "insurance",
  "payer": "Blue Cross",
  "authorizationExpiration": "2025-12-31",
  "sessionsRemaining": 20,
  "riskLevel": "standard",
  "lastRiskAssessment": "2025-01-15",
  "referralSource": "Primary care physician",
  "referralDate": "2024-01-10",
  "internalNotes": "Client prefers morning appointments",
  "lastFormType": null,
  "lastDelivery": null,
  "totalSessions": 0,
  "lastSessionDate": null,
  "createdAt": "2025-12-14"
}
```

**Notes:**
- Only `name` and `initials` are required
- All other fields are optional and use defaults if not provided:
  - `clientType`: "Individual"
  - `status`: "active"
  - `paymentType`: "private-pay"
- Fields with valid enums: `status` ("active" | "inactive"), `sessionBasis` ("weekly" | "biweekly" | "as-needed" | "other"), `paymentType` ("insurance" | "private-pay" | "sliding-scale"), `riskLevel` ("standard" | "elevated" | "high")
- `sessionsRemaining` auto-decrements when notes are submitted

**Status Codes:**
- 201: Created
- 400: Invalid request (bad enum value, missing required field, invalid ID format)
- 401: Unauthorized
- 409: Conflict (client with provided ID already exists)

---

### PATCH /clients/{clientId}
**Description:** Update client attributes (partial update - only send fields being changed)

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request (partial update - only include fields to change):**
```json
{
  "name": "Updated Name",
  "status": "inactive",
  "sessionAdjustment": 5,
  "startDate": "2024-01-20",
  "internalNotes": "Updated notes"
}
```

**Editable Fields:**
- `name`, `clientType`, `status`, `startDate`, `sessionBasis`
- `paymentType`, `payer`, `authorizationExpiration`, `sessionsRemaining`
- `referralSource`, `riskLevel`, `internalNotes`, `sessionAdjustment`

**Read-Only Fields (cannot be updated via this endpoint):**
- `createdAt`, `totalSessions`, `lastSessionDate`, `lastRiskAssessment`
- `id`, `isArchived`, `archivedAt`, `updatedAt`, `lastFormType`
- `lastDelivery`, `currentDiagnosisId`, `currentTreatmentPlanId`, `initials`, `referralDate`

**Response (full updated client object):**
```json
{
  "id": "client-001",
  "name": "Updated Name",
  "initials": "SM",
  "clientType": "Individual",
  "status": "inactive",
  "startDate": "2024-01-20",
  "sessionBasis": "weekly",
  "paymentType": "insurance",
  "payer": "Blue Cross",
  "authorizationExpiration": "2025-12-31",
  "sessionsRemaining": 8,
  "riskLevel": "standard",
  "lastRiskAssessment": "2025-01-15",
  "referralSource": "Primary care physician",
  "referralDate": "2024-01-10",
  "internalNotes": "Updated notes",
  "sessionAdjustment": 5,
  "lastFormType": "Progress Note",
  "lastDelivery": "In Person",
  "currentDiagnosisId": null,
  "currentTreatmentPlanId": null,
  "isArchived": false,
  "archivedAt": null,
  "totalSessions": 12,
  "lastSessionDate": "2025-12-14",
  "createdAt": "2024-01-15",
  "updatedAt": "2025-12-17T21:50:00.000000"
}
```

**Notes:**
- Only send fields that are being changed (partial update)
- Attempting to update read-only fields returns 400 error
- Unknown fields return 400 error
- `updatedAt` timestamp is automatically set
- Frontend displays total sessions as: `totalSessions + sessionAdjustment`
  - Example: "17 (12 in system + 5 prior)"

**Status Codes:**
- 200: Success
- 400: Invalid request (read-only field, unknown field, bad enum value, etc.)
- 404: Client not found
- 401: Unauthorized

---

### PATCH /clients/{clientId}/archive
**Description:** Archive a client (soft delete). Client must be archived before permanent deletion.

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Request:**
No request body required.

**Response:**
```json
{
  "id": "client-001",
  "isArchived": true,
  "archivedAt": "2025-12-17T10:30:00.000000",
  "message": "Client archived successfully"
}
```

**Status Codes:**
- 200: Success
- 400: Client is already archived
- 404: Client not found
- 401: Unauthorized

---

### PATCH /clients/{clientId}/restore
**Description:** Restore an archived client (undo soft delete)

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Request:**
No request body required.

**Response:**
```json
{
  "id": "client-001",
  "isArchived": false,
  "archivedAt": null,
  "message": "Client restored successfully"
}
```

**Status Codes:**
- 200: Success
- 400: Client is not archived
- 404: Client not found
- 401: Unauthorized

---

### DELETE /clients/{clientId}
**Description:** Permanently delete a client and all associated data (sessions, diagnoses, treatment plans). Creates encrypted S3 backup before deletion.

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Requirements:**
- Client MUST be archived first using PATCH /clients/{clientId}/archive
- S3 backup must succeed before deletion proceeds
- Deletion is aborted if backup fails (data remains intact)

**Request:**
No request body required.

**Response:**
```json
{
  "success": true,
  "message": "Client and all associated data deleted"
}
```

**Status Codes:**
- 200: Success - Client deleted and S3 backup created
- 400: Client must be archived before deletion
- 404: Client not found
- 500: Deletion aborted - S3 backup failed (data still exists in database)
- 401: Unauthorized

**Notes:**
- S3 backup location: `s3://therapy-notes-backups-{env}/deleted-clients/{clientId}_{timestamp}.json`
- Backup format: Formatted JSON with camelCase field names
- Backup encryption: SSE-S3 (AES256)
- Backup contains: Client metadata, all sessions, all diagnoses, all treatment plans
- Local development: S3 backup is skipped (logged only)

---

## Session Endpoints

### GET /clients/{clientId}/sessions
**Description:** Get all sessions for a client

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Query Parameters:**
- `limit` (optional): Max sessions to return (default: 50)
- `last_timestamp` (optional): For pagination

**Response:**
```json
{
  "clientId": "client-001",
  "sessions": [
    {
      "sessionDate": "2025-12-14",
      "sessionTimestamp": "2025-12-14T10:30:00.000000",
      "narrative": "Client presented for their scheduled therapy session...",
      "durationMinutes": 50,
      "rawNotes": "Full session notes...",
      "formType": "Progress Note",
      "delivery": "Video",
      "deliveryOther": "",
      "clientLocation": "Client's home",
      "clientLocationOther": "",
      "purpose": "Managing work stress - Coping strategies",
      "mseEntries": [
        {
          "id": 1734567890123,
          "note": "Client appeared calm",
          "disturbance": ["sleep"],
          "disturbanceOther": "",
          "mood": ["anxious"],
          "moodOther": "",
          "perception": [],
          "perceptionOther": "",
          "thoughtContent": [],
          "thoughtContentOther": "",
          "thoughtProcess": [],
          "thoughtProcessOther": "",
          "risk": [],
          "riskOther": ""
        }
      ],
      "therapeuticApproaches": ["attachment-based-therapy", "somatic-therapy"],
      "therapeuticApproachesOther": "",
      "interventions": [
        {
          "label": "Built rapport",
          "theme": "rapport",
          "selections": { "V": "built" },
          "description": "Focused on establishing trust",
          "clientResponse": "Client opened up more"
        }
      ],
      "futureNotes": "Review progress next session",
      "additionalNotes": "Client mentioned difficulty sleeping this week"
    }
  ],
  "count": 1,
  "lastTimestamp": "2025-12-14T10:30:00.000000"
}
```

**Notes:**
- Sessions are returned in descending order (newest first)
- All expanded fields return empty defaults for old sessions
- Old sessions without expanded schema will have empty arrays/objects/strings for new fields

**Status Codes:**
- 200: Success
- 404: Client not found
- 401: Unauthorized

---

### GET /clients/{clientId}/sessions/last
**Description:** Get most recent session for a client

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "clientId": "client-001",
  "session": {
    "sessionDate": "2025-12-14",
    "sessionTimestamp": "2025-12-14T10:30:00.000000",
    "narrative": "Client presented for their scheduled therapy session...",
    "durationMinutes": 50,
    "rawNotes": "Full session notes...",
    "formType": "Progress Note",
    "delivery": "Video",
    "deliveryOther": "",
    "clientLocation": "Client's home",
    "clientLocationOther": "",
    "purpose": "Managing work stress - Coping strategies",
    "mseEntries": [
      {
        "id": 1734567890123,
        "note": "Client appeared calm",
        "disturbance": ["sleep"],
        "disturbanceOther": "",
        "mood": ["anxious"],
        "moodOther": "",
        "perception": [],
        "perceptionOther": "",
        "thoughtContent": [],
        "thoughtContentOther": "",
        "thoughtProcess": [],
        "thoughtProcessOther": "",
        "risk": [],
        "riskOther": ""
      }
    ],
    "therapeuticApproaches": ["attachment-based-therapy", "somatic-therapy"],
    "therapeuticApproachesOther": "",
    "interventions": [
      {
        "label": "Built rapport",
        "theme": "rapport",
        "selections": { "V": "built" },
        "description": "Focused on establishing trust",
        "clientResponse": "Client opened up more"
      }
    ],
    "futureNotes": "Review progress next session",
    "additionalNotes": "Client mentioned difficulty sleeping this week"
  }
}
```

**Response (No sessions):**
```json
{
  "error": "No sessions found for client client-001"
}
```

**Notes:**
- All expanded fields return empty defaults for old sessions
- Old sessions without expanded schema will have empty arrays/objects/strings for new fields

**Status Codes:**
- 200: Success
- 404: No sessions found for client
- 401: Unauthorized

---

## Note Endpoints

### POST /notes
**Description:** Create new session note

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request (Basic - all fields optional except clientId, date, duration, notes):**
```json
{
  "clientId": "client-001",
  "date": "2025-12-14",
  "duration": 50,
  "notes": "Client discussed anxiety related to work. Practiced breathing exercises."
}
```

**Request (Expanded Progress Notes - with all optional fields):**
```json
{
  "clientId": "client-001",
  "date": "2025-12-14",
  "duration": 50,
  "notes": "Client discussed anxiety related to work. Practiced breathing exercises.",
  "formType": "Progress Note",
  "delivery": "Video",
  "deliveryOther": "",
  "clientLocation": "Client's home",
  "clientLocationOther": "",
  "purpose": "Managing work stress - Coping strategies for workplace anxiety",
  "mseEntries": [
    {
      "id": 1734567890123,
      "note": "Client appeared calm, well-groomed",
      "disturbance": ["sleep", "other"],
      "disturbanceOther": "Concentration issues",
      "mood": ["anxious", "irritable"],
      "moodOther": "",
      "perception": [],
      "perceptionOther": "",
      "thoughtContent": [],
      "thoughtContentOther": "",
      "thoughtProcess": [],
      "thoughtProcessOther": "",
      "risk": [],
      "riskOther": ""
    }
  ],
  "therapeuticApproaches": ["attachment-based-therapy", "somatic-therapy"],
  "therapeuticApproachesOther": "",
  "interventions": [
    {
      "label": "Built rapport",
      "theme": "rapport",
      "selections": { "V": "built" },
      "description": "Focused on establishing trust through active listening",
      "clientResponse": "Client opened up more than in previous sessions"
    },
    {
      "label": "Anchored to present moment",
      "theme": "present moment",
      "selections": { "V": "anchored", "P": "to" },
      "description": "Used grounding techniques when client became overwhelmed",
      "clientResponse": "Reported feeling calmer after the exercise"
    }
  ],
  "futureNotes": "Review progress with breathing exercises next session",
  "additionalNotes": "Client mentioned difficulty sleeping this week"
}
```

**Response:**
```json
{
  "note": {
    "id": "session-123",
    "clientId": "client-001",
    "date": "2025-12-14",
    "duration": 50,
    "notes": "Client discussed anxiety related to work. Practiced breathing exercises.",
    "formType": "Progress Note",
    "delivery": "Video",
    "deliveryOther": "",
    "clientLocation": "Client's home",
    "clientLocationOther": "",
    "purpose": "Managing work stress - Coping strategies for workplace anxiety",
    "mseEntries": [
      {
        "id": 1734567890123,
        "note": "Client appeared calm, well-groomed",
        "disturbance": ["sleep", "other"],
        "disturbanceOther": "Concentration issues",
        "mood": ["anxious", "irritable"],
        "moodOther": "",
        "perception": [],
        "perceptionOther": "",
        "thoughtContent": [],
        "thoughtContentOther": "",
        "thoughtProcess": [],
        "thoughtProcessOther": "",
        "risk": [],
        "riskOther": ""
      }
    ],
    "therapeuticApproaches": ["attachment-based-therapy", "somatic-therapy"],
    "therapeuticApproachesOther": "",
    "interventions": [
      {
        "label": "Built rapport",
        "theme": "rapport",
        "selections": { "V": "built" },
        "description": "Focused on establishing trust through active listening",
        "clientResponse": "Client opened up more than in previous sessions"
      }
    ],
    "futureNotes": "Review progress with breathing exercises next session",
    "additionalNotes": "Client mentioned difficulty sleeping this week",
    "timestamp": "2025-12-14T10:30:00.000000",
    "createdAt": "2025-12-14T10:30:00.000000",
    "updatedAt": "2025-12-14T10:30:00.000000"
  }
}
```

**Field Definitions:**
- `formType` (optional): One of "Progress Note", "Intake", "Treatment Plan Review", "Crisis Intervention", "Termination". Defaults to "Progress Note"
- `delivery` (optional): One of "In Person", "Video", "Phone", "Other". Defaults to "In Person"
- `deliveryOther` (optional): Custom delivery method description when `delivery === "Other"`. Defaults to empty string
- `clientLocation` (optional): Where the client is during the session. Values depend on delivery method:
  - For In Person: "Office", "Walk and talk", "Other"
  - For Video/Phone: "Client's home", "Client's workplace", "Other"
  - For Other delivery: Freeform string
  - Defaults to empty string
- `clientLocationOther` (optional): Custom location description when `clientLocation === "Other"`. Defaults to empty string
- `purpose` (optional): Session purpose/theme as a string. Defaults to empty string
- `mseEntries` (optional): Array of Mental Status Exam observation objects. Each entry contains:
  - `id` (number): Timestamp ID for frontend tracking
  - `note` (string): Clinical observation notes
  - `disturbance` (array): Disturbance categories (e.g., "sleep", "appetite", "concentration", "other")
  - `disturbanceOther` (string): Custom disturbance description
  - `mood` (array): Mood observations (e.g., "anxious", "depressed", "irritable", "other")
  - `moodOther` (string): Custom mood description
  - `perception` (array): Perceptual disturbances
  - `perceptionOther` (string): Custom perception description
  - `thoughtContent` (array): Thought content observations
  - `thoughtContentOther` (string): Custom thought content description
  - `thoughtProcess` (array): Thought process observations
  - `thoughtProcessOther` (string): Custom thought process description
  - `risk` (array): Risk factors observed
  - `riskOther` (string): Custom risk description
  - Defaults to empty array `[]`
- `therapeuticApproaches` (optional): Array of approach identifiers. Backend accepts any string values without validation. Common values include: "attachment-based-therapy", "coherence-therapy", "emotion-focused-therapy", "feminist-therapy", "humanistic-therapy", "parts-work-therapy", "psychodynamic-therapy", "somatic-therapy", "other-therapy". Defaults to empty array
- `therapeuticApproachesOther` (optional): Custom approach description if "other-therapy" is selected. Defaults to empty string
- `interventions` (optional): Array of intervention objects with:
  - `label` (string): Display phrase constructed from selections
  - `theme` (string): Theme name for lexicon lookup
  - `selections` (object): Maps slot names to selected values (used for editing)
  - `description` (string, optional): Therapist's notes about the intervention
  - `clientResponse` (string, optional): Client's response to the intervention
  - Defaults to empty array `[]`
- `futureNotes` (optional): Notes for next session. Defaults to empty string
- `additionalNotes` (optional): Additional observations or details about the session. Defaults to empty string

**Status Codes:**
- 201: Created
- 400: Invalid request
- 401: Unauthorized

**Implementation Notes:**
- All expanded fields are optional for backward compatibility
- Old sessions without expanded fields will return default empty values

---

### PUT /notes/{noteId}
**Description:** Update existing note

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request:**
```json
{
  "date": "2025-12-14",
  "duration": 50,
  "notes": "Updated session notes..."
}
```

**Response:**
```json
{
  "note": {
    "id": "session-123",
    "clientId": "client-001",
    "date": "2025-12-14",
    "duration": 50,
    "notes": "Updated session notes...",
    "timestamp": "2025-12-14T10:30:00.000000",
    "createdAt": "2025-12-14T10:30:00.000000",
    "updatedAt": "2025-12-14T15:45:00.000000"
  }
}
```

**Status Codes:**
- 200: Success
- 404: Note not found
- 401: Unauthorized

---

### DELETE /notes/{noteId}
**Description:** Delete a note

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
- 200: Success
- 404: Note not found
- 401: Unauthorized

---

## Diagnosis Endpoints

### GET /clients/{clientId}/diagnoses/current
**Description:** Get the principal active/provisional diagnosis for a client

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "id": "a1b2c3d4",
  "clientId": "client-001",
  "icd10Code": "F41.1",
  "description": "Generalized Anxiety Disorder",
  "dateOfDiagnosis": "2025-12-14",
  "status": "active",
  "isPrincipal": true,
  "severity": "moderate",
  "clinicalNotes": "Patient reports ongoing anxiety symptoms...",
  "dateResolved": null,
  "createdAt": "2025-12-14T10:30:00.000000",
  "updatedAt": "2025-12-14T10:30:00.000000"
}
```

**Response (No principal diagnosis):**
```json
{
  "error": "No principal active/provisional diagnosis found for client client-001"
}
```

**Notes:**
- Returns the diagnosis where `isPrincipal=true` AND `status` is either "active" or "provisional"
- Only one diagnosis should be principal at a time (backend enforces)

**Status Codes:**
- 200: Success
- 404: No principal active/provisional diagnosis found
- 401: Unauthorized

---

### GET /clients/{clientId}/diagnoses
**Description:** Get all diagnoses for a client (history)

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Query Parameters:**
- `status` (optional): Filter by status - "active", "provisional", or "resolved"

**Response:**
```json
{
  "clientId": "client-001",
  "diagnoses": [
    {
      "id": "a1b2c3d4",
      "clientId": "client-001",
      "icd10Code": "F41.1",
      "description": "Generalized Anxiety Disorder",
      "dateOfDiagnosis": "2025-12-14",
      "status": "active",
      "isPrincipal": true,
      "severity": "moderate",
      "clinicalNotes": "Patient reports ongoing anxiety symptoms...",
      "dateResolved": null,
      "createdAt": "2025-12-14T10:30:00.000000",
      "updatedAt": "2025-12-14T10:30:00.000000"
    },
    {
      "id": "e5f6g7h8",
      "clientId": "client-001",
      "icd10Code": "F33.1",
      "description": "Major Depressive Disorder, recurrent, moderate",
      "dateOfDiagnosis": "2025-11-01",
      "status": "resolved",
      "isPrincipal": false,
      "severity": "moderate",
      "clinicalNotes": "Initial presentation with depressive symptoms",
      "dateResolved": "2025-12-01",
      "createdAt": "2025-11-01T09:00:00.000000",
      "updatedAt": "2025-12-01T14:00:00.000000"
    }
  ],
  "count": 2
}
```

**Notes:**
- Diagnoses returned in descending order (newest first)
- Multiple diagnoses can exist simultaneously (unlike old "current/archived" model)
- Only one diagnosis can have `isPrincipal=true` at any time

**Status Codes:**
- 200: Success
- 400: Invalid status filter
- 401: Unauthorized

---

### POST /clients/{clientId}/diagnoses
**Description:** Create new diagnosis for a client

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request:**
```json
{
  "icd10Code": "F41.1",
  "description": "Generalized Anxiety Disorder",
  "dateOfDiagnosis": "2025-12-14",
  "status": "active",
  "isPrincipal": true,
  "severity": "moderate",
  "clinicalNotes": "Patient reports persistent worry and anxiety..."
}
```

**Required Fields:**
- `icd10Code` (string): ICD-10 diagnosis code (e.g., "F41.1")
- `description` (string): Human-readable diagnosis description
- `dateOfDiagnosis` (string): Date of diagnosis (YYYY-MM-DD format)
- `status` (string): One of "provisional", "active", "resolved"
- `isPrincipal` (boolean): Whether this is the principal/primary diagnosis

**Optional Fields:**
- `severity` (string): One of "mild", "moderate", "severe", or null
- `clinicalNotes` (string): Additional clinical notes
- `dateResolved` (string): Resolution date (YYYY-MM-DD format), null if not resolved

**Response:**
```json
{
  "id": "a1b2c3d4",
  "clientId": "client-001",
  "icd10Code": "F41.1",
  "description": "Generalized Anxiety Disorder",
  "dateOfDiagnosis": "2025-12-14",
  "status": "active",
  "isPrincipal": true,
  "severity": "moderate",
  "clinicalNotes": "Patient reports persistent worry and anxiety...",
  "dateResolved": null,
  "createdAt": "2025-12-14T10:30:00.000000",
  "updatedAt": "2025-12-14T10:30:00.000000"
}
```

**Notes:**
- When `isPrincipal=true`, automatically unsets `isPrincipal` on all other diagnoses for this client
- Multiple diagnoses can exist simultaneously (no auto-archiving)
- Does NOT archive previous diagnoses (unlike old behavior)

**Status Codes:**
- 201: Created
- 400: Missing required fields, invalid enum value
- 401: Unauthorized
- 403: Forbidden (sysadmin cannot create diagnoses)

---

### PATCH /clients/{clientId}/diagnoses/{diagnosisId}
**Description:** Update diagnosis attributes (partial update)

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request (only include fields to change):**
```json
{
  "status": "resolved",
  "dateResolved": "2025-12-20",
  "isPrincipal": false
}
```

**Mutable Fields:**
- `status` (string): One of "provisional", "active", "resolved"
- `severity` (string): One of "mild", "moderate", "severe", or null
- `clinicalNotes` (string): Additional clinical notes
- `isPrincipal` (boolean): Whether this is the principal diagnosis
- `dateResolved` (string): Resolution date (YYYY-MM-DD), or null

**Immutable Fields (400 error if attempted):**
- `icd10Code`
- `description`
- `dateOfDiagnosis`

**Response:**
```json
{
  "id": "a1b2c3d4",
  "clientId": "client-001",
  "icd10Code": "F41.1",
  "description": "Generalized Anxiety Disorder",
  "dateOfDiagnosis": "2025-12-14",
  "status": "resolved",
  "isPrincipal": false,
  "severity": "moderate",
  "clinicalNotes": "Patient reports persistent worry and anxiety...",
  "dateResolved": "2025-12-20",
  "createdAt": "2025-12-14T10:30:00.000000",
  "updatedAt": "2025-12-20T16:45:00.000000"
}
```

**Notes:**
- When setting `isPrincipal=true`, automatically unsets `isPrincipal` on all other diagnoses
- Attempting to update immutable fields returns 400 error
- `updatedAt` automatically updated on any change

**Status Codes:**
- 200: Success
- 400: Empty body, immutable field attempted, invalid enum
- 404: Diagnosis not found
- 401: Unauthorized
- 403: Forbidden (sysadmin cannot modify diagnoses)

---

## Unified Documents API

The Unified Documents API provides a single interface for managing all clinical documentation types (progress notes, diagnoses, treatment plans, intakes, consultations, and discharge summaries). This API replaces the legacy separate endpoints for sessions, diagnoses, and treatment plans.

### Document Types

| Type | Statuses | Required Content Fields |
|------|----------|------------------------|
| `progress_note` | draft, complete, amended | durationMinutes, rawNotes |
| `diagnosis` | provisional, active, resolved | icd10Code, description, isPrincipal |
| `treatment_plan` | draft, active, superseded | (none required) |
| `intake` | draft, complete | (none required) |
| `consultation` | draft, complete | consultationType |
| `discharge` | draft, complete | reason |

### POST /clients/{clientId}/documents
**Description:** Create a new document for a client

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| documentType | string | Yes | One of: progress_note, diagnosis, treatment_plan, intake, consultation, discharge |
| date | string | No | Document date (YYYY-MM-DD), defaults to today |
| status | string | No | Initial status, defaults to type-specific default |
| content | object | Yes | Type-specific content (see below) |
| id | string | No | Client-provided UUID (36-char) or short ID (8-char alphanumeric). If omitted, server generates ID. Used for idempotent creates and draft-to-document continuity. |

**Request (Progress Note):**
```json
{
  "documentType": "progress_note",
  "date": "2025-12-20",
  "status": "complete",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "content": {
    "durationMinutes": 50,
    "rawNotes": "Client discussed anxiety related to work...",
    "narrative": "Client presented for their scheduled session...",
    "formType": "Progress Note",
    "delivery": "Video",
    "purpose": "Managing work stress - Coping strategies",
    "mseEntries": [],
    "therapeuticApproaches": ["attachment-based-therapy"],
    "interventions": [],
    "futureNotes": ""
  }
}
```

**Request (Diagnosis):**
```json
{
  "documentType": "diagnosis",
  "date": "2025-12-20",
  "status": "active",
  "content": {
    "icd10Code": "F41.1",
    "description": "Generalized Anxiety Disorder",
    "isPrincipal": true,
    "severity": "moderate",
    "clinicalNotes": "Patient reports persistent worry..."
  }
}
```

**Request (Treatment Plan):**
```json
{
  "documentType": "treatment_plan",
  "date": "2025-12-20",
  "status": "active",
  "content": {
    "goals": ["Reduce anxiety symptoms", "Improve sleep quality"],
    "interventions": ["CBT", "Relaxation techniques"],
    "targetSymptoms": ["Excessive worry", "Insomnia"],
    "notes": "6-month treatment plan",
    "reviewDate": "2026-06-20"
  }
}
```

**Response:**
```json
{
  "id": "a1b2c3d4",
  "clientId": "client-001",
  "documentType": "progress_note",
  "status": "complete",
  "date": "2025-12-20",
  "content": {
    "durationMinutes": 50,
    "rawNotes": "Client discussed anxiety related to work...",
    "narrative": "Client presented for their scheduled session..."
  },
  "createdAt": "2025-12-20T10:30:00.000000",
  "updatedAt": "2025-12-20T10:30:00.000000",
  "createdBy": "user-001"
}
```

**Notes:**
- When creating a diagnosis with `isPrincipal=true`, other diagnoses are automatically updated to `isPrincipal=false`
- When creating a treatment plan with `status=active`, other active treatment plans are automatically set to `status=superseded`
- Required content fields vary by document type (see table above)

**Status Codes:**
- 201: Created
- 400: Invalid request (missing required fields, invalid document type, invalid status, invalid ID format)
- 401: Unauthorized
- 403: Forbidden (sysadmin cannot create documents)
- 404: Client not found
- 409: Conflict (document with provided ID already exists for this client)

---

### GET /clients/{clientId}/documents
**Description:** List all documents for a client with optional filtering

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Query Parameters:**
- `type` (optional): Filter by document type (e.g., "progress_note", "diagnosis")
- `status` (optional): Filter by status (e.g., "active", "complete")
- `limit` (optional): Maximum number of documents to return (default: 50, max: 100)
- `cursor` (optional): Pagination cursor from previous response

**Response:**
```json
{
  "clientId": "client-001",
  "documents": [
    {
      "id": "a1b2c3d4",
      "clientId": "client-001",
      "documentType": "progress_note",
      "status": "complete",
      "date": "2025-12-20",
      "content": {
        "durationMinutes": 50,
        "rawNotes": "Client discussed anxiety..."
      },
      "createdAt": "2025-12-20T10:30:00.000000",
      "updatedAt": "2025-12-20T10:30:00.000000",
      "createdBy": "user-001"
    }
  ],
  "count": 1,
  "nextCursor": null
}
```

**Notes:**
- Documents are returned in descending order (newest first)
- PHI fields are redacted for sysadmin users

**Status Codes:**
- 200: Success
- 400: Invalid query parameters
- 401: Unauthorized

---

### GET /clients/{clientId}/documents/{documentId}
**Description:** Get a single document by ID

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "id": "a1b2c3d4",
  "clientId": "client-001",
  "documentType": "progress_note",
  "status": "complete",
  "date": "2025-12-20",
  "content": {
    "durationMinutes": 50,
    "rawNotes": "Client discussed anxiety...",
    "narrative": "Client presented for their scheduled session..."
  },
  "createdAt": "2025-12-20T10:30:00.000000",
  "updatedAt": "2025-12-20T10:30:00.000000",
  "createdBy": "user-001"
}
```

**Notes:**
- PHI fields are redacted for sysadmin users

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 404: Document not found

---

### PATCH /clients/{clientId}/documents/{documentId}
**Description:** Partial update of a document (only send fields you want to change)

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request (only include fields to update):**
```json
{
  "status": "amended",
  "content": {
    "narrative": "Updated narrative text...",
    "additionalNotes": "Client requested correction..."
  }
}
```

**Updatable Fields:**
- `status`: New status (must be valid for document type)
- `date`: Document date
- `content`: Content object (merged with existing content)

**Immutable Fields (400 error if attempted for diagnoses):**
- `icd10Code`
- `description`

**Response:**
```json
{
  "id": "a1b2c3d4",
  "clientId": "client-001",
  "documentType": "progress_note",
  "status": "amended",
  "date": "2025-12-20",
  "content": {
    "durationMinutes": 50,
    "rawNotes": "Client discussed anxiety...",
    "narrative": "Updated narrative text...",
    "additionalNotes": "Client requested correction..."
  },
  "createdAt": "2025-12-20T10:30:00.000000",
  "updatedAt": "2025-12-20T15:45:00.000000",
  "createdBy": "user-001"
}
```

**Notes:**
- When updating a diagnosis to `isPrincipal=true`, other diagnoses are automatically updated to `isPrincipal=false`
- When updating a treatment plan to `status=active`, other active treatment plans are automatically set to `status=superseded`
- Content is merged (not replaced) - only specified fields within content are updated

**Status Codes:**
- 200: Success
- 400: Invalid request, immutable field attempted, invalid status
- 401: Unauthorized
- 403: Forbidden (sysadmin cannot update documents)
- 404: Document not found

---

### DELETE /clients/{clientId}/documents/{documentId}
**Description:** Delete a document

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 403: Forbidden (sysadmin cannot delete documents)
- 404: Document not found

---

### Convenience Endpoints

These endpoints provide quick access to commonly needed documents without requiring filtering.

### GET /clients/{clientId}/documents/current-treatment-plan
**Description:** Get the current active treatment plan

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "id": "a1b2c3d4",
  "clientId": "client-001",
  "documentType": "treatment_plan",
  "status": "active",
  "date": "2025-12-20",
  "content": {
    "goals": ["Reduce anxiety symptoms"],
    "interventions": ["CBT"],
    "reviewDate": "2026-06-20"
  },
  "createdAt": "2025-12-20T10:30:00.000000",
  "updatedAt": "2025-12-20T10:30:00.000000",
  "createdBy": "user-001"
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 404: No active treatment plan found

---

### GET /clients/{clientId}/documents/active-diagnoses
**Description:** Get all active and provisional diagnoses

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "clientId": "client-001",
  "diagnoses": [
    {
      "id": "a1b2c3d4",
      "clientId": "client-001",
      "documentType": "diagnosis",
      "status": "active",
      "date": "2025-12-20",
      "content": {
        "icd10Code": "F41.1",
        "description": "Generalized Anxiety Disorder",
        "isPrincipal": true,
        "severity": "moderate"
      },
      "createdAt": "2025-12-20T10:30:00.000000",
      "updatedAt": "2025-12-20T10:30:00.000000",
      "createdBy": "user-001"
    }
  ],
  "count": 1
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized

---

### GET /clients/{clientId}/documents/principal-diagnosis
**Description:** Get the principal diagnosis (active or provisional with isPrincipal=true)

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "id": "a1b2c3d4",
  "clientId": "client-001",
  "documentType": "diagnosis",
  "status": "active",
  "date": "2025-12-20",
  "content": {
    "icd10Code": "F41.1",
    "description": "Generalized Anxiety Disorder",
    "isPrincipal": true,
    "severity": "moderate"
  },
  "createdAt": "2025-12-20T10:30:00.000000",
  "updatedAt": "2025-12-20T10:30:00.000000",
  "createdBy": "user-001"
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 404: No principal diagnosis found

---

### GET /clients/{clientId}/documents/latest-progress-note
**Description:** Get the most recent progress note

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "id": "a1b2c3d4",
  "clientId": "client-001",
  "documentType": "progress_note",
  "status": "complete",
  "date": "2025-12-20",
  "content": {
    "durationMinutes": 50,
    "rawNotes": "Client discussed anxiety...",
    "narrative": "Client presented for their scheduled session..."
  },
  "createdAt": "2025-12-20T10:30:00.000000",
  "updatedAt": "2025-12-20T10:30:00.000000",
  "createdBy": "user-001"
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 404: No progress notes found

---

## Lexicon Configuration Endpoints

### GET /config/lexicon
**Description:** Get current lexicon configuration (intervention themes and therapeutic approaches)

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response (Success):**
```json
{
  "version": 5,
  "updatedAt": "2025-12-16T10:30:00.000Z",
  "updatedBy": "alex@example.com",
  "interventionLexicon": {
    "TH": [
      {
        "string": "rapport",
        "frames": ["[V _]"],
        "approaches": []
      },
      {
        "string": "psychoeducation",
        "frames": ["[V _]", "[V _ *]"],
        "approaches": [],
        "categoryFilters": { "V": { "mode": "allow", "values": ["provided"] } }
      }
    ],
    "V": ["built", "anchored", "encouraged", "provided", "facilitated"],
    "P": ["to"],
    "categoryMeta": {
      "V": { "label": "Action" },
      "P": { "label": "Preposition" }
    }
  },
  "therapeuticApproaches": [
    { "value": "attachment-based-therapy", "name": "Attachment" },
    { "value": "somatic-therapy", "name": "Somatic" }
  ]
}
```

**Response (No custom lexicon - 404):**
```json
{
  "error": "No custom lexicon configured"
}
```

**Notes:**
- Frontend falls back to static defaults if 404 is returned
- Version number starts at 1 for first custom lexicon

**Status Codes:**
- 200: Success
- 404: No custom lexicon exists (use defaults)
- 401: Unauthorized

---

### PUT /config/lexicon
**Description:** Save new lexicon version (auto-increments version, archives old)

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request:**
```json
{
  "interventionLexicon": {
    "TH": [
      {
        "string": "rapport",
        "frames": ["[V _]"],
        "approaches": []
      }
    ],
    "V": ["built", "anchored", "encouraged", "provided", "facilitated"],
    "P": ["to"],
    "categoryMeta": {
      "V": { "label": "Action" },
      "P": { "label": "Preposition" }
    }
  },
  "therapeuticApproaches": [
    { "value": "attachment-based-therapy", "name": "Attachment" },
    { "value": "somatic-therapy", "name": "Somatic" }
  ]
}
```

**Response:**
```json
{
  "version": 6,
  "updatedAt": "2025-12-16T11:00:00.000Z",
  "updatedBy": "alex@example.com",
  "message": "Lexicon saved successfully"
}
```

**Implementation Notes:**
- Backend should auto-increment the version number
- Archive current version to history before saving new version
- Keep last 10 versions for rollback capability

**Status Codes:**
- 200: Success
- 400: Invalid request (malformed data)
- 401: Unauthorized

---

### GET /config/lexicon/versions
**Description:** Get lexicon version history (most recent first)

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "versions": [
    { "version": 5, "updatedAt": "2025-12-16T10:30:00.000Z", "updatedBy": "alex@example.com" },
    { "version": 4, "updatedAt": "2025-12-15T14:20:00.000Z", "updatedBy": "alex@example.com" },
    { "version": 3, "updatedAt": "2025-12-14T09:00:00.000Z", "updatedBy": "alex@example.com" }
  ]
}
```

**Notes:**
- Returns up to 10 most recent versions
- Does not include full lexicon data (just metadata)

**Status Codes:**
- 200: Success
- 401: Unauthorized

---

### POST /config/lexicon/rollback
**Description:** Rollback to a previous lexicon version

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request:**
```json
{
  "version": 4
}
```

**Response:**
```json
{
  "version": 6,
  "message": "Rolled back to version 4 (saved as version 6)",
  "updatedAt": "2025-12-16T11:15:00.000Z"
}
```

**Implementation Notes:**
- Rollback creates a NEW version (copy of old version's data)
- Does not destructively revert - preserves full history
- Version 4 content becomes version 6 content

**Status Codes:**
- 200: Success
- 400: Invalid version number
- 404: Version not found in history
- 401: Unauthorized

---

## User Settings Endpoints

### GET /settings/{settingType}
**Description:** Get user settings by type (e.g., dashboard preferences)

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Path Parameters:**
- `settingType` (string): Type of settings to retrieve (e.g., "dashboard")

**Response (Success):**
```json
{
  "settingType": "dashboard",
  "settings": {
    "visibleColumns": ["name", "clientType", "lastFormType", "lastSessionDate", "status"],
    "newClientDefaults": {
      "paymentType": "private-pay",
      "sessionBasis": "weekly",
      "riskLevel": "standard",
      "status": "active"
    }
  },
  "updatedAt": "2025-12-17T10:30:00.000Z",
  "version": 1
}
```

**Response (No settings found - returns defaults):**
```json
{
  "settingType": "dashboard",
  "settings": {
    "visibleColumns": ["name", "clientType", "lastFormType", "lastSessionDate", "status"],
    "newClientDefaults": {
      "paymentType": "private-pay",
      "sessionBasis": "weekly",
      "riskLevel": "standard",
      "status": "active"
    }
  },
  "updatedAt": null,
  "version": null
}
```

**Notes:**
- If no custom settings exist for the user, backend returns sensible defaults
- Settings are stored per-user and per-type
- Settings structure is flexible (schema-less) - frontend controls the structure

**Status Codes:**
- 200: Success (returns either saved settings or defaults)
- 400: Invalid settingType
- 401: Unauthorized

---

### PUT /settings/{settingType}
**Description:** Save user settings by type (simple overwrite, no versioning)

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Path Parameters:**
- `settingType` (string): Type of settings to save (e.g., "dashboard")

**Request:**
```json
{
  "settings": {
    "visibleColumns": ["name", "clientType", "lastFormType", "lastSessionDate", "status", "sessionsRemaining"],
    "newClientDefaults": {
      "paymentType": "insurance",
      "sessionBasis": "biweekly",
      "riskLevel": "standard",
      "status": "active"
    }
  }
}
```

**Response:**
```json
{
  "settingType": "dashboard",
  "settings": {
    "visibleColumns": ["name", "clientType", "lastFormType", "lastSessionDate", "status", "sessionsRemaining"],
    "newClientDefaults": {
      "paymentType": "insurance",
      "sessionBasis": "biweekly",
      "riskLevel": "standard",
      "status": "active"
    }
  },
  "updatedAt": "2025-12-17T11:00:00.000Z",
  "version": 1,
  "message": "Settings saved successfully"
}
```

**Implementation Notes:**
- Simple overwrite - no versioning or history tracking
- Version is always 1 (unlike lexicon config which has versioning)
- Settings are stored in ConfigTable with `config_key: user_id` and `config_id: settingType`

**Status Codes:**
- 200: Success
- 400: Invalid request (missing settings, invalid settingType)
- 401: Unauthorized

---

### POST /settings/intervention-usage
**Description:** Record intervention usage when a progress note is saved

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request:**
```json
{
  "interventionIds": ["rapport", "breathing", "grounding"],
  "clientId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true
}
```

**Notes:**
- Fire-and-forget from frontend - failures should not block note save
- Increments both per-client and total counts for each intervention
- Creates usage record if none exists

**Status Codes:**
- 200: Success
- 400: Invalid request (missing interventionIds or clientId)
- 401: Unauthorized

---

### GET /settings/intervention-usage
**Description:** Get intervention usage counts

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Query Parameters:**
- `clientId` (optional): Filter to specific client's usage counts

**Response (without clientId - total counts):**
```json
{
  "rapport": 15,
  "breathing": 23,
  "grounding": 8
}
```

**Response (with clientId - per-client counts):**
```json
{
  "rapport": 5,
  "breathing": 12,
  "grounding": 0
}
```

**Notes:**
- Without `clientId`: Returns total usage counts aggregated across all clients
- With `clientId`: Returns usage counts for that specific client only
- Returns 0 for interventions never used (with clientId filter)

**Status Codes:**
- 200: Success
- 401: Unauthorized

---

## Account Endpoints

### GET /account/baa-status

Get the AWS Business Associate Addendum (BAA) signing status. Used to display HIPAA compliance status in the UI.

**Request:**
```
GET /account/baa-status
Authorization: Bearer ${accessToken}
```

**Response (200 OK):**
```json
{
  "baaSigned": true,
  "signedAt": "2025-12-14T00:04:49.389Z"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| baaSigned | boolean | Whether an active BAA is in place |
| signedAt | string | ISO 8601 timestamp when BAA was signed (null if not signed) |

**Response (BAA not signed):**
```json
{
  "baaSigned": false,
  "signedAt": null
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 500: Failed to check BAA status (AWS Artifact API error)

**Notes:**
- Uses AWS Artifact API to check for active Business Associate Addendum
- The `signedAt` field corresponds to the `effectiveStart` date from AWS Artifact
- This endpoint is read-only and does not modify any data

---

## Field Naming Conventions

**Frontend → Backend:**
- Frontend uses camelCase: `clientId`, `narrative`, `lastSessionDate`
- Backend can use snake_case internally: `client_id`, `narrative`, `last_session_date`
- **Backend MUST return camelCase in JSON responses** to match frontend expectations

**Date Formats:**
- Dates: `YYYY-MM-DD` (e.g., "2025-12-14")
- Timestamps: ISO 8601 (e.g., "2025-12-14T10:30:00.000000")

**IDs:**
- Client IDs: String (e.g., "client-001")
- Session IDs: String (e.g., "session-123")
- Note IDs: Same as session IDs

---

## Error Response Format

All errors should return:

```json
{
  "error": "Human-readable error message"
}
```

**Common Status Codes:**
- 400: Bad Request (invalid input)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (valid token but no access)
- 404: Not Found
- 500: Internal Server Error

---

## CORS Configuration

**Backend must allow:**
- Origins: `*` (for development), specific domain for production
- Methods: `GET, POST, PUT, DELETE, OPTIONS`
- Headers: `Content-Type, Authorization`
- Max Age: 600 seconds

---

## AI Narrative Generation

### POST /ai/narrative
**Description:** Generate AI-powered narrative progress note from a prompt

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request:**
```json
{
  "prompt": "Based on the structured session data below, write a professional narrative progress note.\n\nSESSION INFORMATION:\n- Date: 2025-12-17\n- Duration: 50 minutes\n- Client: SM\n\n[... full interpolated prompt with session data ...]",
  "systemPrompt": "You are a clinical documentation assistant helping a therapist write progress note narratives. Focus on HIPAA-compliant language, professional tone, and clinical accuracy.", // optional
  "maxTokens": 1024, // optional (default: 1024, range: 256-4096)
  "temperature": 0.7, // optional (default: 0.7, range: 0-1)
  "prefill": "<thinking>", // optional (default: "<thinking>")
  "modelId": "global.anthropic.claude-sonnet-4-20250514-v1:0" // optional (default: Claude Sonnet 4)
}
```

**Response:**
```json
{
  "narrative": "Client presented for their scheduled therapy session, appearing on time and appropriately dressed. Mental status examination revealed the client to be alert and oriented to person, place, and time. The session focused on discussing recent life events and coping strategies. Client demonstrated good insight and engagement throughout the session. We will continue to monitor progress and adjust interventions as needed in future sessions."
}
```

**Bedrock Configuration:**
- Model: Customizable via `modelId` parameter (default: Claude Sonnet 4)
- Available models: Claude Sonnet 4, Claude Sonnet 4.5, Claude Haiku 4.5
- Max tokens: Customizable (default: 1024, ~150-300 words)
- Temperature: Customizable (default: 0.7)
- Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
- Lambda timeout: 180 seconds (3 minutes)

**Request Fields:**
- `prompt` (required): The user prompt with interpolated session data
- `systemPrompt` (optional): System-level instructions for the AI's role and behavior
  - More effective than including instructions in the user prompt
  - Recommended for setting tone, compliance requirements, and output format
  - Frontend can allow users to customize this in settings
- `maxTokens` (optional, default: 1024): Maximum tokens for the response
  - Range: 256-4096
  - Lower values = shorter narratives, higher values = longer narratives
  - Typical range: 1024-2048 for clinical narratives
- `temperature` (optional, default: 0.7): Creativity/randomness of the response
  - Range: 0-1
  - Lower (0-0.3) = More focused, deterministic, clinical
  - Medium (0.4-0.7) = Balanced natural language
  - Higher (0.8-1.0) = More creative, varied phrasing
- `prefill` (optional, default: "<thinking>"): Text to prefill Claude's response with
  - Claude generates a response as if it had already written this text
  - Encourages reasoning before writing the narrative (improves quality)
  - Claude does NOT include prefill in its response - only generates what comes after
  - Frontend handles concatenation (prefill + response)
  - Set to empty string to disable prefill
  - Common patterns: "<thinking>", "Let me analyze:", etc.
- `modelId` (optional, default: "global.anthropic.claude-sonnet-4-20250514-v1:0"): Bedrock model ID (global inference profile)
  - Allowed values:
    - `global.anthropic.claude-sonnet-4-20250514-v1:0` (Claude Sonnet 4) - default
    - `global.anthropic.claude-sonnet-4-5-20250929-v1:0` (Claude Sonnet 4.5)
    - `global.anthropic.claude-haiku-4-5-20251001-v1:0` (Claude Haiku 4.5)
  - Uses Bedrock global inference profiles for cross-region inference

**Notes:**
- Frontend handles all prompt interpolation - backend receives ready-to-use prompt
- Narrative generation is an **explicit user action** (not automatic on note save)
- Users click "Save & Generate Narrative" button to generate narratives
- Narratives are longer, detailed prose format (~150-300 words at default settings)
- Prompt size typically 1-2KB (well within Bedrock limits)
- System prompts are more effective than user prompts for setting AI behavior

**Error Handling & Retries:**
- Backend automatically retries throttled requests up to 3 times with exponential backoff
- If all retries fail, returns 429 (frontend should inform user to try again)
- For other Bedrock errors, returns 500 immediately (no retries)
- Typical response time: 3-5 seconds (can be up to 30s with retries, max 3 minutes)
- Frontend should implement a loading indicator during generation

**Status Codes:**
- 200: Success
- 400: Invalid request (missing/empty prompt, invalid maxTokens/temperature/modelId)
- 401: Unauthorized
- 429: Throttled - AI service temporarily busy (retry after a few seconds)
- 500: AI generation failed (Bedrock error, max retries exceeded)

**Local Development:**
- Returns mock narrative in local mode (AWS_SAM_LOCAL=true)
- Skips Bedrock call to avoid costs during development

---

### POST /ai/narrative (Streaming) - Separate Subdomain

**Base URL:**
- Production: `https://stream-api.alexthompsontherapy.com`
- Dev: `https://{streaming-api-id}.execute-api.{region}.amazonaws.com/{stage}`

**IMPORTANT:** This endpoint is on a **SEPARATE subdomain** from the main API due to REST API streaming requirements. Frontend must use the streaming API base URL for this endpoint.

**Description:** Generate AI-powered narrative with streaming response (SSE format). Tokens are streamed as they are generated, providing real-time feedback to the user.

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request:** (same as buffered endpoint)
```json
{
  "prompt": "Based on the structured session data below...",
  "systemPrompt": "You are a clinical documentation assistant...",
  "maxTokens": 1024,
  "temperature": 0.7,
  "prefill": "<thinking>",
  "modelId": "global.anthropic.claude-sonnet-4-20250514-v1:0"
}
```

**Response Format:** Server-Sent Events (SSE)
```
data: {"text": "Client "}\n\n
data: {"text": "presented "}\n\n
data: {"text": "for "}\n\n
data: {"text": "their "}\n\n
...
data: {"done": true, "stopReason": "end_turn"}\n\n
```

**Error Response:**
```
data: {"error": "AI service is temporarily busy. Please try again in a few seconds.", "code": 429}\n\n
```

**Frontend Consumption:**
```javascript
// Use fetch() + ReadableStream (EventSource only supports GET)
const STREAMING_API_URL = 'https://stream-api.alexthompsontherapy.com';

const response = await fetch(`${STREAMING_API_URL}/ai/narrative`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ prompt, systemPrompt, maxTokens, temperature, prefill })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });

  // Parse SSE events
  const lines = buffer.split('\n\n');
  buffer = lines.pop() || ''; // Keep incomplete chunk

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      if (data.text) {
        // Append text to narrative display
        appendToNarrative(data.text);
      } else if (data.done) {
        // Streaming complete
        onStreamComplete(data.stopReason);
      } else if (data.error) {
        // Handle error
        onStreamError(data.error, data.code);
      }
    }
  }
}
```

**Notes:**
- Uses REST API with `responseTransferMode: STREAM` for true streaming
- Cognito JWT authorizer validates tokens (same as main API)
- Uses Bedrock ConverseStream API for token-by-token streaming
- Prefill is handled identically to buffered endpoint
- Frontend must concatenate: `prefill + streamedResponse`

**Status Codes:**
- 200: Streaming response (check SSE events for errors)
- 400: Invalid request (error sent via SSE before stream starts)
- 401: Unauthorized (API Gateway rejects before Lambda)
- 403: Sysadmin role cannot generate narratives

---

## Local Development

**Frontend Mock Mode:**
```javascript
// config.js
const config = {
  useMockAPI: true,
  apiEndpoint: 'http://localhost:3000/api'  // Ignored when useMockAPI: true
};
```

**Backend LocalStack:**
```bash
# API endpoint after LocalStack deployment
http://localhost:4566/restapis/{API_ID}/dev/_user_request_
```

**Testing Without Auth:**
For local testing, backend can skip Cognito validation when:
- `AWS_SAM_LOCAL=true` environment variable is set
- OR `Environment=local` parameter in SAM config

---

## Migration Notes

**Current Backend → Target API:**

Backend currently has:
- `POST /notes` ✅ (matches)
- `GET /notes/{client_id}/last` ❌ Should be `/clients/{clientId}/sessions/last`
- `GET /clients` ✅ (matches)
- `GET /notes/{client_id}` ❌ Should be `/clients/{clientId}/sessions`

**Changes needed:**
1. Move `/notes/{client_id}/last` → `/clients/{client_id}/sessions/last`
2. Move `/notes/{client_id}` → `/clients/{client_id}/sessions`
3. Add auth endpoints: `/auth/login`, `/auth/mfa`, `/auth/logout`
4. Add: `GET /clients/{clientId}`, `POST /clients`
5. Add: `PUT /notes/{noteId}`, `DELETE /notes/{noteId}`
6. Convert snake_case responses to camelCase

---

## Testing Checklist

- [ ] All endpoints return correct status codes
- [ ] Error responses follow standard format
- [ ] CORS headers present on all responses
- [ ] JWT validation works (except /auth endpoints)
- [ ] Date formats match specification
- [ ] Field names are camelCase in responses
- [ ] AI narratives generate correctly
- [ ] Pagination works for session lists
- [ ] 404 vs null handling for "no sessions" case

---

**Maintained by:** Frontend & Backend teams
**Change Process:** Update this document BEFORE making API changes
