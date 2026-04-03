# Gap Analysis — Frontend Redesign

## 1. Current State Investigation

### Existing Assets Inventory

**Theme & Primitives (Reusable)**
- `theme.ts` — Complete token system: colors (14 tokens), fonts (3), spacing (6), radii (3), breakpoints (2), transitions, sidebar/header dimensions
- `primitives.ts` — 9 primitives: Card, Button (4 variants), SectionTitle, TextMuted, FormField, PageLayout, FormLayout
- `GlobalStyle.ts` — CSS reset, base typography, link styles
- `styled.d.ts` — Theme type augmentation

**Layout Shell (Reusable)**
- `Layout.tsx` — Fully responsive: sidebar (desktop), collapsed sidebar (tablet), bottom nav + hamburger (mobile). Nav items filtered by `requiredPermission`. Logo, overlay, menu toggle — all complete.

**Query Infrastructure (Reusable)**
- `apiClient.ts` — Fetch wrapper with JWT auth, 5 HTTP methods (get/post/patch/put/delete)
- `useApiClient.ts` — Memoized hook binding token
- `keys.ts` — Structured query key factory for 11 domains
- 10 query hook files covering: attendance, leave, payroll, reports, team, employee, holidays, flags, admin, attendance-lock

**Auth System (Reusable)**
- `useAuth.ts` — AuthProvider + context with token in memory, login/logout, permission lookup from ROLE_PERMISSIONS
- `useRole.ts` — `useHasPermission()`, `useIsManager()`, `useIsAdmin()`, role level helpers
- `AuthGuard.tsx` + `RoleGuard.tsx` — Route protection components

**Utils (Reusable)**
- `date.ts` — 9 formatting functions + 3 input converters + 3 output converters + locale map
- `currency.ts` — `formatAmount()` with Intl.NumberFormat

**i18n (Extend)**
- `en.json` — ~80 keys across 10 sections
- `ja.json`, `ne.json` — Same structure (translations exist)

### Existing Page Completeness

| Page | Status | What Exists | What's Missing |
|------|--------|-------------|----------------|
| Dashboard | 80% | Clock widget, stats grid, leave balance | Real hours calculation, pending actions, quick actions, running timer |
| Attendance | 85% | Clock widget, event history, date picker | Monthly calendar view, editing capability, lock indicators, session details |
| Leave | 95% | Balance, request form, my requests, pending approvals | Team calendar, Japan-specific leave types, mandatory 5-day tracking, reject reason |
| Reports | 95% | Submit form, history list | JIRA/GitHub link rendering, version history, date filter |
| Payroll | 100% | Month picker, breakdown table | More detailed line items (blending, per-allowance, JPY equivalent) |
| Team | 70% | Member list, flag count | Clock status, approval queue, team calendar, report viewer, detail view |
| Admin | 60% | Tab navigation, lock tab (company scope) | Onboard form, offboard form, policy builder, role editor, holiday calendar, group/employee locks |
| Settings | 80% | Language selector | Profile display, notifications, timezone |
| Login | 100% | Dev auth flow | — |

### Conventions Observed

- **Naming**: PascalCase components, camelCase hooks/utils, kebab-case file names for types
- **Dependency direction**: Page → hooks/queries → apiClient → API; Page → theme/primitives
- **Query pattern**: `useX()` returns `{ data, isLoading, error }`, mutations use `useMutation` with query invalidation
- **i18n**: `t("section.key")` everywhere, no hardcoded strings in components
- **Styled components**: Co-located in same file as component, prefixed with semantic names
- **Lazy loading**: All pages via `React.lazy()` in App.tsx

---

## 2. Requirements-to-Asset Map

