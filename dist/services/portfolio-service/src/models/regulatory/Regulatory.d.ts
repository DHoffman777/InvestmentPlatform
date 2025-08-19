export declare enum FormType {
    FORM_ADV = "FORM_ADV",
    FORM_PF = "FORM_PF",
    FORM_13F = "FORM_13F",
    FORM_N_PORT = "FORM_N_PORT",
    FORM_N_CEN = "FORM_N_CEN",
    FORM_N_Q = "FORM_N_Q"
}
export declare enum FilingStatus {
    DRAFT = "DRAFT",
    REVIEW = "REVIEW",
    APPROVED = "APPROVED",
    FILED = "FILED",
    REJECTED = "REJECTED",
    AMENDED = "AMENDED"
}
export declare enum RegulatoryJurisdiction {
    SEC = "SEC",
    FINRA = "FINRA",
    CFTC = "CFTC",
    STATE = "STATE",
    INTERNATIONAL = "INTERNATIONAL"
}
export interface FormADV {
    id: string;
    tenantId: string;
    firmName: string;
    crdNumber: string;
    filingType: 'initial' | 'annual' | 'amendment' | 'other_than_annual';
    filingDate: Date;
    reportingPeriodEnd: Date;
    part1A: {
        businessAddress: {
            street: string;
            city: string;
            state: string;
            zipCode: string;
            country: string;
        };
        principalBusinessAddress: {
            street: string;
            city: string;
            state: string;
            zipCode: string;
            country: string;
        };
        executiveOfficers: Array<{
            name: string;
            title: string;
            yearOfBirth: number;
        }>;
        registrationStatus: {
            secRegistered: boolean;
            stateRegistered: boolean;
            exemptReportingAdviser: boolean;
        };
        businessActivities: {
            investmentAdviser: boolean;
            investmentCompany: boolean;
            brokerDealer: boolean;
            other: string[];
        };
    };
    part1B: {
        ownersAndExecutives: Array<{
            name: string;
            title: string;
            ownershipPercentage: number;
            isExecutiveOfficer: boolean;
            isDirector: boolean;
            isOwner: boolean;
        }>;
        directOwners: Array<{
            name: string;
            entityType: 'individual' | 'corporation' | 'partnership' | 'llc' | 'other';
            ownershipPercentage: number;
        }>;
        indirectOwners: Array<{
            name: string;
            entityType: 'individual' | 'corporation' | 'partnership' | 'llc' | 'other';
            ownershipPercentage: number;
        }>;
    };
    part2A: {
        advisoryBusiness: {
            businessDescription: string;
            principalOwners: string[];
            yearsInBusiness: number;
            typesOfClientsAdvised: string[];
            assetsUnderManagement: number;
            discretionaryAUM: number;
            nonDiscretionaryAUM: number;
        };
        feesAndCompensation: {
            feeStructure: string;
            feeSchedule: Array<{
                serviceType: string;
                feeType: 'percentage' | 'fixed' | 'hourly' | 'performance';
                feeAmount: number;
                description: string;
            }>;
            otherCompensation: string[];
        };
        performanceFees: {
            chargesPerformanceFees: boolean;
            performanceFeeStructure?: string;
            clientTypes?: string[];
        };
        typesOfClients: {
            individuals: boolean;
            highNetWorthIndividuals: boolean;
            bankingInstitutions: boolean;
            investmentCompanies: boolean;
            businessDevelopmentCompanies: boolean;
            pensionPlans: boolean;
            charitableOrganizations: boolean;
            corporations: boolean;
            other: string[];
        };
        methodsOfAnalysis: {
            charting: boolean;
            fundamental: boolean;
            technical: boolean;
            cyclical: boolean;
            quantitative: boolean;
            other: string[];
        };
        investmentStrategies: {
            longTerm: boolean;
            shortTerm: boolean;
            tradingStrategy: boolean;
            other: string[];
        };
        riskFactors: string[];
        disciplinaryInformation: {
            hasEvents: boolean;
            events?: Array<{
                eventType: string;
                date: Date;
                description: string;
                resolution: string;
            }>;
        };
    };
    status: FilingStatus;
    submittedBy: string;
    submittedAt?: Date;
    filedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface FormPF {
    id: string;
    tenantId: string;
    fundName: string;
    fundId: string;
    filingType: 'annual' | 'quarterly';
    reportingPeriodEnd: Date;
    filingDate: Date;
    section1: {
        fundIdentifier: string;
        fundLegalName: string;
        fundPoolIdentifier?: string;
        masterFundIdentifier?: string;
        isFeederFund: boolean;
        isMasterFund: boolean;
        primaryBusinessAddress: {
            street: string;
            city: string;
            state: string;
            zipCode: string;
            country: string;
        };
        mainBusinessAddress: {
            street: string;
            city: string;
            state: string;
            zipCode: string;
            country: string;
        };
        fundType: 'hedge_fund' | 'liquidity_fund' | 'private_equity' | 'real_estate' | 'securitized_asset' | 'venture_capital' | 'other';
    };
    section2: {
        advisorCRDNumber: string;
        advisorSECNumber: string;
        reportingFundAUM: number;
        advisorTotalAUM: number;
        fundLaunchDate: Date;
        fundFiscalYearEnd: Date;
        fundDomicile: string;
        fundBaseCurrency: string;
    };
    section3: {
        investmentStrategy: {
            convertibleArbitrage: boolean;
            dedicatedShortBias: boolean;
            emergingMarkets: boolean;
            equityMarketNeutral: boolean;
            eventDriven: boolean;
            fixedIncomeArbitrage: boolean;
            globalMacro: boolean;
            longShortEquity: boolean;
            managedFutures: boolean;
            multiStrategy: boolean;
            fundOfFunds: boolean;
            other: string;
        };
        geographicFocus: {
            northAmerica: number;
            europe: number;
            asia: number;
            other: number;
        };
        borrowingAndLeverage: {
            grossAssetValue: number;
            netAssetValue: number;
            borrowings: number;
            derivativesNotional: number;
        };
        liquidityTerms: {
            redemptionFrequency: string;
            redemptionNotice: number;
            lockupPeriod: number;
            sideLetterTerms: boolean;
        };
    };
    section4?: {
        netAssetValue: number;
        grossAssetValue: number;
        percentAllocatedToMostConcentratedStrategy: number;
        monthlyNetReturn: Array<{
            month: string;
            netReturn: number;
        }>;
        counterpartyCredit: Array<{
            counterpartyName: string;
            netExposure: number;
            grossExposure: number;
        }>;
        portfolioLiquidity: {
            lessThanOneDay: number;
            oneToSevenDays: number;
            eightToThirtyDays: number;
            thirtyOneToNinetyDays: number;
            ninetyOneToOneEightyDays: number;
            oneEightyOneToDaysToOneYear: number;
            greaterThanOneYear: number;
        };
    };
    status: FilingStatus;
    submittedBy: string;
    submittedAt?: Date;
    filedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface Form13F {
    id: string;
    tenantId: string;
    managerName: string;
    managerCIK: string;
    reportingPeriodEnd: Date;
    filingDate: Date;
    amendmentNumber?: number;
    isAmendment: boolean;
    coverPage: {
        managerName: string;
        formTypeCode: '13F-HR' | '13F-NT';
        tableEntryTotal: number;
        tableValueTotal: number;
        isConfidentialOmitted: boolean;
        providesAdditionalInfo: boolean;
    };
    summary: {
        otherIncludedManagers: Array<{
            managerName: string;
            managerCIK: string;
            formTypeCode: string;
        }>;
        totalValuePortfolio: number;
        totalNumberOfHoldings: number;
    };
    holdings: Array<{
        nameOfIssuer: string;
        titleOfClass: string;
        cusip: string;
        value: number;
        sharesOrPrincipalAmount: {
            sharesNumber?: number;
            principalAmount?: number;
            sharesOrPrincipal: 'SH' | 'PRN';
        };
        investmentDiscretion: 'SOLE' | 'SHARED' | 'NONE';
        otherManager?: string;
        votingAuthority: {
            sole: number;
            shared: number;
            none: number;
        };
    }>;
    confidentialInformation?: Array<{
        nameOfIssuer: string;
        titleOfClass: string;
        reasonForConfidentiality: string;
    }>;
    status: FilingStatus;
    submittedBy: string;
    submittedAt?: Date;
    filedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface GIPSComposite {
    id: string;
    tenantId: string;
    compositeName: string;
    compositeDescription: string;
    compositeCreationDate: Date;
    benchmarkName: string;
    benchmarkDescription: string;
    definition: {
        investmentObjective: string;
        investmentStrategy: string;
        investmentUniverse: string;
        inclusionCriteria: string[];
        exclusionCriteria: string[];
        significantCashFlowPolicy: {
            threshold: number;
            method: 'temporary_removal' | 'revaluation';
        };
    };
    performanceData: Array<{
        year: number;
        compositeGrossReturn: number;
        compositeNetReturn: number;
        benchmarkReturn: number;
        compositesStandardDeviation?: number;
        benchmarkStandardDeviation?: number;
        numberOfPortfolios: number;
        compositeAssets: number;
        totalFirmAssets: number;
        percentage3YearStandardDeviation?: number;
        compositeDispersion?: number;
    }>;
    additionalInfo: {
        feeSchedule: {
            description: string;
            feeStructure: Array<{
                assetRange: string;
                annualFee: number;
            }>;
        };
        minimumPortfolioSize?: number;
        tradingExpensePolicy: string;
        valuationPolicy: string;
        significantEvents?: Array<{
            date: Date;
            description: string;
            impact: string;
        }>;
    };
    compliance: {
        gipsCompliant: boolean;
        complianceBeginDate: Date;
        claimOfCompliance: string;
        verificationPeriod?: {
            startDate: Date;
            endDate: Date;
            verifier: string;
        };
    };
    status: 'active' | 'terminated' | 'merged';
    createdAt: Date;
    updatedAt: Date;
}
export interface BestExecutionReport {
    id: string;
    tenantId: string;
    reportingPeriod: {
        startDate: Date;
        endDate: Date;
    };
    reportType: 'quarterly' | 'annual' | 'ad_hoc';
    executionVenues: Array<{
        venueId: string;
        venueName: string;
        venueType: 'exchange' | 'dark_pool' | 'market_maker' | 'ecn' | 'ats' | 'other';
        executionQuality: {
            priceImprovement: number;
            marketableOrderFillRate: number;
            nonMarketableOrderFillRate: number;
            averageEffectiveSpread: number;
            averageRealizedSpread: number;
            priceImprovementRate: number;
        };
        orderFlow: {
            totalOrders: number;
            totalShares: number;
            totalNotionalValue: number;
            marketOrders: number;
            limitOrders: number;
            otherOrders: number;
        };
    }>;
    orderAnalysis: {
        totalOrders: number;
        ordersByAssetClass: Array<{
            assetClass: string;
            orderCount: number;
            shareVolume: number;
            notionalValue: number;
        }>;
        ordersBySize: Array<{
            sizeRange: string;
            orderCount: number;
            averageExecutionQuality: number;
        }>;
        ordersByTimeOfDay: Array<{
            timeRange: string;
            orderCount: number;
            executionQuality: number;
        }>;
    };
    bestExecutionAnalysis: {
        executionQualityMetrics: {
            implementation_shortfall: number;
            volume_weighted_average_price_variance: number;
            effective_spread: number;
            realized_spread: number;
            price_improvement_opportunity: number;
        };
        venueSelection: {
            primaryFactors: string[];
            selectionProcess: string;
            regularReviewProcess: string;
        };
        conflictsOfInterest: {
            identified: boolean;
            description?: string;
            mitigationMeasures?: string[];
        };
    };
    regulatoryInfo: {
        rule605Compliance: boolean;
        rule606Compliance: boolean;
        mifidIICompliance: boolean;
        additionalRequirements: string[];
    };
    status: FilingStatus;
    submittedBy: string;
    submittedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface RegulatoryFiling {
    id: string;
    tenantId: string;
    formType: FormType;
    jurisdiction: RegulatoryJurisdiction;
    filingDate: Date;
    reportingPeriodEnd: Date;
    dueDate: Date;
    formData: FormADV | FormPF | Form13F | BestExecutionReport;
    status: FilingStatus;
    workflowStage: 'preparation' | 'review' | 'approval' | 'filing' | 'confirmation' | 'archival';
    reviewers: Array<{
        userId: string;
        userName: string;
        role: string;
        reviewedAt?: Date;
        approved: boolean;
        comments?: string;
    }>;
    filingConfirmation?: {
        confirmationNumber: string;
        acceptedAt: Date;
        filingUrl?: string;
    };
    originalFilingId?: string;
    amendmentNumber?: number;
    amendmentReason?: string;
    attachments: Array<{
        id: string;
        filename: string;
        fileType: string;
        fileSize: number;
        uploadedAt: Date;
        uploadedBy: string;
        description: string;
    }>;
    complianceChecks: Array<{
        checkType: string;
        status: 'passed' | 'failed' | 'warning';
        message: string;
        checkedAt: Date;
    }>;
    auditTrail: Array<{
        action: string;
        performedBy: string;
        performedAt: Date;
        details: Record<string, any>;
    }>;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface FilingCalendar {
    id: string;
    tenantId: string;
    formType: FormType;
    jurisdiction: RegulatoryJurisdiction;
    filingFrequency: 'annual' | 'quarterly' | 'monthly' | 'ad_hoc';
    dueDate: Date;
    reportingPeriodEnd: Date;
    reminders: Array<{
        daysBeforeDue: number;
        reminderType: 'email' | 'system' | 'both';
        recipients: string[];
    }>;
    status: 'upcoming' | 'in_progress' | 'completed' | 'overdue';
    associatedFilingId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ComplianceRule {
    id: string;
    tenantId: string;
    ruleName: string;
    ruleDescription: string;
    ruleType: 'filing_requirement' | 'disclosure_requirement' | 'record_keeping' | 'client_communication' | 'other';
    applicableConditions: {
        assetThreshold?: number;
        clientTypes?: string[];
        businessActivities?: string[];
        jurisdictions: RegulatoryJurisdiction[];
    };
    implementation: {
        automationLevel: 'manual' | 'semi_automated' | 'fully_automated';
        checkFrequency: 'real_time' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
        monitoringCriteria: Record<string, any>;
    };
    lastChecked?: Date;
    complianceStatus: 'compliant' | 'non_compliant' | 'warning' | 'not_applicable';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
