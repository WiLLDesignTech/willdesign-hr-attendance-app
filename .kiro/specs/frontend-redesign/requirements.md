# Requirements — Frontend Redesign

## Project Description
Complete frontend redesign for HR attendance app. Fresh UI/UX redesign with configurable color system (WillDesign branding as default but swappable via config). Must be fully responsive (mobile 375px → tablet 768px → desktop 1440px). Covers 4 priority areas: (1) Admin Core — onboarding/offboarding forms, policy builder, holiday calendar, role/permission management; (2) Team Page for managers — real-time team status, approval queues for leave/flags/banking, team calendar, daily report viewer; (3) Employee Experience — full attendance history with editing, complete flag/banking UI, detailed payroll breakdown, settings page; (4) Attendance Lock completion — group-scope and employee-scope lock UI, bulk operations, lock status indicators. Uses React 19 + styled-components + React Query + i18n (en/ja/ne). Design system must use ui-ux-pro-max skill for professional design intelligence. All pages must connect to existing backend API endpoints defined in packages/types/src/api-routes.ts.

---

## EARS Requirements

### Requirement 1: Configurable Design System

**Objective:** As an admin, I want the app's visual identity to be configurable via a theme object, so that rebranding requires changing only design tokens — not component code.

#### Acceptance Criteria

1. The web application shall define all visual tokens (colors, typography, spacing, radii, shadows, breakpoints) in a single `theme.ts` object consumed by styled-components `ThemeProvider`.
2. The web application shall ship with WillDesign branding as the default theme (black primary, cyan/teal accent `#58C2D9`, white background, Silom headings).
3. When a deployer overrides color values in `packages/types/src/branding.ts` and `packages/web/src/theme/theme.ts`, the web application shall render all components with the new palette without any component-level code changes.
4. The web application shall expose CSS custom properties (`--wd-color-*`, `--wd-font-*`) mirroring the theme object so third-party or embedded widgets can consume brand tokens.
5. The design system shall define reusable styled-component primitives: Button (primary, secondary, danger, ghost), Card, FormField, Modal, DataTable, Tabs, Badge, Toast, DatePicker, MonthPicker, Avatar, EmptyState, Skeleton, and PageLayout.
6. The web application shall use `ui-ux-pro-max` design intelligence for style selection, color harmony, typography pairing, spacing rhythm, and interaction patterns.

---

### Requirement 2: Responsive Layout Shell

**Objective:** As a user on any device, I want the interface to adapt seamlessly from mobile to desktop, so that I have a productive experience regardless of screen size.

#### Acceptance Criteria

1. The web application shall implement three responsive breakpoints: mobile (< 640px), tablet (640px–1024px), desktop (> 1024px).
2. While the viewport is below 640px, the web application shall display a bottom navigation bar with icon + label items, hide the sidebar, and use single-column content layouts.
3. While the viewport is between 640px and 1024px, the web application shall display a collapsible sidebar (icon-only when collapsed) and allow two-column layouts where appropriate.
4. While the viewport is above 1024px, the web application shall display a full sidebar with icon + label navigation and a spacious content area.
5. The web application shall ensure all interactive elements have a minimum touch target of 44×44px on mobile viewports.
6. The web application shall render correctly at 375px, 768px, 1024px, and 1440px widths without horizontal overflow or truncation of essential content.
7. When the user navigates on mobile, the web application shall support swipe-back gesture for page-level navigation where the platform supports it.

---

### Requirement 3: Admin — Employee Onboarding

**Objective:** As an admin, I want to onboard new employees via a multi-step form, so that all required records (employee, salary, policy group, Slack mapping) are created in one flow.

#### Acceptance Criteria

1. When an admin navigates to the Admin page and selects the "Onboard" tab, the web application shall display a multi-step onboarding form.
2. The onboarding form shall collect: full name, email, employment type (dropdown from configured types), region (JP/NP), language preference (en/ja/ne), manager (searchable employee selector), team/group, initial monthly/annual salary, currency (JPY/NPR), and Slack user ID.
3. When the admin selects an employment type, the web application shall auto-populate the default policy group for that type and display it as a read-only suggestion editable by the admin.
4. When the admin submits the onboarding form, the web application shall call `POST /api/onboard` and display a success confirmation with the new employee summary.
5. If the API returns a validation error, the web application shall highlight the offending fields and display the error message without losing filled data.
6. The onboarding form shall be fully usable on tablet (768px) and desktop — mobile (375px) shall use a vertically stacked single-column layout with the same fields.

