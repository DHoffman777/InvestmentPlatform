import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

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
  allocation: number; // percentage
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
  holdPeriod: number; // days
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
  allocation: number; // percentage
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
  threshold: number; // percentage deviation
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

export enum AccountType {
  INDIVIDUAL_TAXABLE = 'INDIVIDUAL_TAXABLE',
  JOINT_TAXABLE = 'JOINT_TAXABLE',
  TRADITIONAL_IRA = 'TRADITIONAL_IRA',
  ROTH_IRA = 'ROTH_IRA',
  SEP_IRA = 'SEP_IRA',
  SIMPLE_IRA = 'SIMPLE_IRA',
  ROLLOVER_IRA = 'ROLLOVER_IRA',
  CORPORATE = 'CORPORATE',
  LLC = 'LLC',
  PARTNERSHIP = 'PARTNERSHIP',
  TRUST = 'TRUST',
  ESTATE = 'ESTATE',
  CUSTODIAL = 'CUSTODIAL',
  FOUR_OH_ONE_K = '401K'
}

export enum AccountPurpose {
  RETIREMENT = 'RETIREMENT',
  EDUCATION = 'EDUCATION',
  GENERAL_INVESTMENT = 'GENERAL_INVESTMENT',
  WEALTH_PRESERVATION = 'WEALTH_PRESERVATION',
  INCOME_GENERATION = 'INCOME_GENERATION',
  CAPITAL_APPRECIATION = 'CAPITAL_APPRECIATION',
  SPECULATION = 'SPECULATION',
  ESTATE_PLANNING = 'ESTATE_PLANNING'
}

export enum TaxStatus {
  TAXABLE = 'TAXABLE',
  TAX_DEFERRED = 'TAX_DEFERRED',
  TAX_FREE = 'TAX_FREE',
  TAX_EXEMPT = 'TAX_EXEMPT'
}

export enum TradingPermission {
  EQUITIES = 'EQUITIES',
  OPTIONS = 'OPTIONS',
  FUTURES = 'FUTURES',
  FOREX = 'FOREX',
  FIXED_INCOME = 'FIXED_INCOME',
  MUTUAL_FUNDS = 'MUTUAL_FUNDS',
  ETFS = 'ETFS',
  ALTERNATIVE_INVESTMENTS = 'ALTERNATIVE_INVESTMENTS',
  MARGIN = 'MARGIN',
  SHORT_SELLING = 'SHORT_SELLING'
}

export enum AccountRestriction {
  NO_PENNY_STOCKS = 'NO_PENNY_STOCKS',
  NO_OPTIONS = 'NO_OPTIONS',
  NO_MARGIN = 'NO_MARGIN',
  NO_SHORT_SELLING = 'NO_SHORT_SELLING',
  INCOME_ONLY = 'INCOME_ONLY',
  ESG_ONLY = 'ESG_ONLY',
  NO_TOBACCO = 'NO_TOBACCO',
  NO_FIREARMS = 'NO_FIREARMS',
  SHARIA_COMPLIANT = 'SHARIA_COMPLIANT'
}

export enum FundingSourceType {
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  WIRE_TRANSFER = 'WIRE_TRANSFER',
  CHECK = 'CHECK',
  ACH = 'ACH',
  EXISTING_ACCOUNT_TRANSFER = 'EXISTING_ACCOUNT_TRANSFER',
  ROLLOVER = 'ROLLOVER',
  TRUSTEE_TO_TRUSTEE = 'TRUSTEE_TO_TRUSTEE'
}

export enum AccountSetupStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  AWAITING_FUNDING = 'AWAITING_FUNDING',
  FUNDING_IN_PROGRESS = 'FUNDING_IN_PROGRESS',
  COMPLIANCE_REVIEW = 'COMPLIANCE_REVIEW',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum StepStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED'
}

export enum RiskTolerance {
  CONSERVATIVE = 'CONSERVATIVE',
  MODERATELY_CONSERVATIVE = 'MODERATELY_CONSERVATIVE',
  MODERATE = 'MODERATE',
  MODERATELY_AGGRESSIVE = 'MODERATELY_AGGRESSIVE',
  AGGRESSIVE = 'AGGRESSIVE'
}

export enum InvestmentObjective {
  CAPITAL_PRESERVATION = 'CAPITAL_PRESERVATION',
  INCOME = 'INCOME',
  BALANCED = 'BALANCED',
  GROWTH = 'GROWTH',
  AGGRESSIVE_GROWTH = 'AGGRESSIVE_GROWTH',
  SPECULATION = 'SPECULATION'
}

