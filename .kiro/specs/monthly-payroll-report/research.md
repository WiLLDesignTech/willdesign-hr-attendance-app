# Research & Design Decisions

## Summary
- **Feature**: monthly-payroll-report
- **Discovery Scope**: Extension (complex — hybrid of extending existing + new components)
- **Key Findings**:
  - Pure business logic exists for payroll, overtime, flags, banking, quota validation — but handlers don't persist results to DB
  - DynamoDB single-table design with `PK: EMP#{id}, SK: <entity>#<key>` pattern + GSI1 for cross-entity queries
  - Composition root in `packages/api/src/composition.ts` uses constructor DI for all services
  - PolicyService cascade (region → company → group → employee) with `deepMergePolicy()` — no caching layer
  - CronService already handles daily/weekly/monthly checks with flag generation and bank expiry

## Research Log

### DynamoDB Key Design for New Entities

- **Context**: Need key patterns for QuotaPlan, ForceMajeureEvent, AllowanceOverride, and PayrollAdjustment (transfer fees/exchange rates)
- **Sources Consulted**: Existing `packages/types/src/key-patterns.ts`, DynamoDB single-table best practices
- **Findings**:
  - Current pattern: `PK: EMP#{id}`, `SK: <ENTITY_PREFIX>#<secondary_key>`
  - Override pattern already exists: `OVR#{type}#{value}` — can be extended for quota plans
  - Bank entries: `PK: EMP#{id}, SK: BANK#{yearMonth}` — one entry per employee per month
  - Flags: `PK: EMP#{id}, SK: FLAG#{level}#{period}` with GSI1 for status queries
  - QuotaPlan fits as: `PK: EMP#{id}, SK: QUOTA#{planId}` with GSI1 for status-based queries
  - ForceMajeureEvent: `PK: FM#{eventId}, SK: EMP#{employeeId}` or per-employee `PK: EMP#{id}, SK: FM#{eventId}`
  - PayrollAdjustment (transfer fees): `PK: EMP#{id}, SK: PADJ#{yearMonth}` — one per employee per month
- **Implications**: All new entities follow existing single-table pattern. No new tables needed.

### PolicyService Caching Strategy

- **Context**: `resolveForEmployee()` called per-employee during report generation (25+ calls). Each call does 4 DynamoDB reads (region, company, group, user).
- **Sources Consulted**: Existing code, Node.js in-memory caching patterns
- **Findings**:
  - Lambda execution context reuse means in-memory cache persists across warm invocations
  - Simple `Map<string, { policy: EffectivePolicy; expiresAt: number }>` is sufficient
  - Company and group policies are shared across employees — cache at each cascade level for maximum reuse
  - Invalidation: clear cache on any policy write (in PolicyService.save* methods)
- **Implications**: 3-level cache (company, group, employee) reduces DynamoDB reads from 4N to ~4+N for N employees

### Flag Resolution Persistence Gap

- **Context**: `resolveFlag()` in `packages/core/src/flags/service.ts` is a pure function returning calculation results. The API handler calls it but never persists.
- **Findings**:
  - FlagRepository has `update(id, updates)` method — interface exists
  - DynamoFlagRepository implements update with PutCommand
  - Fix: service layer between handler and pure function that persists + audits
  - Resolution should store: resolution type, resolver ID, bank offset hours, resolved timestamp
- **Implications**: Need FlagResolutionService that wraps the pure function + persistence + audit + bank debit

### Bank Entry Lifecycle

- **Context**: When does surplus become a bank entry? Current code has `createBankEntry()` but no trigger.
- **Findings**:
  - Contract rules: employee must request banking BEFORE or DURING the surplus month
  - Manager approves with max days limit
  - At month-end, CronService calculates actual surplus → creates/finalizes bank entry
  - Lifecycle: REQUEST (employee) → APPROVED (manager, with maxDays) → FINALIZED (cron, at month-end with actual hours)
- **Implications**: BankEntry needs a 3-phase lifecycle, not just PENDING/APPROVED

### CSV Export Approach

- **Context**: Need client-side or server-side CSV generation
- **Findings**:
  - Report data already fetched via `usePayrollReport()` React Query hook
  - Client-side CSV generation avoids a new API endpoint
  - Use `Blob` + `URL.createObjectURL()` for download — no external dependencies needed
  - Include BOM (`\uFEFF`) for Excel UTF-8 compatibility (Japanese characters)
