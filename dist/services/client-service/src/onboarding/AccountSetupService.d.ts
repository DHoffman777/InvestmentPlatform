import { EventEmitter } from 'events';
export interface AccountSetupRequest {
    id: string;
    clientId: string;
    tenantId: string;
    workflowId: string;
    accountConfiguration: AccountConfiguration;
    fundingSetup: FundingSetup;
    investmentPreferences: InvestmentPreferences;
    status: AccountSetupStatus;
    setupSteps: SetupStep[];
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    errors: SetupError[];
}
export interface AccountConfiguration {
    accountType: AccountType;
    accountName: string;
    accountPurpose: AccountPurpose;
    taxStatus: TaxStatus;
    jurisdiction: string;
    baseCurrency: string;
    multiCurrency: boolean;
    supportedCurrencies: string[];
    tradingPermissions: TradingPermission[];
    restrictions: AccountRestriction[];
    beneficiaries?: Beneficiary[];
    trustees?: Trustee[];
    authorizedUsers?: AuthorizedUser[];
    custodian?: CustodianInfo;
    subAccountStructure?: SubAccountConfig[];
}
export interface FundingSetup {
    id: string;
    initialFundingRequired: boolean;
    minimumInitialDeposit: number;
    plannedInitialDeposit?: number;
    fundingSources: FundingSource[];
    bankingInstructions: BankingInstructions;
    wireInstructions?: WireInstructions;
    achSetup?: ACHSetup;
    checkDeposit?: CheckDepositSetup;
    transferInstructions?: TransferInstructions[];
    fundingTimeline: FundingTimeline;
    complianceChecks: FundingComplianceCheck[];
}
export interface InvestmentPreferences {
    riskTolerance: RiskTolerance;
    investmentObjectives: InvestmentObjective[];
    timeHorizon: TimeHorizon;
    liquidityNeeds: LiquidityNeeds;
    investmentExperience: InvestmentExperience;
    assetClassPreferences: AssetClassPreference[];
    restrictedInvestments: string[];
    investmentConstraints: InvestmentConstraint[];
    modelPortfolio?: ModelPortfolioPreference;
    rebalancingPreferences: RebalancingPreference;
    taxOptimization: TaxOptimizationPreference;
}
export interface SetupStep {
    id: string;
    name: string;
    description: string;
    status: StepStatus;
    order: number;
    dependencies: string[];
    startedAt?: Date;
    completedAt?: Date;
    data: Record<string, any>;
    errors: string[];
}
export interface SetupError {
    code: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    stepId?: string;
    timestamp: Date;
    resolved: boolean;
    resolution?: string;
}
export interface Beneficiary {
    id: string;
    type: 'primary' | 'contingent';
    personalInfo: {
        firstName: string;
        lastName: string;
        dateOfBirth: Date;
        ssn?: string;
        relationship: string;
    };
    contactInfo: {
        address: Address;
        phone?: string;
        email?: string;
    };
    allocation: number;
    restrictions?: string[];
}
export interface Trustee {
    id: string;
    type: 'individual' | 'corporate';
    personalInfo?: {
        firstName: string;
        lastName: string;
        title: string;
        ssn?: string;
    };
    corporateInfo?: {
        companyName: string;
        ein: string;
        address: Address;
    };
    powers: TrusteePower[];
    limitations?: string[];
}
export interface AuthorizedUser {
    id: string;
    personalInfo: {
        firstName: string;
        lastName: string;
        dateOfBirth: Date;
        ssn?: string;
    };
    contactInfo: {
        address: Address;
        phone: string;
        email: string;
    };
    permissions: UserPermission[];
    tradingLimits?: TradingLimit[];
    accessLevel: 'full' | 'limited' | 'view_only';
}
export interface Address {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}
export interface CustodianInfo {
    name: string;
    identifier: string;
    contactInfo: {
        phone: string;
        email: string;
        address: Address;
    };
    accountNumber?: string;
    clearingFirm?: string;
}
export interface SubAccountConfig {
    name: string;
    purpose: string;
    accountType: AccountType;
    restrictions?: string[];
}
export interface FundingSource {
    id: string;
    type: FundingSourceType;
    name: string;
    verified: boolean;
    primary: boolean;
    details: Record<string, any>;
    limits?: {
        dailyLimit?: number;
        monthlyLimit?: number;
        annualLimit?: number;
    };
}
export interface BankingInstructions {
    accountName: string;
    bankName: string;
    routingNumber: string;
    accountNumber: string;
    accountType: 'checking' | 'savings';
    verified: boolean;
    verificationMethod?: 'micro_deposits' | 'instant_verification' | 'manual';
    verificationDate?: Date;
}
export interface WireInstructions {
    receivingBank: {
        name: string;
        address: Address;
        swiftCode?: string;
        routingNumber: string;
    };
    beneficiaryAccount: {
        name: string;
        accountNumber: string;
        address: Address;
    };
    intermediaryBank?: {
        name: string;
        swiftCode: string;
        routingNumber: string;
    };
    specialInstructions?: string;
}
export interface ACHSetup {
    enabled: boolean;
    limits: {
        dailyLimit: number;
        monthlyLimit: number;
    };
    restrictions: string[];
    processingDays: number[];
}
export interface CheckDepositSetup {
    enabled: boolean;
    limits: {
        dailyLimit: number;
        monthlyLimit: number;
    };
    holdPeriod: number;
}
export interface TransferInstructions {
    type: 'ira_rollover' | 'acat' | 'trustee_to_trustee' | 'in_kind';
    fromFirm: string;
    fromAccount: string;
    transferAgent?: string;
    assets?: AssetTransfer[];
    timeline: string;
    specialInstructions?: string;
}
export interface AssetTransfer {
    symbol: string;
    quantity: number;
    marketValue: number;
    cusip?: string;
}
export interface FundingTimeline {
    targetDate: Date;
    milestones: FundingMilestone[];
}
export interface FundingMilestone {
    name: string;
    targetDate: Date;
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
    dependencies: string[];
}
export interface FundingComplianceCheck {
    type: string;
    status: 'pending' | 'passed' | 'failed' | 'requires_review';
    details: Record<string, any>;
    checkedAt?: Date;
    reviewedBy?: string;
}
export interface AssetClassPreference {
    assetClass: string;
    allocation: number;
    constraints?: string[];
}
export interface InvestmentConstraint {
    type: 'exclusion' | 'inclusion' | 'limit' | 'requirement';
    description: string;
    parameters: Record<string, any>;
}
export interface ModelPortfolioPreference {
    modelId: string;
    customizations?: Record<string, any>;
    rebalancingFrequency: 'monthly' | 'quarterly' | 'semi_annually' | 'annually';
}
export interface RebalancingPreference {
    automatic: boolean;
    frequency: 'monthly' | 'quarterly' | 'semi_annually' | 'annually';
    threshold: number;
    method: 'time_based' | 'threshold_based' | 'hybrid';
}
export interface TaxOptimizationPreference {
    enabled: boolean;
    harvestLosses: boolean;
    assetLocation: boolean;
    taxLotManagement: 'fifo' | 'lifo' | 'specific_id' | 'tax_optimized';
}
export interface TradingLimit {
    type: 'daily' | 'monthly' | 'per_transaction';
    amount: number;
    assetClass?: string;
}
export declare enum AccountType {
    INDIVIDUAL_TAXABLE = "INDIVIDUAL_TAXABLE",
    JOINT_TAXABLE = "JOINT_TAXABLE",
    TRADITIONAL_IRA = "TRADITIONAL_IRA",
    ROTH_IRA = "ROTH_IRA",
    SEP_IRA = "SEP_IRA",
    SIMPLE_IRA = "SIMPLE_IRA",
    ROLLOVER_IRA = "ROLLOVER_IRA",
    CORPORATE = "CORPORATE",
    LLC = "LLC",
    PARTNERSHIP = "PARTNERSHIP",
    TRUST = "TRUST",
    ESTATE = "ESTATE",
    CUSTODIAL = "CUSTODIAL",
    FOUR_OH_ONE_K = "401K"
}
export declare enum AccountPurpose {
    RETIREMENT = "RETIREMENT",
    EDUCATION = "EDUCATION",
    GENERAL_INVESTMENT = "GENERAL_INVESTMENT",
    WEALTH_PRESERVATION = "WEALTH_PRESERVATION",
    INCOME_GENERATION = "INCOME_GENERATION",
    CAPITAL_APPRECIATION = "CAPITAL_APPRECIATION",
    SPECULATION = "SPECULATION",
    ESTATE_PLANNING = "ESTATE_PLANNING"
}
export declare enum TaxStatus {
    TAXABLE = "TAXABLE",
    TAX_DEFERRED = "TAX_DEFERRED",
    TAX_FREE = "TAX_FREE",
    TAX_EXEMPT = "TAX_EXEMPT"
}
export declare enum TradingPermission {
    EQUITIES = "EQUITIES",
    OPTIONS = "OPTIONS",
    FUTURES = "FUTURES",
    FOREX = "FOREX",
    FIXED_INCOME = "FIXED_INCOME",
    MUTUAL_FUNDS = "MUTUAL_FUNDS",
    ETFS = "ETFS",
    ALTERNATIVE_INVESTMENTS = "ALTERNATIVE_INVESTMENTS",
    MARGIN = "MARGIN",
    SHORT_SELLING = "SHORT_SELLING"
}
export declare enum AccountRestriction {
    NO_PENNY_STOCKS = "NO_PENNY_STOCKS",
    NO_OPTIONS = "NO_OPTIONS",
    NO_MARGIN = "NO_MARGIN",
    NO_SHORT_SELLING = "NO_SHORT_SELLING",
    INCOME_ONLY = "INCOME_ONLY",
    ESG_ONLY = "ESG_ONLY",
    NO_TOBACCO = "NO_TOBACCO",
    NO_FIREARMS = "NO_FIREARMS",
    SHARIA_COMPLIANT = "SHARIA_COMPLIANT"
}
export declare enum FundingSourceType {
    BANK_ACCOUNT = "BANK_ACCOUNT",
    WIRE_TRANSFER = "WIRE_TRANSFER",
    CHECK = "CHECK",
    ACH = "ACH",
    EXISTING_ACCOUNT_TRANSFER = "EXISTING_ACCOUNT_TRANSFER",
    ROLLOVER = "ROLLOVER",
    TRUSTEE_TO_TRUSTEE = "TRUSTEE_TO_TRUSTEE"
}
export declare enum AccountSetupStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    AWAITING_FUNDING = "AWAITING_FUNDING",
    FUNDING_IN_PROGRESS = "FUNDING_IN_PROGRESS",
    COMPLIANCE_REVIEW = "COMPLIANCE_REVIEW",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}
