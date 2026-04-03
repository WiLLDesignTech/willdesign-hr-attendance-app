# Implementation Plan — Frontend Redesign

## Phase 1: Design System & Infrastructure

- [x] 1. Design system foundation and UI primitives library
- [x] 1.1 Generate fresh design system using ui-ux-pro-max design intelligence
  - Run ui-ux-pro-max skill to generate typography pairing, color harmony, spacing rhythm for an HR SaaS application
  - Update theme tokens with generated values while preserving WillDesign brand colors as configurable defaults
  - Emit CSS custom properties (`--wd-color-*`, `--wd-font-*`) in GlobalStyle for external widget consumption
  - Expand theme with new tokens: shadows, focus rings, overlay backdrop color, z-index scale
  - Validate all existing pages still render correctly with updated theme
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

- [x] 1.2 Create Toast primitive and ToastProvider context
  - Build toast notification component with auto-dismiss (4 seconds), manual close, and 4 variants (success, error, info, warning)
  - Create ToastProvider context wrapping the app (position 3 in provider hierarchy, after GlobalStyle, before QueryClientProvider)
  - Expose `useToast()` hook returning `{ show(message, variant) }`
  - Render toast container in fixed position top-right via portal
  - Wire ToastProvider into App.tsx provider chain
  - _Requirements: 1.5_

- [x] 1.3 (P) Build Modal primitive with focus trap and accessibility
  - Create overlay dialog with backdrop click-to-close and Escape key handling
  - Implement focus trap (tab cycling within modal when open)
  - Prevent body scroll when modal is open
  - Support 3 sizes (sm, md, lg) and render via createPortal
  - _Requirements: 1.5_

- [x] 1.4 (P) Build DataTable primitive with sorting, filtering, and pagination
  - Wrap TanStack Table (react-table v8) with styled-component cells
  - Support column sorting (click header: ascending → descending → none)
  - Add global search filter across all string columns
  - Implement pagination with page size selector (10/25/50)
  - Show Skeleton rows during loading state and EmptyState when no data
  - Support row click handler for navigation
  - _Requirements: 1.5_

- [x] 1.5 (P) Build Calendar primitive with event overlay support
  - Wrap react-day-picker v9 with styled-component month grid
  - Support date selection (single), month navigation, and custom day renderers for event overlays
  - Render events as colored dots/badges below date numbers using CalendarEvent variant colors
  - Make locale-aware using i18next language detection for month/day names
  - Responsive: full grid on desktop/tablet, compact list on mobile
  - _Requirements: 1.5_

- [x] 1.6 (P) Build FormWizard primitive with per-step Zod validation
  - Create multi-step form container using react-hook-form FormProvider
  - Each step defines a Zod schema; validate on "Next" click before advancing
  - Show progress indicator with step labels (completed/current/upcoming states)
  - Persist form data across steps (back button does not lose filled data)
  - Final step validates full combined schema before submit
  - _Requirements: 1.5_

- [x] 1.7 (P) Build remaining UI primitives: Tabs, Badge, ProgressBar, EmptyState, Skeleton, SearchInput
  - Tabs: horizontal tab bar with active indicator, onChange callback
  - Badge: inline colored pill with 4 semantic variants (info, success, warning, danger)
  - ProgressBar: horizontal fill bar with value/max props and percentage label
  - EmptyState: centered icon + message + optional action button
  - Skeleton: animated placeholder with text/circle/rect variants
  - SearchInput: debounced text input with search icon
  - _Requirements: 1.5_

- [x] 1.8 Migrate existing primitives and set up barrel exports
  - Move Card, Button variants, SectionTitle, TextMuted, FormField, PageLayout, FormLayout from `primitives.ts` to individual files in `components/ui/`
  - Create barrel `index.ts` in `components/ui/` exporting all primitives (old + new)
  - Update `theme/primitives.ts` to re-export from `components/ui/` with deprecation comment
  - Verify all existing page imports still resolve correctly
  - _Requirements: 1.5_

- [x] 1.9 Install new dependencies and update test render helper
  - Install react-hook-form, @hookform/resolvers, react-day-picker, @tanstack/react-table
  - Update `test/render.tsx` renderWithProviders to include ToastProvider
  - _Requirements: 1.5_

## Phase 2: Layout Shell Refinement

