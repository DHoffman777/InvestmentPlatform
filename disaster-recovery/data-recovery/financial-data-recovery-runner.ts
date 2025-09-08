#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs/promises';
import { FinancialDataRecoveryManager, DataRecoveryConfig } from './FinancialDataRecoveryManager';

interface CLIOptions {
  config?: string;
  output?: string;
  target?: string;
  dataTypes?: string;
  scenario?: string;
  validation?: string;
  verbose?: boolean;
  help?: boolean;
}

class FinancialDataRecoveryRunner {
  private options: CLIOptions;
  private recoveryManager: FinancialDataRecoveryManager | null = null;

  constructor(options: CLIOptions) {
    this.options = options;
  }

  public async run(): Promise<void> {
    try {
      if (this.options.help) {
        this.showHelp();
        return;
      }

      console.log('💾 Investment Platform Financial Data Recovery System');
      console.log('===================================================\n');

      const config = await this.loadConfiguration();
      this.recoveryManager = new FinancialDataRecoveryManager(config);
      
      this.setupEventListeners();
      
      const command = process.argv[2];
      
      switch (command) {
        case 'point-in-time':
          await this.executePointInTimeRecovery();
          break;
        case 'full-recovery':
          await this.executeFullRecovery();
          break;
        case 'validate-backup':
          await this.validateBackup();
          break;
        case 'test-procedures':
          await this.testRecoveryProcedures();
          break;
        case 'generate-report':
          await this.generateRecoveryReport();
          break;
        case 'status':
          await this.showStatus();
          break;
        default:
          console.error(`❌ Unknown command: ${command}`);
          this.showHelp();
          process.exit(1);
      }

      console.log('\n✅ Financial data recovery operation completed successfully');
      process.exit(0);

    } catch (error) {
      console.error(`❌ Financial data recovery operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (this.options.verbose && error instanceof Error) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  private async loadConfiguration(): Promise<DataRecoveryConfig> {
    const configPath = this.options.config || this.findConfigFile();
    
    if (!configPath) {
      throw new Error('No configuration file found. Use --config to specify path or create financial-recovery-config.json');
    }

    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent) as DataRecoveryConfig;
      
      this.validateConfiguration(config);
      
      if (this.options.verbose) {
        console.log(`📁 Loaded configuration from: ${configPath}`);
        console.log(`🏢 Organization: ${config.organizationId}`);
        console.log(`⏱️  RTO: ${config.recoveryObjectives.rtoMinutes}min, RPO: ${config.recoveryObjectives.rpoMinutes}min`);
        console.log(`📊 Data types configured: ${Object.keys(config.dataTypes).length}`);
        console.log(`🔄 Recovery procedures: ${config.recoveryProcedures.length}\n`);
      }
      
      return config;
    } catch (error) {
      throw new Error(`Failed to load configuration from ${configPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private findConfigFile(): string | null {
    const possiblePaths = [
      'financial-recovery-config.json',
      './config/financial-recovery-config.json',
      './disaster-recovery/config/financial-recovery-config.json',
      path.join(process.env.HOME || '', '.financial-recovery-config.json')
    ];

    for (const configPath of possiblePaths) {
      try {
        if (require('fs').existsSync(configPath)) {
          return configPath;
        }
      } catch (error) {
        continue;
      }
    }

    return null;
  }

  private validateConfiguration(config: DataRecoveryConfig): void {
    if (!config.recoveryId || !config.organizationId) {
      throw new Error('Configuration must include recoveryId and organizationId');
    }

    if (!config.recoveryObjectives.rtoMinutes || !config.recoveryObjectives.rpoMinutes) {
      throw new Error('Configuration must include RTO and RPO objectives');
    }

    if (!Object.keys(config.dataTypes).length) {
      throw new Error('Configuration must include at least one data type');
    }
  }

  private setupEventListeners(): void {
    if (!this.recoveryManager) return;

    this.recoveryManager.on('recoveryStarted', (event) => {
      console.log(`🚀 Starting ${event.type} recovery...`);
      if (event.targetDateTime) {
        console.log(`📅 Target date/time: ${event.targetDateTime}`);
      }
      if (event.dataTypes) {
        console.log(`📊 Data types: ${event.dataTypes.join(', ')}`);
      }
      if (event.scenario) {
        console.log(`📋 Scenario: ${event.scenario}`);
      }
    });

    this.recoveryManager.on('recoveryCompleted', (result) => {
      console.log(`\n✅ Recovery completed successfully!`);
      console.log(`⏱️  RTO achieved: ${result.rtoAchieved.toFixed(2)} minutes (target: ${this.recoveryManager?.getRecoveryStatus().config.recoveryObjectives.rtoMinutes}min)`);
      console.log(`💾 RPO achieved: ${result.rpoAchieved.toFixed(2)} minutes (target: ${this.recoveryManager?.getRecoveryStatus().config.recoveryObjectives.rpoMinutes}min)`);
      console.log(`🎯 Data integrity score: ${result.dataIntegrityScore.toFixed(1)}%`);
      console.log(`📋 Compliance status: ${result.complianceStatus.compliant ? '✅ Compliant' : '❌ Non-compliant'}`);
      
      if (result.issues.length > 0) {
        console.log(`\n⚠️  Issues encountered: ${result.issues.length}`);
        result.issues.forEach((issue: any, index: number) => {
          console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
        });
      }

      if (result.validationResults.length > 0) {
        const passedValidations = result.validationResults.filter((v: any) => v.passed).length;
        console.log(`\n🧪 Validations: ${passedValidations}/${result.validationResults.length} passed`);
      }
    });

    this.recoveryManager.on('recoveryFailed', (event) => {
      console.error(`❌ Recovery failed: ${event.error}`);
      console.error(`🕒 Failed at: ${event.timestamp}`);
    });

    this.recoveryManager.on('backupValidationStarted', (event) => {
      console.log(`🔍 Starting backup validation for: ${event.backupId}`);
    });

    this.recoveryManager.on('backupValidationCompleted', (event) => {
      if (event.valid) {
        console.log(`✅ Backup validation passed for: ${event.backupId}`);
        console.log(`🧪 Checks performed: ${event.checksPerformed}`);
      } else {
        console.log(`❌ Backup validation failed for: ${event.backupId}`);
        console.log(`⚠️  Issues found: ${event.issuesFound}`);
      }
    });

    this.recoveryManager.on('recoveryTestingStarted', (event) => {
      console.log(`🧪 Starting recovery procedure testing...`);
      console.log(`📋 Total procedures to test: ${event.totalProcedures}`);
    });

    this.recoveryManager.on('recoveryTestingCompleted', (event) => {
      console.log(`\n✅ Recovery testing completed!`);
      console.log(`📊 Results: ${event.successfulTests} passed, ${event.failedTests} failed`);
      console.log(`📈 Success rate: ${((event.successfulTests / event.totalProcedures) * 100).toFixed(1)}%`);
    });
  }

  private async executePointInTimeRecovery(): Promise<void> {
    if (!this.recoveryManager) throw new Error('Recovery manager not initialized');

    if (!this.options.target) {
      throw new Error('Target date/time required for point-in-time recovery. Use --target "YYYY-MM-DD HH:MM:SS"');
    }

    const targetDateTime = new Date(this.options.target);
    if (isNaN(targetDateTime.getTime())) {
      throw new Error('Invalid target date/time format. Use --target "YYYY-MM-DD HH:MM:SS"');
    }

    const dataTypes = this.options.dataTypes 
      ? this.options.dataTypes.split(',').map(t => t.trim())
      : ['transactionData', 'positionData', 'clientData'];

    const validationRequired = this.options.validation !== 'skip';

    console.log(`💾 Executing point-in-time recovery to: ${targetDateTime.toISOString()}`);
    
    const result = await this.recoveryManager.executePointInTimeRecovery(
      targetDateTime,
      dataTypes,
      validationRequired
    );

    if (this.options.output) {
      const reportPath = await this.recoveryManager.generateRecoveryReport(result);
      console.log(`📄 Recovery report saved to: ${reportPath}`);
    }
  }

  private async executeFullRecovery(): Promise<void> {
    if (!this.recoveryManager) throw new Error('Recovery manager not initialized');

    const scenario = this.options.scenario || 'system-failure';
    const validationLevel = (this.options.validation as 'basic' | 'comprehensive') || 'comprehensive';

    console.log(`🔄 Executing full data recovery for scenario: ${scenario}`);
    
    const result = await this.recoveryManager.executeFullDataRecovery(scenario, validationLevel);

    if (this.options.output) {
      const reportPath = await this.recoveryManager.generateRecoveryReport(result);
      console.log(`📄 Recovery report saved to: ${reportPath}`);
    }
  }

  private async validateBackup(): Promise<void> {
    if (!this.recoveryManager) throw new Error('Recovery manager not initialized');

    const backupId = this.options.target || `backup-${new Date().toISOString().split('T')[0]}`;

    console.log(`🔍 Validating backup integrity: ${backupId}`);
    
    const result = await this.recoveryManager.validateBackupIntegrity(backupId);

    console.log(`\nBackup Validation Results:`);
    console.log(`========================`);
    console.log(`Status: ${result.valid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`Checks performed: ${result.checks.length}`);
    
    if (result.issues.length > 0) {
      console.log(`\n🔧 Issues found (${result.issues.length}):`);
      result.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }

    if (this.options.output) {
      await fs.writeFile(this.options.output, JSON.stringify({
        backupId,
        valid: result.valid,
        checks: result.checks,
        issues: result.issues,
        timestamp: new Date().toISOString()
      }, null, 2));
      console.log(`📄 Validation results saved to: ${this.options.output}`);
    }
  }

  private async testRecoveryProcedures(): Promise<void> {
    if (!this.recoveryManager) throw new Error('Recovery manager not initialized');

    console.log(`🧪 Testing all recovery procedures...`);
    
    const results = await this.recoveryManager.testRecoveryProcedures();

    console.log(`\nRecovery Procedure Test Results:`);
    console.log(`==============================`);
    console.log(`Total procedures: ${results.totalProcedures}`);
    console.log(`Successful tests: ${results.successfulTests}`);
    console.log(`Failed tests: ${results.failedTests}`);
    console.log(`Success rate: ${((results.successfulTests / results.totalProcedures) * 100).toFixed(1)}%`);

    if (results.failedTests > 0) {
      console.log(`\n❌ Failed procedures:`);
      results.results.filter(r => !r.success).forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.procedureId}: ${result.error || 'Unknown error'}`);
      });
    }

    if (this.options.output) {
      await fs.writeFile(this.options.output, JSON.stringify(results, null, 2));
      console.log(`📄 Test results saved to: ${this.options.output}`);
    }
  }

  private async generateRecoveryReport(): Promise<void> {
    console.log(`📄 Recovery report generation requires a completed recovery operation.`);
    console.log(`Please run a recovery operation first, then use --output to save the report.`);
  }

  private async showStatus(): Promise<void> {
    if (!this.recoveryManager) throw new Error('Recovery manager not initialized');

    const status = this.recoveryManager.getRecoveryStatus();

    console.log(`Financial Data Recovery System Status`);
    console.log(`====================================`);
    console.log(`Recovery ID: ${status.recoveryId}`);
    console.log(`Organization: ${status.config.organizationId}`);
    console.log(`Recovery in progress: ${status.inProgress ? '🔄 Yes' : '✅ No'}`);
    console.log(`\nRecovery Objectives:`);
    console.log(`  RTO: ${status.config.recoveryObjectives.rtoMinutes} minutes`);
    console.log(`  RPO: ${status.config.recoveryObjectives.rpoMinutes} minutes`);
    console.log(`\nConfigured Data Types:`);
    Object.entries(status.config.dataTypes).forEach(([key, config]) => {
      console.log(`  ${key}: ${config.priority} priority, ${config.retentionPeriod} retention`);
    });
    console.log(`\nRecovery Procedures: ${status.config.recoveryProcedures.length}`);
    console.log(`Backup Sources: ${status.config.backupSources.length}`);
    console.log(`Compliance Regulations: ${status.config.compliance.regulations.length}`);
  }

  private showHelp(): void {
    console.log(`
Investment Platform Financial Data Recovery System

USAGE:
  financial-data-recovery-runner [COMMAND] [OPTIONS]

COMMANDS:
  point-in-time           Restore data to specific point in time
  full-recovery           Execute full data recovery procedure
  validate-backup         Validate backup integrity
  test-procedures         Test all recovery procedures
  generate-report         Generate recovery report (requires completed operation)
  status                  Show system status and configuration

OPTIONS:
  --config <path>         Path to configuration file
  --output <path>         Output file path for reports/results
  --target <datetime>     Target date/time for point-in-time recovery (YYYY-MM-DD HH:MM:SS)
                         or backup ID for validation
  --data-types <types>    Comma-separated list of data types to recover
  --scenario <name>       Recovery scenario name for full recovery
  --validation <level>    Validation level: basic, comprehensive, or skip
  --verbose               Enable verbose output
  --help                  Show this help message

EXAMPLES:
  # Point-in-time recovery to specific date/time
  financial-data-recovery-runner point-in-time --target "2024-01-15 14:30:00" --data-types "transactionData,positionData"

  # Full recovery for system failure scenario
  financial-data-recovery-runner full-recovery --scenario "system-failure" --validation comprehensive

  # Validate specific backup
  financial-data-recovery-runner validate-backup --target "backup-2024-01-15" --output validation-report.json

  # Test all recovery procedures
  financial-data-recovery-runner test-procedures --output test-results.json

  # Show system status
  financial-data-recovery-runner status --verbose

DATA TYPES:
  - transactionData       Trade transactions and settlements  
  - positionData         Portfolio positions and holdings
  - clientData           Client information and relationships
  - marketData           Historical market data and prices
  - documentData         Financial documents and statements
  - auditLogs            System audit logs and compliance data

RECOVERY SCENARIOS:
  - system-failure       Complete system failure recovery
  - data-corruption      Data corruption recovery
  - human-error          Accidental data deletion/modification
  - cyber-attack         Security incident recovery
  - hardware-failure     Hardware infrastructure failure

CONFIGURATION:
  The recovery configuration file should be a JSON file containing:
  - Recovery objectives (RTO/RPO)
  - Data type configurations with retention policies
  - Backup source definitions
  - Recovery procedures
  - Validation and compliance settings

For more information, see the Financial Data Recovery documentation.
`);
  }
}

// Parse command line arguments
const program = new Command();

program
  .option('--config <path>', 'Configuration file path')
  .option('--output <path>', 'Output file path')
  .option('--target <datetime>', 'Target date/time or backup ID')
  .option('--data-types <types>', 'Comma-separated data types')
  .option('--scenario <name>', 'Recovery scenario name')
  .option('--validation <level>', 'Validation level')
  .option('--verbose', 'Verbose output')
  .option('--help', 'Show help');

program.parse();

const options = program.opts() as CLIOptions;

// Run the financial data recovery system
const runner = new FinancialDataRecoveryRunner(options);
runner.run().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});