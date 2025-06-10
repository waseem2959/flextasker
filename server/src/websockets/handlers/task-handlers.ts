/**
 * Task WebSocket Handlers
 * 
 * This module handles WebSocket events related to tasks, including
 * real-time updates for task status changes, bids, and comments.
 */

import { Socket } from 'socket.io';
import {
    BidStatus,
    NotificationType,
    TaskStatus
} from '../../../../shared/types/enums';
import { prisma } from '../../utils/database';
import { logger } from '../../utils/logger';
import { monitorError } from '../../utils/monitoring';
import { SocketManager } from '../socket-manager';
import { createNotification } from './notification-handlers';

/**
 * Validate bid submission data
 */
function validateBidData(data: any): { isValid: boolean; message?: string } {
  const { taskId, amount, description, timeline } = data;
  
  if (!taskId || !amount || !description || !timeline) {
    return { isValid: false, message: 'Invalid bid data' };
  }
  
  return { isValid: true };
}

/**
 * Check if user can bid on task
 */
async function canUserBidOnTask(taskId: string, userId: string): Promise<{ canBid: boolean; message?: string; task?: any }> {
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
    return { canBid: false, message: 'Task not found' };
  }
  
  if (task.status !== TaskStatus.OPEN) {
    return { canBid: false, message: 'This task is no longer accepting bids' };
  }
  
  const hasExistingBid = await checkExistingBid(taskId, userId);
  if (hasExistingBid) {
    return { canBid: false, message: 'You have already submitted a bid for this task' };
  }
  
  return { canBid: true, task };
}

/**
 * Check if user has existing bid for task
 */
async function checkExistingBid(taskId: string, userId: string): Promise<boolean> {
  const existingBid = await prisma.bid.findFirst({
    where: { taskId, bidderId: userId }
  });
  return !!existingBid;
}

/**
 * Validate status update authorization
 */
async function validateStatusUpdateAuth(taskId: string, userId: string): Promise<{ isAuthorized: boolean; message?: string; task?: any; isOwner?: boolean; isAssignee?: boolean }> {
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
    return { isAuthorized: false, message: 'Task not found' };
  }
  
  const isOwner = task.ownerId === userId;
  const isAssignee = task.assigneeId === userId;
  
  if (!isOwner && !isAssignee) {
    return { isAuthorized: false, message: 'You are not authorized to update this task' };
  }
  
  return { 
    isAuthorized: true, 
    task, 
    isOwner: isOwner || false, 
    isAssignee: isAssignee || false 
  };
}

/**
 * Handle status change notifications
 */
async function handleStatusChangeNotifications(
  socketManager: SocketManager,
  task: any,
  status: string,
  userId: string,
  taskId: string
): Promise<void> {
  if (status === TaskStatus.IN_PROGRESS && task.assigneeId) {
    await createNotification(
      socketManager,
      task.ownerId,
      NotificationType.TASK_UPDATED,
      `Task has been started: ${task.title}`,
      taskId
    );
  } else if (status === TaskStatus.COMPLETED) {
    await handleCompletionNotifications(socketManager, task, userId, taskId);
  } else if (status === TaskStatus.CANCELLED) {
    const isOwner = task.ownerId === userId;
    if (isOwner) {
      await handleOwnerTaskCancellation(socketManager, task);
    } else {
      await handleAssigneeTaskCancellation(socketManager, task);
    }
  }
}

/**
 * Handle task completion notifications
 */
async function handleCompletionNotifications(
  socketManager: SocketManager,
  task: any,
  userId: string,
  taskId: string
): Promise<void> {
  if (task.ownerId && task.assigneeId) {
    // Notify owner that task is completed
    if (task.ownerId !== userId) {
      await createNotification(
        socketManager,
        task.ownerId,
        NotificationType.TASK_COMPLETED,
        `Task has been marked as completed: ${task.title}`,
        taskId
      );
    }
    
    // Notify assignee if owner marked it complete
    if (task.assigneeId !== userId) {
      await createNotification(
        socketManager,
        task.assigneeId,
        NotificationType.TASK_COMPLETED,
        `Task has been marked as completed: ${task.title}`,
        taskId
      );
    }
  }
}

/**
 * Handle task cancellation by owner
 */
async function handleOwnerTaskCancellation(
  socketManager: SocketManager, 
  task: any
): Promise<void> {
  if (task.assigneeId) {
    await createNotification(
      socketManager,
      task.assigneeId,
      NotificationType.TASK_UPDATED, // Using TASK_UPDATED as fallback for TASK_CANCELLED
      `Task has been cancelled: ${task.title}`,
      task.id
    );
  }
}

