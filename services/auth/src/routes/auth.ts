import { Router } from 'express';
import authController from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { 
  registerValidation, 
  loginValidation,
  refreshTokenValidation 
} from '../validators/authValidators';

const router = Router();

// Public routes
router.post('/register', validateRequest(registerValidation), authController.register);
router.post('/login', validateRequest(loginValidation), authController.login);
router.post('/refresh', validateRequest(refreshTokenValidation), authController.refreshToken);

// Email verification routes
router.post('/verify-email', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.use(authMiddleware);
router.post('/logout', authController.logout);
router.get('/me', authController.me);

export default router;