---

### Requirement 4: Admin — Employee Offboarding

**Objective:** As an admin, I want to offboard employees with a settlement preview, so that final compensation is transparent before confirmation.

#### Acceptance Criteria

1. When an admin selects an active employee and clicks "Offboard", the web application shall display a settlement preview dialog.
2. The settlement preview shall show: pro-rata salary calculation, unused leave handling (forfeit or payout per employment type), pending flag deductions, notice period buyout option (one month's fee per contract Article 2.3), and final net amount.
3. The offboarding form shall collect: termination type (WITHOUT_CAUSE, FOR_CAUSE, MUTUAL, RESIGNATION), last working date, exit notes (free text), and notice period buyout toggle.
4. When the termination type is FOR_CAUSE, the web application shall display a cure period date input field.
5. When the admin confirms offboarding, the web application shall call `POST /api/offboard/:id` and display a confirmation with post-termination tracking dates (confidentiality expiry: 2 years, non-compete expiry: 12 months).
6. If the settlement preview differs from expected values, the admin shall be able to cancel and return to the employee record without any state change.

---

### Requirement 5: Admin — Policy Builder

**Objective:** As an admin, I want to create and edit HR policies via a visual builder, so that I can configure leave types, hour requirements, overtime rules, and compensation structures without code changes.

#### Acceptance Criteria

1. When an admin navigates to the Admin page and selects the "Policies" tab, the web application shall display a list of all policy groups with their current effective configuration.
2. When an admin selects a policy group, the web application shall display the resolved effective policy (company → group → employee cascade) with visual indicators showing which level each value comes from.
3. The policy editor shall provide form sections for: hours (daily/weekly/monthly minimums, work arrangement, time type, core hours), leave (accrual schedule, cap, carry-over, leave types), overtime (deemed hours, pay rates, 36 Agreement limits), compensation (salary type, bonus schedule, allowance types, commission), and probation (duration, leave rules, notice period).
4. When the admin saves a policy change, the web application shall call `PUT /api/policies/:groupName` and display the updated resolved policy.
5. The policy builder shall show a cascade visualization: a column or layered card view showing company defaults → group overrides → employee overrides, with changed values highlighted.
6. If a policy change conflicts with existing employee configurations, the web application shall display a warning with affected employee count before saving.

---

### Requirement 6: Admin — Holiday Calendar Management

**Objective:** As an admin, I want to manage regional holiday calendars, so that hour requirements and flag calculations account for holidays correctly.

#### Acceptance Criteria

1. When an admin navigates to the Admin page and selects the "Holidays" tab, the web application shall display a yearly calendar view with holidays marked, filterable by region (JP/NP).
2. When an admin clicks "Add Holiday", the web application shall display a form collecting: date, name (en), name (ja, optional), region, and substitute holiday toggle.
3. When an admin submits a new holiday, the web application shall call `POST /api/holidays` and refresh the calendar view.
4. When an admin clicks a holiday's delete button, the web application shall show a confirmation dialog and call `DELETE /api/holidays/:region/:date` on confirm.
5. The Japan holiday calendar shall display pre-seeded national holidays with a visual badge indicating "seeded" vs "custom" entries.
6. The holiday calendar shall be fully responsive: calendar grid on desktop/tablet, scrollable list on mobile.

---

### Requirement 7: Admin — Role & Permission Management

**Objective:** As an admin, I want to view and edit custom roles with granular permissions, so that I can control feature access without code changes.

#### Acceptance Criteria

1. When an admin navigates to the Admin page and selects the "Roles" tab, the web application shall display all defined roles with their permission count.
2. When an admin selects a role, the web application shall display a grouped permission picker (checkboxes organized by domain: attendance, leave, payroll, flags, bank, admin, reports, holidays).
3. When an admin toggles a permission and saves, the web application shall update the role's permission set and display a success confirmation.
4. The web application shall prevent removal of Super Admin permissions from the Super Admin role (display as locked/read-only).
5. When an admin creates a new custom role, the web application shall provide a name input, description field, and the same grouped permission picker.
6. The role management UI shall display the number of users assigned to each role.

---

### Requirement 8: Admin — Attendance Lock (Complete)

**Objective:** As an admin, I want to lock attendance at company, group, and employee scopes, so that payroll periods can be finalized with confidence.

#### Acceptance Criteria

1. When an admin navigates to the Admin page and selects the "Attendance Lock" tab, the web application shall display a month picker and three scope tabs: Company, Group, Employee.
2. When the "Company" scope is selected, the web application shall show a single lock/unlock toggle for the selected month (existing functionality).
3. When the "Group" scope is selected, the web application shall display a list of all employment groups with lock status (locked/unlocked) for the selected month, each with a lock/unlock toggle.
4. When the "Employee" scope is selected, the web application shall display a searchable employee list with lock status for the selected month, each with a lock/unlock toggle.
5. When an admin clicks "Lock All", the web application shall send bulk lock requests for all groups or all employees in the selected month.
6. While a period is locked for an employee, the web application shall display a lock indicator on that employee's attendance page and disable clock-in/out actions for the locked period.
7. The web application shall call `POST /api/attendance/lock` with the appropriate scope (company/group/employee) and identifiers.

---

### Requirement 9: Team Page — Manager Dashboard

**Objective:** As a manager, I want a comprehensive team overview, so that I can monitor attendance, handle approvals, and view reports for my direct reports.

#### Acceptance Criteria

1. When a manager navigates to the Team page, the web application shall display a team member grid/list showing: name, avatar, employment type, current clock status (idle/clocked-in/on-break), and today's hours.
2. The team page shall include an "Approvals" section showing pending items across all categories: leave requests, flag resolutions, and bank approval requests — each with approve/reject action buttons.
3. When a manager clicks a leave request in the approval queue, the web application shall display request details (type, dates, reason, employee's remaining balance) and call `PATCH /api/leave-requests/:id` on approve/reject.
4. The team page shall include a team calendar view showing approved leave across all direct reports, with employee names and leave type visible to the manager.
5. The team page shall include a "Reports" section showing daily report submissions from direct reports, filterable by date, with JIRA/GitHub references displayed as links.
6. When a manager clicks a team member's name, the web application shall navigate to a detail view showing that employee's attendance history, hours summary, flag history, and bank balance.
7. The team page shall be fully responsive: card grid on desktop, stacked cards on tablet, and a compact list view on mobile with expandable detail rows.

---

### Requirement 10: Employee — Attendance History & Editing

**Objective:** As an employee, I want to view my full attendance history and edit records when needed, so that I can correct mistakes with a transparent audit trail.

#### Acceptance Criteria

1. When an employee navigates to the Attendance page, the web application shall display a monthly calendar view with daily attendance summaries (clock-in/out times, total hours, breaks, work location).
2. When an employee clicks a specific day, the web application shall display a detail panel showing all events for that day: timestamps, durations, break periods, and source attribution (slack/web/admin).
3. When an employee clicks "Edit" on an attendance event, the web application shall display an edit form for: timestamp, action type, break duration, and work location, with a mandatory edit reason field.
4. When an employee submits an attendance edit, the web application shall preserve the original record and create a new version with source "web" and the edit reason in the audit trail.
5. While a period is locked, the web application shall disable edit controls and display a lock indicator with the message "Period locked by admin."
6. The attendance page shall display daily/weekly/monthly hour totals with progress bars showing completion against policy requirements.
7. If a day has an unclosed session or flagged short session (< 5 min), the web application shall display a warning badge on that day's calendar cell.

---

### Requirement 11: Employee — Flag & Shortfall Management

**Objective:** As an employee, I want to view my shortfall flags and understand their impact, so that I can take corrective action or request resolution.

#### Acceptance Criteria

1. When an employee navigates to a flags section (accessible from dashboard or attendance), the web application shall display a list of flags grouped by level: Daily (info), Weekly (warning), Monthly (actionable).
2. The web application shall display each flag with: period, expected hours, actual hours, deficit, and current resolution status.
3. While a flag has status PENDING and the user is a manager viewing a direct report's flag, the web application shall display resolution options: NO_PENALTY, DEDUCT_FULL, USE_BANK, PARTIAL_BANK, DISCUSS.
4. When a manager selects USE_BANK or PARTIAL_BANK resolution, the web application shall display a bank offset hours input showing available banked hours and a preview of the remaining deficit.
5. When a manager submits a flag resolution, the web application shall call `PATCH /api/flags/:id` with the resolution details.
6. The flag list shall visually distinguish between informational flags (daily/weekly) and actionable flags (monthly) using color and iconography from the design system.

---

### Requirement 12: Employee — Hours Banking & Surplus

**Objective:** As an employee, I want to view my banked surplus hours and request banking approval, so that I can use surplus to offset future deficits.

#### Acceptance Criteria

1. When an employee navigates to a bank section, the web application shall display: total approved banked hours, pending approval hours, and expiry timeline.
2. The web application shall display a list of bank entries showing: period, surplus hours, status (pending/approved/used/expired), approval date, and expiry date.
3. When an employee clicks "Request Banking" for a surplus period, the web application shall call `POST /api/bank` and show a pending status.
4. While a bank entry is in pending status, the web application shall display it as "Awaiting manager approval" and hide it from the available balance.
5. When a manager views the team page approval queue and approves a bank request, the web application shall call `POST /api/bank/approve` and update the entry status.
6. The web application shall display a visual timeline or bar chart showing banked hours approaching expiry (12-month default).

---

### Requirement 13: Employee — Payroll Breakdown

**Objective:** As an employee, I want a detailed payroll breakdown for each month, so that I can understand exactly how my compensation is calculated.

#### Acceptance Criteria

1. When an employee navigates to the Payroll page and selects a month, the web application shall call `GET /api/payroll/:yearMonth` and display a structured breakdown.
2. The payroll breakdown shall show line items for: base salary, pro-rata adjustment (if applicable), overtime pay (with hours × rate calculation), each allowance by name, bonus (if applicable), commission (if applicable), deficit deduction (hours × hourly rate), and net amount.
3. If a mid-month salary change occurred, the web application shall display the blending calculation: old rate × days + new rate × days = blended amount.
4. For Nepal team employees, the web application shall display: NPR amount, JPY equivalent, exchange rate, and transfer fees.
5. The payroll view shall be responsive: a card-based vertical breakdown on mobile, a table layout on desktop.
6. The web application shall use `formatAmount` from `utils/currency.ts` for all monetary values and `formatDate` from `utils/date.ts` for all dates — never displaying raw numbers or ISO strings.

---

### Requirement 14: Employee — Settings Page

**Objective:** As an employee, I want to manage my preferences, so that the app behavior matches my language and notification needs.

#### Acceptance Criteria

1. When an employee navigates to the Settings page, the web application shall display sections for: Language, Notifications, and Profile.
2. The language selector shall offer en (English), ja (日本語), and ne (नेपाली), and persist the selection via `i18next.changeLanguage()` and local storage.
3. When the user changes language, the web application shall immediately re-render all text in the selected language without a page reload.
4. The notifications section shall display toggles for: push notifications (leave approval, flag alerts, report reminders), and email notifications (salary statements).
5. The profile section shall display read-only employee information: name, email, employment type, region, team, manager, and probation status (with end date if applicable).
6. The settings page shall be fully responsive with stacked sections on mobile.

---

### Requirement 15: Audit Log Viewer (Admin)

**Objective:** As an admin, I want to view the audit trail for any employee, so that I can investigate and verify data changes.

#### Acceptance Criteria

1. When an admin navigates to an employee's detail view and selects the "Audit" tab, the web application shall call `GET /api/audit/:targetId` and display a chronological list of audit entries.
2. Each audit entry shall display: timestamp, actor name, source (slack/web/system/admin), action description, and before/after values where applicable.
3. The audit log viewer shall support filtering by: date range, action type, and source.
4. The audit log shall be paginated (or infinite scroll) to handle large datasets without performance degradation.
5. The web application shall use `formatDateTime` from `utils/date.ts` for all audit timestamps, displayed in the viewer's local timezone.

---

### Requirement 16: Internationalization (i18n)

**Objective:** As a user in Japan or Nepal, I want the entire interface in my preferred language, so that I can use the app productively.

#### Acceptance Criteria

1. The web application shall use `react-i18next` with `t("section.key")` calls for all user-facing text — no hardcoded strings in JSX.
2. The web application shall maintain translation files for en, ja, and ne in `packages/web/src/i18n/`.
3. When a new UI component or page is added, all user-facing strings shall have corresponding keys in all three translation files.
4. The web application shall detect the user's preferred language from their employee profile (API response) and fall back to browser language, then to English.
5. Date and number formatting shall respect the user's locale (e.g., `2026年4月4日` for ja, `April 4, 2026` for en).

---

### Requirement 17: Leave Management (Complete)

**Objective:** As an employee, I want a full leave management experience including all leave types, balance breakdown, and team calendar, so that I can plan and request time off effectively.

#### Acceptance Criteria

1. When an employee navigates to the Leave page, the web application shall display: leave balance breakdown by type (paid, unpaid, shift permission, and any configured types), recent requests with status, and a "New Request" button.
2. The leave request form shall include: leave type dropdown (from policy-configured types including Japan-specific types like 慶弔休暇, 産休・育休), start date, end date, and reason.
3. If the employee's paid leave balance is zero and they select paid leave, the web application shall display a warning suggesting unpaid leave or shift permission instead.
4. The Leave page shall include a team calendar tab showing approved leave across the team — employees see name + "on leave" only; managers see leave type details.
5. For Japan employees, the web application shall display mandatory 5-day annual leave usage tracking with a progress indicator and warning if behind schedule.
6. When a leave request is approved or rejected, the web application shall update the request status in real-time (or on next poll) and display a notification.

---

### Requirement 18: Reports Page (Enhanced)

**Objective:** As an employee, I want to submit and view daily reports with structured references, so that my work is properly tracked and linked to JIRA/GitHub.

#### Acceptance Criteria

1. When an employee navigates to the Reports page, the web application shall display a date-filterable list of submitted reports with JIRA/GitHub references shown as clickable links.
2. The report submission form shall accept: free-text report content and an optional date override (defaults to today).
3. When the user submits a report, the web application shall call `POST /api/reports` and display the parsed references (JIRA IDs, GitHub PRs) extracted by the backend.
4. If a report contains no JIRA or GitHub references, the web application shall display an informational warning (not blocking).
5. When a user views a previously submitted report, the web application shall show all versions (if edited via Slack) with timestamps and version numbers.

---

### Requirement 19: Dashboard (Redesigned)

**Objective:** As an employee, I want a glanceable dashboard showing my current status, progress, and pending actions, so that I have immediate awareness when I open the app.

#### Acceptance Criteria

1. When an employee navigates to the Dashboard, the web application shall display: clock-in/out widget (one-tap action), today's hours with progress bar, weekly hours summary, monthly hours summary, leave balance summary, and pending actions count (leave requests, flags).
2. The clock widget shall show current status (idle/clocked-in/on-break) with a large, prominent action button and elapsed time since last action.
3. The dashboard shall display a "Quick Actions" section with: New Leave Request, View Reports, View Payroll — customizable based on role.
4. While the user is clocked in, the web application shall display a running timer showing elapsed work time for the current session.
5. The dashboard shall display upcoming holidays (next 3) and any team members currently on leave (names only, visible to all; leave type visible to managers).
6. The dashboard shall be the primary mobile experience: all critical information visible without scrolling on a 375px viewport.

---

### Requirement 20: Document Management

**Objective:** As an employee, I want to upload and view my documents (contracts, certificates, ID copies), so that my records are complete and accessible.

#### Acceptance Criteria

1. When an employee navigates to their profile or a dedicated Documents section, the web application shall display a list of uploaded documents with: name, type, upload date, and verification status (for identity documents).
2. When an employee clicks "Upload", the web application shall accept PDF and image files (max 5MB), upload to S3 via pre-signed URL, and refresh the document list.
3. When an admin views an employee's documents, the web application shall display identity verification controls: Verify / Reject buttons with the current verification status and audit trail (who verified, when).
4. If a document upload fails, the web application shall display an error message with retry option without losing the selected file.

---

### Requirement 21: Probation Tracking

**Objective:** As a manager, I want visibility into my team's probation status, so that I can conduct timely performance reviews.

#### Acceptance Criteria

1. When a manager views the Team page, the web application shall display a probation badge on employees currently in probation, showing days remaining.
2. When an employee's probation end date is within 14 days, the web application shall display an alert banner on the manager's dashboard prompting the performance review.
3. The employee's profile/settings page shall display their probation status and end date (if applicable).

---

### Requirement 22: Quota Redistribution (Manager)

**Objective:** As a manager, I want to redistribute monthly hour quotas for my direct reports, so that I can accommodate project-based workload variations.

#### Acceptance Criteria

1. When a manager navigates to a direct report's detail view and selects "Quotas", the web application shall display the standard monthly hours and any active redistribution.
2. The quota editor shall allow adjusting individual month quotas while displaying a running total that must equal the standard annual/period total.
3. If the redistributed total is less than the standard, the web application shall display a warning requiring explicit manager acknowledgment before saving.
4. When a manager saves a redistribution, the web application shall display the updated monthly targets and flag the acknowledged reduction.
