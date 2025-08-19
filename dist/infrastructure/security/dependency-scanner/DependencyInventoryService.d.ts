import { EventEmitter } from 'events';
export interface Dependency {
    name: string;
    version: string;
    type: 'direct' | 'transitive';
    scope: 'production' | 'development' | 'optional' | 'peer';
    ecosystem: 'npm' | 'python' | 'java' | 'dotnet' | 'ruby' | 'go' | 'rust';
    packageFile: string;
    licenses: string[];
    description?: string;
    homepage?: string;
    repository?: string;
    maintainers?: string[];
    lastUpdate?: Date;
    downloads?: number;
    dependsOn: string[];
    dependedOnBy: string[];
}
export interface PackageFile {
    filePath: string;
    ecosystem: string;
    lockFile?: string;
    dependencies: Dependency[];
    lastScanned: Date;
    checksum?: string;
}
export interface DependencyInventory {
    id: string;
    tenantId: string;
    projectName: string;
    projectPath: string;
    packageFiles: PackageFile[];
    totalDependencies: number;
    directDependencies: number;
    transitiveDependencies: number;
    ecosystems: string[];
    lastScan: Date;
    scanDuration: number;
    scanId: string;
}
export interface ScanOptions {
    includeTransitive?: boolean;
    includeDev?: boolean;
    excludePatterns?: string[];
    maxDepth?: number;
    scanTimeout?: number;
    ecosystems?: string[];
    fetchMetadata?: boolean;
}
export interface PackageFilePattern {
    ecosystem: string;
    files: string[];
    lockFiles?: string[];
    parser: (filePath: string, lockFile?: string) => Promise<Dependency[]>;
}
export declare class DependencyInventoryService extends EventEmitter {
    private inventories;
    private scanResults;
    private packagePatterns;
    constructor();
    scanProject(projectPath: string, tenantId: string, projectName: string, options?: ScanOptions): Promise<DependencyInventory>;
    private discoverPackageFiles;
    private findLockFile;
    private parsePackageFile;
    private parseNpmPackages;
    private parseNpmLockFile;
    private parseYarnLock;
    private parsePythonPackages;
    private parsePyprojectToml;
    private parseJavaPackages;
    private parsePomXml;
    private parseBuildGradle;
    private parseDotNetPackages;
    private parseRubyPackages;
    private parseGoPackages;
    private parseRustPackages;
    private enrichNpmDependencies;
    private fetchNpmMetadata;
    private buildInventory;
    private calculateFileChecksum;
    private generateScanId;
    private generateInventoryId;
    getInventory(inventoryId: string): DependencyInventory | undefined;
    getInventoriesByTenant(tenantId: string): DependencyInventory[];
    updateInventory(inventoryId: string, options?: ScanOptions): Promise<DependencyInventory>;
    deleteInventory(inventoryId: string): boolean;
    getDependenciesByEcosystem(inventoryId: string, ecosystem: string): Dependency[];
    searchDependencies(inventoryId: string, query: {
        name?: string;
        version?: string;
        ecosystem?: string;
        type?: 'direct' | 'transitive';
        scope?: string;
    }): Dependency[];
    getInventoryMetrics(inventoryId: string): any;
}
