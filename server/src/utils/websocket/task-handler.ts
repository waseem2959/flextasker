/**
 * Task WebSocket Handler
 * 
 * Manages real-time task events via WebSocket.
 * Handles task updates, bids, and status changes.
 */

import { PrismaClient } from '@prisma/client';
import { AuthenticatedSocket, SocketEvent, SocketRoom, socketManager } from './socket-manager';
import { logger } from '../logger';
import { cacheService, CachePrefix } from '../cache';
import { notificationHandler, NotificationType } from './notification-handler';
import { TaskStatus, BidStatus } from '../../../../shared/types/enums';

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * Task handler for WebSocket events
 */
export class TaskHandler {
  /**
   * Set up task event handlers for a socket
   */
  public setupEvents(socket: AuthenticatedSocket): void {
    if (!socket.user) return;
    
    const userId = socket.user.id;
    
    // Get user's tasks and join their rooms
    this.joinUserTaskRooms(socket);
    
    logger.debug('Task event handlers set up', { userId });
  }
  
  /**
   * Join a user to their task rooms (tasks they own or are assigned to)
   */
  private async joinUserTaskRooms(socket: AuthenticatedSocket): Promise<void> {
    if (!socket.user) return;
    
    try {
      const userId = socket.user.id;
      
      // Find all tasks the user is involved with
      const tasks = await prisma.task.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { assigneeId: userId }
          ]
        },
        select: { id: true }
      });
      
      // Join each task room
      for (const task of tasks) {
        socketManager.joinRoom(socket, `${SocketRoom.TASK}${task.id}`);
      }
      
      logger.debug('User joined task rooms', { 
        userId, 
        count: tasks.length 
      });
    } catch (error) {
      logger.error('Failed to join user to task rooms', { 
        userId: socket.user.id, 
        error 
      });
    }
  }
  
  /**
   * Notify about task creation
   */
  public async notifyTaskCreated(task: any): Promise<void> {
    try {
      // Store the task in cache
      await cacheService.set(`${CachePrefix.TASK}${task.id}`, task, 60 * 15); // 15 minutes
      
      // Broadcast to potential taskers matching the category
      socketManager.broadcast(SocketEvent.TASK_CREATED, {
        id: task.id,
        title: task.title,
        description: task.description,
        budget: task.budget,
        categoryId: task.categoryId,
        ownerId: task.ownerId,
        owner: task.owner,
        status: task.status,
        createdAt: task.createdAt
      });
      
      // Send notifications to potential taskers
      await notificationHandler.notifyTaskCreated(task);
      
      logger.debug('Task creation event broadcasted', { taskId: task.id });
    } catch (error) {
      logger.error('Failed to notify task creation', { task, error });
    }
  }
  
  /**
   * Notify about task update
   */
  public async notifyTaskUpdated(task: any, changes: string[]): Promise<void> {
    try {
      // Invalidate task cache
      await cacheService.delete(`${CachePrefix.TASK}${task.id}`);
      await cacheService.deletePattern(`${CachePrefix.LIST}tasks:*`);
      
      // Emit to task room
      socketManager.emitToTask(task.id, SocketEvent.TASK_UPDATED, {
        id: task.id,
        changes,
        updatedFields: task
      });
      
      logger.debug('Task update event emitted', { taskId: task.id, changes });
    } catch (error) {
      logger.error('Failed to notify task update', { task, error });
    }
  }
  
  /**
   * Notify about task status change
   */
  public async notifyTaskStatusChanged(task: any, previousStatus: TaskStatus): Promise<void> {
    try {
      // Invalidate task cache
      await cacheService.delete(`${CachePrefix.TASK}${task.id}`);
      await cacheService.deletePattern(`${CachePrefix.LIST}tasks:*`);
      await cacheService.deletePattern(`${CachePrefix.USER}${task.ownerId}:tasks*`);
      
      if (task.assigneeId) {
        await cacheService.deletePattern(`${CachePrefix.USER}${task.assigneeId}:tasks*`);
      }
      
      // Emit to task room
      socketManager.emitToTask(task.id, SocketEvent.TASK_STATUS_CHANGED, {
        id: task.id,
        previousStatus,
        newStatus: task.status,
        updatedAt: task.updatedAt
      });
      
      // Also notify owner and assignee individually
      socketManager.emitToUser(task.ownerId, SocketEvent.TASK_STATUS_CHANGED, {
        id: task.id,
        previousStatus,
        newStatus: task.status,
        updatedAt: task.updatedAt
      });
      
      if (task.assigneeId) {
        socketManager.emitToUser(task.assigneeId, SocketEvent.TASK_STATUS_CHANGED, {
          id: task.id,
          previousStatus,
          newStatus: task.status,
          updatedAt: task.updatedAt
        });
      }
      
      // Send notifications to relevant users
      await notificationHandler.notifyTaskStatusChanged(task, previousStatus);
      
      logger.debug('Task status change event emitted', { 
        taskId: task.id, 
        previousStatus, 
        newStatus: task.status 
      });
    } catch (error) {
      logger.error('Failed to notify task status change', { task, error });
    }
  }
  
  /**
   * Notify about task deletion
   */
  public async notifyTaskDeleted(task: any): Promise<void> {
    try {
      // Invalidate task cache
      await cacheService.delete(`${CachePrefix.TASK}${task.id}`);
      await cacheService.deletePattern(`${CachePrefix.TASK}${task.id}:*`);
      await cacheService.deletePattern(`${CachePrefix.LIST}tasks:*`);
      await cacheService.deletePattern(`${CachePrefix.USER}${task.ownerId}:tasks*`);
      
      if (task.assigneeId) {
        await cacheService.deletePattern(`${CachePrefix.USER}${task.assigneeId}:tasks*`);
      }
      
      // Emit to task room
      socketManager.emitToTask(task.id, SocketEvent.TASK_DELETED, {
        id: task.id,
        title: task.title
      });
      
      // Notify assignee if task was assigned
      if (task.assigneeId) {
        await notificationHandler.createNotification({
          userId: task.assigneeId,
          type: NotificationType.TASK_UPDATED,
          title: 'Task Deleted',
          message: `Task "${task.title}" has been deleted by the owner`,
          data: {
            taskId: task.id,
            taskTitle: task.title
          }
        });
      }
      
      logger.debug('Task deletion event emitted', { taskId: task.id });
    } catch (error) {
      logger.error('Failed to notify task deletion', { task, error });
    }
  }
  
  /**
   * Notify about new bid
   */
  public async notifyBidCreated(bid: any, task: any): Promise<void> {
    try {
      // Invalidate related caches
      await cacheService.deletePattern(`${CachePrefix.TASK}${task.id}:bids*`);
      
      // Emit to task room
      socketManager.emitToTask(task.id, SocketEvent.BID_CREATED, {
        id: bid.id,
        taskId: task.id,
        bidderId: bid.bidderId,
        bidder: bid.bidder,
        amount: bid.amount,
        message: bid.message,
        status: bid.status,
        createdAt: bid.createdAt
      });
      
      // Notify task owner
      await notificationHandler.notifyBidReceived(bid, task);
      
      logger.debug('Bid creation event emitted', { 
        bidId: bid.id, 
        taskId: task.id 
      });
    } catch (error) {
      logger.error('Failed to notify bid creation', { bid, task, error });
    }
  }
  
  /**
   * Notify about bid update
   */
  public async notifyBidUpdated(bid: any, task: any, changes: string[]): Promise<void> {
    try {
      // Invalidate related caches
      await cacheService.delete(`${CachePrefix.BID}${bid.id}`);
      await cacheService.deletePattern(`${CachePrefix.TASK}${task.id}:bids*`);
      
      // Emit to task room
      socketManager.emitToTask(task.id, SocketEvent.BID_UPDATED, {
        id: bid.id,
        taskId: task.id,
        changes,
        updatedFields: {
          amount: bid.amount,
          message: bid.message,
          status: bid.status,
          updatedAt: bid.updatedAt
        }
      });
      
      logger.debug('Bid update event emitted', { 
        bidId: bid.id, 
        taskId: task.id,
        changes
      });
    } catch (error) {
      logger.error('Failed to notify bid update', { bid, task, error });
    }
  }
  
  /**
   * Notify about bid acceptance
   */
  public async notifyBidAccepted(bid: any, task: any): Promise<void> {
    try {
      // Invalidate related caches
      await cacheService.delete(`${CachePrefix.BID}${bid.id}`);
      await cacheService.delete(`${CachePrefix.TASK}${task.id}`);
      await cacheService.deletePattern(`${CachePrefix.TASK}${task.id}:*`);
      await cacheService.deletePattern(`${CachePrefix.USER}${bid.bidderId}:*`);
      await cacheService.deletePattern(`${CachePrefix.USER}${task.ownerId}:*`);
      await cacheService.deletePattern(`${CachePrefix.LIST}tasks:*`);
      
      // Emit to task room
      socketManager.emitToTask(task.id, SocketEvent.BID_ACCEPTED, {
        bidId: bid.id,
        taskId: task.id,
        bidderId: bid.bidderId,
        ownerId: task.ownerId,
        newTaskStatus: task.status
      });
      
      // Notify bidder
      await notificationHandler.notifyBidAccepted(bid, task);
      
      // Also notify other bidders that the task is no longer available
      const otherBids = await prisma.bid.findMany({
        where: { 
          taskId: task.id,
          id: { not: bid.id }
        },
        select: { 
          id: true, 
          bidderId: true
        }
      });
      
      // Update all other bids to rejected status
      await prisma.bid.updateMany({
        where: {
          taskId: task.id,
          id: { not: bid.id },
          status: BidStatus.PENDING
        },
        data: { status: BidStatus.REJECTED }
      });
      
      // Notify each bidder their bid was rejected
      for (const otherBid of otherBids) {
        socketManager.emitToUser(otherBid.bidderId, SocketEvent.BID_REJECTED, {
          bidId: otherBid.id,
          taskId: task.id,
          reason: 'Another bid was accepted'
        });
        
        await notificationHandler.createNotification({
          userId: otherBid.bidderId,
          type: NotificationType.BID_REJECTED,
          title: 'Bid Not Selected',
          message: `Your bid for task "${task.title}" was not selected. Another tasker has been assigned.`,
          data: {
            bidId: otherBid.id,
            taskId: task.id,
            taskTitle: task.title
          }
        });
      }
      
      logger.debug('Bid acceptance event emitted', { 
        bidId: bid.id, 
        taskId: task.id,
        otherBidsRejected: otherBids.length
      });
    } catch (error) {
      logger.error('Failed to notify bid acceptance', { bid, task, error });
    }
  }
  
  /**
   * Notify about bid withdrawal
   */
  public async notifyBidWithdrawn(bid: any, task: any): Promise<void> {
    try {
      // Invalidate related caches
      await cacheService.delete(`${CachePrefix.BID}${bid.id}`);
      await cacheService.deletePattern(`${CachePrefix.TASK}${task.id}:bids*`);
      await cacheService.deletePattern(`${CachePrefix.USER}${bid.bidderId}:bids*`);
      
      // Emit to task room
      socketManager.emitToTask(task.id, SocketEvent.BID_WITHDRAWN, {
        id: bid.id,
        taskId: task.id,
        bidderId: bid.bidderId
      });
      
      // Notify task owner
      await notificationHandler.createNotification({
        userId: task.ownerId,
        type: NotificationType.BID_REJECTED, // Reusing this type for withdrawn bids
        title: 'Bid Withdrawn',
        message: `A bidder has withdrawn their bid for your task "${task.title}"`,
        data: {
          bidId: bid.id,
          taskId: task.id,
          taskTitle: task.title,
          bidderId: bid.bidderId
        }
      });
      
      logger.debug('Bid withdrawal event emitted', { 
        bidId: bid.id, 
        taskId: task.id 
      });
    } catch (error) {
      logger.error('Failed to notify bid withdrawal', { bid, task, error });
    }
  }
  
  /**
   * Join user to a specific task room
   */
  public joinTaskRoom(socket: AuthenticatedSocket, taskId: string): void {
    if (!socket.user) return;
    
    socketManager.joinRoom(socket, `${SocketRoom.TASK}${taskId}`);
    logger.debug('User joined specific task room', { 
      userId: socket.user.id, 
      taskId 
    });
  }
}

// Export singleton instance
export const taskHandler = new TaskHandler();

export default taskHandler;
