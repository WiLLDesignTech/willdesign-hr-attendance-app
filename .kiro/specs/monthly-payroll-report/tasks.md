# Implementation Plan

- [ ] 1. Expand policy types and region defaults for payroll configuration
- [ ] 1.1 Add surplus banking, quota redistribution, and force majeure policy interfaces to the policy type system
  - Add `SurplusBankingPolicy` with expiry months, max banked days, eligibility, and warning days
  - Add `QuotaRedistributionPolicy` with eligibility flag and max redistribution percent
  - Add `ForceMajeurePolicy` with termination threshold days
  - Extend `EffectivePolicy` and `RawPolicy` to include the three new policy sections
  - _Requirements: 21.1, 21.2_

- [ ] 1.2 (P) Update Japan and Nepal region defaults with new policy fields
  - Add surplus banking defaults to both regions (12-month expiry, 20 max days, 30-day warning)
  - Add quota redistribution defaults (eligible: true, 25% max deviation)
  - Add force majeure defaults (30-day threshold)
  - Update seed scripts to include new policy fields in region and group policies
  - _Requirements: 21.2, 21.3_

- [ ] 1.3 (P) Add new permissions for quota management and force majeure
  - Add `quota:manage` permission for manager-level quota redistribution approval
  - Add `force_majeure:manage` permission for admin-level force majeure recording
  - Update role-permission mappings so MANAGER+ gets quota:manage, ADMIN+ gets force_majeure:manage
  - _Requirements: 9.6, 9.7, 9.10_

- [ ] 2. Add PolicyService TTL caching layer
- [ ] 2.1 Implement in-memory TTL cache with 3-level structure
  - Cache company policy (shared across all employees), group policies (shared per group), and resolved employee policies
  - Return cached result when within TTL window (default 5 minutes); treat expired entries as cache miss
  - Invalidate all cache entries when any policy is written (company, group, or user level)
  - Write tests: cache hit within TTL, cache miss after expiry, invalidation on write, cascade correctness preserved
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [ ] 3. Wire policy-driven values into payroll calculation
- [ ] 3.1 Implement leave type hour credit mapping in payroll hours resolution
  - Calculate hour credits per leave type: Paid Leave and Credited Absence credit daily minimum hours, all other types credit zero
  - Fetch approved leave requests for the target month and apply credits by type
  - Compute deficit as `max(0, required - worked - paidLeaveCredits - creditedAbsenceCredits)` and surplus as `max(0, worked - required)`
  - Write tests: each leave type credits correct hours, mixed leave types in same month
  - _Requirements: 1.3, 1.6_

- [ ] 3.2 Integrate holiday subtraction into required hours calculation
  - Fetch holidays for the employee's region and target month year from the holiday repository
  - Subtract holiday count from required working days before computing required hours
  - Write tests: month with holidays reduces required hours, region-specific holidays apply correctly
  - _Requirements: 1.4_

- [ ] 3.3 (P) Read allowances from resolved policy instead of hardcoded empty array
  - Read allowance types and default amounts from the employee's resolved compensation policy
  - Include each active allowance as a named line item in the payroll breakdown
  - Sum all allowances into `totalAllowances` field
  - Write tests: allowances from policy appear in breakdown, employee with no allowances gets empty array
  - _Requirements: 4.1, 4.2, 4.4_

- [ ] 3.4 (P) Pass blending details through monthly report service
  - When salary blending occurs, propagate `BlendingDetails` from the calculator through to the per-employee report entry
  - Include old amount, new amount, days for each segment, and blended total in the entry's payroll breakdown
  - Write tests: blended month shows details, single-salary month has null blending
  - _Requirements: 2.3_

- [ ] 4. Improve monthly payroll report generation robustness
- [ ] 4.1 Switch to error-isolated parallel processing with sorting
  - Replace `Promise.all` with `Promise.allSettled` so individual employee failures don't crash the entire report
  - Include failed employees with an error message in the entry rather than omitting them
  - Sort report entries by region (JP first, NP second), then alphabetically by employee name
  - Write tests: one failing employee doesn't block others, entries sorted correctly, error entry has error field
  - _Requirements: 6.1, 6.4, 6.5_

