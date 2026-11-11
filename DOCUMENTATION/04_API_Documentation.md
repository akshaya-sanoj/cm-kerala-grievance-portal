# 04. API Documentation

Base URL (Local): `http://localhost:5000/api`  
Authentication: Bearer JWT header (`Authorization: Bearer <token>`) for protected routes.

---

## 1. Public & Metadata Endpoints

### `GET /api/health`
Health and DB connectivity check.
- **Response (200):**
```json
{
  "success": true,
  "status": "ok",
  "prototype": true,
  "databaseConnected": true,
  "timestamp": "2026-11-11T15:00:00.000Z"
}
```

### `GET /api/public/stats`
Returns aggregated portal statistics (`totalGrievances`, `resolvedGrievances`, `inProgressGrievances`, `submittedGrievances`, `activeDepartments`, `averageRating`, `feedbackCount`).

### `GET /api/departments`
Lists all active Kerala government departments (`name`, `code`, `description`, `headDesignation`, `slaDays`, `categories`, `contactEmail`).

### `GET /api/metadata`
Returns valid enums for `districts` (14), `categories` (10), `statuses` (5), and `priorities` (`Low`, `Medium`, `High`).

### `POST /api/contact`
Saves a public enquiry in `ContactEnquiry`.
- **Body:** `{ "name": "Rani", "email": "rani@example.com", "subject": "Upload Query", "message": "How do I attach PDF evidence?" }`
- **Response (201):** `{ "success": true, "message": "...", "enquiry": { "id": "...", "name": "Rani", ... } }`

### `GET /api/grievances/track/:referenceId`
Public status lookup by Reference ID (excludes internal CMO remarks and personal citizen contact info).
- **Example:** `GET /api/grievances/track/KL-CMO-2026-100101`

---

## 2. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/register`
Registers a new citizen account (`role` is always locked to `'citizen'`).
- **Body:** `{ "name": "Arjun", "email": "arjun@example.com", "mobileNumber": "9847000001", "password": "Password123", "district": "Ernakulam" }`
- **Response (201):** `{ "success": true, "token": "<jwt>", "user": { "id": "...", "role": "citizen", ... } }`

### `POST /api/auth/login`
Authenticates any role (`citizen`, `cmo_admin`, `department_officer`).
- **Body:** `{ "email": "cmo@kerala-demo.gov.in", "password": "DemoPass@2026" }`
- **Response (200):** `{ "success": true, "token": "<jwt>", "user": { ... } }`

### `GET /api/auth/me` *(Protected)*
Returns the currently authenticated user profile.

---

## 3. AI Grievance Assistant Endpoint (`/api/ai`)

### `POST /api/ai/analyze` *(Citizen or CMO Admin)*
Analyzes complaint text via Google Gemini API (or labelled heuristic fallback) and flags potential duplicates.
- **Body:**
```json
{
  "subject": "Sparking transformer near school",
  "description": "An 11kV electric pole is leaning dangerously and sparking since yesterday evening.",
  "district": "Thrissur",
  "category": "Electricity & Power"
}
```
- **Response (200):**
```json
{
  "success": true,
  "advisoryNotice": "AI suggestions are advisory only and must be reviewed by the citizen or CMO administrator before official decisions.",
  "analysis": {
    "suggestedDepartmentCode": "KSEB",
    "suggestedDepartmentName": "Kerala State Electricity Board (KSEB)",
    "suggestedCategory": "Electricity & Power",
    "recommendedPriority": "High",
    "summary": "High-risk leaning 11kV pole and sparking transformer near school area in Thrissur.",
    "reasoning": "Active electrical sparking poses immediate public safety danger.",
    "potentialDuplicates": [],
    "source": "gemini",
    "model": "gemini-2.5-flash",
    "isFallback": false,
    "fallbackReason": ""
  }
}
```

---

## 4. Citizen Portal Endpoints (`/api/grievances`)

| Method & Path | Role | Purpose |
| :--- | :--- | :--- |
| `POST /api/grievances` | `citizen` | Submit grievance (`multipart/form-data` supporting optional `attachment` file + `district`, `category`, `subject`, `description`, `priority`, `aiAnalysis`). Returns unique `referenceId`. |
| `GET /api/grievances/my` | `citizen` | List citizen's grievances + `summary` (`total`, `pending`, `resolved`). Supports `?status=` and `?search=`. |
| `GET /api/grievances/:id` | `citizen` | View full grievance record, public history, attachments, and feedback (owner-checked). |
| `POST /api/grievances/:id/feedback` | `citizen` | Submit `{ "rating": 5, "isSatisfied": true, "comment": "..." }` on a `Resolved` grievance. |
| `POST /api/grievances/:id/reopen` | `citizen` | Reopen a `Resolved` grievance with `{ "reason": "..." }`, transitioning status to `Reopened`. |

---

## 5. CMO Administrator Endpoints (`/api/cmo`)

All endpoints require `Authorization: Bearer <token>` with `role === 'cmo_admin'`.

| Method & Path | Purpose |
| :--- | :--- |
| `GET /api/cmo/stats` | Returns overview KPIs (`total`, `pending`, `resolved`, `overdue`, `escalated`, `atrPendingReview`) + `byDistrict`, `byDepartment`, `byStatus`, `byPriority`. |
| `GET /api/cmo/grievances` | Filter grievances (`district`, `category`, `priority`, `status`, `departmentId`, `overdueOnly`, `atrPendingOnly`, `search`, `page`, `limit`). |
| `GET /api/cmo/grievances/:id` | Full grievance record including internal remarks and assignments. |
| `GET /api/cmo/officers` | Lists active department officers for assignment dropdowns. |
| `POST /api/cmo/grievances/:id/ai-review` | Re-runs AI triage and duplicate check for CMO review. |
| `POST /api/cmo/grievances/:id/assign` | Assigns/forwards grievance (`departmentId`, optional `officerId`, `priority`, `instructions`). Transitions to `Under Review`. |
| `POST /api/cmo/grievances/:id/remarks` | Adds internal (`isInternal: true`) or public CMO remark. |
| `POST /api/cmo/grievances/:id/escalate` | Marks `isEscalated: true` with reason and optional High priority bump. |
| `POST /api/cmo/grievances/:id/review-resolution` | `{ "decision": "approve" | "return", "remarks": "..." }` to mark `Resolved` or return to department (`In Progress`). |
| `GET /api/cmo/enquiries` & `PATCH /api/cmo/enquiries/:id` | View and update status of Contact Us enquiries. |

---

## 6. Department Officer & Attachment Endpoints

| Method & Path | Role | Purpose |
| :--- | :--- | :--- |
| `GET /api/officer/grievances` | `department_officer` | Lists grievances assigned strictly to officer's department + KPI counts. |
| `GET /api/officer/grievances/:id` | `department_officer` | Inspect forwarded grievance and attachments (department-verified). |
| `PATCH /api/officer/grievances/:id/investigate` | `department_officer` | Updates status to `In Progress` and logs investigation remarks. |
| `POST /api/officer/grievances/:id/atr` | `department_officer` | Submits `actionTakenReport` text + optional `attachment` file back to CMO for review. |
| `GET /api/attachments/:id/download` | Authenticated | Streams file attachment after verifying ownership/department/CMO permission. |
