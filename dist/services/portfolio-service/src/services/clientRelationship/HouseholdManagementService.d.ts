import { Decimal } from '@prisma/client/runtime/library';
import { HouseholdGroup, ClientRelationship, RelationshipType, RiskTolerance } from '../../models/clientRelationship/ClientRelationship';
export interface HouseholdRequest {
    householdName: string;
    primaryClientId: string;
    description?: string;
    sharedObjectives?: Array<{
        objective: string;
        priority: number;
        targetAllocation?: Decimal;
        description?: string;
    }>;
}
export interface ClientRelationshipRequest {
    primaryClientId: string;
    relatedClientId: string;
    relationshipType: RelationshipType;
    percentage?: Decimal;
    notes?: string;
    documentationRequired?: boolean;
    expirationDate?: Date;
}
export interface HouseholdAnalytics {
    householdId: string;
    totalMembers: number;
    totalAssets: Decimal;
    averageAssets: Decimal;
    combinedRiskTolerance: RiskTolerance;
    assetDistribution: Array<{
        clientId: string;
        clientName: string;
        assets: Decimal;
        percentage: Decimal;
    }>;
    sharedObjectivesAlignment: number;
    diversificationScore: number;
}
export declare class HouseholdManagementService {
    private prisma;
    private kafkaService;
    /**
     * Create a new household group
     */
    createHousehold(request: HouseholdRequest, tenantId: string, userId: string): Promise<HouseholdGroup>;
    /**
     * Add a client relationship to a household
     */
    addClientRelationship(householdId: string, request: ClientRelationshipRequest, tenantId: string, userId: string): Promise<ClientRelationship>;
    /**
     * Get household with all members and relationships
     */
    getHousehold(householdId: string, tenantId: string): Promise<HouseholdGroup & {
        members: any[];
    }>;
    /**
     * Update client relationship status
     */
    updateClientRelationship(relationshipId: string, updates: Partial<ClientRelationshipRequest>, tenantId: string, userId: string): Promise<ClientRelationship>;
    /**
     * Remove client from household
     */
    removeClientFromHousehold(householdId: string, clientId: string, tenantId: string, userId: string): Promise<any>;
    /**
     * Get household analytics and insights
     */
    getHouseholdAnalytics(householdId: string, tenantId: string): Promise<HouseholdAnalytics>;
    /**
     * List all households for a tenant
     */
    listHouseholds(tenantId: string, options?: {
        page?: number;
        limit?: number;
        search?: string;
        minAssets?: Decimal;
        riskTolerance?: RiskTolerance;
    }): Promise<{
        households: HouseholdGroup[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    private getHouseholdFromStorage;
    private calculateHouseholdAssets;
    private calculateCombinedRiskTolerance;
    private calculateAssetDistribution;
    private calculateDiversificationScore;
    private calculateObjectivesAlignment;
}
