# @repo/common Package

Shared common utilities, base classes, and constants for all microservices in the PBL6 monorepo.

## 📦 Package Structure

```
packages/common/
├── src/
│   ├── constants/           # App config, message patterns, error/success messages
│   │   ├── app.constant.ts
│   │   ├── patterns/        # RPC message patterns organized by service
│   │   │   ├── users-service.pattern.ts
│   │   │   ├── chats-service.pattern.ts
│   │   │   ├── classes-service.pattern.ts
│   │   │   ├── exams-service.pattern.ts
│   │   │   └── meetings-service.pattern.ts
│   │   └── messages/        # Error and success messages
│   │       ├── error-messages.constant.ts
│   │       └── success-messages.constant.ts
│   ├── dto/                 # Shared DTOs (pagination, response)
│   ├── exceptions/          # Business exceptions (BusinessException, codes)
│   ├── filters/             # Global exception filters
│   └── repositories/        # Base repository with comprehensive CRUD
│       ├── repository.interface.ts
│       └── base.repository.ts
├── package.json
└── tsconfig.json
```

## 🚀 Installation & Usage

### In a microservice app (e.g., users-service):

```typescript
// Import from @repo/common
import {
  // Repository
  BaseRepository,
  IBaseRepository,
  PaginatedResult,

  // Exceptions
  BusinessException,
  ErrorCodes,

  // Constants
  USER_PATTERNS,
  ROLE_PATTERNS,
  USER_ERRORS,
  ROLE_ERRORS,
  APP_CONFIG,

  // DTOs
  PaginationDto,
  ResponseDto,
} from '@repo/common';
```

### Example: Creating a Repository

```typescript
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersRepository extends BaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput,
  Prisma.UserWhereInput,
  Prisma.UserOrderByWithRelationInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'user', 'user_id');
  }

  // Add custom methods here
  async findByEmail(email: string): Promise<User | null> {
    return this.findFirst({ email });
  }
}
```

### Example: Using Constants

```typescript
import { USER_PATTERNS, USER_ERRORS, USER_SUCCESS } from '@repo/common';

// In a controller
@MessagePattern(USER_PATTERNS.GET_USER)
async getUser(userId: number) {
  const user = await this.usersService.findById(userId);
  if (!user) {
    throw new BusinessException(USER_ERRORS.NOT_FOUND, ErrorCodes.NOT_FOUND);
  }
  return { message: USER_SUCCESS.FOUND, data: user };
}
```

## 📋 Available Exports

### Base Repository Methods

| Method | Description |
|--------|-------------|
| `create(data)` | Create a new entity |
| `createMany(data[])` | Create multiple entities |
| `findById(id)` | Find entity by ID |
| `findByIdWithOptions(id, options)` | Find by ID with include/select |
| `findAll(where?, skip?, take?)` | Find all with basic pagination |
| `findAllPaginated(options)` | Find all with full pagination support |
| `findMany(options)` | Find with full query options |
| `findFirst(where)` | Find first matching entity |
| `findUnique(where)` | Find unique entity |
| `update(id, data)` | Update entity by ID |
| `updateMany(where, data)` | Update multiple entities |
| `upsert(options)` | Create or update entity |
| `delete(id)` | Delete entity by ID |
| `deleteMany(where)` | Delete multiple entities |
| `softDelete(id)` | Soft delete (set deletedAt) |
| `count(where?)` | Count entities |
| `exists(id)` | Check if entity exists |
| `aggregate(options)` | Aggregate operations (sum, avg, etc.) |
| `groupBy(options)` | Group by operation |
| `runTransaction(fn)` | Execute within transaction |
| `queryRaw(query, ...values)` | Execute raw SQL query |
| `executeRaw(query, ...values)` | Execute raw SQL command |

### Message Patterns by Service

| Service | Pattern Group | Example |
|---------|--------------|---------|
| Users | `USER_PATTERNS`, `AUTH_PATTERNS`, `ROLE_PATTERNS`, `PERMISSION_PATTERNS` | `USER_PATTERNS.GET_USER` |
| Chats | `CONVERSATION_PATTERNS`, `MESSAGE_PATTERNS` | `CONVERSATION_PATTERNS.CREATE` |
| Classes | `CLASS_PATTERNS`, `POST_PATTERNS`, `MATERIAL_PATTERNS` | `CLASS_PATTERNS.GET_BY_ID` |
| Exams | `EXAM_PATTERNS`, `QUESTION_PATTERNS`, `SUBMISSION_PATTERNS` | `EXAM_PATTERNS.SUBMIT` |
| Meetings | `MEETING_PATTERNS` | `MEETING_PATTERNS.JOIN` |

### Error/Success Messages

```typescript
// Error messages
USER_ERRORS.NOT_FOUND           // "User not found"
ROLE_ERRORS.ALREADY_EXISTS(name) // "Role 'admin' already exists"
DATABASE_ERRORS.UNIQUE_CONSTRAINT // "Unique constraint violation"

// Success messages
USER_SUCCESS.CREATED   // "User created successfully"
AUTH_SUCCESS.LOGIN     // "Login successful"
ROLE_SUCCESS.LIST      // "Roles retrieved successfully"
```

## 🔧 How Packages Work

### Local Development (without Docker)

1. Build the package first:
   ```bash
   cd packages/common
   npm run build
   ```

2. Other apps reference it via workspace protocol in `package.json`:
   ```json
   {
     "dependencies": {
       "@repo/common": "*"
     }
   }
   ```

3. TypeScript resolves imports through `paths` in tsconfig:
   ```json
   {
     "paths": {
       "@repo/common": ["../../packages/common/src"],
       "@repo/common/*": ["../../packages/common/src/*"]
     }
   }
   ```

### Docker Development

In Docker, packages are copied into the container and built during image build or container start:

```dockerfile
# Copy packages first
COPY packages/ ./packages/

# Build packages
RUN npm run build --workspace=packages/common
```

Or use an entrypoint script that rebuilds on startup:
```bash
#!/bin/bash
cd /app/packages/common && npm run build
cd /app/packages/types && npm run build
exec "$@"
```

### Key Points

1. **Workspace Protocol**: `"@repo/common": "*"` tells npm to use the local workspace package
2. **Build Order**: Packages must be built before apps that depend on them
3. **Hot Reload**: Changes to source files require rebuilding the package
4. **Type Safety**: Full TypeScript support with declaration files
5. **Tree Shaking**: Only imports what you use

## 🔄 Development Workflow

1. Make changes to package source (`packages/common/src/`)
2. Rebuild the package: `npm run build -w packages/common`
3. Changes are immediately available to all apps
4. For Docker: restart containers or use entrypoint to rebuild

## 📝 Adding New Features

### Adding a new message pattern:

1. Add to appropriate service pattern file (`patterns/xxx-service.pattern.ts`)
2. Export from `patterns/index.ts` if needed
3. Rebuild package

### Adding a new error message:

1. Add to `messages/error-messages.constant.ts`
2. Add to `ERROR_MESSAGES` grouped export if needed
3. Rebuild package

### Adding a new base repository method:

1. Add interface to `repositories/repository.interface.ts`
2. Implement in `repositories/base.repository.ts`
3. Rebuild package
