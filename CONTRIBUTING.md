# Contributing

Thanks for your interest in contributing to the HR Attendance App!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature`
5. Make changes and write tests
6. Run checks: `npm test && npm run typecheck && npm run lint`
7. Commit and push
8. Open a pull request

## Development Setup

See [docs/contributing/development.md](docs/contributing/development.md) for the full local setup guide.

## Code Style

- TypeScript strict mode everywhere
- ESLint + Prettier for formatting
- TDD — write tests before implementation
- Hexagonal architecture — core has zero AWS dependencies
- All user-facing text uses i18n `t()` calls
- Named constants from `@hr-attendance-app/types` (no magic strings)
- styled-components for frontend styling (no CSS files)

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Include tests for new functionality
- Update documentation if behavior changes
- All CI checks must pass (lint, typecheck, tests, config validation)

## Adding a New Region

See [docs/contributing/adding-a-region.md](docs/contributing/adding-a-region.md) for the tutorial.

## Reporting Issues

Use GitHub Issues with the provided templates:
- **Bug Report** — for bugs and unexpected behavior
- **Feature Request** — for new functionality ideas
- **Region Request** — for adding support for a new country/region

## Code of Conduct

Be respectful, constructive, and welcoming. We are all here to build something useful.
