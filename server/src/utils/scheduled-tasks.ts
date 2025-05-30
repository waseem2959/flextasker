/**
 * Scheduled Tasks
 * 
 * This module manages scheduled tasks and cron jobs for the application.
 * It uses the job queue system to schedule and execute recurring tasks.
 */

import { PrismaClient } from '@prisma/client';
import { 
  addRecurringJob, 
  QueueName, 
  EmailJobData, 
  TaskReminderJobData
} from './job-queue'; // Removed unused NotificationJobData import
import { logger } from './logger';
import { TaskStatus, NotificationType } from '../../../shared/types/enums';

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * Schedule task deadline reminders
 * Runs daily at 9:00 AM
 */
async function scheduleTaskDeadlineReminders(): Promise<void> {
  await addRecurringJob<TaskReminderJobData>(
    QueueName.TASK_REMINDER,
    {
      taskId: 'system',
      userId: 'system',
      type: 'deadline'
    },
    '0 9 * * *', // Every day at 9:00 AM
    {
      jobId: 'task-deadline-reminders'
    }
  );
  
  logger.info('Scheduled task deadline reminders');
}

/**
 * Schedule task status update checks
 * Runs every Monday at 10:00 AM
 */
async function scheduleTaskStatusUpdates(): Promise<void> {
  await addRecurringJob<TaskReminderJobData>(
    QueueName.TASK_REMINDER,
    {
      taskId: 'system',
      userId: 'system',
      type: 'update'
    },
    '0 10 * * 1', // Every Monday at 10:00 AM
    {
      jobId: 'task-status-updates'
    }
  );
  
  logger.info('Scheduled task status updates');
}

/**
 * Schedule weekly activity reports
 * Runs every Sunday at 8:00 PM
 */
async function scheduleWeeklyActivityReports(): Promise<void> {
  await addRecurringJob<EmailJobData>(
    QueueName.EMAIL,
    {
      to: 'system',
      subject: 'Weekly Activity Report',
      template: 'weekly-report',
      context: {}
    },
    '0 20 * * 0', // Every Sunday at 8:00 PM
    {
      jobId: 'weekly-activity-reports'
    }
  );
  
  logger.info('Scheduled weekly activity reports');
}

/**
 * Schedule database maintenance
 * Runs every day at 2:00 AM
 */
async function scheduleDatabaseMaintenance(): Promise<void> {
  await addRecurringJob<any>(
    QueueName.TASK_REMINDER,
    {
      operation: 'database-maintenance'
    },
    '0 2 * * *', // Every day at 2:00 AM
    {
      jobId: 'database-maintenance'
    }
  );
  
  logger.info('Scheduled database maintenance');
}

/**
 * Process task deadline reminders
 * Identifies tasks with approaching deadlines and sends reminders
 */
