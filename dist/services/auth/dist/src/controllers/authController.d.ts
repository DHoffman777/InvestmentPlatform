export const __esModule: boolean;
declare const _default: AuthController;
export default _default;
export class AuthController {
    authService: auth_1.AuthService;
    jwtService: jwt_1.JWTService;
    register: (req: any, res: any, next: any) => Promise<void>;
    login: (req: any, res: any, next: any) => Promise<void>;
    refreshToken: (req: any, res: any, next: any) => Promise<void>;
    logout: (req: any, res: any, next: any) => Promise<void>;
    me: (req: any, res: any, next: any) => Promise<void>;
    verifyEmail: (req: any, res: any, next: any) => Promise<void>;
    forgotPassword: (req: any, res: any, next: any) => Promise<void>;
    resetPassword: (req: any, res: any, next: any) => Promise<void>;
}
import auth_1 = require("../services/auth");
import jwt_1 = require("../services/jwt");
