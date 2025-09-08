import { Request, Response, NextFunction } from 'express';
interface AuthenticatedRequest extends Request {
    user?: any;
    userId?: string;
    tenantId?: string;
}
export declare class AuthController {
    private authService;
    private jwtService;
    constructor();
    register: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>;
    login: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>;
    refreshToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>;
    logout: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>;
    me: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>;
    verifyEmail: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>;
    forgotPassword: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>;
    resetPassword: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>;
}
declare const _default: AuthController;
export default _default;
