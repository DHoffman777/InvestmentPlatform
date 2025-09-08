export const __esModule: boolean;
export class LoadTestExecutor extends events_1<[never]> {
    constructor();
    activeTests: Map<any, any>;
    testResults: Map<any, any>;
    configPath: any;
    ensureConfigDirectory(): Promise<void>;
    executeLoadTest(config: any): Promise<string>;
    generateTestConfig(testId: any, config: any): Promise<void>;
    generateArtilleryConfig(config: any): string;
    generateAutocannonConfig(config: any): {
        url: any;
        connections: number;
        pipelining: number;
        duration: any;
        headers: any;
        method: string;
        setupClient: string;
    };
    generateAuthSetup(auth: any): string;
    runLoadTest(testId: any, config: any): Promise<void>;
    runArtilleryTest(testId: any, config: any): Promise<void>;
    runAutocannonTest(testId: any, config: any): Promise<void>;
    parseArtilleryOutput(testId: any, output: any): void;
    processArtilleryResults(testId: any, data: any): Promise<void>;
    processAutocannonResults(testId: any, data: any): Promise<void>;
    evaluateThresholds(thresholds: any, summary: any): {
        name: string;
        threshold: any;
        actual: any;
        passed: boolean;
        type: string;
    }[];
    generateRecommendations(result: any): {
        type: string;
        priority: string;
        title: string;
        description: string;
        impact: string;
        implementation: string;
        estimatedEffort: string;
    }[];
    convertToYaml(obj: any, indent?: number): string;
    cleanupTestFiles(testId: any): Promise<void>;
    cancelTest(testId: any): Promise<boolean>;
    getTestResult(testId: any): any;
    getActiveTests(): any[];
    validateTestEnvironment(): Promise<{
        valid: boolean;
        issues: string[];
    }>;
    executeCommand(command: any): Promise<any>;
}
import events_1 = require("events");