### Req 1: Configurable Design System
| Need | Status | Asset |
|------|--------|-------|
| Theme tokens | ✅ Exists | `theme.ts` — needs expansion for new primitives |
| CSS custom properties | ⚠️ Partial | Referenced in product.md but not actually emitted by theme.ts |
| Primitives: Button, Card, FormField, PageLayout | ✅ Exists | `primitives.ts` |
| Primitives: Modal, DataTable, Tabs, Badge, Toast, DatePicker, MonthPicker, Avatar, EmptyState, Skeleton | ❌ Missing | Need to create |
| ui-ux-pro-max design intelligence | ❌ Missing | Skill installed, not yet applied |

### Req 2: Responsive Layout Shell
| Need | Status | Asset |
|------|--------|-------|
| 3 breakpoints (mobile/tablet/desktop) | ✅ Exists | `Layout.tsx`, `theme.ts` |
| Bottom nav (mobile) | ✅ Exists | `Layout.tsx` |
| Collapsible sidebar (tablet) | ✅ Exists | `Layout.tsx` |
| Full sidebar (desktop) | ✅ Exists | `Layout.tsx` |
| 44px touch targets | ✅ Exists | Button min-height 44px |
| Swipe-back navigation | ❌ Missing | Research Needed: React Router gesture support |

### Req 3: Admin — Onboarding
| Need | Status | Asset |
|------|--------|-------|
| Multi-step form component | ❌ Missing | No stepper/wizard primitive |
| `POST /api/onboard` endpoint | ✅ Exists | API route + `useOnboard()` mutation hook |
| Employment type dropdown | ❌ Missing | Types exist in `employee.ts`, no UI |
| Searchable employee selector | ❌ Missing | No autocomplete/combobox primitive |
| Form validation | ❌ Missing | No validation library or pattern |

### Req 4: Admin — Offboarding
| Need | Status | Asset |
|------|--------|-------|
| Settlement preview dialog | ❌ Missing | No Modal primitive |
| `POST /api/offboard/:id` endpoint | ✅ Exists | API route + `useOffboard()` mutation hook |
| Termination type selector | ❌ Missing | Types not yet defined in types package |
| Cure period date input | ❌ Missing | UI only |

### Req 5: Admin — Policy Builder
| Need | Status | Asset |
|------|--------|-------|
| Policy types | ✅ Exists | `policy.ts` — complete: EffectivePolicy, RawPolicy, all sub-policies |
| `PUT /api/policies/:groupName` | ✅ Exists | API route constant |
| Policy query hook | ❌ Missing | No `usePolicies()` hook |
| Cascade visualization | ❌ Missing | Complex UI, Research Needed |
| Grouped form sections (9 policy domains) | ❌ Missing | Needs Tabs + accordion primitives |

### Req 6: Admin — Holiday Calendar
| Need | Status | Asset |
|------|--------|-------|
| Holiday types | ✅ Exists | `holidays.ts` |
| `GET/POST/DELETE` endpoints | ✅ Exists | API routes defined |
| `useHolidays()` hook | ✅ Exists | Query hook ready |
| Create/delete mutation hooks | ❌ Missing | Only query exists, no mutations |
| Calendar grid component | ❌ Missing | Research Needed: build vs library |

### Req 7: Admin — Role/Permission Management
| Need | Status | Asset |
|------|--------|-------|
| Permission constants | ✅ Exists | `Permissions` object (11 permissions) |
| `ROLE_PERMISSIONS` map | ✅ Exists | Role → permission[] mapping |
| Role management API endpoint | ❌ Missing | No API route defined in api-routes.ts |
| Role editor UI | ❌ Missing | No grouped checkbox component |

### Req 8: Admin — Attendance Lock (Complete)
| Need | Status | Asset |
|------|--------|-------|
| Company-scope lock | ✅ Exists | `AttendanceLockTab.tsx` fully working |
| Lock API (all scopes) | ✅ Exists | API supports scope: COMPANY/GROUP/EMPLOYEE |
| Lock hooks | ✅ Exists | `useAttendanceLocks`, `useCreateLock`, `useDeleteLock` |
| Group-scope UI | ❌ Missing | Need group list + per-group lock toggles |
| Employee-scope UI | ❌ Missing | Need searchable employee list + per-employee lock toggles |
| Bulk lock | ❌ Missing | UI + batch API calls |
| Lock indicators on attendance page | ❌ Missing | Need to check lock status in attendance view |

