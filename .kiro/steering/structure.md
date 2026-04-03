# Project Structure — WillDesign HR Platform

## Monorepo Layout
```
willdesign-hr/
├── packages/
│   ├── core/                    # Shared business logic (ZERO AWS deps)
│   │   ├── src/
│   │   │   ├── attendance/      # StateMachine, KeywordMatcher, Service, HoursCalculator
│   │   │   ├── leave/           # LeaveService, Accrual calculator
│   │   │   ├── payroll/         # PayrollCalculator (blending, pro-rata, deficit)
│   │   │   ├── flags/           # FlagService (generate, resolve, bank offset, quota)
│   │   │   ├── overtime/        # OvertimeCalculator (deemed, 36 Agreement)
│   │   │   ├── reports/         # ReportParser (JIRA/GitHub references)
│   │   │   ├── policies/        # PolicyResolver (3-level cascade), seed data (9 groups)
│   │   │   ├── permissions/     # RBAC (role→permission) + ABAC engine
│   │   │   ├── onboarding/      # OnboardingService, OffboardingService (settlement, legal)
│   │   │   ├── holidays/        # HolidayService, JP holiday generator (1980-2099)
│   │   │   ├── cron/            # CronService (daily/weekly/monthly), ReminderService
│   │   │   ├── repositories/    # Repository INTERFACES (ports) — no AWS deps
│   │   │   │   ├── employee.ts
│   │   │   │   ├── attendance.ts
│   │   │   │   ├── attendance-lock.ts
│   │   │   │   ├── leave.ts
│   │   │   │   ├── salary.ts
│   │   │   │   ├── report.ts
│   │   │   │   ├── flag.ts
│   │   │   │   ├── bank.ts
│   │   │   │   ├── audit.ts
│   │   │   │   ├── holiday.ts
│   │   │   │   ├── override.ts
│   │   │   │   ├── policy.ts
│   │   │   │   ├── role.ts
│   │   │   │   ├── document.ts
│   │   │   │   ├── monthly-summary.ts
│   │   │   │   ├── email-adapter.ts
│   │   │   │   └── auth-provider-adapter.ts
│   │   │   ├── policies/        # Policy engine
│   │   │   │   ├── resolver.ts  # cascadePolicy(company → group → user) pure function
│   │   │   │   ├── seed.ts      # Japanese labor law defaults, Nepal defaults
│   │   │   │   └── types.ts     # Policy interfaces
│   │   │   ├── calculator/      # Hours, overtime, payroll, pro-rata
│   │   │   │   ├── hours.ts     # Daily/weekly/monthly hour calculations
│   │   │   │   ├── overtime.ts  # Overtime tracking, deemed vs actual, 36 Agreement
│   │   │   │   ├── payroll.ts   # Salary resolution, deductions, pro-rata
│   │   │   │   └── leave.ts     # Leave accrual, balance, JP/NP logic
│   │   │   ├── permissions/     # RBAC + ABAC engine
│   │   │   │   ├── rbac.ts      # Role definitions, role hierarchy
│   │   │   │   ├── abac.ts      # Attribute-based rules (reporting chain, ownership)
│   │   │   │   └── types.ts     # Permission interfaces
│   │   │   ├── reports/         # Daily report parsing
│   │   │   │   ├── parser.ts    # Extract JIRA/GitHub references (regex, no AI)
│   │   │   │   └── types.ts
│   │   │   └── index.ts
│   │   ├── __tests__/           # Unit tests (TDD)
│   │   └── package.json
│   │
│   ├── data/                    # Repository IMPLEMENTATIONS (adapters) — AWS deps here
│   │   ├── src/
│   │   │   ├── dynamo/          # DynamoDB repository implementations
│   │   │   │   ├── client.ts    # Shared DynamoDBDocumentClient
│   │   │   │   ├── employee.ts
│   │   │   │   ├── attendance.ts
│   │   │   │   ├── attendance-lock.ts
│   │   │   │   ├── leave.ts
│   │   │   │   ├── salary.ts
│   │   │   │   ├── report.ts
│   │   │   │   ├── flag.ts
│   │   │   │   ├── bank.ts
│   │   │   │   ├── audit.ts
│   │   │   │   ├── holiday.ts
│   │   │   │   ├── override.ts
│   │   │   │   ├── role.ts
│   │   │   │   ├── monthly-summary.ts
│   │   │   │   └── config.ts
│   │   │   ├── s3/              # S3 adapters
│   │   │   │   ├── policy-repository.ts
│   │   │   │   └── document-repository.ts
│   │   │   ├── ses/             # SES email adapter
│   │   │   │   └── email-adapter.ts
│   │   │   ├── cognito/         # Cognito auth adapter
│   │   │   │   └── auth-provider-adapter.ts
│   │   │   └── index.ts         # Barrel exports
│   │   ├── __tests__/
│   │   └── package.json
│   │
│   ├── types/                   # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── employee.ts      # Employee, employment types, contracts
│   │   │   ├── attendance.ts    # Clock events, sessions
│   │   │   ├── leave.ts         # Leave types, requests, balances
│   │   │   ├── payroll.ts       # Salary, bonuses, commission, allowances, JPY tracking
│   │   │   ├── overtime.ts      # Overtime tracking, deemed vs actual
│   │   │   ├── policy.ts        # Policy cascade types
│   │   │   ├── permissions.ts   # Roles, ABAC attributes
│   │   │   ├── reports.ts       # Daily reports, versions, references
│   │   │   ├── holidays.ts      # Holiday calendars (JP/NP)
│   │   │   ├── flags.ts         # Shortfall flags, resolutions
│   │   │   ├── banking.ts       # Hours banking, surplus
│   │   │   └── audit.ts         # Audit log entries
│   │   └── package.json
│   │
│   ├── api/                     # REST API (Lambda handlers)
│   │   ├── src/
│   │   │   ├── handlers/        # One file per resource
│   │   │   │   ├── employees.ts
│   │   │   │   ├── attendance.ts
│   │   │   │   ├── attendance-lock.ts
│   │   │   │   ├── leave.ts
│   │   │   │   ├── payroll.ts
│   │   │   │   ├── reports.ts
│   │   │   │   ├── flags.ts
│   │   │   │   ├── holidays.ts
│   │   │   │   ├── policies.ts  # Policy builder CRUD
│   │   │   │   ├── roles.ts     # Role/permission management
│   │   │   │   └── admin.ts     # Onboarding, offboarding, exports
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts      # Cognito JWT verification
│   │   │   │   ├── permissions.ts # RBAC + ABAC enforcement
│   │   │   │   ├── validation.ts
│   │   │   │   └── error.ts
│   │   │   └── routes.ts
│   │   ├── __tests__/
│   │   └── package.json
│   │
│   ├── slack/                   # Slack integration (Lambda + SQS)
│   │   ├── src/                 # SCOPE: attendance + daily reports ONLY
│   │   │   ├── events/
│   │   │   │   ├── attendance.ts # Message → clock event (state machine validation)
│   │   │   │   ├── reports.ts    # Message → daily report (with edit tracking)
│   │   │   │   ├── language.ts   # "lang en/ja" → update user preference
│   │   │   │   └── guidebook.ts  # "help/ヘルプ" → ephemeral guidebook in user's lang
│   │   │   ├── keywords.ts      # Configurable keyword mappings per language (en/ja)
│   │   │   ├── i18n.ts          # Bot response templates (en/ja), user pref lookup
│   │   │   ├── validation.ts    # 3-state machine (IDLE/CLOCKED_IN/ON_BREAK)
│   │   │   ├── ack.ts           # Fast acknowledger (HTTP 200 < 200ms)
│   │   │   ├── processor.ts     # SQS consumer (async processing)
│   │   │   └── responder.ts     # Reply via Slack API (chat.postMessage)
│   │   ├── __tests__/
│   │   └── package.json
│   │
│   └── web/                     # React frontend (S3 + CloudFront)
│       ├── src/
│       │   ├── components/
│       │   │   ├── common/        # Layout shell (styled-components)
│       │   │   ├── dashboard/     # DashboardPage, ClockWidget
│       │   │   ├── attendance/    # AttendancePage
│       │   │   ├── leave/         # LeavePage
│       │   │   ├── reports/       # ReportsPage
│       │   │   ├── payroll/       # PayrollPage
│       │   │   ├── team/          # TeamPage (manager view)
│       │   │   ├── admin/         # AdminPage (tabbed: onboard/offboard/policy/roles/holidays/locks)
│       │   │   └── settings/      # SettingsPage (i18n language selector)
│       │   ├── hooks/
│       │   │   ├── useAuth.ts     # JWT in memory, AuthProvider context
│       │   │   └── apiClient.ts   # fetch wrapper with Bearer token
│       │   ├── theme/
│       │   │   ├── theme.ts       # Design token object (colors, fonts, spacing, radii)
│       │   │   ├── styled.d.ts    # Theme type augmentation for styled-components
│       │   │   ├── GlobalStyle.ts # createGlobalStyle (reset, base typography)
│       │   │   └── primitives.ts  # Shared: Card, Button*, SectionTitle, TextMuted, FormField, PageLayout
│       │   ├── pwa/
│       │   │   ├── config.ts      # PWA manifest config (WillDesign brand)
│       │   │   └── offline-queue.ts # Offline attendance action queue
│       │   ├── utils/
│       │   │   └── date.ts        # formatDate/Time/Relative, localDateToIso, isoToLocalDate
│       │   ├── i18n/
│       │   │   ├── en.json        # English (80+ keys)
│       │   │   ├── ja.json        # Japanese
│       │   │   └── ne.json        # Nepali
│       │   ├── test/
│       │   │   ├── setup.ts       # @testing-library/jest-dom/vitest
│       │   │   └── render.tsx     # renderWithProviders (Theme+Query+Auth+Router)
│       │   └── App.tsx            # ThemeProvider, lazy routes, Suspense
│       ├── __tests__/
│       └── package.json
│
├── policies/                    # Static policy cascade files
│   ├── org.json                 # Company-wide defaults
│   │   # Includes: JP labor law overtime rates, default leave schedules,
│   │   # default probation (3mo), default allowance types, etc.
│   ├── groups/
│   │   ├── jp-fulltime.json     # 正社員 overrides (JP leave schedule, overtime)
│   │   ├── jp-contract.json     # 契約社員 overrides
│   │   ├── jp-gyoumu-itaku.json # 業務委託 overrides (contractor rules)
│   │   ├── jp-parttime.json     # パートタイム overrides (pro-rata)
│   │   ├── jp-sales.json        # Sales overrides (commission tracking)
│   │   ├── jp-intern.json       # JP intern overrides
│   │   ├── np-fulltime.json     # Nepal full-time contractor (160h/mo)
│   │   ├── np-paid-intern.json  # Nepal paid intern (80h/mo)
│   │   └── np-unpaid-intern.json # Nepal unpaid intern (tracked hours, no pay)
│   └── users/                   # Per-employee overrides (sparse, only diffs)
│       └── .gitkeep
│
├── infra/                       # AWS CDK/SAM
│   ├── lib/
│   │   ├── api-stack.ts         # Lambda + API Gateway
│   │   ├── slack-stack.ts       # Slack Lambda + SQS
│   │   ├── web-stack.ts         # S3 + CloudFront
│   │   ├── database-stack.ts    # DynamoDB tables
│   │   ├── auth-stack.ts        # Cognito user pool
│   │   └── scheduler-stack.ts   # EventBridge cron rules
│   └── package.json
│
├── .github/
│   └── workflows/
│       ├── ci.yml               # Lint + typecheck + test on PR
│       ├── deploy-dev.yml       # Deploy to dev on push to develop
│       └── deploy-prod.yml      # Deploy to prod on push to main
│
├── package.json                 # Workspace root (npm workspaces)
├── tsconfig.base.json           # Shared TS config (strict mode)
└── vitest.config.ts             # Vitest 4 project-based config (jsdom for web, node for rest)
```

## Package Dependencies
```
types ← (no deps)
core  ← types
data  ← core, types (DynamoDB/S3/SES/Cognito adapters)
api   ← core, types, data
slack ← core, types, data
web   ← types (core logic via API calls, not direct import)
infra ← (standalone, references Lambda handler paths)
```

## Key Architecture Rules
- **Hexagonal Architecture**: Handler → Service → Repository (Ports & Adapters)
- `core` has ZERO AWS dependencies — services, repository interfaces (ports), calculators, policy engine, permission engine
- `data` contains ALL AWS adapter implementations (DynamoDB, S3, SES, Cognito) — shared by both `api` and `slack`
- `api` and `slack` are thin Lambda handlers (composition roots): instantiate adapters from `data`, inject into services from `core`
- `web` never imports `core` directly — all business logic accessed via REST API
- All user mutations go through append-only audit log
- Policy resolver is a pure function — data source injected via PolicyRepository interface
- Permissions enforced at middleware level (API) and data layer (DB queries)
- Swapping DynamoDB to Postgres/MongoDB = new implementations in `data/`, zero changes to `core/`
