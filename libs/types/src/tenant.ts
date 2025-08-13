import { BaseEntity, EntityStatus } from './common';

export interface Tenant extends BaseEntity {
  name: string;
  domain: string;
  status: EntityStatus;
  subscriptionPlan: SubscriptionPlan;
  billingInfo: BillingInfo;
  settings: TenantSettings;
  limits: TenantLimits;
  features: TenantFeatures;
  complianceSettings: ComplianceSettings;
}

export interface SubscriptionPlan {
  planId: string;
  planName: string;
  billingCycle: BillingCycle;
  startDate: Date;
  endDate?: Date;
  autoRenew: boolean;
  price: number;
  currency: string;
  status: SubscriptionStatus;
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUALLY = 'ANNUALLY',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export interface BillingInfo {
  companyName: string;
  address: Address;
  taxId?: string;
  paymentMethod: PaymentMethod;
  billingContact: ContactInfo;
}

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PaymentMethod {
  type: PaymentType;
  last4?: string;
  expiresAt?: Date;
  billingAddress: Address;
}

export enum PaymentType {
  CREDIT_CARD = 'CREDIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  ACH = 'ACH',
  WIRE = 'WIRE',
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface TenantSettings {
  branding: BrandingSettings;
  security: SecuritySettings;
  integrations: IntegrationSettings;
  notifications: TenantNotificationSettings;
}

export interface BrandingSettings {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  customCSS?: string;
  whiteLabel: boolean;
}

export interface SecuritySettings {
  passwordPolicy: PasswordPolicy;
  sessionTimeout: number;
  mfaRequired: boolean;
  ipWhitelist?: string[];
  ssoEnabled: boolean;
  ssoProvider?: string;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  maxAge: number;
  historyCount: number;
}

export interface IntegrationSettings {
  custodians: CustodianConfig[];
  marketData: MarketDataConfig[];
  accounting: AccountingConfig[];
}

export interface CustodianConfig {
  name: string;
  enabled: boolean;
  credentials: Record<string, string>;
  settings: Record<string, any>;
}

export interface MarketDataConfig {
  provider: string;
  enabled: boolean;
  credentials: Record<string, string>;
  subscriptions: string[];
}

export interface AccountingConfig {
  system: string;
  enabled: boolean;
  credentials: Record<string, string>;
  mappings: Record<string, string>;
}

export interface TenantNotificationSettings {
  emailFrom: string;
  emailReplyTo: string;
  smsFrom: string;
  webhookUrl?: string;
  slackUrl?: string;
}

export interface TenantLimits {
  maxUsers: number;
  maxPortfolios: number;
  maxDocuments: number;
  maxApiCalls: number;
  storageLimit: number; // in GB
  reportRetention: number; // in days
}

export interface TenantFeatures {
  portfolioManagement: boolean;
  trading: boolean;
  reporting: boolean;
  analytics: boolean;
  compliance: boolean;
  alternativeInvestments: boolean;
  derivatives: boolean;
  structuredProducts: boolean;
  multiCurrency: boolean;
  customReports: boolean;
  api: boolean;
  mobileApp: boolean;
}

export interface ComplianceSettings {
  jurisdiction: string[];
  reportingRequirements: string[];
  dataRetention: number; // in years
  gdprCompliance: boolean;
  pciCompliance: boolean;
  sox404: boolean;
}

export interface CreateTenantRequest {
  name: string;
  domain: string;
  subscriptionPlan: string;
  adminUser: {
    firstName: string;
    lastName: string;
    email: string;
  };
  billingInfo: BillingInfo;
}

export interface UpdateTenantRequest {
  name?: string;
  status?: EntityStatus;
  settings?: Partial<TenantSettings>;
  limits?: Partial<TenantLimits>;
  features?: Partial<TenantFeatures>;
}