### Req 9: Team Page — Manager Dashboard
| Need | Status | Asset |
|------|--------|-------|
| Team member list | ⚠️ Partial | Basic list exists, no clock status |
| `useTeamMembers()` | ✅ Exists | Returns Employee[] |
| Approval queue (leave) | ⚠️ Partial | `usePendingLeaveRequests()` exists |
| Approval queue (flags) | ⚠️ Partial | `useFlags()` exists, no filter by team |
| Approval queue (bank) | ❌ Missing | No `useBankRequests()` hook |
| Team calendar | ❌ Missing | Calendar component needed |
| Report viewer | ❌ Missing | Need reports query by employee |
| Employee detail view | ❌ Missing | New route/component |

### Req 10: Attendance History & Editing
| Need | Status | Asset |
|------|--------|-------|
| Attendance events query | ✅ Exists | `useAttendanceEvents(date)` |
| Event list display | ✅ Exists | Basic list in AttendancePage |
| Monthly calendar view | ❌ Missing | Calendar component needed |
| Edit form + mutation | ❌ Missing | No edit endpoint or hook |
| Audit trail display | ❌ Missing | Needs `useAudit()` hook |
| Lock status check | ❌ Missing | Need to query locks for display |
| Progress bars (hours) | ❌ Missing | No progress bar primitive |

### Req 11-12: Flags & Banking
| Need | Status | Asset |
|------|--------|-------|
| Flag types | ✅ Exists | `flags.ts` — Flag, FlagLevel, FlagResolution |
| `useFlags()` + `useResolveFlag()` | ✅ Exists | Query + mutation hooks |
| Bank types | ✅ Exists | `banking.ts` — BankEntry, BankApprovalStatus |
| Bank API routes | ✅ Exists | GET/POST `/api/bank`, POST `/api/bank/approve` |
| Bank hooks | ❌ Missing | No `useBank()`, `useBankApprove()` hooks |
| Flag detail view | ❌ Missing | UI component |
| Bank request/approval UI | ❌ Missing | UI component |

### Req 13: Payroll Breakdown
| Need | Status | Asset |
|------|--------|-------|
| PayrollBreakdown type | ✅ Exists | Complete with blending, allowances, exchange rate |
| `usePayroll()` hook | ✅ Exists | Returns PayrollBreakdown |
| Basic table | ✅ Exists | PayrollPage shows summary |
| Detailed line items | ❌ Missing | Per-allowance, blending viz, JPY equiv |

### Req 14: Settings Page
| Need | Status | Asset |
|------|--------|-------|
| Language selector | ✅ Exists | Working in SettingsPage |
| Profile display | ❌ Missing | Need `useCurrentUser()` integration |
| Notification toggles | ❌ Missing | No push notification infrastructure |

### Req 15: Audit Log
| Need | Status | Asset |
|------|--------|-------|
| AuditEntry type | ✅ Exists | `audit.ts` — complete type |
| `GET /api/audit/:targetId` | ✅ Exists | API route constant |
| Query key | ✅ Exists | `queryKeys.audit.byTarget()` |
| `useAudit()` hook | ❌ Missing | Need to create |
| Audit viewer UI | ❌ Missing | Filterable list + before/after diff |

### Req 16-18: i18n, Leave, Reports Enhancements
| Need | Status | Asset |
|------|--------|-------|
| i18n infrastructure | ✅ Exists | react-i18next, 3 locale files |
| New translation keys | ❌ Missing | ~200+ new keys needed for new features |
| Leave team calendar | ❌ Missing | Calendar component |
| Japan-specific leave types | ✅ Exists | LeaveType enum has BEREAVEMENT, MATERNITY, etc. |
| Report version history | ❌ Missing | DailyReport has `version` field, UI needed |

