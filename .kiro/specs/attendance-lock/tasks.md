# Implementation Plan

- [x] 1. Define the attendance lock entity type, scope constants, and API route contracts in the shared types package
- [x] 1.1 Add the attendance lock type with scope, yearMonth, groupId, employeeId, lockedBy, lockedAt, and id fields to the attendance types module
  - Define the lock scope as a union type of three levels: company, group, and employee
  - Add the scope constants object with all three values
  - Export both the type and constants from the package barrel
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 1.2 (P) Add the lock API route constant and typed request/response body interfaces
  - Define the lock endpoint route constant
  - Define the create lock body with scope, yearMonth, and optional groupId/employeeId
  - Define the delete lock body with scope, yearMonth, and optional groupId/employeeId
  - Define the lock query params with optional yearMonth and scope filters
  - Add yearMonth validation pattern (YYYY-MM format)
  - _Requirements: 4.1, 4.3, 4.5, 4.7_

- [x] 1.3 (P) Add lock key prefix and key builder patterns for DynamoDB storage
  - Add the lock prefix to key prefixes
  - Add key builders for lock PK (yearMonth-based), company SK, group SK, and employee SK
  - Lock id is deterministic: derived from yearMonth, scope, and target
  - _Requirements: 3.1_

- [x] 2. Create the lock repository interface and DynamoDB adapter
- [x] 2.1 Define the attendance lock repository interface in the core repositories module
  - Query locks by yearMonth with optional scope filter
  - Save a lock with duplicate prevention (same scope, target, yearMonth)
  - Delete a lock by yearMonth, scope, and optional target identifier
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2.2 Implement the DynamoDB lock adapter using single-table design
  - Use lock key prefix with yearMonth as partition key and scope/target as sort key
  - Query by yearMonth returns all locks for the period; optional scope prefix filter narrows results
  - Save uses a condition expression to prevent duplicate locks
  - Delete reconstructs PK/SK from yearMonth, scope, and target — no id-based lookup needed
  - Export the adapter from the data package barrel
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Add lock enforcement to the attendance service and expose lock management methods
- [x] 3.1 Add the lock check to processEvent that rejects clock events for locked periods
  - Derive yearMonth from the event timestamp
  - Query all locks for that yearMonth
  - If a company-scope lock exists, reject immediately
  - If an employee-scope lock matches the actor's employee ID, reject
  - If a group-scope lock exists, look up the employee's employment type and check for a match
  - Skip employee lookup when no group-scope locks are present (optimization)
  - Error message includes the lock scope and yearMonth for user clarity
  - Add employee repository and lock repository as new constructor dependencies
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 6.1, 6.2_

- [x] 3.2 (P) Add lock CRUD methods to the attendance service for creating, removing, and listing locks
  - Create lock validates scope-specific fields (group requires groupId, employee requires employeeId)
  - Create lock generates a deterministic id from yearMonth, scope, and target
  - Create lock delegates to repository save and returns the lock record or a conflict error
  - Remove lock delegates to repository delete using yearMonth, scope, and target
  - List locks for month delegates to repository query
  - _Requirements: 3.4, 3.5, 4.1, 4.6_

- [x] 3.3 (P) Write unit tests for lock enforcement and lock management
  - processEvent rejects when company-scope lock exists for the yearMonth
  - processEvent rejects when group-scope lock matches employee's employment type
  - processEvent rejects when employee-scope lock matches employee ID
  - processEvent succeeds when no matching lock exists
  - processEvent succeeds when locks exist for a different yearMonth
  - createLock returns conflict error when duplicate lock exists
  - Error message includes scope and yearMonth
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 4. Wire the lock repository into the composition root and update the attendance service instantiation
- [x] 4.1 Update the composition root to create the lock repository and inject it into the attendance service
  - Instantiate the DynamoDB lock adapter with the shared client and table name
  - Pass both the lock repository and employee repository to the attendance service constructor
  - Register the lock handler routes in the router
  - _Requirements: 3.1_

- [x] 5. Create the lock management API handler with permission-gated endpoints
- [x] 5.1 Create the lock handler with POST, DELETE, and GET endpoints
  - All three endpoints gate access with the attendance lock permission
  - POST validates yearMonth format and scope-specific fields, then delegates to service createLock
  - DELETE validates yearMonth and scope, then delegates to service removeLock
  - GET accepts yearMonth query parameter and returns all locks for that period
  - Forbidden responses use the shared insufficient permissions error message constant
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 6. Build the admin UI lock management tab with month picker and lock controls
- [x] 6.1 Create React Query hooks for lock CRUD operations
  - Query hook fetches locks for a given yearMonth
  - Create mutation posts a new lock and invalidates the lock query cache
  - Delete mutation removes a lock and invalidates the lock query cache
  - _Requirements: 5.2, 5.6_

- [x] 6.2 Create the lock management tab component for the admin panel
  - Month picker initialized to current yearMonth, allows selecting any period
  - Display current lock status for the selected month (locked/unlocked per scope)
  - Lock button creates a company-scope lock for the selected yearMonth
  - Unlock button removes the existing lock for the selected yearMonth
  - Show error messages when lock/unlock actions fail
  - All user-facing text uses i18n translation keys under the admin lock namespace
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [x] 6.3 Add the lock tab to the admin page and add i18n translation keys
  - Add the locks tab ID to the admin tab configuration
  - Conditionally render the lock tab component when the locks tab is active
  - Add translation keys for lock tab label, lock/unlock buttons, status labels, and error messages in all three language files (en, ja, ne)
  - _Requirements: 5.1, 5.8_

- [x] 7. Write integration and frontend tests for the complete lock system
- [x] 7.1 Write handler integration tests verifying lock API authorization and behavior
  - POST lock returns 201 with valid input and attendance lock permission
  - POST lock returns 403 without attendance lock permission
  - POST lock returns 409 for duplicate lock
  - DELETE lock returns 200 and removes the lock
  - GET locks returns all locks for a yearMonth
  - Clock event returns 409 when period is locked
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 7.2 (P) Write frontend tests for lock hooks, tab component, and admin page integration
  - Lock tab renders month picker and lock button
  - Lock button creates company-scope lock for selected month
  - Unlock button removes existing lock
  - Tab only visible to users with attendance lock permission
  - _Requirements: 5.1, 5.2, 5.4, 5.5_
