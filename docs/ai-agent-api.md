# AI Agent API Reference

This document explains how AI agents can authenticate with and pull data from the hr-attendance-app REST API. It is the companion guide to `willdesign-management/AI_AGENT_GUIDE.md`.

## Authentication

All API requests require a Cognito JWT Bearer token.

```
Authorization: Bearer <jwt_token>
```

The JWT contains a `custom:employee_id` claim that identifies the caller. For AI agent access, use a dedicated service account with `ADMIN` role permissions so all employee data is accessible.

### Getting a Token

**Production:** Use Cognito's `InitiateAuth` (client credentials or admin auth flow) with the service account credentials.

**Development:** Use the dev-only endpoints:
- `GET /api/dev-auth/employees` — list available test accounts
- `POST /api/dev-auth/login` — get a token for a test account

### Token Refresh

Cognito tokens expire after 1 hour. Cache the token and refresh before expiry. If a request returns `401`, re-authenticate and retry once.

---

## Base URL

The API base URL depends on environment:
- **Production:** Configured in `config.yaml` → `api.url` (API Gateway endpoint)
- **Development:** `http://localhost:3001` (or whichever port the local API runs on)

---

## Endpoints for AI Agents

### Employees

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/employees` | List all employees |
| `GET` | `/api/employees?status=ACTIVE` | List only active employees |
| `GET` | `/api/employees/:id` | Get single employee by ID |
| `GET` | `/api/employees/me` | Get current authenticated user |

**Response:** Array of employee objects with `employeeId`, `name`, `email`, `status`, `contractType`, `joinDate`, `groupId`.

**AI Use Case:** Map employee IDs between this system and `willdesign-management/employees/ROSTER.md`. Verify active/inactive status.

---

### Attendance Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/attendance/events` | Get attendance clock events |
| `GET` | `/api/attendance/summary` | Get pre-calculated hours summary (daily/weekly/monthly) |
| `GET` | `/api/attendance/state` | Get current clock state for authenticated user |
| `GET` | `/api/attendance/team-states` | Get clock state for all team members |

**Query Parameters for `/api/attendance/events`:**

| Param | Type | Description |
|-------|------|-------------|
| `employeeId` | string | Filter by employee (required for AI queries) |
| `month` | string (`YYYY-MM`) | Filter by month |
| `date` | string (`YYYY-MM-DD`) | Filter by specific date |

**Query Parameters for `/api/attendance/summary`:**

| Param | Type | Description |
|-------|------|-------------|
| `employeeId` | string | Employee to summarize |
| `date` | string (`YYYY-MM-DD`) | Date to calculate from (defaults to today) |

**Summary Response Fields:** `hoursToday`, `hoursWeek`, `hoursMonth`, `breakMinutesToday`, `requiredDaily`, `requiredWeekly`, `requiredMonthly`

**Example:**
```
GET /api/attendance/events?employeeId=EMP001&month=2026-03
GET /api/attendance/summary?employeeId=EMP001&date=2026-03-31
```

**Response (events):** Array of clock events (`CLOCK_IN`, `CLOCK_OUT`, `BREAK_START`, `BREAK_END`) with timestamps, work location, duration calculations.

**Response (summary):** Pre-calculated hours vs requirements — use this instead of manually computing from raw events when you just need totals.

**AI Use Case:** Use `/summary` for quick hours checks in snapshots. Use `/events` when you need daily breakdowns or patterns.

---

### Payroll

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/payroll/:yearMonth` | Get payroll breakdown for a month |

**Path Parameter:** `yearMonth` format `YYYY-MM` (e.g., `2026-03`)

**Example:**
```
GET /api/payroll/2026-03
```

**Response:** Per-employee breakdown with: required hours, actual hours, deficit/surplus, base salary, adjustments, flags.

**AI Use Case:** Primary source for attendance hours summary in monthly snapshots. Shows deficit/surplus vs required hours per employee.

---

### Leave

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/leave/balance` | Get leave balance |
| `GET` | `/api/leave-requests` | List leave requests |

**Query Parameters:**

| Endpoint | Param | Type | Description |
|----------|-------|------|-------------|
| `/api/leave/balance` | `employeeId` | string | Employee to check |
| `/api/leave-requests` | `employeeId` | string | Filter by employee |
| `/api/leave-requests` | `status` | `PENDING` \| `APPROVED` \| `REJECTED` | Filter by status |

