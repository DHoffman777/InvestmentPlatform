"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationService = void 0;
class CommunicationService {
    async getClientCommunications(clientId, tenantId, options) {
        return {
            communications: [],
            total: 0,
            limit: options.limit,
            offset: options.offset,
            hasMore: false
        };
    }
    async getCommunicationsByIds(communicationIds) {
        return [];
    }
    async createCommunication(data) {
        return {
            id: 'mock-id',
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    async getCommunications(filters) {
        return {
            communications: [],
            total: 0,
            limit: filters?.limit || 10,
            offset: filters?.offset || 0,
            hasMore: false
        };
    }
    async getCommunicationById(communicationId, tenantId) {
        return {
            id: communicationId,
            tenantId,
            subject: 'Mock Communication',
            content: 'Mock content',
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    async updateCommunication(communicationId, data, tenantId) {
        return {
            id: communicationId,
            ...data,
            tenantId,
            updatedAt: new Date()
        };
    }
    async deleteCommunication(communicationId, reason, userId, tenantId) {
        return { success: true };
    }
    async searchCommunications(tenantId, query, filters, options) {
        return {
            communications: [],
            total: 0,
            facets: {},
            limit: options?.limit || 10,
            offset: options?.offset || 0,
            hasMore: false
        };
    }
}
exports.CommunicationService = CommunicationService;
