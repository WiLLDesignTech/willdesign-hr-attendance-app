# Multi-Tenant Guide

The app supports two deployment modes: **single-tenant** (one company) and **multi-tenant** (multiple companies sharing infrastructure).

## Single-Tenant (Default)

```yaml
deployment:
  mode: single
```

- All data uses `tenantId = "default"`
- No tenant isolation needed — one DynamoDB table, one Cognito pool
- Zero overhead compared to a non-tenant-aware deployment

## Multi-Tenant

```yaml
deployment:
  mode: multi
```

### How It Works

1. Every DynamoDB key is prefixed with `T#{tenantId}#` for complete data isolation
2. Auth middleware extracts `tenantId` from the JWT `custom:tenant_id` claim
3. Each request resolves tenant-scoped dependencies (repos, services)
4. Tenants share the same DynamoDB table but cannot access each other's data

### Tenant Isolation

| Layer | Mechanism |
|-------|-----------|
| Data | PK prefix: `T#{tenantId}#EMP#{id}` |
| Auth | JWT claim: `custom:tenant_id` |
| API | Per-request tenant resolution from auth context |
| Cron | Iterates all tenants via fan-out |

### Key Pattern Example

Single-tenant:
```
PK: T#default#EMP#emp-123    SK: PROFILE
PK: T#default#EMP#emp-123    SK: ATT#2024-01-15#2024-01-15T09:00:00Z
```

Multi-tenant:
```
PK: T#acme-corp#EMP#emp-123  SK: PROFILE
PK: T#globex-inc#EMP#emp-456 SK: PROFILE
```

### Setting Up Multi-Tenant

1. Set `deployment.mode: multi` in `config.yaml`
2. Set `DEPLOYMENT_MODE=multi` environment variable for Lambda
3. Configure Cognito to include `custom:tenant_id` in JWT claims
4. Create a tenant onboarding flow (tenant admin creates tenants)

### Slack Workspace Mapping

In multi-tenant mode, each Slack workspace maps to exactly one tenant. A workspace cannot be shared between tenants.
