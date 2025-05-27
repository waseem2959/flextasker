/**
 * Task WebSocket Handlers
 * 
 * This module handles WebSocket events related to tasks, including
 * real-time updates for task status changes, bids, and comments.
 */

import { Socket } from 'socket.io';
import { logger } from '../../utils/logger';
import { monitorError } from '../../utils/monitoring';
import { SocketManager } from '../socket-manager';
import { PrismaClient } from '@prisma/client';
import { createNotification } from './notification-handlers';
import { 
  NotificationType, 
  TaskStatus, 
  BidStatus 
} from '../../../../shared/types/enums';

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * Registers task-related event handlers for a socket
 */
export function registerTaskHandlers(socket: Socket, socketManager: SocketManager): void {
  const user = socket.data.user;
  
  // Join task room for real-time updates
  socket.on('task:join', async (taskId) => {
    try {
      logger.debug('Socket task:join', { userId: user.id, taskId });
      
      // Validate task exists
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { id: true }
      });
      
      if (!task) {
        logger.warn('Attempt to join non-existent task room', { 
          userId: user.id, 
          taskId 
        });
        return;
      }
      
      // Join task room
      socket.join(`task:${taskId}`);
      
      logger.debug('User joined task room', { userId: user.id, taskId });
    } catch (error) {
      monitorError(error, { 
        component: 'TaskHandlers.join', 
        userId: user.id,
        taskId
      });
    }
  });
  
  // Leave task room
  socket.on('task:leave', (taskId) => {
    logger.debug('Socket task:leave', { userId: user.id, taskId });
    socket.leave(`task:${taskId}`);
  });
  
  // Submit a bid
  socket.on('task:submitBid', async (data, callback) => {
    try {
      const { taskId, amount, description, timeline } = data;
      
      logger.debug('Socket task:submitBid', { 
        userId: user.id, 
        taskId,
        amount
      });
      
      // Validate input
      if (!taskId || !amount || !description || !timeline) {
        if (typeof callback === 'function') {
          return callback({
            success: false,
            message: 'Invalid bid data'
          });
        }
        return;
      }
      
      // Validate task exists and is open
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { 
          id: true, 
          status: true, 
          ownerId: true,
          title: true
        }
      });
      
      if (!task) {
        if (typeof callback === 'function') {
          return callback({
            success: false,
            message: 'Task not found'
          });
        }
        return;
      }
      
      if (task.status !== TaskStatus.OPEN) {
        if (typeof callback === 'function') {
          return callback({
            success: false,
            message: 'This task is no longer accepting bids'
          });
        }
        return;
      }
      
      // Check if user has already submitted a bid
      const existingBid = await prisma.bid.findFirst({
        where: {
          taskId,
          bidderId: user.id
        }
      });
      
      if (existingBid) {
        if (typeof callback === 'function') {
          return callback({
            success: false,
            message: 'You have already submitted a bid for this task'
          });
        }
        return;
      }
      
      // Create bid in database
      const bid = await prisma.bid.create({
        data: {
          taskId,
          bidderId: user.id,
          amount: parseFloat(amount),
          description,
          timeline,
          status: BidStatus.PENDING
        },
        include: {
          bidder: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              averageRating: true,
              avatar: true
            }
          }
        }
      });
      
      // Notify task owner about new bid
      await createNotification(
        socketManager,
        task.ownerId,
        NotificationType.BID_RECEIVED,
        `You received a new bid on your task: ${task.title}`,
        bid.id
      );
      
      // Broadcast new bid to task room
      socketManager.sendToTask(taskId, 'task:bidReceived', bid);
      
      // Execute callback with bid
      if (typeof callback === 'function') {
        callback({
          success: true,
          data: bid
        });
      }
    } catch (error) {
      monitorError(error, { 
        component: 'TaskHandlers.submitBid', 
        userId: user.id,
        taskId: data?.taskId
      });
      
      // Return error to client
      if (typeof callback === 'function') {
        callback({
          success: false,
          message: 'Failed to submit bid'
        });
      }
    }
  });
  
  // Update task status
  socket.on('task:updateStatus', async (data, callback) => {
    try {
      const { taskId, status } = data;
      
      logger.debug('Socket task:updateStatus', { 
        userId: user.id, 
        taskId,
        status
      });
      
      // Validate input
      if (!taskId || !status) {
        if (typeof callback === 'function') {
          return callback({
            success: false,
            message: 'Invalid status update data'
          });
        }
        return;
      }
      
      // Validate task exists and user is authorized to update it
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { 
          id: true, 
          status: true, 
          ownerId: true,
          assigneeId: true,
          title: true
        }
      });
      
      if (!task) {
        if (typeof callback === 'function') {
          return callback({
            success: false,
            message: 'Task not found'
          });
        }
        return;
      }
      
      // Check if user is authorized to update task status
      const isOwner = task.ownerId === user.id;
      const isAssignee = task.assigneeId === user.id;
      
      if (!isOwner && !isAssignee) {
        if (typeof callback === 'function') {
          return callback({
            success: false,
            message: 'You are not authorized to update this task'
          });
        }
        return;
      }
      
      // Validate status transition
      const isValidTransition = validateStatusTransition(task.status, status, isOwner, isAssignee);
      
      if (!isValidTransition) {
        if (typeof callback === 'function') {
          return callback({
            success: false,
            message: 'Invalid status transition'
          });
        }
        return;
      }
      
      // Update task in database
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: { status },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          category: true
        }
      });
      
      // Create notifications based on status change
      if (status === TaskStatus.IN_PROGRESS && task.assigneeId) {
        // Notify owner that task has started
        await createNotification(
          socketManager,
          task.ownerId,
          NotificationType.TASK_STARTED,
          `Task has been started: ${task.title}`,
          taskId
        );
      } else if (status === TaskStatus.COMPLETED && task.ownerId && task.assigneeId) {
        // Notify owner that task is completed
        if (task.ownerId !== user.id) {
          await createNotification(
            socketManager,
            task.ownerId,
            NotificationType.TASK_COMPLETED,
            `Task has been marked as completed: ${task.title}`,
            taskId
          );
        }
        
        // Notify assignee if owner marked it complete
        if (task.assigneeId !== user.id) {
          await createNotification(
            socketManager,
            task.assigneeId,
            NotificationType.TASK_COMPLETED,
            `Task has been marked as completed: ${task.title}`,
            taskId
          );
        }
      } else if (status === TaskStatus.CANCELLED) {
        // Notify appropriate party about cancellation
        if (isOwner && task.assigneeId) {
          await createNotification(
            socketManager,
            task.assigneeId,
            NotificationType.TASK_CANCELLED,
            `Task has been cancelled: ${task.title}`,
            taskId
          );
        } else if (isAssignee && task.ownerId) {
          await createNotification(
            socketManager,
            task.ownerId,
            NotificationType.TASK_CANCELLED,
            `Task has been cancelled by the assignee: ${task.title}`,
            taskId
          );
        }
      }
      
      // Broadcast status update to task room
      socketManager.sendToTask(taskId, 'task:statusUpdated', {
        taskId,
        status,
        updatedBy: user.id,
        updatedAt: new Date()
      });
      
      // Execute callback with updated task
      if (typeof callback === 'function') {
        callback({
          success: true,
          data: updatedTask
        });
      }
    } catch (error) {
      monitorError(error, { 
        component: 'TaskHandlers.updateStatus', 
        userId: user.id,
        taskId: data?.taskId,
        status: data?.status
      });
      
      // Return error to client
      if (typeof callback === 'function') {
        callback({
          success: false,
          message: 'Failed to update task status'
        });
      }
    }
  });
  
  // Accept a bid
  socket.on('task:acceptBid', async (data, callback) => {
    try {
      const { bidId } = data;
      
      logger.debug('Socket task:acceptBid', { 
        userId: user.id, 
        bidId
      });
      
      // Validate input
      if (!bidId) {
        if (typeof callback === 'function') {
          return callback({
            success: false,
            message: 'Invalid bid data'
          });
        }
        return;
      }
      
      // Validate bid exists
      const bid = await prisma.bid.findUnique({
        where: { id: bidId },
        include: {
          task: {
            select: {
              id: true,
              ownerId: true,
              status: true,
              title: true
            }
          },
          bidder: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });
      
      if (!bid) {
        if (typeof callback === 'function') {
          return callback({
            success: false,
            message: 'Bid not found'
          });
        }
        return;
      }
      
      // Check if user is the task owner
      if (bid.task.ownerId !== user.id) {
        if (typeof callback === 'function') {
          return callback({
            success: false,
            message: 'You are not authorized to accept bids for this task'
          });
        }
        return;
      }
      
      // Check if task is still open
      if (bid.task.status !== TaskStatus.OPEN) {
        if (typeof callback === 'function') {
          return callback({
            success: false,
            message: 'This task is no longer accepting bids'
          });
        }
        return;
      }
      
      // Begin transaction to update bid and task
      const [updatedBid, updatedTask] = await prisma.$transaction([
        // Update bid status
        prisma.bid.update({
          where: { id: bidId },
          data: { status: BidStatus.ACCEPTED },
          include: {
            bidder: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                averageRating: true,
                avatar: true
              }
            }
          }
        }),
        
        // Update task status and assignee
        prisma.task.update({
          where: { id: bid.task.id },
          data: {
            status: TaskStatus.ASSIGNED,
            assigneeId: bid.bidderId
          }
        }),
        
        // Reject all other bids for this task
        prisma.bid.updateMany({
          where: {
            taskId: bid.task.id,
            id: { not: bidId },
            status: BidStatus.PENDING
          },
          data: {
            status: BidStatus.REJECTED
          }
        })
      ]);
      
      // Notify bidder that their bid was accepted
      await createNotification(
        socketManager,
        bid.bidderId,
        NotificationType.BID_ACCEPTED,
        `Your bid was accepted for the task: ${bid.task.title}`,
        bidId
      );
      
      // Broadcast bid acceptance to task room
      socketManager.sendToTask(bid.task.id, 'task:bidAccepted', {
        taskId: bid.task.id,
        bidId,
        bidderId: bid.bidderId,
        bidderName: `${bid.bidder.firstName} ${bid.bidder.lastName}`
      });
      
      // Execute callback with updated bid
      if (typeof callback === 'function') {
        callback({
          success: true,
          data: updatedBid
        });
      }
    } catch (error) {
      monitorError(error, { 
        component: 'TaskHandlers.acceptBid', 
        userId: user.id,
        bidId: data?.bidId
      });
      
      // Return error to client
      if (typeof callback === 'function') {
        callback({
          success: false,
          message: 'Failed to accept bid'
        });
      }
    }
  });
}

