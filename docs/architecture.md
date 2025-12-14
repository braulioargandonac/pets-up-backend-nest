# Architecture Overview - PetsUp Backend

## Design Philosophy
We follow **Clean Architecture** principles adapted for NestJS modules.
- **Separation of Concerns:** Data access (Prisma) is isolated from HTTP Transport (Controllers).
- **Dependency Injection:** All services and repositories are injected.

## Module Structure
- **DTOs (`*.dto.ts`):** Data boundaries. Validate input rigorously using `class-validator`.
- **Entities:** Prisma generated types are the source of truth for DB shapes.
- **Services (`*.service.ts`):** Contain all business rules.
  - *Example:* The inheritance logic for `deleteAccount` lives here.
- **Controllers (`*.controller.ts`):** Route handling and serialization.

## Key Workflows
1. **User Updates (`PATCH /me`):**
   - Updates generic fields.
   - Updates relations (e.g., `Commune`) via Prisma `connect`.
   - Returns sanitized user object (no password).
2. **Account Deletion:**
   - Transactional integrity is paramount.
   - Execution order: Social Cleanup -> Dependency Cleanup -> Community Reassignment -> Private Data Deletion -> User Deletion.

## Quality Assurance
- **Unit Testing:** Co-located with source files (`.spec.ts`). Focus on Services.
- **E2E Testing:** Located in `test/`. Focus on Controllers and full HTTP flows using an in-memory or test DB container.