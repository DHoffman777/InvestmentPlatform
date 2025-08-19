"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaService = void 0;
exports.getKafkaService = getKafkaService;
const logger_1 = require("./logger");
/**
 * Mock Kafka service for development and testing
 */
class MockKafkaService {
    connected = false;
    async connect() {
        logger_1.logger.info('Mock Kafka service connecting...');
        this.connected = true;
        return Promise.resolve();
    }
    async disconnect() {
        logger_1.logger.info('Mock Kafka service disconnecting...');
        this.connected = false;
        return Promise.resolve();
    }
    isConnected() {
        return this.connected;
    }
    async publish(topic, message) {
        logger_1.logger.info('Mock Kafka publish:', { topic, message });
        return Promise.resolve();
    }
    async subscribe(topic, handler) {
        logger_1.logger.info('Mock Kafka subscribe:', { topic });
        return Promise.resolve();
    }
    async publishEvent(topic, message) {
        logger_1.logger.info('Mock Kafka publishEvent:', { topic, message });
        return Promise.resolve();
    }
    async publishMessage(topic, message) {
        logger_1.logger.info('Mock Kafka publishMessage:', { topic, message });
        return Promise.resolve();
    }
}
exports.KafkaService = MockKafkaService;
function getKafkaService() {
    return new MockKafkaService();
}
