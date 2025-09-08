import { logger } from './logger';

/**
 * Mock Kafka service for development and testing
 */
class MockKafkaService {
  private connected = false;

  async connect(): Promise<any> {
    logger.info('Mock Kafka service connecting...');
    this.connected = true;
    return Promise.resolve();
  }

  async disconnect(): Promise<any> {
    logger.info('Mock Kafka service disconnecting...');
    this.connected = false;
    return Promise.resolve();
  }

  isConnected(): boolean {
    return this.connected;
  }

  async publish(topic: string, message: any): Promise<any> {
    logger.info('Mock Kafka publish:', { topic, message });
    return Promise.resolve();
  }

  async subscribe(topic: string, handler: (message: any) => void): Promise<any> {
    logger.info('Mock Kafka subscribe:', { topic });
    return Promise.resolve();
  }

  async publishEvent(topic: string, message: any): Promise<any> {
    logger.info('Mock Kafka publishEvent:', { topic, message });
    return Promise.resolve();
  }

  async publishMessage(topic: string, message: any): Promise<any> {
    logger.info('Mock Kafka publishMessage:', { topic, message });
    return Promise.resolve();
  }
}

export function getKafkaService(): MockKafkaService {
  return new MockKafkaService();
}

// Export the class as KafkaService for compatibility
export { MockKafkaService as KafkaService };
