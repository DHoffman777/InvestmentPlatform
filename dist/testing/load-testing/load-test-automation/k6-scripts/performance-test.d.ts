export function portfolioManagement(): void;
export function tradingOperations(): void;
export function marketDataConsumption(): void;
export function clientPortalUsage(): void;
export function reportingAnalytics(): void;
export default function _default(): void;
export function setup(): {
    startTime: string;
};
export function teardown(data: any): void;
export function handleSummary(data: any): {
    'load-test-results/k6-performance-report.html': any;
    'load-test-results/k6-performance-results.json': string;
};
export namespace options {
    namespace scenarios {
        namespace baseline_load {
            let executor: string;
            let startVUs: number;
            let stages: {
                duration: string;
                target: number;
            }[];
        }
        namespace peak_trading {
            let executor_1: string;
            export { executor_1 as executor };
            let startVUs_1: number;
            export { startVUs_1 as startVUs };
            let stages_1: {
                duration: string;
                target: number;
            }[];
            export { stages_1 as stages };
        }
        namespace stress_test {
            let executor_2: string;
            export { executor_2 as executor };
            export let startRate: number;
            export let timeUnit: string;
            export let preAllocatedVUs: number;
            export let maxVUs: number;
            let stages_2: {
                duration: string;
                target: number;
            }[];
            export { stages_2 as stages };
        }
        namespace spike_test {
            let executor_3: string;
            export { executor_3 as executor };
            let startVUs_2: number;
            export { startVUs_2 as startVUs };
            let stages_3: {
                duration: string;
                target: number;
            }[];
            export { stages_3 as stages };
        }
    }
    let thresholds: {
        http_req_duration: string[];
        http_req_failed: string[];
        order_placement_success: string[];
        portfolio_update_success: string[];
        market_data_latency: string[];
        trading_errors: string[];
        'http_req_duration{scenario:peak_trading}': string[];
        'http_req_duration{scenario:stress_test}': string[];
    };
}
