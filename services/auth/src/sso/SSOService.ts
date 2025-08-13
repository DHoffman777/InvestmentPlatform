import * as saml from 'samlify';
import * as jwt from 'jsonwebtoken';
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

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

interface StoredSAMLProvider extends SAMLIdentityProvider {
  identityProvider: any;
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
export class SSOService extends EventEmitter {
  private config: SSOConfig;
  private samlProviders: Map<string, StoredSAMLProvider> = new Map();
  private oidcProviders: Map<string, OIDCProvider> = new Map();
  private activeSessions: Map<string, SSOSession> = new Map();
  private serviceProvider: any;

  constructor(config: SSOConfig) {
    super();
    this.config = config;
    this.initializeServiceProvider();
  }

  /**
   * Initialize SAML Service Provider
   */
  private initializeServiceProvider(): void {
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
  public registerSAMLProvider(provider: SAMLIdentityProvider): void {
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

    } catch (error) {
      this.emit('ssoError', {
        providerId: provider.id,
        error: error instanceof Error ? error.message : String(error),
        operation: 'register_saml_provider',
        timestamp: new Date()
      });
      throw new Error(`Failed to register SAML provider: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Register OpenID Connect Provider
   */
  public registerOIDCProvider(provider: OIDCProvider): void {
    try {
      this.oidcProviders.set(provider.id, provider);

      this.emit('providerRegistered', {
        providerId: provider.id,
        providerType: 'oidc',
        name: provider.name,
        timestamp: new Date()
      });

    } catch (error) {
      this.emit('ssoError', {
        providerId: provider.id,
        error: error instanceof Error ? error.message : String(error),
        operation: 'register_oidc_provider',
        timestamp: new Date()
      });
      throw new Error(`Failed to register OIDC provider: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Initiate SAML SSO Login
   */
  public async initiateSAMLLogin(providerId: string, relayState?: string): Promise<string> {
    try {
      const provider = this.samlProviders.get(providerId);
      if (!provider || !provider.enabled) {
        throw new Error('SAML provider not found or disabled');
      }

      const { context } = this.serviceProvider.createLoginRequest(
        provider.identityProvider,
        'redirect'
      );

      const loginUrl = context + (relayState ? `&RelayState=${encodeURIComponent(relayState)}` : '');

      this.emit('ssoLoginInitiated', {
        providerId,
        providerType: 'saml',
        timestamp: new Date(),
        relayState
      });

      return loginUrl;

    } catch (error) {
      this.emit('ssoError', {
        providerId,
        error: error instanceof Error ? error.message : String(error),
        operation: 'initiate_saml_login',
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Process SAML SSO Response
   */
  public async processSAMLResponse(
    providerId: string, 
    samlResponse: string, 
    relayState?: string
  ): Promise<SSOUserProfile> {
    try {
      const provider = this.samlProviders.get(providerId);
      if (!provider) {
        throw new Error('SAML provider not found');
      }

      const { extract } = await this.serviceProvider.parseLoginResponse(
        provider.identityProvider,
        'post',
        { body: { SAMLResponse: samlResponse } }
      );

      const attributes = extract.attributes;
      const sessionId = crypto.randomUUID();

      // Map SAML attributes to user profile
      const userProfile: SSOUserProfile = {
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
      const session: SSOSession = {
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

    } catch (error) {
      this.emit('ssoError', {
        providerId,
        error: error instanceof Error ? error.message : String(error),
        operation: 'process_saml_response',
        timestamp: new Date()
      });
      throw new Error(`Failed to process SAML response: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Initiate OpenID Connect Login
   */
  public async initiateOIDCLogin(providerId: string, state?: string): Promise<string> {
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

    } catch (error) {
      this.emit('ssoError', {
        providerId,
        error: error instanceof Error ? error.message : String(error),
        operation: 'initiate_oidc_login',
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Process OpenID Connect Callback
   */
  public async processOIDCCallback(
    providerId: string, 
    code: string, 
    state?: string
  ): Promise<SSOUserProfile> {
    try {
      const provider = this.oidcProviders.get(providerId);
      if (!provider) {
        throw new Error('OIDC provider not found');
      }

      // Exchange authorization code for tokens
      const tokenResponse = await this.exchangeOIDCCode(provider, code);
      
      // Decode ID token to get user information
      const idToken = jwt.decode(tokenResponse.id_token) as any;
      const sessionId = crypto.randomUUID();

      // Map OIDC claims to user profile
      const userProfile: SSOUserProfile = {
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
      const session: SSOSession = {
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

    } catch (error) {
      this.emit('ssoError', {
        providerId,
        error: error instanceof Error ? error.message : String(error),
        operation: 'process_oidc_callback',
        timestamp: new Date()
      });
      throw new Error(`Failed to process OIDC callback: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Initiate Single Logout
   */
  public async initiateSingleLogout(sessionId: string): Promise<string | null> {
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

      let logoutUrl: string | null = null;

      if (this.samlProviders.has(session.providerId)) {
        // SAML Single Logout
        const samlProvider = this.samlProviders.get(session.providerId)!;
        if (samlProvider.sloUrl) {
          const { context } = this.serviceProvider.createLogoutRequest(
            samlProvider.identityProvider,
            'redirect',
            session.userId
          );
          logoutUrl = context;
        }
      } else if (this.oidcProviders.has(session.providerId)) {
        // OIDC Logout
        const oidcProvider = this.oidcProviders.get(session.providerId)!;
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

    } catch (error) {
      this.emit('ssoError', {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
        operation: 'initiate_single_logout',
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Validate SSO session
   */
  public validateSession(sessionId: string): SSOSession | null {
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
  public getUserSessions(userId: string): SSOSession[] {
    return Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId && session.active);
  }

  /**
   * Terminate all sessions for user
   */
  public terminateUserSessions(userId: string): number {
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
  public getSAMLMetadata(): string {
    return this.serviceProvider.getMetadata();
  }

  // Private helper methods

  private extractAttribute(attributes: any, attributeName: string): string {
    const value = attributes[attributeName];
    return Array.isArray(value) ? value[0] : value || '';
  }

  private extractRoles(attributes: any, roleAttribute: string): string[] {
    const roles = attributes[roleAttribute];
    if (!roles) return [];
    return Array.isArray(roles) ? roles : [roles];
  }

  private extractRolesFromToken(token: any, roleClaimName: string): string[] {
    const roles = token[roleClaimName] || token.roles || [];
    return Array.isArray(roles) ? roles : [roles];
  }

  private async discoverOIDCConfiguration(discoveryUrl: string): Promise<any> {
    // In production, implement actual HTTP request to discovery endpoint
    // This is a placeholder implementation
    return {
      authorization_endpoint: `${discoveryUrl.replace('/.well-known/openid_configuration', '')}/authorize`,
      token_endpoint: `${discoveryUrl.replace('/.well-known/openid_configuration', '')}/token`,
      end_session_endpoint: `${discoveryUrl.replace('/.well-known/openid_configuration', '')}/logout`
    };
  }

  private async exchangeOIDCCode(provider: OIDCProvider, code: string): Promise<any> {
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

/**
 * SSO Express.js Middleware
 */
export class SSOMiddleware {
  private ssoService: SSOService;

  constructor(ssoService: SSOService) {
    this.ssoService = ssoService;
  }

  /**
   * Middleware to handle SSO authentication
   */
  public authenticate() {
    return async (req: any, res: any, next: any) => {
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
      } catch (error) {
        res.status(500).json({
          error: 'SSO authentication error',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    };
  }

  /**
   * Middleware to require specific SSO provider
   */
  public requireProvider(providerId: string) {
    return (req: any, res: any, next: any) => {
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

export default SSOService;