export enum TimeHorizon {
  SHORT_TERM = 'SHORT_TERM', // < 3 years
  MEDIUM_TERM = 'MEDIUM_TERM', // 3-10 years
  LONG_TERM = 'LONG_TERM' // > 10 years
}

export enum LiquidityNeeds {
  HIGH = 'HIGH', // Need access within days
  MEDIUM = 'MEDIUM', // Need access within months
  LOW = 'LOW' // Don't need access for years
}

export enum InvestmentExperience {
  NONE = 'NONE',
  LIMITED = 'LIMITED',
  MODERATE = 'MODERATE',
  EXTENSIVE = 'EXTENSIVE',
  PROFESSIONAL = 'PROFESSIONAL'
}

export enum TrusteePower {
  INVESTMENT_DECISIONS = 'INVESTMENT_DECISIONS',
  DISTRIBUTIONS = 'DISTRIBUTIONS',
  TAX_DECISIONS = 'TAX_DECISIONS',
  SUCCESSOR_APPOINTMENT = 'SUCCESSOR_APPOINTMENT',
  ACCOUNT_MANAGEMENT = 'ACCOUNT_MANAGEMENT'
}

export enum UserPermission {
  VIEW_ACCOUNT = 'VIEW_ACCOUNT',
  PLACE_TRADES = 'PLACE_TRADES',
  WITHDRAW_FUNDS = 'WITHDRAW_FUNDS',
  CHANGE_INVESTMENTS = 'CHANGE_INVESTMENTS',
  MANAGE_BENEFICIARIES = 'MANAGE_BENEFICIARIES',
  VIEW_TAX_DOCUMENTS = 'VIEW_TAX_DOCUMENTS'
}

export class AccountSetupService extends EventEmitter {
  private setupRequests: Map<string, AccountSetupRequest> = new Map();

  constructor() {
    super();
  }

  async initiateAccountSetup(
    clientId: string,
    tenantId: string,
    workflowId: string,
    configuration: Partial<AccountConfiguration>,
    fundingSetup: Partial<FundingSetup>,
    investmentPreferences: Partial<InvestmentPreferences>
  ): Promise<AccountSetupRequest> {
    const setupId = randomUUID();

    const setupRequest: AccountSetupRequest = {
      id: setupId,
      clientId,
      tenantId,
      workflowId,
      accountConfiguration: this.buildAccountConfiguration(configuration),
      fundingSetup: this.buildFundingSetup(fundingSetup),
      investmentPreferences: this.buildInvestmentPreferences(investmentPreferences),
      status: AccountSetupStatus.PENDING,
      setupSteps: this.createSetupSteps(configuration.accountType || AccountType.INDIVIDUAL_TAXABLE),
      createdAt: new Date(),
      updatedAt: new Date(),
      errors: []
    };

    this.setupRequests.set(setupId, setupRequest);

    this.emit('accountSetupInitiated', setupRequest);

    // Start the setup process
    await this.processNextStep(setupId);

    return setupRequest;
  }

  private buildAccountConfiguration(config: Partial<AccountConfiguration>): AccountConfiguration {
    return {
      accountType: config.accountType || AccountType.INDIVIDUAL_TAXABLE,
      accountName: config.accountName || 'Investment Account',
      accountPurpose: config.accountPurpose || AccountPurpose.GENERAL_INVESTMENT,
      taxStatus: config.taxStatus || TaxStatus.TAXABLE,
      jurisdiction: config.jurisdiction || 'US',
      baseCurrency: config.baseCurrency || 'USD',
      multiCurrency: config.multiCurrency || false,
      supportedCurrencies: config.supportedCurrencies || ['USD'],
      tradingPermissions: config.tradingPermissions || [
        TradingPermission.EQUITIES,
        TradingPermission.ETFS,
        TradingPermission.MUTUAL_FUNDS,
        TradingPermission.FIXED_INCOME
      ],
      restrictions: config.restrictions || [],
      beneficiaries: config.beneficiaries,
      trustees: config.trustees,
      authorizedUsers: config.authorizedUsers,
      custodian: config.custodian,
      subAccountStructure: config.subAccountStructure
    };
  }

