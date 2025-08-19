#!/usr/bin/env ts-node
/**
 * Load Test Runner CLI
 * Command-line interface for executing investment platform load tests
 */
interface CliOptions {
    config?: string;
    test?: string;
    env?: string;
    users?: number;
    duration?: number;
    rampUp?: number;
    output?: string;
    headless?: boolean;
    verbose?: boolean;
    help?: boolean;
}
declare class LoadTestRunner {
    private options;
    private defaultConfig;
    constructor(options: CliOptions);
    run(): Promise<void>;
    private loadConfiguration;
    private executeSelectedTest;
    private executeEnduranceTest;
    private executeSpikeTest;
    private setupEventListeners;
    private displayResultsSummary;
    private createDefaultConfig;
    private getEnvironmentUrl;
    private combineSpikeResults;
    private generateSpikeRecommendations;
    private showHelp;
    private sleep;
}
export { LoadTestRunner };