- [x] 2. Refine responsive layout shell
- [x] 2.1 Enhance Layout component for redesigned navigation
  - Update sidebar styling to match new design system tokens (shadows, typography, spacing)
  - Ensure bottom nav on mobile shows icon + label for top 5 navigation items
  - Verify collapsible sidebar on tablet transitions smoothly (icon-only when collapsed, full when expanded)
  - Confirm all interactive elements meet 44×44px minimum touch target on mobile
  - Test at 375px, 768px, 1024px, and 1440px widths — no horizontal overflow or content truncation
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

## Phase 3: New Query Hooks

- [x] 3. Create missing React Query hooks for new features
- [x] 3.1 (P) Create policy query and mutation hooks
  - Add `usePolicies(groupName)` query hook calling GET /api/policies/:groupName
  - Add `useUpdatePolicy()` mutation hook calling PUT /api/policies/:groupName
  - Register query keys in the existing queryKeys factory
  - Invalidate policy queries on successful mutation
  - _Requirements: 5.1, 5.4_

- [x] 3.2 (P) Create holiday mutation hooks
  - Add `useCreateHoliday()` mutation hook calling POST /api/holidays
  - Add `useDeleteHoliday()` mutation hook calling DELETE /api/holidays/:region/:date
  - Invalidate holiday queries on successful mutations
  - _Requirements: 6.3, 6.4_

- [x] 3.3 (P) Create bank query and approval hooks
  - Add `useBank(employeeId?)` query hook calling GET /api/bank
  - Add `useBankApprove()` mutation hook calling POST /api/bank/approve
  - Register bank query keys in the factory
  - _Requirements: 12.1, 12.5_

- [x] 3.4 (P) Create audit trail query hook
  - Add `useAudit(targetId)` query hook calling GET /api/audit/:targetId
  - Register audit query keys in the factory
  - _Requirements: 15.1_

- [x] 3.5 (P) Create roles query and mutation hooks
  - Add `useRoles()` query hook calling GET /api/roles
  - Add `useUpdateRole()` mutation hook calling PUT /api/roles/:name
  - Register role query keys in the factory
  - _Requirements: 7.1, 7.3_

- [x] 3.6 (P) Create document management hooks
  - Add `useDocuments(employeeId)` query hook calling GET /api/documents
  - Add `useUploadDocument()` mutation hook calling POST /api/documents/upload-url for pre-signed URL, then uploading to S3
  - Add `useVerifyDocument()` mutation hook calling PATCH /api/documents/:id
  - _Requirements: 20.1, 20.2, 20.3_

## Phase 4: Admin Core Pages

- [ ] 4. Build Admin section content components
  - Admin shell redesigned: sidebar nav (desktop) + card grid (mobile) — committed separately
- [ ] 4.1 Build admin onboarding section with multi-step form
  - Create 3-step onboarding wizard: Personal Info (name, email, slackId, language) → Employment (type, region, manager, join date) → Salary (amount, currency, salary type)
  - Employment type dropdown auto-suggests default policy group as read-only hint
  - Manager field: searchable combobox filtering active employees
  - On submit: call onboard mutation, show success toast with new employee summary
  - On validation error: highlight offending fields without losing filled data
  - Ensure form is fully usable on tablet (768px) and mobile (375px) with stacked single-column layout
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 4.2 Build admin offboarding tab with settlement preview
  - Create employee selector (searchable, active employees only)
  - On "Offboard" click: open modal with settlement preview showing pro-rata salary, unused leave handling, pending flag deductions, notice period buyout option, and net amount
  - Collect termination type (WITHOUT_CAUSE, FOR_CAUSE, MUTUAL, RESIGNATION), last working date, exit notes
  - Show cure period date input when termination type is FOR_CAUSE
  - On confirm: call offboard mutation, display success with post-termination tracking dates (confidentiality 2yr, non-compete 12mo)
  - Cancel returns to form without state change
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 4.3 Build admin policy builder tab
  - Left panel: list of all policy groups with names
  - Right panel: resolved effective policy with cascade visualization (stacked cards: company → group → employee, changed values highlighted with source badge)
  - 9 tabbed sections for policy domains: Hours, Leave, Overtime, Compensation, Probation, Flags, Payment, Report, Salary Statement
  - Edit mode: form fields for the selected group level only
  - On save: call update policy mutation, refresh resolved view, show success toast
  - Display warning with affected employee count if policy change conflicts with existing configurations
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 4.4 (P) Build admin holiday calendar tab
  - Region filter tabs (JP / NP) switching displayed holidays
  - Calendar grid with holiday markers: blue dots for seeded (Japan national), green dots for custom
  - "Add Holiday" button opens modal form: date picker, name (en), name (ja, optional), region, substitute holiday toggle
  - Delete: confirmation modal before calling delete holiday mutation
  - Responsive: calendar grid on desktop/tablet, scrollable list view on mobile
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 4.5 (P) Build admin roles and permissions tab
  - Role list showing all defined roles with permission count and user count badges
  - On role select: grouped permission picker (checkboxes organized by domain: attendance, leave, payroll, flags, bank, admin, reports, holidays)
  - Super Admin permissions shown as locked (non-toggleable checkboxes)
  - On toggle + save: update role permissions, show success toast
  - New role creation form: name, description, and grouped permission picker
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 4.6 Extend attendance lock tab with group and employee scopes
  - Add 3 scope tabs below month picker: Company | Group | Employee
  - Company tab: preserve existing single toggle functionality
  - Group tab: DataTable listing employment groups with lock/unlock toggle per row and lock status badge
  - Employee tab: searchable DataTable with lock/unlock toggle per row
  - "Lock All" button sends batch lock requests for all items in the current scope
  - Lock status uses Badge (green = unlocked, red = locked)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

