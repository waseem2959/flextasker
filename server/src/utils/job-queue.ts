/**
 * Job Queue System - Minimal Fixes Applied
 * 
 * This module implements a background job processing system using Redis-based queues.
 * It handles asynchronous tasks like email sending, notifications, and data processing.
 */

import { Job, Queue, QueueEvents, Worker } from 'bullmq';
import { logger } from './logger';
import { monitorError } from './monitoring';

// CRITICAL FIX #1: Add maxRetriesPerRequest: null to prevent worker disconnections
const REDIS_CONNECTION = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379'),
  password: process.env.REDIS_PASSWORD,
  username: process.env.REDIS_USERNAME,
  maxRetriesPerRequest: null  // CRITICAL: Prevents worker disconnections
};

// CRITICAL FIX #2: Add proper job retention to prevent memory leaks
const DEFAULT_QUEUE_CONFIG = {
  connection: REDIS_CONNECTION,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: 100,    // FIX: Keep only last 100 completed jobs
    removeOnFail: 1000        // FIX: Keep more failed jobs for debugging
  }
};

// Queue names
export enum QueueName {
  EMAIL = 'email',
  NOTIFICATION = 'notification',
  FILE_PROCESSING = 'file-processing',
  DATA_EXPORT = 'data-export',
  TASK_REMINDER = 'task-reminder'
}

// CRITICAL FIX #3: Use serialization-safe types (no Date objects)
export interface EmailJobData {
  to: string | string[];
  subject: string;
  template: string;
  context: Record<string, any>;
}

export interface NotificationJobData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface FileProcessingJobData {
  fileId: string;
  filePath: string;
  userId: string;
  processType: 'image-resize' | 'document-parse' | 'archive-extract';
}

export interface DataExportJobData {
  userId: string;
  dataType: 'tasks' | 'bids' | 'profile' | 'all';
  format: 'csv' | 'json' | 'pdf';
  filters?: Record<string, any>;
}

export interface TaskReminderJobData {
  taskId: string;
  userId: string;
  type: 'deadline' | 'update' | 'payment';
  dueDate?: string;  // FIX: Use string instead of Date for serialization safety
}

// Job processor functions
type JobProcessor<T> = (job: Job<T>) => Promise<any>;

// Active queues and workers with proper typing
const queues: Partial<Record<QueueName, Queue<any, any, string>>> = {};
const workers: Partial<Record<QueueName, Worker<any, any, string>>> = {};
const queueEvents: Partial<Record<QueueName, QueueEvents>> = {};

// FIX #4: Add shutdown flag to prevent job addition during shutdown
let isShuttingDown = false;

/**
 * Create a job queue
 */
export function createQueue<T = any>(name: QueueName): Queue<T, any, string> {
  const existingQueue = queues[name];
  if (existingQueue) {
    return existingQueue as Queue<T, any, string>;
  }
  
  // Create queue with simplified typing to avoid BullMQ's complex type extraction
  const queue: Queue<T, any, string> = new Queue(name.toString(), {
    ...DEFAULT_QUEUE_CONFIG,
    defaultJobOptions: {
      ...DEFAULT_QUEUE_CONFIG.defaultJobOptions,
      removeOnComplete: 100,  // Explicit setting
      removeOnFail: 1000      // Explicit setting
    }
  });
  
  // Handle queue events
  queue.on('error', error => {
    logger.error(`Queue ${name} error`, { error });
    monitorError(error, { component: `Queue:${name}` });
  });
  
  // Store queue reference
  queues[name] = queue;
  
  // Create queue events for monitoring
  queueEvents[name] = new QueueEvents(name, { connection: REDIS_CONNECTION });
  
  logger.info(`Queue ${name} created`);
  
  return queue;
}

/**
 * Register a job processor
 */
export function registerProcessor<T = any>(
  queueName: QueueName, 
  processor: JobProcessor<T>,
  concurrency = 1
): Worker<T, any, string> {
  const existingWorker = workers[queueName];
  if (existingWorker) {
    return existingWorker as Worker<T, any, string>;
  }
  
  // Create worker with simplified typing to avoid BullMQ's complex type extraction
  const worker: Worker<T, any, string> = new Worker(queueName, processor, { 
    connection: REDIS_CONNECTION,
    concurrency
  });
  
  // Handle worker events
  worker.on('completed', job => {
    logger.info(`Job ${job.id} completed`, {
      queue: queueName,
      jobId: job.id,
      data: job.data
    });
  });
  
  worker.on('failed', (job, error) => {
    logger.error(`Job ${job?.id} failed`, {
      queue: queueName,
      jobId: job?.id,
      data: job?.data,
      error
    });
    
    monitorError(error, { 
      component: `Worker:${queueName}`,
      jobId: job?.id
    });
  });
  
  // Store worker reference
  workers[queueName] = worker;
  
  logger.info(`Worker for queue ${queueName} registered`, { concurrency });
  
  return worker;
}

/**
 * Add a job to the queue
 */
