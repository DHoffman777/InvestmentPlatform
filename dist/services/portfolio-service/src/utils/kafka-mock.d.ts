/**
 * Mock Kafka service for development and testing
 */
declare class MockKafkaService {
    private connected;
    connect(): Promise<any>;
    disconnect(): Promise<any>;
    isConnected(): boolean;
    publish(topic: string, message: any): Promise<any>;
    subscribe(topic: string, handler: (message: any) => void): Promise<any>;
    publishEvent(topic: string, message: any): Promise<any>;
    publishMessage(topic: string, message: any): Promise<any>;
}
export declare function getKafkaService(): MockKafkaService;
export { MockKafkaService as KafkaService };
