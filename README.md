# WillDesign HR Platform

Full-stack HR management platform for WillDesign KK/GK, serving both Japan-based employees and Nepal-based contractors. Replaces the existing Google Apps Script Slack bot with a proper web application backed by AWS infrastructure, while keeping Slack as the primary daily interface for attendance and reporting.

## Overview

| | |
|---|---|
| **Japan Team** | ~10 members: full-time, contract, part-time, sales, interns (Japanese labor law) |
| **Nepal Team** | ~15 members: independent contractors, paid/unpaid interns (Nepal Contract Act 2056) |
| **Slack** | Message-based attendance (clock in/out, breaks) + daily reporting |
| **Web App** | Dashboard, leave management, payroll, admin, policy builder |
| **Deployment** | AWS free tier (~$0-5/month) |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+ (TypeScript, strict mode) |
| Frontend | React 18 + Vite |
| Backend | AWS Lambda + API Gateway |
| Database | DynamoDB or RDS Postgres (free tier) |
| Auth | AWS Cognito |
| Hosting | S3 + CloudFront |
| Queue | SQS (Slack async processing) |
| Scheduler | EventBridge (cron jobs) |
| i18n | react-i18next (English, Japanese, Nepali) |
| CI/CD | GitHub Actions |
| IaC | AWS CDK or SAM |
| Testing | Vitest + Testing Library (TDD) |

## Monorepo Structure

```
willdesign-hr/
├── packages/
│   ├── core/          # Shared business logic (policy engine, calculations, permissions)
│   ├── types/         # Shared TypeScript types
│   ├── api/           # REST API (Lambda handlers)
│   ├── slack/         # Slack event handler (Lambda + SQS)
│   └── web/           # React frontend (S3 + CloudFront)
├── policies/          # Static policy cascade files (company -> group -> employee)
├── infra/             # AWS CDK/SAM templates
├── docs/              # HR policy documentation
├── .kiro/             # Spec-driven development (requirements, design, tasks)
└── .github/workflows/ # CI/CD pipelines
```

## Key Features

- **Slack Attendance** --- Message-based (not slash commands). User types "hello" to clock in, "break" to start break, "bye" to clock out. Bilingual responses (EN/JA) based on user preference.
- **Cascading Policy Engine** --- 3-level cascade: Company defaults -> Group overrides -> Employee overrides. Static JSON files initially, swappable to DB later.
- **RBAC + ABAC Permissions** --- Role-based (Employee, Manager, HR, Admin, Super Admin) combined with attribute-based rules (reporting chain, resource ownership).
- **Multi-Region** --- Japan (JST) and Nepal (NPT) teams with different labor laws, leave rules, overtime rules, currencies (JPY/NPR).
- **Overtime Tracking** --- Deemed overtime (minashi zangyou), actual overtime pay, 36 Agreement limit tracking.
- **Daily Reports via Slack** --- Append-only log with JIRA/GitHub reference extraction. Edit tracking for future LLM analysis.
- **Audit Trail** --- Every mutation logged with timestamp, actor, source (slack/web/system), before/after values.

## Environments

| Environment | Branch | Purpose |
|-------------|--------|---------|
| dev | `develop` | Development and testing |
| prod | `main` | Production |

## Development

```bash
# Install dependencies
npm install

# Run tests (TDD - tests first)
npm test

# Lint + typecheck
npm run lint
npm run typecheck

# Deploy to dev
npm run deploy:dev

# Deploy to prod
npm run deploy:prod
```

## Spec-Driven Development

This project uses a spec-driven workflow managed in `.kiro/`:

```
.kiro/
├── steering/              # Project context
│   ├── product.md         # What, who, why
│   ├── tech.md            # Stack and architecture decisions
│   └── structure.md       # Monorepo layout and package dependencies
└── specs/
    └── hr-platform/
        ├── spec.json      # Phase tracking
        └── requirements.md # 90+ EARS requirements
```

Workflow: Requirements -> Design -> Tasks -> Implementation (human review at each phase).

## Scripts

| Script | Purpose |
|--------|---------|
| `sync-to-drive.sh` | Syncs all `.md` files to Google Drive for NotebookLM integration. Flattens paths into filenames (e.g., `docs/JAPAN_HR_POLICY.md` becomes `docs_JAPAN_HR_POLICY.md`). Run after updating specs to keep NotebookLM in sync. Usage: `./sync-to-drive.sh [target-folder-name]` (default: `willdesign-hr`). |

## Documentation

| File | Description |
|------|-------------|
| `docs/JAPAN_HR_POLICY.md` | Japan-side HR policies: employment types, overtime, leave, holidays, compensation |
| `docs/NEPAL_HR_POLICY_ADDITIONS.md` | Nepal-side additions: unpaid interns, holiday calendar |
| `.kiro/specs/hr-platform/requirements.md` | Complete requirements specification (90+ EARS requirements) |
| `.kiro/steering/product.md` | Product context and business rules for both regions |
| `.kiro/steering/tech.md` | Technical architecture and constraints |
| `.kiro/steering/structure.md` | Detailed monorepo structure with all packages and files |
