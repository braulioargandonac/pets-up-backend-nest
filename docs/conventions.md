# Coding Conventions - Backend

## Nomenclature
- **Classes:** `PascalCase` (e.g., `CommunityPetService`).
- **Methods:** Verb-noun (e.g., `createPost`, `softDeleteUser` - *if implemented*).
- **Booleans:** `isActive`, `hasRole`, `isDeleted`.
- **Interfaces:** Do not use `I` prefix.

## Error Handling Strategy
- **Prisma Errors:** Must be caught. Do not let Prisma codes (e.g., `P2002`) leak to the client.
- **Exceptions:** Use `InternalServerErrorException` for unhandled errors, `BadRequestException` for validation failures.
- **Logging:** Log the error stack trace on the server, return a user-friendly message to the client.

## Testing Standards
- **Tools:** Use `jest` as the runner.
- **Mocking:**
  - Mock `PrismaService` using `jest-mock-extended` or standard Jest mocks to avoid hitting the real DB during unit tests.
  - Test both success and failure paths (e.g., "User not found").
- **Structure:**
  - `describe('methodName')` -> `it('should return result when...')`
- **Cleanliness:** Use `beforeEach` to reset mocks.

## Data Handling
- **Inputs:** Always validate using DTOs with `@IsString`, `@IsInt`, etc.
- **Outputs:** Use `ClassSerializerInterceptor` or manual exclusion to strip sensitive fields (`password`, `resetToken`).

## Prisma Best Practices
- **Avoid:** Raw SQL queries.
- **Prefer:** `select` over `include` when fetching large datasets to reduce payload size.
- **Transactions:** Mandatory for operations affecting >1 table.