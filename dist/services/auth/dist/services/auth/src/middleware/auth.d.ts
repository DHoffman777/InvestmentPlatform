export const __esModule: boolean;
export function authMiddleware(req: any, res: any, next: any): Promise<void>;
export function requirePermissions(permissions: any): (req: any, res: any, next: any) => void;
export function requireRoles(roles: any): (req: any, res: any, next: any) => void;
export function optionalAuth(req: any, res: any, next: any): Promise<void>;
