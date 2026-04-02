# Technical Context — WillDesign HR Platform

## Stack
| Layer | Technology | Reason |
|-------|-----------|--------|
| **Runtime** | Node.js 20+ (TypeScript) | Team expertise, Lambda support |
| **Frontend** | React 18 + Vite | Fast builds, team knows React (from WilPOS) |
| **Backend** | AWS Lambda + API Gateway | Free tier: 1M requests/month |
| **Database** | DynamoDB (or RDS Postgres free tier) | 25GB free, single-table design |
| **Auth** | AWS Cognito | 50K MAU free |
| **Static Hosting** | S3 + CloudFront | Free tier CDN |
| **Queue** | SQS | Slack async processing |
| **Scheduler** | EventBridge | Cron jobs (daily/weekly/monthly triggers) |
| **i18n** | react-i18next | Multi-language UI (en, ja, ne) |
| **CI/CD** | GitHub Actions | Monorepo build + deploy |
| **IaC** | AWS CDK or SAM | Infrastructure as code |
| **Testing** | Vitest + Testing Library | TDD approach |

## Monorepo Structure
```
willdesign-hr/
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
| **dev** | Development/testing | `develop` | `dev-hr.willdesign.com` |
| **prod** | Production | `main` | `hr.willdesign.com` |

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
- Single-tenant: WillDesign only