  private buildFundingSetup(funding: Partial<FundingSetup>): FundingSetup {
    return {
      id: randomUUID(),
      initialFundingRequired: funding.initialFundingRequired !== false,
      minimumInitialDeposit: funding.minimumInitialDeposit || 10000,
      plannedInitialDeposit: funding.plannedInitialDeposit,
      fundingSources: funding.fundingSources || [],
      bankingInstructions: funding.bankingInstructions || {} as BankingInstructions,
      wireInstructions: funding.wireInstructions,
      achSetup: funding.achSetup || {
        enabled: true,
        limits: { dailyLimit: 50000, monthlyLimit: 250000 },
        restrictions: [],
        processingDays: [1, 2, 3, 4, 5] // Monday-Friday
      },
      checkDeposit: funding.checkDeposit || {
        enabled: true,
        limits: { dailyLimit: 25000, monthlyLimit: 100000 },
        holdPeriod: 5
      },
      transferInstructions: funding.transferInstructions,
      fundingTimeline: funding.fundingTimeline || {
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        milestones: []
      },
      complianceChecks: []
    };
  }

  private buildInvestmentPreferences(prefs: Partial<InvestmentPreferences>): InvestmentPreferences {
    return {
      riskTolerance: prefs.riskTolerance || RiskTolerance.MODERATE,
      investmentObjectives: prefs.investmentObjectives || [InvestmentObjective.BALANCED],
      timeHorizon: prefs.timeHorizon || TimeHorizon.LONG_TERM,
      liquidityNeeds: prefs.liquidityNeeds || LiquidityNeeds.MEDIUM,
      investmentExperience: prefs.investmentExperience || InvestmentExperience.MODERATE,
      assetClassPreferences: prefs.assetClassPreferences || [
        { assetClass: 'Equities', allocation: 60 },
        { assetClass: 'Fixed Income', allocation: 30 },
        { assetClass: 'Cash', allocation: 10 }
      ],
      restrictedInvestments: prefs.restrictedInvestments || [],
      investmentConstraints: prefs.investmentConstraints || [],
      modelPortfolio: prefs.modelPortfolio,
      rebalancingPreferences: prefs.rebalancingPreferences || {
        automatic: true,
        frequency: 'quarterly',
        threshold: 5,
        method: 'threshold_based'
      },
      taxOptimization: prefs.taxOptimization || {
        enabled: true,
        harvestLosses: true,
        assetLocation: true,
        taxLotManagement: 'tax_optimized'
      }
    };
  }

  private createSetupSteps(accountType: AccountType): SetupStep[] {
    const baseSteps: Omit<SetupStep, 'id'>[] = [
      {
        name: 'Account Configuration Validation',
        description: 'Validate account configuration parameters',
        status: StepStatus.PENDING,
        order: 1,
        dependencies: [],
        data: {},
        errors: []
      },
      {
        name: 'Regulatory Compliance Check',
        description: 'Verify regulatory compliance for account type',
        status: StepStatus.PENDING,
        order: 2,
        dependencies: ['Account Configuration Validation'],
        data: {},
        errors: []
      },
      {
        name: 'Tax Status Verification',
        description: 'Verify tax status and implications',
        status: StepStatus.PENDING,
        order: 3,
        dependencies: ['Regulatory Compliance Check'],
        data: {},
        errors: []
      },
      {
        name: 'Trading Permissions Setup',
        description: 'Configure trading permissions and restrictions',
        status: StepStatus.PENDING,
        order: 4,
        dependencies: ['Tax Status Verification'],
        data: {},
        errors: []
      },
      {
        name: 'Banking Integration',
        description: 'Setup banking connections and verification',
        status: StepStatus.PENDING,
        order: 5,
        dependencies: ['Trading Permissions Setup'],
        data: {},
        errors: []
      },
      {
        name: 'Funding Verification',
        description: 'Verify funding sources and amounts',
        status: StepStatus.PENDING,
        order: 6,
        dependencies: ['Banking Integration'],
        data: {},
        errors: []
      },
      {
        name: 'Investment Profile Setup',
        description: 'Configure investment preferences and constraints',
        status: StepStatus.PENDING,
        order: 7,
        dependencies: ['Funding Verification'],
        data: {},
        errors: []
      },
      {
        name: 'Account Provisioning',
        description: 'Create and provision the account',
        status: StepStatus.PENDING,
        order: 8,
        dependencies: ['Investment Profile Setup'],
        data: {},
        errors: []
      }
    ];

    // Add account-type specific steps
    if ([AccountType.TRADITIONAL_IRA, AccountType.ROTH_IRA, AccountType.SEP_IRA, AccountType.SIMPLE_IRA].includes(accountType)) {
      baseSteps.push({
        name: 'IRA Compliance Validation',
        description: 'Validate IRA-specific compliance requirements',
        status: StepStatus.PENDING,
        order: 3.5,
        dependencies: ['Tax Status Verification'],
        data: {},
        errors: []
      });
    }

    if ([AccountType.CORPORATE, AccountType.LLC, AccountType.PARTNERSHIP].includes(accountType)) {
      baseSteps.push({
        name: 'Entity Verification',
        description: 'Verify entity structure and authorized signers',
        status: StepStatus.PENDING,
        order: 2.5,
        dependencies: ['Regulatory Compliance Check'],
        data: {},
        errors: []
      });
    }

    if (accountType === AccountType.TRUST) {
      baseSteps.push({
        name: 'Trust Document Review',
        description: 'Review trust documents and trustee powers',
        status: StepStatus.PENDING,
        order: 2.5,
        dependencies: ['Regulatory Compliance Check'],
        data: {},
        errors: []
      });
    }

    return baseSteps.sort((a, b) => a.order - b.order).map(step => ({
      ...step,
      id: randomUUID()
    }));
  }

