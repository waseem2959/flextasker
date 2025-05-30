# WebSockets Module

This directory contains the consolidated WebSocket implementation for the Flextasker application. The module handles all real-time communication including notifications, chat, task updates, and user presence.

## Structure

- `index.ts` - Main entry point that exports all WebSocket functionality
- `init.ts` - Initializes the WebSocket server and integrates with Express
- `socket-manager.ts` - Manages WebSocket connections, rooms, and events
- `handlers/` - Directory containing event handlers organized by feature
  - `notification-handlers.ts` - Notification-related event handlers
  - `chat-handlers.ts` - Chat-related event handlers
  - `task-handlers.ts` - Task-related event handlers
  - `user-handlers.ts` - User presence and status event handlers

## Usage

To use the WebSocket functionality in other parts of the application:

```typescript
import { socketEvents } from '@/websockets';

// Send a notification to a user
socketEvents.emitNotification(
  userId, 
  NotificationType.TASK_UPDATED,
  'Your task has been updated',
  taskId
);

// Broadcast a task update
socketEvents.emitTaskUpdate(taskId, updatedTaskData);
```

## Authentication

WebSocket connections are authenticated using JWT tokens. The token is validated in the connection middleware, and user information is attached to the socket for use in event handlers.

## Error Handling

All WebSocket events include proper error handling and logging. Errors are monitored and logged to help with debugging and tracking issues in production.

## Type Safety

The WebSocket module uses TypeScript interfaces and types to ensure type safety throughout the implementation. This helps prevent runtime errors and provides better IDE support.
