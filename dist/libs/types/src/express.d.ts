import { Request } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: any;
    userId?: string;
    tenantId?: string;
    requestId?: string;
}
export interface RequestWithFiles extends AuthenticatedRequest {
    files?: Express.Multer.File[];
    file?: Express.Multer.File;
}
