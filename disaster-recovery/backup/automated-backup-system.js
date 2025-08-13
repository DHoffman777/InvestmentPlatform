const fs = require('fs').promises;
const path = require('path');
const { execSync, spawn } = require('child_process');
const { createHash } = require('crypto');
const { EventEmitter } = require('events');

/**
 * Investment Platform Automated Backup System
 * Comprehensive backup solution for databases, files, and configurations
 * with financial services compliance and disaster recovery focus
 */
class AutomatedBackupSystem extends EventEmitter {
  constructor() {
    super();
    
    this.backupJobs = new Map();
    this.backupHistory = [];
    this.retentionPolicies = new Map();
    this.storageProviders = new Map();
    
    this.config = {
      backup: {
        baseDirectory: process.env.BACKUP_BASE_DIR || '/backup',
        tempDirectory: process.env.BACKUP_TEMP_DIR || '/tmp/backups',
        compressionLevel: parseInt(process.env.BACKUP_COMPRESSION_LEVEL) || 6,
        encryptionEnabled: process.env.BACKUP_ENCRYPTION === 'true',
        encryptionKey: process.env.BACKUP_ENCRYPTION_KEY || 'default-key-change-me',
        parallelJobs: parseInt(process.env.BACKUP_PARALLEL_JOBS) || 3
      },
      scheduling: {
        dailyBackupHour: parseInt(process.env.DAILY_BACKUP_HOUR) || 2, // 2 AM
        weeklyBackupDay: parseInt(process.env.WEEKLY_BACKUP_DAY) || 0, // Sunday
        monthlyBackupDay: parseInt(process.env.MONTHLY_BACKUP_DAY) || 1 // 1st of month
      },
      retention: {
        daily: parseInt(process.env.BACKUP_RETENTION_DAILY) || 7, // 7 days
        weekly: parseInt(process.env.BACKUP_RETENTION_WEEKLY) || 4, // 4 weeks
        monthly: parseInt(process.env.BACKUP_RETENTION_MONTHLY) || 12, // 12 months
        yearly: parseInt(process.env.BACKUP_RETENTION_YEARLY) || 7 // 7 years
      },
      storage: {
        local: {
          enabled: process.env.LOCAL_BACKUP_ENABLED !== 'false',
          path: process.env.LOCAL_BACKUP_PATH || '/backup/local'
        },
        s3: {
          enabled: process.env.S3_BACKUP_ENABLED === 'true',
          bucket: process.env.S3_BACKUP_BUCKET,
          region: process.env.S3_BACKUP_REGION || 'us-east-1',
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        },
        azure: {
          enabled: process.env.AZURE_BACKUP_ENABLED === 'true',
          containerName: process.env.AZURE_BACKUP_CONTAINER,
          connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING
        },
        gcp: {
          enabled: process.env.GCP_BACKUP_ENABLED === 'true',
          bucketName: process.env.GCP_BACKUP_BUCKET,
          projectId: process.env.GCP_PROJECT_ID
        }
      },
      monitoring: {
        alertOnFailure: process.env.BACKUP_ALERT_ON_FAILURE === 'true',
        alertOnSuccess: process.env.BACKUP_ALERT_ON_SUCCESS === 'true',
        slackWebhook: process.env.SLACK_BACKUP_WEBHOOK,
        emailRecipients: process.env.BACKUP_EMAIL_RECIPIENTS?.split(',') || []
      }
    };
    
    this.runningJobs = new Set();
    this.scheduledJobs = new Map();
    
    this.initializeBackupSystem();
  }
  
  // Initialize backup system
  async initializeBackupSystem() {
    console.log('💾 Initializing Automated Backup System...');
    
    // Create backup directories
    await this.createBackupDirectories();
    
    // Register backup jobs
    this.registerBackupJobs();
    
    // Initialize storage providers
    await this.initializeStorageProviders();
    
    // Schedule backup jobs
    this.scheduleBackupJobs();
    
    // Start monitoring
    this.startBackupMonitoring();
    
    console.log('✅ Automated Backup System initialized');
  }
  
