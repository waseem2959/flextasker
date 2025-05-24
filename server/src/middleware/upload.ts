import { AppError } from '@/utils/errors';
import { Request } from 'express';
import multer from 'multer';
import path from 'path';

/**
 * File upload middleware - this handles user file uploads like profile pictures,
 * task attachments, verification documents, etc. It's like having a mail room
 * that sorts and stores incoming packages safely.
 */

// Configure storage for uploaded files
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

// File filter to control which files are allowed
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
  
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type ${file.mimetype} is not allowed for ${fieldName}`, 400));
  }
};

// Create multer instance with configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE ?? '5242880'), // 5MB default
    files: 5, // Maximum 5 files per request
  },
});

// Export different upload configurations for different use cases
export const uploadAvatar = upload.single('avatar');
export const uploadVerification = upload.single('verification');
export const uploadAttachments = upload.array('attachments', 5);
export const uploadSingle = upload.single('file');
export const uploadMultiple = upload.array('files', 10);
