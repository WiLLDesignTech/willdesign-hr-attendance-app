# config.yaml Reference

The `config.yaml` file at the repo root is the single source of truth for all deployment settings.

## Schema

### `app` — Branding

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `appName` | string | `"HR Attendance App"` | Full application name |
| `appShortName` | string | `"HR App"` | Short name for PWA/mobile |
| `salaryStatementTitle` | string | `"Salary Statement"` | Title on salary emails |
| `salaryStatementFooter` | string | *(default text)* | Footer disclaimer on salary emails |
| `themeColor` | string (hex) | `"#58C2D9"` | Primary brand color |
| `logo` | string | *(optional)* | Path to logo file |

### `deployment` — Infrastructure

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `mode` | `"single"` \| `"multi"` | `"single"` | Tenant mode |
| `awsRegion` | string | `"ap-northeast-1"` | AWS region for all resources |
| `stage` | `"dev"` \| `"prod"` | `"dev"` | Deployment stage |
| `accountingCurrency` | string (ISO 4217) | `"JPY"` | Company-wide home currency for payroll equivalents |
| `domain` | string | *(optional)* | Custom domain (e.g., `hr.company.com`) |
| `certificateArn` | string | *(optional)* | ACM certificate ARN for custom domain |

### `slack` — Slack Integration

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `appId` | string | *(optional)* | Slack App ID |
| `signingSecret` | string | *(optional)* | Slack signing secret (prefer SSM) |

### `regions[]` — Office Locations

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Display name (e.g., "US Office") |
| `code` | string (2-10 chars) | yes | Region code (e.g., "US") |
| `timezone` | string | yes | IANA timezone (e.g., "America/New_York") |
| `currency` | string (3 chars) | yes | ISO 4217 currency code |
| `template` | string | no | Region template to use (e.g., "us-default") |

## Validation

Config is validated with Zod. Run validation manually:

```bash
node -e "const {parseAppConfig}=require('@hr-attendance-app/types'); parseAppConfig(require('yaml').parse(require('fs').readFileSync('config.yaml','utf-8'))); console.log('Valid');"
```

CI automatically validates on every PR.

## Minimal Example

```yaml
app:
  appName: "My Company HR"

deployment:
  awsRegion: us-east-1
  accountingCurrency: USD

regions:
  - name: "Headquarters"
    code: US
    timezone: America/New_York
    currency: USD
```

All unspecified fields use their defaults.
