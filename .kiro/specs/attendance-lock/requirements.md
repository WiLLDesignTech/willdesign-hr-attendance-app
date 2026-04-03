# Requirements Document

## Introduction
Attendance locking allows administrators to freeze attendance records for a given period, preventing any further clock events or edits. Locks can be scoped at three levels: company-wide (all employees), group-wide (all employees of a specific employment group), or per individual employee. This ensures payroll accuracy by preventing retroactive attendance modifications after a period has been finalized.

## Requirements

### Requirement 1: Attendance Lock Entity
**Objective:** As an administrator, I want a structured lock record with scope, period, and audit fields, so that locks are traceable and enforceable at the correct granularity.

#### Acceptance Criteria
1. The Attendance Lock entity shall have a scope field indicating one of three levels: company, group, or employee.
2. The Attendance Lock entity shall have a yearMonth field identifying the locked period in YYYY-MM format.
3. The Attendance Lock entity shall have a lockedBy field recording the actor who created the lock.
4. The Attendance Lock entity shall have a lockedAt field recording the ISO timestamp when the lock was created.
5. When the scope is group, the Attendance Lock entity shall include a groupId field identifying the target employment group.
6. When the scope is employee, the Attendance Lock entity shall include an employeeId field identifying the target employee.
7. The Attendance Lock entity shall have an id field that uniquely identifies each lock record.

### Requirement 2: Lock Enforcement on Clock Events
**Objective:** As the attendance system, I want clock events to be rejected when the target period is locked, so that finalized attendance records cannot be modified.

#### Acceptance Criteria
1. When a clock event is submitted for an employee and a company-scope lock exists for that yearMonth, the Attendance Service shall reject the event with an appropriate error.
2. When a clock event is submitted for an employee and a group-scope lock exists for that yearMonth matching the employee's employment group, the Attendance Service shall reject the event.
3. When a clock event is submitted for an employee and an employee-scope lock exists for that yearMonth matching the employee's ID, the Attendance Service shall reject the event.
4. When no lock exists for the employee's yearMonth (at any scope), the Attendance Service shall process the clock event normally.
5. If multiple locks exist at different scopes for the same period, the Attendance Service shall reject the event if any matching lock is found.
6. The error response for a locked period shall include the lock scope and yearMonth so the user understands why the action was blocked.

### Requirement 3: Lock Storage and Retrieval
**Objective:** As the system, I want locks persisted in the database with efficient lookup, so that lock checks are fast and reliable.

#### Acceptance Criteria
1. The system shall store attendance locks in the database with the ability to query by yearMonth.
2. The system shall support querying all locks for a given yearMonth regardless of scope.
3. The system shall support querying locks filtered by scope type.
4. The system shall support deleting a specific lock by its unique identifier.
5. The system shall ensure that duplicate locks (same scope, same target, same yearMonth) are not created.

### Requirement 4: Lock Management API
**Objective:** As an administrator, I want API endpoints to create and remove attendance locks, so that I can manage period locking through the system.

#### Acceptance Criteria
1. When a POST request is made to the lock endpoint with valid scope, yearMonth, and optional target identifiers, the Lock API shall create a new attendance lock and return the created record.
2. When a POST request is made to the lock endpoint by a user without the attendance lock permission, the Lock API shall return a forbidden error.
3. When a DELETE request is made to the lock endpoint with a valid lock identifier, the Lock API shall remove the lock and return a success response.
4. When a DELETE request is made to the lock endpoint by a user without the attendance lock permission, the Lock API shall return a forbidden error.
5. When a GET request is made to the lock endpoint with a yearMonth query parameter, the Lock API shall return all locks for that period.
6. When a POST request is made with a duplicate lock (same scope, target, and yearMonth), the Lock API shall return a conflict error.
7. The Lock API shall validate that yearMonth is in YYYY-MM format before processing any request.

### Requirement 5: Admin UI for Lock Management
**Objective:** As an administrator, I want a lock management interface in the admin panel, so that I can lock and unlock attendance periods visually.

#### Acceptance Criteria
1. The admin panel shall display a lock management section accessible to users with the attendance lock permission.
2. The lock management section shall show a month picker allowing the administrator to select a yearMonth period.
3. When a yearMonth is selected, the lock management section shall display the current lock status (locked/unlocked) for company, group, and employee scopes.
4. The lock management section shall provide a lock button that creates a company-scope lock for the selected yearMonth.
5. The lock management section shall provide an unlock button that removes an existing lock for the selected yearMonth.
6. When a lock or unlock action succeeds, the UI shall refresh the lock status display to reflect the change.
7. When a lock or unlock action fails, the UI shall display the error message to the administrator.
8. All user-facing text in the lock management section shall use i18n translation keys.

### Requirement 6: Slack Integration Lock Enforcement
**Objective:** As the attendance system, I want Slack-based clock events to also be rejected when the period is locked, so that the lock is enforced consistently across all input channels.

#### Acceptance Criteria
1. When a Slack attendance message is processed for a locked period, the Attendance Service shall reject the event and the Slack bot shall reply with a message explaining the period is locked.
2. The lock enforcement for Slack events shall use the same lock check logic as the web API, with no separate lock verification path.