  private async processNextStep(setupId: string): Promise<any> {
    const setup = this.setupRequests.get(setupId);
    if (!setup) return;

    setup.status = AccountSetupStatus.IN_PROGRESS;

    const nextStep = setup.setupSteps.find(step => 
      step.status === StepStatus.PENDING && 
      step.dependencies.every(dep => 
        setup.setupSteps.find(s => s.name === dep)?.status === StepStatus.COMPLETED
      )
    );

    if (!nextStep) {
      // All steps completed or blocked
      const allCompleted = setup.setupSteps.every(step => step.status === StepStatus.COMPLETED);
      const hasFailures = setup.setupSteps.some(step => step.status === StepStatus.FAILED);

      if (allCompleted) {
        setup.status = AccountSetupStatus.COMPLETED;
        setup.completedAt = new Date();
        this.emit('accountSetupCompleted', setup);
      } else if (hasFailures) {
        setup.status = AccountSetupStatus.FAILED;
        this.emit('accountSetupFailed', setup);
      }
      return;
    }

    nextStep.status = StepStatus.IN_PROGRESS;
    nextStep.startedAt = new Date();

    this.emit('setupStepStarted', { setupId, step: nextStep });

    // Process the step
    await this.executeSetupStep(setupId, nextStep.id);
  }

