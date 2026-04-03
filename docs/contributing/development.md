# Development Guide

## Prerequisites

- Node.js 20+
- Docker (for DynamoDB Local)
- Git

## Setup

```bash
git clone <repo-url>
cd hr-attendance-app
npm install
```

## Running Locally

```bash
npm run dev
```

This starts:
1. DynamoDB Local (port 8000)
2. Table creation + seed data
3. API server with Express (port 3001)
4. Vite dev server (port 5173)

## Project Structure

| Package | Purpose | AWS Deps? |
|---------|---------|-----------|
| `types` | Shared types, constants, Zod schemas | No |
| `core` | Business logic, services | No |
| `data` | DynamoDB/S3/SES/Cognito adapters | Yes |
| `api` | REST API handlers, routing | Minimal |
| `slack` | Slack message templates | No |
| `web` | React frontend | No |
| `cli` | Setup wizard, deploy CLI | Node.js |
| `infra` | AWS CDK stacks | Yes |

## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:ui       # Vitest UI
```

Tests live in `packages/<name>/__tests__/`. The project uses Vitest with TDD methodology.

## Code Style

- TypeScript strict mode
- ESLint + Prettier
- styled-components for frontend (no CSS files)
- i18n for all user-facing text (`t("key")`)
- Named constants from `@hr-attendance-app/types` (no magic strings/numbers)
- Date operations via `date-utils` (never raw `new Date()`)

## Key Rules

1. **Handlers never call repositories directly** — always go through a service
2. **Core has zero AWS dependencies** — pure business logic
3. **All API routes defined in `api-routes.ts`** — single source of truth
4. **All DynamoDB keys use `KeyPatterns`** — never inline template literals
5. **Tenant isolation enforced at repository layer** — not handlers

## Building

```bash
npm run build         # Build all packages
npm run typecheck     # TypeScript checking
npm run lint          # ESLint
```

## Adding a Feature

1. Define types in `packages/types`
2. Write service logic in `packages/core` (with tests first)
3. Add repository interface in `packages/core/src/repositories`
4. Implement repository adapter in `packages/data`
5. Add API handler in `packages/api/src/handlers`
6. Add route in `packages/api/src/routes.ts`
7. Add frontend page in `packages/web`
