"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const expressValidator = require('express-validator');
const { validationResult } = expressValidator;
const logger_1 = require("../config/logger");
const validateRequest = (validations) => {
    return async (req, res, next) => {
        // Run all validations
        await Promise.all(validations.map(validation => validation.run(req)));
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger_1.logger.warn('Validation failed:', {
                path: req.path,
                errors: errors.array(),
                body: req.body
            });
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                message: 'Invalid request data',
                details: errors.array().map((error) => ({
                    field: error.type === 'field' ? error.path : 'unknown',
                    message: error.msg,
                    value: error.type === 'field' ? error.value : undefined
                }))
            });
            return;
        }
        next();
    };
};
exports.validateRequest = validateRequest;
