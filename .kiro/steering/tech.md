# Technical Context — HR Attendance App

## Stack
| Layer | Technology | Reason |
|-------|-----------|--------|
| **Runtime** | Node.js 20+ (TypeScript) | Team expertise, Lambda support |
| **Frontend** | React 19 + Vite 8 + styled-components | Fast builds, CSS-in-JS theming |
| **Backend** | AWS Lambda + API Gateway | Free tier: 1M requests/month |
| **Database** | DynamoDB (or RDS Postgres free tier) | 25GB free, single-table design |
| **Auth** | AWS Cognito | 50K MAU free |
| **Static Hosting** | S3 + CloudFront | Free tier CDN |
| **Queue** | SQS | Slack async processing |
| **Scheduler** | EventBridge | Cron jobs (daily/weekly/monthly triggers) |
| **i18n** | react-i18next | Multi-language UI (en, ja, ne) |
| **CI/CD** | GitHub Actions | Monorepo build + deploy |
| **IaC** | AWS CDK (TypeScript) | Infrastructure as code |
| **Testing** | Vitest 4 + Testing Library | TDD, jsdom for web |
| **Styling** | styled-components 6 | Theme object + primitives, no CSS files |
| **PWA** | vite-plugin-pwa + Workbox | Installable, offline, push |

## Monorepo Structure
```
hr-attendance-app/
├── packages/
│   ├── api/           # Lambda handlers (REST API)
│   ├── web/           # React frontend (S3 + CloudFront)
│   ├── slack/         # Slack event handler (Lambda + SQS)
│   ├── core/          # Shared business logic (policy engine, calculations, permissions)
│   └── types/         # Shared TypeScript types
├── policies/          # Static policy cascade files
│   ├── org.json       # Company-wide defaults (includes JP labor law seed data)
│   ├── groups/        # Per-group overrides (full-time-jp, contractor-np, intern, sales, etc.)
│   └── users/         # Per-employee overrides (sparse)
├── infra/             # AWS CDK/SAM templates
├── .github/workflows/ # CI/CD pipelines
└── package.json       # Workspace root (npm workspaces)
```

## Environments
| Environment | Purpose | Branch | URL Pattern |
|-------------|---------|--------|-------------|
| **dev** | Development/testing | `develop` | `dev-hr.example.com` |
| **prod** | Production | `main` | `hr.example.com` |

## Slack 3-Second Constraint
```
Slack Event → API Gateway → Lambda 1 (ack <200ms, enqueue SQS)
                                    ↓
                              SQS → Lambda 2 (process, reply via Slack API)
```
Both attendance messages and daily report messages follow this async pattern.

## Multi-Region / Multi-Timezone
- **Timestamps**: All stored in UTC. Displayed in user's local timezone.
- **Japan team**: JST (UTC+9)
- **Nepal team**: NPT (UTC+5:45)
- **"Today"/"This week"**: Calculated per user's configured timezone
- **Cron jobs**: Run in JST (primary business timezone), handle NPT offset for Nepal team

## Currency
- **Japan team**: JPY (Japanese Yen)
- **Nepal team**: NPR (Nepalese Rupees)
- **JPY expense tracking**: Admin can record JPY equivalent + exchange rate for Nepal payments (for accounting)
- **No auto-conversion**: Rates are manually input per payment

## Key Constraints
- AWS free tier only (no paid services beyond ~$5/month)
- Must handle Slack's 3-second timeout via async SQS pattern
- Two legal frameworks: Japanese labor law (労働基準法) for JP team, Nepal Contract Act 2056 for NP team
- Social insurance / tax withholding handled externally (phase 1); system tracks hours + amounts only
- No AI/Claude on backend in v1 — only pattern matching for JIRA/GitHub references
- Append-only audit logs for all user activity (future LLM analysis ready)
- TDD: tests written before implementation
- Single-tenant: HR Attendance App only

## Architecture Pattern: Handler → Service → Repository
- **Handlers** (`packages/api/src/handlers/`) — HTTP concerns only: parse auth, extract typed params, delegate to service, return response
- **Services** (`packages/core/src/*/service.ts`) — Business logic: validation, calculations, audit logging, orchestration
- **Repositories** (`packages/data/src/dynamo/`) — Data access: DynamoDB reads/writes, key construction
- **Handlers NEVER call repositories directly** — always go through a service
- Services: EmployeeService, AttendanceService (with lock enforcement), LeaveService, PayrollService, FlagQueryService, BankService, ReportService, AuditService, OnboardingService, OffboardingService, HolidayService, CronService, ReminderService
- Permission enforcement: `hasPermission(auth, Permissions.X)` — granular permission checks replace `hasMinimumRole`. Permissions defined in `packages/types/src/permissions.ts`, mapped cumulatively per role via `ROLE_PERMISSIONS`
- Attendance locking: `AttendanceService.processEvent` checks locks (employee → group → company scope) before processing. Admin locks/unlocks via `POST/DELETE /api/attendance/lock` gated by `Permissions.ATTENDANCE_LOCK`