export async function addJob<T = any>(
  queueName: QueueName,
  data: T,
  options: {
    priority?: number;
    delay?: number;
    attempts?: number;
    jobId?: string;
  } = {}
): Promise<Job<T, any, string>> {
  // FIX #5: Prevent job addition during shutdown
  if (isShuttingDown) {
    throw new Error('Cannot add jobs during shutdown');
  }

  // Get or create queue
  const queue = (queues[queueName] as Queue<T, any, string>) ?? createQueue<T>(queueName);
  
  // Add job to queue - bypass BullMQ's complex type system
  const job = await (queue as any).add(queueName, data, {
    ...DEFAULT_QUEUE_CONFIG.defaultJobOptions,
    ...options,
    attempts: options.attempts ?? DEFAULT_QUEUE_CONFIG.defaultJobOptions.attempts,
    jobId: options.jobId ?? undefined
  });
  
  logger.info(`Job ${job.id} added to queue ${queueName}`, {
    jobId: job.id,
    queue: queueName,
    data,
    options
  });
  
  return job as Job<T, any, string>;
}

/**
 * Add a recurring job - FIX #6: Use upsertJobScheduler instead of add
 */
export async function addRecurringJob<T = any>(
  queueName: QueueName,
  data: T,
  pattern: string,
  options: {
    priority?: number;
    attempts?: number;
    jobId?: string;
  } = {}
): Promise<Job<T, any, string>> {
  if (isShuttingDown) {
    throw new Error('Cannot add recurring jobs during shutdown');
  }

  // Get or create queue
  const queue = (queues[queueName] as Queue<T, any, string>) ?? createQueue<T>(queueName);
  
  // FIX: Use upsertJobScheduler to prevent duplicate schedulers during deployments
  // Bypass BullMQ's complex type system
  const job = await (queue as any).upsertJobScheduler(
    options.jobId ?? `${queueName}-recurring`,
    { pattern },
    {
      name: queueName,
      data,
      opts: {
        ...DEFAULT_QUEUE_CONFIG.defaultJobOptions,
        ...options,
        attempts: options.attempts ?? DEFAULT_QUEUE_CONFIG.defaultJobOptions.attempts
      }
    }
  );
  
  logger.info(`Recurring job ${job.id} added to queue ${queueName}`, {
    jobId: job.id,
    queue: queueName,
    data,
    pattern,
    options
  });
  
  return job as Job<T, any, string>;
}

/**
 * Get job by ID
 */
export async function getJob<T = any>(queueName: QueueName, jobId: string): Promise<Job<T, any, string> | null> {
  const queue = queues[queueName];
  if (!queue) {
    return null;
  }
  
  try {
    const job = await queue.getJob(jobId);
    return job ?? null;
  } catch (error) {
    logger.error(`Failed to get job ${jobId} from queue ${queueName}`, { error });
    return null;
  }
}

/**
 * Remove a job
 */
export async function removeJob(queueName: QueueName, jobId: string): Promise<void> {
  const queue = queues[queueName];
  if (!queue) {
    return;
  }
  
  const job = await queue.getJob(jobId);
  if (job) {
    await job.remove();
    logger.info(`Job ${jobId} removed from queue ${queueName}`);
  }
}

/**
 * Get queue metrics
 */
export async function getQueueMetrics(queueName: QueueName): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const queue = queues[queueName];
  if (!queue) {
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0
    };
  }
  
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount()
  ]);
  
  return {
    waiting,
    active,
    completed,
    failed,
    delayed
  };
}

/**
 * FIX #7: Improved shutdown with proper sequencing
 */
export async function shutdown(): Promise<void> {
  if (isShuttingDown) {
    return;
  }
  
  isShuttingDown = true;
  logger.info('Starting graceful shutdown');
  
  try {
    // 1. Close workers first (stops processing new jobs)
    const workerPromises = Object.values(workers).map(worker => 
      worker.close().catch(error => 
        logger.error('Error closing worker', { error })
      )
    );
    await Promise.all(workerPromises);
    
    // 2. Close queue events
    const eventPromises = Object.values(queueEvents).map(events => 
      events.close().catch(error => 
        logger.error('Error closing queue events', { error })
      )
    );
    await Promise.all(eventPromises);
    
    // 3. Close queues
    const queuePromises = Object.values(queues).map(queue => 
      queue.close().catch(error => 
        logger.error('Error closing queue', { error })
      )
    );
    await Promise.all(queuePromises);
    
    logger.info('All job queues and workers shut down successfully');
  } catch (error) {
    logger.error('Error during shutdown', { error });
    throw error;
  }
}

// FIX #8: Add signal handlers for graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  try {
    await shutdown();
    process.exit(0);
  } catch (error) {
    logger.error('Error during SIGTERM shutdown', { error });
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  try {
    await shutdown();
    process.exit(0);
  } catch (error) {
    logger.error('Error during SIGINT shutdown', { error });
    process.exit(1);
  }
});