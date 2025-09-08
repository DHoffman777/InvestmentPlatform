export const __esModule: boolean;
export class HouseholdManagementService {
    prisma: import(".prisma/client").PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, library_1.DefaultArgs>;
    kafkaService: kafka_mock_1.KafkaService;
    /**
     * Create a new household group
     */
    createHousehold(request: any, tenantId: any, userId: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: any;
        householdName: any;
        primaryClientId: any;
        relationships: any[];
        totalAssets: library_1.Decimal;
        combinedRiskTolerance: import(".prisma/client").$Enums.RiskTolerance;
        sharedObjectives: any;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Add a client relationship to a household
     */
    addClientRelationship(householdId: any, request: any, tenantId: any, userId: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        primaryClientId: any;
        relatedClientId: any;
        relationshipType: any;
        percentage: any;
        isActive: boolean;
        effectiveDate: Date;
        expirationDate: any;
        notes: any;
        documentationRequired: any;
        documentationComplete: boolean;
    }>;
    /**
     * Get household with all members and relationships
     */
    getHousehold(householdId: any, tenantId: any): Promise<{
        totalAssets: library_1.Decimal;
        combinedRiskTolerance: string;
        members: ({
            investmentObjectives: {
                description: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                priority: number;
                isActive: boolean;
                timeHorizon: number | null;
                riskLevel: string | null;
                clientId: string;
                expectedReturn: library_1.Decimal | null;
                objective: string;
                targetAllocation: library_1.Decimal | null;
            }[];
            addresses: {
                id: string;
                country: string;
                clientId: string;
                state: string;
                street1: string;
                street2: string | null;
                city: string;
                postalCode: string;
                isPrimary: boolean;
            }[];
        } & {
            status: import(".prisma/client").$Enums.ClientStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            tenantId: string;
            createdBy: string;
            updatedBy: string;
            timeHorizon: number;
            firstName: string | null;
            lastName: string | null;
            dateOfBirth: Date | null;
            lastContactDate: Date | null;
            riskTolerance: import(".prisma/client").$Enums.RiskTolerance;
            liquidityNeeds: import(".prisma/client").$Enums.LiquidityNeeds;
            investmentExperience: import(".prisma/client").$Enums.InvestmentExperience;
            clientType: import(".prisma/client").$Enums.ClientType;
            netWorth: library_1.Decimal | null;
            annualIncome: library_1.Decimal | null;
            clientNumber: string;
            middleName: string | null;
            entityName: string | null;
            socialSecurityNumber: string | null;
            taxId: string | null;
            phoneNumber: string | null;
            mobileNumber: string | null;
            liquidNetWorth: library_1.Decimal | null;
            investmentExperienceYears: number | null;
            documentDeliveryPreference: import(".prisma/client").$Enums.DocumentDeliveryPreference;
            politicallyExposedPerson: boolean;
            employeeOfBrokerDealer: boolean;
            directorOfPublicCompany: boolean;
            primaryAdvisor: string | null;
            assignedTeam: string[];
            relationshipStartDate: Date;
        })[];
        id: any;
        tenantId: any;
        householdName: string;
        primaryClientId: string;
        relationships: any[];
        sharedObjectives: any[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Update client relationship status
     */
    updateClientRelationship(relationshipId: any, updates: any, tenantId: any, userId: any): Promise<any>;
    /**
     * Remove client from household
     */
    removeClientFromHousehold(householdId: any, clientId: any, tenantId: any, userId: any): Promise<void>;
    /**
     * Get household analytics and insights
     */
    getHouseholdAnalytics(householdId: any, tenantId: any): Promise<{
        householdId: any;
        totalMembers: number;
        totalAssets: library_1.Decimal;
        averageAssets: library_1.Decimal;
        combinedRiskTolerance: string;
        assetDistribution: any;
        sharedObjectivesAlignment: number;
        diversificationScore: number;
    }>;
    /**
     * List all households for a tenant
     */
    listHouseholds(tenantId: any, options?: {}): Promise<{
        households: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    getHouseholdFromStorage(householdId: any, tenantId: any): Promise<{
        id: any;
        tenantId: any;
        householdName: string;
        primaryClientId: string;
        relationships: any[];
        totalAssets: library_1.Decimal;
        sharedObjectives: any[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    calculateHouseholdAssets(memberIds: any, tenantId: any): Promise<library_1.Decimal>;
    calculateCombinedRiskTolerance(members: any): string;
    calculateAssetDistribution(members: any, tenantId: any): Promise<any>;
    calculateDiversificationScore(members: any): 85 | 60 | 70 | 50;
    calculateObjectivesAlignment(members: any, sharedObjectives: any): number;
}
import library_1 = require("@prisma/client/runtime/library");
import kafka_mock_1 = require("../../utils/kafka-mock");
