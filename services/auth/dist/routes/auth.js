"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = __importDefault(require("../controllers/authController"));
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const authValidators_1 = require("../validators/authValidators");
const router = (0, express_1.Router)();
// Public routes
router.post('/register', (0, validation_1.validateRequest)(authValidators_1.registerValidation), authController_1.default.register);
router.post('/login', (0, validation_1.validateRequest)(authValidators_1.loginValidation), authController_1.default.login);
router.post('/refresh', (0, validation_1.validateRequest)(authValidators_1.refreshTokenValidation), authController_1.default.refreshToken);
// Email verification routes
router.post('/verify-email', authController_1.default.verifyEmail);
router.post('/forgot-password', authController_1.default.forgotPassword);
router.post('/reset-password', authController_1.default.resetPassword);
// Protected routes
router.use(auth_1.authMiddleware);
router.post('/logout', authController_1.default.logout);
router.get('/me', authController_1.default.me);
exports.default = router;
