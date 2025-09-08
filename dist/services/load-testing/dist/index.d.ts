export const __esModule: boolean;
export const LoadTestingService: typeof LoadTestingService_1.LoadTestingService;
import LoadTestingService_1 = require("./LoadTestingService");
export namespace config {
    namespace redis {
        let host: string;
        let port: number;
        let password: string;
        let db: number;
    }
    namespace defaultTestSettings {
        let maxConcurrentTests: number;
        let defaultDuration: number;
        let maxDuration: number;
        let retentionDays: number;
    }
    namespace scheduling {
        let enableScheduledTests: boolean;
        let cleanupSchedule: string;
    }
    namespace notifications {
        let enabled: boolean;
        let webhookUrl: string;
        let slackChannel: string;
    }
}
