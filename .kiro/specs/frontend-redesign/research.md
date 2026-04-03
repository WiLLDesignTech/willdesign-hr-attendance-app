# Research & Design Decisions — Frontend Redesign

## Summary
- **Feature**: `frontend-redesign`
- **Discovery Scope**: Complex Integration (fresh redesign of existing frontend with 22 requirements across 4 priority areas)
- **Key Findings**:
  - All critical libraries (react-hook-form, react-day-picker, TanStack Table) confirmed compatible with React 19
  - styled-components 6 is in maintenance mode but functional with React 19 (minor TypeScript workarounds)
  - Multi-step form wizard should be built with react-hook-form + per-step Zod schemas (no library needed)
  - 3 API routes missing in backend (roles CRUD, documents, quotas) — frontend can stub with types

## Research Log

### Form Validation Stack
- **Context**: Need consistent validation across 10+ forms (onboarding, offboarding, policy builder, leave, reports, settings, holiday, flags, banking, attendance edit)
- **Sources Consulted**: react-hook-form docs, npm registry, GitHub issues
- **Findings**:
  - `react-hook-form` v7.72.0 — fully compatible with React 19, works with `useActionState`
  - `@hookform/resolvers/zod` — bridges Zod schemas to react-hook-form validation
  - Zod already in project (`packages/core` uses Zod for config validation)
- **Implications**: Adopt react-hook-form + Zod as the standard form pattern for all new forms

### Calendar Component
- **Context**: Need calendar views for attendance history, team leave calendar, holiday management
- **Sources Consulted**: react-day-picker docs, react-aria Calendar, npm downloads
- **Findings**:
  - `react-day-picker` v9.14.0 — zero deps, 6M+ weekly downloads, fully headless/unstyled
  - Supports i18n (ISO 8601, multiple locales), single/multi/range selection
  - Style-agnostic — renders cells you wrap with styled-components
  - Event overlay possible via custom day renderers
- **Implications**: Use react-day-picker for all calendar views (attendance, leave, holidays)

### Data Table Component
- **Context**: Need sortable/filterable tables for employee lists, audit logs, flag management, payroll
- **Sources Consulted**: TanStack Table docs, npm registry
- **Findings**:
  - `@tanstack/react-table` v8.21.3 — headless, supports React 19
  - Built-in: sorting, filtering, pagination, column visibility, row selection
  - Fully compatible with styled-components (no built-in CSS)
- **Implications**: Use TanStack Table for all data table needs

### styled-components 6 + React 19 Compatibility
- **Context**: Project mandates styled-components, need to verify React 19 compatibility
- **Sources Consulted**: styled-components GitHub issues, maintenance announcement
- **Findings**:
  - v6.1.x entered maintenance mode (April 2025)
  - Known issues: TypeScript `.attrs()` callbacks (#5652), ref-as-prop adjustments
  - Still receives critical fixes, safe for existing projects
- **Implications**: Continue using styled-components 6. Avoid `.attrs()` with callback functions; use object syntax instead.

### Multi-Step Form Pattern
- **Context**: Onboarding form requires multi-step wizard with per-step validation
- **Sources Consulted**: react-hook-form docs, react-multistep
- **Findings**:
  - No dominant headless wizard library
  - Best practice: react-hook-form `FormProvider` + step state + Zod schema per step
  - Each step validates only its fields before advancing
- **Implications**: Build a lightweight `useFormWizard` hook wrapping react-hook-form context

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Fresh Component Library (Option B) | New design system + new pages, reuse all hooks/queries | Clean redesign, no regression risk on existing code | More files (~40 new components) | Recommended by gap analysis |
| Incremental Extension (Option A) | Modify existing pages in-place | Fewer new files | High regression risk, hard to do "fresh" redesign | Rejected |
| Hybrid (Option C) | New design system, replace pages one at a time | Lowest risk per-phase | Temporary UI inconsistency | Viable but slower |

## Design Decisions

### Decision: Component Library Architecture
- **Context**: Need ~11 new primitives + page redesigns
- **Alternatives Considered**:
  1. Flat primitives file — add all new components to existing `primitives.ts`
  2. Component library — organized by category in `components/ui/` directory
- **Selected Approach**: Component library in `components/ui/` with barrel exports
- **Rationale**: `primitives.ts` is already growing; separating by category (forms, data-display, feedback, layout, navigation) enables parallel development and better code splitting
- **Trade-offs**: More files but better organization and maintainability

### Decision: Form Validation Pattern
- **Context**: No validation pattern exists in codebase
- **Alternatives Considered**:
  1. Manual validation with useState
  2. react-hook-form + Zod
  3. Formik + Yup
- **Selected Approach**: react-hook-form + Zod via @hookform/resolvers
- **Rationale**: Zod already in project (config validation), react-hook-form is smaller than Formik, better React 19 support
- **Trade-offs**: New dependency but de-facto standard

### Decision: Calendar Implementation
- **Context**: 3 calendar needs — attendance history, team leave, holiday management
- **Alternatives Considered**:
  1. Custom calendar from scratch
  2. react-day-picker (headless)
  3. react-big-calendar (styled)
- **Selected Approach**: react-day-picker v9 with custom styled-component wrappers
- **Rationale**: Zero deps, headless (no CSS conflicts), i18n support, 6M downloads
- **Trade-offs**: Must build overlays/event rendering, but full styling control

### Decision: Design System Generation
- **Context**: Fresh redesign with configurable WillDesign colors
- **Selected Approach**: Use ui-ux-pro-max skill to generate design system, output as configurable theme.ts
- **Rationale**: Professional design intelligence for typography pairing, color harmony, spacing rhythm
- **Trade-offs**: Must map skill output to styled-components theme object format

## Risks & Mitigations
- **styled-components maintenance mode** — Monitor for React 19 breaking changes; workaround TypeScript issues with object `.attrs()` syntax
- **3 missing API routes** — Define types in `api-routes.ts` now, implement backend endpoints in parallel or stub with mock data
- **Large scope (70-80 dev-days)** — Phase implementation: design system → admin → team → employee pages
- **i18n volume (~200+ new keys × 3 languages)** — Add keys incrementally per component; use `t()` from day one

## References
- react-hook-form: v7.72.0 — form management with React 19 support
- @hookform/resolvers: Zod adapter for react-hook-form
- react-day-picker: v9.14.0 — headless calendar for React
- @tanstack/react-table: v8.21.3 — headless data table for React
- styled-components: v6.1.x — CSS-in-JS (maintenance mode, still supported)
