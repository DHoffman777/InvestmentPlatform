"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountSetupService = exports.UserPermission = exports.TrusteePower = exports.InvestmentExperience = exports.LiquidityNeeds = exports.TimeHorizon = exports.InvestmentObjective = exports.RiskTolerance = exports.StepStatus = exports.AccountSetupStatus = exports.FundingSourceType = exports.AccountRestriction = exports.TradingPermission = exports.TaxStatus = exports.AccountPurpose = exports.AccountType = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
var AccountType;
(function (AccountType) {
    AccountType["INDIVIDUAL_TAXABLE"] = "INDIVIDUAL_TAXABLE";
    AccountType["JOINT_TAXABLE"] = "JOINT_TAXABLE";
    AccountType["TRADITIONAL_IRA"] = "TRADITIONAL_IRA";
    AccountType["ROTH_IRA"] = "ROTH_IRA";
    AccountType["SEP_IRA"] = "SEP_IRA";
    AccountType["SIMPLE_IRA"] = "SIMPLE_IRA";
    AccountType["ROLLOVER_IRA"] = "ROLLOVER_IRA";
    AccountType["CORPORATE"] = "CORPORATE";
    AccountType["LLC"] = "LLC";
    AccountType["PARTNERSHIP"] = "PARTNERSHIP";
    AccountType["TRUST"] = "TRUST";
    AccountType["ESTATE"] = "ESTATE";
    AccountType["CUSTODIAL"] = "CUSTODIAL";
    AccountType["FOUR_OH_ONE_K"] = "401K";
})(AccountType || (exports.AccountType = AccountType = {}));
var AccountPurpose;
(function (AccountPurpose) {
    AccountPurpose["RETIREMENT"] = "RETIREMENT";
    AccountPurpose["EDUCATION"] = "EDUCATION";
    AccountPurpose["GENERAL_INVESTMENT"] = "GENERAL_INVESTMENT";
    AccountPurpose["WEALTH_PRESERVATION"] = "WEALTH_PRESERVATION";
    AccountPurpose["INCOME_GENERATION"] = "INCOME_GENERATION";
    AccountPurpose["CAPITAL_APPRECIATION"] = "CAPITAL_APPRECIATION";
    AccountPurpose["SPECULATION"] = "SPECULATION";
    AccountPurpose["ESTATE_PLANNING"] = "ESTATE_PLANNING";
})(AccountPurpose || (exports.AccountPurpose = AccountPurpose = {}));
var TaxStatus;
(function (TaxStatus) {
    TaxStatus["TAXABLE"] = "TAXABLE";
    TaxStatus["TAX_DEFERRED"] = "TAX_DEFERRED";
    TaxStatus["TAX_FREE"] = "TAX_FREE";
    TaxStatus["TAX_EXEMPT"] = "TAX_EXEMPT";
})(TaxStatus || (exports.TaxStatus = TaxStatus = {}));
var TradingPermission;
(function (TradingPermission) {
    TradingPermission["EQUITIES"] = "EQUITIES";
    TradingPermission["OPTIONS"] = "OPTIONS";
    TradingPermission["FUTURES"] = "FUTURES";
    TradingPermission["FOREX"] = "FOREX";
    TradingPermission["FIXED_INCOME"] = "FIXED_INCOME";
    TradingPermission["MUTUAL_FUNDS"] = "MUTUAL_FUNDS";
    TradingPermission["ETFS"] = "ETFS";
    TradingPermission["ALTERNATIVE_INVESTMENTS"] = "ALTERNATIVE_INVESTMENTS";
    TradingPermission["MARGIN"] = "MARGIN";
    TradingPermission["SHORT_SELLING"] = "SHORT_SELLING";
})(TradingPermission || (exports.TradingPermission = TradingPermission = {}));
var AccountRestriction;
(function (AccountRestriction) {
    AccountRestriction["NO_PENNY_STOCKS"] = "NO_PENNY_STOCKS";
    AccountRestriction["NO_OPTIONS"] = "NO_OPTIONS";
    AccountRestriction["NO_MARGIN"] = "NO_MARGIN";
    AccountRestriction["NO_SHORT_SELLING"] = "NO_SHORT_SELLING";
    AccountRestriction["INCOME_ONLY"] = "INCOME_ONLY";
    AccountRestriction["ESG_ONLY"] = "ESG_ONLY";
    AccountRestriction["NO_TOBACCO"] = "NO_TOBACCO";
    AccountRestriction["NO_FIREARMS"] = "NO_FIREARMS";
    AccountRestriction["SHARIA_COMPLIANT"] = "SHARIA_COMPLIANT";
})(AccountRestriction || (exports.AccountRestriction = AccountRestriction = {}));
var FundingSourceType;
(function (FundingSourceType) {
    FundingSourceType["BANK_ACCOUNT"] = "BANK_ACCOUNT";
    FundingSourceType["WIRE_TRANSFER"] = "WIRE_TRANSFER";
    FundingSourceType["CHECK"] = "CHECK";
    FundingSourceType["ACH"] = "ACH";
    FundingSourceType["EXISTING_ACCOUNT_TRANSFER"] = "EXISTING_ACCOUNT_TRANSFER";
    FundingSourceType["ROLLOVER"] = "ROLLOVER";
    FundingSourceType["TRUSTEE_TO_TRUSTEE"] = "TRUSTEE_TO_TRUSTEE";
})(FundingSourceType || (exports.FundingSourceType = FundingSourceType = {}));
var AccountSetupStatus;
(function (AccountSetupStatus) {
    AccountSetupStatus["PENDING"] = "PENDING";
    AccountSetupStatus["IN_PROGRESS"] = "IN_PROGRESS";
    AccountSetupStatus["AWAITING_FUNDING"] = "AWAITING_FUNDING";
    AccountSetupStatus["FUNDING_IN_PROGRESS"] = "FUNDING_IN_PROGRESS";
    AccountSetupStatus["COMPLIANCE_REVIEW"] = "COMPLIANCE_REVIEW";
    AccountSetupStatus["COMPLETED"] = "COMPLETED";
    AccountSetupStatus["FAILED"] = "FAILED";
    AccountSetupStatus["CANCELLED"] = "CANCELLED";
})(AccountSetupStatus || (exports.AccountSetupStatus = AccountSetupStatus = {}));
var StepStatus;
(function (StepStatus) {
    StepStatus["PENDING"] = "PENDING";
    StepStatus["IN_PROGRESS"] = "IN_PROGRESS";
    StepStatus["COMPLETED"] = "COMPLETED";
    StepStatus["FAILED"] = "FAILED";
    StepStatus["SKIPPED"] = "SKIPPED";
})(StepStatus || (exports.StepStatus = StepStatus = {}));
var RiskTolerance;
(function (RiskTolerance) {
    RiskTolerance["CONSERVATIVE"] = "CONSERVATIVE";
    RiskTolerance["MODERATELY_CONSERVATIVE"] = "MODERATELY_CONSERVATIVE";
    RiskTolerance["MODERATE"] = "MODERATE";
    RiskTolerance["MODERATELY_AGGRESSIVE"] = "MODERATELY_AGGRESSIVE";
    RiskTolerance["AGGRESSIVE"] = "AGGRESSIVE";
})(RiskTolerance || (exports.RiskTolerance = RiskTolerance = {}));
var InvestmentObjective;
(function (InvestmentObjective) {
    InvestmentObjective["CAPITAL_PRESERVATION"] = "CAPITAL_PRESERVATION";
    InvestmentObjective["INCOME"] = "INCOME";
    InvestmentObjective["BALANCED"] = "BALANCED";
    InvestmentObjective["GROWTH"] = "GROWTH";
    InvestmentObjective["AGGRESSIVE_GROWTH"] = "AGGRESSIVE_GROWTH";
    InvestmentObjective["SPECULATION"] = "SPECULATION";
})(InvestmentObjective || (exports.InvestmentObjective = InvestmentObjective = {}));
var TimeHorizon;
(function (TimeHorizon) {
    TimeHorizon["SHORT_TERM"] = "SHORT_TERM";
    TimeHorizon["MEDIUM_TERM"] = "MEDIUM_TERM";
    TimeHorizon["LONG_TERM"] = "LONG_TERM"; // > 10 years
})(TimeHorizon || (exports.TimeHorizon = TimeHorizon = {}));
var LiquidityNeeds;
(function (LiquidityNeeds) {
    LiquidityNeeds["HIGH"] = "HIGH";
    LiquidityNeeds["MEDIUM"] = "MEDIUM";
    LiquidityNeeds["LOW"] = "LOW"; // Don't need access for years
})(LiquidityNeeds || (exports.LiquidityNeeds = LiquidityNeeds = {}));
var InvestmentExperience;
(function (InvestmentExperience) {
    InvestmentExperience["NONE"] = "NONE";
    InvestmentExperience["LIMITED"] = "LIMITED";
    InvestmentExperience["MODERATE"] = "MODERATE";
    InvestmentExperience["EXTENSIVE"] = "EXTENSIVE";
    InvestmentExperience["PROFESSIONAL"] = "PROFESSIONAL";
})(InvestmentExperience || (exports.InvestmentExperience = InvestmentExperience = {}));
var TrusteePower;
(function (TrusteePower) {
    TrusteePower["INVESTMENT_DECISIONS"] = "INVESTMENT_DECISIONS";
    TrusteePower["DISTRIBUTIONS"] = "DISTRIBUTIONS";
    TrusteePower["TAX_DECISIONS"] = "TAX_DECISIONS";
    TrusteePower["SUCCESSOR_APPOINTMENT"] = "SUCCESSOR_APPOINTMENT";
    TrusteePower["ACCOUNT_MANAGEMENT"] = "ACCOUNT_MANAGEMENT";
})(TrusteePower || (exports.TrusteePower = TrusteePower = {}));
var UserPermission;
(function (UserPermission) {
    UserPermission["VIEW_ACCOUNT"] = "VIEW_ACCOUNT";
    UserPermission["PLACE_TRADES"] = "PLACE_TRADES";
    UserPermission["WITHDRAW_FUNDS"] = "WITHDRAW_FUNDS";
    UserPermission["CHANGE_INVESTMENTS"] = "CHANGE_INVESTMENTS";
    UserPermission["MANAGE_BENEFICIARIES"] = "MANAGE_BENEFICIARIES";
    UserPermission["VIEW_TAX_DOCUMENTS"] = "VIEW_TAX_DOCUMENTS";
})(UserPermission || (exports.UserPermission = UserPermission = {}));
class AccountSetupService extends events_1.EventEmitter {
    setupRequests = new Map();
    constructor() {
        super();
    }
    async initiateAccountSetup(clientId, tenantId, workflowId, configuration, fundingSetup, investmentPreferences) {
        const setupId = (0, crypto_1.randomUUID)();
        const setupRequest = {
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
    buildAccountConfiguration(config) {
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
    buildFundingSetup(funding) {
        return {
            id: (0, crypto_1.randomUUID)(),
            initialFundingRequired: funding.initialFundingRequired !== false,
            minimumInitialDeposit: funding.minimumInitialDeposit || 10000,
            plannedInitialDeposit: funding.plannedInitialDeposit,
            fundingSources: funding.fundingSources || [],
            bankingInstructions: funding.bankingInstructions || {},
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
    buildInvestmentPreferences(prefs) {
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
    createSetupSteps(accountType) {
        const baseSteps = [
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
            id: (0, crypto_1.randomUUID)()
        }));
    }
    async processNextStep(setupId) {
        const setup = this.setupRequests.get(setupId);
        if (!setup)
            return;
        setup.status = AccountSetupStatus.IN_PROGRESS;
        const nextStep = setup.setupSteps.find(step => step.status === StepStatus.PENDING &&
            step.dependencies.every(dep => setup.setupSteps.find(s => s.name === dep)?.status === StepStatus.COMPLETED));
        if (!nextStep) {
            // All steps completed or blocked
            const allCompleted = setup.setupSteps.every(step => step.status === StepStatus.COMPLETED);
            const hasFailures = setup.setupSteps.some(step => step.status === StepStatus.FAILED);
            if (allCompleted) {
                setup.status = AccountSetupStatus.COMPLETED;
                setup.completedAt = new Date();
                this.emit('accountSetupCompleted', setup);
            }
            else if (hasFailures) {
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
    async executeSetupStep(setupId, stepId) {
        const setup = this.setupRequests.get(setupId);
        if (!setup)
            return;
        const step = setup.setupSteps.find(s => s.id === stepId);
        if (!step)
            return;
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
        }
        catch (error) {
            step.status = StepStatus.FAILED;
            step.errors.push(error.message);
            setup.errors.push({
                code: 'STEP_EXECUTION_FAILED',
                message: `Step "${step.name}" failed: ${error.message}`,
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
    async validateAccountConfiguration(setup) {
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
    async checkRegulatoryCompliance(setup) {
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
    async verifyTaxStatus(setup) {
        // Tax status verification logic
        const config = setup.accountConfiguration;
        if (config.taxStatus === TaxStatus.TAX_DEFERRED) {
            // Verify eligibility for tax-deferred status
        }
    }
    async setupTradingPermissions(setup) {
        // Trading permissions setup logic
        const permissions = setup.accountConfiguration.tradingPermissions;
        // Configure trading limits based on account type and permissions
        if (permissions.includes(TradingPermission.OPTIONS)) {
            // Setup options trading
        }
    }
    async setupBankingIntegration(setup) {
        const banking = setup.fundingSetup.bankingInstructions;
        if (banking.routingNumber && banking.accountNumber) {
            // Verify bank account
            banking.verified = Math.random() > 0.1; // 90% success rate
            banking.verificationMethod = 'instant_verification';
            banking.verificationDate = new Date();
        }
    }
    async verifyFunding(setup) {
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
    async setupInvestmentProfile(setup) {
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
    async provisionAccount(setup) {
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
    async validateIRACompliance(setup) {
        // IRA-specific compliance validation
        const config = setup.accountConfiguration;
        if (config.accountType === AccountType.ROTH_IRA) {
            // Roth IRA specific checks
        }
    }
    async verifyEntity(setup) {
        // Entity verification for corporate accounts
        const config = setup.accountConfiguration;
        if (config.authorizedUsers && config.authorizedUsers.length === 0) {
            throw new Error('Corporate accounts must have at least one authorized user');
        }
    }
    async reviewTrustDocuments(setup) {
        // Trust document review
        const config = setup.accountConfiguration;
        if (!config.trustees || config.trustees.length === 0) {
            throw new Error('Trust accounts must have at least one trustee');
        }
    }
    generateAccountNumber() {
        return `ACC${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    }
    getAccountSetup(setupId) {
        return this.setupRequests.get(setupId);
    }
    getSetupsByClient(clientId, tenantId) {
        return Array.from(this.setupRequests.values())
            .filter(setup => setup.clientId === clientId && setup.tenantId === tenantId);
    }
    async updateSetupConfiguration(setupId, updates) {
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
    async getSetupMetrics(tenantId) {
        const setups = Array.from(this.setupRequests.values())
            .filter(setup => !tenantId || setup.tenantId === tenantId);
        const totalSetups = setups.length;
        const completedSetups = setups.filter(s => s.status === AccountSetupStatus.COMPLETED).length;
        const failedSetups = setups.filter(s => s.status === AccountSetupStatus.FAILED).length;
        const inProgressSetups = setups.filter(s => s.status === AccountSetupStatus.IN_PROGRESS).length;
        const completionRate = totalSetups > 0 ? (completedSetups / totalSetups) * 100 : 0;
        const completedSetupsWithTime = setups
            .filter(s => s.status === AccountSetupStatus.COMPLETED && s.completedAt)
            .map(s => s.completedAt.getTime() - s.createdAt.getTime());
        const averageSetupTime = completedSetupsWithTime.length > 0
            ? completedSetupsWithTime.reduce((a, b) => a + b, 0) / completedSetupsWithTime.length
            : 0;
        const failureReasons = setups
            .filter(s => s.status === AccountSetupStatus.FAILED)
            .flatMap(s => s.errors.map(e => e.message));
        const reasonCounts = failureReasons.reduce((acc, reason) => {
            acc[reason] = (acc[reason] || 0) + 1;
            return acc;
        }, {});
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
exports.AccountSetupService = AccountSetupService;