export declare enum StepStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    SKIPPED = "SKIPPED"
}
export declare enum RiskTolerance {
    CONSERVATIVE = "CONSERVATIVE",
    MODERATELY_CONSERVATIVE = "MODERATELY_CONSERVATIVE",
    MODERATE = "MODERATE",
    MODERATELY_AGGRESSIVE = "MODERATELY_AGGRESSIVE",
    AGGRESSIVE = "AGGRESSIVE"
}
export declare enum InvestmentObjective {
    CAPITAL_PRESERVATION = "CAPITAL_PRESERVATION",
    INCOME = "INCOME",
    BALANCED = "BALANCED",
    GROWTH = "GROWTH",
    AGGRESSIVE_GROWTH = "AGGRESSIVE_GROWTH",
    SPECULATION = "SPECULATION"
}
export declare enum TimeHorizon {
    SHORT_TERM = "SHORT_TERM",// < 3 years
    MEDIUM_TERM = "MEDIUM_TERM",// 3-10 years
    LONG_TERM = "LONG_TERM"
}
export declare enum LiquidityNeeds {
    HIGH = "HIGH",// Need access within days
    MEDIUM = "MEDIUM",// Need access within months
    LOW = "LOW"
}
export declare enum InvestmentExperience {
    NONE = "NONE",
    LIMITED = "LIMITED",
    MODERATE = "MODERATE",
    EXTENSIVE = "EXTENSIVE",
    PROFESSIONAL = "PROFESSIONAL"
}
export declare enum TrusteePower {
    INVESTMENT_DECISIONS = "INVESTMENT_DECISIONS",
    DISTRIBUTIONS = "DISTRIBUTIONS",
    TAX_DECISIONS = "TAX_DECISIONS",
    SUCCESSOR_APPOINTMENT = "SUCCESSOR_APPOINTMENT",
    ACCOUNT_MANAGEMENT = "ACCOUNT_MANAGEMENT"
}
export declare enum UserPermission {
    VIEW_ACCOUNT = "VIEW_ACCOUNT",
    PLACE_TRADES = "PLACE_TRADES",
    WITHDRAW_FUNDS = "WITHDRAW_FUNDS",
    CHANGE_INVESTMENTS = "CHANGE_INVESTMENTS",
    MANAGE_BENEFICIARIES = "MANAGE_BENEFICIARIES",
    VIEW_TAX_DOCUMENTS = "VIEW_TAX_DOCUMENTS"
}
export declare class AccountSetupService extends EventEmitter {
    private setupRequests;
    constructor();
    initiateAccountSetup(clientId: string, tenantId: string, workflowId: string, configuration: Partial<AccountConfiguration>, fundingSetup: Partial<FundingSetup>, investmentPreferences: Partial<InvestmentPreferences>): Promise<AccountSetupRequest>;
    private buildAccountConfiguration;
    private buildFundingSetup;
    private buildInvestmentPreferences;
    private createSetupSteps;
    private processNextStep;
    private executeSetupStep;
    private validateAccountConfiguration;
    private checkRegulatoryCompliance;
    private verifyTaxStatus;
    private setupTradingPermissions;
    private setupBankingIntegration;
    private verifyFunding;
    private setupInvestmentProfile;
    private provisionAccount;
    private validateIRACompliance;
    private verifyEntity;
    private reviewTrustDocuments;
    private generateAccountNumber;
    getAccountSetup(setupId: string): AccountSetupRequest | undefined;
    getSetupsByClient(clientId: string, tenantId: string): AccountSetupRequest[];
    updateSetupConfiguration(setupId: string, updates: {
        accountConfiguration?: Partial<AccountConfiguration>;
        fundingSetup?: Partial<FundingSetup>;
        investmentPreferences?: Partial<InvestmentPreferences>;
    }): Promise<AccountSetupRequest>;
    getSetupMetrics(tenantId?: string): Promise<{
        totalSetups: number;
        completedSetups: number;
        failedSetups: number;
        inProgressSetups: number;
        completionRate: number;
        averageSetupTime: number;
        commonFailureReasons: Array<{
            reason: string;
            count: number;
        }>;
    }>;
}
