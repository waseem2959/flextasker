/**
 * Upload Middleware
 * 
 * This middleware handles file uploads for the application, including:
 * - Avatar/profile pictures
 * - Verification documents
 * - Task attachments
 * - Message attachments
 */

import { AppError } from '../utils/error-utils';
import { Request } from 'express';
import multer from 'multer';
import path from 'path';

/**
 * Configure storage for uploaded files
 * 
 * This determines where files are stored and how they are named.
 * Files are organized into subdirectories based on their type.
 */
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    // Determine upload directory based on file type
    let uploadDir = process.env.UPLOAD_PATH ?? './uploads';
    
    // Create subdirectories for different types of files
    if (file.fieldname === 'avatar') {
      uploadDir = path.join(uploadDir, 'avatars');
    } else if (file.fieldname === 'verification') {
      uploadDir = path.join(uploadDir, 'verification');
    } else if (file.fieldname === 'attachment') {
      uploadDir = path.join(uploadDir, 'attachments');
    }
    
    cb(null, uploadDir);
  },
  
  filename: (_req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = `${file.fieldname}-${uniqueSuffix}${fileExtension}`;
    
    cb(null, fileName);
  },
});

/**
 * File filter to control which files are allowed
 * 
 * This ensures only appropriate file types are accepted based on
 * the purpose of the upload (avatar, verification document, etc.)
 */
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Define allowed file types for different upload types
  const allowedTypes = {
    avatar: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    verification: ['image/jpeg', 'image/png', 'application/pdf'],
    attachment: ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 
                 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  };
  
  const fieldName = file.fieldname as keyof typeof allowedTypes;
  const allowed = allowedTypes[fieldName] || [];
  
  if (allowed.length > 0 && !allowed.includes(file.mimetype)) {
    // File type not allowed - reject with custom error
    cb(new AppError(`File type not allowed. Allowed types: ${allowed.join(', ')}`, 400));
  } else {
    // File type allowed - accept
    cb(null, true);
  }
};

/**
 * Create multer instance with configuration
 * 
 * This configures the file upload middleware with storage location,
 * file filtering, and size limits.
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE ?? '5242880'), // 5MB default
    files: 5, // Maximum 5 files per request
  },
});

/**
 * Middleware for handling avatar uploads
 * 
 * This specifically handles profile picture uploads with appropriate
 * validation and size limits.
 */
export const uploadAvatar = upload.single('avatar');

/**
 * Middleware for handling verification document uploads
 * 
 * This handles identity verification documents with appropriate
 * validation and size limits.
 */
export const uploadVerification = upload.single('verification');

/**
 * Middleware for handling task attachments
 * 
 * This handles file attachments for tasks, allowing multiple files
 * with appropriate validation and size limits.
 */
export const uploadTaskAttachments = upload.array('attachment', 5);

/**
 * Middleware for handling message attachments
 * 
 * This handles file attachments for messages, allowing a single file
 * with appropriate validation and size limits.
 */
export const uploadMessageAttachment = upload.single('attachment');

/**
 * Export the configured multer instance for custom upload handling
 */
export { upload };
