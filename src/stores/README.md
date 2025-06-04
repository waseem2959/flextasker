# State Management Architecture

This document outlines the state management approach used in the Flextasker application, explaining the patterns, tools, and best practices we follow.

## Overview

Flextasker uses a hybrid state management approach that combines:

1. **Local Component State**: For UI-specific state that doesn't need to be shared
2. **Context API**: For theme, auth, and other app-wide state with limited updates
3. **Zustand Stores**: For complex shared state with frequent updates
4. **React Query**: For server state and data fetching

This hybrid approach allows us to use the right tool for each specific state management need, optimizing for both developer experience and application performance.

## When to Use Each Approach

### Local Component State (useState/useReducer)

Use for:
- Component-specific UI state (open/closed, hover, focus)
- Form input values before submission
- Any state that doesn't need to be shared outside the component tree

Example:
```tsx
const [isOpen, setIsOpen] = useState(false);
```

### Context API

Use for:
- Theme/appearance settings
- Authentication state
- User preferences
- Localization/internationalization
- Any app-wide state that changes infrequently

Example:
```tsx
const { theme, toggleTheme } = useTheme();
```

### Zustand Stores

Use for:
- Complex shared state that changes frequently
- State that needs to be accessed by many unrelated components
- State that requires middleware (persistence, devtools, etc.)
- When you need to access state outside React components

Example:
```tsx
const { tasks, addTask, removeTask } = useTaskStore();
```

### React Query

Use for:
- Server data fetching and caching
- Mutation operations (POST, PUT, DELETE)
- Any data that comes from an API
- Managing loading, error, and success states for async operations

Example:
```tsx
const { data, isLoading, error } = useQuery(['tasks'], fetchTasks);
```

## Folder Structure

```
src/
  stores/              # Zustand stores
    auth-store.ts      # Authentication state
    task-store.ts      # Task-related state
    ui-store.ts        # UI-related state
    index.ts           # Re-exports
  
  contexts/            # React Context providers
    ThemeContext.tsx   # Theme context
    AuthContext.tsx    # Authentication context
    
  hooks/               # Custom hooks including React Query hooks
    useApi.ts          # API fetching hooks
    useTasks.ts        # Task-related data fetching
```

## Zustand Store Pattern

We follow a standard pattern for all Zustand stores:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the store state type
interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  addTask: (task: Task) => void;
  removeTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  fetchTasks: () => Promise<void>;
}

// Create the store
export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      // Initial state
      tasks: [],
      isLoading: false,
      error: null,
      
      // Actions
      addTask: (task) => set((state) => ({ 
        tasks: [...state.tasks, task] 
      })),
      
      removeTask: (id) => set((state) => ({ 
        tasks: state.tasks.filter(task => task.id !== id) 
      })),
      
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === id ? { ...task, ...updates } : task
        )
      })),
      
      fetchTasks: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.get('/tasks');
          set({ tasks: response.data, isLoading: false });
        } catch (error) {
          set({ error: error as Error, isLoading: false });
        }
      }
    }),
    {
      name: 'task-store', // localStorage key
      partialize: (state) => ({ tasks: state.tasks }), // Only persist tasks
    }
  )
);
```

## Best Practices

1. **State Colocation**: Keep state as close as possible to where it's used
2. **Avoid Prop Drilling**: Use context or stores instead of passing props deeply
3. **Minimize Context Providers**: Combine related state to avoid provider nesting
4. **Selective State Updates**: Only update what changes to avoid re-renders
5. **Persist Important State**: Use persistence for user preferences and auth state
6. **TypeScript**: Always define types for state and actions
7. **Selectors**: Use selectors to access specific pieces of state
8. **DevTools**: Enable devtools in development for debugging

## Performance Considerations

1. **Memoization**: Use `useMemo` and `useCallback` for expensive calculations or to prevent unnecessary re-renders
2. **Selective Updates**: Split stores into smaller pieces to prevent unnecessary updates
3. **Derived State**: Calculate derived state in selectors rather than storing it
4. **Batch Updates**: Group multiple state updates together when possible
5. **Debounce/Throttle**: Limit frequent updates for performance-sensitive operations

## Common Patterns

### Loading States

```typescript
// In the store
{
  isLoading: false,
  setLoading: (loading: boolean) => set({ isLoading: loading })
}

// In the component
const isLoading = useStore((state) => state.isLoading);
```

### Error Handling

```typescript
// In the store
{
  error: null as Error | null,
  setError: (error: Error | null) => set({ error }),
  clearError: () => set({ error: null })
}

// In the component
const error = useStore((state) => state.error);
```

### Optimistic Updates

```typescript
// In the store
updateTask: async (id, updates) => {
  // Store the original state for rollback
  const originalTasks = get().tasks;
  
  // Apply optimistic update
  set({
    tasks: originalTasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    )
  });
  
  try {
    // Attempt the actual update
    await apiClient.patch(`/tasks/${id}`, updates);
  } catch (error) {
    // Rollback on failure
    set({ 
      tasks: originalTasks,
      error: error as Error
    });
  }
}
```

## Migration Path

When refactoring existing state management:

1. Identify which state should live in which system
2. Create the appropriate store or context
3. Replace direct state usage with hooks
4. Test thoroughly to ensure no regressions

By following these patterns and guidelines, we can maintain a clean, performant, and maintainable state management system throughout the application.
