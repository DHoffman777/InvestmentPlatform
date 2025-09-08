"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordValidation = exports.passwordResetValidation = exports.emailValidation = exports.refreshTokenValidation = exports.loginValidation = exports.registerValidation = void 0;
const expressValidator = require('express-validator');
const { body } = expressValidator;
exports.registerValidation = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('firstName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
    body('lastName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must be between 1 and 50 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
    body('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number'),
    body('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid date of birth in ISO 8601 format'),
    body('address')
        .optional()
        .isObject()
        .withMessage('Address must be an object'),
    body('address.street')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Street address must be between 1 and 100 characters'),
    body('address.city')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('City must be between 1 and 50 characters'),
    body('address.state')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('State must be between 1 and 50 characters'),
    body('address.zipCode')
        .optional()
        .trim()
        .matches(/^\d{5}(-\d{4})?$/)
        .withMessage('Please provide a valid ZIP code'),
    body('address.country')
        .optional()
        .trim()
        .isLength({ min: 2, max: 3 })
        .withMessage('Country must be a 2 or 3 character country code')
];
exports.loginValidation = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 1 })
        .withMessage('Password is required')
];
exports.refreshTokenValidation = [
    body('refreshToken')
        .optional()
        .isString()
        .isLength({ min: 1 })
        .withMessage('Refresh token must be a non-empty string')
];
exports.emailValidation = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail()
];
exports.passwordResetValidation = [
    body('token')
        .isString()
        .isLength({ min: 1 })
        .withMessage('Reset token is required'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('confirmPassword')
        .custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Password confirmation does not match password');
        }
        return true;
    })
];
exports.changePasswordValidation = [
    body('currentPassword')
        .isLength({ min: 1 })
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('confirmPassword')
        .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
            throw new Error('Password confirmation does not match new password');
        }
        return true;
    })
];
