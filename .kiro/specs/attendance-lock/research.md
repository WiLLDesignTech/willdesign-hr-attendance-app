# Research & Design Decisions

## Summary
- **Feature**: `attendance-lock`
- **Discovery Scope**: Extension
- **Key Findings**:
  - Slack attendance messages use `AttendanceService.processEvent` — lock check there covers both web and Slack with zero extra work
  - Employee `employmentType` field serves as the natural group identifier for group-scope locks
  - `processEvent` currently only receives `employeeId` — needs employee lookup to resolve group-scope locks

## Research Log

### Lock Check Integration Point
- **Context**: Where should the lock check happen to enforce across all channels?
- **Sources Consulted**: `core/src/attendance/service.ts` (processEvent), `api/src/handlers/attendance.ts`, Slack handler architecture
- **Findings**: `processEvent` is the single chokepoint for all attendance events (web API and Slack SQS handler both call it). Adding the lock check at the top of `processEvent` ensures consistent enforcement.
- **Implications**: No separate Slack-specific lock logic needed. Requirement 6 is satisfied by Requirement 2 implementation.

### Group Scope Identifier
- **Context**: What identifies a "group" for group-scope locks?
- **Sources Consulted**: `types/src/employee.ts` (Employee interface), `policies/groups/` directory structure
- **Findings**: `Employee.employmentType` (e.g., `JP_FULL_TIME`, `NP_PAID_INTERN`) is the natural group identifier. Policy cascade already uses employment type as the group key. Using `employmentType` as `groupId` maintains consistency.
- **Implications**: Group-scope lock `groupId` stores an `EmploymentType` value.

### Employee Lookup for Group-Scope Resolution
- **Context**: `processEvent` receives `employeeId` but needs `employmentType` to check group-scope locks
- **Alternatives Considered**:
  1. Add `EmployeeRepository` dependency to `AttendanceService`
  2. Add `employmentType` to `ProcessEventInput`
- **Selected Approach**: Add `EmployeeRepository` to `AttendanceService` constructor
- **Rationale**: The caller (handler) should not need to know about lock internals. The service is the right place to resolve employee metadata. Handlers already receive auth context, not employee details. Adding to input would leak lock concerns into the handler layer.
- **Trade-offs**: Changes `AttendanceService` constructor signature, requiring composition root update and test fixture changes. This is a one-time cost.

### DynamoDB Key Design for Locks
- **Context**: Need efficient key pattern for lock storage and querying
- **Sources Consulted**: `data/src/dynamo/keys.ts`, existing single-table patterns
- **Findings**: Using `PK: LOCK#<yearMonth>`, `SK: <scope>#<targetId>` allows:
  - Query all locks for a yearMonth: `PK = LOCK#2026-03`
  - Query specific scope: `PK = LOCK#2026-03 AND begins_with(SK, COMPANY)` or `begins_with(SK, GROUP#)`
  - Company lock has SK `COMPANY` (no target needed)
  - Group lock has SK `GROUP#JP_FULL_TIME`
  - Employee lock has SK `EMP#EMP001`
  - Duplicate prevention via `attribute_not_exists(PK) AND attribute_not_exists(SK)` condition
- **Implications**: Simple, efficient key design. No GSI needed for lock queries.

### Admin UI Tab Extension
- **Context**: How to add lock management to admin panel
- **Sources Consulted**: `web/src/components/admin/AdminPage.tsx`
- **Findings**: `ADMIN_TAB_IDS` is a const array. Adding `"locks"` extends the tab system automatically. Tab content is rendered based on `activeTab` state. A new `AttendanceLockTab` component renders when `activeTab === "locks"`.
- **Implications**: Minimal change to AdminPage — just add tab ID and conditional render.

## Design Decisions

### Decision: Lock Repository as Separate Interface
- **Context**: Should lock CRUD be part of `AttendanceRepository` or a new interface?
- **Selected Approach**: New `AttendanceLockRepository` interface
- **Rationale**: Locks are a distinct concern from attendance events. Separate interface follows ISP (Interface Segregation Principle) and existing patterns (each entity has its own repository interface).

### Decision: Lock Check Returns Structured Error
- **Context**: When a lock blocks an event, what information should the error contain?
- **Selected Approach**: Return `{ success: false, error: "Period <yearMonth> is locked (scope: <scope>)" }` using the existing `Result` pattern
- **Rationale**: Includes scope and yearMonth so the caller (handler or Slack bot) can provide a meaningful message. Follows existing error patterns in `processEvent`.

## Risks & Mitigations
- **Risk**: `AttendanceService` constructor change breaks existing tests → **Mitigation**: Add `EmployeeRepository` as optional third parameter with fallback, or update all test fixtures (preferred — explicit is better)
- **Risk**: Lock check adds latency to every clock event → **Mitigation**: Single DynamoDB query on `PK = LOCK#<yearMonth>` is ~5ms, acceptable for attendance operations
- **Risk**: Admin accidentally locks wrong period → **Mitigation**: Unlock endpoint allows immediate correction; no destructive data changes from locking
