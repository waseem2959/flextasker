/**
 * Bid Validation Schemas
 * 
 * Zod validation schemas for bid-related operations
 * Uses centralized validation schemas with route-specific wrappers
 */

import { z } from 'zod';
import { BidStatus } from '../../../shared/types/common/enums';
import { ValidationSchemas } from '../utils/validation-utils';

// Route-specific wrappers for centralized bid schemas
export const createBidSchema = z.object({
  body: ValidationSchemas.Bid.create
});

export const updateBidSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid bid ID format')
  }),
  body: ValidationSchemas.Bid.update
});

// Get bid by ID schema
export const getBidByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid bid ID format')
  })
});

// Accept bid schema
export const acceptBidSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid bid ID format')
  })
});

// Reject bid schema
export const rejectBidSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid bid ID format')
  }),
  body: z.object({
    reason: z.string().max(500, 'Reason too long').optional()
  })
});

// Withdraw bid schema
export const withdrawBidSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid bid ID format')
  }),
  body: z.object({
    reason: z.string().max(500, 'Reason too long').optional()
  })
});

// Get bids for task schema
export const getBidsForTaskSchema = z.object({
  params: z.object({
    taskId: z.string().uuid('Invalid task ID format')
  }),
  query: z.object({
    status: z.nativeEnum(BidStatus).optional(),
    sortBy: z.enum(['amount', 'createdAt', 'rating']).optional(),
    sortDir: z.enum(['asc', 'desc']).optional(),
    page: z.coerce.number().min(1).optional(),
    limit: z.coerce.number().min(1).max(100).optional()
  })
});

// Get user bids schema
export const getUserBidsSchema = z.object({
  query: z.object({
    status: z.nativeEnum(BidStatus).optional(),
    taskId: z.string().uuid().optional(),
    sortBy: z.enum(['amount', 'createdAt', 'status']).optional(),
    sortDir: z.enum(['asc', 'desc']).optional(),
    page: z.coerce.number().min(1).optional(),
    limit: z.coerce.number().min(1).max(100).optional()
  })
});

// Bid validation configs for routes
export const bidValidationConfigs = {
  createBid: { body: createBidSchema.shape.body },
  updateBid: { 
    params: updateBidSchema.shape.params, 
    body: updateBidSchema.shape.body 
  },
  getBidById: { params: getBidByIdSchema.shape.params },
  acceptBid: { params: acceptBidSchema.shape.params },
  rejectBid: { 
    params: rejectBidSchema.shape.params, 
    body: rejectBidSchema.shape.body 
  },
  withdrawBid: { 
    params: withdrawBidSchema.shape.params, 
    body: withdrawBidSchema.shape.body 
  },
  getBidsForTask: { 
    params: getBidsForTaskSchema.shape.params, 
    query: getBidsForTaskSchema.shape.query 
  },
  getUserBids: { query: getUserBidsSchema.shape.query }
};