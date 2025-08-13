import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}
export declare const errorHandler: (error: CustomError | Prisma.PrismaClientKnownRequestError | Error, req: Request, res: Response, next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, res: Response) => void;
export {};
//# sourceMappingURL=errorHandler.d.ts.map