export declare class EventPublisher {
    private service;
    constructor(service: string);
    publish(eventType: string, data: any): Promise<any>;
    publishBatch(events: {
        eventType: string;
        data: any;
    }[]): Promise<any>;
}
export declare function createEventPublisher(service: string): EventPublisher;