- [ ] 5. Build flag resolution service with persistence and bank offset
- [ ] 5.1 Create the flag resolution service that wraps pure calculation with database persistence
  - Accept flag ID, resolution type, optional bank offset hours, and actor ID
  - Fetch the pending flag, call the existing pure resolution function, then persist the resolved flag with resolution details, resolver ID, and timestamp
  - When resolution is USE_BANK or PARTIAL_BANK, consume bank hours before calculating deduction (see task 7 for bank consumption)
  - Use DynamoDB `TransactWriteItems` for atomic flag update + bank debit
  - Write tests: each resolution type persists correctly, PENDING→RESOLVED transition, invalid flag ID returns error
  - _Requirements: 5.2, 5.3, 5.4, 18.1, 18.2, 18.3_

- [ ] 5.2 Add deficit deduction with region-specific rounding and approval status to payroll breakdown
  - Calculate potential deduction as `deficitHours × (monthlySalary / requiredHours)`
  - Apply ceiling rounding for Nepal, standard rounding for Japan, reading strategy from policy
  - Include deduction amount, deficit hours, rounding strategy, and approval status (pending/approved/dismissed) in payroll breakdown
  - Deductions apply only when manager has approved the flag — pending flags show potential deduction but don't reduce net
  - Write tests: NP ceiling rounding, JP standard rounding, pending flag shows zero deduction in net
  - _Requirements: 5.1, 5.5, 5.6, 5.7_

- [ ] 5.3 Wire flag resolution handler to new service and add audit logging
  - Update the flag handler to call the new resolution service instead of the pure function
  - Verify the actor has FLAG_RESOLVE permission and manages the affected employee
  - Log all flag resolutions to the audit trail with actor, employee, resolution type, deduction amount, and bank offset used
  - Write tests: handler persists resolution, unauthorized manager gets 403, audit entry created
  - _Requirements: 9.8, 15.4_

- [ ] 6. Build quota redistribution service and API
- [ ] 6.1 Create quota plan repository with DynamoDB storage and uniqueness constraint
  - Store quota plans with employee-scoped key pattern and status-based GSI for queries
  - Enforce one active plan per employee using conditional write that checks no non-terminal plan exists
  - Support find-by-employee, find-by-status, and find-active-for-month queries
  - Write tests: save and retrieve plan, conditional write rejects duplicate active plan, query by month returns correct plan
  - _Requirements: 16.8_

- [ ] 6.2 Implement quota redistribution service with validation and lifecycle management
  - Accept two target months with adjusted hours and validate total equals standard total (e.g., 140+180 = 2×160)
  - Reject requests where the first target month has already started
  - Manage plan lifecycle: PENDING → APPROVED → ACTIVE → COMPLETED/CANCELLED
  - Provide method to get adjusted required hours for a given employee and month (returns null when no active plan)
  - Implement termination unwind: recalculate using standard hours across the plan period, compute net shortfall at hourly rate
  - Write tests: balanced hours pass, imbalanced rejected, past-month rejected, lifecycle transitions, unwind calculation
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [ ] 6.3 Create quota redistribution API endpoints with RBAC
  - POST endpoint for employees to request redistribution (requires active employment)
  - PATCH endpoints for manager to approve or reject (scoped to managed employees via `requireCrossUserAccess`)
  - DELETE endpoint for cancellation (employee or manager)
  - GET endpoint for querying employee's plans, optionally filtered by month
  - Log all quota actions to audit trail
  - Write tests: full CRUD flow, manager of different employee gets 403, audit entries created
  - _Requirements: 9.6, 15.4_

- [ ] 6.4 Integrate quota-adjusted hours into payroll calculation
  - When generating payroll for an employee, check for an active quota plan for the target month
  - If active plan exists, use the adjusted required hours instead of the standard policy monthly minimum
  - Salary remains unchanged regardless of redistributed hours
  - Write tests: payroll with active quota uses adjusted hours, no quota uses standard hours, salary identical both months
  - _Requirements: 1.7, 16.4, 16.5_

