export const __esModule: boolean;
export const AutoScalingService: typeof AutoScalingService_1.AutoScalingService;
import AutoScalingService_1 = require("./AutoScalingService");
export namespace config {
    namespace redis {
        let host: string;
        let port: number;
        let password: string;
        let db: number;
    }
    namespace metrics {
        let prometheusUrl: string;
        let customEndpoints: string[];
        let collectionInterval: number;
    }
    namespace scaling {
        export let enabled: boolean;
        export let provider: string;
        export namespace metrics_1 {
            let sources: {
                name: string;
                type: string;
                query: string;
                threshold: number;
                comparison: string;
                weight: number;
            }[];
            let aggregationWindow: number;
            let evaluationInterval: number;
        }
        export { metrics_1 as metrics };
        export let rules: ({
            id: string;
            name: string;
            description: string;
            enabled: boolean;
            conditions: {
                metric: string;
                operator: string;
                threshold: number;
                comparison: string;
                duration: number;
            }[];
            action: {
                type: string;
                scaleByPercent: number;
                targetServices: any[];
                gracefulShutdown: boolean;
                scaleByCount?: undefined;
            };
            priority: number;
            tags: string[];
        } | {
            id: string;
            name: string;
            description: string;
            enabled: boolean;
            conditions: {
                metric: string;
                operator: string;
                threshold: number;
                comparison: string;
                duration: number;
            }[];
            action: {
                type: string;
                scaleByCount: number;
                targetServices: any[];
                gracefulShutdown: boolean;
                scaleByPercent?: undefined;
            };
            priority: number;
            tags: string[];
        })[];
        export namespace limits {
            let minInstances: number;
            let maxInstances: number;
            let scaleUpCooldown: number;
            let scaleDownCooldown: number;
        }
        export namespace notifications {
            let enabled_1: boolean;
            export { enabled_1 as enabled };
            export let webhookUrl: string;
            export let slackChannel: string;
        }
    }
    namespace reporting {
        let enabled_2: boolean;
        export { enabled_2 as enabled };
        export let schedule: string;
        export let retentionDays: number;
    }
    namespace alerts {
        let enabled_3: boolean;
        export { enabled_3 as enabled };
        let webhookUrl_1: string;
        export { webhookUrl_1 as webhookUrl };
        let slackChannel_1: string;
        export { slackChannel_1 as slackChannel };
        export let emailRecipients: string[];
    }
}
export namespace financialProfile {
    namespace marketHours {
        namespace preMarket {
            let start: string;
            let end: string;
        }
        namespace regular {
            let start_1: string;
            export { start_1 as start };
            let end_1: string;
            export { end_1 as end };
        }
        namespace afterMarket {
            let start_2: string;
            export { start_2 as start };
            let end_2: string;
            export { end_2 as end };
        }
        let timezone: string;
    }
    namespace tradingPatterns {
        namespace openingBell {
            let multiplier: number;
            let duration: number;
        }
        namespace closingBell {
            let multiplier_1: number;
            export { multiplier_1 as multiplier };
            let duration_1: number;
            export { duration_1 as duration };
        }
        namespace lunchTime {
            let multiplier_2: number;
            export { multiplier_2 as multiplier };
            let duration_2: number;
            export { duration_2 as duration };
        }
        namespace monthEnd {
            let multiplier_3: number;
            export { multiplier_3 as multiplier };
            export let days: number;
        }
        namespace quarterEnd {
            let multiplier_4: number;
            export { multiplier_4 as multiplier };
            let days_1: number;
            export { days_1 as days };
        }
    }
    namespace complianceRequirements {
        let minInstancesForRedundancy: number;
        let maxScaleDownRate: number;
        let requiredApprovalForLargeScale: number;
        let auditLogging: boolean;
    }
    namespace riskManagement {
        let maxInstancesPerAvailabilityZone: number;
        let requiredHealthCheckGracePeriod: number;
        let automaticRollbackOnErrors: boolean;
        let catastrophicFailureThreshold: number;
    }
}
