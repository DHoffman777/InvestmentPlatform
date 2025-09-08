import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: any; // Simplified to avoid type conflicts
  userId?: string;
  tenantId?: string;
  token?: string;
}

export type RequestHandler = (req: AuthenticatedRequest, res: any, next: any) => any;
