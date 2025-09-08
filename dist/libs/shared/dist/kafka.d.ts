export const __esModule: boolean;
export namespace KAFKA_TOPICS {
    let AUTH_USER_EVENTS: string;
    let AUTH_SESSION_EVENTS: string;
    let PORTFOLIO_CREATED: string;
    let PORTFOLIO_UPDATED: string;
    let PORTFOLIO_DELETED: string;
    let TRADE_EXECUTED: string;
    let TRADE_SETTLED: string;
    let TRADE_FAILED: string;
    let MARKET_PRICES: string;
    let MARKET_CORPORATE_ACTIONS: string;
    let AUDIT_LOGS: string;
    let COMPLIANCE_VIOLATIONS: string;
    let NOTIFICATIONS_EMAIL: string;
    let NOTIFICATIONS_SMS: string;
    let NOTIFICATIONS_PUSH: string;
    let REPORT_GENERATION_REQUESTED: string;
    let REPORT_GENERATION_COMPLETED: string;
    let DLQ_AUTH: string;
    let DLQ_PORTFOLIO: string;
    let DLQ_TRADE: string;
    let DLQ_NOTIFICATION: string;
}
export default KafkaService;
export class KafkaService {
    constructor(config?: {});
    producer: kafkajs_1.Producer;
    consumers: Map<any, any>;
    connected: boolean;
    kafka: kafkajs_1.Kafka;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    publish(message: any): Promise<void>;
    publishBatch(messages: any): Promise<void>;
    subscribe(config: any): Promise<void>;
    sendToDLQ(originalTopic: any, message: any, error: any): Promise<void>;
    createTopics(topics: any): Promise<void>;
    getTopics(): Promise<string[]>;
    isConnected(): boolean;
}
export function getKafkaService(): any;
import kafkajs_1 = require("kafkajs");
