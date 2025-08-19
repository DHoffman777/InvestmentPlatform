import { Request, Response, NextFunction } from 'express';
interface ValidationRule {
    required?: boolean;
    type?: string;
    enum?: string[];
    format?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    message?: string;
}
interface ValidationSchema {
    [key: string]: ValidationRule;
}
/**
 * Express middleware factory for request validation
 */
export declare function validateRequest(schema: ValidationSchema): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware for validating query parameters
 */
export declare function validateQuery(schema: ValidationSchema): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware for validating URL parameters
 */
export declare function validateParams(schema: ValidationSchema): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export default validateRequest;
