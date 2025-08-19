import { Request, Response, NextFunction } from 'express';
type ValidationChain = any;
export declare const validateRequest: (validations: ValidationChain[]) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export {};
