import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
const glob = require('glob') as any;
import { execSync } from 'child_process';

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

export class DependencyInventoryService extends EventEmitter {
  private inventories: Map<string, DependencyInventory> = new Map();
  private scanResults: Map<string, any> = new Map();
  
  private packagePatterns: PackageFilePattern[] = [
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

  async scanProject(
    projectPath: string,
    tenantId: string,
    projectName: string,
    options: ScanOptions = {}
  ): Promise<DependencyInventory> {
    const startTime = Date.now();
    const scanId = this.generateScanId();
    
    try {
      this.emit('scanStarted', { projectPath, tenantId, scanId });
      
      const packageFiles = await this.discoverPackageFiles(projectPath, options);
      const parsedFiles: PackageFile[] = [];
      
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
        } catch (error: any) {
          this.emit('packageFileError', { 
            filePath: packageFile.filePath, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
          continue;
        }
      }
      
      const inventory = await this.buildInventory(
        tenantId,
        projectName,
        projectPath,
        parsedFiles,
        scanId,
        Date.now() - startTime
      );
      
      this.inventories.set(inventory.id, inventory);
      
      this.emit('scanCompleted', { 
        inventoryId: inventory.id, 
        totalDependencies: inventory.totalDependencies,
        scanDuration: inventory.scanDuration
      });
      
      return inventory;
    } catch (error: any) {
      this.emit('scanFailed', { projectPath, tenantId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  private async discoverPackageFiles(
    projectPath: string,
    options: ScanOptions
  ): Promise<{ filePath: string; ecosystem: string; lockFile?: string }[]> {
    const discovered: { filePath: string; ecosystem: string; lockFile?: string }[] = [];
    
    for (const pattern of this.packagePatterns) {
      if (options.ecosystems && !options.ecosystems.includes(pattern.ecosystem)) {
        continue;
      }
      
      for (const filePattern of pattern.files) {
        const globPattern = path.join(projectPath, '**', filePattern);
        const files = await glob(globPattern, {
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

  private async findLockFile(
    packageFilePath: string,
    lockFilePatterns: string[]
  ): Promise<string | undefined> {
    const packageDir = path.dirname(packageFilePath);
    
    for (const lockPattern of lockFilePatterns) {
      const lockPath = path.join(packageDir, lockPattern);
      try {
        await fs.access(lockPath);
        return lockPath;
      } catch {
        continue;
      }
    }
    
    return undefined;
  }

  private async parsePackageFile(
    packageFile: { filePath: string; ecosystem: string; lockFile?: string },
    options: ScanOptions
  ): Promise<Dependency[]> {
    const pattern = this.packagePatterns.find(p => p.ecosystem === packageFile.ecosystem);
    if (!pattern) {
      throw new Error(`Unsupported ecosystem: ${packageFile.ecosystem}`);
    }
    
    return await pattern.parser(packageFile.filePath, packageFile.lockFile);
  }

  private async parseNpmPackages(filePath: string, lockFile?: string): Promise<Dependency[]> {
    const dependencies: Dependency[] = [];
    
    try {
      const packageJson = JSON.parse(await fs.readFile(filePath, 'utf-8'));
      const packageDir = path.dirname(filePath);
      
      // Parse direct dependencies
      const depTypes = [
        { deps: packageJson.dependencies || {}, scope: 'production' as const },
        { deps: packageJson.devDependencies || {}, scope: 'development' as const },
        { deps: packageJson.optionalDependencies || {}, scope: 'optional' as const },
        { deps: packageJson.peerDependencies || {}, scope: 'peer' as const }
      ];
      
      for (const { deps, scope } of depTypes) {
        for (const [name, version] of Object.entries(deps)) {
          dependencies.push({
            name,
            version: version as string,
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
      
    } catch (error: any) {
      throw new Error(`Failed to parse npm package file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return dependencies;
  }

  private async parseNpmLockFile(lockFilePath: string): Promise<Dependency[]> {
    const dependencies: Dependency[] = [];
    
    try {
      if (lockFilePath.endsWith('package-lock.json')) {
        const lockData = JSON.parse(await fs.readFile(lockFilePath, 'utf-8'));
        
        if (lockData.packages) {
          // npm v7+ format
          for (const [packagePath, packageInfo] of Object.entries(lockData.packages)) {
            if (packagePath === '' || packagePath.startsWith('node_modules/')) continue;
            
            const name = packagePath.replace('node_modules/', '');
            dependencies.push({
              name,
              version: (packageInfo as any).version || '',
              type: 'transitive',
              scope: 'production',
              ecosystem: 'npm',
              packageFile: lockFilePath,
              licenses: (packageInfo as any).license ? [(packageInfo as any).license] : [],
              dependsOn: [],
              dependedOnBy: []
            });
          }
        }
      } else if (lockFilePath.endsWith('yarn.lock')) {
        // Parse yarn.lock format
        const lockContent = await fs.readFile(lockFilePath, 'utf-8');
        const yarnDeps = this.parseYarnLock(lockContent);
        dependencies.push(...yarnDeps);
      }
    } catch (error: any) {
      // Non-fatal error, continue without transitive dependencies
      console.warn(`Failed to parse lock file ${lockFilePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return dependencies;
  }

  private parseYarnLock(content: string): Dependency[] {
    const dependencies: Dependency[] = [];
    const lines = content.split('\n');
    let currentPackage: Partial<Dependency> | null = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.match(/^[^#\s]/)) {
        // New package definition
        const match = trimmed.match(/^(.+?)@(.+?):/);
        if (match) {
          if (currentPackage && currentPackage.name && currentPackage.version) {
            dependencies.push(currentPackage as Dependency);
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
      } else if (currentPackage && trimmed.startsWith('version ')) {
        currentPackage.version = trimmed.replace('version ', '').replace(/"/g, '');
      }
    }
    
    if (currentPackage && currentPackage.name && currentPackage.version) {
      dependencies.push(currentPackage as Dependency);
    }
    
    return dependencies;
  }

  private async parsePythonPackages(filePath: string, lockFile?: string): Promise<Dependency[]> {
    const dependencies: Dependency[] = [];
    
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
      } else if (filePath.endsWith('pyproject.toml')) {
        // Parse TOML format for pyproject.toml
        const tomlDeps = this.parsePyprojectToml(content);
        dependencies.push(...tomlDeps);
      }
      
    } catch (error: any) {
      throw new Error(`Failed to parse Python package file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return dependencies;
  }

  private parsePyprojectToml(content: string): Dependency[] {
    const dependencies: Dependency[] = [];
    const lines = content.split('\n');
    let inDependencies = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed === '[tool.poetry.dependencies]' || trimmed === '[project.dependencies]') {
        inDependencies = true;
        continue;
      } else if (trimmed.startsWith('[') && inDependencies) {
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

  private async parseJavaPackages(filePath: string, lockFile?: string): Promise<Dependency[]> {
    const dependencies: Dependency[] = [];
    
    try {
      if (filePath.endsWith('pom.xml')) {
        const content = await fs.readFile(filePath, 'utf-8');
        const pomDeps = this.parsePomXml(content);
        dependencies.push(...pomDeps);
      } else if (filePath.includes('build.gradle')) {
        const content = await fs.readFile(filePath, 'utf-8');
        const gradleDeps = this.parseBuildGradle(content);
        dependencies.push(...gradleDeps);
      }
    } catch (error: any) {
      throw new Error(`Failed to parse Java package file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return dependencies;
  }

  private parsePomXml(content: string): Dependency[] {
    const dependencies: Dependency[] = [];
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

  private parseBuildGradle(content: string): Dependency[] {
    const dependencies: Dependency[] = [];
    const lines = content.split('\n');
    let inDependencies = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed === 'dependencies {') {
        inDependencies = true;
        continue;
      } else if (trimmed === '}' && inDependencies) {
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

  private async parseDotNetPackages(filePath: string, lockFile?: string): Promise<Dependency[]> {
    const dependencies: Dependency[] = [];
    
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
    } catch (error: any) {
      throw new Error(`Failed to parse .NET package file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return dependencies;
  }

  private async parseRubyPackages(filePath: string, lockFile?: string): Promise<Dependency[]> {
    const dependencies: Dependency[] = [];
    
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
    } catch (error: any) {
      throw new Error(`Failed to parse Ruby package file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return dependencies;
  }

  private async parseGoPackages(filePath: string, lockFile?: string): Promise<Dependency[]> {
    const dependencies: Dependency[] = [];
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      let inRequire = false;
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed === 'require (') {
          inRequire = true;
          continue;
        } else if (trimmed === ')' && inRequire) {
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
    } catch (error: any) {
      throw new Error(`Failed to parse Go package file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return dependencies;
  }

  private async parseRustPackages(filePath: string, lockFile?: string): Promise<Dependency[]> {
    const dependencies: Dependency[] = [];
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      let inDependencies = false;
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed === '[dependencies]') {
          inDependencies = true;
          continue;
        } else if (trimmed.startsWith('[') && inDependencies) {
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
    } catch (error: any) {
      throw new Error(`Failed to parse Rust package file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return dependencies;
  }

  private async enrichNpmDependencies(dependencies: Dependency[]): Promise<any> {
    for (const dep of dependencies.filter(d => d.ecosystem === 'npm')) {
      try {
        // Fetch package metadata from npm registry
        const metadata = await this.fetchNpmMetadata(dep.name);
        if (metadata) {
          dep.description = metadata.description;
          dep.homepage = metadata.homepage;
          dep.repository = metadata.repository?.url;
          dep.licenses = metadata.license ? [metadata.license] : [];
          dep.maintainers = metadata.maintainers?.map((m: any) => m.name) || [];
        }
      } catch (error: any) {
        // Non-fatal error, continue without metadata
        continue;
      }
    }
  }

  private async fetchNpmMetadata(packageName: string): Promise<any> {
    try {
      const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error: any) {
      // Ignore network errors
    }
    return null;
  }

  private async buildInventory(
    tenantId: string,
    projectName: string,
    projectPath: string,
    packageFiles: PackageFile[],
    scanId: string,
    scanDuration: number
  ): Promise<DependencyInventory> {
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

  private async calculateFileChecksum(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath);
      const crypto = await import('crypto');
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error: any) {
      return 'unknown';
    }
  }

  private generateScanId(): string {
    return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateInventoryId(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  getInventory(inventoryId: string): DependencyInventory | undefined {
    return this.inventories.get(inventoryId);
  }

  getInventoriesByTenant(tenantId: string): DependencyInventory[] {
    return Array.from(this.inventories.values())
      .filter(inv => inv.tenantId === tenantId);
  }

  async updateInventory(inventoryId: string, options: ScanOptions = {}): Promise<DependencyInventory> {
    const existing = this.inventories.get(inventoryId);
    if (!existing) {
      throw new Error(`Inventory not found: ${inventoryId}`);
    }
    
    return await this.scanProject(
      existing.projectPath,
      existing.tenantId,
      existing.projectName,
      options
    );
  }

  deleteInventory(inventoryId: string): boolean {
    return this.inventories.delete(inventoryId);
  }

  getDependenciesByEcosystem(inventoryId: string, ecosystem: string): Dependency[] {
    const inventory = this.inventories.get(inventoryId);
    if (!inventory) return [];
    
    return inventory.packageFiles
      .filter(pf => pf.ecosystem === ecosystem)
      .flatMap(pf => pf.dependencies);
  }

  searchDependencies(
    inventoryId: string,
    query: {
      name?: string;
      version?: string;
      ecosystem?: string;
      type?: 'direct' | 'transitive';
      scope?: string;
    }
  ): Dependency[] {
    const inventory = this.inventories.get(inventoryId);
    if (!inventory) return [];
    
    const allDeps = inventory.packageFiles.flatMap(pf => pf.dependencies);
    
    return allDeps.filter(dep => {
      if (query.name && !dep.name.toLowerCase().includes(query.name.toLowerCase())) return false;
      if (query.version && dep.version !== query.version) return false;
      if (query.ecosystem && dep.ecosystem !== query.ecosystem) return false;
      if (query.type && dep.type !== query.type) return false;
      if (query.scope && dep.scope !== query.scope) return false;
      return true;
    });
  }

  getInventoryMetrics(inventoryId: string): any {
    const inventory = this.inventories.get(inventoryId);
    if (!inventory) return null;
    
    const allDeps = inventory.packageFiles.flatMap(pf => pf.dependencies);
    const ecosystemCounts = inventory.ecosystems.reduce((acc, eco) => {
      acc[eco] = allDeps.filter(d => d.ecosystem === eco).length;
      return acc;
    }, {} as Record<string, number>);
    
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

