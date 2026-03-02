import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user: User;
      file?: import('multer').File;
      files?: { [fieldname: string]: import('multer').File[] } | import('multer').File[];
    }
  }
}

export {};