## Phase 5: Team Page (Manager)

- [ ] 5. Build team page with manager dashboard
- [ ] 5.1 Build team overview with member grid and status
  - Card grid showing team members: name, avatar placeholder (CSS initials), employment type, region, current clock status badge (Idle/Working/Break), today's hours
  - Click member name navigates to an employee detail view with attendance history, hours summary, flag history, and bank balance
  - Responsive: card grid on desktop → stacked cards on tablet → compact list with expandable detail rows on mobile
  - _Requirements: 9.1, 9.6, 9.7_

- [ ] 5.2 Build unified approval queue
  - Single list showing pending items across all categories with type badge (Leave/Flag/Bank)
  - Leave approval: show request details (type, dates, reason, remaining balance), approve/reject buttons calling leave mutation
  - Flag resolution: show flag details (period, expected vs actual hours, deficit), resolution dropdown (NO_PENALTY, DEDUCT_FULL, USE_BANK, PARTIAL_BANK, DISCUSS), bank offset hours input for USE_BANK/PARTIAL_BANK with available balance preview
  - Bank approval: show surplus hours and period, approve button calling bank approve mutation
  - Remove item from queue on successful action
  - _Requirements: 9.2, 9.3, 11.3, 11.4, 11.5, 12.5_

- [ ] 5.3 (P) Build team leave calendar
  - Monthly calendar showing approved leave across direct reports
  - Each leave rendered as colored marker per employee
  - Employees see "name — on leave" only; managers see leave type details (PAID/UNPAID/etc.)
  - _Requirements: 9.4, 17.4_

- [ ] 5.4 (P) Build team reports viewer
  - Date picker + employee filter dropdown
  - Daily report list showing employee name, report text, JIRA/GitHub references as clickable links
  - References parsed from DailyReport.references array: JIRA IDs as project links, GitHub PRs as repo#number links
  - _Requirements: 9.5, 18.1, 18.3_

## Phase 6: Employee Experience Pages

- [ ] 6. Redesign employee dashboard
- [ ] 6.1 Redesign dashboard with clock widget, progress, and quick actions
  - Top section: large ClockWidget with status display (IDLE/CLOCKED_IN/ON_BREAK), prominent one-tap action button, elapsed time counter using client-side interval when clocked in
  - Stats row: 4 cards with ProgressBar — Today's Hours, Week Hours, Month Hours, Leave Balance
  - Quick Actions row: "New Leave Request", "View Reports", "View Payroll" (role-aware: managers see "Team" link)
  - Bottom section: upcoming holidays (next 3) and team members on leave today
  - All critical information visible without scrolling on 375px mobile viewport
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6_

- [ ] 7. Redesign attendance page with calendar and editing
- [ ] 7.1 Build attendance monthly calendar view
  - Monthly calendar with daily attendance summaries: hours worked shown as color intensity per cell
  - Day click opens detail panel showing all events in timeline format: timestamp, action icon, source badge (slack/web/admin), session duration
  - Warning badges on calendar: orange for unclosed sessions, red for short sessions (< 5 min)
  - Week/month hour totals with ProgressBar showing completion against policy requirements
  - _Requirements: 10.1, 10.2, 10.6, 10.7_

- [ ] 7.2 Build attendance event editing with audit trail
  - Edit button on each event opens modal with: timestamp picker, action type dropdown, work location selector, mandatory edit reason text field
  - On submit: preserve original record, create new version with source "web" and edit reason
  - Show audit trail below event: original vs edited values with actor and timestamp
  - While period is locked: disable edit controls, display lock indicator with "Period locked by admin" message
  - _Requirements: 10.3, 10.4, 10.5_

