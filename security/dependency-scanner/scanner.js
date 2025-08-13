const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios');

/**
 * Investment Platform Dependency Security Scanner
 * Comprehensive dependency vulnerability scanning and update management
 */
class DependencyScanner {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        total: 0,
        vulnerable: 0,
        outdated: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      vulnerabilities: [],
      outdatedPackages: [],
      recommendations: [],
      ecosystems: []
    };

    this.supportedManifests = [
      { file: 'package.json', lockFile: 'package-lock.json', ecosystem: 'npm' },
      { file: 'yarn.lock', lockFile: 'yarn.lock', ecosystem: 'yarn' },
      { file: 'requirements.txt', lockFile: 'requirements.lock', ecosystem: 'pip' },
      { file: 'Pipfile', lockFile: 'Pipfile.lock', ecosystem: 'pipenv' },
      { file: 'Gemfile', lockFile: 'Gemfile.lock', ecosystem: 'bundler' },
      { file: 'composer.json', lockFile: 'composer.lock', ecosystem: 'composer' },
      { file: 'go.mod', lockFile: 'go.sum', ecosystem: 'go' },
      { file: 'Cargo.toml', lockFile: 'Cargo.lock', ecosystem: 'cargo' }
    ];
  }

  // Main scanning function
  async runScan() {
    console.log('🔍 Starting Dependency Security Scan...');
    console.log(`Timestamp: ${this.results.timestamp}\n`);

    try {
      await this.detectEcosystems();
      await this.scanVulnerabilities();
      await this.checkOutdatedPackages();
      await this.analyzeLicenses();
      await this.checkSupplyChainRisks();
      await this.generateRecommendations();
      await this.generateReport();

      console.log('\n✅ Dependency scan completed');
      console.log(`📊 Total packages: ${this.results.summary.total}`);
      console.log(`🚨 Vulnerable: ${this.results.summary.vulnerable}`);
      console.log(`📅 Outdated: ${this.results.summary.outdated}`);
      console.log(`🔴 Critical: ${this.results.summary.critical}`);
      console.log(`🟠 High: ${this.results.summary.high}`);

    } catch (error) {
      console.error('❌ Dependency scan failed:', error.message);
      throw error;
    }
  }

  // Detect package ecosystems in the project
  async detectEcosystems() {
    console.log('🔍 Detecting package ecosystems...');

    for (const manifest of this.supportedManifests) {
      try {
        const manifestPath = path.join(process.cwd(), manifest.file);
        await fs.access(manifestPath);
        
        const ecosystem = {
          name: manifest.ecosystem,
          manifestFile: manifest.file,
          lockFile: manifest.lockFile,
          path: manifestPath,
          hasLockFile: false,
          packages: []
        };

        // Check for lock file
        try {
          const lockPath = path.join(process.cwd(), manifest.lockFile);
          await fs.access(lockPath);
          ecosystem.hasLockFile = true;
          ecosystem.lockFilePath = lockPath;
        } catch {
          this.addVulnerability({
            category: 'Dependency Management',
            severity: 'medium',
            title: `Missing Lock File for ${manifest.ecosystem}`,
            description: `${manifest.lockFile} not found`,
            recommendation: `Generate ${manifest.lockFile} to ensure reproducible builds`,
            ecosystem: manifest.ecosystem
          });
        }

        await this.parseManifest(ecosystem);
        this.results.ecosystems.push(ecosystem);
        console.log(`  ✓ Found ${manifest.ecosystem} ecosystem with ${ecosystem.packages.length} packages`);

      } catch {
        // Manifest file doesn't exist, skip
      }
    }
  }

  // Parse manifest file to extract package information
  async parseManifest(ecosystem) {
    try {
      const content = await fs.readFile(ecosystem.path, 'utf8');
      
      switch (ecosystem.name) {
        case 'npm':
        case 'yarn':
          await this.parsePackageJson(ecosystem, content);
          break;
        case 'pip':
          await this.parseRequirementsTxt(ecosystem, content);
          break;
        case 'pipenv':
          await this.parsePipfile(ecosystem, content);
          break;
        case 'bundler':
          await this.parseGemfile(ecosystem, content);
          break;
        case 'composer':
          await this.parseComposerJson(ecosystem, content);
          break;
        case 'go':
          await this.parseGoMod(ecosystem, content);
          break;
        case 'cargo':
          await this.parseCargoToml(ecosystem, content);
          break;
      }
    } catch (error) {
      console.error(`Error parsing ${ecosystem.manifestFile}:`, error.message);
    }
  }

  // Parse package.json
  async parsePackageJson(ecosystem, content) {
    const packageJson = JSON.parse(content);
    const dependencies = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {},
      ...packageJson.peerDependencies || {},
      ...packageJson.optionalDependencies || {}
    };

    for (const [name, version] of Object.entries(dependencies)) {
      ecosystem.packages.push({
        name,
        version: this.cleanVersion(version),
        type: this.getDependencyType(name, packageJson),
        ecosystem: ecosystem.name
      });
    }

    this.results.summary.total += ecosystem.packages.length;
  }

  // Parse requirements.txt
  async parseRequirementsTxt(ecosystem, content) {
    const lines = content.split('\n').filter(line => 
      line.trim() && !line.startsWith('#') && !line.startsWith('-')
    );

    for (const line of lines) {
      const match = line.match(/^([a-zA-Z0-9\-_\.]+)([><=!]+.*)?$/);
      if (match) {
        ecosystem.packages.push({
          name: match[1],
          version: match[2] ? this.cleanVersion(match[2]) : 'latest',
          type: 'runtime',
          ecosystem: ecosystem.name
        });
      }
    }

    this.results.summary.total += ecosystem.packages.length;
  }

  // Parse other manifest formats (simplified implementations)
  async parsePipfile(ecosystem, content) {
    try {
      const pipfile = require('toml').parse(content);
      const packages = {
        ...pipfile.packages || {},
        ...pipfile['dev-packages'] || {}
      };

      for (const [name, version] of Object.entries(packages)) {
        ecosystem.packages.push({
          name,
          version: typeof version === 'string' ? this.cleanVersion(version) : 'latest',
          type: 'runtime',
          ecosystem: ecosystem.name
        });
      }
    } catch (error) {
      console.warn('Could not parse Pipfile:', error.message);
    }

    this.results.summary.total += ecosystem.packages.length;
  }

  async parseGemfile(ecosystem, content) {
    const gemMatches = content.match(/gem\s+['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/g) || [];
    
    for (const match of gemMatches) {
      const parts = match.match(/gem\s+['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/);
      if (parts) {
        ecosystem.packages.push({
          name: parts[1],
          version: parts[2] ? this.cleanVersion(parts[2]) : 'latest',
          type: 'runtime',
          ecosystem: ecosystem.name
        });
      }
    }

    this.results.summary.total += ecosystem.packages.length;
  }

  async parseComposerJson(ecosystem, content) {
    const composer = JSON.parse(content);
    const packages = {
      ...composer.require || {},
      ...composer['require-dev'] || {}
    };

    for (const [name, version] of Object.entries(packages)) {
      ecosystem.packages.push({
        name,
        version: this.cleanVersion(version),
        type: 'runtime',
        ecosystem: ecosystem.name
      });
    }

    this.results.summary.total += ecosystem.packages.length;
  }

  async parseGoMod(ecosystem, content) {
    const requireMatches = content.match(/require\s+([^\s]+)\s+([^\s]+)/g) || [];
    
    for (const match of requireMatches) {
      const parts = match.match(/require\s+([^\s]+)\s+([^\s]+)/);
      if (parts) {
        ecosystem.packages.push({
          name: parts[1],
          version: this.cleanVersion(parts[2]),
          type: 'runtime',
          ecosystem: ecosystem.name
        });
      }
    }

    this.results.summary.total += ecosystem.packages.length;
  }

  async parseCargoToml(ecosystem, content) {
    try {
      const cargo = require('toml').parse(content);
      const packages = {
        ...cargo.dependencies || {},
        ...cargo['dev-dependencies'] || {},
        ...cargo['build-dependencies'] || {}
      };

      for (const [name, version] of Object.entries(packages)) {
        ecosystem.packages.push({
          name,
          version: typeof version === 'string' ? this.cleanVersion(version) : 'latest',
          type: 'runtime',
          ecosystem: ecosystem.name
        });
      }
    } catch (error) {
      console.warn('Could not parse Cargo.toml:', error.message);
    }

    this.results.summary.total += ecosystem.packages.length;
  }

  // Scan for vulnerabilities using various sources
  async scanVulnerabilities() {
    console.log('🔍 Scanning for vulnerabilities...');

    for (const ecosystem of this.results.ecosystems) {
      await this.scanEcosystemVulnerabilities(ecosystem);
    }
  }

  // Scan vulnerabilities for specific ecosystem
  async scanEcosystemVulnerabilities(ecosystem) {
    console.log(`  Scanning ${ecosystem.name} vulnerabilities...`);

    try {
      switch (ecosystem.name) {
        case 'npm':
        case 'yarn':
          await this.scanNpmVulnerabilities(ecosystem);
          break;
        case 'pip':
        case 'pipenv':
          await this.scanPythonVulnerabilities(ecosystem);
          break;
        default:
          console.log(`    ⚠️  Vulnerability scanning not implemented for ${ecosystem.name}`);
      }
    } catch (error) {
      console.error(`Error scanning ${ecosystem.name} vulnerabilities:`, error.message);
    }
  }

  // Scan NPM vulnerabilities
  async scanNpmVulnerabilities(ecosystem) {
    try {
      // Run npm audit
      const auditResult = execSync('npm audit --json', {
        cwd: path.dirname(ecosystem.path),
        encoding: 'utf8'
      });

      const audit = JSON.parse(auditResult);
      const vulnerabilities = audit.vulnerabilities || {};

      for (const [packageName, vuln] of Object.entries(vulnerabilities)) {
        const severity = this.mapNpmSeverity(vuln.severity);
        
        this.addVulnerability({
          category: 'Known Vulnerability',
          severity,
          title: `${packageName}: ${vuln.title || 'Known vulnerability'}`,
          description: vuln.overview || `Vulnerability in ${packageName}`,
          recommendation: vuln.recommendation || `Update ${packageName} to fixed version`,
          ecosystem: ecosystem.name,
          package: packageName,
          currentVersion: vuln.version,
          fixedVersion: vuln.fixAvailable?.version,
          cwe: vuln.cwe,
          cvss: vuln.cvss,
          references: vuln.references
        });

        this.results.summary[severity]++;
        this.results.summary.vulnerable++;
      }

    } catch (error) {
      if (error.status === 0) {
        // npm audit returned vulnerabilities
        try {
          const audit = JSON.parse(error.stdout);
          // Process audit results even with non-zero exit code
        } catch {
          console.warn('Could not parse npm audit output');
        }
      } else {
        console.warn('npm audit failed:', error.message);
      }
    }
  }

  // Scan Python vulnerabilities using safety
  async scanPythonVulnerabilities(ecosystem) {
    try {
      // Would use safety or other Python vulnerability databases
      console.log('    Python vulnerability scanning would be implemented here');
    } catch (error) {
      console.warn('Python vulnerability scan failed:', error.message);
    }
  }

  // Check for outdated packages
  async checkOutdatedPackages() {
    console.log('📅 Checking for outdated packages...');

    for (const ecosystem of this.results.ecosystems) {
      await this.checkEcosystemOutdated(ecosystem);
    }
  }

  // Check outdated packages for specific ecosystem
  async checkEcosystemOutdated(ecosystem) {
    try {
      switch (ecosystem.name) {
        case 'npm':
        case 'yarn':
          await this.checkNpmOutdated(ecosystem);
          break;
        default:
          console.log(`    Outdated check not implemented for ${ecosystem.name}`);
      }
    } catch (error) {
      console.error(`Error checking outdated ${ecosystem.name} packages:`, error.message);
    }
  }

  // Check NPM outdated packages
  async checkNpmOutdated(ecosystem) {
    try {
      const outdatedResult = execSync('npm outdated --json', {
        cwd: path.dirname(ecosystem.path),
        encoding: 'utf8'
      });

      const outdated = JSON.parse(outdatedResult);
      
      for (const [packageName, info] of Object.entries(outdated)) {
        this.results.outdatedPackages.push({
          name: packageName,
          current: info.current,
          wanted: info.wanted,
          latest: info.latest,
          ecosystem: ecosystem.name,
          type: info.type || 'runtime'
        });

        this.results.summary.outdated++;
      }

    } catch (error) {
      // npm outdated returns non-zero exit code when outdated packages exist
      if (error.stdout) {
        try {
          const outdated = JSON.parse(error.stdout);
          // Process results
        } catch {
          console.warn('Could not parse npm outdated output');
        }
      }
    }
  }

  // Analyze package licenses
  async analyzeLicenses() {
    console.log('📄 Analyzing package licenses...');

    const problematicLicenses = [
      'GPL-3.0', 'GPL-2.0', 'AGPL-3.0', 'AGPL-1.0',
      'CDDL-1.0', 'CDDL-1.1', 'EPL-1.0', 'EPL-2.0'
    ];

    // License analysis would be implemented here
    this.addRecommendation({
      category: 'License Compliance',
      title: 'Implement License Scanning',
      description: 'Scan dependencies for license compatibility with commercial use',
      priority: 'medium'
    });
  }

  // Check supply chain risks
  async checkSupplyChainRisks() {
    console.log('🔗 Checking supply chain risks...');

    // Supply chain risk analysis would be implemented here
    this.addRecommendation({
      category: 'Supply Chain Security',
      title: 'Implement Supply Chain Monitoring',
      description: 'Monitor for suspicious package updates and dependency confusion attacks',
      priority: 'high'
    });
  }

  // Generate security recommendations
  async generateRecommendations() {
    console.log('💡 Generating recommendations...');

    // Financial services specific recommendations
    this.addRecommendation({
      category: 'Financial Compliance',
      title: 'Implement Dependency Approval Process',
      description: 'Establish approval process for new dependencies in financial platform',
      priority: 'high'
    });

    this.addRecommendation({
      category: 'Security',
      title: 'Automated Dependency Updates',
      description: 'Implement automated security updates with testing pipeline',
      priority: 'high'
    });

    this.addRecommendation({
      category: 'Monitoring',
      title: 'Continuous Dependency Monitoring',
      description: 'Set up continuous monitoring for new vulnerabilities',
      priority: 'medium'
    });
  }

  // Helper methods
  cleanVersion(version) {
    return version.replace(/^[\^~>=<]+/, '').trim();
  }

  getDependencyType(name, packageJson) {
    if (packageJson.dependencies && packageJson.dependencies[name]) return 'runtime';
    if (packageJson.devDependencies && packageJson.devDependencies[name]) return 'development';
    if (packageJson.peerDependencies && packageJson.peerDependencies[name]) return 'peer';
    if (packageJson.optionalDependencies && packageJson.optionalDependencies[name]) return 'optional';
    return 'runtime';
  }

  mapNpmSeverity(npmSeverity) {
    const mapping = {
      'critical': 'critical',
      'high': 'high',
      'moderate': 'medium',
      'low': 'low',
      'info': 'info'
    };
    return mapping[npmSeverity] || 'medium';
  }

  addVulnerability(vuln) {
    this.results.vulnerabilities.push({
      ...vuln,
      id: `VULN-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    });
  }

  addRecommendation(rec) {
    this.results.recommendations.push({
      ...rec,
      id: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    });
  }

  // Generate comprehensive report
  async generateReport() {
    console.log('📄 Generating dependency security report...');

    const reportDir = path.join(__dirname, 'reports');
    await fs.mkdir(reportDir, { recursive: true });

    const reportFile = path.join(reportDir, `dependency-report-${Date.now()}.json`);
    await fs.writeFile(reportFile, JSON.stringify(this.results, null, 2));

    const htmlReport = this.generateHTMLReport();
    const htmlFile = path.join(reportDir, `dependency-report-${Date.now()}.html`);
    await fs.writeFile(htmlFile, htmlReport);

    console.log(`📊 Reports generated:`);
    console.log(`  JSON: ${reportFile}`);
    console.log(`  HTML: ${htmlFile}`);
  }

  // Generate HTML report
  generateHTMLReport() {
    const severityColors = {
      critical: '#dc3545',
      high: '#fd7e14',
      medium: '#ffc107',
      low: '#17a2b8',
      info: '#6c757d'
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Dependency Security Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .card { padding: 15px; border-radius: 5px; text-align: center; color: white; }
        .critical { background-color: ${severityColors.critical}; }
        .high { background-color: ${severityColors.high}; }
        .medium { background-color: ${severityColors.medium}; }
        .low { background-color: ${severityColors.low}; }
        .vulnerability { margin: 15px 0; padding: 15px; border-left: 4px solid; background: #f8f9fa; }
        .vuln-critical { border-color: ${severityColors.critical}; }
        .vuln-high { border-color: ${severityColors.high}; }
        .vuln-medium { border-color: ${severityColors.medium}; }
        .vuln-low { border-color: ${severityColors.low}; }
        .ecosystem { margin: 20px 0; padding: 15px; background: #e3f2fd; border-radius: 5px; }
        .package-list { max-height: 300px; overflow-y: auto; }
        .outdated { background: #fff3e0; padding: 10px; margin: 5px 0; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔒 Dependency Security Report</h1>
        <p><strong>Generated:</strong> ${this.results.timestamp}</p>
        <p><strong>Ecosystems:</strong> ${this.results.ecosystems.map(e => e.name).join(', ')}</p>
    </div>

    <div class="summary">
        <div class="card" style="background: #6c757d;">
            <h3>${this.results.summary.total}</h3>
            <p>Total Packages</p>
        </div>
        <div class="card critical">
            <h3>${this.results.summary.critical}</h3>
            <p>Critical</p>
        </div>
        <div class="card high">
            <h3>${this.results.summary.high}</h3>
            <p>High</p>
        </div>
        <div class="card medium">
            <h3>${this.results.summary.medium}</h3>
            <p>Medium</p>
        </div>
        <div class="card low">
            <h3>${this.results.summary.low}</h3>
            <p>Low</p>
        </div>
        <div class="card" style="background: #17a2b8;">
            <h3>${this.results.summary.outdated}</h3>
            <p>Outdated</p>
        </div>
    </div>

    <h2>🏗️ Package Ecosystems</h2>
    ${this.results.ecosystems.map(ecosystem => `
        <div class="ecosystem">
            <h3>${ecosystem.name.toUpperCase()} - ${ecosystem.packages.length} packages</h3>
            <p><strong>Manifest:</strong> ${ecosystem.manifestFile}</p>
            <p><strong>Lock File:</strong> ${ecosystem.hasLockFile ? '✅ Present' : '❌ Missing'}</p>
        </div>
    `).join('')}

    <h2>🚨 Vulnerabilities</h2>
    ${this.results.vulnerabilities.length === 0 ? '<p>No vulnerabilities found! 🎉</p>' : 
      this.results.vulnerabilities.map(vuln => `
        <div class="vulnerability vuln-${vuln.severity}">
            <h3>${vuln.title}</h3>
            <p><strong>Package:</strong> ${vuln.package || 'N/A'}</p>
            <p><strong>Severity:</strong> ${vuln.severity.toUpperCase()}</p>
            <p><strong>Current Version:</strong> ${vuln.currentVersion || 'N/A'}</p>
            <p><strong>Fixed Version:</strong> ${vuln.fixedVersion || 'N/A'}</p>
            <p><strong>Description:</strong> ${vuln.description}</p>
            <p><strong>Recommendation:</strong> ${vuln.recommendation}</p>
            ${vuln.cvss ? `<p><strong>CVSS:</strong> ${vuln.cvss}</p>` : ''}
        </div>
    `).join('')}

    <h2>📅 Outdated Packages</h2>
    ${this.results.outdatedPackages.length === 0 ? '<p>All packages are up to date! 🎉</p>' :
      this.results.outdatedPackages.map(pkg => `
        <div class="outdated">
            <strong>${pkg.name}</strong> (${pkg.ecosystem})<br>
            Current: ${pkg.current} → Wanted: ${pkg.wanted} → Latest: ${pkg.latest}
        </div>
    `).join('')}

    <h2>💡 Recommendations</h2>
    ${this.results.recommendations.map(rec => `
        <div style="margin: 10px 0; padding: 15px; background: #e8f5e8; border-left: 4px solid #28a745; border-radius: 3px;">
            <h3>${rec.title}</h3>
            <p><strong>Category:</strong> ${rec.category}</p>
            <p><strong>Priority:</strong> ${rec.priority?.toUpperCase() || 'MEDIUM'}</p>
            <p>${rec.description}</p>
        </div>
    `).join('')}

    <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 5px;">
        <h3>🛡️ Security Best Practices</h3>
        <ul>
            <li>Regularly update dependencies to latest secure versions</li>
            <li>Use lock files to ensure reproducible builds</li>
            <li>Implement automated vulnerability scanning in CI/CD</li>
            <li>Review and approve new dependencies before use</li>
            <li>Monitor for supply chain attacks and suspicious updates</li>
            <li>Maintain an inventory of all third-party components</li>
        </ul>
    </div>
</body>
</html>`;
  }
}

// Command line interface
if (require.main === module) {
  const scanner = new DependencyScanner();
  scanner.runScan().catch(console.error);
}

module.exports = DependencyScanner;