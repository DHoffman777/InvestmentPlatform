import { Request } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: any;
    userId?: string;
    tenantId?: string;
    token?: string;
}
export type RequestHandler = (req: AuthenticatedRequest, res: any, next: any) => any;
//# sourceMappingURL=auth.d.ts.map