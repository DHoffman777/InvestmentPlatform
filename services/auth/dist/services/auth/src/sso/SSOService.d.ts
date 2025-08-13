import { EventEmitter } from 'events';
export interface SSOConfig {
    issuer: string;
    callbackUrl: string;
    logoutUrl: string;
    certificate: string;
    privateKey: string;
    signatureAlgorithm: string;
    digestAlgorithm: string;
}
export interface SAMLIdentityProvider {
    id: string;
    name: string;
    entityId: string;
    ssoUrl: string;
    sloUrl?: string;
    certificate: string;
    enabled: boolean;
    attributeMapping: AttributeMapping;
}
export interface AttributeMapping {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string;
    department?: string;
    title?: string;
}
export interface OIDCProvider {
    id: string;
    name: string;
    clientId: string;
    clientSecret: string;
    discoveryUrl: string;
    scope: string[];
    enabled: boolean;
    attributeMapping: AttributeMapping;
}
export interface SSOUserProfile {
    providerId: string;
    providerType: 'saml' | 'oidc';
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    department?: string;
    title?: string;
    attributes: Record<string, any>;
    sessionId?: string;
}
export interface SSOSession {
    sessionId: string;
    userId: string;
    providerId: string;
    createdAt: Date;
    expiresAt: Date;
    active: boolean;
    attributes: Record<string, any>;
}
/**
 * Comprehensive Single Sign-On (SSO) Service
 * Supports SAML 2.0 and OpenID Connect for enterprise integration
 */
export declare class SSOService extends EventEmitter {
    private config;
    private samlProviders;
    private oidcProviders;
    private activeSessions;
    private serviceProvider;
    constructor(config: SSOConfig);
    /**
     * Initialize SAML Service Provider
     */
    private initializeServiceProvider;
    /**
     * Register SAML Identity Provider
     */
    registerSAMLProvider(provider: SAMLIdentityProvider): void;
    /**
     * Register OpenID Connect Provider
     */
    registerOIDCProvider(provider: OIDCProvider): void;
    /**
     * Initiate SAML SSO Login
     */
    initiateSAMLLogin(providerId: string, relayState?: string): Promise<string>;
    /**
     * Process SAML SSO Response
     */
    processSAMLResponse(providerId: string, samlResponse: string, relayState?: string): Promise<SSOUserProfile>;
    /**
     * Initiate OpenID Connect Login
     */
    initiateOIDCLogin(providerId: string, state?: string): Promise<string>;
    /**
     * Process OpenID Connect Callback
     */
    processOIDCCallback(providerId: string, code: string, state?: string): Promise<SSOUserProfile>;
    /**
     * Initiate Single Logout
     */
    initiateSingleLogout(sessionId: string): Promise<string | null>;
    /**
     * Validate SSO session
     */
    validateSession(sessionId: string): SSOSession | null;
    /**
     * Get active sessions for user
     */
    getUserSessions(userId: string): SSOSession[];
    /**
     * Terminate all sessions for user
     */
    terminateUserSessions(userId: string): number;
    /**
     * Get metadata for SAML Service Provider
     */
    getSAMLMetadata(): string;
    private extractAttribute;
    private extractRoles;
    private extractRolesFromToken;
    private discoverOIDCConfiguration;
    private exchangeOIDCCode;
}
/**
 * SSO Express.js Middleware
 */
export declare class SSOMiddleware {
    private ssoService;
    constructor(ssoService: SSOService);
    /**
     * Middleware to handle SSO authentication
     */
    authenticate(): (req: any, res: any, next: any) => Promise<any>;
    /**
     * Middleware to require specific SSO provider
     */
    requireProvider(providerId: string): (req: any, res: any, next: any) => any;
}
export default SSOService;