**Example:**
```
GET /api/leave/balance?employeeId=EMP001
GET /api/leave-requests?employeeId=EMP001&status=APPROVED
```

**AI Use Case:** Include approved leave in monthly snapshots. Check leave balance when assessing attendance patterns.

---

### Flags

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/flags` | List compliance flags |
| `GET` | `/api/flags?status=PENDING` | List unresolved flags |

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `status` | `PENDING` \| `RESOLVED` | Filter by resolution status |

**Response:** Array of flags with `employeeId`, `type` (e.g., deficit hours, missed clock-out), `status`, `details`, `createdAt`.

**AI Use Case:** Include pending flags in performance reports. Track compliance issues over time.

---

### Daily Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports` | List daily standup reports |

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `employeeId` | string | Filter by employee |
| `date` | string (`YYYY-MM-DD`) | Filter by date |

**Example:**
```
GET /api/reports?employeeId=EMP001&date=2026-03-15
```

**AI Use Case:** Count reports submitted vs working days for daily report compliance in snapshots. Cross-reference reported tasks with GitHub/JIRA activity.

---

### Holidays

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/holidays` | List holidays |
| `GET` | `/api/holidays?region=NP&year=2026` | Filter by region/year |

**AI Use Case:** Account for holidays when calculating expected working days in monthly snapshots.

---

### Audit Trail

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/audit/:targetId` | Get audit log for a target entity |

**AI Use Case:** Verify data integrity, track changes to employee records.

---

### Quotas

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/quotas/:employeeId` | Get hour quotas for an employee |

**AI Use Case:** Compare actual hours against quotas in performance reports.

---

## Monthly Snapshot Data Pull Sequence

When generating a monthly snapshot for `employees/{id}/snapshots/YYYY-MM.md`, pull data in this order:

```
1. GET /api/employees/:id
   → Verify employee is active, get contract type

2. GET /api/payroll/YYYY-MM
   → Extract this employee's row: required hours, actual hours, deficit/surplus

3. GET /api/attendance/events?employeeId={id}&month=YYYY-MM
   → Calculate: total days worked, average hours/day, break patterns

4. GET /api/leave-requests?employeeId={id}&status=APPROVED
   → Filter to the target month, count leave days by type

5. GET /api/leave/balance?employeeId={id}
   → Current leave balance (paid, unpaid, credited)

6. GET /api/reports?employeeId={id}
   → Filter to target month, count: reports submitted, days with reports, days without

7. GET /api/flags?status=PENDING
   → Filter to this employee, list any unresolved compliance flags

8. GET /api/holidays?region=NP&year=YYYY
   → Filter to target month, count holidays (reduce expected working days)

9. GET /api/quotas/{id}
   → Get monthly hour quota for comparison
```

After pulling all this, combine with GitHub API and JIRA API data (external to this app), then write the snapshot file using the template at `willdesign-management/templates/monthly-snapshot.md`.

---

## Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| `200` | Success | Parse response body |
| `401` | Token expired or invalid | Re-authenticate, retry once |
| `403` | Insufficient permissions | Check service account role has ADMIN |
| `404` | Resource not found | Log as "Data not available" in snapshot |
| `422` | Validation error | Check query parameter formats |
| `500` | Server error | Retry after 5s, max 3 retries. If persistent, log as "Source unavailable" |

---

## Rate Limiting

No explicit rate limits currently. However, for monthly snapshot batch runs (all employees), add a 500ms delay between employees to avoid overwhelming the Lambda cold starts.

---

## Data Mapping: hr-attendance-app → willdesign-management

| hr-attendance-app field | Snapshot field |
|------------------------|----------------|
| Payroll → actual hours | Attendance Metrics → Total Hours Logged |
| Payroll → required hours | Attendance Metrics → Required Hours |
| Payroll → deficit/surplus | Attendance Metrics → Deficit / Surplus |
| Attendance events count (CLOCK_IN per day) | Attendance Metrics → Days Present |
| Reports count for month | Daily Reports → Reports Submitted |
| Working days − holidays − approved leave | Daily Reports → Working Days |
| Flags (PENDING, this employee) | Notable Events / Flags |
| Leave requests (APPROVED, this month) | Leave & Absences table |
