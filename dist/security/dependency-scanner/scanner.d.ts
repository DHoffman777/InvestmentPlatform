export = DependencyScanner;
/**
 * Investment Platform Dependency Security Scanner
 * Comprehensive dependency vulnerability scanning and update management
 */
declare class DependencyScanner {
    results: {
        timestamp: string;
        summary: {
            total: number;
            vulnerable: number;
            outdated: number;
            critical: number;
            high: number;
            medium: number;
            low: number;
        };
        vulnerabilities: any[];
        outdatedPackages: any[];
        recommendations: any[];
        ecosystems: any[];
    };
    supportedManifests: {
        file: string;
        lockFile: string;
        ecosystem: string;
    }[];
    runScan(): Promise<void>;
    detectEcosystems(): Promise<void>;
    parseManifest(ecosystem: any): Promise<void>;
    parsePackageJson(ecosystem: any, content: any): Promise<void>;
    parseRequirementsTxt(ecosystem: any, content: any): Promise<void>;
    parsePipfile(ecosystem: any, content: any): Promise<void>;
    parseGemfile(ecosystem: any, content: any): Promise<void>;
    parseComposerJson(ecosystem: any, content: any): Promise<void>;
    parseGoMod(ecosystem: any, content: any): Promise<void>;
    parseCargoToml(ecosystem: any, content: any): Promise<void>;
    scanVulnerabilities(): Promise<void>;
    scanEcosystemVulnerabilities(ecosystem: any): Promise<void>;
    scanNpmVulnerabilities(ecosystem: any): Promise<void>;
    scanPythonVulnerabilities(ecosystem: any): Promise<void>;
    checkOutdatedPackages(): Promise<void>;
    checkEcosystemOutdated(ecosystem: any): Promise<void>;
    checkNpmOutdated(ecosystem: any): Promise<void>;
    analyzeLicenses(): Promise<void>;
    checkSupplyChainRisks(): Promise<void>;
    generateRecommendations(): Promise<void>;
    cleanVersion(version: any): any;
    getDependencyType(name: any, packageJson: any): "optional" | "development" | "peer" | "runtime";
    mapNpmSeverity(npmSeverity: any): any;
    addVulnerability(vuln: any): void;
    addRecommendation(rec: any): void;
    generateReport(): Promise<void>;
    generateHTMLReport(): string;
}
