# Architecture Overview

## Hexagonal Architecture

The codebase follows hexagonal (ports and adapters) architecture:

```
Handler (API/Slack) → Service (core) → Repository (port)
                                              ↓
                                     DynamoDB Adapter (data)
```

- **`packages/core`** — Pure business logic. Zero AWS dependencies. Defines repository interfaces (ports).
- **`packages/data`** — AWS adapters implementing the repository interfaces. DynamoDB, S3, SES, Cognito.
- **`packages/api`** — HTTP handlers, routing, auth middleware, composition root (DI wiring).

## Multi-Tenancy

Every DynamoDB key is prefixed with `T#{tenantId}#`:

```
PK: T#default#EMP#emp-123    SK: PROFILE
PK: T#default#EMP#emp-123    SK: ATT#2024-01-15#...
GSI2PK: T#default#ORG#EMP    GSI2SK: T#default#EMP#emp-123
```

- Single-tenant: `tenantId = "default"` (constant)
- Multi-tenant: `tenantId` from JWT `custom:tenant_id` claim
- Tenant-scoped deps: `getTenantDeps(tenantId)` creates repos with tenant-prefixed keys

## Single-Table DynamoDB Design

One table with PK/SK + two GSIs:

| Access Pattern | Key |
|---------------|-----|
| Employee by ID | PK=`T#tid#EMP#id` SK=`PROFILE` |
| Attendance state | PK=`T#tid#EMP#id` SK=`ATT_STATE` |
| Attendance events | PK=`T#tid#EMP#id` SK=`ATT#date#ts` |
| Leave requests | PK=`T#tid#EMP#id` SK=`LEAVE#id` |
| All employees | GSI2PK=`T#tid#ORG#EMP` |
| Pending leaves | GSI1PK=`T#tid#LEAVE#PENDING` |
| Manager's reports | GSI1PK=`T#tid#MGR#managerId` |

## Region Strategy Pattern

Region-specific logic (overtime, leave accrual, holidays, payroll deductions) is implemented via strategy interfaces:

```
RegionRegistry
  ├── JP: OvertimeStrategy, LeaveAccrualStrategy, HolidayGenerator, PayrollDeduction
  └── NP: OvertimeStrategy, LeaveAccrualStrategy, PayrollDeduction
```

New regions implement these interfaces and register with the global registry.

## Policy Cascade

4-level deep merge: Region → Company → Group → Employee

```typescript
const effective = resolveCascadeWithRegion(
  regionDefaults, companyOverride, groupOverride, employeeOverride
);
```

## Request Flow

```
1. HTTP Request → API Gateway → Lambda
2. Lambda router matches route → handler
3. Handler: parseAuthContext(claims) → { tenantId, actorId, role }
4. Handler: getDeps(tenantId) → tenant-scoped services
5. Service: business logic → repository calls
6. Repository: tenant-prefixed DynamoDB operations
7. Response → API Gateway → Client
```

## Package Dependency Graph

```
types (shared types, constants, Zod schemas)
  ↑
core (business logic, services, region strategies)
  ↑
data (DynamoDB, S3, SES, Cognito adapters)
  ↑
api (handlers, routing, composition root)
  ↑
slack (message templates — consumed by api)

cli (setup wizard, deploy commands — standalone)
infra (CDK stacks — standalone)
web (React frontend — standalone)
```