- [ ] 7. Build surplus hour banking lifecycle service
- [ ] 7.1 Extend bank entry model with 3-phase lifecycle fields
  - Add status field (REQUESTED, APPROVED, FINALIZED, EXPIRED, USED), max approved days, and finalized hours to bank entry type
  - Update bank repository to support lifecycle queries: find by status, find active (finalized + not expired + remaining > 0)
  - Write tests: lifecycle field storage and retrieval, active query filters correctly
  - _Requirements: 17.1, 17.4_

- [ ] 7.2 Implement bank lifecycle service with request, approve, finalize, consume, and expire operations
  - Request: employee submits banking request for a future or current month
  - Approve: manager sets max days cap; reject returns to employee
  - Finalize (called by cron at month-end): calculate bankable hours as `min(actualSurplus, maxDays × dailyMinimum)`, set expiry to 12 months from banking date (configurable via policy)
  - Consume: debit hours oldest-first from active entries for flag offset; track usage per entry
  - Expire: mark entries past expiry date as EXPIRED
  - Unapproved surplus has zero value and cannot be consumed
  - Write tests: full lifecycle flow, finalization caps at max days, consumption oldest-first, expired entries skipped, unapproved surplus rejected
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.6, 17.7, 17.8_

- [ ] 7.3 Enforce no-retroactive-reversal rule for deficit-then-surplus
  - When consuming banked hours for flag offset, verify the banked hours were created BEFORE the deficit month
  - Deficit deduction in Month N is final — surplus banked in Month N+1 cannot reverse it
  - Surplus banked in Month N can offset deficit in Month N+1 (with manager approval at flag resolution)
  - Write tests: surplus from earlier month offsets later deficit, surplus from later month rejected for earlier deficit
  - _Requirements: 18.4, 18.5, 18.6_

- [ ] 7.4 Create banking API endpoints with RBAC
  - POST endpoint for employees to request surplus banking for a month
  - PATCH approve/reject endpoints for managers (scoped to managed employees)
  - GET balance endpoint showing available hours, entries, and entries nearing expiry
  - Log all banking actions to audit trail
  - Write tests: full API flow, manager scope enforcement, balance calculation, audit entries
  - _Requirements: 9.7, 15.5_

- [ ] 7.5 Extend cron service with bank finalization and expiry notification
  - Monthly cron: finalize approved bank requests by calculating actual surplus from attendance data
  - Monthly cron: mark entries past 12-month expiry as EXPIRED
  - Send warning notification 30 days before banked hours expire (via reminder service)
  - Write tests: finalization creates correct hours, expired entries marked, warning triggers at correct threshold
  - _Requirements: 17.3, 17.5, 17.6_

- [ ] 8. Build transfer fee and exchange rate management
- [ ] 8.1 Create payroll adjustment repository and admin input flow
  - Store per-employee per-month adjustments: transfer fee (NPR) and exchange rate (JPY/NPR)
  - Create API endpoint for admin to set transfer fee and exchange rate for Nepal employees (requires SALARY_MANAGE)
  - Calculate home currency equivalent as `netAmount × exchangeRate` in payroll breakdown
  - Transfer fee is company-paid and not deducted from employee net amount
  - Set transfer fee to 0 and exchange rate to null for Japan employees automatically
  - Write tests: NP employee gets fees and rate, JP employee gets null, home equivalent calculated, fee not deducted from net
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 9.12_

- [ ] 9. Build termination settlement service
- [ ] 9.1 Implement comprehensive settlement calculation
  - Calculate pro-rata salary for final month using calendar days formula
  - Calculate payout for unused accrued paid leave days at daily rate
  - Include any manager-approved deficit deductions from pending flags
  - When termination occurs during active quota redistribution, recalculate using standard hours for entire plan period and deduct net shortfall at hourly rate
  - Determine bank hours disposition per policy: forfeit for NP, labor law handling for JP
  - Set settlement deadline to 15th of month following termination
  - Produce itemized breakdown with SETTLEMENT type flag showing each component
  - Write tests: pro-rata calculation, leave payout, quota unwind with shortfall deduction, bank forfeit, deadline calculation
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ] 9.2 Create settlement API endpoint with RBAC
  - GET endpoint accepting employee ID and termination date, returning full settlement breakdown
  - Require SALARY_MANAGE permission
  - Log settlement calculation to audit trail
  - Write tests: authorized admin gets breakdown, unauthorized user gets 403, audit entry created
  - _Requirements: 9.11, 15.1_

