/**
 * Socket Event Constants
 * 
 * This file provides string constants for socket event names used in the application.
 * These are separate from the SocketEventType enum which is for event type categorization.
 */

// Socket event name constants
export const SocketEvent = {
  // Task related events
  NEW_TASK: 'new_task',
  TASK_UPDATE: 'task_update',
  JOIN_TASK_ROOM: 'join_task_room',
  LEAVE_TASK_ROOM: 'leave_task_room',
  
  // Bid related events
  NEW_BID: 'new_bid',
  BID_UPDATE: 'bid_update',
  SUBMIT_BID: 'submit_bid',
  UPDATE_BID: 'update_bid',
  
  // Chat related events
  JOIN_CHAT_ROOM: 'join_chat_room',
  LEAVE_CHAT_ROOM: 'leave_chat_room',
  SEND_MESSAGE: 'send_message',
  
  // Notification related events
  NOTIFICATION: 'notification',
  MARK_NOTIFICATIONS_READ: 'mark_notifications_read',
  
  // User status related events
  GET_USER_STATUS: 'get_user_status',
  USER_STATUS_CHANGE: 'user_status_change'
};
