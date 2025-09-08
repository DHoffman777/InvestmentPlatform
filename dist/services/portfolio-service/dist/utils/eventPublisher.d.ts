export const __esModule: boolean;
export function createEventPublisher(service: any): EventPublisher;
export class EventPublisher {
    constructor(service: any);
    service: any;
    publish(eventType: any, data: any): Promise<void>;
    publishBatch(events: any): Promise<void>;
}