- [ ] 10. Build force majeure event service
- [ ] 10.1 (P) Create force majeure repository and service
  - Store force majeure events with date range, description, and list of affected employee IDs
  - Calculate proportional hour adjustment: `adjustedRequired = required × (workDays - affectedDays) / workDays`
  - Track consecutive days for termination trigger (threshold from policy, default 30 days)
  - Credit adjusted hours to affected employees' payroll calculations
  - Show force majeure credited hours as separate line item in payroll breakdown
  - Write tests: hour adjustment calculation, multi-employee event, termination trigger at threshold, credited hours in breakdown
  - _Requirements: 20.1, 20.2, 20.3, 20.4_

- [ ] 10.2 (P) Create force majeure API endpoints with RBAC
  - POST endpoint for admin to record events (requires ADMIN role or force_majeure:manage permission)
  - GET endpoint to query events by employee and/or month
  - Log all force majeure actions to audit trail
  - Write tests: admin creates event, non-admin gets 403, query by month returns correct events
  - _Requirements: 9.10, 15.4_

- [ ] 11. Wire all new services into composition root and API routes
- [ ] 11.1 Register new repositories and services in the composition root
  - Instantiate quota plan, force majeure, and payroll adjustment DynamoDB repositories
  - Wire new services: FlagResolutionService, QuotaService, BankLifecycleService, SettlementService, ForceMajeureService, SalaryStatementService
  - Inject dependencies following existing constructor DI pattern
  - Register new API routes for quota, bank lifecycle, settlement, force majeure, and payroll adjustment endpoints
  - Add new key patterns to the key patterns module for new entities
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 11.2 Add API route constants and typed bodies to the shared API contract
  - Add route constants for all new endpoints: quota CRUD, bank lifecycle, settlement, force majeure, payroll adjustment
  - Define typed request/response bodies for each endpoint
  - Add query param types for filtered queries
  - _Requirements: 9.1, 9.2_

- [ ] 12. Build payroll CSV export
- [ ] 12.1 (P) Implement client-side CSV generation utility and download
  - Create a pure utility function that converts a monthly payroll report into CSV string with BOM for Excel UTF-8 compatibility
  - Include columns: employee name, type, region, worked hours, required hours, overtime, base salary, overtime pay, allowances, deductions, net amount, currency
  - Add extra columns for Nepal employees: exchange rate, transfer fee, JPY equivalent
  - Add summary row at bottom with totals for numeric columns
  - Use filename format `payroll-report-{yearMonth}.csv`
  - Trigger browser download via Blob and temporary anchor element
  - Write tests: CSV output format, BOM present, NP extra columns, summary row totals, empty report produces header-only CSV
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 13. Build salary statement email delivery
- [ ] 13.1 Implement salary statement service with batch delivery
  - Wire the existing SES email adapter in the composition root; use a no-op adapter for local development
  - Generate per-employee salary statement using the existing HTML template with employee name, ID, month, all breakdown line items, and company name
  - Send statements in parallel with individual try-catch per employee
  - Log delivery failures to audit trail and continue sending to remaining employees
  - Return summary with sent count, failed count, and per-failure details
  - Write tests: successful batch delivery, individual failure doesn't stop batch, failure logged, no-op adapter works locally
  - _Requirements: 13.1, 13.2, 13.3_

- [ ] 13.2 Create salary statement trigger endpoint and employee access
  - POST endpoint for admin to trigger batch statement delivery for a given month (requires SALARY_MANAGE)
  - Make the statement accessible on the employee's payroll page as a downloadable record
  - Log delivery trigger to audit trail
  - Write tests: admin triggers delivery, non-admin gets 403, employee can access own statement
  - _Requirements: 9.9, 13.4, 15.2_

- [ ] 14. Extend audit trail coverage for all payroll actions
- [ ] 14.1 (P) Add audit logging across all payroll-related services
  - Log salary entry additions with actor, employee, action type, values, and timestamp
  - Log monthly payroll report generation with actor, yearMonth, employee count, and total net
  - Log allowance modifications with before/after values
  - Log quota redistribution create/approve/reject/cancel with plan details
  - Log surplus bank entry create/approve/finalize/consume/expire with hours and dates
  - Verify all audit entries are immutable (append-only, never updated or deleted)
  - Write tests: each action type creates correct audit entry, audit entries cannot be modified
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