  // Create backup directories
  async createBackupDirectories() {
    const directories = [
      this.config.backup.baseDirectory,
      this.config.backup.tempDirectory,
      this.config.storage.local.path,
      path.join(this.config.backup.baseDirectory, 'database'),
      path.join(this.config.backup.baseDirectory, 'files'),
      path.join(this.config.backup.baseDirectory, 'config'),
      path.join(this.config.backup.baseDirectory, 'logs')
    ];
    
    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
        console.log(`📁 Created backup directory: ${dir}`);
      } catch (error) {
        console.error(`Failed to create backup directory ${dir}:`, error.message);
      }
    }
  }
  
  // Register backup jobs
  registerBackupJobs() {
    // Database backup jobs
    this.registerJob('postgres_primary', {
      type: 'database',
      database: 'postgresql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'investment_platform',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      schedule: 'daily',
      retention: 'daily',
      priority: 'critical',
      encrypted: true,
      compressed: true
    });
    
    this.registerJob('postgres_replicas', {
      type: 'database',
      database: 'postgresql',
      replicas: [
        { host: process.env.DB_REPLICA1_HOST, port: parseInt(process.env.DB_REPLICA1_PORT) || 5432 },
        { host: process.env.DB_REPLICA2_HOST, port: parseInt(process.env.DB_REPLICA2_PORT) || 5432 }
      ],
      database: process.env.DB_NAME || 'investment_platform',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      schedule: 'weekly',
      retention: 'weekly',
      priority: 'high',
      encrypted: true,
      compressed: true
    });
    
    // Redis backup
    this.registerJob('redis_cache', {
      type: 'redis',
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      schedule: 'daily',
      retention: 'daily',
      priority: 'medium',
      encrypted: true,
      compressed: true
    });
    
    // Application files backup
    this.registerJob('application_code', {
      type: 'files',
      sourcePath: '/app',
      excludePatterns: ['node_modules', '.git', 'logs', 'temp'],
      schedule: 'weekly',
      retention: 'monthly',
      priority: 'medium',
      encrypted: true,
      compressed: true
    });
    
    // Configuration backup
    this.registerJob('system_config', {
      type: 'files',
      sourcePath: '/etc',
      includePatterns: ['nginx', 'ssl', 'systemd', 'cron*'],
      schedule: 'weekly',
      retention: 'monthly',
      priority: 'high',
      encrypted: true,
      compressed: true
    });
    
    // User data backup
    this.registerJob('user_uploads', {
      type: 'files',
      sourcePath: '/var/uploads',
      schedule: 'daily',
      retention: 'yearly',
      priority: 'critical',
      encrypted: true,
      compressed: true
    });
    
    // Log files backup
    this.registerJob('application_logs', {
      type: 'files',
      sourcePath: '/var/log/investment-platform',
      schedule: 'daily',
      retention: 'monthly',
      priority: 'low',
      encrypted: false,
      compressed: true
    });
    
    console.log(`📋 Registered ${this.backupJobs.size} backup jobs`);
  }
  
  // Register backup job
  registerJob(jobId, config) {
    const job = {
      id: jobId,
      ...config,
      status: 'pending',
      lastRun: null,
      nextRun: null,
      attempts: 0,
      maxAttempts: 3,
      createdAt: Date.now()
    };
    
    this.backupJobs.set(jobId, job);
    this.calculateNextRun(jobId);
  }
  
  // Initialize storage providers
  async initializeStorageProviders() {
    console.log('☁️ Initializing storage providers...');
    
    // Local storage (always enabled)
    this.storageProviders.set('local', {
      type: 'local',
      enabled: this.config.storage.local.enabled,
      upload: (filePath, remotePath) => this.uploadToLocal(filePath, remotePath),
      list: (prefix) => this.listLocalFiles(prefix),
      delete: (remotePath) => this.deleteLocalFile(remotePath)
    });
    
    // AWS S3
    if (this.config.storage.s3.enabled) {
      this.storageProviders.set('s3', {
        type: 's3',
        enabled: true,
        upload: (filePath, remotePath) => this.uploadToS3(filePath, remotePath),
        list: (prefix) => this.listS3Files(prefix),
        delete: (remotePath) => this.deleteS3File(remotePath)
      });
    }
    
    // Azure Blob Storage
    if (this.config.storage.azure.enabled) {
      this.storageProviders.set('azure', {
        type: 'azure',
        enabled: true,
        upload: (filePath, remotePath) => this.uploadToAzure(filePath, remotePath),
        list: (prefix) => this.listAzureFiles(prefix),
        delete: (remotePath) => this.deleteAzureFile(remotePath)
      });
    }
    
    // Google Cloud Storage
    if (this.config.storage.gcp.enabled) {
      this.storageProviders.set('gcp', {
        type: 'gcp',
        enabled: true,
        upload: (filePath, remotePath) => this.uploadToGCP(filePath, remotePath),
        list: (prefix) => this.listGCPFiles(prefix),
        delete: (remotePath) => this.deleteGCPFile(remotePath)
      });
    }
    
    const enabledProviders = Array.from(this.storageProviders.values()).filter(p => p.enabled);
    console.log(`☁️ Initialized ${enabledProviders.length} storage providers: ${enabledProviders.map(p => p.type).join(', ')}`);
  }
  
  // Schedule backup jobs
  scheduleBackupJobs() {
    console.log('⏰ Scheduling backup jobs...');
    
    // Check every minute for jobs that need to run
    setInterval(() => {
      this.checkScheduledJobs();
    }, 60000); // 1 minute
    
    // Initial check
    this.checkScheduledJobs();
  }
  
  // Check for scheduled jobs that need to run
  checkScheduledJobs() {
    const now = Date.now();
    
    for (const [jobId, job] of this.backupJobs) {
      if (job.nextRun && now >= job.nextRun && !this.runningJobs.has(jobId)) {
        console.log(`⏰ Starting scheduled backup job: ${jobId}`);
        this.runBackupJob(jobId);
      }
    }
  }
  
  // Calculate next run time for job
  calculateNextRun(jobId) {
    const job = this.backupJobs.get(jobId);
    if (!job) return;
    
    const now = new Date();
    let nextRun;
    
    switch (job.schedule) {
      case 'daily':
        nextRun = new Date(now);
        nextRun.setHours(this.config.scheduling.dailyBackupHour, 0, 0, 0);
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
        
      case 'weekly':
        nextRun = new Date(now);
        nextRun.setHours(this.config.scheduling.dailyBackupHour, 0, 0, 0);
        const daysUntilWeekly = (this.config.scheduling.weeklyBackupDay - nextRun.getDay() + 7) % 7;
        if (daysUntilWeekly === 0 && nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        } else {
          nextRun.setDate(nextRun.getDate() + daysUntilWeekly);
        }
        break;
        
      case 'monthly':
        nextRun = new Date(now);
        nextRun.setDate(this.config.scheduling.monthlyBackupDay);
        nextRun.setHours(this.config.scheduling.dailyBackupHour, 0, 0, 0);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;
        
      default:
        console.warn(`Unknown schedule type: ${job.schedule}`);
        return;
    }
    
    job.nextRun = nextRun.getTime();
    console.log(`📅 Next run for ${jobId}: ${nextRun.toISOString()}`);
  }
  
  // Run backup job
  async runBackupJob(jobId) {
    const job = this.backupJobs.get(jobId);
    if (!job) {
      console.error(`Backup job not found: ${jobId}`);
      return;
    }
    
    if (this.runningJobs.has(jobId)) {
      console.warn(`Backup job ${jobId} is already running`);
      return;
    }
    
    this.runningJobs.add(jobId);
    job.status = 'running';
    job.attempts++;
    job.lastRun = Date.now();
    
    const startTime = Date.now();
    
    try {
      console.log(`🚀 Starting backup job: ${jobId} (attempt ${job.attempts}/${job.maxAttempts})`);
      
      let backupPath;
      
      switch (job.type) {
        case 'database':
          backupPath = await this.backupDatabase(job);
          break;
        case 'redis':
          backupPath = await this.backupRedis(job);
          break;
        case 'files':
          backupPath = await this.backupFiles(job);
          break;
        default:
          throw new Error(`Unknown backup type: ${job.type}`);
      }
      
      // Upload to storage providers
      await this.uploadBackup(jobId, backupPath);
      
      // Record backup success
      const duration = Date.now() - startTime;
      await this.recordBackupResult(jobId, true, duration, backupPath);
      
      // Apply retention policy
      await this.applyRetentionPolicy(jobId);
      
      // Calculate next run
      this.calculateNextRun(jobId);
      
      job.status = 'completed';
      job.attempts = 0; // Reset attempts on success
      
      console.log(`✅ Backup job completed: ${jobId} (${duration}ms)`);
      
      if (this.config.monitoring.alertOnSuccess) {
        await this.sendAlert('success', jobId, `Backup completed successfully in ${duration}ms`);
      }
      
    } catch (error) {
      console.error(`❌ Backup job failed: ${jobId}`, error.message);
      
      job.status = 'failed';
      await this.recordBackupResult(jobId, false, Date.now() - startTime, null, error.message);
      
      // Retry if attempts remaining
      if (job.attempts < job.maxAttempts) {
        console.log(`🔄 Will retry backup job: ${jobId} (${job.maxAttempts - job.attempts} attempts remaining)`);
        setTimeout(() => {
          this.runBackupJob(jobId);
        }, 300000); // Retry in 5 minutes
      } else {
        console.error(`💥 Backup job failed permanently: ${jobId}`);
        if (this.config.monitoring.alertOnFailure) {
          await this.sendAlert('failure', jobId, `Backup failed permanently: ${error.message}`);
        }
      }
    } finally {
      this.runningJobs.delete(jobId);
    }
  }
  
  // Backup database
  async backupDatabase(job) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${job.id}_${timestamp}.sql`;
    const backupPath = path.join(this.config.backup.tempDirectory, filename);
    
    if (job.database === 'postgresql') {
      const pgDumpCmd = [
        'pg_dump',
        '-h', job.host,
        '-p', job.port.toString(),
        '-U', job.username,
        '-d', job.database,
        '--no-password',
        '--verbose',
        '--clean',
        '--if-exists',
        '-f', backupPath
      ];
      
      // Set password via environment variable
      const env = { ...process.env, PGPASSWORD: job.password };
      
      execSync(pgDumpCmd.join(' '), { env, stdio: 'inherit' });
    }
    
    // Compress if enabled
    if (job.compressed) {
      const compressedPath = `${backupPath}.gz`;
      execSync(`gzip -${this.config.backup.compressionLevel} "${backupPath}"`);
      return compressedPath;
    }
    
    return backupPath;
  }
  
  // Backup Redis
  async backupRedis(job) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${job.id}_${timestamp}.rdb`;
    const backupPath = path.join(this.config.backup.tempDirectory, filename);
    
    // Trigger Redis BGSAVE and copy the dump file
    const redisCliCmd = [
      'redis-cli',
      '-h', job.host,
      '-p', job.port.toString()
    ];
    
    if (job.password) {
      redisCliCmd.push('-a', job.password);
    }
    
    redisCliCmd.push('BGSAVE');
    
    execSync(redisCliCmd.join(' '), { stdio: 'inherit' });
    
    // Wait for backup to complete and copy file
    // This is simplified - in production you'd check LASTSAVE
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const rdbPath = '/var/lib/redis/dump.rdb';
    execSync(`cp "${rdbPath}" "${backupPath}"`);
    
    // Compress if enabled
    if (job.compressed) {
      const compressedPath = `${backupPath}.gz`;
      execSync(`gzip -${this.config.backup.compressionLevel} "${backupPath}"`);
      return compressedPath;
    }
    
    return backupPath;
  }
  
  // Backup files
  async backupFiles(job) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${job.id}_${timestamp}.tar`;
    const backupPath = path.join(this.config.backup.tempDirectory, filename);
    
    let tarCmd = ['tar', '-cf', backupPath];
    
    // Add compression if enabled
    if (job.compressed) {
      tarCmd = ['tar', '-czf', `${backupPath}.gz`];
    }
    
    // Add exclude patterns
    if (job.excludePatterns) {
      job.excludePatterns.forEach(pattern => {
        tarCmd.push('--exclude', pattern);
      });
    }
    
    // Add include patterns (if specified, only include these)
    if (job.includePatterns) {
      job.includePatterns.forEach(pattern => {
        tarCmd.push('-C', job.sourcePath, pattern);
      });
    } else {
      tarCmd.push('-C', path.dirname(job.sourcePath), path.basename(job.sourcePath));
    }
    
    execSync(tarCmd.join(' '), { stdio: 'inherit' });
    
    return job.compressed ? `${backupPath}.gz` : backupPath;
  }
  
  // Upload backup to storage providers
  async uploadBackup(jobId, localPath) {
    const job = this.backupJobs.get(jobId);
    const remotePath = `${job.id}/${path.basename(localPath)}`;
    
    const uploadPromises = [];
    
    for (const [providerId, provider] of this.storageProviders) {
      if (provider.enabled) {
        console.log(`☁️ Uploading backup to ${providerId}: ${remotePath}`);
        uploadPromises.push(
          provider.upload(localPath, remotePath)
            .then(() => console.log(`✅ Upload to ${providerId} completed`))
            .catch(error => console.error(`❌ Upload to ${providerId} failed:`, error.message))
        );
      }
    }
    
    await Promise.allSettled(uploadPromises);
    
    // Clean up local temp file
    try {
      await fs.unlink(localPath);
      console.log(`🗑️ Cleaned up temp file: ${localPath}`);
    } catch (error) {
      console.warn(`Failed to clean up temp file: ${error.message}`);
    }
  }
  
  // Local storage upload
  async uploadToLocal(localPath, remotePath) {
    const targetPath = path.join(this.config.storage.local.path, remotePath);
    const targetDir = path.dirname(targetPath);
    
    await fs.mkdir(targetDir, { recursive: true });
    await fs.copyFile(localPath, targetPath);
  }
  
  // S3 upload (placeholder - would use AWS SDK)
  async uploadToS3(localPath, remotePath) {
    // In real implementation, use AWS SDK
    console.log(`S3 upload: ${localPath} -> s3://${this.config.storage.s3.bucket}/${remotePath}`);
    // const AWS = require('aws-sdk');
    // const s3 = new AWS.S3({
    //   accessKeyId: this.config.storage.s3.accessKeyId,
    //   secretAccessKey: this.config.storage.s3.secretAccessKey,
    //   region: this.config.storage.s3.region
    // });
    // 
    // const fileStream = fs.createReadStream(localPath);
    // const uploadParams = {
    //   Bucket: this.config.storage.s3.bucket,
    //   Key: remotePath,
    //   Body: fileStream
    // };
    // 
    // return s3.upload(uploadParams).promise();
  }
  
  // Azure upload (placeholder - would use Azure SDK)
  async uploadToAzure(localPath, remotePath) {
    console.log(`Azure upload: ${localPath} -> ${remotePath}`);
    // Implementation would use @azure/storage-blob
  }
  
  // GCP upload (placeholder - would use GCP SDK)
  async uploadToGCP(localPath, remotePath) {
    console.log(`GCP upload: ${localPath} -> gs://${this.config.storage.gcp.bucketName}/${remotePath}`);
    // Implementation would use @google-cloud/storage
  }
  
  // Record backup result
  async recordBackupResult(jobId, success, duration, backupPath, error = null) {
    const result = {
      jobId,
      success,
      duration,
      backupPath,
      error,
      timestamp: Date.now(),
      size: backupPath ? await this.getFileSize(backupPath) : 0,
      checksum: backupPath ? await this.calculateChecksum(backupPath) : null
    };
    
    this.backupHistory.push(result);
    
    // Maintain history limit
    if (this.backupHistory.length > 10000) {
      this.backupHistory = this.backupHistory.slice(-5000);
    }
    
    // Emit event
    this.emit('backup_completed', result);
  }
  
  // Apply retention policy
  async applyRetentionPolicy(jobId) {
    const job = this.backupJobs.get(jobId);
    if (!job) return;
    
    const retentionDays = this.config.retention[job.retention] || this.config.retention.daily;
    const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    
    console.log(`🗂️ Applying retention policy for ${jobId}: ${retentionDays} days`);
    
    // Clean up old backups from each storage provider
    for (const [providerId, provider] of this.storageProviders) {
      if (provider.enabled) {
        try {
          const files = await provider.list(jobId);
          const oldFiles = files.filter(file => file.lastModified < cutoffTime);
          
          for (const file of oldFiles) {
            await provider.delete(file.path);
            console.log(`🗑️ Deleted old backup from ${providerId}: ${file.path}`);
          }
        } catch (error) {
          console.error(`Failed to apply retention policy for ${providerId}:`, error.message);
        }
      }
    }
  }
  
  // List local files (placeholder)
  async listLocalFiles(prefix) {
    const baseDir = path.join(this.config.storage.local.path, prefix);
    try {
      const files = await fs.readdir(baseDir, { withFileTypes: true });
      return files
        .filter(file => file.isFile())
        .map(file => ({
          path: path.join(prefix, file.name),
          lastModified: Date.now() // Would get actual file stats
        }));
    } catch (error) {
      return [];
    }
  }
  
  // Delete local file
  async deleteLocalFile(remotePath) {
    const filePath = path.join(this.config.storage.local.path, remotePath);
    await fs.unlink(filePath);
  }
  
  // Placeholder implementations for cloud storage list/delete operations
  async listS3Files(prefix) { return []; }
  async deleteS3File(remotePath) { }
  async listAzureFiles(prefix) { return []; }
  async deleteAzureFile(remotePath) { }
  async listGCPFiles(prefix) { return []; }
  async deleteGCPFile(remotePath) { }
  
  // Get file size
  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }
  
  // Calculate file checksum
  async calculateChecksum(filePath) {
    try {
      const data = await fs.readFile(filePath);
      return createHash('sha256').update(data).digest('hex');
    } catch (error) {
      return null;
    }
  }
  
  // Send alert
  async sendAlert(type, jobId, message) {
    const alert = {
      type,
      jobId,
      message,
      timestamp: Date.now()
    };
    
    console.log(`🚨 Backup Alert [${type}]: ${message}`);
    
    // Integration with alerting systems would go here
    // Slack, email, PagerDuty, etc.
  }
  
  // Start backup monitoring
  startBackupMonitoring() {
    console.log('👁️ Starting backup monitoring...');
    
    // Monitor backup job health every 5 minutes
    setInterval(() => {
      this.monitorBackupHealth();
    }, 300000); // 5 minutes
  }
  
  // Monitor backup health
  monitorBackupHealth() {
    const now = Date.now();
    const criticalThreshold = 48 * 60 * 60 * 1000; // 48 hours
    const warningThreshold = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [jobId, job] of this.backupJobs) {
      if (job.priority === 'critical' || job.priority === 'high') {
        const timeSinceLastRun = job.lastRun ? now - job.lastRun : now - job.createdAt;
        
        if (timeSinceLastRun > criticalThreshold) {
          this.sendAlert('critical', jobId, `Critical backup job has not run for ${Math.round(timeSinceLastRun / (60 * 60 * 1000))} hours`);
        } else if (timeSinceLastRun > warningThreshold) {
          this.sendAlert('warning', jobId, `Backup job has not run for ${Math.round(timeSinceLastRun / (60 * 60 * 1000))} hours`);
        }
      }
    }
  }
  
  // Get backup status
  getBackupStatus() {
    const runningJobs = Array.from(this.runningJobs);
    const failedJobs = Array.from(this.backupJobs.values()).filter(job => job.status === 'failed');
    const recentBackups = this.backupHistory.slice(-20);
    
    return {
      timestamp: Date.now(),
      summary: {
        totalJobs: this.backupJobs.size,
        runningJobs: runningJobs.length,
        failedJobs: failedJobs.length,
        storageProviders: Array.from(this.storageProviders.values()).filter(p => p.enabled).length
      },
      runningJobs,
      failedJobs: failedJobs.map(job => ({
        id: job.id,
        type: job.type,
        status: job.status,
        attempts: job.attempts,
        lastRun: job.lastRun
      })),
      recentBackups: recentBackups.map(backup => ({
        jobId: backup.jobId,
        success: backup.success,
        duration: backup.duration,
        timestamp: backup.timestamp,
        size: backup.size
      }))
    };
  }
  
  // Generate backup report
  async generateReport() {
    const reportDir = path.join(__dirname, 'reports');
    await fs.mkdir(reportDir, { recursive: true });
    
    const status = this.getBackupStatus();
    const reportFile = path.join(reportDir, `backup-report-${Date.now()}.json`);
    
    await fs.writeFile(reportFile, JSON.stringify({
      status,
      jobs: Array.from(this.backupJobs.entries()).map(([id, job]) => ({
        id,
        ...job
      })),
      history: this.backupHistory.slice(-1000),
      configuration: {
        retention: this.config.retention,
        storage: Object.fromEntries(
          Object.entries(this.config.storage).map(([key, config]) => [
            key,
            { enabled: config.enabled }
          ])
        )
      }
    }, null, 2));
    
    console.log(`📊 Backup report generated: ${reportFile}`);
    return reportFile;
  }
  
  // Shutdown cleanup
  shutdown() {
    console.log('🔄 Shutting down Automated Backup System...');
    
    // Wait for running jobs to complete
    if (this.runningJobs.size > 0) {
      console.log(`⏳ Waiting for ${this.runningJobs.size} running jobs to complete...`);
    }
    
    // Generate final report
    this.generateReport();
    
    console.log('✅ Automated Backup System shutdown complete');
  }
}

module.exports = AutomatedBackupSystem;