import { EventEmitter } from 'events';
import { LoadTestConfig, LoadTestResult } from '../types';
export declare class LoadTestExecutor extends EventEmitter {
    private activeTests;
    private testResults;
    private configPath;
    constructor();
    private ensureConfigDirectory;
    executeLoadTest(config: LoadTestConfig): Promise<string>;
    private generateTestConfig;
    private generateArtilleryConfig;
    private generateAutocannonConfig;
    private generateAuthSetup;
    private runLoadTest;
    private runArtilleryTest;
    private runAutocannonTest;
    private parseArtilleryOutput;
    private processArtilleryResults;
    private processAutocannonResults;
    private evaluateThresholds;
    private generateRecommendations;
    private convertToYaml;
    private cleanupTestFiles;
    cancelTest(testId: string): Promise<boolean>;
    getTestResult(testId: string): LoadTestResult | undefined;
    getActiveTests(): string[];
    validateTestEnvironment(): Promise<{
        valid: boolean;
        issues: string[];
    }>;
    private executeCommand;
}
//# sourceMappingURL=LoadTestExecutor.d.ts.map