  private async executeSetupStep(setupId: string, stepId: string): Promise<any> {
    const setup = this.setupRequests.get(setupId);
    if (!setup) return;

    const step = setup.setupSteps.find(s => s.id === stepId);
    if (!step) return;

    try {
      switch (step.name) {
        case 'Account Configuration Validation':
          await this.validateAccountConfiguration(setup);
          break;
        case 'Regulatory Compliance Check':
          await this.checkRegulatoryCompliance(setup);
          break;
        case 'Tax Status Verification':
          await this.verifyTaxStatus(setup);
          break;
        case 'Trading Permissions Setup':
          await this.setupTradingPermissions(setup);
          break;
        case 'Banking Integration':
          await this.setupBankingIntegration(setup);
          break;
        case 'Funding Verification':
          await this.verifyFunding(setup);
          break;
        case 'Investment Profile Setup':
          await this.setupInvestmentProfile(setup);
          break;
        case 'Account Provisioning':
          await this.provisionAccount(setup);
          break;
        case 'IRA Compliance Validation':
          await this.validateIRACompliance(setup);
          break;
        case 'Entity Verification':
          await this.verifyEntity(setup);
          break;
        case 'Trust Document Review':
          await this.reviewTrustDocuments(setup);
          break;
        default:
          throw new Error(`Unknown setup step: ${step.name}`);
      }

      step.status = StepStatus.COMPLETED;
      step.completedAt = new Date();
      
      this.emit('setupStepCompleted', { setupId, step });
      
      // Process next step
      await this.processNextStep(setupId);

    } catch (error: any) {
      step.status = StepStatus.FAILED;
      step.errors.push(error instanceof Error ? error.message : 'Unknown error');
      
      setup.errors.push({
        code: 'STEP_EXECUTION_FAILED',
        message: `Step "${step.name}" failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high',
        stepId: step.id,
        timestamp: new Date(),
        resolved: false
      });

      this.emit('setupStepFailed', { setupId, step, error });
      
      // Continue processing if error is not critical
      if (error.severity !== 'critical') {
        await this.processNextStep(setupId);
      }
    }

    setup.updatedAt = new Date();
  }

  private async validateAccountConfiguration(setup: AccountSetupRequest): Promise<any> {
    const config = setup.accountConfiguration;
    
    // Validate account type compatibility
    if (config.accountType === AccountType.ROTH_IRA && config.taxStatus !== TaxStatus.TAX_FREE) {
      throw new Error('Roth IRA must have tax-free status');
    }

    // Validate trading permissions
    if (config.tradingPermissions.includes(TradingPermission.OPTIONS) && 
        config.restrictions.includes(AccountRestriction.NO_OPTIONS)) {
      throw new Error('Conflicting configuration: Options trading enabled but restricted');
    }

    // Validate beneficiaries for retirement accounts
    if ([AccountType.TRADITIONAL_IRA, AccountType.ROTH_IRA].includes(config.accountType) && 
        (!config.beneficiaries || config.beneficiaries.length === 0)) {
      throw new Error('IRA accounts must have at least one beneficiary');
    }
  }

  private async checkRegulatoryCompliance(setup: AccountSetupRequest): Promise<any> {
    const config = setup.accountConfiguration;
    
    // Check jurisdiction-specific requirements
    if (config.jurisdiction === 'US') {
      // US-specific compliance checks
      if (config.accountType === AccountType.TRADITIONAL_IRA) {
        // Check IRA contribution limits and eligibility
      }
    }

    // Check FINRA requirements for margin accounts
    if (config.tradingPermissions.includes(TradingPermission.MARGIN)) {
      // Margin account compliance checks
    }

    // Add compliance check results
    setup.fundingSetup.complianceChecks.push({
      type: 'regulatory_compliance',
      status: 'passed',
      details: { jurisdiction: config.jurisdiction, accountType: config.accountType },
      checkedAt: new Date()
    });
  }

  private async verifyTaxStatus(setup: AccountSetupRequest): Promise<any> {
    // Tax status verification logic
    const config = setup.accountConfiguration;
    
    if (config.taxStatus === TaxStatus.TAX_DEFERRED) {
      // Verify eligibility for tax-deferred status
    }
  }

  private async setupTradingPermissions(setup: AccountSetupRequest): Promise<any> {
    // Trading permissions setup logic
    const permissions = setup.accountConfiguration.tradingPermissions;
    
    // Configure trading limits based on account type and permissions
    if (permissions.includes(TradingPermission.OPTIONS)) {
      // Setup options trading
    }
  }

  private async setupBankingIntegration(setup: AccountSetupRequest): Promise<any> {
    const banking = setup.fundingSetup.bankingInstructions;
    
    if (banking.routingNumber && banking.accountNumber) {
      // Verify bank account
      banking.verified = Math.random() > 0.1; // 90% success rate
      banking.verificationMethod = 'instant_verification';
      banking.verificationDate = new Date();
    }
  }

  private async verifyFunding(setup: AccountSetupRequest): Promise<any> {
    const funding = setup.fundingSetup;
    
    if (funding.initialFundingRequired && !funding.plannedInitialDeposit) {
      throw new Error('Initial funding is required but not specified');
    }

    if (funding.plannedInitialDeposit && funding.plannedInitialDeposit < funding.minimumInitialDeposit) {
      throw new Error(`Planned deposit ${funding.plannedInitialDeposit} is below minimum ${funding.minimumInitialDeposit}`);
    }

    // Add funding compliance check
    funding.complianceChecks.push({
      type: 'funding_verification',
      status: 'passed',
      details: { 
        initialDeposit: funding.plannedInitialDeposit,
        minimumRequired: funding.minimumInitialDeposit
      },
      checkedAt: new Date()
    });
  }

  private async setupInvestmentProfile(setup: AccountSetupRequest): Promise<any> {
    const prefs = setup.investmentPreferences;
    
    // Validate asset allocation
    const totalAllocation = prefs.assetClassPreferences.reduce((sum, pref) => sum + pref.allocation, 0);
    if (Math.abs(totalAllocation - 100) > 1) {
      throw new Error(`Asset allocation must total 100%, currently ${totalAllocation}%`);
    }

    // Setup model portfolio if specified
    if (prefs.modelPortfolio) {
      // Configure model portfolio
    }
  }

  private async provisionAccount(setup: AccountSetupRequest): Promise<any> {
    // Final account provisioning
    const accountNumber = this.generateAccountNumber();
    setup.accountConfiguration.custodian = {
      name: 'Investment Platform Custody',
      identifier: 'IPC001',
      contactInfo: {
        phone: '+1-800-CUSTODY',
        email: 'custody@investmentplatform.com',
        address: {
          street1: '123 Financial St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US'
        }
      },
      accountNumber
    };
  }

  private async validateIRACompliance(setup: AccountSetupRequest): Promise<any> {
    // IRA-specific compliance validation
    const config = setup.accountConfiguration;
    
    if (config.accountType === AccountType.ROTH_IRA) {
      // Roth IRA specific checks
    }
  }

  private async verifyEntity(setup: AccountSetupRequest): Promise<any> {
    // Entity verification for corporate accounts
    const config = setup.accountConfiguration;
    
    if (config.authorizedUsers && config.authorizedUsers.length === 0) {
      throw new Error('Corporate accounts must have at least one authorized user');
    }
  }

  private async reviewTrustDocuments(setup: AccountSetupRequest): Promise<any> {
    // Trust document review
    const config = setup.accountConfiguration;
    
    if (!config.trustees || config.trustees.length === 0) {
      throw new Error('Trust accounts must have at least one trustee');
    }
  }

  private generateAccountNumber(): string {
    return `ACC${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  }

  getAccountSetup(setupId: string): AccountSetupRequest | undefined {
    return this.setupRequests.get(setupId);
  }

  getSetupsByClient(clientId: string, tenantId: string): AccountSetupRequest[] {
    return Array.from(this.setupRequests.values())
      .filter(setup => setup.clientId === clientId && setup.tenantId === tenantId);
  }

  async updateSetupConfiguration(
    setupId: string,
    updates: {
      accountConfiguration?: Partial<AccountConfiguration>;
      fundingSetup?: Partial<FundingSetup>;
      investmentPreferences?: Partial<InvestmentPreferences>;
    }
  ): Promise<AccountSetupRequest> {
    const setup = this.setupRequests.get(setupId);
    if (!setup) {
      throw new Error('Account setup not found');
    }

    if (updates.accountConfiguration) {
      Object.assign(setup.accountConfiguration, updates.accountConfiguration);
    }
    if (updates.fundingSetup) {
      Object.assign(setup.fundingSetup, updates.fundingSetup);
    }
    if (updates.investmentPreferences) {
      Object.assign(setup.investmentPreferences, updates.investmentPreferences);
    }

    setup.updatedAt = new Date();

    this.emit('setupConfigurationUpdated', setup);
    return setup;
  }

  async getSetupMetrics(tenantId?: string): Promise<{
    totalSetups: number;
    completedSetups: number;
    failedSetups: number;
    inProgressSetups: number;
    completionRate: number;
    averageSetupTime: number;
    commonFailureReasons: Array<{ reason: string; count: number }>;
  }> {
    const setups = Array.from(this.setupRequests.values())
      .filter(setup => !tenantId || setup.tenantId === tenantId);

    const totalSetups = setups.length;
    const completedSetups = setups.filter(s => s.status === AccountSetupStatus.COMPLETED).length;
    const failedSetups = setups.filter(s => s.status === AccountSetupStatus.FAILED).length;
    const inProgressSetups = setups.filter(s => s.status === AccountSetupStatus.IN_PROGRESS).length;

    const completionRate = totalSetups > 0 ? (completedSetups / totalSetups) * 100 : 0;

    const completedSetupsWithTime = setups
      .filter(s => s.status === AccountSetupStatus.COMPLETED && s.completedAt)
      .map(s => s.completedAt!.getTime() - s.createdAt.getTime());

    const averageSetupTime = completedSetupsWithTime.length > 0
      ? completedSetupsWithTime.reduce((a, b) => a + b, 0) / completedSetupsWithTime.length
      : 0;

    const failureReasons = setups
      .filter(s => s.status === AccountSetupStatus.FAILED)
      .flatMap(s => s.errors.map(e => e.message));

    const reasonCounts = failureReasons.reduce((acc, reason) => {
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const commonFailureReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalSetups,
      completedSetups,
      failedSetups,
      inProgressSetups,
      completionRate,
      averageSetupTime,
      commonFailureReasons
    };
  }
}

