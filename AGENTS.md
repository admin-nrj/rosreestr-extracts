# Repository Guidelines

## Project Structure & Module Organization
The workspace is an Nx-managed NestJS monorepo. Runtime services live under `apps/` (e.g. `apps/orders-service`) and expose gRPC endpoints; each service has matching config in `project.json` and a Jest E2E suite in `apps/<name>-e2e`. Shared capabilities belong in `libs/`, including configuration, database adapters, and messaging utilities—treat each library as an isolated package and respect its public API. Generated bundles stay in `dist/`; never check in build output. TypeORM migrations and data sources live in `libs/database`, while protobuf contracts originate in `libs/proto` and surface via `libs/interfaces`.

## Build, Test, and Development Commands
Use `npm run dev` to start every service in watch mode through `nx run-many`. For a single service, run `nx serve api-gateway` (swap the project name as needed). Produce deployable bundles with `nx build <service>`. Apply database changes via `npm run migration:run`, and regenerate gRPC stubs with `npm run proto:generate` before editing contract consumers.

## Coding Style & Naming Conventions
All code is TypeScript with 2-space indentation, single quotes, and trailing commas as enforced by ESLint/Prettier. Favor Nx aliases such as `@rosreestr-extracts/database` over deep relative paths. Match filenames to their primary export (`orders.module.ts`, `orders.service.ts`). DTOs, providers, and entities should be PascalCase classes, while private helpers stay camelCase.

## Testing Guidelines
Jest drives unit, integration, and E2E coverage. Place specs alongside source files with a `.spec.ts` suffix (`orders.service.spec.ts`). Run `nx test <project>` for unit/integration suites, `nx e2e <project>-e2e` for service-level flows, and add `--codeCoverage` when introducing new modules. Prefer factories from `libs/utils` for fixtures, and keep contract tests in sync with regenerated protobuf types.

## Commit & Pull Request Guidelines
Follow Conventional Commits (`feat(orders):`, `fix(nx):`, `chore(deps):`) and keep each commit scoped to related code, tests, and schema updates. Pull requests must describe the change, list affected services/libs, link Jira or GitHub issues, and attach CLI output or screenshots for API-visible adjustments. Confirm whether migrations or proto stubs were touched and document the verification steps taken.

## Security & Configuration Tips
Store secrets in environment variables or `.env.local`; do not commit sensitive files. Review `libs/config` for available settings before introducing new variables, and update example env files when adding new configuration keys.
