# Repository Guidelines
The RosReestr Extracts workspace is an Nx-managed TypeScript monorepo for NestJS microservices. Follow these notes to keep contributions consistent and releasable.

## Project Structure & Module Organization
- Application services live under `apps/` (for example, `apps/orders-service` for gRPC handlers) with matching `*-e2e` suites configured for Jest-based end-to-end coverage.
- Shareable logic sits in `libs/` (configuration, entities, database adapters, queues); treat each entry as a versioned package and respect the Nx project boundaries defined in its `project.json`.
- Generated artifacts belong in `dist/`; never commit build output.
- TypeORM migrations and data sources live in `libs/database`, while gRPC contracts are sourced from `libs/proto` and surfaced through `libs/interfaces`.

## Build, Test, and Development Commands
- `npm run dev`: runs `nx run-many -t serve --all` to start every service with watch mode.
- `nx serve api-gateway`: launch a single service locally with hot reload.
- `nx build orders-service`: produce an optimized bundle for deployment.
- `npm run migration:run`: execute pending TypeORM migrations via `libs/database/src/data-source.ts`.
- `npm run proto:generate`: regenerate TS stubs from proto files before touching gRPC contracts.

## Coding Style & Naming Conventions
- TypeScript throughout; use 2-space indentation, single quotes, and trailing commas where ESLint requests them.
- Prefer Nx package aliases (`@rosreestr-extracts/*`) instead of deep relative paths.
- DTOs, entities, and providers use PascalCase class names; filenames should mirror the primary export (`orders.module.ts`, `orders.service.ts`).
- Run `nx lint <project>` (or `npm run lint` for all) before committing to keep CI green.

## Testing Guidelines
- Place Jest specs alongside source files with a `.spec.ts` suffix; leverage existing factories in `libs/utils` for fixtures.
- `nx test <project>` covers unit and integration suites, while `nx e2e <project>-e2e` runs Jest-driven end-to-end tests.
- Add tests for new gRPC contracts, queue workers, and migration logic; keep coverage parity by running `nx test <project> --codeCoverage` when adding modules.

## Commit & Pull Request Guidelines
- Follow the Conventional Commit pattern seen in history (`feat(orders):`, `fix(nx):`, `fx(api-gw):`).
- Keep commits scoped: code + tests + schema changes together; avoid formatting-only commits unless they unblock ESLint/Prettier.
- PR descriptions must explain the change, list impacted services, reference Jira/GitHub issues, and attach CLI output or screenshots for API-affecting changes.
- Confirm migrations and proto artifacts are regenerated or explicitly note why no regeneration was required.
