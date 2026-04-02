# Requirements — WillDesign HR Platform

## Project Description
Full-stack HR platform for WillDesign KK/GK serving both Japan-based employees and Nepal-based contractors. AWS backend, React frontend, Kincone-style Slack message-based attendance, Slack-based daily reporting with JIRA/GitHub reference tracking, cascading policy engine (company → group → employee), RBAC + ABAC permissions, i18n (en/ja/ne), and configurable employment types. Monorepo with TDD, GitHub Actions CI/CD, dev + prod environments. Single-tenant (WillDesign only).

---

## EARS Requirements (Easy Approach to Requirements Syntax)

### 1. Slack Integration (Message-Based Attendance Only)

**Scope**: Slack handles ONLY attendance (clock in/out, break start/end) and daily reporting. All other features (leave requests, payroll, flags, hours banking, admin operations) are web-only.

**REQ-SLACK-001**: When a user sends a message matching clock-in keywords (e.g., "hello", "hi", "おはよう") in the designated attendance channel, the system shall log a clock-in event and reply in the user's default language:
- Japanese: `出勤: {time} {full_name}さん、おはようございます`
- English: `Clock in: {time} Good morning, {full_name}`

**REQ-SLACK-002**: When a user sends break-start keywords ("break", "休憩"), the system shall log a break-start event and reply:
- Japanese: `休憩開始: {time}`
- English: `Break started: {time}`

**REQ-SLACK-003**: When a user sends break-end keywords ("back", "戻り"), the system shall log a break-end event and reply:
- Japanese: `休憩終了: {time}`
- English: `Break ended: {time}`

**REQ-SLACK-004**: When a user sends clock-out keywords ("bye", "おつかれ"), the system shall log a clock-out event and reply:
- Japanese: `退勤: {time} {full_name}さん、お疲れ様でした`
- English: `Clock out: {time} Good work today, {full_name}`

**REQ-SLACK-005**: The system shall acknowledge Slack events within 200ms by returning HTTP 200, then process asynchronously via SQS to stay within Slack's 3-second response window.

**REQ-SLACK-006**: When a user edits their attendance on the web app, the system shall keep both the original Slack-submitted record and the web-edited record in an append-only audit log, with source attribution (slack/web) and actor ID.

**REQ-SLACK-007**: The Slack bot shall support configurable keyword mappings per language so that attendance keywords can be customized without code changes.

**REQ-SLACK-008**: A single Slack bot shall serve both Japan and Nepal teams. Channels shall be mapped by **purpose** (attendance, reporting, or both) — not by team/group. A single channel can contain members from multiple teams and employment types. The user's team, group, language, and policy are always resolved from their **employee profile** (via Slack ID lookup), not from the channel. Channel-purpose mapping shall be configurable by admin.

#### Bilingual Bot & Language Preferences

**REQ-SLACK-009**: Each user shall have a default bot language preference. Japan team defaults to Japanese (ja), Nepal team defaults to English (en). All bot replies (attendance confirmations, errors, warnings, guidebook) shall use the user's preferred language.

**REQ-SLACK-010**: Users shall be able to change their default language from Slack by sending a language command (e.g., "lang en", "lang ja", "言語 en"). The change shall persist and apply to all future bot responses.

#### Slack Bot Guidebook

**REQ-SLACK-011**: The bot shall provide a guidebook accessible via a help keyword (e.g., "help", "ヘルプ") that shows:
- Available attendance keywords (clock in/out, break start/end)
- How to change language preference
- How to submit daily reports
- Link to the web app for all other features (leave, payroll, etc.)
The guidebook shall be displayed in the user's preferred language and sent as an ephemeral message (visible only to the requesting user).

#### Attendance Validation (State Machine)

**REQ-SLACK-012**: The system shall enforce a 3-state attendance state machine: IDLE, CLOCKED_IN, ON_BREAK. Valid transitions:
- IDLE → CLOCKED_IN (clock in)
- CLOCKED_IN → IDLE (clock out)
- CLOCKED_IN → ON_BREAK (break start)
- ON_BREAK → CLOCKED_IN (break end)
All other transitions shall be rejected with a descriptive error in the user's language, including the relevant timestamp (e.g., "Already clocked in since 09:00").

