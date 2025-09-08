export = AutomatedBackupSystem;
/**
 * Investment Platform Automated Backup System
 * Comprehensive backup solution for databases, files, and configurations
 * with financial services compliance and disaster recovery focus
 */
declare class AutomatedBackupSystem extends EventEmitter<[never]> {
    constructor();
    backupJobs: Map<any, any>;
    backupHistory: any[];
    retentionPolicies: Map<any, any>;
    storageProviders: Map<any, any>;
    config: {
        backup: {
            baseDirectory: string;
            tempDirectory: string;
            compressionLevel: number;
            encryptionEnabled: boolean;
            encryptionKey: string;
            parallelJobs: number;
        };
        scheduling: {
            dailyBackupHour: number;
            weeklyBackupDay: number;
            monthlyBackupDay: number;
        };
        retention: {
            daily: number;
            weekly: number;
            monthly: number;
            yearly: number;
        };
        storage: {
            local: {
                enabled: boolean;
                path: string;
            };
            s3: {
                enabled: boolean;
                bucket: string;
                region: string;
                accessKeyId: string;
                secretAccessKey: string;
            };
            azure: {
                enabled: boolean;
                containerName: string;
                connectionString: string;
            };
            gcp: {
                enabled: boolean;
                bucketName: string;
                projectId: string;
            };
        };
        monitoring: {
            alertOnFailure: boolean;
            alertOnSuccess: boolean;
            slackWebhook: string;
            emailRecipients: string[];
        };
    };
    runningJobs: Set<any>;
    scheduledJobs: Map<any, any>;
    initializeBackupSystem(): Promise<void>;
    createBackupDirectories(): Promise<void>;
    registerBackupJobs(): void;
    registerJob(jobId: any, config: any): void;
    initializeStorageProviders(): Promise<void>;
    scheduleBackupJobs(): void;
    checkScheduledJobs(): void;
    calculateNextRun(jobId: any): void;
    runBackupJob(jobId: any): Promise<void>;
    backupDatabase(job: any): Promise<string>;
    backupRedis(job: any): Promise<string>;
    backupFiles(job: any): Promise<string>;
    uploadBackup(jobId: any, localPath: any): Promise<void>;
    uploadToLocal(localPath: any, remotePath: any): Promise<void>;
    uploadToS3(localPath: any, remotePath: any): Promise<void>;
    uploadToAzure(localPath: any, remotePath: any): Promise<void>;
    uploadToGCP(localPath: any, remotePath: any): Promise<void>;
    recordBackupResult(jobId: any, success: any, duration: any, backupPath: any, error?: any): Promise<void>;
    applyRetentionPolicy(jobId: any): Promise<void>;
    listLocalFiles(prefix: any): Promise<{
        path: string;
        lastModified: number;
    }[]>;
    deleteLocalFile(remotePath: any): Promise<void>;
    listS3Files(prefix: any): Promise<any[]>;
    deleteS3File(remotePath: any): Promise<void>;
    listAzureFiles(prefix: any): Promise<any[]>;
    deleteAzureFile(remotePath: any): Promise<void>;
    listGCPFiles(prefix: any): Promise<any[]>;
    deleteGCPFile(remotePath: any): Promise<void>;
    getFileSize(filePath: any): Promise<number>;
    calculateChecksum(filePath: any): Promise<string>;
    sendAlert(type: any, jobId: any, message: any): Promise<void>;
    startBackupMonitoring(): void;
    monitorBackupHealth(): void;
    getBackupStatus(): {
        timestamp: number;
        summary: {
            totalJobs: number;
            runningJobs: number;
            failedJobs: number;
            storageProviders: number;
        };
        runningJobs: any[];
        failedJobs: {
            id: any;
            type: any;
            status: any;
            attempts: any;
            lastRun: any;
        }[];
        recentBackups: {
            jobId: any;
            success: any;
            duration: any;
            timestamp: any;
            size: any;
        }[];
    };
    generateReport(): Promise<string>;
    shutdown(): void;
}
import { EventEmitter } from "events";
