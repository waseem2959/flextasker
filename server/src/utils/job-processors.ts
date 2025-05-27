/**
 * Job Processors
 * 
 * This module implements processors for background jobs.
 * It handles asynchronous tasks like sending emails, notifications, and file processing.
 */

import { Job } from 'bullmq';
import { 
  QueueName, 
  EmailJobData, 
  NotificationJobData,
  FileProcessingJobData,
  DataExportJobData,
  TaskReminderJobData,
  registerProcessor
} from './job-queue';
import { logger } from './logger';
import { prisma } from './db';
import { notificationHandler, NotificationType } from './websocket/notification-handler';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import sharp from 'sharp';
import { createTransport } from 'nodemailer';
import { config } from './config';
import { render } from 'ejs';
import { startMeasurement, endMeasurement } from './monitoring';

/**
 * Email processor
 */
async function processEmailJob(job: Job<EmailJobData>): Promise<any> {
  const { to, subject, template, context } = job.data;
  const measureId = startMeasurement('job:email', { jobId: job.id });
  
  try {
    logger.info('Processing email job', { jobId: job.id, to, subject });
    
    // Skip actual sending in development mode if configured
    if (config.NODE_ENV === 'development' && !config.SMTP_HOST) {
      logger.info('Email sending skipped in development mode', { to, subject, template });
      endMeasurement(measureId, { success: true, skipped: true });
      return { success: true, skipped: true };
    }
    
    // Create email transporter
    const transporter = createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS
      }
    });
    
    // Load and render email template
    const templatePath = path.join(process.cwd(), 'src/templates/emails', `${template}.ejs`);
    const templateContent = await fs.readFile(templatePath, 'utf8');
    const html = render(templateContent, context);
    
    // Send email
    const result = await transporter.sendMail({
      from: config.EMAIL_FROM,
      to,
      subject,
      html
    });
    
    logger.info('Email sent successfully', { 
      jobId: job.id, 
      messageId: result.messageId,
      to, 
      subject 
    });
    
    endMeasurement(measureId, { success: true });
    
    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    logger.error('Failed to send email', { 
      jobId: job.id, 
      to, 
      subject, 
      error 
    });
    
    endMeasurement(measureId, { 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
}

/**
 * Notification processor
 */
async function processNotificationJob(job: Job<NotificationJobData>): Promise<any> {
  const { userId, type, title, message, data } = job.data;
  const measureId = startMeasurement('job:notification', { jobId: job.id });
  
  try {
    logger.info('Processing notification job', { jobId: job.id, userId, type });
    
    // Create notification
    const notification = await notificationHandler.createNotification({
      userId,
      type: type as NotificationType,
      title,
      message,
      data
    });
    
    endMeasurement(measureId, { success: true });
    
    return {
      success: true,
      notificationId: notification.id
    };
  } catch (error) {
    logger.error('Failed to create notification', { 
      jobId: job.id, 
      userId, 
      type, 
      error 
    });
    
    endMeasurement(measureId, { 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
}

/**
 * File processing processor
 */
async function processFileJob(job: Job<FileProcessingJobData>): Promise<any> {
  const { fileId, filePath, userId, processType } = job.data;
  const measureId = startMeasurement('job:file-processing', { 
    jobId: job.id,
    processType
  });
  
  try {
    logger.info('Processing file job', { jobId: job.id, fileId, processType });
    
    // Check if file exists
    const fullPath = path.join(process.cwd(), filePath);
    if (!existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }
    
    // Process file based on type
    let result;
    
    switch (processType) {
      case 'image-resize':
        result = await processImage(fullPath);
        break;
      case 'document-parse':
        result = await processDocument(fullPath);
        break;
      case 'archive-extract':
        result = await processArchive(fullPath);
        break;
      default:
        throw new Error(`Unknown process type: ${processType}`);
    }
    
    // Update file processing status in database
    await prisma.file.update({
      where: { id: fileId },
      data: {
        processed: true,
        processingMetadata: result
      }
    });
    
    // Notify user about completed processing
    await notificationHandler.createNotification({
      userId,
      type: NotificationType.SYSTEM_NOTICE,
      title: 'File Processing Complete',
      message: `Your file has been processed successfully.`,
      data: {
        fileId,
        processType,
        result
      }
    });
    
    endMeasurement(measureId, { success: true });
    
    return {
      success: true,
      fileId,
      processType,
      result
    };
  } catch (error) {
    logger.error('Failed to process file', { 
      jobId: job.id, 
      fileId, 
      processType, 
      error 
    });
    
    // Update file processing status in database
    await prisma.file.update({
      where: { id: fileId },
      data: {
        processed: false,
        processingError: error instanceof Error ? error.message : 'Unknown error'
      }
    });
    
    // Notify user about failed processing
    await notificationHandler.createNotification({
      userId,
      type: NotificationType.SYSTEM_NOTICE,
      title: 'File Processing Failed',
      message: `There was an error processing your file.`,
      data: {
        fileId,
        processType,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
    
    endMeasurement(measureId, { 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
}

/**
 * Process an image file (resize, optimize)
 */
async function processImage(filePath: string): Promise<any> {
  const filename = path.basename(filePath);
  const directory = path.dirname(filePath);
  const ext = path.extname(filename);
  const name = path.basename(filename, ext);
  
  // Create output paths for different sizes
  const thumbPath = path.join(directory, `${name}_thumb${ext}`);
  const mediumPath = path.join(directory, `${name}_medium${ext}`);
  const largePath = path.join(directory, `${name}_large${ext}`);
  
  // Create image pipeline
  const image = sharp(filePath);
  const metadata = await image.metadata();
  
  // Process in parallel
  await Promise.all([
    // Thumbnail (150x150)
    image.clone().resize(150, 150, { fit: 'cover' }).toFile(thumbPath),
    
    // Medium (500px width)
    image.clone().resize(500, null, { fit: 'inside' }).toFile(mediumPath),
    
    // Large (1000px width)
    image.clone().resize(1000, null, { fit: 'inside' }).toFile(largePath)
  ]);
  
  return {
    original: {
      path: filePath,
      width: metadata.width,
      height: metadata.height,
      size: metadata.size
    },
    thumbnail: {
      path: thumbPath,
      width: 150,
      height: 150
    },
    medium: {
      path: mediumPath,
      width: Math.min(metadata.width || 0, 500),
      height: metadata.height ? Math.round((Math.min(metadata.width || 0, 500) / metadata.width) * metadata.height) : null
    },
    large: {
      path: largePath,
      width: Math.min(metadata.width || 0, 1000),
      height: metadata.height ? Math.round((Math.min(metadata.width || 0, 1000) / metadata.width) * metadata.height) : null
    }
  };
}

/**
 * Process a document file (extract text, metadata)
 */
async function processDocument(filePath: string): Promise<any> {
  // In a real implementation, this would use a library like pdf.js, docx-parser, etc.
  // For this example, we'll just return mock data
  
  return {
    pageCount: 5,
    extracted: true,
    textSample: 'This is a sample of extracted text...',
    metadata: {
      author: 'Sample Author',
      createdAt: new Date().toISOString(),
      title: 'Sample Document'
    }
  };
}

/**
 * Process an archive file (extract contents)
 */
async function processArchive(filePath: string): Promise<any> {
  // In a real implementation, this would use a library like unzipper, tar, etc.
  // For this example, we'll just return mock data
  
  return {
    extracted: true,
    fileCount: 10,
    totalSize: 1024 * 1024, // 1MB
    files: [
      'example1.txt',
      'example2.jpg',
      'subfolder/example3.pdf'
    ]
  };
}

/**
 * Data export processor
 */
async function processDataExportJob(job: Job<DataExportJobData>): Promise<any> {
  const { userId, dataType, format, filters } = job.data;
  const measureId = startMeasurement('job:data-export', { 
    jobId: job.id,
    dataType,
    format
  });
  
  try {
    logger.info('Processing data export job', { jobId: job.id, userId, dataType, format });
    
    // Generate filename and path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${userId}_${dataType}_${timestamp}.${format}`;
    const exportDir = path.join(process.cwd(), 'exports');
    const filePath = path.join(exportDir, filename);
    
    // Ensure exports directory exists
    if (!existsSync(exportDir)) {
      await fs.mkdir(exportDir, { recursive: true });
    }
    
    // Fetch data based on type
    let data;
    switch (dataType) {
      case 'tasks':
        data = await prisma.task.findMany({
          where: {
            ownerId: userId,
            ...filters
          },
          include: {
            bids: true,
            category: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        });
        break;
        
      case 'bids':
        data = await prisma.bid.findMany({
          where: {
            bidderId: userId,
            ...filters
          },
          include: {
            task: true,
            bidder: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        });
        break;
        
      case 'profile':
        data = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            tasks: true,
            assignedTasks: true,
            bids: true,
            reviews: true,
            _count: {
              select: {
                tasks: true,
                assignedTasks: true,
                bids: true,
                reviews: true
              }
            }
          }
        });
        break;
        
      case 'all':
        const [userProfile, userTasks, userBids, userReviews] = await Promise.all([
          prisma.user.findUnique({
            where: { id: userId }
          }),
          prisma.task.findMany({
            where: { ownerId: userId }
          }),
          prisma.bid.findMany({
            where: { bidderId: userId }
          }),
          prisma.review.findMany({
            where: { 
              OR: [
                { userId },
                { reviewerId: userId }
              ]
            }
          })
        ]);
        
        data = {
          profile: userProfile,
          tasks: userTasks,
          bids: userBids,
          reviews: userReviews
        };
        break;
        
      default:
        throw new Error(`Unknown data type: ${dataType}`);
    }
    
    // Process data based on format
    let content;
    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        await fs.writeFile(filePath, content, 'utf8');
        break;
        
      case 'csv':
        content = convertToCSV(data, dataType);
        await fs.writeFile(filePath, content, 'utf8');
        break;
        
      case 'pdf':
        // In a real implementation, this would use a PDF generation library
        content = JSON.stringify(data, null, 2);
        await fs.writeFile(filePath, content, 'utf8');
        break;
        
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    // Create export record in database
    const export_ = await prisma.export.create({
      data: {
        userId,
        filePath,
        fileName: filename,
        dataType,
        format,
        fileSize: (await fs.stat(filePath)).size,
        status: 'COMPLETED',
        filters: filters ? JSON.stringify(filters) : null
      }
    });
    
    // Notify user
    await notificationHandler.createNotification({
      userId,
      type: NotificationType.SYSTEM_NOTICE,
      title: 'Data Export Complete',
      message: `Your ${dataType} data has been exported in ${format} format.`,
      data: {
        exportId: export_.id,
        filename,
        format,
        dataType
      }
    });
    
    endMeasurement(measureId, { success: true });
    
    return {
      success: true,
      exportId: export_.id,
      filename,
      size: (await fs.stat(filePath)).size
    };
  } catch (error) {
    logger.error('Failed to export data', { 
      jobId: job.id, 
      userId, 
      dataType, 
      format, 
      error 
    });
    
    // Create failed export record
    await prisma.export.create({
      data: {
        userId,
        dataType,
        format,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        filters: filters ? JSON.stringify(filters) : null
      }
    });
    
    // Notify user
    await notificationHandler.createNotification({
      userId,
      type: NotificationType.SYSTEM_NOTICE,
      title: 'Data Export Failed',
      message: `Your ${dataType} data export in ${format} format failed.`,
      data: {
        error: error instanceof Error ? error.message : 'Unknown error',
        dataType,
        format
      }
    });
    
    endMeasurement(measureId, { 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any, dataType: string): string {
  // Simple CSV conversion - in a real app you'd use a proper CSV library
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return '';
  }
  
  let headers: string[];
  let rows: any[];
  
  if (Array.isArray(data)) {
    // Get headers from first item keys
    headers = Object.keys(data[0]);
    rows = data;
  } else {
    // For objects like profile
    headers = Object.keys(data);
    rows = [data];
  }
  
  // Create CSV header row
  let csv = headers.join(',') + '\n';
  
  // Create data rows
  for (const row of rows) {
    const values = headers.map(header => {
      const value = row[header];
      
      if (value === null || value === undefined) {
        return '';
      }
      
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    });
    
    csv += values.join(',') + '\n';
  }
  
  return csv;
}

/**
 * Task reminder processor
 */
async function processTaskReminderJob(job: Job<TaskReminderJobData>): Promise<any> {
  const { taskId, userId, type, dueDate } = job.data;
  const measureId = startMeasurement('job:task-reminder', { 
    jobId: job.id,
    type
  });
  
  try {
    logger.info('Processing task reminder job', { jobId: job.id, taskId, userId, type });
    
    // Get task details
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    
    // Prepare notification based on reminder type
    let title: string;
    let message: string;
    
    switch (type) {
      case 'deadline':
        const daysLeft = dueDate ? Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
        
        title = 'Task Deadline Reminder';
        message = daysLeft > 0
          ? `Your task "${task.title}" is due in ${daysLeft} days.`
          : `Your task "${task.title}" is due today!`;
        break;
        
      case 'update':
        title = 'Task Update Reminder';
        message = `Please provide an update on your task "${task.title}".`;
        break;
        
      case 'payment':
        title = 'Payment Reminder';
        message = `Payment for task "${task.title}" is pending.`;
        break;
        
      default:
        throw new Error(`Unknown reminder type: ${type}`);
    }
    
    // Send notification
    await notificationHandler.createNotification({
      userId,
      type: NotificationType.TASK_UPDATED,
      title,
      message,
      data: {
        taskId,
        taskTitle: task.title,
        reminderType: type,
        dueDate
      }
    });
    
    // Also send email reminder
    await processEmailJob(new Job('email', `reminder:${taskId}:${type}`, {
      to: userId === task.ownerId ? task.owner.email : (task.assignee?.email || ''),
      subject: title,
      template: 'task-reminder',
      context: {
        taskId,
        taskTitle: task.title,
        userName: userId === task.ownerId 
          ? `${task.owner.firstName} ${task.owner.lastName}`
          : `${task.assignee?.firstName || ''} ${task.assignee?.lastName || ''}`,
        message,
        type,
        dueDate: dueDate ? new Date(dueDate).toLocaleDateString() : null
      }
    }));
    
    endMeasurement(measureId, { success: true });
    
    return {
      success: true,
      taskId,
      userId,
      type
    };
  } catch (error) {
    logger.error('Failed to process task reminder', { 
      jobId: job.id, 
      taskId, 
      userId, 
      type, 
      error 
    });
    
    endMeasurement(measureId, { 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
}

/**
 * Initialize all job processors
 */
export function initializeJobProcessors(): void {
  // Register processors with appropriate concurrency
  registerProcessor<EmailJobData>(QueueName.EMAIL, processEmailJob, 5);
  registerProcessor<NotificationJobData>(QueueName.NOTIFICATION, processNotificationJob, 10);
  registerProcessor<FileProcessingJobData>(QueueName.FILE_PROCESSING, processFileJob, 2);
  registerProcessor<DataExportJobData>(QueueName.DATA_EXPORT, processDataExportJob, 2);
  registerProcessor<TaskReminderJobData>(QueueName.TASK_REMINDER, processTaskReminderJob, 5);
  
  logger.info('Job processors initialized');
}
