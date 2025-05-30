import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      language?: string;
      user?: User & {
        language?: string;
      };
    }
  }
}

export {};