- [ ] 15. Update payroll frontend — employee view
- [ ] 15.1 Enhance payroll page with quota, banking, and approval status display
  - Show quota redistribution indicator when active: display adjusted required hours and link to redistribution plan details
  - Show bank offset line item in deficit section when surplus bank hours were used
  - Show deficit deduction approval status (pending/approved/dismissed) next to deduction amount
  - Show force majeure credited hours as a separate line item when applicable
  - _Requirements: 11.2, 11.5_

- [ ] 15.2* Baseline payroll page rendering tests
  - Test skeleton loader while data is loading
  - Test empty state when no payroll data exists for selected month
  - Test blending visualization: old salary × N days + new salary × M days = blended total
  - Test Nepal exchange rate badge and JPY equivalent display
  - _Requirements: 11.1, 11.3, 11.4, 11.6, 11.7_

- [ ] 16. Update payroll frontend — admin report view
- [ ] 16.1 Add CSV export button and expanded employee breakdowns to admin report tab
  - Add export button that calls the CSV generation utility from task 12 and triggers download
  - Implement expandable employee rows that show full payroll breakdown on click
  - Add badge showing count of employees with deficit hours as warning
  - Add badge showing count of employees with active quota redistributions
  - _Requirements: 12.3, 12.4, 12.5, 12.6_

- [ ] 16.2* Baseline admin report tab rendering tests
  - Test month selector and totals summary grid display
  - Test employee entry list with all required fields
  - Test skeleton loader during data fetch
  - _Requirements: 12.1, 12.2, 12.7_

- [ ] 17. Build quota redistribution and bank balance frontend components
- [ ] 17.1 (P) Create quota redistribution request form and approval UI
  - Employee form: select two target months, enter adjusted hours for each, provide reason; validate total equals standard total
  - Manager view: list pending quota requests for managed employees with approve/reject actions
  - Dashboard indicator: show adjusted required hours when active redistribution exists
  - Create React Query hooks for quota CRUD operations
  - _Requirements: 16.1, 16.2, 16.7_

- [ ] 17.2 (P) Create bank balance panel and banking request UI
  - Employee view: show total available banked hours, per-entry list with expiry dates, entries nearing expiry highlighted
  - Employee action: request surplus banking for a future/current month
  - Manager view: list pending banking requests for managed employees with approve (set max days) and reject actions
  - Create React Query hooks for bank lifecycle operations
  - _Requirements: 17.1, 17.2, 17.4_

- [ ] 18. Allowance management admin UI
- [ ] 18.1 (P) Create allowance configuration interface for admin
  - Admin form to view and update per-employee allowances: transportation, housing, position, and custom types
  - Store allowance changes with effective date and apply to payroll from that date onward
  - Log allowance changes to audit trail
  - _Requirements: 4.3, 15.3_

- [ ] 19. Integration testing for full payroll pipeline
- [ ] 19.1 Write integration tests covering the complete payroll calculation pipeline
  - Test full pipeline: policy resolution → hours with holidays and leave types → overtime → allowances → deficit with flag resolution → breakdown
  - Test flag resolution → bank debit → audit trail persistence chain
  - Test quota redistribution → payroll uses adjusted hours → no deficit flags for adjusted minimums
  - Test monthly report generation with one employee having missing salary (error isolation)
  - Test settlement calculation with quota unwind and leave payout
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 3.1, 3.2, 3.5, 5.1, 6.1, 6.2, 6.3, 8.1, 8.2, 8.3_

- [ ] 19.2 (P) Write E2E tests for critical user paths
  - Admin generates monthly report, exports CSV, verifies totals match
  - Manager resolves deficit flag with bank offset, employee payroll updates
  - Employee requests quota redistribution, manager approves, dashboard shows adjusted hours
  - Admin triggers salary statement delivery for a month
  - _Requirements: 10.1, 11.1, 12.1, 16.4_
