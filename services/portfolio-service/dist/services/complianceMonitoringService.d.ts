import { getKafkaService } from '../utils/kafka-mock';
import { ComplianceBreach, SuitabilityCheck, ComplianceCheckRequest, ComplianceCheckResult, RuleCheckResult, BreachSearchRequest, BreachSearchResult } from '../models/compliance/ComplianceMonitoring';
export declare class ComplianceMonitoringService {
    private prisma;
    private kafkaService;
    constructor(prisma: any, // Changed to any to bypass type checking
    kafkaService: ReturnType<typeof getKafkaService>);
    checkInvestmentGuidelines(request: ComplianceCheckRequest, tenantId: string, userId: string): Promise<ComplianceCheckResult>;
    private checkAllocationGuidelines;
    private checkComplianceRule;
    monitorConcentrationLimits(portfolioId: string, tenantId: string, userId: string): Promise<RuleCheckResult[]>;
    screenRestrictedList(portfolioId: string, instrumentIds: string[], tenantId: string, userId: string): Promise<RuleCheckResult[]>;
    verifySuitability(clientId: string, portfolioId: string, tenantId: string, userId: string): Promise<SuitabilityCheck>;
    detectBreaches(tenantId: string, portfolioIds?: string[]): Promise<ComplianceBreach[]>;
    searchBreaches(request: BreachSearchRequest, tenantId: string): Promise<BreachSearchResult>;
    private checkAllocationLimit;
    private determineSeverity;
    private generateId;
    private getPortfolioData;
    private getApplicableGuidelines;
    private getApplicableRules;
    private calculatePortfolioAllocations;
    private calculateSectorAllocations;
    private calculateConcentrations;
    private createBreachesFromResults;
    private logComplianceCheck;
    private publishComplianceEvent;
    private publishSuitabilityEvent;
    private buildRuleContext;
    private evaluateRule;
    private getConcentrationRules;
}
