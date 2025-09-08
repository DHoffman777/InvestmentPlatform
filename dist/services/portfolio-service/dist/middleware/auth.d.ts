export const __esModule: boolean;
export function authMiddleware(req: any, res: any, next: any): any;
export function requireRole(requiredRoles: any): (req: any, res: any, next: any) => any;
export function requirePermission(requiredPermissions: any): (req: any, res: any, next: any) => any;
export function requireTenantAccess(req: any, res: any, next: any): any;
export { authMiddleware as authenticateToken, authMiddleware as requireAuth };
