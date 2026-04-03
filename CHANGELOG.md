# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Multi-tenancy support with tenant-isolated DynamoDB keys (`T#{tenantId}#` prefix)
- `DEPLOYMENT_MODE` environment variable (`single` | `multi`)
- Configurable region system with strategy pattern (overtime, leave accrual, holidays, payroll deductions)
- JP and NP shipped as built-in region templates
- `RegionRegistry` for registering custom regions
- 4-level policy cascade: Region → Company → Group → Employee
- `config.yaml` as single source of truth for deployment configuration
- Zod schema validation for config (`parseAppConfig`)
- `accountingCurrency` field for company-wide payroll equivalent tracking
- `homeCurrencyEquivalent` field on `PayrollBreakdown` (replaces `jpyEquivalent`)
- CLI package (`@hr-attendance-app/cli`) with commands: init, deploy, destroy, status, dev, seed
- Interactive setup wizard (`hr-app init`)
- Docker Compose with full local stack (DynamoDB + API + Web)
- Comprehensive documentation (quickstart, deployment, guides, references)
- MIT License, CONTRIBUTING.md, GitHub issue/PR templates
- Extensible types: `Region`, `EmploymentType`, `Currency` accept arbitrary strings

### Changed
- All DynamoDB repository constructors now require `tenantId` parameter
- Auth middleware extracts `tenantId` from JWT claims
- Composition root uses per-tenant caching (`getTenantDeps`)
- Route handlers use `DepsResolver` pattern instead of static `AppDeps`
- `AppBranding` now has `createBranding(config)` factory for config-driven branding
- CDK config reads from `config.yaml` instead of hardcoded values
- Overtime calculator accepts configurable `excessOvertimeThreshold` and `warningUtilization`
- Payroll calculator accepts configurable `homeCurrency`

### Removed
- `jpyEquivalent` field from `PayrollBreakdown` (replaced by `homeCurrencyEquivalent`)
