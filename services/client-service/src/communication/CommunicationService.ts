export class CommunicationService {
  async getClientCommunications(
    clientId: string,
    tenantId: string,
    options: { limit: number; offset: number }
  ) {
    return {
      communications: [],
      total: 0,
      limit: options.limit,
      offset: options.offset,
      hasMore: false
    };
  }

  async getCommunicationsByIds(communicationIds: string[]) {
    return [];
  }

  async createCommunication(data: any) {
    return {
      id: 'mock-id',
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async getCommunications(filters: any) {
    return {
      communications: [],
      total: 0,
      limit: filters?.limit || 10,
      offset: filters?.offset || 0,
      hasMore: false
    };
  }

  async getCommunicationById(communicationId: string, tenantId: string) {
    return {
      id: communicationId,
      tenantId,
      subject: 'Mock Communication',
      content: 'Mock content',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async updateCommunication(communicationId: string, data: any, tenantId: string) {
    return {
      id: communicationId,
      ...data,
      tenantId,
      updatedAt: new Date()
    };
  }

  async deleteCommunication(communicationId: string, reason: string, userId: string, tenantId: string) {
    return { success: true };
  }

  async searchCommunications(
    tenantId: string,
    query: string,
    filters: any,
    options: { sortBy?: string; limit?: number; offset?: number }
  ) {
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