### Req 19-22: Dashboard, Documents, Probation, Quotas
| Need | Status | Asset |
|------|--------|-------|
| Dashboard running timer | ❌ Missing | Client-side timer component |
| Quick actions | ❌ Missing | UI component |
| Document upload (S3 pre-signed) | ❌ Missing | No API route, no hook, Research Needed |
| Probation badge | ❌ Missing | `Employee.probationEndDate` exists in type |
| Quota redistribution API | ❌ Missing | No API route defined |

---

## 3. Implementation Approach Options

### Option A: Incremental Extension (Extend Existing)
Modify existing pages and primitives in-place. Add new tabs/sections to current components.

**Scope:**
- Extend `primitives.ts` with Modal, DataTable, Tabs, Badge, Toast, etc.
- Extend `theme.ts` with CSS custom properties output
- Extend each existing page with missing functionality
- Add new tab content components inside AdminPage

**Trade-offs:**
- ✅ Minimal file creation, faster to start
- ✅ Reuses all existing hooks, queries, layout
- ❌ Existing pages will grow very large (AdminPage already has 6 tabs)
- ❌ Redesign requires modifying every existing component — high risk of regressions
- ❌ Hard to do a "fresh redesign" while extending old code

### Option B: Fresh Component Library + New Pages (Recommended)
Build a new design system layer on top of existing infrastructure, create new page components.

**Scope:**
- New `theme.ts` generated by ui-ux-pro-max (keeping WillDesign tokens as config)
- New `primitives.ts` with full component library (Modal, DataTable, Tabs, etc.)
- New page components replacing existing ones (reuse hooks/queries)
- Keep: apiClient, query hooks, auth, routing structure, i18n

**Trade-offs:**
- ✅ Clean slate for design — true "fresh redesign"
- ✅ Existing hooks/queries/utils fully reused (no backend changes)
- ✅ Can build new pages in parallel without breaking current ones
- ❌ More files to create (~30-40 new component files)
- ❌ Must migrate all i18n keys + add new ones

### Option C: Hybrid — New Design System, Incremental Page Replacement
Build the design system fresh, then replace pages one at a time.

**Scope:**
- Phase 1: New theme + primitives library (ui-ux-pro-max designed)
- Phase 2: Replace Layout shell with new design
- Phase 3: Build new pages incrementally (Admin first, then Team, then Employee pages)
- Old pages coexist with new pages during migration

**Trade-offs:**
- ✅ Lowest risk — can validate design system before committing to all pages
- ✅ Phased rollout allows feedback between phases
- ❌ Temporary inconsistency between old and new pages
- ❌ Longer total timeline

---

## 4. Effort & Risk Assessment

| Requirement | Effort | Risk | Justification |
|-------------|--------|------|---------------|
| Req 1: Design System | M (5 days) | Medium | New primitives + ui-ux-pro-max integration, but patterns are clear |
| Req 2: Responsive Layout | S (2 days) | Low | Existing layout is already responsive, needs refinement |
| Req 3: Onboarding Form | M (4 days) | Medium | Multi-step form, searchable selectors, validation — new patterns |
| Req 4: Offboarding | M (3 days) | Medium | Settlement preview requires backend calculation + Modal |
| Req 5: Policy Builder | L (8 days) | High | Complex nested form, cascade visualization, 9 policy domains |
| Req 6: Holiday Calendar | M (4 days) | Medium | Calendar grid component, CRUD operations |
| Req 7: Role Management | M (3 days) | Low | Straightforward CRUD, depends on API availability |
| Req 8: Attendance Lock | S (2 days) | Low | Extends existing working implementation |
| Req 9: Team Page | L (7 days) | Medium | Multiple sub-sections, approval workflows, calendar |
| Req 10: Attendance Edit | M (5 days) | Medium | Calendar view, edit forms, audit trail |
| Req 11: Flags UI | M (3 days) | Low | Types and hooks mostly exist |
| Req 12: Banking UI | M (3 days) | Low | Similar pattern to flags |
| Req 13: Payroll Detail | S (2 days) | Low | Extends existing page with more line items |
| Req 14: Settings | S (2 days) | Low | Profile display + notification toggles |
| Req 15: Audit Viewer | M (3 days) | Low | New hook + filterable list |
| Req 16: i18n Expansion | M (4 days) | Low | Mechanical but voluminous (~200+ keys × 3 langs) |
| Req 17: Leave Enhancements | S (3 days) | Low | Extends existing, well-structured page |
| Req 18: Reports Enhancements | S (2 days) | Low | Link rendering, version list |
| Req 19: Dashboard Redesign | M (4 days) | Low | UI redesign, timer, quick actions |
| Req 20: Documents | M (4 days) | High | S3 pre-signed URL flow, Research Needed |
| Req 21: Probation | S (1 day) | Low | Badge on existing employee data |
| Req 22: Quota Redistribution | M (3 days) | Medium | Depends on API availability |

