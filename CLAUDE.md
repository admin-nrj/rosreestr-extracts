# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

# CI Error Guidelines

If the user wants help with fixing an error in their CI pipeline, use the following flow:
- Retrieve the list of current CI Pipeline Executions (CIPEs) using the `nx_cloud_cipe_details` tool
- If there are any errors, use the `nx_cloud_fix_cipe_failure` tool to retrieve the logs for a specific task
- Use the task logs to see what's wrong and help the user fix their problem. Use the appropriate tools if necessary
- Make sure that the problem is fixed by running the task that you passed into the `nx_cloud_fix_cipe_failure` tool


<!-- nx configuration end-->

## Architecture Overview

This is a **microservices architecture** using **NestJS** with **gRPC** for inter-service communication. The project consists of:

### Services

- **api-gateway**: HTTP REST API gateway that exposes HTTP endpoints and communicates with microservices via gRPC
- **auth-service**: Authentication microservice running as a gRPC server

### Communication Pattern

- Client → HTTP → **api-gateway** → gRPC → **auth-service**
- Protocol buffer definitions in `libs/proto/src/` directory define gRPC service contracts
- Generated TypeScript types are stored in `libs/interfaces/src/` directory (generated from proto files)

### Shared Libraries

- **@rosreestr-extracts/proto**: Contains `.proto` files for gRPC service contracts
- **@rosreestr-extracts/interfaces**: Contains generated TypeScript types from proto files
- **@rosreestr-extracts/config**: Configuration files (JWT, database, app settings)
- **@rosreestr-extracts/crypto**: Cryptography service (password hashing with bcrypt)
- **@rosreestr-extracts/database**: TypeORM database module
- **@rosreestr-extracts/entities**: Shared database entities (BaseEntity, UserEntity, etc.)

## Development Commands

### Building

```bash
# Build a specific service
nx build api-gateway
nx build auth-service

# Build with development configuration
nx build api-gateway --configuration=development
```

### Running Services

```bash
# Serve api-gateway (HTTP gateway)
nx serve api-gateway

# Serve auth-service (gRPC microservice)
nx serve auth-service

# Both use development configuration by default
```

### Testing

```bash
# Run tests for a specific service
nx test api-gateway
nx test auth-service

# Run all tests
nx run-many --target=test

# Run affected tests only
nx affected --target=test
```

### Linting

```bash
# Lint a specific service
nx lint api-gateway
nx lint auth-service

# Lint all
nx run-many --target=lint
```

## Protocol Buffers (gRPC)

### Generating TypeScript from Proto Files

Proto files are located in `libs/proto/src/` directory. To regenerate TypeScript types:

```bash
npm run proto:generate
```

Or manually:

```bash
protoc --ts_proto_out=./libs/interfaces/src/ --proto_path=./libs/proto/src/ ./libs/proto/src/*.proto --ts_proto_opt=nestJs=true
```

This generates type-safe gRPC service definitions and DTOs in `libs/interfaces/src/` directory.

### Adding New Proto Definitions

1. Create or modify `.proto` files in `libs/proto/src/` directory
2. Run `npm run proto:generate` to regenerate types
3. Update `libs/interfaces/src/index.ts` to export the new generated types (if needed)
4. Import generated types using `@rosreestr-extracts/interfaces`

## Project Structure Notes

- Each application has a `webpack.config.js` that bundles the app for deployment
- Services use `@nx/webpack/app-plugin` for building Node.js applications
- The `generatePackageJson: true` option in webpack config creates standalone deployable packages in `dist/`
- Applications define build targets using `nx:run-commands` executor calling `webpack-cli`

## Common Patterns

### Adding a New Microservice

1. Generate a new NestJS application: `npx nx g @nx/nest:app <service-name>`
2. Configure it as a gRPC microservice in `main.ts` using `NestFactory.createMicroservice`
3. Define the proto contract in `libs/proto/src/<service-name>.proto`
4. Generate TypeScript types using protoc (see Protocol Buffers section)
5. Update `libs/interfaces/src/index.ts` to export the new types
6. Connect to it from api-gateway using NestJS microservices ClientProxy
7. Import types from `@rosreestr-extracts/interfaces`

