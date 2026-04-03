# Implementation Plan — WillDesign HR Platform

- [x] 1. Monorepo scaffolding and project configuration
- [x] 1.1 Initialize the npm workspace monorepo with all packages (core, types, data, api, slack, web, infra) and configure shared TypeScript strict-mode settings, path aliases, and Vitest workspace
  - Create root package.json with workspace definitions for all seven packages
  - Configure shared tsconfig.base.json with strict mode, path aliases, and composite project references
  - Set up Vitest workspace configuration so tests run per-package
  - Add shared linting (ESLint + Prettier) configuration at root
  - Initialize each package with its own package.json, tsconfig.json extending base, and entry point
  - _Requirements: 19.1, 19.4, 19.5_

- [x] 1.2 (P) Set up the CDK infrastructure project with environment-aware stack definitions
  - Initialize the infra package with AWS CDK and TypeScript
  - Create a shared environment configuration that distinguishes dev (develop branch) and prod (main branch) resource names
  - Define placeholder stacks: database, api, slack, web, auth, scheduler, email
  - Configure CDK to deploy separate resource sets per environment
  - _Requirements: 19.3, 19.6, 19.7_

- [x] 2. Shared type definitions
- [x] 2.1 (P) Define all domain entity types covering employees, attendance, leave, payroll, reports, flags, banking, holidays, audit, permissions, and policies
  - Employee types: profile fields, employment types (JP: full-time, contract, outsourced, part-time, sales, intern; NP: full-time contractor, paid/unpaid intern), status (active/inactive), region, timezone, language preference, Slack ID, manager relationship
  - Attendance types: event actions (CLOCK_IN, CLOCK_OUT, BREAK_START, BREAK_END), state enum (IDLE, CLOCKED_IN, ON_BREAK), session summary, source (slack/web/system/admin), work location, optional emergency metadata tag (to distinguish mandatory incident response from voluntary holiday work)
  - Leave types: request status lifecycle (PENDING, APPROVED, REJECTED), configurable leave types (paid, unpaid, shift permission, credited absence, JP-specific types), balance, accrual configuration
  - Payroll types: salary record with change types (INITIAL, PROBATION_END, REVIEW, PROMOTION, ADJUSTMENT), salary types (monthly/annual/hourly), allowance items, bonus, commission, payroll breakdown with pro-rata and blending, currency (JPY/NPR), exchange rate tracking, transfer fees
  - Report types: daily report with yesterday/today/blockers, structured references (JIRA IDs, GitHub PRs), version tracking
  - Flag types: period levels (DAILY, WEEKLY, MONTHLY), resolution options (NO_PENALTY, DEDUCT_FULL, USE_BANK, PARTIAL_BANK, DISCUSS), bank offset
  - Banking types: surplus entry with expiry, approval status, max leave days, used/remaining hours
  - Holiday types: regional calendar, substitute holidays
  - Audit types: append-only entry with actor, source, action, before/after values
  - Permission types: roles (EMPLOYEE, MANAGER, HR_MANAGER, ADMIN, SUPER_ADMIN, custom), ABAC attributes (resource type, owner, sensitivity level), authorization result
  - Policy types: effective policy covering hours, leave, overtime, compensation, probation, work arrangement, flags; raw policy for cascade input
  - Override types: period types (DAILY, WEEKLY, MONTHLY), quota plans
  - Document types: metadata with S3 key, file type, employee association, verification status (PENDING, VERIFIED, REJECTED) for identity documents per contract Article 4.11
  - Onboarding/offboarding types: termination type enum (WITHOUT_CAUSE, FOR_CAUSE, MUTUAL, RESIGNATION), notice period buyout toggle and amount (1 month's service fee per contract Article 2.3), settlement deadline (15th of following month), cure period expiry date (for FOR_CAUSE per Article 2.4), post-termination legal obligations with expiry dates
  - Result type: discriminated union for success/error returns
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 9.1, 10.2, 10.10, 18.1, 5.1, 4.5_

- [x] 3. Core repository interfaces (ports)
- [x] 3.1 (P) Define all repository interfaces in the core package with zero AWS dependencies
  - EmployeeRepository: find by ID, find by Slack ID, find by manager ID, find all with status filter, create, update
  - AttendanceRepository: get/save state, save event, get events by date and month, get unclosed sessions
  - LeaveRepository: CRUD, find by employee, find pending, update status
  - SalaryRepository: get history, get effective for month, add entry
  - ReportRepository: save, find by employee and date, find latest version
  - FlagRepository: save, find by employee with filters, find pending, update
  - BankRepository: save, find by employee, find active (non-expired), update
  - AuditRepository: append entry, find by target, find by actor
  - HolidayRepository: find by region and year, save, delete
  - OverrideRepository: find by employee and period, save
  - PolicyRepository: get company/group/user policy, save group/user policy
  - RoleRepository: find by name, find all, save, delete
  - MonthlySummaryRepository: find by employee and month, save
  - DocumentRepository: save metadata, find by employee, get upload/download pre-signed URLs
  - EmailAdapter: send email with HTML body
  - AuthProviderAdapter: create user, disable user, delete user, set temporary password, update attributes
  - _Requirements: 19.4, 4.4, 21.2_

- [x] 4. Policy engine
- [x] 4.1 Implement the 3-level cascade policy resolver as a pure function that deep-merges company, group, and employee policy layers
  - Build a deep-merge utility that handles nested objects: lower levels override higher levels field-by-field. Arrays are REPLACED (not appended) — if a group defines an allowance list, it replaces the company-wide list entirely. This prevents unintended duplication of allowance types or leave types across cascade levels
  - Implement the resolver that accepts company, group, and user policy data and returns a fully resolved effective policy
  - Support effective_from date filtering so policies activate only after their configured date
  - Ensure the resolver has zero side effects — it receives data, returns merged result
  - Write TDD tests: single-level, two-level, three-level cascades, missing levels, date-based filtering, deeply nested overrides
  - _Requirements: 4.1, 4.3, 4.4, 4.6_

- [x] 4.2 (P) Create seed policy data for Japanese labor law and Nepal contractor defaults
  - Build the company-level org.json seed with default values for hours (daily/weekly/monthly minimums), leave (JP standard schedule, NP 1 day/month after 3 months), overtime (JP rates: 1.25x, late night +0.25x, holiday 1.35x, 60h+ 1.5x), compensation, probation (3 months default), and flag configuration
  - Create group-level seed files for each employment type: JP full-time, JP contract, JP outsourced, JP part-time, JP sales, JP intern, NP full-time, NP paid intern, NP unpaid intern
  - Each group file contains only the fields that differ from the company default (sparse overrides)
  - Include 36 Agreement limits (45h/month, 360h/year) in overtime config
  - Include deemed overtime (minashi zangyo) defaults (45h) for applicable JP groups
  - Write tests verifying seed data resolves correctly through the cascade
  - _Requirements: 4.2, 4.5, 4.7, 8.3, 8.5_

- [x] 4.3 Define the policy coverage schema ensuring all configurable domains are represented
  - Hours policy: daily/weekly/monthly minimums, work arrangement (remote/office/hybrid), time type (fixed/flex/full-flex), core hours
  - Leave policy: accrual schedule, start condition, cap, carry-over rules, leave types list, mandatory usage rules (JP 5-day), termination handling
  - Overtime policy: deemed overtime hours, pay rates by category, tracking thresholds
  - Compensation policy: salary type (monthly/annual), bonus schedule and timing, allowance definitions, commission tracking
  - Probation policy: duration, leave rules during probation, notice period
  - Flag policy: thresholds per level, grace periods, behaviors per employment type
  - Payment policy: payment deadline date per team (default: end of following month for JP, 15th for NP), alert days before deadline, final settlement deadline (15th of month following termination)
  - Report policy: daily report submission deadline time per team/group (configurable), reminder trigger time
  - _Requirements: 4.5, 17.1, 17.2, 10.15, 2.5_

- [x] 5. Permission engine
- [x] 5.1 Implement the RBAC system with a 5-level role hierarchy and support for custom roles with granular permissions
  - Define the default role hierarchy: EMPLOYEE < MANAGER < HR_MANAGER < ADMIN < SUPER_ADMIN
  - Implement role comparison that respects hierarchy ordering
  - Support custom roles with explicitly listed permission strings (e.g., "payroll:read", "leave:approve", "holiday:manage")
  - Build a permission check function that evaluates: does this actor's role or custom permissions allow this action?
  - Super Admin bypasses all permission checks
  - Multiple users can hold the Admin role
  - Write TDD tests for hierarchy checks, custom role permissions, Super Admin override, multiple admins
  - _Requirements: 5.1, 5.4, 5.5, 5.6, 5.7_

- [x] 5.2 Implement the ABAC system that evaluates reporting chain, resource ownership, and data sensitivity
  - Build attribute evaluation: given an actor context and resource context, determine if the actor has access
  - Manager scope: a manager can only access data for employees where manager_id matches their own ID
  - Resource ownership: employees can access their own data regardless of role
  - Data sensitivity: CONFIDENTIAL data (salary, payroll) requires Manager+ or Admin role; PUBLIC data (name, leave calendar presence) is visible to all
  - Combine RBAC and ABAC into a single authorize function that returns allowed/denied with a reason
  - Write TDD tests: manager accessing direct report (allow), manager accessing non-report (deny), employee accessing own data (allow), employee accessing other's salary (deny), Super Admin accessing anything (allow)
  - _Requirements: 5.2, 5.3, 5.8, 5.9, 16.3_

- [x] 6. Attendance and hours tracking
- [x] 6.1 Build the 3-state attendance state machine with transition validation
  - Implement the state machine as a pure function: given current state and action, return new state or error
  - Valid transitions: IDLE→CLOCKED_IN, CLOCKED_IN→IDLE, CLOCKED_IN→ON_BREAK, ON_BREAK→CLOCKED_IN
  - Invalid transitions return an error message including the current state and last event timestamp
  - Support multiple sessions per day (after clock-out, can clock-in again)
  - Write TDD tests for all valid transitions, all invalid transitions, multiple sessions, error messages with timestamps
  - _Requirements: 1.12, 7.2, 1.13_

- [x] 6.2 (P) Build the configurable keyword matcher for multi-language attendance messages
  - Implement matching logic that takes a Slack message and an array of keyword configurations, returns the matched action or no-match
  - Support English and Japanese keyword sets: clock-in (hello, hi, おはよう), break (break, 休憩), back (back, 戻り), clock-out (bye, おつかれ)
  - Keywords stored as configurable data (not hardcoded), loadable from policy/config
  - Match should be case-insensitive and handle partial messages (keyword anywhere in text)
  - Also match language change commands (lang en, lang ja, 言語 en) and help commands (help, ヘルプ)
  - Write TDD tests for each language, mixed-language, no-match, case insensitivity, language/help commands
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.7, 1.10, 1.11_

- [x] 6.3 Implement the attendance service that orchestrates event processing with idempotency and audit logging
  - Accept an attendance action with employee ID, timestamp, and source (slack/web)
  - Look up current state, validate transition, persist new event + updated state + audit entry as a single atomic operation
  - Enforce 60-second idempotency window: reject duplicate actions from the same user within the window
  - Track work location per session when provided (office/remote)
  - Store all timestamps in UTC; accept and convert from user's local timezone (JST/NPT)
  - For web-based edits, preserve both original and edited records in audit log with source attribution
  - Write TDD tests: valid flow, idempotency rejection, cross-timezone storage, web edit audit trail
  - _Requirements: 1.5, 1.6, 1.14, 7.1, 7.6, 18.1, 18.3_

- [x] 6.4 (P) Implement the hours calculator for daily, weekly, and monthly totals
  - Daily calculation: sum all work sessions minus break durations plus leave credits for the date
  - Cross-midnight rule: all hours for a session count toward the clock-in date
  - Weekly calculation: sum daily hours for Monday through Sunday
  - Monthly calculation: sum daily hours for the calendar month
  - Holiday adjustment: reduce required hours by the number of holidays in the period (fetched from holiday data)
  - Holiday work: hours worked on holidays count toward the monthly minimum at the standard 1.0x rate (no premium for Nepal contractors per flat monthly fee model). Holidays reduce required hours, but if someone works on a holiday, those hours still credit toward the reduced target and can generate surplus
  - Handle edge cases: open sessions (no clock-out), open breaks, multiple sessions per day, sessions shorter than configured minimum
  - Write TDD tests: normal day, cross-midnight, multiple sessions, holidays reducing requirements, holiday work at 1.0x, open session handling
  - _Requirements: 1.13, 7.3, 7.4, 7.5, 15.4, 7.9_

- [x] 7. Leave management
- [x] 7.1 Implement the leave service with request lifecycle, balance enforcement, and approval workflow
  - Create leave request: validate employee has sufficient balance for paid leave; reject with suggestion of unpaid/shift if balance is zero
  - Enforce no-negative-balance rule: paid leave blocked when balance reaches zero
  - Approval workflow: manager approves/rejects, system updates status, deducts balance for paid leave, creates audit entry
  - Support all leave types: paid, unpaid, shift permission, credited absence, and JP-specific types (bereavement, maternity, nursing, menstrual, company-specific)
  - Send notification to manager when request is created; notify employee on approval/rejection
  - Write TDD tests: sufficient balance approval, zero balance rejection with suggestion, multi-day leave, approval flow, audit trail
  - _Requirements: 9.1, 9.3, 9.5, 9.7_

- [x] 7.2 (P) Implement leave accrual calculation with policy-cascaded rules and carry-over logic
  - Accrual follows cascading policy: company default → group → employee
  - Nepal contractors: 1 day/month after 3-month probation, cap 20, forfeit on termination
  - Japan employees: JP labor law schedule (10 days at 6 months, scaling to 20 at 6.5 years), 2-year carry-over
  - Track mandatory 5-day annual leave usage for JP employees and generate warnings when insufficient days taken
  - Termination handling: NP contractors forfeit unused leave; JP employees follow labor law
  - Monthly accrual trigger: add days per policy, respect cap, handle carry-over expiry
  - Write TDD tests: NP accrual with probation gate, JP labor law schedule at various tenures, cap enforcement, carry-over expiry, mandatory 5-day tracking
  - _Requirements: 9.2, 9.4, 9.6_

- [x] 8. Payroll and compensation
- [x] 8.1 Implement the effective salary resolution that always reads from salary history, never current salary
  - Build getEffectiveSalary: query all salary history entries for employee, filter by entries effective on or before the last day of the target month, return the most recent entry's salary
  - Handle mid-month salary changes: when two entries fall within the same month, calculate blended salary using pro-rata formula (old_salary x days_at_old / total_days + new_salary x days_at_new / total_days)
  - Support all salary types: monthly (JPY/NPR), annual (divided by 12), hourly (for part-time)
  - Track salary changes as append-only audit trail with change types: INITIAL, PROBATION_END, REVIEW, PROMOTION, ADJUSTMENT
  - Each salary history entry can optionally link to a signed agreement document (S3 uploaded PDF) to satisfy the bilateral agreement requirement from HR policy
  - Write TDD tests: single salary lookup, mid-month blending, annual-to-monthly conversion, no history fallback, agreement document linkage
  - _Requirements: 10.1, 10.2, 10.9, 10.14, 16.7_

- [x] 8.2 Implement the full monthly payroll breakdown calculation
  - Calculate base salary via getEffectiveSalary
  - Add pro-rata adjustment for mid-month join or exit: amount x (calendar_days_worked / total_calendar_days)
  - Add overtime pay based on hours exceeding policy threshold and applicable rates
  - Add allowances from cascading policy: transportation, housing, position, custom admin-defined types
  - Add bonus when applicable per cascading schedule (configurable timing: twice yearly, custom, or none)
  - Add commission for sales roles (externally input final amount)
  - Calculate deficit deduction for Nepal team: deficit_hours x hourly_rate, with the final monthly deduction total rounded UP (ceiling) to the nearest whole NPR — rounding applies to the monthly total, not per-hour or per-session
  - For non-JPY payments: record local currency amount, JPY equivalent, exchange rate, rate date, transfer fees, and net amount received
  - Build transparent breakdown showing every component for the payroll view
  - Write TDD tests: full NP payroll with deficit, full JP payroll with overtime and allowances, mid-month join pro-rata, blending, commission, exchange rate tracking
  - _Requirements: 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.10, 10.11, 10.15, 10.16_

- [x] 9. Flags, banking, and quota management
- [x] 9.1 Implement 3-level shortfall flag generation with anti-double-penalty and pre-approval suppression
  - Daily flag: generated at end-of-day if worked hours are below daily minimum and no approved leave exists for that date
  - Weekly flag: generated at end-of-week if weekly total is below weekly minimum
  - Monthly flag: generated at end-of-month if monthly total is below required hours (from policy cascade or override)
  - Anti-double-penalty: only monthly flags result in salary deductions; daily and weekly are informational warnings
  - Pre-approval check: skip flag generation for dates with approved leave, credited absence, or manager pre-approval
  - Flag rules configurable per employment type via policy engine
  - Write TDD tests: daily shortfall with and without leave, weekly rollup, monthly deduction, pre-approval suppression, configurable thresholds
  - _Requirements: 11.1, 11.3, 11.4, 11.5_

- [x] 9.2 Implement flag resolution workflow with bank offset options
  - Resolution options: NO_PENALTY (forgive), DEDUCT_FULL (full salary deduction), USE_BANK (offset from surplus), PARTIAL_BANK (partial offset + partial deduction), DISCUSS (keep pending)
  - Bank offset: when manager selects USE_BANK or PARTIAL_BANK, apply specified hours from active (non-expired) bank entries to reduce the deficit
  - Update flag status, bank entry used hours, and create audit entry as a single atomic operation
  - Past deductions are final — no retroactive reversal from future surplus
  - Write TDD tests: each resolution type, bank offset reducing deficit to zero, partial bank offset, expired bank entries ignored
  - _Requirements: 11.2, 12.4_

- [x] 9.3 (P) Implement hours banking with manager pre-approval, 12-month expiry, and visibility rules
  - Surplus hours require manager pre-approval before becoming bankable
  - Manager specifies max_leave_days convertible from the surplus when approving
  - Banked hours expire after 12 months from accrual date (configurable via policy)
  - Surplus is never cashable — only offset against deficits or converted to leave with manager permission
  - Unapproved surplus is hidden from the employee's view; only managers and RBAC-permitted users see it
  - Employees can request surplus banking approval from their manager
  - Write TDD tests: approval flow, expiry at 12 months, visibility rules by role, leave conversion within max_leave_days, expired entries excluded from offset
  - _Requirements: 12.1, 12.2, 12.3, 12.5_

- [x] 9.4 (P) Implement quota redistribution with validation and termination settlement rules
  - Manager can redistribute hours across months (e.g., April 140h + May 180h = 320h total)
  - Validate redistributed totals equal the original standard total; if less, warn and allow with explicit manager acknowledgment
  - Salary remains the same for both months regardless of redistributed hours
  - Create linked override entries for each period in the plan
  - On termination during active redistribution: final settlement uses STANDARD hours (not redistributed) for the plan period
  - Write TDD tests: valid redistribution, under-total with warning, same salary both months, termination settlement using standard hours
  - _Requirements: 14.1, 14.2, 14.3_

- [x] 9.5 (P) Implement force majeure handling with proportional adjustment
  - For verified events (natural disaster, political bandh, internet outage >24h), adjust hour requirements proportionally with no salary deduction
  - Track 24-hour notification requirement
  - If event persists >30 days, either party may terminate with 7 days' notice
  - Write TDD tests: proportional hour reduction, no deduction, 30-day termination trigger
  - _Requirements: 13.1, 13.2_

- [x] 10. Daily reports and overtime tracking
- [x] 10.1 Implement daily report parsing with JIRA/GitHub reference extraction and versioned edits
  - Parse Slack messages in the reporting channel as daily reports with: yesterday's work, today's plan, blockers
  - Extract structured references using regex: JIRA ticket IDs (PROJECT-123 pattern) and GitHub PRs (repo-name#42 pattern)
  - Warn via bot reply if a report contains no JIRA or GitHub references
  - Support versioned edits: when a Slack message is edited (message_changed event), append a new version preserving all previous versions with timestamp and version number
  - Store both raw report text and extracted structured references
  - All report data append-only and optimized for future LLM analysis
  - Write TDD tests: JIRA extraction, GitHub extraction, missing reference warning, edit versioning, structured data alongside raw text
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 10.2 (P) Implement overtime tracking with deemed overtime, actual overtime, and 36 Agreement limits
  - Track overtime hours for all employees where applicable, regardless of payment type
  - For employees with deemed overtime (minashi zangyo): track actual overtime and flag when actual exceeds the deemed threshold (default: 45h, configurable per policy)
  - Calculate overtime pay rates per Japanese labor law: regular 1.25x, late night (22:00-05:00) +0.25x, holiday 1.35x, exceeding 60h/month 1.5x
  - Track against 36 Agreement limits (45h/month, 360h/year) and warn when approaching
  - Overtime configuration follows cascading policy: company → group → employee
  - Write TDD tests: deemed overtime threshold flag, rate calculations for each category, 36 Agreement warning triggers, policy cascade for overtime config
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 11. DynamoDB repository adapters
- [x] 11.1 Implement the DynamoDB single-table schema setup and shared client configuration
  - Create the CDK DynamoDB table definition with PK (String), SK (String), GSI1 (GSI1PK/GSI1SK), and GSI2 (GSI2PK/GSI2SK)
  - Configure on-demand capacity mode for free-tier usage
  - Implement a shared DynamoDB DocumentClient factory that is instantiated once per Lambda invocation and injected into repositories
  - Define the key patterns for all entities as documented in the design (EMP#, ATT#, LEAVE#, SALARY#, AUDIT#, etc.)
  - Write integration tests against local DynamoDB verifying table creation and basic put/get operations
  - _Requirements: 19.3, 21.1_

- [x] 11.2 Implement the employee, attendance, and audit DynamoDB repositories
  - Employee repository: CRUD operations using PK=EMP#id, SK=PROFILE; Slack ID lookup via GSI1; manager's reports via GSI1 MGR# key; all employees via GSI2 ORG#EMP
  - Attendance repository: save event (ATT#date#timestamp), save/get state (ATT_STATE), get events by date using SK begins_with, unclosed sessions query
  - Audit repository: append-only writes (AUDIT#target_id, timestamp#uuid SK), query by target or by actor via GSI1
  - Use TransactWriteItems for atomic operations: attendance event + state update + audit entry in a single transaction
  - Implement conditional writes for idempotency (60-second attendance window)
  - Write integration tests against local DynamoDB for each repository
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 7.1_

- [x] 11.3 (P) Implement leave, salary, flag, bank, and report DynamoDB repositories
  - Leave repository: CRUD with PK=EMP#id SK=LEAVE#id; pending leave query via GSI1 LEAVE#PENDING; team calendar via GSI2 ORG#LEAVE
  - Salary repository: append-only writes PK=EMP#id SK=SALARY#effective_date; history query with begins_with
  - Flag repository: save/update with PK=EMP#id SK=FLAG#type#period; pending flags via GSI1 FLAG#PENDING
  - Bank repository: save/update with PK=EMP#id SK=BANK#period; filter active (non-expired) in application layer
  - Report repository: save with PK=EMP#id SK=REPORT#date#v(version); latest version query; org-wide daily reports via GSI2
  - Use TransactWriteItems for flag resolution + bank offset operations
  - Write integration tests for each repository against local DynamoDB
  - _Requirements: 9.3, 10.9, 11.2, 12.1_

- [x] 11.4 (P) Implement holiday, override, role, monthly summary, config, and document DynamoDB repositories
  - Holiday repository: PK=REGION#region SK=HOL#date; year query via GSI2 ORG#HOLIDAY
  - Override repository: PK=EMP#id SK=OVR#type#value; exact lookup by employee + period
  - Role repository: PK=ROLE#name SK=DEFINITION for role metadata; PK=ROLE#name SK=PERM#resource#action for permissions; all roles via GSI2 ORG#ROLE
  - Monthly summary repository: PK=EMP#id SK=MONTH#yyyy-mm
  - Legal obligation entity: PK=EMP#id SK=LEGAL#type (confidentiality/non-compete) with expiry date; GSI2PK=ORG#LEGAL GSI2SK=EXPIRY#date#id for efficient "all active obligations expiring after today" admin queries without scanning all inactive employees
  - Config repository: PK=CONFIG with structured SK keys — CHANNEL#channel_id stores channel **purpose** (attendance/reporting/both), NOT team/group; KEYWORD#lang#action stores configurable keyword arrays per language per action. The SlackEventRouter uses channel purpose to decide handler routing, while user's team/group/policy is always resolved from their employee profile via Slack ID lookup
  - Document repository: PK=EMP#id SK=DOC#id for metadata with verification status field (PENDING/VERIFIED/REJECTED per contract Article 4.11); pre-signed URL generation via S3 SDK
  - Write integration tests for each repository
  - _Requirements: 15.1, 14.1, 5.7, 1.8, 16.5, 16.6_

- [x] 12. S3, SES, and Cognito adapters
- [x] 12.1 Implement the S3 policy repository adapter with seed deployment and web builder write support
  - Read policies from S3 bucket: company policy from org.json, group policies from groups/ prefix, user policies from users/ prefix
  - Write policies to S3 for web policy builder: saveGroupPolicy and saveUserPolicy write JSON to appropriate S3 keys
  - CDK configuration: deploy seed JSON files from git policies/ folder on first deployment only (do not overwrite existing)
  - Cache policy reads within a Lambda invocation to avoid repeated S3 calls
  - Write integration tests verifying read/write cycle and seed deployment behavior
  - _Requirements: 4.2, 4.4, 3.6_

- [x] 12.2 (P) Implement the S3 document repository adapter for employee document uploads
  - Generate pre-signed PUT URLs for upload (15-minute expiry, max 10MB, PDF and image types only)
  - Generate pre-signed GET URLs for download (15-minute expiry)
  - Store document metadata in DynamoDB with S3 key reference
  - CDK: create the documents S3 bucket with appropriate CORS and lifecycle policies
  - Write integration tests for URL generation and metadata persistence
  - _Requirements: 16.5_

- [x] 12.3 (P) Implement the SES email adapter for salary statement emails
  - Send HTML emails via AWS SES with configurable sender address
  - Build salary statement HTML template with: period, base salary, allowances, deductions, overtime pay, bonus, commission, net amount, payment method and date
  - CDK: configure SES domain verification and sandbox exit for production
  - Write unit tests for template rendering with various payroll breakdown scenarios
  - _Requirements: 10.12_

- [x] 12.4 Implement the Cognito auth provider adapter for user lifecycle management
  - Create Cognito user during employee onboarding: set email, temporary password, employee_id as custom attribute, role as Cognito group
  - Disable Cognito user during offboarding (preserve for audit, do not delete)
  - Update user attributes when role or other profile fields change
  - CDK: create Cognito User Pool with Lite tier, hosted UI, custom attributes (employee_id, role, preferred_language), app client with OAuth flows
  - Write integration tests for user creation and attribute management
  - _Requirements: 16.1, 16.2, 5.1_

- [x] 13. API handlers and REST middleware
- [x] 13.1 Build the API middleware chain: JWT authentication, permission enforcement, input validation, and error handling
  - JWT authentication middleware: verify Cognito JWT token, extract actor ID and role from claims, reject 401 for missing/invalid tokens
  - Permission middleware: call the permission engine's authorize function with actor context, requested action, and resource context; return 403 with reason on denial
  - Input validation middleware: validate request bodies against Zod schemas; return 400 with field-level errors
  - Error handling middleware: catch service errors and map to appropriate HTTP status codes (400, 403, 404, 409, 422, 500)
  - All middleware follows the handler pattern: parse → auth → permission → validate → execute → respond
  - Write unit tests for each middleware component with valid and invalid inputs
  - _Requirements: 5.1, 5.2, 19.4_

- [x] 13.2 Implement employee, attendance, and leave API handlers
  - Employee endpoints: GET /employees/me (own profile), GET /employees/:id (manager/admin), GET /employees (admin list), POST /employees (admin create), PATCH /employees/:id (admin update)
  - Attendance endpoints: GET /attendance/state (own current state), GET /attendance/events (own events by date/month), POST /attendance/events (log event via web), PATCH /attendance/events/:id (edit with audit)
  - Leave endpoints: POST /leave-requests (create), GET /leave-requests (list with filters), PATCH /leave-requests/:id (approve/reject by manager), GET /leave/balance (own or direct report balance)
  - Each handler is a thin composition root: instantiate data adapters, inject into core services, delegate, return HTTP response
  - Write integration tests for each endpoint with authenticated requests
  - _Requirements: 3.1, 3.2, 3.3, 7.1, 9.3_

- [x] 13.3 (P) Implement payroll, flag, bank, report, and admin API handlers
  - Payroll endpoints: GET /payroll/:yearMonth (own or direct report breakdown)
  - Flag endpoints: GET /flags (manager view with filters), PATCH /flags/:id (resolve with bank offset option)
  - Bank endpoints: GET /bank (own or manager view), POST /bank/approve (manager approves surplus banking)
  - Report endpoints: GET /reports (own or team by date), POST /reports (create via web)
  - Admin endpoints: POST /onboard (full onboarding including Cognito user creation), POST /offboard/:id (settlement preview and deactivation)
  - Quota endpoints: GET /quota-plans, POST /quota-plans (manager creates redistribution)
  - Holiday endpoints: GET /holidays (by region/year), POST /holidays (admin/RBAC), DELETE /holidays/:region/:date
  - Policy endpoints: GET /policies/:groupName, PUT /policies/:groupName (admin writes to S3)
  - Role endpoints: GET /roles (list), POST /roles (create custom role with permissions)
  - Document endpoints: POST /documents/upload-url, GET /documents (list by employee)
  - Audit endpoints: GET /audit/:targetId (admin view with date filters)
  - Salary email endpoints: POST /salary-emails/send (admin triggers email for specific employee/month)
  - Write integration tests for each endpoint group
  - _Requirements: 3.3, 3.4, 3.6, 10.16, 11.2, 12.5, 2.1, 15.1, 5.7, 16.5, 18.2, 10.12_

- [x] 13.4 Implement the CDK API stack with Lambda handlers, API Gateway, and Cognito authorizer
  - Define API Gateway REST API with Cognito User Pool authorizer
  - Create Lambda functions for each handler group with Node.js 20 runtime
  - Configure IAM roles with least-privilege access to DynamoDB, S3, SES, and Cognito
  - Set up CORS for the web app domain
  - Create environment-specific deployments (dev/prod)
  - _Requirements: 19.3, 19.6, 19.7_

- [x] 14. Slack integration
- [x] 14.1 Implement the Slack ack Lambda with fast event acknowledgment and SQS enqueue
  - Use @slack/bolt with AwsLambdaReceiver for Slack signature verification and event parsing
  - Acknowledge all events with HTTP 200 within 200ms
  - Determine channel **purpose** (attendance, reporting, or both) from channel config — channels are mapped by purpose, NOT by team/group. A single channel can contain members from multiple teams and employment types
  - Enqueue the full event payload (including channel purpose) to SQS Standard queue for async processing
  - CDK: create SQS queue with dead letter queue, Lambda function with 10-second timeout, API Gateway endpoint for Slack events
  - Write unit tests for event classification and SQS enqueue
  - _Requirements: 1.5, 1.8_

- [x] 14.2 Implement the Slack processor Lambda that handles attendance messages
  - Consume events from SQS queue
  - Look up employee by Slack ID from the event — the employee profile provides team, group, region, language preference, and policy group. This is the source of truth, NOT the channel
  - Match message text against keyword configurations for the employee's preferred language
  - Validate attendance state transition
  - Persist the attendance event via the attendance service
  - Reply in the employee's preferred language with the appropriate confirmation message (bilingual templates: JP and EN)
  - Public channel responses show only: name, action, and timestamp — no hours, salary, or personal data
  - Handle invalid transitions by replying with descriptive error in user's language including relevant timestamp
  - Write integration tests for full message-to-reply flow
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.9, 1.12, 1.15_

- [x] 14.3 (P) Implement the Slack processor handlers for daily reports, language changes, and guidebook
  - Daily report handler: parse message as report, extract JIRA/GitHub references, save via report service, warn if no references found
  - Message edit handler: detect message_changed events, create new report version preserving previous versions
  - Language change handler: match "lang en", "lang ja", "言語 en" etc., update employee language preference, confirm in new language
  - Guidebook handler: match help/ヘルプ, send ephemeral message (visible only to requesting user) showing available keywords, language commands, report instructions, and web app link — in the user's preferred language
  - Write tests for each handler
  - _Requirements: 2.1, 2.2, 2.3, 1.10, 1.11_

- [x] 14.4 Implement the CDK Slack stack with dual-Lambda pattern and SQS
  - Create the ack Lambda with API Gateway endpoint registered as Slack Events API URL
  - Create the processor Lambda triggered by SQS
  - Configure SQS Standard queue with DLQ (maxReceiveCount: 3)
  - Set up CloudWatch alarm on DLQ depth for failed message alerting
  - Configure both Lambdas with appropriate IAM roles, environment variables (Slack tokens, DynamoDB table name), and Node.js 20 runtime
  - _Requirements: 1.5, 19.3, 19.7_

- [x] 15. Web application theme, layout, and authentication
- [x] 15.1 Set up the React project with Vite, routing, authentication flow, and i18n configuration
  - Initialize the web package with React 18, Vite 5, React Router v6, and react-i18next
  - Configure Cognito Hosted UI integration for login/signup flows
  - Store JWT tokens in memory only (not localStorage) for XSS protection
  - Build an API client wrapper that attaches JWT Authorization header to all requests
  - Set up React Query for server state management
  - Create translation JSON stub files for en, ja, and ne
  - Implement role-based route guards: redirect unauthenticated users to login, restrict admin routes
  - _Requirements: 3.5, 19.4, 22.6_

- [x] 15.2 Implement the WillDesign brand theme with CSS design tokens and responsive layout shell
  - Create the theme CSS file with all design tokens as custom properties: colors (primary #000, accent #58C2D9, success #40DEC5, warning #E2498A, etc.), typography (Silom for headings, system sans-serif for body), spacing, radii, and transitions
  - Build the application layout shell: sidebar navigation with WillDesign logo (linking to dashboard), main content area, responsive behavior (mobile bottom nav < 640px, collapsible sidebar 640-1024px, full sidebar > 1024px)
  - Apply the light, modern, minimalist aesthetic: high contrast black/white with cyan accents, clean card-based layouts, generous whitespace, subtle border radii (4-12px), smooth 150ms transitions
  - Include the accent gradient for feature highlights and banners
  - Set up data visualization color tokens for charts
  - Write visual regression baseline tests for layout at each breakpoint
  - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6_

- [x] 16. Web PWA shell, pages, and components

- [x] 16.0 Set up the Progressive Web App shell with service worker, manifest, offline support, and push notifications
  - Configure Vite PWA plugin (vite-plugin-pwa) with Workbox for service worker generation
  - Create web app manifest with WillDesign branding: app name "WillDesign HR", short name "WD HR", theme color #58C2D9, background #FFFFFF, display standalone, app icons (192px, 512px) derived from WillDesign logo
  - Implement service worker caching strategy: cache-first for static assets (JS, CSS, fonts, images, i18n JSON), network-first for API calls with stale-while-revalidate fallback
  - Offline dashboard: cache last-known dashboard state (hours, balance, status) in IndexedDB; display with "last updated" timestamp when offline
  - Offline attendance queue: when offline, queue clock-in/out actions in IndexedDB and auto-sync when connection restores (with conflict resolution if Slack event arrived first)
  - Push notification setup: subscribe to push via service worker; API endpoint to register device tokens; trigger notifications for leave approvals, flag alerts, report reminders, salary statement availability
  - "Add to Home Screen" install prompt: show custom install banner on first 3 visits for mobile users
  - Write tests for service worker registration, offline fallback, queue sync, and manifest validation
  - _Requirements: 22.7_
- [x] 16.1 Build the employee dashboard page with mobile-first quick-action clock widget
  - Display current clock status (idle/clocked in/on break) with today's hours
  - **Mobile quick-clock widget**: prominent one-tap clock-in/out button at top of dashboard (alternative to Slack for mobile PWA users), with swipe gestures for break start/end. Touch targets minimum 44px
  - Show weekly and monthly hours progress against policy requirements — at-a-glance on mobile
  - Display leave balance and upcoming approved leave
  - Show overtime tracking summary (actual vs deemed for JP employees)
  - List pending actions: unanswered leave requests (if manager), unresolved flags (if manager), report submission status
  - Mobile layout: single column, bottom navigation, clock widget always visible without scrolling
  - _Requirements: 3.1, 22.8_

- [x] 16.2 (P) Build the attendance management page with history view, edit capability, and team leave calendar
  - Attendance history: list attendance events by date with session summaries (worked hours, break durations)
  - Web clock-in/out: allow employees to log attendance events from the web (with audit trail)
  - Attendance edit: employees can edit their own records; edits create new audit entries preserving originals
  - Team leave calendar: visible to all employees showing who is off which days. Permission-based privacy: employees see only name + "on leave" (no type); managers and admin see leave type details (paid/unpaid/shift). API must strip leave type from response based on caller's role before returning data
  - _Requirements: 3.2, 3.7, 5.2_

- [x] 16.3 (P) Build the leave request, daily reports, and payroll pages
  - Leave request page: form to submit leave requests with date picker optimized for touch (native date inputs on mobile); date range and type selection; list of own requests with status; manager view with approve/reject actions (swipe or one-tap on mobile) for direct reports
  - Daily reports page: view own reports by date; submit/edit reports from web; view team reports (manager view)
  - Payroll page: monthly payroll breakdown view showing every component — base salary, pro-rata adjustments, overtime calculations, allowances, bonuses, commission, deductions (deficit hours), blending details (if applicable), transfer fees, net amount, JPY equivalent; transparent and auditable for both employees (own data) and managers (direct reports)
  - _Requirements: 3.2, 3.8, 10.16_

- [x] 16.4 Build the admin panel with onboarding, offboarding, policy builder, role management, and configuration
  - Onboarding form: create employee record with all required fields (name, email, Slack ID, employment type, salary, manager, region, policy group), creates both DynamoDB record and Cognito account
  - Offboarding flow: show settlement preview (pro-rata salary, deductions, leave handling), allow exit notes, deactivate employee
  - Post-termination tracking: display confidentiality obligation expiry (2 years) and non-compete expiry (12 months); admin can query active legal obligations
  - Policy builder UI: view and edit policy configurations per group without code changes; writes directly to S3
  - Role management: create custom roles with granular permission selection; assign roles to users
  - Holiday calendar management: view/add/edit/remove holidays per region; JP holidays seeded with substitute holiday support; NP holidays manual
  - Slack channel configuration: map channels to attendance/report groups
  - Salary email management: trigger manual salary email sends; configure automated schedule
  - Document management: view employee documents (admin view)
  - _Requirements: 3.4, 3.6, 16.1, 16.2, 16.4, 5.7, 5.9, 15.1, 15.2, 15.3, 1.8_

- [x] 16.5 (P) Build the manager team view with flags, hours banking, surplus approval, and quota management
  - Team hours overview: list direct reports with current week/month hour progress
  - Flag management: list pending flags for direct reports with resolution actions (no penalty, deduct, use bank, partial bank, discuss); show available bank balance alongside each flag. Mobile: quick-action buttons for common resolutions, swipe to resolve
  - Surplus banking: approve/reject surplus banking requests; set max_leave_days per approval
  - Quota redistribution: create redistribution plans, view active plans, see validation warnings
  - Missing report tracking: show which team members haven't submitted reports for the current day
  - Mobile: real-time team attendance status view, push notifications for new leave requests and pending flags
  - _Requirements: 3.3, 11.2, 12.1, 12.5, 14.1, 2.5, 22.9_

- [x] 17. Cron jobs and scheduled tasks
- [x] 17.1 Implement the daily cron job for end-of-day attendance checks and flag generation
  - Run at 23:55 JST daily
  - Check for unclosed sessions across both teams and flag them for admin review (do NOT auto-close)
  - Check for open breaks and flag them for admin review
  - Flag sessions shorter than configurable minimum duration (default 5 minutes) as potentially accidental
  - Generate daily shortfall flags for employees who worked but fell below daily minimum (respecting pre-approvals)
  - _Requirements: 20.1, 7.7, 7.8_

- [x] 17.2 (P) Implement the weekly and monthly cron jobs
  - Weekly (Monday 00:15 JST): generate weekly shortfall summary flags for both teams
  - Monthly (1st 00:30 JST): generate monthly summary and payroll calculations; process surplus expiry (forfeit entries older than 12 months); run leave accrual (add days per policy); generate monthly shortfall flags
  - _Requirements: 20.2, 20.3_

- [x] 17.3 (P) Implement reminder and alert cron jobs
  - Every 4 hours: check for pending leave requests older than 24h, send reminder to approving manager via Slack DM
  - Daily report reminders: send reminder at configurable time per team/group if no report submitted
  - Payment deadline alert: send reminder to admin at configurable days before each team's payment deadline (follows cascading policy for deadline dates)
  - Surplus expiry warning: send DM to employee and manager when banked surplus is within 30 days of expiry
  - Probation expiry alert: 14 days before an employee's probation end date, send alert to their manager prompting the mandatory performance review (per contract Article 3.7)
  - _Requirements: 20.4, 20.5, 20.6, 2.5, 10.15, 17.3_

- [x] 17.4 (P) Implement scheduled salary statement email sending
  - Auto-send salary statement emails to employees based on configured schedule per cascading policy (company → group → employee)
  - Default: Nepal team on 16th of following month, Japan team at end of following month (configurable)
  - Use the email adapter to render and send the salary breakdown HTML template
  - Log email sends in audit trail
  - _Requirements: 20.7, 10.13_

- [x] 17.5 Implement the CDK scheduler stack with EventBridge rules
  - Create EventBridge rules for each cron schedule: daily (23:55 JST), weekly (Monday 00:15 JST), monthly (1st 00:30 JST), every 4 hours, configurable daily report reminders
  - Create Lambda functions for each cron job type with appropriate IAM roles and timeout configuration
  - Configure environment-specific schedules (dev may run less frequently)
  - _Requirements: 19.7, 19.3_

- [x] 18. Onboarding, offboarding, and holiday seeding
- [x] 18.1 Implement the complete onboarding workflow that creates all required records across systems
  - Create employee record in DynamoDB with all fields: profile, employment type, initial salary history entry (change type INITIAL), policy group assignment, manager assignment, Slack ID mapping, region/timezone
  - Create Cognito user account with temporary password, employee_id custom attribute, and role group assignment
  - Set initial document verification status to PENDING for identity documents (citizenship, PAN) per contract Article 4.11; admin can later update to VERIFIED/REJECTED with audit trail
  - Verify all records created successfully; roll back on partial failure
  - Write integration tests for complete onboarding flow
  - _Requirements: 16.1, 16.6_

- [x] 18.2 (P) Implement the offboarding workflow with settlement preview, buyout option, and deactivation
  - Show settlement preview before confirmation: pro-rata salary for partial month, outstanding deductions, leave handling per employment type (NP forfeit, JP labor law)
  - Record termination type: WITHOUT_CAUSE (30-day notice or buyout), FOR_CAUSE (7-day notice with cure period per Article 2.4), MUTUAL, or RESIGNATION. For FOR_CAUSE, track cure period expiry date to document that contractual good-faith requirements were met
  - Include notice period buyout toggle: per contract Article 2.3, either party may pay one month's service fee in lieu of the 30-day notice period, payable within 7 days. Settlement preview calculates the buyout amount (1 month's service fee at current rate)
  - Final pro-rata payment due by the 15th of the month following termination
  - Allow admin to add free-text exit notes (knowledge transfer status, return of materials)
  - Set employee status to INACTIVE, disable Cognito user account
  - Track post-termination dates: confidentiality obligation expiry (2 years) and non-compete expiry (12 months). Provide a searchable admin view showing all former employees with active legal obligations and their expiry dates
  - All historical data preserved — inactive employees cannot use system features
  - Write integration tests for settlement calculation, buyout, termination types, cure period, and deactivation
  - _Requirements: 16.2, 16.3, 16.4, 16.8_

- [x] 18.3 (P) Seed Japanese national holidays and implement holiday management operations
  - Seed JP national holidays as defaults with substitute holiday (振替休日) support
  - NP holidays configured manually by admin each year
  - CRUD operations for holiday calendars per region, respecting RBAC permissions for who can manage holidays
  - Holidays reduce required hour calculations for affected periods
  - Write tests for holiday seeding, CRUD, and hour reduction calculations
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 5.9_

- [ ] 19. CDK web hosting stack and CI/CD pipeline
- [ ] 19.1 Implement the CDK web hosting stack with S3 and CloudFront
  - Create S3 bucket for static site hosting with appropriate bucket policy
  - Configure CloudFront distribution with custom domain support, HTTPS, and caching headers
  - Set up environment-specific deployments (dev-hr.willdesign.com, hr.willdesign.com)
  - _Requirements: 19.3, 19.6_

- [ ] 19.2 (P) Set up the GitHub Actions CI/CD pipeline for automated testing and deployment
  - CI workflow (on PR): run lint, typecheck, and all tests across all packages
  - Deploy-dev workflow (on push to develop): build and deploy all stacks to dev environment
  - Deploy-prod workflow (on push to main): build and deploy all stacks to prod environment
  - Configure workspace-aware builds: only rebuild changed packages and their dependents
  - _Requirements: 19.2, 19.6_

- [ ] 20. End-to-end integration and scalability verification
- [ ] 20.1 Write end-to-end tests covering the primary user flows across Slack, API, and web
  - Slack attendance flow: simulate Slack event → ack Lambda → SQS → processor → DynamoDB → Slack reply
  - Leave workflow: web request → API → leave service → DynamoDB → manager approval → balance update → notification
  - Payroll calculation: attendance events accumulated → monthly cron → payroll breakdown → salary email
  - Admin onboarding: API call → DynamoDB employee + Cognito user → first clock-in via Slack
  - Flag resolution with bank offset: monthly cron → flag → manager resolves with bank → no deduction
  - _Requirements: 19.5_

- [ ] 20.2 (P) Verify scalability targets and region-extensibility
  - Confirm DynamoDB schema supports 100+ users without architectural changes (load test with simulated data)
  - Verify new employment types, roles, and policy groups can be added via configuration only — no code changes
  - Confirm adding a new region (beyond Japan and Nepal) requires only: new policy group JSON, new holiday calendar, employee region attribute — no schema migration
  - _Requirements: 21.1, 21.2, 21.3_

## Requirements Coverage

All 121 requirements across 22 sections are mapped to implementation tasks:

| Section | Requirements | Tasks |
|---------|-------------|-------|
| 1. Slack Integration | 1.1-1.15 | 6.1, 6.2, 6.3, 14.1-14.4 |
| 2. Daily Reports | 2.1-2.6 | 10.1, 14.3, 17.3 |
| 3. Web Application | 3.1-3.8 | 15.1-15.2, 16.1-16.5 |
| 4. Policy Engine | 4.1-4.7 | 4.1-4.3, 12.1 |
| 5. Permissions | 5.1-5.9 | 5.1-5.2, 12.4, 13.1 |
| 6. Employment Types | 6.1-6.4 | 2.1, 4.2 |
| 7. Attendance | 7.1-7.9 | 6.1, 6.3, 6.4, 17.1 |
| 8. Overtime | 8.1-8.5 | 10.2, 4.2 |
| 9. Leave | 9.1-9.7 | 7.1-7.2 |
| 10. Compensation | 10.1-10.16 | 8.1-8.2, 12.3, 17.4, 13.3 |
| 11. Flags | 11.1-11.5 | 9.1-9.2 |
| 12. Banking | 12.1-12.5 | 9.3 |
| 13. Force Majeure | 13.1-13.2 | 9.5 |
| 14. Quota | 14.1-14.3 | 9.4 |
| 15. Holidays | 15.1-15.4 | 18.3, 6.4 |
| 16. Onboarding | 16.1-16.8 | 18.1-18.2, 12.2, 12.4, 8.1 |
| 17. Probation | 17.1-17.3 | 4.3, 17.3 |
| 18. Audit | 18.1-18.4 | 6.3, 11.2 |
| 19. Infrastructure | 19.1-19.7 | 1.1-1.2, 11.1, 13.4, 14.4, 17.5, 19.1-19.2 |
| 20. Cron Jobs | 20.1-20.7 | 17.1-17.5 |
| 21. Scalability | 21.1-21.3 | 20.2 |
| 22. Brand & Theme | 22.1-22.9 | 15.1-15.2, 16.0, 16.1, 16.3, 16.5 |

**Deferred (Phase 2)**: Requirement 2.6 (AI/Claude report verification) is explicitly listed as a non-goal for v1 per requirements.md.
