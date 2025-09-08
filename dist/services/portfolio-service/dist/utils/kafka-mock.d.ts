export const __esModule: boolean;
export function getKafkaService(): MockKafkaService;
/**
 * Mock Kafka service for development and testing
 */
declare class MockKafkaService {
    connected: boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    publish(topic: any, message: any): Promise<void>;
    subscribe(topic: any, handler: any): Promise<void>;
    publishEvent(topic: any, message: any): Promise<void>;
    publishMessage(topic: any, message: any): Promise<void>;
}
export { MockKafkaService as KafkaService };