### Authentication Flow

- REST endpoints in api-gateway's AuthController handle HTTP requests
- api-gateway communicates with auth-service via gRPC for authentication logic
- Proto definition in `libs/proto/src/auth.proto` defines the AuthService gRPC contract

## Data Access Layer (DAL)

### Database Setup

The project uses **TypeORM** with **PostgreSQL** for data persistence.

**Environment Variables:**
```bash
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=rosreestr_extracts
DB_LOGGING=false
NODE_ENV=development
```

### Database Module Usage

**In a microservice:**
```typescript
import { DatabaseModule } from '@rosreestr-extracts/database';
import { databaseConfig } from '@rosreestr-extracts/config';
import { UserEntity } from './entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig],
    }),
    DatabaseModule.forRoot({
      entities: [UserEntity],
    }),
  ],
})
export class AppModule {}
```

### Shared Entities

Use entities from `@rosreestr-extracts/entities`:

```typescript
import { UserEntity, UserRole, BaseEntity } from '@rosreestr-extracts/entities';
```

**Available Entities:**
- `BaseEntity` - Abstract base class with common fields (id, createdAt, updatedAt, deletedAt)
- `UserEntity` - User entity with email, passwordHash, name, role, isActive, emailVerified, lastLoginAt

### Creating Custom Entities

For service-specific entities, extend `BaseEntity`:

```typescript
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@rosreestr-extracts/entities';

@Entity('custom_entity')
export class CustomEntity extends BaseEntity {
  @Column({ unique: true })
  someField: string;
}
```

### Repository Pattern

**Repository Interface:**
```typescript
export interface IUserRepository {
  findById(id: number): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(data: CreateUserDto): Promise<UserEntity>;
}
```

**Repository Implementation:**
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async findById(id: number): Promise<UserEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.repository.findOne({ where: { email } });
  }

  async create(data: CreateUserDto): Promise<UserEntity> {
    const user = this.repository.create(data);
    return this.repository.save(user);
  }
}
```

**Register Repository:**
```typescript
import { DatabaseModule } from '@rosreestr-extracts/database';

@Module({
  imports: [DatabaseModule.forFeature([UserEntity])],
  providers: [UserRepository],
  exports: [UserRepository],
})
export class DalModule {}
```

### Database per Service Pattern

Each microservice should have its own database:
- `auth_service_db` — for auth-service
- `rosreestr_service_db` — for other services

Configure via `DB_NAME` environment variable per service.

## Database Migrations

### Migration Scripts

The project uses TypeORM migrations for database schema management.

**Available commands:**
```bash
# Create a new migration (manual)
npm run migration:create libs/database/src/migrations/MigrationName

# Generate migration from entity changes (auto-detect)
npm run migration:generate libs/database/src/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

### Environment Variables for Migrations

```bash
DB_MIGRATIONS_RUN=true  # Auto-run migrations on app start (use with caution)
```

### Creating a Migration

**Method 1: Manual creation**
```bash
npm run migration:create libs/database/src/migrations/AddUserPhoneColumn
```

**Method 2: Auto-generate from entity changes**
```bash
# After modifying entities, generate migration
npm run migration:generate libs/database/src/migrations/UpdateUserEntity
```

### Migration Structure

Migrations are stored in `libs/database/src/migrations/`:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1728400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create tables, add columns, etc.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert changes
  }
}
```

### Running Migrations

**Development:**
```bash
npm run migration:run
```

**Production:**
Set `DB_MIGRATIONS_RUN=true` to run migrations automatically on application startup, or run manually before deployment:
```bash
npm run migration:run
```

### Best Practices

1. **Never use synchronize: true in production** - Always use migrations
2. **Test migrations** - Test both `up` and `down` methods
3. **One change per migration** - Keep migrations focused and atomic
4. **Version control** - Commit migrations with your code changes
5. **Run migrations before deployment** - Ensure database schema is up-to-date
