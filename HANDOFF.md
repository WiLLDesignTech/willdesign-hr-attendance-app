# Session Handoff — WillDesign HR Platform

## Current State
- **Phase**: Design Generated + Validated (GO with 3 fixes applied)
- **Next action**: User reviews design.md, then `/kiro:spec-tasks hr-platform -y` to generate tasks
- **After tasks**: Run `./sync-to-drive.sh` to sync to NotebookLM

## What This Project Is
Full-stack HR platform for WillDesign KK/GK replacing an existing buggy Google Apps Script Slack bot. Serves two teams:
- **Japan team** (~10 members): employees, contractors, part-time, sales, interns — Japanese labor law
- **Nepal team** (~15 members): independent contractors, paid/unpaid interns — Nepal Contract Act 2056

## Key Architecture Decisions Made
- **Architecture**: Hexagonal (Ports & Adapters) — Handler → Service → Repository, zero vendor lock-in
- **Stack**: AWS Lambda + API Gateway, DynamoDB (single-table, 2 GSIs), React 18 + Vite, TypeScript strict, Vitest TDD
- **Monorepo**: packages/core, types, data, api, slack, web, infra (npm workspaces)
- **packages/core**: Services + repository interfaces (ports) — ZERO AWS deps
- **packages/data**: DynamoDB/S3/SES/Cognito adapter implementations — shared by api and slack
- **Slack**: Message-based attendance ONLY (like Kincone app — user types "hello" to clock in, not slash commands). Also handles daily reports. All other features are web-only. Bolt.js + Node.js 20 (Node 24 incompatible).
- **Policy Engine**: 3-level cascade, S3 policy files (deployed from git `policies/` as seed), pure function resolver, web policy builder writes to S3 directly
- **Permissions**: RBAC (Employee, Manager, HR Manager, Admin, Super Admin) + ABAC (reporting chain, resource ownership, sensitivity)
- **Auth**: Cognito Lite tier (10K MAU free perpetually), CognitoAuthAdapter for onboarding/offboarding
- **i18n**: English, Japanese, Nepali
- **Theme**: WillDesign brand from willdesign-tech.com — black/white/cyan (#58C2D9), Silom font, light modern minimalist
- **Environments**: dev (develop branch) + prod (main branch), GitHub Actions CI/CD
- **No AI in v1**: Bot gives hints/warnings via regex pattern matching, no Claude/AI backend
- **Append-only audit logs**: All user activity stored for future LLM analysis
- **Email**: AWS SES for salary statements

## Spec Files (all under .kiro/)
- `specs/hr-platform/spec.json` — Phase tracking (currently: design-generated)
- `specs/hr-platform/requirements.md` — **111+ EARS requirements across 22 sections** (APPROVED)
- `specs/hr-platform/design.md` — **Technical design document** (GENERATED, validated GO)
- `specs/hr-platform/research.md` — Discovery log, architecture decisions, risks
- `steering/product.md` — Product context, two-region business rules, brand identity
- `steering/tech.md` — Stack decisions, constraints, multi-timezone/currency
- `steering/structure.md` — Full monorepo layout with all packages (incl. packages/data)

## Requirements Summary (111+ requirements, 22 sections)
1. **Slack Attendance** (15 reqs): Kincone-style message-based, bilingual EN/JA, 3-state machine, 60s idempotency, configurable keywords, bot guidebook, user language preference
2. **Slack Daily Reports** (6 reqs): Message-based, JIRA/GitHub reference extraction + warnings, append-only versioned edits
3. **Web App** (8 reqs): Dashboard, team leave calendar (visible to all), payroll breakdown view, policy builder UI, i18n
4. **Policy Engine** (7 reqs): 3-level cascade, static JSON files, pure resolver, Japanese labor law seed data
5. **Permissions** (9 reqs): RBAC + ABAC, custom roles, holiday calendar RBAC
6. **Employment Types** (4 reqs): JP (正社員, 契約社員, 業務委託, パートタイム, Sales, Intern) + NP (Full-Time, Paid Intern, Unpaid Intern)
7. **Attendance** (8 reqs): UTC storage, cross-midnight, no auto-close (flag for admin), short session flagging (<5min)
8. **Overtime** (5 reqs): みなし残業, Japanese law rates, 36 Agreement tracking
9. **Leave** (7 reqs): Configurable types, JP+NP accrual, no negative balance, mandatory 5-day JP tracking
10. **Compensation & Payroll** (16 reqs): getEffectiveSalary(), monthly/annual/hourly salary, bonuses, commission, allowances, mid-month blending, transfer fee tracking, JPY expense recording, salary statement emails via SES, payment deadline alerts (cascading), payroll breakdown UI
11. **Flags** (5 reqs): 3-level (daily/weekly/monthly), anti-double-penalty, policy-configurable
12. **Hours Banking** (5 reqs): Manager pre-approval, 12mo expiry, unapproved surplus hidden from employee, Kincone-style request→approve flow
13. **Force Majeure** (2 reqs): Proportional adjustment, 24h notification
14. **Quota Redistribution** (3 reqs): Warn if total < original (allow with acknowledgment)
15. **Holidays** (4 reqs): Per-region calendars, JP seeded + editable, NP manual
16. **Onboarding/Offboarding** (5 reqs): Exit notes, post-termination tracking (confidentiality 2yr, non-compete 12mo), S3 document upload
17. **Probation** (2 reqs): Cascading duration, configurable rules
18. **Audit** (4 reqs): Append-only, before/after values, LLM-ready
19. **Infrastructure** (7 reqs): AWS free tier, SES email, CDK/SAM, TDD
20. **Cron** (7 reqs): Daily/weekly/monthly triggers, payment deadline alerts, scheduled salary emails
21. **Scalability** (3 reqs): 100+ users, new regions without schema changes
22. **Brand & Theme** (6 reqs): WillDesign color palette (#000/#58C2D9), Silom font, logo, CSS design tokens, responsive mobile-first

## Gap Analysis Completed
- Validated requirements against existing slack-hr-bot codebase (no code to port — only spec docs exist)
- Validated against NotebookLM (HR policies, contracts)
- All gaps resolved and added to requirements (REQ-ATT-007/008, REQ-LEAVE-007, REQ-PAY-011-016, REQ-BANK-005, REQ-OB-004/005, REQ-QUOTA-002 updated, REQ-WEB-007/008, REQ-CRON-006/007)

## NotebookLM Integration
- Notebook ID: `willdesign-hr-policies-slack-b`
- Contains: HR contracts, policies, all spec files
- Sync script: `./sync-to-drive.sh` copies all .md as .txt to Google Drive for NotebookLM
- **IMPORTANT**: After creating design.md and tasks.md, run `./sync-to-drive.sh` to sync to NotebookLM

## Existing Codebase Reference (DO NOT PORT CODE — it's buggy)
- `/Users/subash/Documents/CODING-SHARED/WillDesign/slack-hr-bot/docs/SCHEMA.md` — Data model reference (13 tables, getEffectiveSalary() algorithm)
- `/Users/subash/Documents/CODING-SHARED/WillDesign/slack-hr-bot/docs/DAILY_REPORTING_AND_HOURS_POLICY.md` — Hours calculation, flags, banking rules
- `/Users/subash/Documents/CODING-SHARED/WillDesign/slack-hr-bot/docs/REQUIREMENTS.md` — Business logic formulas
- The existing bot has NO source code — only specification documents

## What To Do Next
1. ~~Run `/kiro:spec-design hr-platform`~~ DONE — design.md generated
2. ~~Run `/kiro:validate-design hr-platform`~~ DONE — GO decision, 3 fixes applied
3. User reviews design.md and approves
4. Run `/kiro:spec-tasks hr-platform -y` to generate tasks.md
5. Run `./sync-to-drive.sh` after tasks are created (sync to NotebookLM)
6. User reviews and approves tasks
7. Implementation begins with `/kiro:spec-impl hr-platform`
