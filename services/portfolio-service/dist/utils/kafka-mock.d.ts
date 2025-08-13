/**
 * Mock Kafka service for development and testing
 */
declare class MockKafkaService {
    private connected;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    publish(topic: string, message: any): Promise<void>;
    subscribe(topic: string, handler: (message: any) => void): Promise<void>;
    publishEvent(topic: string, message: any): Promise<void>;
    publishMessage(topic: string, message: any): Promise<void>;
}
export declare function getKafkaService(): MockKafkaService;
export { MockKafkaService as KafkaService };
