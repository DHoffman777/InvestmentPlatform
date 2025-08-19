"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyInventoryService = void 0;
const events_1 = require("events");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const glob_1 = require("glob");
class DependencyInventoryService extends events_1.EventEmitter {
    inventories = new Map();
    scanResults = new Map();
    packagePatterns = [
        {
            ecosystem: 'npm',
            files: ['package.json'],
            lockFiles: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'],
            parser: this.parseNpmPackages.bind(this)
        },
        {
            ecosystem: 'python',
            files: ['requirements.txt', 'setup.py', 'pyproject.toml', 'Pipfile'],
            lockFiles: ['requirements.lock', 'Pipfile.lock', 'poetry.lock'],
            parser: this.parsePythonPackages.bind(this)
        },
        {
            ecosystem: 'java',
            files: ['pom.xml', 'build.gradle', 'build.gradle.kts'],
            lockFiles: ['gradle.lockfile'],
            parser: this.parseJavaPackages.bind(this)
        },
        {
            ecosystem: 'dotnet',
            files: ['*.csproj', '*.fsproj', '*.vbproj', 'packages.config'],
            lockFiles: ['packages.lock.json'],
            parser: this.parseDotNetPackages.bind(this)
        },
        {
            ecosystem: 'ruby',
            files: ['Gemfile', '*.gemspec'],
            lockFiles: ['Gemfile.lock'],
            parser: this.parseRubyPackages.bind(this)
        },
        {
            ecosystem: 'go',
            files: ['go.mod'],
            lockFiles: ['go.sum'],
            parser: this.parseGoPackages.bind(this)
        },
        {
            ecosystem: 'rust',
            files: ['Cargo.toml'],
            lockFiles: ['Cargo.lock'],
            parser: this.parseRustPackages.bind(this)
        }
    ];
    constructor() {
        super();
    }
    async scanProject(projectPath, tenantId, projectName, options = {}) {
        const startTime = Date.now();
        const scanId = this.generateScanId();
        try {
            this.emit('scanStarted', { projectPath, tenantId, scanId });
            const packageFiles = await this.discoverPackageFiles(projectPath, options);
            const parsedFiles = [];
            for (const packageFile of packageFiles) {
                try {
                    const dependencies = await this.parsePackageFile(packageFile, options);
                    parsedFiles.push({
                        filePath: packageFile.filePath,
                        ecosystem: packageFile.ecosystem,
                        lockFile: packageFile.lockFile,
                        dependencies,
                        lastScanned: new Date(),
                        checksum: await this.calculateFileChecksum(packageFile.filePath)
                    });
                    this.emit('packageFileParsed', {
                        filePath: packageFile.filePath,
                        dependencyCount: dependencies.length
                    });
                }
                catch (error) {
                    this.emit('packageFileError', {
                        filePath: packageFile.filePath,
                        error: error.message
                    });
                    continue;
                }
            }
            const inventory = await this.buildInventory(tenantId, projectName, projectPath, parsedFiles, scanId, Date.now() - startTime);
            this.inventories.set(inventory.id, inventory);
            this.emit('scanCompleted', {
                inventoryId: inventory.id,
                totalDependencies: inventory.totalDependencies,
                scanDuration: inventory.scanDuration
            });
            return inventory;
        }
        catch (error) {
            this.emit('scanFailed', { projectPath, tenantId, error: error.message });
            throw error;
        }
    }
    async discoverPackageFiles(projectPath, options) {
        const discovered = [];
        for (const pattern of this.packagePatterns) {
            if (options.ecosystems && !options.ecosystems.includes(pattern.ecosystem)) {
                continue;
            }
            for (const filePattern of pattern.files) {
                const globPattern = path.join(projectPath, '**', filePattern);
                const files = await (0, glob_1.glob)(globPattern, {
                    ignore: options.excludePatterns || [
                        '**/node_modules/**',
                        '**/vendor/**',
                        '**/target/**',
                        '**/build/**',
                        '**/.git/**'
                    ]
                });
                for (const file of files) {
                    const lockFile = await this.findLockFile(file, pattern.lockFiles || []);
                    discovered.push({
                        filePath: file,
                        ecosystem: pattern.ecosystem,
                        lockFile
                    });
                }
            }
        }
        return discovered;
    }
    async findLockFile(packageFilePath, lockFilePatterns) {
        const packageDir = path.dirname(packageFilePath);
        for (const lockPattern of lockFilePatterns) {
            const lockPath = path.join(packageDir, lockPattern);
            try {
                await fs.access(lockPath);
                return lockPath;
            }
            catch {
                continue;
            }
        }
        return undefined;
    }
    async parsePackageFile(packageFile, options) {
        const pattern = this.packagePatterns.find(p => p.ecosystem === packageFile.ecosystem);
        if (!pattern) {
            throw new Error(`Unsupported ecosystem: ${packageFile.ecosystem}`);
        }
        return await pattern.parser(packageFile.filePath, packageFile.lockFile);
    }
    async parseNpmPackages(filePath, lockFile) {
        const dependencies = [];
        try {
            const packageJson = JSON.parse(await fs.readFile(filePath, 'utf-8'));
            const packageDir = path.dirname(filePath);
            // Parse direct dependencies
            const depTypes = [
                { deps: packageJson.dependencies || {}, scope: 'production' },
                { deps: packageJson.devDependencies || {}, scope: 'development' },
                { deps: packageJson.optionalDependencies || {}, scope: 'optional' },
                { deps: packageJson.peerDependencies || {}, scope: 'peer' }
            ];
            for (const { deps, scope } of depTypes) {
                for (const [name, version] of Object.entries(deps)) {
                    dependencies.push({
                        name,
                        version: version,
                        type: 'direct',
                        scope,
                        ecosystem: 'npm',
                        packageFile: filePath,
                        licenses: [],
                        dependsOn: [],
                        dependedOnBy: []
                    });
                }
            }
            // Parse lock file for transitive dependencies if available
            if (lockFile) {
                const transitiveDeps = await this.parseNpmLockFile(lockFile);
                dependencies.push(...transitiveDeps);
            }
            // Fetch metadata for dependencies
            await this.enrichNpmDependencies(dependencies);
        }
        catch (error) {
            throw new Error(`Failed to parse npm package file ${filePath}: ${error.message}`);
        }
        return dependencies;
    }
    async parseNpmLockFile(lockFilePath) {
        const dependencies = [];
        try {
            if (lockFilePath.endsWith('package-lock.json')) {
                const lockData = JSON.parse(await fs.readFile(lockFilePath, 'utf-8'));
                if (lockData.packages) {
                    // npm v7+ format
                    for (const [packagePath, packageInfo] of Object.entries(lockData.packages)) {
                        if (packagePath === '' || packagePath.startsWith('node_modules/'))
                            continue;
                        const name = packagePath.replace('node_modules/', '');
                        dependencies.push({
                            name,
                            version: packageInfo.version || '',
                            type: 'transitive',
                            scope: 'production',
                            ecosystem: 'npm',
                            packageFile: lockFilePath,
                            licenses: packageInfo.license ? [packageInfo.license] : [],
                            dependsOn: [],
                            dependedOnBy: []
                        });
                    }
                }
            }
            else if (lockFilePath.endsWith('yarn.lock')) {
                // Parse yarn.lock format
                const lockContent = await fs.readFile(lockFilePath, 'utf-8');
                const yarnDeps = this.parseYarnLock(lockContent);
                dependencies.push(...yarnDeps);
            }
        }
        catch (error) {
            // Non-fatal error, continue without transitive dependencies
            console.warn(`Failed to parse lock file ${lockFilePath}: ${error.message}`);
        }
        return dependencies;
    }
    parseYarnLock(content) {
        const dependencies = [];
        const lines = content.split('\n');
        let currentPackage = null;
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.match(/^[^#\s]/)) {
                // New package definition
                const match = trimmed.match(/^(.+?)@(.+?):/);
                if (match) {
                    if (currentPackage && currentPackage.name && currentPackage.version) {
                        dependencies.push(currentPackage);
                    }
                    currentPackage = {
                        name: match[1].replace(/"/g, ''),
                        type: 'transitive',
                        scope: 'production',
                        ecosystem: 'npm',
                        packageFile: '',
                        licenses: [],
                        dependsOn: [],
                        dependedOnBy: []
                    };
                }
            }
            else if (currentPackage && trimmed.startsWith('version ')) {
                currentPackage.version = trimmed.replace('version ', '').replace(/"/g, '');
            }
        }
        if (currentPackage && currentPackage.name && currentPackage.version) {
            dependencies.push(currentPackage);
        }
        return dependencies;
    }
    async parsePythonPackages(filePath, lockFile) {
        const dependencies = [];
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            if (filePath.endsWith('requirements.txt')) {
                const lines = content.split('\n');
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed && !trimmed.startsWith('#')) {
                        const match = trimmed.match(/^([^>=<!\s]+)([>=<!\s].*)?$/);
                        if (match) {
                            dependencies.push({
                                name: match[1],
                                version: match[2] ? match[2].trim() : '*',
                                type: 'direct',
                                scope: 'production',
                                ecosystem: 'python',
                                packageFile: filePath,
                                licenses: [],
                                dependsOn: [],
                                dependedOnBy: []
                            });
                        }
                    }
                }
            }
            else if (filePath.endsWith('pyproject.toml')) {
                // Parse TOML format for pyproject.toml
                const tomlDeps = this.parsePyprojectToml(content);
                dependencies.push(...tomlDeps);
            }
        }
        catch (error) {
            throw new Error(`Failed to parse Python package file ${filePath}: ${error.message}`);
        }
        return dependencies;
    }
    parsePyprojectToml(content) {
        const dependencies = [];
        const lines = content.split('\n');
        let inDependencies = false;
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed === '[tool.poetry.dependencies]' || trimmed === '[project.dependencies]') {
                inDependencies = true;
                continue;
            }
            else if (trimmed.startsWith('[') && inDependencies) {
                inDependencies = false;
                continue;
            }
            if (inDependencies && trimmed.includes('=')) {
                const match = trimmed.match(/^([^=\s]+)\s*=\s*"([^"]+)"/);
                if (match) {
                    dependencies.push({
                        name: match[1],
                        version: match[2],
                        type: 'direct',
                        scope: 'production',
                        ecosystem: 'python',
                        packageFile: '',
                        licenses: [],
                        dependsOn: [],
                        dependedOnBy: []
                    });
                }
            }
        }
        return dependencies;
    }
    async parseJavaPackages(filePath, lockFile) {
        const dependencies = [];
        try {
            if (filePath.endsWith('pom.xml')) {
                const content = await fs.readFile(filePath, 'utf-8');
                const pomDeps = this.parsePomXml(content);
                dependencies.push(...pomDeps);
            }
            else if (filePath.includes('build.gradle')) {
                const content = await fs.readFile(filePath, 'utf-8');
                const gradleDeps = this.parseBuildGradle(content);
                dependencies.push(...gradleDeps);
            }
        }
        catch (error) {
            throw new Error(`Failed to parse Java package file ${filePath}: ${error.message}`);
        }
        return dependencies;
    }
    parsePomXml(content) {
        const dependencies = [];
        const dependencyMatches = content.match(/<dependency>[\s\S]*?<\/dependency>/g) || [];
        for (const dep of dependencyMatches) {
            const groupId = dep.match(/<groupId>(.*?)<\/groupId>/)?.[1];
            const artifactId = dep.match(/<artifactId>(.*?)<\/artifactId>/)?.[1];
            const version = dep.match(/<version>(.*?)<\/version>/)?.[1];
            const scope = dep.match(/<scope>(.*?)<\/scope>/)?.[1] || 'compile';
            if (groupId && artifactId) {
                dependencies.push({
                    name: `${groupId}:${artifactId}`,
                    version: version || '*',
                    type: 'direct',
                    scope: scope === 'test' ? 'development' : 'production',
                    ecosystem: 'java',
                    packageFile: '',
                    licenses: [],
                    dependsOn: [],
                    dependedOnBy: []
                });
            }
        }
        return dependencies;
    }
    parseBuildGradle(content) {
        const dependencies = [];
        const lines = content.split('\n');
        let inDependencies = false;
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed === 'dependencies {') {
                inDependencies = true;
                continue;
            }
            else if (trimmed === '}' && inDependencies) {
                inDependencies = false;
                continue;
            }
            if (inDependencies) {
                const match = trimmed.match(/^(implementation|api|testImplementation|compileOnly)\s+['"]([^'"]+)['"]$/);
                if (match) {
                    const scope = match[1];
                    const coords = match[2];
                    const [group, artifact, version] = coords.split(':');
                    if (group && artifact) {
                        dependencies.push({
                            name: `${group}:${artifact}`,
                            version: version || '*',
                            type: 'direct',
                            scope: scope.includes('test') ? 'development' : 'production',
                            ecosystem: 'java',
                            packageFile: '',
                            licenses: [],
                            dependsOn: [],
                            dependedOnBy: []
                        });
                    }
                }
            }
        }
        return dependencies;
    }
    async parseDotNetPackages(filePath, lockFile) {
        const dependencies = [];
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            if (filePath.endsWith('.csproj') || filePath.endsWith('.fsproj') || filePath.endsWith('.vbproj')) {
                const packageRefs = content.match(/<PackageReference[^>]*>/g) || [];
                for (const ref of packageRefs) {
                    const include = ref.match(/Include="([^"]+)"/)?.[1];
                    const version = ref.match(/Version="([^"]+)"/)?.[1];
                    if (include) {
                        dependencies.push({
                            name: include,
                            version: version || '*',
                            type: 'direct',
                            scope: 'production',
                            ecosystem: 'dotnet',
                            packageFile: filePath,
                            licenses: [],
                            dependsOn: [],
                            dependedOnBy: []
                        });
                    }
                }
            }
        }
        catch (error) {
            throw new Error(`Failed to parse .NET package file ${filePath}: ${error.message}`);
        }
        return dependencies;
    }
    async parseRubyPackages(filePath, lockFile) {
        const dependencies = [];
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            if (filePath.endsWith('Gemfile')) {
                const lines = content.split('\n');
                for (const line of lines) {
                    const trimmed = line.trim();
                    const match = trimmed.match(/^gem\s+['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/);
                    if (match) {
                        dependencies.push({
                            name: match[1],
                            version: match[2] || '*',
                            type: 'direct',
                            scope: 'production',
                            ecosystem: 'ruby',
                            packageFile: filePath,
                            licenses: [],
                            dependsOn: [],
                            dependedOnBy: []
                        });
                    }
                }
            }
        }
        catch (error) {
            throw new Error(`Failed to parse Ruby package file ${filePath}: ${error.message}`);
        }
        return dependencies;
    }
    async parseGoPackages(filePath, lockFile) {
        const dependencies = [];
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n');
            let inRequire = false;
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed === 'require (') {
                    inRequire = true;
                    continue;
                }
                else if (trimmed === ')' && inRequire) {
                    inRequire = false;
                    continue;
                }
                if (inRequire || trimmed.startsWith('require ')) {
                    const match = trimmed.match(/^(?:require\s+)?([^\s]+)\s+([^\s]+)/);
                    if (match) {
                        dependencies.push({
                            name: match[1],
                            version: match[2],
                            type: 'direct',
                            scope: 'production',
                            ecosystem: 'go',
                            packageFile: filePath,
                            licenses: [],
                            dependsOn: [],
                            dependedOnBy: []
                        });
                    }
                }
            }
        }
        catch (error) {
            throw new Error(`Failed to parse Go package file ${filePath}: ${error.message}`);
        }
        return dependencies;
    }
    async parseRustPackages(filePath, lockFile) {
        const dependencies = [];
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n');
            let inDependencies = false;
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed === '[dependencies]') {
                    inDependencies = true;
                    continue;
                }
                else if (trimmed.startsWith('[') && inDependencies) {
                    inDependencies = false;
                    continue;
                }
                if (inDependencies && trimmed.includes('=')) {
                    const match = trimmed.match(/^([^=\s]+)\s*=\s*"([^"]+)"/);
                    if (match) {
                        dependencies.push({
                            name: match[1],
                            version: match[2],
                            type: 'direct',
                            scope: 'production',
                            ecosystem: 'rust',
                            packageFile: filePath,
                            licenses: [],
                            dependsOn: [],
                            dependedOnBy: []
                        });
                    }
                }
            }
        }
        catch (error) {
            throw new Error(`Failed to parse Rust package file ${filePath}: ${error.message}`);
        }
        return dependencies;
    }
    async enrichNpmDependencies(dependencies) {
        for (const dep of dependencies.filter(d => d.ecosystem === 'npm')) {
            try {
                // Fetch package metadata from npm registry
                const metadata = await this.fetchNpmMetadata(dep.name);
                if (metadata) {
                    dep.description = metadata.description;
                    dep.homepage = metadata.homepage;
                    dep.repository = metadata.repository?.url;
                    dep.licenses = metadata.license ? [metadata.license] : [];
                    dep.maintainers = metadata.maintainers?.map((m) => m.name) || [];
                }
            }
            catch (error) {
                // Non-fatal error, continue without metadata
                continue;
            }
        }
    }
    async fetchNpmMetadata(packageName) {
        try {
            const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`);
            if (response.ok) {
                return await response.json();
            }
        }
        catch (error) {
            // Ignore network errors
        }
        return null;
    }
    async buildInventory(tenantId, projectName, projectPath, packageFiles, scanId, scanDuration) {
        const allDependencies = packageFiles.flatMap(pf => pf.dependencies);
        const directDeps = allDependencies.filter(d => d.type === 'direct');
        const ecosystems = [...new Set(packageFiles.map(pf => pf.ecosystem))];
        return {
            id: this.generateInventoryId(),
            tenantId,
            projectName,
            projectPath,
            packageFiles,
            totalDependencies: allDependencies.length,
            directDependencies: directDeps.length,
            transitiveDependencies: allDependencies.length - directDeps.length,
            ecosystems,
            lastScan: new Date(),
            scanDuration,
            scanId
        };
    }
    async calculateFileChecksum(filePath) {
        try {
            const content = await fs.readFile(filePath);
            const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
            return crypto.createHash('sha256').update(content).digest('hex');
        }
        catch (error) {
            return 'unknown';
        }
    }
    generateScanId() {
        return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateInventoryId() {
        return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // Public API methods
    getInventory(inventoryId) {
        return this.inventories.get(inventoryId);
    }
    getInventoriesByTenant(tenantId) {
        return Array.from(this.inventories.values())
            .filter(inv => inv.tenantId === tenantId);
    }
    async updateInventory(inventoryId, options = {}) {
        const existing = this.inventories.get(inventoryId);
        if (!existing) {
            throw new Error(`Inventory not found: ${inventoryId}`);
        }
        return await this.scanProject(existing.projectPath, existing.tenantId, existing.projectName, options);
    }
    deleteInventory(inventoryId) {
        return this.inventories.delete(inventoryId);
    }
    getDependenciesByEcosystem(inventoryId, ecosystem) {
        const inventory = this.inventories.get(inventoryId);
        if (!inventory)
            return [];
        return inventory.packageFiles
            .filter(pf => pf.ecosystem === ecosystem)
            .flatMap(pf => pf.dependencies);
    }
    searchDependencies(inventoryId, query) {
        const inventory = this.inventories.get(inventoryId);
        if (!inventory)
            return [];
        const allDeps = inventory.packageFiles.flatMap(pf => pf.dependencies);
        return allDeps.filter(dep => {
            if (query.name && !dep.name.toLowerCase().includes(query.name.toLowerCase()))
                return false;
            if (query.version && dep.version !== query.version)
                return false;
            if (query.ecosystem && dep.ecosystem !== query.ecosystem)
                return false;
            if (query.type && dep.type !== query.type)
                return false;
            if (query.scope && dep.scope !== query.scope)
                return false;
            return true;
        });
    }
    getInventoryMetrics(inventoryId) {
        const inventory = this.inventories.get(inventoryId);
        if (!inventory)
            return null;
        const allDeps = inventory.packageFiles.flatMap(pf => pf.dependencies);
        const ecosystemCounts = inventory.ecosystems.reduce((acc, eco) => {
            acc[eco] = allDeps.filter(d => d.ecosystem === eco).length;
            return acc;
        }, {});
        const scopeCounts = {
            production: allDeps.filter(d => d.scope === 'production').length,
            development: allDeps.filter(d => d.scope === 'development').length,
            optional: allDeps.filter(d => d.scope === 'optional').length,
            peer: allDeps.filter(d => d.scope === 'peer').length
        };
        return {
            inventoryId,
            totalDependencies: inventory.totalDependencies,
            directDependencies: inventory.directDependencies,
            transitiveDependencies: inventory.transitiveDependencies,
            ecosystems: ecosystemCounts,
            scopes: scopeCounts,
            lastScan: inventory.lastScan,
            scanDuration: inventory.scanDuration
        };
    }
}
exports.DependencyInventoryService = DependencyInventoryService;