/**
 * Handle task cancellation by assignee
 */
async function handleAssigneeTaskCancellation(
  socketManager: SocketManager, 
  task: any
): Promise<void> {
  if (task.ownerId) {
    await createNotification(
      socketManager,
      task.ownerId,
      NotificationType.TASK_UPDATED, // Using TASK_UPDATED as fallback for TASK_CANCELLED
      `Task has been cancelled by the assignee: ${task.title}`,
      task.id
    );
  }
}

/**
 * Validate bid acceptance authorization
 */
async function validateBidAcceptanceAuth(bidId: string, userId: string): Promise<{ isAuthorized: boolean; message?: string; bid?: any }> {
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
    return { isAuthorized: false, message: 'Bid not found' };
  }
  
  if (bid.task.ownerId !== userId) {
    return { isAuthorized: false, message: 'You are not authorized to accept bids for this task' };
  }
  
  if (bid.task.status !== TaskStatus.OPEN) {
    return { isAuthorized: false, message: 'This task is no longer accepting bids' };
  }
  
  return { isAuthorized: true, bid };
}

/**
 * Process bid acceptance transaction
 */
async function processBidAcceptance(bidId: string, bid: any): Promise<any> {
  const [updatedBid] = await prisma.$transaction([
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
        status: TaskStatus.IN_PROGRESS,
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
  
  return updatedBid;
}

/**
 * Process task status update
 */
async function processTaskStatusUpdate(
  socketManager: SocketManager,
  taskId: string,
  status: string,
  userId: string,
  callback: Function
): Promise<void> {
  // Validate authorization
  const authCheck = await validateStatusUpdateAuth(taskId, userId);
  if (!authCheck.isAuthorized) {
    return callback({
      success: false,
      message: authCheck.message
    });
  }

  const { task, isOwner, isAssignee } = authCheck;

  // Ensure boolean values (fix TypeScript error)
  const ownerFlag = Boolean(isOwner);
  const assigneeFlag = Boolean(isAssignee);

  // Validate status transition
  const isValidTransition = validateStatusTransition(task.status, status, ownerFlag, assigneeFlag);
  if (!isValidTransition) {
    return callback({
      success: false,
      message: 'Invalid status transition'
    });
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

  // Handle notifications
  await handleStatusChangeNotifications(socketManager, task, status, userId, taskId);

  // Broadcast status update to task room
  socketManager.sendToTask(taskId, 'task:statusUpdated', {
    taskId,
    status,
    updatedBy: userId,
    updatedAt: new Date()
  });

  // Execute callback with updated task
  callback({
    success: true,
    data: updatedTask
  });
}

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
      monitorError(error as Error, { 
        component: 'TaskHandlers.joinTask', 
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
      logger.debug('Socket task:submitBid', { 
        userId: user.id, 
        taskId: data?.taskId,
        amount: data?.amount
      });
      
      // Validate input
      const validation = validateBidData(data);
      if (!validation.isValid) {
        if (typeof callback === 'function') {
          return callback({
            success: false,
            message: validation.message
          });
        }
        return;
      }
      
      const { taskId, amount, description, timeline } = data;
      
      // Check if user can bid on this task
      const bidCheck = await canUserBidOnTask(taskId, user.id);
      if (!bidCheck.canBid) {
        if (typeof callback === 'function') {
          return callback({
            success: false,
            message: bidCheck.message
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
        bidCheck.task!.ownerId,
        NotificationType.BID_RECEIVED,
        `You received a new bid on your task: ${bidCheck.task!.title}`,
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
      monitorError(error as Error, { 
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
      
      // Process status update using helper function
      await processTaskStatusUpdate(socketManager, taskId, status, user.id, callback);
      
    } catch (error) {
      monitorError(error as Error, { 
        component: 'TaskHandlers.updateTaskStatus', 
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
      
      // Validate bid acceptance authorization
      const authCheck = await validateBidAcceptanceAuth(bidId, user.id);
      if (!authCheck.isAuthorized) {
        if (typeof callback === 'function') {
          return callback({
            success: false,
            message: authCheck.message
          });
        }
        return;
      }
      
      const { bid } = authCheck;
      
      // Process bid acceptance transaction
      const updatedBid = await processBidAcceptance(bidId, bid);
      
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
      monitorError(error as Error, { 
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
      owner: [TaskStatus.CANCELLED, TaskStatus.IN_PROGRESS],
      assignee: []
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