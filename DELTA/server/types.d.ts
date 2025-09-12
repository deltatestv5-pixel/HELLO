import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    oauthState?: string;
    authenticated?: boolean;
    authTime?: number;
    lastActive?: number;
  }
}

declare module "multer" {
  const multer: any;
  export = multer;
}

declare global {
  namespace Express {
    interface Request {
      user?: import("@shared/schema").User;
      files?: Multer.File[];
    }
    
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
}