- [ ] 8. Enhance leave page with team calendar and Japan-specific features
- [ ] 8.1 Enhance leave request form and balance display
  - Leave type dropdown includes all configured types from LeaveType enum including Japan-specific: BEREAVEMENT, MATERNITY, NURSING, MENSTRUAL, COMPANY_SPECIFIC
  - Zero-balance warning: when selecting PAID with 0 remaining balance, show warning suggesting unpaid leave or shift permission
  - Balance breakdown: cards by type showing paid remaining, carry-over amount, carry-over expiry date
  - For Japan employees: mandatory 5-day annual leave tracking with ProgressBar and warning if behind schedule
  - Approval notification: show toast when request status changes (via polling)
  - _Requirements: 17.1, 17.2, 17.3, 17.5, 17.6_

- [ ] 8.2 (P) Add team leave calendar tab to leave page
  - Monthly calendar with leave markers per team member
  - Employees see "name — on leave"; managers see leave type details
  - Reuse Calendar primitive with CalendarEvent overlays
  - _Requirements: 17.4_

- [ ] 9. Build flag and shortfall management views
- [ ] 9.1 Build flags panel with grouped display
  - List flags grouped by level: Daily (info color), Weekly (warning color), Monthly (actionable, danger color)
  - Each flag displays: period, expected hours, actual hours, deficit, resolution status
  - Visual distinction between informational (daily/weekly) and actionable (monthly) using Badge variants and iconography
  - _Requirements: 11.1, 11.2, 11.6_

- [ ] 9.2 Build flag resolution dialog for managers
  - When manager views direct report's pending monthly flag: show resolution options dropdown (NO_PENALTY, DEDUCT_FULL, USE_BANK, PARTIAL_BANK, DISCUSS)
  - For USE_BANK/PARTIAL_BANK: show bank offset hours input with available banked hours and remaining deficit preview
  - On submit: call resolve flag mutation, show success toast
  - _Requirements: 11.3, 11.4, 11.5_

- [ ] 10. Build hours banking panel
- [ ] 10.1 Build bank balance view and request flow
  - Display: total approved banked hours, pending approval hours, expiry timeline (visual bar chart or timeline showing banked hours approaching 12-month expiry)
  - Bank entry list: period, surplus hours, status badge (pending/approved/used/expired), approval date, expiry date
  - "Request Banking" button: call bank mutation, show pending status
  - Pending entries display as "Awaiting manager approval" and hidden from available balance
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.6_

- [ ] 11. Redesign payroll breakdown page
- [ ] 11.1 Build detailed payroll breakdown with all line items
  - Month picker + structured breakdown card with individual line items:
  - Base salary, pro-rata adjustment (if non-zero), overtime (hours × rate), each allowance by name from allowances array, bonus (if > 0), commission (if > 0), deficit deduction (negative, danger color)
  - Blending section when blendingDetails is present: old rate × N days + new rate × M days = blended amount
  - Transfer fees (Nepal team), separator, bold Net Amount
  - JPY equivalent row when homeCurrencyEquivalent exists: exchange rate + date
  - All amounts via formatAmount, all dates via formatDate
  - Responsive: card layout on all breakpoints
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [ ] 12. Redesign reports page with references and versions
- [ ] 12.1 Enhance reports page with reference links and version history
  - Report form: free-text area with optional date override
  - Date filter for history navigation
  - Render JIRA references as clickable links, GitHub PRs as repo#number links from report references array
  - Show informational "No references found" badge when report has no references (not blocking)
  - Display version history when report version > 1: list all versions with timestamps and version numbers
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 13. Redesign settings page with profile and preferences
- [ ] 13.1 Build settings page with profile display and language selector
  - Profile section: read-only card showing name, email, employment type, region, team, manager name, probation status with end date
  - Language section: 3-option selector (en/ja/ne), calls i18next changeLanguage + persists to localStorage, immediate re-render
  - Notifications section: toggles for push and email notifications (stored locally, backend integration deferred)
  - Stacked cards layout on all breakpoints
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

## Phase 7: Supporting Features