- **Implications**: Frontend-only implementation. No new API endpoint needed.

### Salary Statement Email

- **Context**: SES adapter and HTML template exist but aren't wired
- **Findings**:
  - `SESEmailAdapter` in `packages/data/src/ses/email-adapter.ts` — implements `EmailAdapter` interface
  - `renderSalaryStatementHtml()` in `packages/data/src/ses/salary-template.ts` — policy-driven visibility
  - Composition root doesn't instantiate `SESEmailAdapter`
  - For local dev: need a mock/no-op email adapter
- **Implications**: Wire adapter in composition, add trigger in PayrollService or as admin action

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks | Notes |
|--------|-------------|-----------|-------|-------|
| Extend existing services | Add methods to PayrollService, FlagService, BankService | Minimal new files, follows DI pattern | Services grow larger | Best for Tier 1 fixes |
| New domain services | QuotaRedistributionService, SettlementService, ForceMajeureService | Clean separation | More composition wiring | Best for new features |
| Hybrid | Extend for fixes, new for features | Balanced | Needs clear boundaries | **Selected** |

## Design Decisions

### Decision: Hybrid Service Architecture
- **Context**: 21 requirements spanning fixes, extensions, and new features
- **Alternatives**: (1) Extend all existing services, (2) Create all new services
- **Selected**: Hybrid — extend PayrollService/MonthlyPayrollReportService for payroll calculation fixes; create new QuotaService, SettlementService, ForceMajeureService for new domains
- **Rationale**: Follows single responsibility — quota redistribution is a distinct domain from payroll calculation
- **Trade-offs**: More services to wire in composition, but cleaner boundaries and easier testing

### Decision: Client-Side CSV Export
- **Context**: CSV export for payroll report
- **Selected**: Generate CSV in browser from React Query data, download via Blob
- **Rationale**: Data already available client-side, avoids new API endpoint, works offline
- **Trade-offs**: Large reports (100+ employees) may be slow in browser — acceptable for ~25 employees

### Decision: In-Memory TTL Cache for PolicyService
- **Context**: Policy resolution called N times per report generation
- **Selected**: `Map<string, CacheEntry>` with TTL check on read, clear-all on policy writes
- **Rationale**: Simple, no external dependency, Lambda warm-start compatible
- **Trade-offs**: No cross-Lambda sharing (acceptable for single-tenant)

### Decision: 3-Phase Bank Entry Lifecycle
- **Context**: Banking requires pre-approval then finalization at month-end
- **Selected**: REQUESTED → APPROVED → FINALIZED | EXPIRED statuses
- **Rationale**: Matches contract rules (pre-approval required, actual hours known at month-end)
- **Trade-offs**: More complex than current 2-phase, but matches business reality

### Decision: QuotaPlan as Standalone Entity
- **Context**: Quota redistribution spans two months and has its own approval workflow
- **Selected**: New `QuotaPlan` entity with its own repository, separate from Override
- **Rationale**: QuotaPlan has distinct lifecycle (PENDING → APPROVED → ACTIVE → COMPLETED/CANCELLED) and spans multiple months
- **Trade-offs**: New repository + DynamoDB key pattern needed

## Risks & Mitigations
- **Risk**: Policy type expansion breaks existing stored policies → **Mitigation**: All new fields optional with region defaults as fallback
- **Risk**: Flag resolution persistence changes affect existing flag workflow → **Mitigation**: Extend, don't replace; existing `resolveFlag()` pure function unchanged
- **Risk**: Settlement calculation complexity (quota unwind) → **Mitigation**: Phase 1 settlement = pro-rata + leave; Phase 2 adds quota unwind
- **Risk**: SES email in dev environment → **Mitigation**: No-op email adapter for local development

## References
- Existing key patterns: `packages/types/src/key-patterns.ts`
- Composition root: `packages/api/src/composition.ts`
- Policy cascade: `packages/core/src/policies/service.ts`
- Contract rules: `/Users/subash/Documents/CODING-SHARED/WillDesign/willdesign-rules/nepal/common/`
- HR policies: `/Users/subash/Documents/CODING-SHARED/WillDesign/hr-contracts/docs/HR_POLICIES.md`