**Total Estimated Effort: ~70-80 dev-days (L-XL)**

---

## 5. Missing Hooks & API Gaps

### Hooks to Create
| Hook | Endpoint | Purpose |
|------|----------|---------|
| `usePolicies(groupName)` | `GET /api/policies/:groupName` | Fetch resolved policy |
| `useUpdatePolicy()` | `PUT /api/policies/:groupName` | Update policy group |
| `useCreateHoliday()` | `POST /api/holidays` | Add holiday |
| `useDeleteHoliday()` | `DELETE /api/holidays/:region/:date` | Remove holiday |
| `useBank()` | `GET /api/bank` | Fetch bank entries |
| `useBankApprove()` | `POST /api/bank/approve` | Approve bank request |
| `useAudit(targetId)` | `GET /api/audit/:targetId` | Fetch audit trail |
| `useUpdateAttendance()` | TBD | Edit attendance event |

### API Gaps (Backend Routes Not Defined)
| Feature | Missing Endpoint | Impact |
|---------|-----------------|--------|
| Role CRUD | `GET/PUT /api/roles` | Req 7 blocked |
| Document upload | `POST /api/documents` | Req 20 blocked |
| Quota redistribution | `PUT /api/quotas` | Req 22 blocked |
| Attendance editing | `PATCH /api/attendance/events/:id` | Req 10 partially blocked |
| Employee detail (for managers) | Works via `GET /api/employees/:id` | Needs permission check |

---

## 6. Research Items for Design Phase

1. **Calendar component strategy**: Build custom styled-component calendar or adapt a headless library (e.g., react-day-picker)? Need responsive grid + event overlay.
2. **S3 pre-signed URL upload flow**: How does the frontend request a pre-signed URL? New API endpoint needed?
3. **Real-time clock status**: Polling vs WebSocket for team member live status?
4. **Push notifications**: Service worker + web push API integration with backend?
5. **Swipe gestures**: React Router v7 swipe-back support on mobile?
6. **Form validation pattern**: Zod + react-hook-form vs custom validation? Need consistent approach across all forms.

---

## 7. Recommendations for Design Phase

**Preferred Approach: Option B (Fresh Component Library + New Pages)**
- Use `ui-ux-pro-max` to generate a complete design system with WillDesign tokens as configurable defaults
- Build the full primitives library first (Modal, DataTable, Tabs, etc.) — this unblocks all pages
- Replace pages incrementally starting with Admin (highest gap) → Team → Employee pages
- Reuse 100% of existing: apiClient, query hooks, auth system, routing, i18n infrastructure

**Key Decisions for Design:**
1. Form validation library choice (Zod + react-hook-form recommended — Zod already in codebase)
2. Calendar component approach (custom vs headless library)
3. API gaps — should missing endpoints be added to api-routes.ts and stubbed?
4. Phase sequencing — build all primitives first or build per-page?

**Critical Path:** Design System → Primitives Library → Admin Pages → Team Page → Employee Pages