- [ ] 14. Build audit log viewer for admin
- [ ] 14.1 Build audit trail panel with filtering
  - Chronological list of audit entries: timestamp (formatted via formatDateTime in viewer's local timezone), actor name, source badge (slack/web/system/admin), action description, before/after values
  - Filter controls: date range, action type, source
  - Paginated or infinite scroll for large datasets
  - Accessible from employee detail view "Audit" tab
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 15. Build document management panel
- [ ] 15.1 Build document upload and verification UI
  - Document list: name, type, upload date, verification status badge (for identity documents)
  - Upload: accept PDF and image files (max 5MB), request pre-signed URL from API, upload directly to S3, refresh list
  - Admin verification: Verify/Reject buttons with current status and audit trail (who verified, when)
  - Error handling: display error message with retry option without losing selected file
  - _Requirements: 20.1, 20.2, 20.3, 20.4_

- [ ] 16. Build probation tracking badges and alerts
- [ ] 16.1 Add probation indicators to team page and dashboard
  - Team page: probation badge on employees in probation showing days remaining
  - Manager dashboard: alert banner when any direct report's probation ends within 14 days
  - Employee settings page: show probation status and end date
  - _Requirements: 21.1, 21.2, 21.3_

- [ ] 17. Build quota redistribution editor for managers
- [ ] 17.1 Build monthly hours quota editor
  - Accessible from employee detail view "Quotas" section
  - Display standard monthly hours and any active redistribution
  - Allow adjusting individual month quotas with running total that must equal standard period total
  - Show warning requiring explicit acknowledgment when redistributed total is less than standard
  - On save: display updated monthly targets and flagged reduction acknowledgment
  - _Requirements: 22.1, 22.2, 22.3, 22.4_

## Phase 8: Internationalization

- [ ] 18. Expand i18n translation keys for all new features
- [ ] 18.1 (P) Add translation keys for admin features
  - Add keys for onboarding form labels, offboarding form labels, settlement preview, policy editor, holiday calendar, role management, attendance lock scopes
  - Add keys in all 3 locale files: en.json, ja.json, ne.json
  - _Requirements: 16.1, 16.2, 16.3_

- [ ] 18.2 (P) Add translation keys for team and employee features
  - Add keys for team overview, approval queue, flags, banking, payroll breakdown line items, reports references, settings, documents, probation, quotas
  - Add keys in all 3 locale files
  - Verify language detection from employee profile with fallback to browser language then English
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

## Phase 9: Integration & Testing

- [ ] 19. Wire all new pages into routing and verify end-to-end
- [ ] 19.1 Update App.tsx routing and lazy imports
  - Add lazy imports for all new/redesigned page components
  - Verify RoleGuard permissions are correct for all protected routes
  - Ensure Suspense fallback renders LoadingSpinner or Skeleton
  - Test navigation between all pages at all 3 breakpoints
  - _Requirements: 2.1, 2.6_

- [ ] 19.2 Verify cross-cutting concerns
  - Confirm all pages use t() for user-facing text — no hardcoded strings
  - Confirm all dates display via formatDate/formatDateTime — no raw ISO strings
  - Confirm all monetary values display via formatAmount — no raw numbers
  - Confirm all form inputs use localDateToIso for API submission and isoToLocalDate for pre-fill
  - Confirm lock indicators appear on attendance pages when periods are locked
  - _Requirements: 16.1, 16.5, 10.5, 8.6_

- [ ] 20. Integration and E2E tests
- [ ] 20.1* Write unit tests for UI primitives
  - Modal: focus trap, escape-to-close, backdrop click
  - DataTable: sorting, filtering, pagination, empty state
  - Calendar: date selection, month navigation, event rendering
  - FormWizard: step navigation, per-step validation, back button data persistence
  - Toast: auto-dismiss timing, manual close, variant rendering
  - _Requirements: 1.5_

- [ ] 20.2* Write integration tests for critical flows
  - Admin onboarding: fill 3 steps → submit → verify API call → verify cache invalidation
  - Leave approval: render approval queue → approve → verify PATCH call
  - Attendance lock: switch scope → toggle lock → verify POST with correct scope/params
  - Policy editor: select group → modify field → save → verify PUT call
  - Flag resolution: select resolution → set bank offset → submit → verify PATCH
  - _Requirements: 3.4, 9.3, 8.7, 5.4, 11.5_

- [ ] 20.3* Write E2E tests for responsive behavior
  - Run critical paths at 375px, 768px, and 1440px viewports
  - Admin onboarding flow at all breakpoints
  - Manager approval flow at all breakpoints
  - Employee attendance view and edit at all breakpoints
  - Dashboard clock widget interaction at all breakpoints
  - _Requirements: 2.6, 3.6, 9.7, 19.6_
