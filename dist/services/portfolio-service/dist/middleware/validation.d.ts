export const __esModule: boolean;
export default validateRequest;
/**
 * Express middleware factory for request validation
 */
export function validateRequest(schema: any): (req: any, res: any, next: any) => any;
/**
 * Middleware for validating query parameters
 */
export function validateQuery(schema: any): (req: any, res: any, next: any) => any;
/**
 * Middleware for validating URL parameters
 */
export function validateParams(schema: any): (req: any, res: any, next: any) => any;