export async function processTaskDeadlineReminders(): Promise<void> {
  try {
    logger.info('Processing task deadline reminders');
    
    // Get tasks with deadlines in the next 48 hours
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    
    const tasks = await prisma.task.findMany({
      where: {
        status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] }, // Changed from ASSIGNED to OPEN
        dueDate: {
          gte: now,
          lte: twoDaysFromNow
        }
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        assignee: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    logger.info(`Found ${tasks.length} tasks with approaching deadlines`);
    
    // Process each task
    for (const task of tasks) {
      if (!task.assignee) continue;
      
      const daysLeft = Math.ceil((task.dueDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Send reminder to assignee
      await addRecurringJob<TaskReminderJobData>(
        QueueName.TASK_REMINDER,
        {
          taskId: task.id,
          userId: task.assigneeId!,
          type: 'deadline',
          dueDate: task.dueDate
        },
        '', // No recurrence - one-time job
        {
          jobId: `deadline-reminder-${task.id}-${task.assigneeId}-${Date.now()}`
        }
      );
      
      logger.info(`Scheduled deadline reminder for task ${task.id}, due in ${daysLeft} days`);
    }
  } catch (error) {
    logger.error('Failed to process task deadline reminders', { error });
  }
}

/**
 * Process task status updates
 * Identifies stale tasks and prompts for updates
 */
export async function processTaskStatusUpdates(): Promise<void> {
  try {
    logger.info('Processing task status updates');
    
    // Get tasks that haven't been updated in over a week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const tasks = await prisma.task.findMany({
      where: {
        status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] }, // Changed from ASSIGNED to OPEN
        updatedAt: {
          lt: oneWeekAgo
        }
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        assignee: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    logger.info(`Found ${tasks.length} tasks that need status updates`);
    
    // Process each task
    for (const task of tasks) {
      if (!task.assignee) continue;
      
      // Send update reminder to assignee
      await addRecurringJob<TaskReminderJobData>(
        QueueName.TASK_REMINDER,
        {
          taskId: task.id,
          userId: task.assigneeId!,
          type: 'update'
        },
        '', // No recurrence - one-time job
        {
          jobId: `update-reminder-${task.id}-${task.assigneeId}-${Date.now()}`
        }
      );
      
      // Notify the owner about the task status check
      await prisma.notification.create({
        data: {
          userId: task.ownerId,
          type: NotificationType.TASK_UPDATED,
          title: 'Task Status Check',
          message: `Your task "${task.title}" hasn't been updated in over a week.`,
          data: JSON.stringify({
            taskId: task.id,
            taskTitle: task.title
          }),
        }
      });
      
      logger.info(`Scheduled status update reminder for task ${task.id}`);
    }
  } catch (error) {
    logger.error('Failed to process task status updates', { error });
  }
}

/**
 * Process weekly activity reports
 * Generates and sends weekly reports to users
 */
export async function processWeeklyActivityReports(): Promise<void> {
  try {
    logger.info('Processing weekly activity reports');
    
    // Get active users
    const users = await prisma.user.findMany({
      where: {
        emailVerified: true,
        // Add any other filters to determine "active" users
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });
    
    logger.info(`Generating weekly reports for ${users.length} users`);
    
    // Get date range for the previous week
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Process each user
    for (const user of users) {
      // Get user activity data for the past week
      const [tasks, bids, reviews, notifications] = await Promise.all([
        // Tasks created or assigned in the last week
        prisma.task.count({
          where: {
            OR: [
              { ownerId: user.id },
              { assigneeId: user.id }
            ],
            createdAt: { gte: oneWeekAgo }
          }
        }),
        // Bids placed in the last week
        prisma.bid.count({
          where: {
            bidderId: user.id,
            createdAt: { gte: oneWeekAgo }
          }
        }),
        // Reviews received in the last week
        prisma.review.count({
          where: {
            userId: user.id,
            createdAt: { gte: oneWeekAgo }
          }
        }),
        // Unread notifications
        prisma.notification.count({
          where: {
            userId: user.id,
            read: false
          }
        })
      ]);
      
      // Skip users with no activity
      if (tasks === 0 && bids === 0 && reviews === 0 && notifications === 0) {
        continue;
      }
      
      // Schedule email job
      await addRecurringJob<EmailJobData>(
        QueueName.EMAIL,
        {
          to: user.email,
          subject: 'Your Weekly FlexTasker Summary',
          template: 'weekly-summary',
          context: {
            userName: `${user.firstName} ${user.lastName}`,
            tasks,
            bids,
            reviews,
            notifications,
            weekStart: oneWeekAgo.toLocaleDateString(),
            weekEnd: now.toLocaleDateString()
          }
        },
        '', // No recurrence - one-time job
        {
          jobId: `weekly-report-${user.id}-${Date.now()}`
        }
      );
      
      logger.info(`Scheduled weekly report for user ${user.id}`);
    }
  } catch (error) {
    logger.error('Failed to process weekly activity reports', { error });
  }
}

/**
 * Process database maintenance
 * Performs routine database cleanup and optimization
 */
export async function processDatabaseMaintenance(): Promise<void> {
  try {
    logger.info('Processing database maintenance');
    
    // Clean up expired tokens (example - adjust based on your schema)
    const tokenExpiryDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    const deletedTokens = await prisma.token.deleteMany({
      where: {
        expiresAt: {
          lt: tokenExpiryDate
        }
      }
    });
    
    logger.info(`Deleted ${deletedTokens.count} expired tokens`);
    
    // Archive old notifications
    const notificationArchiveDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
    
    const archivedNotifications = await prisma.notification.updateMany({
      where: {
        createdAt: {
          lt: notificationArchiveDate
        },
        archived: false
      },
      data: {
        archived: true
      }
    });
    
    logger.info(`Archived ${archivedNotifications.count} old notifications`);
    
    // Clean up temporary files (example)
    // This would typically involve filesystem operations
    logger.info('File cleanup completed');
    
    // Add more maintenance tasks as needed
    
  } catch (error) {
    logger.error('Failed to process database maintenance', { error });
  }
}

/**
 * Initialize all scheduled tasks
 */
export async function initializeScheduledTasks(): Promise<void> {
  try {
    // Schedule all recurring tasks
    await Promise.all([
      scheduleTaskDeadlineReminders(),
      scheduleTaskStatusUpdates(),
      scheduleWeeklyActivityReports(),
      scheduleDatabaseMaintenance()
    ]);
    
    logger.info('All scheduled tasks initialized');
  } catch (error) {
    logger.error('Failed to initialize scheduled tasks', { error });
    throw error;
  }
}
