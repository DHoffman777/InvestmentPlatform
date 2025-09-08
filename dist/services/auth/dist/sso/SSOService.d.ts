export const __esModule: boolean;
export default SSOService;
/**
 * Comprehensive Single Sign-On (SSO) Service
 * Supports SAML 2.0 and OpenID Connect for enterprise integration
 */
export class SSOService extends events_1<[never]> {
    constructor(config: any);
    config: any;
    samlProviders: Map<any, any>;
    oidcProviders: Map<any, any>;
    activeSessions: Map<any, any>;
    serviceProvider: any;
    /**
     * Initialize SAML Service Provider
     */
    initializeServiceProvider(): void;
    /**
     * Register SAML Identity Provider
     */
    registerSAMLProvider(provider: any): void;
    /**
     * Register OpenID Connect Provider
     */
    registerOIDCProvider(provider: any): void;
    /**
     * Initiate SAML SSO Login
     */
    initiateSAMLLogin(providerId: any, relayState: any): Promise<string>;
    /**
     * Process SAML SSO Response
     */
    processSAMLResponse(providerId: any, samlResponse: any, relayState: any): Promise<{
        providerId: any;
        providerType: string;
        userId: any;
        email: any;
        firstName: any;
        lastName: any;
        roles: any[];
        department: any;
        title: any;
        attributes: any;
        sessionId: any;
    }>;
    /**
     * Initiate OpenID Connect Login
     */
    initiateOIDCLogin(providerId: any, state: any): Promise<string>;
    /**
     * Process OpenID Connect Callback
     */
    processOIDCCallback(providerId: any, code: any, state: any): Promise<{
        providerId: any;
        providerType: string;
        userId: any;
        email: any;
        firstName: any;
        lastName: any;
        roles: any[];
        department: any;
        title: any;
        attributes: any;
        sessionId: any;
    }>;
    /**
     * Initiate Single Logout
     */
    initiateSingleLogout(sessionId: any): Promise<any>;
    /**
     * Validate SSO session
     */
    validateSession(sessionId: any): any;
    /**
     * Get active sessions for user
     */
    getUserSessions(userId: any): any[];
    /**
     * Terminate all sessions for user
     */
    terminateUserSessions(userId: any): number;
    /**
     * Get metadata for SAML Service Provider
     */
    getSAMLMetadata(): any;
    extractAttribute(attributes: any, attributeName: any): any;
    extractRoles(attributes: any, roleAttribute: any): any[];
    extractRolesFromToken(token: any, roleClaimName: any): any[];
    discoverOIDCConfiguration(discoveryUrl: any): Promise<{
        authorization_endpoint: string;
        token_endpoint: string;
        end_session_endpoint: string;
    }>;
    exchangeOIDCCode(provider: any, code: any): Promise<{
        access_token: string;
        id_token: any;
        token_type: string;
        expires_in: number;
    }>;
}
/**
 * SSO Express.js Middleware
 */
export class SSOMiddleware {
    constructor(ssoService: any);
    ssoService: any;
    /**
     * Middleware to handle SSO authentication
     */
    authenticate(): (req: any, res: any, next: any) => Promise<any>;
    /**
     * Middleware to require specific SSO provider
     */
    requireProvider(providerId: any): (req: any, res: any, next: any) => any;
}
import events_1 = require("events");
