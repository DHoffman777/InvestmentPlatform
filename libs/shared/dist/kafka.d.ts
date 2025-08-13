import { KafkaConfig } from 'kafkajs';
export interface KafkaMessage {
    topic: string;
    key?: string;
    value: any;
    headers?: Record<string, string>;
    timestamp?: Date;
}
export interface KafkaConsumerHandler {
    topic: string;
    groupId: string;
    handler: (message: KafkaMessage) => Promise<void>;
}
export declare class KafkaService {
    private kafka;
    private producer;
    private consumers;
    private connected;
    constructor(config?: Partial<KafkaConfig>);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    publish(message: KafkaMessage): Promise<void>;
    publishBatch(messages: KafkaMessage[]): Promise<void>;
    subscribe(config: KafkaConsumerHandler): Promise<void>;
    private sendToDLQ;
    createTopics(topics: string[]): Promise<void>;
    getTopics(): Promise<string[]>;
    isConnected(): boolean;
}
export declare const KAFKA_TOPICS: {
    readonly AUTH_USER_EVENTS: "auth.user.events";
    readonly AUTH_SESSION_EVENTS: "auth.session.events";
    readonly PORTFOLIO_CREATED: "portfolio.created";
    readonly PORTFOLIO_UPDATED: "portfolio.updated";
    readonly PORTFOLIO_DELETED: "portfolio.deleted";
    readonly TRADE_EXECUTED: "trade.executed";
    readonly TRADE_SETTLED: "trade.settled";
    readonly TRADE_FAILED: "trade.failed";
    readonly MARKET_PRICES: "market.prices";
    readonly MARKET_CORPORATE_ACTIONS: "market.corporate-actions";
    readonly AUDIT_LOGS: "audit.logs";
    readonly COMPLIANCE_VIOLATIONS: "compliance.violations";
    readonly NOTIFICATIONS_EMAIL: "notifications.email";
    readonly NOTIFICATIONS_SMS: "notifications.sms";
    readonly NOTIFICATIONS_PUSH: "notifications.push";
    readonly REPORT_GENERATION_REQUESTED: "report.generation.requested";
    readonly REPORT_GENERATION_COMPLETED: "report.generation.completed";
    readonly DLQ_AUTH: "dlq.auth";
    readonly DLQ_PORTFOLIO: "dlq.portfolio";
    readonly DLQ_TRADE: "dlq.trade";
    readonly DLQ_NOTIFICATION: "dlq.notification";
};
export interface UserEvent {
    userId: string;
    tenantId: string;
    action: 'created' | 'updated' | 'deleted' | 'login' | 'logout';
    metadata?: Record<string, any>;
}
export interface PortfolioEvent {
    portfolioId: string;
    tenantId: string;
    userId: string;
    action: 'created' | 'updated' | 'deleted';
    data: Record<string, any>;
}
export interface TradeEvent {
    tradeId: string;
    portfolioId: string;
    tenantId: string;
    symbol: string;
    quantity: number;
    price: number;
    side: 'buy' | 'sell';
    status: 'executed' | 'settled' | 'failed';
    metadata?: Record<string, any>;
}
export interface MarketDataEvent {
    symbol: string;
    price: number;
    volume?: number;
    timestamp: string;
    source: string;
    metadata?: Record<string, any>;
}
export interface NotificationEvent {
    userId: string;
    tenantId: string;
    type: 'email' | 'sms' | 'push';
    recipient: string;
    subject?: string;
    content: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    metadata?: Record<string, any>;
}
export declare const getKafkaService: () => KafkaService;
export default KafkaService;
//# sourceMappingURL=kafka.d.ts.map