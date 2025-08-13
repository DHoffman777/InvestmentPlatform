const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

/**
 * OWASP Top 10 Compliance Checker for Investment Platform
 * Comprehensive assessment against OWASP Top 10 2021 security risks
 */
class OWASPComplianceChecker {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      owaspVersion: '2021',
      overallScore: 0,
      compliance: [],
      recommendations: [],
      summary: {
        compliant: 0,
        partiallyCompliant: 0,
        nonCompliant: 0
      }
    };

    // OWASP Top 10 2021 categories
    this.owaspTop10 = [
      {
        id: 'A01',
        name: 'Broken Access Control',
        description: 'Access control enforces policy such that users cannot act outside of their intended permissions',
        tests: [
          'Authentication bypass',
          'Privilege escalation',
          'IDOR vulnerabilities',
          'CORS misconfigurations',
          'Force browsing'
        ]
      },
      {
        id: 'A02',
        name: 'Cryptographic Failures',
        description: 'Failures related to cryptography which often leads to sensitive data exposure',
        tests: [
          'Weak encryption algorithms',
          'Hardcoded credentials',
          'Unencrypted data transmission',
          'Weak key management',
          'Certificate validation'
        ]
      },
      {
        id: 'A03',
        name: 'Injection',
        description: 'Application is vulnerable to injection attacks',
        tests: [
          'SQL injection',
          'NoSQL injection',
          'OS command injection',
          'LDAP injection',
          'Expression language injection'
        ]
      },
      {
        id: 'A04',
        name: 'Insecure Design',
        description: 'Risks related to design and architectural flaws',
        tests: [
          'Threat modeling',
          'Secure design patterns',
          'Security requirements',
          'Fail-safe defaults',
          'Defense in depth'
        ]
      },
      {
        id: 'A05',
        name: 'Security Misconfiguration',
        description: 'Security misconfiguration is commonly a result of insecure default configurations',
        tests: [
          'Default configurations',
          'Unnecessary features',
          'Error handling',
          'Security headers',
          'Outdated software'
        ]
      },
      {
        id: 'A06',
        name: 'Vulnerable and Outdated Components',
        description: 'Using components with known vulnerabilities',
        tests: [
          'Dependency scanning',
          'Version management',
          'Security patches',
          'Component inventory',
          'Supply chain security'
        ]
      },
      {
        id: 'A07',
        name: 'Identification and Authentication Failures',
        description: 'Confirmation of the user\'s identity, authentication, and session management',
        tests: [
          'Password policies',
          'Multi-factor authentication',
          'Session management',
          'Authentication bypass',
          'Credential stuffing protection'
        ]
      },
      {
        id: 'A08',
        name: 'Software and Data Integrity Failures',
        description: 'Software and data integrity failures relate to code and infrastructure',
        tests: [
          'CI/CD pipeline security',
          'Code signing',
          'Update mechanisms',
          'Deserialization vulnerabilities',
          'Supply chain attacks'
        ]
      },
      {
        id: 'A09',
        name: 'Security Logging and Monitoring Failures',
        description: 'Insufficient logging and monitoring, coupled with missing incident response',
        tests: [
          'Audit logging',
          'Log protection',
          'Monitoring and alerting',
          'Incident response',
          'Log analysis'
        ]
      },
      {
        id: 'A10',
        name: 'Server-Side Request Forgery (SSRF)',
        description: 'SSRF flaws occur whenever a web application is fetching a remote resource',
        tests: [
          'URL validation',
          'Network segmentation',
          'Allowlist validation',
          'Response validation',
          'Authentication for internal services'
        ]
      }
    ];
  }

  // Main compliance check function
  async runComplianceCheck() {
    console.log('🔍 Starting OWASP Top 10 2021 Compliance Assessment...');
    console.log(`Timestamp: ${this.results.timestamp}\n`);

    try {
      // Check each OWASP category
      for (const category of this.owaspTop10) {
        console.log(`📋 Assessing ${category.id}: ${category.name}...`);
        await this.assessCategory(category);
      }

      // Calculate overall score
      this.calculateOverallScore();

      // Generate report
      await this.generateComplianceReport();

      console.log('\n✅ OWASP compliance assessment completed');
      console.log(`📊 Overall Score: ${this.results.overallScore}%`);
      console.log(`✅ Compliant: ${this.results.summary.compliant}`);
      console.log(`⚠️ Partially Compliant: ${this.results.summary.partiallyCompliant}`);
      console.log(`❌ Non-Compliant: ${this.results.summary.nonCompliant}`);

    } catch (error) {
      console.error('❌ Compliance check failed:', error.message);
      throw error;
    }
  }

  // Assess individual OWASP category
  async assessCategory(category) {
    const assessment = {
      id: category.id,
      name: category.name,
      description: category.description,
      status: 'compliant', // Default to compliant, downgrade as needed
      score: 100,
      findings: [],
      recommendations: [],
      tests: []
    };

    // Perform category-specific assessments
    switch (category.id) {
      case 'A01':
        await this.assessBrokenAccessControl(assessment);
        break;
      case 'A02':
        await this.assessCryptographicFailures(assessment);
        break;
      case 'A03':
        await this.assessInjection(assessment);
        break;
      case 'A04':
        await this.assessInsecureDesign(assessment);
        break;
      case 'A05':
        await this.assessSecurityMisconfiguration(assessment);
        break;
      case 'A06':
        await this.assessVulnerableComponents(assessment);
        break;
      case 'A07':
        await this.assessAuthenticationFailures(assessment);
        break;
      case 'A08':
        await this.assessIntegrityFailures(assessment);
        break;
      case 'A09':
        await this.assessLoggingMonitoring(assessment);
        break;
      case 'A10':
        await this.assessSSRF(assessment);
        break;
    }

    // Determine final status based on findings
    if (assessment.findings.length === 0) {
      assessment.status = 'compliant';
      this.results.summary.compliant++;
    } else if (assessment.score >= 70) {
      assessment.status = 'partially-compliant';
      this.results.summary.partiallyCompliant++;
    } else {
      assessment.status = 'non-compliant';
      this.results.summary.nonCompliant++;
    }

    this.results.compliance.push(assessment);
  }

  // A01: Broken Access Control Assessment
  async assessBrokenAccessControl(assessment) {
    const checks = [
      {
        name: 'RBAC Implementation',
        check: async () => {
          // Check for proper RBAC implementation
          const hasRBAC = await this.checkFileExists('services/user/rbac-service.js');
          if (!hasRBAC) {
            assessment.findings.push({
              severity: 'high',
              issue: 'No RBAC service implementation found',
              recommendation: 'Implement comprehensive Role-Based Access Control'
            });
            assessment.score -= 25;
          }
          return hasRBAC;
        }
      },
      {
        name: 'Authorization Middleware',
        check: async () => {
          // Check for authorization middleware
          const hasAuthMiddleware = await this.checkFileExists('middleware/auth.js');
          if (!hasAuthMiddleware) {
            assessment.findings.push({
              severity: 'high',
              issue: 'No authorization middleware found',
              recommendation: 'Implement authorization middleware for API routes'
            });
            assessment.score -= 20;
          }
          return hasAuthMiddleware;
        }
      },
      {
        name: 'CORS Configuration',
        check: async () => {
          // Check for proper CORS configuration
          const corsConfig = await this.checkForPattern('cors', ['middleware/', 'config/']);
          if (!corsConfig) {
            assessment.findings.push({
              severity: 'medium',
              issue: 'CORS configuration not found or improperly configured',
              recommendation: 'Implement restrictive CORS policy'
            });
            assessment.score -= 15;
          }
          return corsConfig;
        }
      }
    ];

    for (const check of checks) {
      const result = await check.check();
      assessment.tests.push({
        name: check.name,
        passed: result
      });
    }

    if (assessment.findings.length > 0) {
      assessment.recommendations.push({
        priority: 'high',
        action: 'Implement comprehensive access control mechanisms',
        details: 'Deploy RBAC, authorization middleware, and proper CORS configuration'
      });
    }
  }

  // A02: Cryptographic Failures Assessment
  async assessCryptographicFailures(assessment) {
    const checks = [
      {
        name: 'HTTPS Enforcement',
        check: async () => {
          const httpsEnforced = await this.checkForPattern('helmet', ['app.js', 'server.js', 'middleware/']);
          if (!httpsEnforced) {
            assessment.findings.push({
              severity: 'critical',
              issue: 'HTTPS not enforced or helmet middleware missing',
              recommendation: 'Implement HTTPS enforcement and security headers'
            });
            assessment.score -= 30;
          }
          return httpsEnforced;
        }
      },
      {
        name: 'Data Encryption',
        check: async () => {
          const hasEncryption = await this.checkForPattern('encrypt', ['services/', 'utils/']);
          if (!hasEncryption) {
            assessment.findings.push({
              severity: 'high',
              issue: 'No data encryption implementation found',
              recommendation: 'Implement AES-256 encryption for sensitive data'
            });
            assessment.score -= 25;
          }
          return hasEncryption;
        }
      },
      {
        name: 'Key Management',
        check: async () => {
          const hasKeyMgmt = await this.checkForPattern('key', ['config/', 'services/']);
          if (!hasKeyMgmt) {
            assessment.findings.push({
              severity: 'high',
              issue: 'No key management system found',
              recommendation: 'Implement secure key management with rotation'
            });
            assessment.score -= 20;
          }
          return hasKeyMgmt;
        }
      }
    ];

    for (const check of checks) {
      const result = await check.check();
      assessment.tests.push({
        name: check.name,
        passed: result
      });
    }

    // Financial services specific recommendations
    assessment.recommendations.push({
      priority: 'critical',
      action: 'Implement financial-grade encryption',
      details: 'Use FIPS 140-2 Level 3 compliant encryption for all financial data'
    });
  }

  // A03: Injection Assessment
  async assessInjection(assessment) {
    const checks = [
      {
        name: 'SQL Injection Protection',
        check: async () => {
          const hasORM = await this.checkForPattern('prisma', ['package.json', 'schema.prisma']);
          if (!hasORM) {
            assessment.findings.push({
              severity: 'critical',
              issue: 'No ORM or prepared statements implementation found',
              recommendation: 'Use Prisma ORM or prepared statements for database queries'
            });
            assessment.score -= 35;
          }
          return hasORM;
        }
      },
      {
        name: 'Input Validation',
        check: async () => {
          const hasValidation = await this.checkForPattern('joi', ['middleware/', 'validators/']);
          if (!hasValidation) {
            assessment.findings.push({
              severity: 'high',
              issue: 'No input validation framework found',
              recommendation: 'Implement comprehensive input validation using Joi or similar'
            });
            assessment.score -= 25;
          }
          return hasValidation;
        }
      },
      {
        name: 'Output Encoding',
        check: async () => {
          const hasEncoding = await this.checkForPattern('sanitize', ['utils/', 'middleware/']);
          if (!hasEncoding) {
            assessment.findings.push({
              severity: 'medium',
              issue: 'No output encoding/sanitization found',
              recommendation: 'Implement output encoding to prevent XSS'
            });
            assessment.score -= 15;
          }
          return hasEncoding;
        }
      }
    ];

    for (const check of checks) {
      const result = await check.check();
      assessment.tests.push({
        name: check.name,
        passed: result
      });
    }
  }

  // A04: Insecure Design Assessment
  async assessInsecureDesign(assessment) {
    const checks = [
      {
        name: 'Threat Modeling',
        check: async () => {
          const hasThreatModel = await this.checkFileExists('docs/threat-model.md');
          if (!hasThreatModel) {
            assessment.findings.push({
              severity: 'medium',
              issue: 'No threat modeling documentation found',
              recommendation: 'Conduct threat modeling for financial platform components'
            });
            assessment.score -= 20;
          }
          return hasThreatModel;
        }
      },
      {
        name: 'Security Architecture',
        check: async () => {
          const hasSecArch = await this.checkFileExists('docs/security-architecture.md');
          if (!hasSecArch) {
            assessment.findings.push({
              severity: 'medium',
              issue: 'No security architecture documentation found',
              recommendation: 'Document security architecture and design patterns'
            });
            assessment.score -= 15;
          }
          return hasSecArch;
        }
      },
      {
        name: 'Fail-Safe Defaults',
        check: async () => {
          const hasDefaults = await this.checkForPattern('default', ['config/', 'middleware/']);
          if (!hasDefaults) {
            assessment.findings.push({
              severity: 'low',
              issue: 'Fail-safe defaults not clearly implemented',
              recommendation: 'Implement fail-safe defaults for all security controls'
            });
            assessment.score -= 10;
          }
          return hasDefaults;
        }
      }
    ];

    for (const check of checks) {
      const result = await check.check();
      assessment.tests.push({
        name: check.name,
        passed: result
      });
    }

    // Financial platform specific design recommendations
    assessment.recommendations.push({
      priority: 'high',
      action: 'Implement financial platform security patterns',
      details: 'Use defense-in-depth, zero-trust architecture, and financial-grade security controls'
    });
  }

  // A05: Security Misconfiguration Assessment
  async assessSecurityMisconfiguration(assessment) {
    const checks = [
      {
        name: 'Security Headers',
        check: async () => {
          const hasHelmet = await this.checkForPattern('helmet', ['app.js', 'server.js']);
          if (!hasHelmet) {
            assessment.findings.push({
              severity: 'high',
              issue: 'Security headers middleware not implemented',
              recommendation: 'Implement Helmet.js for security headers'
            });
            assessment.score -= 25;
          }
          return hasHelmet;
        }
      },
      {
        name: 'Environment Configuration',
        check: async () => {
          const hasEnvConfig = await this.checkFileExists('.env.example');
          if (!hasEnvConfig) {
            assessment.findings.push({
              severity: 'medium',
              issue: 'No environment configuration template found',
              recommendation: 'Create .env.example with secure defaults'
            });
            assessment.score -= 15;
          }
          return hasEnvConfig;
        }
      },
      {
        name: 'Error Handling',
        check: async () => {
          const hasErrorHandler = await this.checkForPattern('error', ['middleware/', 'handlers/']);
          if (!hasErrorHandler) {
            assessment.findings.push({
              severity: 'medium',
              issue: 'No centralized error handling found',
              recommendation: 'Implement secure error handling middleware'
            });
            assessment.score -= 15;
          }
          return hasErrorHandler;
        }
      }
    ];

    for (const check of checks) {
      const result = await check.check();
      assessment.tests.push({
        name: check.name,
        passed: result
      });
    }
  }

  // A06: Vulnerable and Outdated Components Assessment
  async assessVulnerableComponents(assessment) {
    try {
      // Run npm audit
      const auditResult = execSync('npm audit --json', { 
        cwd: process.cwd(),
        encoding: 'utf8'
      });
      
      const audit = JSON.parse(auditResult);
      const vulnerabilities = audit.vulnerabilities || {};
      const vulnCount = Object.keys(vulnerabilities).length;

      if (vulnCount > 0) {
        assessment.findings.push({
          severity: 'high',
          issue: `Found ${vulnCount} vulnerable dependencies`,
          recommendation: 'Update vulnerable dependencies and implement dependency scanning'
        });
        assessment.score -= Math.min(vulnCount * 5, 40);
      }

      assessment.tests.push({
        name: 'Dependency Vulnerability Scan',
        passed: vulnCount === 0,
        details: `Found ${vulnCount} vulnerabilities`
      });

    } catch (error) {
      assessment.findings.push({
        severity: 'medium',
        issue: 'Unable to run dependency vulnerability scan',
        recommendation: 'Implement automated dependency scanning in CI/CD pipeline'
      });
      assessment.score -= 20;
    }

    // Check for dependency management
    const hasLockFile = await this.checkFileExists('package-lock.json') || await this.checkFileExists('yarn.lock');
    if (!hasLockFile) {
      assessment.findings.push({
        severity: 'medium',
        issue: 'No package lock file found',
        recommendation: 'Use package-lock.json or yarn.lock for dependency management'
      });
      assessment.score -= 15;
    }

    assessment.tests.push({
      name: 'Package Lock File',
      passed: hasLockFile
    });
  }

  // A07: Identification and Authentication Failures Assessment
  async assessAuthenticationFailures(assessment) {
    const checks = [
      {
        name: 'JWT Implementation',
        check: async () => {
          const hasJWT = await this.checkForPattern('jwt', ['services/', 'middleware/']);
          if (!hasJWT) {
            assessment.findings.push({
              severity: 'critical',
              issue: 'No JWT authentication implementation found',
              recommendation: 'Implement secure JWT authentication with proper validation'
            });
            assessment.score -= 30;
          }
          return hasJWT;
        }
      },
      {
        name: 'Password Hashing',
        check: async () => {
          const hasBcrypt = await this.checkForPattern('bcrypt', ['package.json', 'services/']);
          if (!hasBcrypt) {
            assessment.findings.push({
              severity: 'critical',
              issue: 'No secure password hashing found',
              recommendation: 'Implement bcrypt for password hashing'
            });
            assessment.score -= 25;
          }
          return hasBcrypt;
        }
      },
      {
        name: 'Session Management',
        check: async () => {
          const hasSession = await this.checkForPattern('session', ['middleware/', 'config/']);
          if (!hasSession) {
            assessment.findings.push({
              severity: 'high',
              issue: 'No session management implementation found',
              recommendation: 'Implement secure session management'
            });
            assessment.score -= 20;
          }
          return hasSession;
        }
      }
    ];

    for (const check of checks) {
      const result = await check.check();
      assessment.tests.push({
        name: check.name,
        passed: result
      });
    }

    // Financial platform specific authentication requirements
    assessment.recommendations.push({
      priority: 'critical',
      action: 'Implement multi-factor authentication',
      details: 'MFA is required for all financial platform users, especially privileged accounts'
    });
  }

  // A08: Software and Data Integrity Failures Assessment
  async assessIntegrityFailures(assessment) {
    const checks = [
      {
        name: 'CI/CD Pipeline Security',
        check: async () => {
          const hasCICD = await this.checkFileExists('.github/workflows') || 
                         await this.checkFileExists('.gitlab-ci.yml') ||
                         await this.checkFileExists('Jenkinsfile');
          if (!hasCICD) {
            assessment.findings.push({
              severity: 'medium',
              issue: 'No CI/CD pipeline configuration found',
              recommendation: 'Implement secure CI/CD pipeline with security checks'
            });
            assessment.score -= 15;
          }
          return hasCICD;
        }
      },
      {
        name: 'Code Signing',
        check: async () => {
          const hasCodeSign = await this.checkForPattern('sign', ['scripts/', '.github/']);
          if (!hasCodeSign) {
            assessment.findings.push({
              severity: 'low',
              issue: 'No code signing implementation found',
              recommendation: 'Implement code signing for deployments'
            });
            assessment.score -= 10;
          }
          return hasCodeSign;
        }
      },
      {
        name: 'Integrity Checks',
        check: async () => {
          const hasIntegrity = await this.checkForPattern('integrity', ['package.json', 'scripts/']);
          if (!hasIntegrity) {
            assessment.findings.push({
              severity: 'medium',
              issue: 'No subresource integrity or package verification found',
              recommendation: 'Implement integrity checks for dependencies and assets'
            });
            assessment.score -= 15;
          }
          return hasIntegrity;
        }
      }
    ];

    for (const check of checks) {
      const result = await check.check();
      assessment.tests.push({
        name: check.name,
        passed: result
      });
    }
  }

  // A09: Security Logging and Monitoring Failures Assessment
  async assessLoggingMonitoring(assessment) {
    const checks = [
      {
        name: 'Audit Logging',
        check: async () => {
          const hasAuditLog = await this.checkForPattern('audit', ['services/', 'middleware/']);
          if (!hasAuditLog) {
            assessment.findings.push({
              severity: 'critical',
              issue: 'No audit logging implementation found',
              recommendation: 'Implement comprehensive audit logging for financial transactions'
            });
            assessment.score -= 30;
          }
          return hasAuditLog;
        }
      },
      {
        name: 'Security Monitoring',
        check: async () => {
          const hasMonitoring = await this.checkForPattern('monitor', ['services/', 'middleware/']);
          if (!hasMonitoring) {
            assessment.findings.push({
              severity: 'high',
              issue: 'No security monitoring implementation found',
              recommendation: 'Implement real-time security monitoring and alerting'
            });
            assessment.score -= 25;
          }
          return hasMonitoring;
        }
      },
      {
        name: 'Incident Response',
        check: async () => {
          const hasIncidentResponse = await this.checkFileExists('docs/incident-response.md');
          if (!hasIncidentResponse) {
            assessment.findings.push({
              severity: 'medium',
              issue: 'No incident response plan found',
              recommendation: 'Create and maintain incident response procedures'
            });
            assessment.score -= 15;
          }
          return hasIncidentResponse;
        }
      }
    ];

    for (const check of checks) {
      const result = await check.check();
      assessment.tests.push({
        name: check.name,
        passed: result
      });
    }

    // Financial platform specific logging requirements
    assessment.recommendations.push({
      priority: 'critical',
      action: 'Implement financial audit logging',
      details: 'Log all financial transactions, user access, and system changes with tamper-evident storage'
    });
  }

  // A10: Server-Side Request Forgery (SSRF) Assessment
  async assessSSRF(assessment) {
    const checks = [
      {
        name: 'URL Validation',
        check: async () => {
          const hasURLValidation = await this.checkForPattern('url', ['validators/', 'middleware/']);
          if (!hasURLValidation) {
            assessment.findings.push({
              severity: 'high',
              issue: 'No URL validation implementation found',
              recommendation: 'Implement strict URL validation for external requests'
            });
            assessment.score -= 25;
          }
          return hasURLValidation;
        }
      },
      {
        name: 'Network Restrictions',
        check: async () => {
          const hasNetworkRestrictions = await this.checkForPattern('whitelist', ['config/', 'middleware/']);
          if (!hasNetworkRestrictions) {
            assessment.findings.push({
              severity: 'medium',
              issue: 'No network restrictions or allowlists found',
              recommendation: 'Implement network-level restrictions for outbound requests'
            });
            assessment.score -= 15;
          }
          return hasNetworkRestrictions;
        }
      }
    ];

    for (const check of checks) {
      const result = await check.check();
      assessment.tests.push({
        name: check.name,
        passed: result
      });
    }
  }

  // Helper function to check if file exists
  async checkFileExists(filePath) {
    try {
      await fs.access(path.join(process.cwd(), filePath));
      return true;
    } catch {
      return false;
    }
  }

  // Helper function to check for patterns in files
  async checkForPattern(pattern, directories) {
    try {
      for (const dir of directories) {
        const fullPath = path.join(process.cwd(), dir);
        try {
          const files = await fs.readdir(fullPath, { recursive: true });
          for (const file of files) {
            const filePath = path.join(fullPath, file);
            const stats = await fs.stat(filePath);
            if (stats.isFile() && file.endsWith('.js') || file.endsWith('.json')) {
              const content = await fs.readFile(filePath, 'utf8');
              if (content.includes(pattern)) {
                return true;
              }
            }
          }
        } catch {
          continue;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  // Calculate overall compliance score
  calculateOverallScore() {
    const totalScore = this.results.compliance.reduce((sum, item) => sum + item.score, 0);
    this.results.overallScore = Math.round(totalScore / this.results.compliance.length);
  }

  // Generate compliance report
  async generateComplianceReport() {
    console.log('📄 Generating OWASP compliance report...');
    
    const reportDir = path.join(__dirname, 'reports');
    await fs.mkdir(reportDir, { recursive: true });
    
    const reportFile = path.join(reportDir, `owasp-compliance-${Date.now()}.json`);
    await fs.writeFile(reportFile, JSON.stringify(this.results, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    const htmlFile = path.join(reportDir, `owasp-compliance-${Date.now()}.html`);
    await fs.writeFile(htmlFile, htmlReport);
    
    console.log(`📊 Compliance reports generated:`);
    console.log(`  JSON: ${reportFile}`);
    console.log(`  HTML: ${htmlFile}`);
  }

  // Generate HTML compliance report
  generateHTMLReport() {
    const statusColors = {
      'compliant': '#28a745',
      'partially-compliant': '#ffc107',
      'non-compliant': '#dc3545'
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <title>OWASP Top 10 2021 Compliance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .score { font-size: 2em; font-weight: bold; color: ${this.results.overallScore >= 80 ? '#28a745' : this.results.overallScore >= 60 ? '#ffc107' : '#dc3545'}; }
        .summary { display: flex; gap: 20px; margin-bottom: 30px; }
        .card { flex: 1; padding: 15px; border-radius: 5px; text-align: center; color: white; }
        .compliant { background-color: #28a745; }
        .partial { background-color: #ffc107; }
        .non-compliant { background-color: #dc3545; }
        .category { margin: 20px 0; padding: 20px; border-radius: 5px; border-left: 5px solid; }
        .cat-compliant { border-color: #28a745; background: #d4edda; }
        .cat-partial { border-color: #ffc107; background: #fff3cd; }
        .cat-non-compliant { border-color: #dc3545; background: #f8d7da; }
        .finding { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 3px; }
        .test { margin: 5px 0; padding: 8px; border-radius: 3px; }
        .test-pass { background: #d4edda; }
        .test-fail { background: #f8d7da; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ OWASP Top 10 2021 Compliance Report</h1>
        <p><strong>Generated:</strong> ${this.results.timestamp}</p>
        <p><strong>OWASP Version:</strong> ${this.results.owaspVersion}</p>
        <div class="score">Overall Score: ${this.results.overallScore}%</div>
    </div>

    <div class="summary">
        <div class="card compliant">
            <h3>${this.results.summary.compliant}</h3>
            <p>Compliant</p>
        </div>
        <div class="card partial">
            <h3>${this.results.summary.partiallyCompliant}</h3>
            <p>Partially Compliant</p>
        </div>
        <div class="card non-compliant">
            <h3>${this.results.summary.nonCompliant}</h3>
            <p>Non-Compliant</p>
        </div>
    </div>

    <h2>📋 Detailed Assessment</h2>
    ${this.results.compliance.map(cat => `
        <div class="category cat-${cat.status}">
            <h3>${cat.id}: ${cat.name} (${cat.score}%)</h3>
            <p>${cat.description}</p>
            
            <h4>Test Results:</h4>
            ${cat.tests.map(test => `
                <div class="test ${test.passed ? 'test-pass' : 'test-fail'}">
                    ${test.passed ? '✅' : '❌'} ${test.name}
                    ${test.details ? `<br><small>${test.details}</small>` : ''}
                </div>
            `).join('')}
            
            ${cat.findings.length > 0 ? `
                <h4>Findings:</h4>
                ${cat.findings.map(finding => `
                    <div class="finding">
                        <strong>${finding.severity.toUpperCase()}:</strong> ${finding.issue}<br>
                        <strong>Recommendation:</strong> ${finding.recommendation}
                    </div>
                `).join('')}
            ` : ''}
            
            ${cat.recommendations.length > 0 ? `
                <h4>Recommendations:</h4>
                ${cat.recommendations.map(rec => `
                    <div class="finding">
                        <strong>${rec.priority?.toUpperCase() || 'MEDIUM'}:</strong> ${rec.action}<br>
                        <strong>Details:</strong> ${rec.details}
                    </div>
                `).join('')}
            ` : ''}
        </div>
    `).join('')}

    <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 5px;">
        <h3>🏦 Financial Services Compliance Notes</h3>
        <ul>
            <li><strong>SOC 2 Type II:</strong> Required for financial service providers</li>
            <li><strong>PCI DSS:</strong> Required if processing credit card payments</li>
            <li><strong>SEC Cybersecurity Rules:</strong> Investment advisers must comply with cybersecurity regulations</li>
            <li><strong>NIST Cybersecurity Framework:</strong> Recommended for financial institutions</li>
            <li><strong>ISO 27001:</strong> International standard for information security management</li>
        </ul>
    </div>
</body>
</html>`;
  }
}

// Command line interface
if (require.main === module) {
  const checker = new OWASPComplianceChecker();
  checker.runComplianceCheck().catch(console.error);
}

module.exports = OWASPComplianceChecker;