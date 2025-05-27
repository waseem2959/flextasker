/**
 * Job Queue System
 * 
 * This module implements a background job processing system using Redis-based queues.
 * It handles asynchronous tasks like email sending, notifications, and data processing.
 */

import { Queue, Worker, Job, QueueScheduler } from 'bullmq';
import { redisClient } from './cache/redis-client';
import { logger } from './logger';
import { monitorError } from './monitoring';

// Default queue configuration
const DEFAULT_QUEUE_CONFIG = {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: true,
    removeOnFail: 5000
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

// Job data types
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
  dueDate?: Date;
}

// Job processor functions
type JobProcessor<T> = (job: Job<T>) => Promise<any>;

// Active queues and workers
const queues: Record<string, Queue> = {};
const workers: Record<string, Worker> = {};
const schedulers: Record<string, QueueScheduler> = {};

/**
 * Create a job queue
 */
export function createQueue<T>(name: QueueName): Queue<T> {
  if (queues[name]) {
    return queues[name] as Queue<T>;
  }
  
  // Create queue
  const queue = new Queue<T>(name, DEFAULT_QUEUE_CONFIG);
  
  // Handle queue events
  queue.on('error', error => {
    logger.error(`Queue ${name} error`, { error });
    monitorError(error, { component: `Queue:${name}` });
  });
  
  // Store queue reference
  queues[name] = queue;
  
  // Create scheduler for delayed jobs
  schedulers[name] = new QueueScheduler(name, { connection: redisClient });
  
  logger.info(`Queue ${name} created`);
  
  return queue;
}

/**
 * Register a job processor
 */
export function registerProcessor<T>(
  queueName: QueueName, 
  processor: JobProcessor<T>,
  concurrency = 1
): Worker<T> {
  if (workers[queueName]) {
    return workers[queueName] as Worker<T>;
  }
  
  // Create worker
  const worker = new Worker<T>(queueName, processor, { 
    connection: redisClient,
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
export async function addJob<T>(
  queueName: QueueName,
  data: T,
  options: {
    priority?: number;
    delay?: number;
    attempts?: number;
    jobId?: string;
  } = {}
): Promise<Job<T>> {
  // Get or create queue
  const queue = queues[queueName] as Queue<T> || createQueue<T>(queueName);
  
  // Add job to queue
  const job = await queue.add(queueName, data, {
    ...DEFAULT_QUEUE_CONFIG.defaultJobOptions,
    ...options,
    jobId: options.jobId || undefined
  });
  
  logger.info(`Job ${job.id} added to queue ${queueName}`, {
    jobId: job.id,
    queue: queueName,
    data,
    options
  });
  
  return job;
}

/**
 * Add a recurring job
 */
export async function addRecurringJob<T>(
  queueName: QueueName,
  data: T,
  pattern: string,
  options: {
    priority?: number;
    attempts?: number;
    jobId?: string;
  } = {}
): Promise<Job<T>> {
  // Get or create queue
  const queue = queues[queueName] as Queue<T> || createQueue<T>(queueName);
  
  // Add recurring job
  const job = await queue.add(queueName, data, {
    ...DEFAULT_QUEUE_CONFIG.defaultJobOptions,
    ...options,
    jobId: options.jobId || undefined,
    repeat: { pattern }
  });
  
  logger.info(`Recurring job ${job.id} added to queue ${queueName}`, {
    jobId: job.id,
    queue: queueName,
    data,
    pattern,
    options
  });
  
  return job;
}

/**
 * Get job by ID
 */
export async function getJob<T>(queueName: QueueName, jobId: string): Promise<Job<T> | null> {
  const queue = queues[queueName] as Queue<T>;
  if (!queue) {
    return null;
  }
  
  return queue.getJob(jobId);
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
 * Shut down all queues and workers
 */
export async function shutdown(): Promise<void> {
  const workerPromises = Object.values(workers).map(worker => worker.close());
  const queuePromises = Object.values(queues).map(queue => queue.close());
  const schedulerPromises = Object.values(schedulers).map(scheduler => scheduler.close());
  
  await Promise.all([...workerPromises, ...queuePromises, ...schedulerPromises]);
  
  logger.info('All job queues and workers shut down');
}
