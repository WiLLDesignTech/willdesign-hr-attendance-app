# AI-DLC and Spec-Driven Development

Kiro-style Spec Driven Development implementation on AI-DLC (AI Development Life Cycle)

## Project Context

### Paths

- Steering: `.kiro/steering/`
- Specs: `.kiro/specs/`

### Steering vs Specification

**Steering** (`.kiro/steering/`) - Guide AI with project-wide rules and context
**Specs** (`.kiro/specs/`) - Formalize development process for individual features

### Active Specifications

- Check `.kiro/specs/` for active specifications
- Use `/kiro:spec-status [feature-name]` to check progress

## Development Guidelines

- Think in English, generate responses in English. All Markdown content written to project files (e.g., requirements.md, design.md, tasks.md, research.md, validation reports) MUST be written in the target language configured for this specification (see spec.json.language).

## Minimal Workflow

- Phase 0 (optional): `/kiro:steering`, `/kiro:steering-custom`
- Phase 1 (Specification):
  - `/kiro:spec-init "description"`
  - `/kiro:spec-requirements {feature}`
  - `/kiro:validate-gap {feature}` (optional: for existing codebase)
  - `/kiro:spec-design {feature} [-y]`
  - `/kiro:validate-design {feature}` (optional: design review)
  - `/kiro:spec-tasks {feature} [-y]`
- Phase 2 (Implementation): `/kiro:spec-impl {feature} [tasks]`
  - `/kiro:validate-impl {feature}` (optional: after implementation)
- Progress check: `/kiro:spec-status {feature}` (use anytime)

## Development Rules

- 3-phase approval workflow: Requirements → Design → Tasks → Implementation
- Human review required each phase; use `-y` only for intentional fast-track
- Keep steering current and verify alignment with `/kiro:spec-status`
- Follow the user's instructions precisely, and within that scope act autonomously: gather the necessary context and complete the requested work end-to-end in this run, asking questions only when essential information is missing or the instructions are critically ambiguous.

## Claude Rules

- Never add Co-Authored-By lines to git commit messages
- Always run /simplify command before committing code
- Alert when Claude needs more context and compact context to perform a task
- Always use `const` arrow function pattern for all functions (`export const myFunc = () => { ... }`) — never use `function` declarations. Applies to React components, utility functions, handlers, hooks, backend services, and all code across the monorepo
- Never use magic strings or numbers in code — always use named constants from `@hr-attendance-app/types` constants module
- Always use styled-components for frontend styling — never create CSS files. Use `theme.ts` for design tokens, `primitives.ts` for shared components (Card, Button, FormField, etc.), and co-located styled components for page-specific styles
- Never use inline date operations (`new Date()`, `Date.now()`, `.toISOString()`, `.slice(0,10)`, `.getFullYear()`) — always use shared `date-utils` from `@hr-attendance-app/types`: `nowIso()`, `nowMs()`, `todayDate()`, `isoToDateStr()`, `dateToIso()`, `dateToDateStr()`, `yearFromDate()`, `daysInMonth()`, `formatYearMonth()`, `addDays()`, `addMonths()`, `addYears()`, `timestampId()`. For frontend display, use `packages/web/src/utils/date.ts` (formatDate, formatDateTime, formatRelative) and `packages/web/src/utils/currency.ts` (formatAmount)
- Never display raw ISO strings to users — use `utils/date.ts` functions: `formatDate`/`formatDateTime` for display, `localDateToIso`/`isoToLocalDate` for form input conversion. All dates stored as ISO UTC, displayed in user's locale
- All user-facing text must use i18n `t()` calls — never hardcode strings in JSX. Keys go in `i18n/en.json`, `ja.json`, `ne.json` with structure `section.key` (e.g. `t("leave.newRequest")`)
- Handlers must NEVER call repositories directly — always go through a service (handler → service → repository)
- All API endpoints, typed bodies, query params, and frontend routes defined in `packages/types/src/api-routes.ts` — single source of truth shared by backend and frontend
- All DynamoDB key patterns use `KeyPatterns` and `KeyPrefixes` from `@hr-attendance-app/types` — never construct keys with inline template literals
- Prefer querying NotebookLM MCP for requirement, design, or contract lookups to save context tokens — fall back to reading spec files directly only when NotebookLM is unavailable

## Steering Configuration

- Load entire `.kiro/steering/` as project memory
- Default files: `product.md`, `tech.md`, `structure.md`
- Custom files are supported (managed via `/kiro:steering-custom`)