**REQ-SLACK-013**: Multiple clock-in/out sessions per day shall be allowed (after clocking out, user can clock in again). Multiple breaks per session shall be allowed. Daily hours = SUM(all sessions) - SUM(all breaks).

**REQ-SLACK-014**: A 60-second idempotency window shall prevent duplicate clock-in events from the same user (prevents accidental double-tap).

**REQ-SLACK-015**: Attendance responses in public channels shall show ONLY: name, action, and timestamp. No hours, salary, deficit, or personal data shall appear in public channels.

### 2. Slack-Based Daily Reporting

**REQ-REPORT-001**: When a user sends a message in the designated reporting channel, the system shall parse and log it as a daily report with: yesterday's work, today's plan, and blockers.

**REQ-REPORT-002**: Reports shall include references to repository name, JIRA ticket IDs (e.g., PROJECT-123), and GitHub PRs (e.g., repo-name#42). The bot shall warn via reply if a report contains no JIRA or GitHub references.

**REQ-REPORT-003**: When a user edits their report message in Slack, the system shall append a new version to the log while preserving all previous versions. Each version shall include: timestamp, content, edit source, and version number.

**REQ-REPORT-004**: All report data shall be stored in an append-only format optimized for future LLM analysis. Structured references (JIRA IDs, repo+PR) shall be extracted and stored as structured data alongside raw report text.

**REQ-REPORT-005**: Missing reports shall generate warnings (not penalties). The bot shall send a reminder if no report is submitted by a configurable time.

**REQ-REPORT-006**: Future capability (not for initial build): Claude/AI verification to cross-check reports against actual JIRA activity and GitHub commits, flagging discrepancies for manager review.

### 3. Web Application (Dashboard & All Management Features)

**Scope**: The web app is the primary interface for ALL features beyond attendance and daily reporting. Leave requests, payroll, flags, hours banking, admin operations, policy management — all web-only.

**REQ-WEB-001**: The web application shall provide a dashboard showing: current clock status, today's hours, weekly/monthly progress, leave balance, overtime tracking, and pending actions for the logged-in user.

**REQ-WEB-002**: The web application shall allow employees to: edit their own attendance records (with audit trail), view hours breakdowns, submit/edit daily reports, request leave, view payroll, view their surplus bank, and view their own policy configuration.

**REQ-WEB-003**: The web application shall allow managers to: view team hours, approve/reject leave requests, resolve shortfall flags, manage surplus banking, adjust quotas, and view daily reports — scoped to direct reports only.

**REQ-WEB-004**: The web application shall allow admins to: onboard/offboard employees, manage policy groups and roles, manage holiday calendars, view all employee data, export payroll, manage permissions, and configure Slack channel mappings.

**REQ-WEB-005**: The web application shall support i18n with at minimum English (en), Japanese (ja), and Nepali (ne) translations.

**REQ-WEB-006**: The web application shall provide a policy builder UI where admins can create and modify HR policies (leave types, hour requirements, allowance types, overtime rules, bonus schedules) without code changes.

**REQ-WEB-007**: The web application shall provide a team leave calendar visible to both employees and managers, showing who is off on which days. Leave type details (paid vs unpaid) shall only be visible to managers and admin — employees see only name + "on leave."

**REQ-WEB-008**: The web application shall provide a payroll calculation breakdown view showing: base salary, pro-rata adjustments, overtime calculation, allowances, bonuses, commission, deductions (deficit × hourly rate), mid-month blending (if applicable), transfer fees, net amount, and JPY equivalent. This breakdown shall be transparent for both employees (own data) and managers (direct reports).

### 4. Cascading Policy Engine

**REQ-POL-001**: The system shall resolve effective policies using a 3-level cascade: Company defaults → Policy Group overrides → Employee-level overrides, where lower levels override higher levels (deep merge).

**REQ-POL-002**: The policy cascade shall initially read from static JSON files:
- `policies/org.json` — company-wide defaults
- `policies/groups/{group-name}.json` — group-level overrides (sparse)
- `policies/users/{user-id}.json` — employee-level overrides (sparse, only differing fields)

**REQ-POL-003**: The policy resolver shall be a pure function `resolvePolicy(userId): EffectivePolicy` that performs deep merge of company → group → user, with no side effects, making it testable and swappable to DB-backed sources later.

**REQ-POL-004**: The policy resolver architecture shall support future migration to database-backed policies by swapping only the data source layer — the resolution logic remains unchanged.

**REQ-POL-005**: Policies shall cover at minimum:
- **Hours**: daily/weekly/monthly minimums, work arrangement (remote/office/hybrid), time type (fixed/flex/full-flex), core hours
- **Leave**: accrual schedule, start condition, cap, carry-over rules, leave types, mandatory usage rules
- **Overtime**: deemed overtime hours (みなし残業), overtime pay rates, overtime tracking thresholds
- **Compensation**: salary type (monthly/annual), bonus schedule and timing, allowance definitions, commission tracking
- **Probation**: duration, leave rules during probation, notice period during probation
- **Work arrangement**: location type, time type

**REQ-POL-006**: When a policy changes (new version with `effective_from` date), existing employees shall continue under the old policy until the effective date.

**REQ-POL-007**: The system shall ship with seed policy data including Japanese labor law defaults (overtime rates, leave schedule, 36 Agreement limits) as a built-in company-level policy template.

### 5. Permission System (RBAC + ABAC)

**REQ-PERM-001**: The system shall implement Role-Based Access Control (RBAC) with at minimum these roles: Employee, Manager, HR Manager, Admin, Super Admin (CEO). Roles shall be editable by admin.

**REQ-PERM-002**: The system shall implement Attribute-Based Access Control (ABAC) where access decisions consider: user role, reporting chain (reports_to hierarchy), resource ownership, data sensitivity level, and team/group membership.

**REQ-PERM-003**: A manager shall be able to view salary, hours, leave, flags, and daily reports only for employees who report directly to them (manager_id = their user_id).

**REQ-PERM-004**: An admin shall have full read/write access to all employee data across the organization.

**REQ-PERM-005**: The CEO (Super Admin) shall be able to override any permission restriction.

**REQ-PERM-006**: The system shall support multiple admins — any user can be elevated to admin as the organization grows.

**REQ-PERM-007**: Custom roles shall be definable with granular permissions (e.g., "HR Manager can view salary but cannot change policy", "Finance can export payroll but cannot approve leave").

**REQ-PERM-008**: Sensitive data (salary, payroll, deductions) shall never appear in public Slack channels — only in DMs or ephemeral messages.

**REQ-PERM-009**: Holiday calendar management shall be controlled by RBAC — configurable which roles can add/edit/remove holidays.

### 6. Employment Types & Contracts

**REQ-EMP-001**: The system shall support the following Japan-side employment types:
- 正社員 (Full-Time Employee) — Japanese labor law, social insurance
- 契約社員 (Contract Employee) — Fixed-term, renewable
- 業務委託 (Gyoumu Itaku / Outsourced Contractor) — Independent contractor, no labor law
- パートタイム (Part-Time) — Reduced hours, pro-rata benefits
- Sales (any type + commission component)
- Intern (paid or unpaid)

**REQ-EMP-002**: The system shall support the following Nepal-side employment types:
- Full-Time Contract Developer — 160h/month, Nepal Contract Act 2056
- Paid Contract Intern — 80h/month
- Unpaid Intern — hours tracked, no compensation (optional stipend configurable)
- Future: Full-time permanent employee, part-time employee

**REQ-EMP-003**: Employment types shall be configurable by admin. New types can be created and mapped to policy groups without code changes.

**REQ-EMP-004**: Each employment type shall map to a policy group that defines its default hour requirements, leave rules, overtime rules, and compensation structure.

### 7. Attendance & Hours Tracking

**REQ-ATT-001**: The system shall track attendance events: CLOCK_IN, CLOCK_OUT, BREAK_START, BREAK_END with timestamps stored in UTC, displayed in user's local timezone (JST for Japan, NPT for Nepal).

**REQ-ATT-002**: The system shall enforce state transitions: no double clock-in, no clock-out without clock-in, no break without active session.

**REQ-ATT-003**: Cross-midnight sessions shall count all hours toward the clock-in date.

**REQ-ATT-004**: The system shall calculate hours as: `total = SUM(work_sessions) - SUM(breaks) + leave_credits`.

**REQ-ATT-005**: Hour requirements shall resolve via the cascading policy engine: Employee override → Group policy → Company defaults.

**REQ-ATT-006**: The system shall track work location per session (office/remote) when applicable.

**REQ-ATT-009**: Work performed on holidays shall count toward the monthly minimum at the standard 1.0x rate (no premium for Nepal contractors per flat monthly fee model). The system shall allow an optional "emergency" metadata tag on attendance events to distinguish mandatory incident response work from voluntary holiday work.

**REQ-ATT-007**: Unclosed sessions and open breaks shall be flagged for admin review at end-of-day (23:55 JST). The system shall NOT auto-close breaks or sessions — admin uses the web UI to manually fix attendance records.

**REQ-ATT-008**: Sessions shorter than a configurable minimum duration (default: 5 minutes) shall be flagged for admin review as potentially accidental or gaming attempts. This is a query/view — not a blocking mechanism.

### 8. Overtime Tracking

**REQ-OT-001**: The system shall track overtime hours for all employees where applicable, regardless of whether overtime is paid or included in salary (みなし残業).

**REQ-OT-002**: For employees with みなし残業 (deemed overtime), the system shall track actual overtime and flag when actual exceeds the deemed threshold (company default: 45h, configurable per company → group → employee).

**REQ-OT-003**: Overtime pay rates shall follow Japanese labor law defaults (configurable via policy engine):
- Regular overtime: 1.25x base hourly rate
- Late night (22:00-05:00): additional 0.25x
- Holiday work: 1.35x
- Overtime exceeding 60h/month: 1.5x

**REQ-OT-004**: The system shall track overtime against 36 Agreement limits (45h/month, 360h/year) and warn when approaching limits.

**REQ-OT-005**: Overtime configuration (pay type, deemed hours, rates) shall follow the cascading policy: company → group → employee.

### 9. Leave Management

**REQ-LEAVE-001**: The system shall support configurable leave types including: Paid Leave, Unpaid Leave, Shift Permission, Credited Absence, and any admin-defined types.

**REQ-LEAVE-002**: Leave accrual shall be configurable per company → group → employee. Defaults:
- Nepal contractors: 1 day/month after 3-month probation, cap 20 days
- Japan employees: Japanese labor law schedule (10 days at 6 months, scaling to 20 days at 6.5 years), 2-year carry-over

**REQ-LEAVE-003**: Leave approval workflow: Employee requests → Manager receives notification → Manager approves/rejects → Employee notified. Same workflow for both teams.

**REQ-LEAVE-004**: Leave termination rules shall be configurable: Nepal contractors forfeit unused leave; Japan employees follow labor law requirements.

**REQ-LEAVE-005**: The system shall support additional Japan-specific leave types (configurable): 慶弔休暇, 産休・育休, 介護休暇, 生理休暇, and company-specific leave.

**REQ-LEAVE-006**: For Japan employees, the system shall track mandatory 5-day annual leave usage (年5日取得義務) and warn when insufficient days have been taken.

**REQ-LEAVE-007**: The system shall enforce no-negative-leave-balance. If an employee has zero paid leave balance, paid leave requests shall be rejected. The system shall suggest unpaid leave or shift permission instead. Absence without approved leave is treated as absenteeism.

### 10. Compensation & Payroll

**REQ-PAY-001**: Payroll shall use `getEffectiveSalary()` from SalaryHistory — never current salary directly — to ensure historical accuracy.

**REQ-PAY-002**: The system shall support multiple salary types (configurable per employee):
- Monthly salary (月給) — JPY or NPR
- Annual salary (年俸) — divided into monthly payments
- Hourly rate — for part-time

**REQ-PAY-003**: Bonus configuration shall be cascading (company → group → employee):
- Default timing: twice a year (configurable months)
- UI options: twice a year with month selection, custom schedule, or none
- Bonus amounts input externally (not calculated by system)

**REQ-PAY-004**: Commission for sales roles shall be input as a final calculated amount (calculated externally). Commission timing is configurable.

**REQ-PAY-005**: Allowances shall be configurable per company → group → employee:
- 通勤手当 (Transportation)
- 住宅手当 (Housing)
- 役職手当 (Position)
- Custom allowance types (admin-definable)

**REQ-PAY-006**: For Nepal team: deductions = `deficit_hours × hourly_rate`, rounded up to nearest NPR. Payment via Wise by 15th, company covers fees.

**REQ-PAY-007**: For Japan team: social insurance and tax withholding handled externally for now. System tracks hours and final amounts. Phase 2: in-app deduction calculations and 給与明細 generation.

**REQ-PAY-008**: Pro-rata calculation for mid-month join/exit: `amount × (calendar_days_worked / total_calendar_days)`.

**REQ-PAY-009**: Salary changes shall be tracked in an append-only audit trail with change types: INITIAL, PROBATION_END, REVIEW, PROMOTION, ADJUSTMENT.

**REQ-PAY-010**: Currency handling: JPY for Japan team, NPR for Nepal team.

**REQ-PAY-011**: For all non-JPY payments (Nepal team and future regions), admin shall record: local currency amount (e.g., NPR), equivalent JPY amount, exchange rate, rate date, transfer fees paid, and net amount received by employee. Formula: `net_received = local_amount - transfer_fees` (company covers fees, so `local_amount` is the full agreed fee). This enables JPY expense tracking for accounting.

**REQ-PAY-012**: When salary for a month is confirmed, an authorized user (admin or RBAC-permitted role) shall be able to send a salary statement email to the employee. The system shall support a free email service (e.g., AWS SES free tier: 62K emails/month via Lambda). Salary statements shall include: period, base salary, allowances, deductions, overtime pay (if applicable), bonus, commission, net amount, and payment method/date.

**REQ-PAY-013**: Admin shall be able to schedule salary statement emails (e.g., auto-send on the 16th of each month for Nepal team, end of month for Japan team). Schedule timing shall follow the cascading policy: company default → group → employee.

**REQ-PAY-014**: If two salary entries exist within the same month (mid-month salary change), the system shall calculate a blended effective salary: `effective = (old_salary × days_at_old / total_days) + (new_salary × days_at_new / total_days)`. The web UI payroll view shall show this blending calculation breakdown transparently.

**REQ-PAY-015**: Payment deadline shall follow cascading policy: company default (end of following month) → group override (e.g., Nepal team: 15th of following month, Japan team: end of following month) → employee override. The system shall send an alert to admin at a configurable number of days before the deadline.

**REQ-PAY-016**: The web UI payroll view shall display the full salary calculation breakdown for each month: base salary, pro-rata adjustments, overtime calculations, allowances, bonuses, commission, deductions (deficit hours), blending (if applicable), and final net amount. This breakdown shall be transparent and auditable.

### 11. Flags & Shortfall Detection

**REQ-FLAG-001**: The system shall generate flags at 3 levels: Daily (warning), Weekly (warning), Monthly (actionable — may trigger deduction).

**REQ-FLAG-002**: Monthly flag resolution options: No Penalty, Deduct Full, Use Bank (offset from surplus), Partial Bank, Discuss.

**REQ-FLAG-003**: Anti-double-penalty: only monthly flags result in salary deductions. Daily/weekly are informational.

**REQ-FLAG-004**: Pre-approved absences shall suppress flag generation for those dates.

**REQ-FLAG-005**: Flag rules shall be configurable via the policy engine — different employment types may have different flag behaviors.

### 12. Hours Banking & Surplus

**REQ-BANK-001**: Surplus hours require manager pre-approval to be bankable.

**REQ-BANK-002**: Banked hours expire after 12 months (configurable via policy).

**REQ-BANK-003**: Surplus hours are never cashable — only offset against deficits or converted to leave (with manager permission, up to max_leave_days).

**REQ-BANK-004**: Past deductions are final — no retroactive reversal from future surplus.

**REQ-BANK-005**: Unapproved surplus shall be hidden from the employee's view. Only managers or users with appropriate RBAC permissions can see unapproved surplus. Employees can request surplus banking approval from their manager. Once approved, the surplus becomes visible to the employee and available for offset/leave conversion. This mirrors the Kincone-style flow: work → request approval → approved surplus becomes usable.

### 13. Force Majeure

**REQ-FM-001**: For verified events (natural disaster, political bandh, internet outage >24h), hour requirements shall be adjusted proportionally with no salary deduction.

**REQ-FM-002**: Contractor must notify within 24 hours. If event persists >30 days, either party may terminate with 7 days' notice.

### 14. Quota Redistribution

**REQ-QUOTA-001**: Managers can redistribute hours across months (e.g., April 140h + May 180h = 320h total). Salary remains the same for both months.

**REQ-QUOTA-002**: The system shall validate that redistributed totals equal the original standard total. If the total is less than the original, the system shall warn and raise an informational flag for HR visibility — but allow it if the manager explicitly acknowledges the reduction.

**REQ-QUOTA-003**: If termination occurs during active redistribution, final settlement uses STANDARD hours (not redistributed) for the plan period.

### 15. Holiday Calendar Management

**REQ-HOL-001**: Each team/region shall have its own holiday calendar managed by admin (or roles with RBAC permission).

**REQ-HOL-002**: Japan national holidays shall be seeded as defaults, editable by admin. 振替休日 (substitute holidays) shall be handled automatically.

**REQ-HOL-003**: Nepal holidays shall be manually managed by admin each year (Dashain, Tihar, Shivaratri, Teej, and others as needed).

**REQ-HOL-004**: Holidays shall reduce required hour calculations for the affected period.

### 16. Onboarding & Offboarding

**REQ-OB-001**: Admin onboarding shall create: employee record, employment type, initial salary history entry, policy group assignment, manager assignment, Slack ID mapping, and team/region assignment (Japan/Nepal).

**REQ-OB-002**: Offboarding shall show settlement preview (pro-rata salary, deductions, leave handling per employment type) before confirmation, then set status to INACTIVE. Admin can add a free-text exit note (knowledge transfer status, return of materials, etc.). Settlement preview shall include notice period buyout option: per contract Article 2.3, either party may pay one month's service fee in lieu of the 30-day notice period, payable within 7 days of termination. Final pro-rata payment is due by the 15th of the month following termination.

**REQ-OB-003**: Inactive employees cannot use any system features. All historical data is preserved.

**REQ-OB-004**: The system shall track post-termination dates: confidentiality obligation expiry (2 years post-exit) and non-compete expiry (12 months post-exit). Admin can efficiently query all former employees with active legal obligations via a dedicated index. This is a searchable date-based view — no automated enforcement.

**REQ-OB-008**: Offboarding shall record the termination type: WITHOUT_CAUSE (30-day notice or buyout), FOR_CAUSE (7-day notice with cure period per contract Article 2.4), MUTUAL, or RESIGNATION. For FOR_CAUSE terminations, the system shall track the cure period expiry date to document that the contractual good-faith requirement was met before termination.

**REQ-OB-005**: Employees shall be able to upload personal documents (contracts, certificates, ID copies) to S3 storage at any time. Upload is not compulsory. Documents are viewable by the employee and admin. File types: PDF, images. Storage is part of AWS free tier (5GB S3).

**REQ-OB-006**: Identity documents (citizenship, PAN) shall have a verification status tracked by admin: PENDING, VERIFIED, or REJECTED, with an audit trail of who verified and when (per contract Article 4.11).

**REQ-OB-007**: For each salary change, admin shall optionally link a signed agreement document (PDF uploaded to S3) to the salary history entry, tracking the bilateral agreement required by HR policy.

### 17. Probation

**REQ-PROB-001**: Probation duration shall be configurable via cascading policy (company default: 3 months, overridable per group or employee).

**REQ-PROB-002**: During probation: shorter notice period, configurable leave accrual rules, performance review trigger at end of probation.

**REQ-PROB-003**: The system shall send a probation expiry alert to the manager 14 days before an employee's probation end date, prompting the mandatory performance review (per contract Article 3.7).

### 18. Audit & Logging

**REQ-AUDIT-001**: Every data mutation shall be logged in an append-only audit log with: timestamp, actor_id, source (slack/web/system/admin), action, before/after values.

**REQ-AUDIT-002**: Admins shall be able to view the full audit trail for any employee.

**REQ-AUDIT-003**: When attendance is edited via web after initial Slack entry, both records shall be preserved with edit reason.

**REQ-AUDIT-004**: All user activity data (reports, attendance edits, leave requests) shall be stored append-only to support future LLM analysis.

### 19. Infrastructure & DevOps

**REQ-INFRA-001**: The project shall be a monorepo with npm workspaces containing: api, web, slack, core, data, types, infra packages. The `data` package contains all repository adapter implementations (DynamoDB, S3, SES, Cognito) shared by both `api` and `slack`.

**REQ-INFRA-002**: GitHub Actions CI/CD shall run on every PR: lint, typecheck, and all tests. Deployment shall be automated: `develop` branch → dev environment, `main` branch → prod environment.

**REQ-INFRA-003**: Infrastructure shall use AWS free tier targeting ~$0-5/month for up to 20 users. Services: Lambda, API Gateway, DynamoDB (or RDS Postgres free tier), S3 (static hosting + document storage), CloudFront, SQS, Cognito, SES (email: 62K/month free via Lambda).

**REQ-INFRA-004**: All code shall be TypeScript with strict mode enabled.

**REQ-INFRA-005**: Development shall follow TDD — tests written before implementation.

**REQ-INFRA-006**: The system shall support two environments: dev (from `develop` branch) and prod (from `main` branch) with separate AWS resources.

**REQ-INFRA-007**: Infrastructure shall be defined as code using AWS CDK or SAM.

### 20. Cron Jobs / Scheduled Tasks

**REQ-CRON-001**: Daily (23:55 JST): Check unclosed sessions, generate daily shortfall flags for both teams.

**REQ-CRON-002**: Weekly (Monday 00:15 JST): Weekly shortfall summary.

**REQ-CRON-003**: Monthly (1st 00:30 JST): Monthly summary, payroll calculation, surplus expiry, leave accrual.

**REQ-CRON-004**: Every 4 hours: Reminder for pending leave requests >24h old.

**REQ-CRON-005**: Daily report reminders at configurable times per team/group.

**REQ-CRON-006**: Payment deadline alert: send reminder to admin at a configurable number of days before each team's payment deadline (follows cascading policy for deadline dates).

**REQ-CRON-007**: Scheduled salary statement emails: auto-send salary statements to employees based on configured schedule (cascading: company → group → employee).

### 21. Scalability

**REQ-SCALE-001**: The system architecture shall support growth from 15-20 users to 100+ users without architectural changes.

**REQ-SCALE-002**: New employment types, roles, policy groups, and teams shall be addable without code changes — only configuration/data changes.

**REQ-SCALE-003**: The database schema shall support adding new regions/countries beyond Japan and Nepal without schema migrations.

### 22. Brand & Theme

**Scope**: The web application shall visually match the WillDesign corporate website (willdesign-tech.com) brand identity, ensuring a consistent professional experience.

**REQ-THEME-001**: The web application shall use the WillDesign brand color palette:
- Primary: `#000000` (black — text, buttons, headings)
- Accent: `#58C2D9` / `#58C3D0` (cyan/teal — highlights, active states, links)
- Accent gradient: `linear-gradient(0deg, #58C2D9 24%, #6DD9EC 93%)` (feature highlights, banners)
- Secondary accents: `#40DEC5` (turquoise), `#73A5DC` (periwinkle), `#8C89E8` (lavender) — for data visualization, charts, status indicators
- Hover/interactive: `#4BB8DF` (sky blue), `#E2498A` (pink/magenta) — for hover states, notifications, alerts
- Background: `#FFFFFF` (white — primary background)
- Neutral grays: `#32373C` (dark gray — secondary text), `#888888` (medium gray — muted text), `#DDDDDD` (borders), `#D9D9D9` (shadows/dividers)

**REQ-THEME-002**: The web application shall use the WillDesign brand typography:
- Primary font: "Silom", sans-serif for navigation and headings
- Body font: system sans-serif stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`)
- Bold emphasis throughout headings (`font-weight: bold`)

**REQ-THEME-003**: The web application shall display the WillDesign logo (`will-design-logo.png`) in the header/sidebar navigation. The logo shall link to the dashboard.

**REQ-THEME-004**: The web application shall follow the WillDesign aesthetic: light, modern, minimalist design with high contrast (black/white) paired with cyan/teal highlights. Clean layout emphasizing whitespace and typography. Smooth transitions and hover animations.

**REQ-THEME-005**: The web application shall implement CSS custom properties (design tokens) for all brand values so the theme is centrally configurable:
```
--wd-color-primary: #000000;
--wd-color-accent: #58C2D9;
--wd-color-accent-gradient: linear-gradient(0deg, #58C2D9 24%, #6DD9EC 93%);
--wd-color-background: #FFFFFF;
--wd-color-text: #000000;
--wd-color-text-muted: #888888;
--wd-color-border: #DDDDDD;
--wd-color-success: #40DEC5;
--wd-color-info: #73A5DC;
--wd-color-warning: #E2498A;
--wd-color-hover: #4BB8DF;
--wd-font-heading: "Silom", sans-serif;
--wd-font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

**REQ-THEME-006**: The design shall be responsive with mobile-first breakpoints:
- Mobile (< 640px): single-column layout, bottom navigation bar, touch-friendly tap targets (min 44px), swipe gestures for attendance actions
- Tablet (640px - 1024px): collapsible sidebar, two-column layouts where appropriate
- Desktop (> 1024px): full sidebar + content area

**REQ-THEME-007**: The web application shall be a Progressive Web App (PWA) installable on mobile devices (Android and iOS):
- Service worker for offline caching of static assets, i18n files, and last-known dashboard state
- Web app manifest with WillDesign branding (name, icons, theme color #58C2D9, background #FFFFFF)
- "Add to Home Screen" prompt support
- Push notification capability (for leave approval notifications, flag alerts, report reminders)
- Offline indicator: show cached dashboard data with "last updated" timestamp when offline; queue attendance clock-in/out actions and sync when back online

**REQ-THEME-008**: The mobile PWA experience shall prioritize these employee workflows:
- Quick clock-in/out with one-tap button on dashboard (alternative to Slack for mobile users)
- View today's hours, weekly/monthly progress at a glance
- Submit leave requests with date picker optimized for touch
- View leave balance and upcoming approved leave
- Receive push notifications for: leave approval/rejection, flag warnings, report reminders, salary statement availability

**REQ-THEME-009**: The mobile PWA manager experience shall support:
- Approve/reject leave requests with swipe or one-tap actions
- View team attendance status in real-time
- Resolve shortfall flags with quick-action buttons
- Receive push notifications for: new leave requests, pending flags, daily report submissions from team