## Shared API Contract
- **`packages/types/src/api-routes.ts`** — Single source of truth for all API endpoints, typed request/response bodies, query params, and frontend routes
- Route constants (e.g., `API_ATTENDANCE_EVENTS`) used by both backend handlers (route registration) and frontend hooks (API calls)
- Typed bodies (e.g., `ClockActionBody`, `CreateLeaveBody`) shared between handler `body as ClockActionBody` and hook mutation inputs
- Typed query params (e.g., `AttendanceEventsQueryParams`) used by handlers: `const query = queryParams as unknown as AttendanceEventsQueryParams`
- URL helpers: `apiPath(API_PAYROLL, { yearMonth })`, `withQuery(API_REPORTS, { date })`
- Frontend routes: `ROUTES.DASHBOARD`, `ROUTES.LOGIN`
- Error codes: `ErrorCodes.UNAUTHORIZED`, `ErrorCodes.NOT_FOUND`, etc.

## Local Development
- `npm run dev` — starts DynamoDB Local (Docker) + API dev server (Express, port 3001) + Vite (port 5173)
- Vite proxy forwards `/api` → `http://localhost:3001`
- Dev auth: POST `/api/dev-auth/login` returns base64 mock token; no Cognito needed locally
- `scripts/setup-local.ts` — creates DynamoDB table + seeds 4 employees, salaries, leave balances
- `docker-compose.yml` — DynamoDB Local on port 8000

## Shared Date Utilities
- **`packages/types/src/date-utils.ts`** — Single source of truth for ALL date operations across ALL packages
- **Never use inline date operations** — no `new Date()`, `Date.now()`, `.toISOString()`, `.slice(0,10)`, `.getFullYear()`
- Clock functions (mockable): `nowIso()`, `nowMs()`, `todayDate()`, `currentYear()`
- Conversion: `isoToDateStr()`, `isoToYearMonth()`, `dateToIso()`, `dateToDateStr()`, `yearFromDate()`
- Math: `daysInMonth()`, `addDays()`, `addMonths()`, `addYears()`
- Formatting: `formatYearMonth()`
- IDs: `timestampId()` (replaces `String(Date.now())`)
- Frontend display: `packages/web/src/utils/date.ts` (formatDate, formatDateTime, formatRelative)
- Frontend currency: `packages/web/src/utils/currency.ts` (formatAmount)

## Frontend Coding Rules
- **styled-components only** — no CSS files. `theme.ts` for tokens, `components/ui/` for shared primitives
- **UI primitives** �� import from `components/ui/` (Modal, DataTable, Tabs, Calendar, FormWizard, Badge, Toast, ProgressBar, EmptyState, Skeleton). `theme/primitives.ts` is deprecated and re-exports from `components/ui/`
- **Form validation** — use `react-hook-form` + `@hookform/resolvers/zod` for all forms. Define Zod schemas per form/step. Never use manual useState for form validation
- **Calendar views** — use `react-day-picker` v9 with styled-component wrappers. Never build custom calendar grids
- **Data tables** — use `@tanstack/react-table` v8 via the `DataTable` primitive for all sortable/filterable lists
- **Toast notifications** — use `useToast()` hook from `ToastProvider` for mutation success/error feedback. Never use `alert()` or `window.confirm()`
- **Never display raw ISO strings** — use `utils/date.ts` (formatDate, formatDateTime, formatRelative)
- **Form inputs**: `localDateToIso()` before API calls, `isoToLocalDate()` for pre-fill from API
- **All user-facing text via i18n** — `t("section.key")`, never hardcoded strings in JSX
- **Lazy-load pages** — `React.lazy()` + `Suspense` in App.tsx for code splitting
- **No magic strings/numbers** — use constants from `@hr-attendance-app/types`
- **React Query hooks** — all API calls go through `packages/web/src/hooks/queries/`, using `useApiClient()` + centralized `queryKeys`
- **DynamoDB keys** — use `KeyPatterns` and `KeyPrefixes` from `@hr-attendance-app/types`, never inline template literals

## App.tsx Provider Hierarchy
Providers must be nested in this exact order (outermost → innermost):
1. `ThemeProvider` (styled-components with theme object)
2. `GlobalStyle` (CSS reset + CSS custom properties)
3. `ToastProvider` (toast state context + toast container portal)
4. `QueryClientProvider` (React Query, staleTime 30s, retry 1)
5. `AuthProvider` (JWT in memory, login/logout, permission lookup)
6. `BrowserRouter` (React Router v7)