/**
 * Validates if a status transition is allowed based on the task's current status
 * and the user's role in relation to the task
 */
function validateStatusTransition(
  currentStatus: string,
  newStatus: string,
  isOwner: boolean,
  isAssignee: boolean
): boolean {
  // Define allowed transitions for owner and assignee
  const allowedTransitions: Record<string, Record<string, string[]>> = {
    [TaskStatus.OPEN]: {
      owner: [TaskStatus.CANCELLED, TaskStatus.ASSIGNED],
      assignee: []
    },
    [TaskStatus.ASSIGNED]: {
      owner: [TaskStatus.CANCELLED],
      assignee: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED]
    },
    [TaskStatus.IN_PROGRESS]: {
      owner: [TaskStatus.COMPLETED, TaskStatus.CANCELLED],
      assignee: [TaskStatus.COMPLETED, TaskStatus.CANCELLED]
    },
    [TaskStatus.COMPLETED]: {
      owner: [],
      assignee: []
    },
    [TaskStatus.CANCELLED]: {
      owner: [],
      assignee: []
    }
  };
  
  // Check if transition is allowed based on user role
  if (isOwner && allowedTransitions[currentStatus]?.owner.includes(newStatus)) {
    return true;
  }
  
  if (isAssignee && allowedTransitions[currentStatus]?.assignee.includes(newStatus)) {
    return true;
  }
  
  return false;
}
