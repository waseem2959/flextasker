# Flextasker TypeScript Migration Guide

This guide documents the TypeScript improvements implemented in the Flextasker project and provides guidance on how to migrate existing code to use the new patterns.

## Core Improvements

### 1. Centralized Type Definitions

- **Enums**: All enums are now defined in `src/types/enums.ts` for consistent reference
- **Models**: Core data models are consolidated in `src/types/models.ts`
- **Discriminated Unions**: Task types now use discriminated unions in `src/types/task.ts`

### 2. Consolidated API Services

- API services have been consolidated with enhanced TypeScript patterns in `src/services/api/*.service.ts`
- Improved error handling with proper TypeScript types
- Consistent patterns for data fetching and state management
- Type-safe request and response interfaces

### 3. Type Guards and Adapters

- Type guards in `src/utils/type-guards.ts` for runtime type checking
- Type adapters in `src/utils/type-adapters.ts` for converting between different type representations
- Functions like `isOpenTask()`, `isCompletedTask()`, etc. for safe type narrowing

## Migration Steps

### Step 1: Update Imports

Replace string literal types with enum imports:

```typescript
// Before
function handleStatus(status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED') {
  // ...
}

// After
import { TaskStatus } from '@/types/enums';

function handleStatus(status: TaskStatus) {
  // ...
}
```

### Step 2: Use Enhanced Hooks

All hooks have been consolidated with both naming conventions supported for backward compatibility. You can use either the original hooks or the enhanced hooks - they now provide the same functionality:

```typescript
// Both of these are equivalent and work the same way
const { data: tasks } = useTasks(params);
const { data: tasks } = useEnhancedTasks(params);

// For new code, we recommend using the original hooks with explicit typing:
import { useTasks } from '@/hooks/use-tasks';
import { TaskSearchParams } from '@/services/api';

// Type-safe, with proper error handling and caching
const { data: tasks, isLoading, error } = useTasks({ status: TaskStatus.OPEN });
```

### Step 3: Consolidated Services and Hooks

As part of our TypeScript improvements, we've consolidated the enhanced services and hooks with the original implementations. This consolidation offers several benefits:

- **Simplified Imports**: No need to decide between original vs. enhanced imports
- **Consistent API**: All hooks follow the same patterns and naming conventions
- **Dual Naming Support**: Both naming conventions (e.g., `useTasks` and `useEnhancedTasks`) are supported
- **Improved Maintenance**: Single implementation means easier updates and bug fixes

To migrate to the consolidated hooks:

1. If you were using `use-enhanced-*.ts` hooks, update your imports:

```typescript
// Before
import { useEnhancedTasks } from '@/hooks/use-enhanced-tasks';

// After
import { useEnhancedTasks } from '@/hooks/use-tasks';
```

2. All enhanced hook functionality is now available in the original hooks as well:

```typescript
// Both provide the same functionality with strong typing
import { useTasks, useEnhancedTasks } from '@/hooks/use-tasks';
```

### Step 4: Implement Type Guards

Use type guards for safer type checking:

```typescript
// Before
if (task.status === 'COMPLETED') {
  console.log(task.completionDate);
}

// After
import { isCompletedTask } from '@/utils/type-guards';

if (isCompletedTask(task)) {
  // TypeScript knows task is CompletedTask type
  console.log(task.completionDate); // No type error
}
```

### Step 6: Convert Task Types

When working with tasks, use the adapter functions:

```typescript
// For new code that needs to use the discriminated union pattern
import { ensureDiscriminatedTask } from '@/utils/type-adapters';

// Convert regular task to discriminated union format
const enhancedTask = ensureDiscriminatedTask(regularTask);

// For backward compatibility
import { ensureRegularTask } from '@/utils/type-adapters';

// Convert back to regular task format for legacy code
const regularTask = ensureRegularTask(enhancedTask);
```

### Step 7: Use Enhanced Components

Replace old components with enhanced versions:

- `TaskCard` → Enhanced with proper type safety
- `TaskDetailView` → New component with discriminated unions
- `EnhancedTaskForm` → Form with zod validation and proper typing

## Authentication Improvements

### Enhanced Auth Hooks

```typescript
// Basic authentication
import { useAuth } from '@/hooks/use-auth';
const auth = useAuth();

// Role-based access
import { useHasRole, useRequireRole } from '@/hooks/use-auth';
import { UserRole } from '@/types/enums';

// Check if user has a specific role
const isAdmin = useHasRole(UserRole.ADMIN);

// Force role requirement (throws error if not authorized)
const user = useRequireRole(UserRole.TASKER);
```

## Best Practices

1. **Use Enums Instead of String Literals**: Always use enum values from `@/types/enums` instead of hardcoded strings
2. **Leverage Type Guards**: Use type guards for runtime type checking and safer code
3. **Consistent Error Handling**: Use the enhanced error handling patterns
4. **Centralized Types**: Add new types to the appropriate files under `src/types/`
5. **Documentation**: Add JSDoc comments to functions and types

## Future Directions

With the consolidated TypeScript services and hooks, we can now focus on further improvements:

1. **Component Migration**: Update all components to use the consolidated hooks and TypeScript patterns
2. **End-to-End Type Safety**: Ensure type safety from API to UI with consistent interfaces
3. **Form Validation**: Implement zod schemas for all forms with runtime validation
4. **Test Coverage**: Enhance test coverage for TypeScript services and hooks
5. **Performance Optimization**: Leverage TypeScript patterns for better memoization and performance

Remember that all enhanced services and hooks are now consolidated into their original counterparts. Both naming conventions are supported, but for new code, we recommend using the original hooks with explicit typing for consistency.

## Questions?

If you have questions about the migration process or need help updating a specific component, please reach out to the development team.
