# HR Attendance App

Open-source, self-hosted HR attendance platform built on AWS. Supports single-tenant (one company) and multi-tenant (managed cloud) deployments with configurable regions, policies, and branding.

## Features

- **Slack Attendance** — Message-based clock in/out, breaks, daily reports. Bilingual (EN/JA/NE).
- **Web Dashboard** — Leave management, payroll, admin panel, policy builder. PWA-ready.
- **Multi-Region** — Configurable regions with country-specific labor laws, overtime rules, leave accrual, holidays, currencies.
- **Multi-Tenant** — Single-tenant (self-hosted) or multi-tenant (managed). Tenant isolation at the data layer.
- **Policy Engine** — 4-level cascade: Region defaults → Company → Group → Employee. Policy-as-data, not code.
- **RBAC + ABAC** — 5-level role hierarchy with attribute-based access control.
- **Overtime Tracking** — Deemed overtime, actual pay, 36 Agreement limits (JP), configurable per region.
- **Audit Trail** — Append-only logging for every state change.
- **One-Command Setup** — Interactive CLI wizard generates config, deploys to AWS.

## Quick Start

### Local Development (5 minutes)

```bash
# Clone and install
git clone <repo-url> && cd hr-attendance-app
npm install

# Start local stack (DynamoDB + API + Web)
npm run dev

# Or use Docker
docker compose up
```

The app will be available at:
- Web: http://localhost:5173
- API: http://localhost:3001
- DynamoDB Local: http://localhost:8000

### Deploy to AWS

```bash
# Interactive setup wizard
npx hr-app init

# Deploy (requires AWS credentials)
npx hr-app deploy

# Check deployment health
npx hr-app status
```

See [docs/getting-started/deployment.md](docs/getting-started/deployment.md) for the full walkthrough.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  React PWA  │────▶│  API Gateway │────▶│   Lambda    │
│  (S3 + CF)  │     │              │     │  (Express)  │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
┌─────────────┐     ┌──────────────┐     ┌──────▼──────┐
│  Slack Bot  │────▶│     SQS      │────▶│  DynamoDB   │
│  (Lambda)   │     │  (async)     │     │ (single tbl)│
└─────────────┘     └──────────────┘     └─────────────┘
                                                │
                    ┌──────────────┐     ┌──────▼──────┐
                    │ EventBridge  │────▶│  Cognito    │
                    │   (cron)     │     │  (auth)     │
                    └──────────────┘     └─────────────┘
```

**Hexagonal Architecture**: Handler → Service → Repository (ports in `core/`, adapters in `data/`)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+, TypeScript (strict mode) |
| Frontend | React 19, Vite, styled-components, react-i18next |
| Backend | AWS Lambda, API Gateway, Express (dev) |
| Database | DynamoDB (single-table design) |
| Auth | AWS Cognito |
| Hosting | S3 + CloudFront (PWA) |
| Queue | SQS (Slack async pattern) |
| Scheduler | EventBridge (daily/weekly/monthly cron) |
| IaC | AWS CDK (TypeScript) |
| CI/CD | GitHub Actions |
| Testing | Vitest (421+ tests) |

## Monorepo Structure

```
hr-attendance-app/
├── config.yaml              # Single source of truth for deployment config
├── packages/
│   ├── types/               # Shared types, constants, Zod schemas, branding
│   ├── core/                # Business logic (ZERO AWS deps, hexagonal)
│   │   ├── regions/         # Region strategies (JP, NP, extensible)
│   │   ├── policies/        # Policy cascade engine
│   │   ├── attendance/      # Clock in/out state machine
│   │   ├── leave/           # Leave accrual and management
│   │   ├── payroll/         # Salary calculations
│   │   └── ...
│   ├── data/                # DynamoDB, S3, SES, Cognito adapters
│   ├── api/                 # REST API Lambda handlers
│   ├── slack/               # Slack bot message templates
│   ├── web/                 # React frontend (Vite, PWA)
│   └── cli/                 # Setup wizard and deployment CLI
├── infra/                   # AWS CDK stacks
├── scripts/                 # Seed data, local setup
├── docs/                    # Full documentation
└── .github/workflows/       # CI/CD pipelines
```

## Configuration

All settings live in `config.yaml`:

```yaml
app:
  appName: "Acme Corp HR"
  appShortName: "Acme HR"
  themeColor: "#58C2D9"

deployment:
  mode: single              # single | multi
  awsRegion: ap-northeast-1
  accountingCurrency: JPY   # company-wide home currency

regions:
  - name: "US Office"
    code: US
    timezone: America/New_York
    currency: USD
  - name: "India Office"
    code: IN
    timezone: Asia/Kolkata
    currency: INR
```

See [docs/reference/config.md](docs/reference/config.md) for the full schema.

## Adding a New Region

1. Create a region module in `packages/core/src/regions/<code>/index.ts`
2. Implement the strategy interfaces: `OvertimeStrategy`, `LeaveAccrualStrategy`, `HolidayGeneratorStrategy`, `PayrollDeductionStrategy`
3. Register with `regionRegistry.register(config)`
4. Add policy seed files for employment types
5. Add to `config.yaml` regions list

See [docs/contributing/adding-a-region.md](docs/contributing/adding-a-region.md) for a step-by-step tutorial.

## CLI Commands

| Command | Description |
|---------|-------------|
| `hr-app init` | Interactive setup wizard — generates config.yaml |
| `hr-app dev` | Start local development stack |
| `hr-app deploy` | Deploy to AWS (validates config first) |
| `hr-app destroy` | Tear down all AWS stacks |
| `hr-app status` | Check CloudFormation stack health |
| `hr-app seed` | Load sample data |

## Development

```bash
npm install          # Install all dependencies
npm run dev          # Start DynamoDB + API + Web locally
npm test             # Run all 421+ tests
npm run typecheck    # TypeScript strict checking
npm run lint         # ESLint
```

## Documentation

| Guide | Description |
|-------|-------------|
| [Quickstart](docs/getting-started/quickstart.md) | 5-minute local setup with Docker |
| [Deployment](docs/getting-started/deployment.md) | Full AWS deployment guide |
| [Slack Setup](docs/getting-started/slack-app-setup.md) | Creating and configuring the Slack app |
| [Branding](docs/guides/branding.md) | Customizing look and feel |
| [Regions](docs/guides/regions.md) | Adding and configuring regions |
| [Policies](docs/guides/policies.md) | Policy cascade reference |
| [Multi-Tenant](docs/guides/multi-tenant.md) | Multi-tenant setup and management |
| [Config Reference](docs/reference/config.md) | config.yaml schema reference |
| [CLI Reference](docs/reference/cli.md) | CLI command reference |
| [Architecture](docs/contributing/architecture.md) | System architecture for contributors |

## License

MIT — see [LICENSE](LICENSE) for details.
