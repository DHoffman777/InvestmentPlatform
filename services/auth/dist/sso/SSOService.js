"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSOMiddleware = exports.SSOService = void 0;
const saml = __importStar(require("samlify"));
const jwt = __importStar(require("jsonwebtoken"));
const events_1 = require("events");
const crypto = __importStar(require("crypto"));
/**
 * Comprehensive Single Sign-On (SSO) Service
 * Supports SAML 2.0 and OpenID Connect for enterprise integration
 */
class SSOService extends events_1.EventEmitter {
    config;
    samlProviders = new Map();
    oidcProviders = new Map();
    activeSessions = new Map();
    serviceProvider;
    constructor(config) {
        super();
        this.config = config;
        this.initializeServiceProvider();
    }
    /**
     * Initialize SAML Service Provider
     */
    initializeServiceProvider() {
        this.serviceProvider = saml.ServiceProvider({
            entityID: this.config.issuer,
            assertionConsumerService: [{
                    Binding: saml.Constants.namespace.binding.post,
                    Location: this.config.callbackUrl
                }],
            singleLogoutService: [{
                    Binding: saml.Constants.namespace.binding.post,
                    Location: this.config.logoutUrl
                }],
            nameIDFormat: ['urn:oasis:names:tc:SAML:2.0:nameid-format:persistent'],
            signatureConfig: {
                prefix: 'ds',
                location: { reference: '/samlp:Response/saml:Issuer', action: 'after' }
            },
            privateKey: this.config.privateKey,
            privateKeyPass: undefined,
            requestSignatureAlgorithm: this.config.signatureAlgorithm
        });
    }
    /**
     * Register SAML Identity Provider
     */
    registerSAMLProvider(provider) {
        try {
            const identityProvider = saml.IdentityProvider({
                entityID: provider.entityId,
                singleSignOnService: [{
                        Binding: saml.Constants.namespace.binding.post,
                        Location: provider.ssoUrl
                    }],
                singleLogoutService: provider.sloUrl ? [{
                        Binding: saml.Constants.namespace.binding.post,
                        Location: provider.sloUrl
                    }] : undefined,
                nameIDFormat: ['urn:oasis:names:tc:SAML:2.0:nameid-format:persistent'],
                signingCert: provider.certificate
            });
            this.samlProviders.set(provider.id, {
                ...provider,
                identityProvider
            });
            this.emit('providerRegistered', {
                providerId: provider.id,
                providerType: 'saml',
                name: provider.name,
                timestamp: new Date()
            });
        }
        catch (error) {
            this.emit('ssoError', {
                providerId: provider.id,
                error: error.message,
                operation: 'register_saml_provider',
                timestamp: new Date()
            });
            throw new Error(`Failed to register SAML provider: ${error.message}`);
        }
    }
    /**
     * Register OpenID Connect Provider
     */
    registerOIDCProvider(provider) {
        try {
            this.oidcProviders.set(provider.id, provider);
            this.emit('providerRegistered', {
                providerId: provider.id,
                providerType: 'oidc',
                name: provider.name,
                timestamp: new Date()
            });
        }
        catch (error) {
            this.emit('ssoError', {
                providerId: provider.id,
                error: error.message,
                operation: 'register_oidc_provider',
                timestamp: new Date()
            });
            throw new Error(`Failed to register OIDC provider: ${error.message}`);
        }
    }
    /**
     * Initiate SAML SSO Login
     */
    async initiateSAMLLogin(providerId, relayState) {
        try {
            const provider = this.samlProviders.get(providerId);
            if (!provider || !provider.enabled) {
                throw new Error('SAML provider not found or disabled');
            }
            const { context } = this.serviceProvider.createLoginRequest(provider.identityProvider, 'redirect');
            const loginUrl = context + (relayState ? `&RelayState=${encodeURIComponent(relayState)}` : '');
            this.emit('ssoLoginInitiated', {
                providerId,
                providerType: 'saml',
                timestamp: new Date(),
                relayState
            });
            return loginUrl;
        }
        catch (error) {
            this.emit('ssoError', {
                providerId,
                error: error.message,
                operation: 'initiate_saml_login',
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Process SAML SSO Response
     */
    async processSAMLResponse(providerId, samlResponse, relayState) {
        try {
            const provider = this.samlProviders.get(providerId);
            if (!provider) {
                throw new Error('SAML provider not found');
            }
            const { extract } = await this.serviceProvider.parseLoginResponse(provider.identityProvider, 'post', { body: { SAMLResponse: samlResponse } });
            const attributes = extract.attributes;
            const sessionId = crypto.randomUUID();
            // Map SAML attributes to user profile
            const userProfile = {
                providerId,
                providerType: 'saml',
                userId: this.extractAttribute(attributes, provider.attributeMapping.userId),
                email: this.extractAttribute(attributes, provider.attributeMapping.email),
                firstName: this.extractAttribute(attributes, provider.attributeMapping.firstName),
                lastName: this.extractAttribute(attributes, provider.attributeMapping.lastName),
                roles: this.extractRoles(attributes, provider.attributeMapping.roles),
                department: provider.attributeMapping.department ?
                    this.extractAttribute(attributes, provider.attributeMapping.department) : undefined,
                title: provider.attributeMapping.title ?
                    this.extractAttribute(attributes, provider.attributeMapping.title) : undefined,
                attributes,
                sessionId
            };
            // Create SSO session
            const session = {
                sessionId,
                userId: userProfile.userId,
                providerId,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
                active: true,
                attributes
            };
            this.activeSessions.set(sessionId, session);
            this.emit('ssoLoginSuccess', {
                providerId,
                providerType: 'saml',
                userId: userProfile.userId,
                email: userProfile.email,
                sessionId,
                timestamp: new Date()
            });
            return userProfile;
        }
        catch (error) {
            this.emit('ssoError', {
                providerId,
                error: error.message,
                operation: 'process_saml_response',
                timestamp: new Date()
            });
            throw new Error(`Failed to process SAML response: ${error.message}`);
        }
    }
    /**
     * Initiate OpenID Connect Login
     */
    async initiateOIDCLogin(providerId, state) {
        try {
            const provider = this.oidcProviders.get(providerId);
            if (!provider || !provider.enabled) {
                throw new Error('OIDC provider not found or disabled');
            }
            // Discover OpenID Connect configuration
            const discovery = await this.discoverOIDCConfiguration(provider.discoveryUrl);
            const authParams = new URLSearchParams({
                response_type: 'code',
                client_id: provider.clientId,
                redirect_uri: this.config.callbackUrl,
                scope: provider.scope.join(' '),
                state: state || crypto.randomUUID()
            });
            const authUrl = `${discovery.authorization_endpoint}?${authParams.toString()}`;
            this.emit('ssoLoginInitiated', {
                providerId,
                providerType: 'oidc',
                timestamp: new Date(),
                state
            });
            return authUrl;
        }
        catch (error) {
            this.emit('ssoError', {
                providerId,
                error: error.message,
                operation: 'initiate_oidc_login',
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Process OpenID Connect Callback
     */
    async processOIDCCallback(providerId, code, state) {
        try {
            const provider = this.oidcProviders.get(providerId);
            if (!provider) {
                throw new Error('OIDC provider not found');
            }
            // Exchange authorization code for tokens
            const tokenResponse = await this.exchangeOIDCCode(provider, code);
            // Decode ID token to get user information
            const idToken = jwt.decode(tokenResponse.id_token);
            const sessionId = crypto.randomUUID();
            // Map OIDC claims to user profile
            const userProfile = {
                providerId,
                providerType: 'oidc',
                userId: idToken[provider.attributeMapping.userId] || idToken.sub,
                email: idToken[provider.attributeMapping.email] || idToken.email,
                firstName: idToken[provider.attributeMapping.firstName] || idToken.given_name,
                lastName: idToken[provider.attributeMapping.lastName] || idToken.family_name,
                roles: this.extractRolesFromToken(idToken, provider.attributeMapping.roles),
                department: provider.attributeMapping.department ?
                    idToken[provider.attributeMapping.department] : undefined,
                title: provider.attributeMapping.title ?
                    idToken[provider.attributeMapping.title] : undefined,
                attributes: idToken,
                sessionId
            };
            // Create SSO session
            const session = {
                sessionId,
                userId: userProfile.userId,
                providerId,
                createdAt: new Date(),
                expiresAt: new Date(idToken.exp * 1000),
                active: true,
                attributes: idToken
            };
            this.activeSessions.set(sessionId, session);
            this.emit('ssoLoginSuccess', {
                providerId,
                providerType: 'oidc',
                userId: userProfile.userId,
                email: userProfile.email,
                sessionId,
                timestamp: new Date()
            });
            return userProfile;
        }
        catch (error) {
            this.emit('ssoError', {
                providerId,
                error: error.message,
                operation: 'process_oidc_callback',
                timestamp: new Date()
            });
            throw new Error(`Failed to process OIDC callback: ${error.message}`);
        }
    }
    /**
     * Initiate Single Logout
     */
    async initiateSingleLogout(sessionId) {
        try {
            const session = this.activeSessions.get(sessionId);
            if (!session || !session.active) {
                return null;
            }
            const provider = this.samlProviders.get(session.providerId) ||
                this.oidcProviders.get(session.providerId);
            if (!provider) {
                throw new Error('Provider not found for session');
            }
            // Mark session as inactive
            session.active = false;
            this.activeSessions.set(sessionId, session);
            let logoutUrl = null;
            if (this.samlProviders.has(session.providerId)) {
                // SAML Single Logout
                const samlProvider = this.samlProviders.get(session.providerId);
                if (samlProvider.sloUrl) {
                    const { context } = this.serviceProvider.createLogoutRequest(samlProvider.identityProvider, 'redirect', session.userId);
                    logoutUrl = context;
                }
            }
            else if (this.oidcProviders.has(session.providerId)) {
                // OIDC Logout
                const oidcProvider = this.oidcProviders.get(session.providerId);
                const discovery = await this.discoverOIDCConfiguration(oidcProvider.discoveryUrl);
                if (discovery.end_session_endpoint) {
                    const logoutParams = new URLSearchParams({
                        post_logout_redirect_uri: this.config.logoutUrl,
                        client_id: oidcProvider.clientId
                    });
                    logoutUrl = `${discovery.end_session_endpoint}?${logoutParams.toString()}`;
                }
            }
            this.emit('ssoLogoutInitiated', {
                providerId: session.providerId,
                userId: session.userId,
                sessionId,
                timestamp: new Date()
            });
            return logoutUrl;
        }
        catch (error) {
            this.emit('ssoError', {
                sessionId,
                error: error.message,
                operation: 'initiate_single_logout',
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Validate SSO session
     */
    validateSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session || !session.active) {
            return null;
        }
        if (session.expiresAt < new Date()) {
            session.active = false;
            this.activeSessions.set(sessionId, session);
            return null;
        }
        return session;
    }
    /**
     * Get active sessions for user
     */
    getUserSessions(userId) {
        return Array.from(this.activeSessions.values())
            .filter(session => session.userId === userId && session.active);
    }
    /**
     * Terminate all sessions for user
     */
    terminateUserSessions(userId) {
        let terminatedCount = 0;
        for (const [sessionId, session] of this.activeSessions.entries()) {
            if (session.userId === userId && session.active) {
                session.active = false;
                this.activeSessions.set(sessionId, session);
                terminatedCount++;
            }
        }
        this.emit('userSessionsTerminated', {
            userId,
            sessionCount: terminatedCount,
            timestamp: new Date()
        });
        return terminatedCount;
    }
    /**
     * Get metadata for SAML Service Provider
     */
    getSAMLMetadata() {
        return this.serviceProvider.getMetadata();
    }
    // Private helper methods
    extractAttribute(attributes, attributeName) {
        const value = attributes[attributeName];
        return Array.isArray(value) ? value[0] : value || '';
    }
    extractRoles(attributes, roleAttribute) {
        const roles = attributes[roleAttribute];
        if (!roles)
            return [];
        return Array.isArray(roles) ? roles : [roles];
    }
    extractRolesFromToken(token, roleClaimName) {
        const roles = token[roleClaimName] || token.roles || [];
        return Array.isArray(roles) ? roles : [roles];
    }
    async discoverOIDCConfiguration(discoveryUrl) {
        // In production, implement actual HTTP request to discovery endpoint
        // This is a placeholder implementation
        return {
            authorization_endpoint: `${discoveryUrl.replace('/.well-known/openid_configuration', '')}/authorize`,
            token_endpoint: `${discoveryUrl.replace('/.well-known/openid_configuration', '')}/token`,
            end_session_endpoint: `${discoveryUrl.replace('/.well-known/openid_configuration', '')}/logout`
        };
    }
    async exchangeOIDCCode(provider, code) {
        // In production, implement actual token exchange
        // This is a placeholder implementation
        const mockIdToken = jwt.sign({
            sub: 'user123',
            email: 'user@example.com',
            given_name: 'John',
            family_name: 'Doe',
            roles: ['user'],
            exp: Math.floor(Date.now() / 1000) + 3600
        }, 'mock-secret');
        return {
            access_token: 'mock-access-token',
            id_token: mockIdToken,
            token_type: 'Bearer',
            expires_in: 3600
        };
    }
}
exports.SSOService = SSOService;
/**
 * SSO Express.js Middleware
 */
class SSOMiddleware {
    ssoService;
    constructor(ssoService) {
        this.ssoService = ssoService;
    }
    /**
     * Middleware to handle SSO authentication
     */
    authenticate() {
        return async (req, res, next) => {
            try {
                const sessionId = req.headers['x-sso-session'] || req.session?.ssoSessionId;
                if (!sessionId) {
                    return res.status(401).json({
                        error: 'SSO authentication required',
                        message: 'No SSO session found'
                    });
                }
                const session = this.ssoService.validateSession(sessionId);
                if (!session) {
                    return res.status(401).json({
                        error: 'Invalid SSO session',
                        message: 'SSO session expired or invalid'
                    });
                }
                req.ssoSession = session;
                req.user = {
                    id: session.userId,
                    provider: session.providerId,
                    attributes: session.attributes
                };
                next();
            }
            catch (error) {
                res.status(500).json({
                    error: 'SSO authentication error',
                    message: error.message
                });
            }
        };
    }
    /**
     * Middleware to require specific SSO provider
     */
    requireProvider(providerId) {
        return (req, res, next) => {
            if (req.ssoSession?.providerId !== providerId) {
                return res.status(403).json({
                    error: 'Invalid SSO provider',
                    message: `Access requires ${providerId} authentication`
                });
            }
            next();
        };
    }
}
exports.SSOMiddleware = SSOMiddleware;
exports.default = SSOService;
