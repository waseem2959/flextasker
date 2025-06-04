/**
 * Socket Event Constants
 * 
 * This file provides constants for socket event names used in the application.
 */

/**
 * Socket event names
 */
export enum SocketEvent {
  // Connection events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  CONNECT_ERROR = 'connect_error',
  RECONNECT = 'reconnect',
  RECONNECT_ATTEMPT = 'reconnect_attempt',
  RECONNECT_ERROR = 'reconnect_error',
  RECONNECT_FAILED = 'reconnect_failed',
  
  // Task related events
  NEW_TASK = 'new_task',
  TASK_UPDATE = 'task_update',
  JOIN_TASK_ROOM = 'join_task_room',
  LEAVE_TASK_ROOM = 'leave_task_room',
  
  // Bid related events
  NEW_BID = 'new_bid',
  BID_UPDATE = 'bid_update',
  SUBMIT_BID = 'submit_bid',
  UPDATE_BID = 'update_bid',
  
  // Chat related events
  JOIN_CHAT_ROOM = 'join_chat_room',
  LEAVE_CHAT_ROOM = 'leave_chat_room',
  SEND_MESSAGE = 'send_message',
  NEW_MESSAGE = 'new_message',
  
  // Notification related events
  NOTIFICATION = 'notification',
  MARK_NOTIFICATIONS_READ = 'mark_notifications_read',
  
  // User status related events
  GET_USER_STATUS = 'get_user_status',
  USER_STATUS_CHANGE = 'user_status_change',
  
  // General data sync events
  DATA_CHANGE = 'data_change',
  DATA_SYNC = 'data_sync'
}

/**
 * Socket event types for categorization
 */
export enum SocketEventType {
  CONNECTION = 'connection',
  TASK = 'task',
  BID = 'bid',
  CHAT = 'chat',
  NOTIFICATION = 'notification',
  USER = 'user',
  DATA = 'data'
}

/**
 * Maps events to their types for categorization
 */
export const eventTypeMap: Record<SocketEvent, SocketEventType> = {
  [SocketEvent.CONNECT]: SocketEventType.CONNECTION,
  [SocketEvent.DISCONNECT]: SocketEventType.CONNECTION,
  [SocketEvent.CONNECT_ERROR]: SocketEventType.CONNECTION,
  [SocketEvent.RECONNECT]: SocketEventType.CONNECTION,
  [SocketEvent.RECONNECT_ATTEMPT]: SocketEventType.CONNECTION,
  [SocketEvent.RECONNECT_ERROR]: SocketEventType.CONNECTION,
  [SocketEvent.RECONNECT_FAILED]: SocketEventType.CONNECTION,
  
  [SocketEvent.NEW_TASK]: SocketEventType.TASK,
  [SocketEvent.TASK_UPDATE]: SocketEventType.TASK,
  [SocketEvent.JOIN_TASK_ROOM]: SocketEventType.TASK,
  [SocketEvent.LEAVE_TASK_ROOM]: SocketEventType.TASK,
  
  [SocketEvent.NEW_BID]: SocketEventType.BID,
  [SocketEvent.BID_UPDATE]: SocketEventType.BID,
  [SocketEvent.SUBMIT_BID]: SocketEventType.BID,
  [SocketEvent.UPDATE_BID]: SocketEventType.BID,
  
  [SocketEvent.JOIN_CHAT_ROOM]: SocketEventType.CHAT,
  [SocketEvent.LEAVE_CHAT_ROOM]: SocketEventType.CHAT,
  [SocketEvent.SEND_MESSAGE]: SocketEventType.CHAT,
  [SocketEvent.NEW_MESSAGE]: SocketEventType.CHAT,
  
  [SocketEvent.NOTIFICATION]: SocketEventType.NOTIFICATION,
  [SocketEvent.MARK_NOTIFICATIONS_READ]: SocketEventType.NOTIFICATION,
  
  [SocketEvent.GET_USER_STATUS]: SocketEventType.USER,
  [SocketEvent.USER_STATUS_CHANGE]: SocketEventType.USER,
  
  [SocketEvent.DATA_CHANGE]: SocketEventType.DATA,
  [SocketEvent.DATA_SYNC]: SocketEventType.DATA
};
