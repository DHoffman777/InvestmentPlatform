import { EventEmitter } from 'events';
export interface AppStoreConfig {
    ios: IOSConfig;
    android: AndroidConfig;
    general: GeneralConfig;
}
export interface IOSConfig {
    appId: string;
    bundleId: string;
    teamId: string;
    appStoreConnectAPIKey: string;
    certificatePath: string;
    provisioningProfilePath: string;
    signingIdentity: string;
    distributionCertificate: string;
    appStoreUrl: string;
    testFlightGroups: string[];
}
export interface AndroidConfig {
    packageName: string;
    googlePlayConsoleProject: string;
    serviceAccountKey: string;
    keystorePath: string;
    keystorePassword: string;
    keyAlias: string;
    keyPassword: string;
    playStoreUrl: string;
    internalTestingTrack: string;
}
export interface GeneralConfig {
    appName: string;
    appVersion: string;
    buildNumber: number;
    releaseNotes: string;
    minimumOSVersion: {
        ios: string;
        android: string;
    };
    supportedDevices: string[];
    categories: string[];
    keywords: string[];
    privacy: PrivacyConfig;
    compliance: ComplianceConfig;
}
export interface PrivacyConfig {
    privacyPolicyUrl: string;
    dataCollectionPractices: DataCollectionPractice[];
    thirdPartySDKs: ThirdPartySDK[];
    encryptionExport: boolean;
    ccpaCompliant: boolean;
    gdprCompliant: boolean;
}
export interface DataCollectionPractice {
    dataType: 'personal' | 'financial' | 'device' | 'usage' | 'diagnostics';
    purpose: string;
    retention: string;
    sharing: boolean;
    sharedWith: string[];
    userConsent: boolean;
}
export interface ThirdPartySDK {
    name: string;
    purpose: string;
    dataAccess: string[];
    privacyPolicy: string;
    version: string;
}
export interface ComplianceConfig {
    finra: boolean;
    sec: boolean;
    gdpr: boolean;
    ccpa: boolean;
    pci: boolean;
    sox: boolean;
    certifications: Certification[];
    auditTrail: boolean;
    dataResidency: string[];
}
export interface Certification {
    name: string;
    number: string;
    issuer: string;
    validUntil: Date;
    scope: string[];
}
export interface AppBuild {
    id: string;
    version: string;
    buildNumber: number;
    platform: 'ios' | 'android';
    buildType: 'debug' | 'release' | 'adhoc' | 'enterprise';
    status: 'queued' | 'building' | 'success' | 'failed' | 'cancelled';
    startTime: Date;
    endTime?: Date;
    duration?: number;
    artifacts: BuildArtifact[];
    testResults: TestResult[];
    codeSignature: CodeSignature;
    buildLogs: string[];
    errors: BuildError[];
    warnings: BuildWarning[];
    buildEnvironment: BuildEnvironment;
    createdBy: string;
}
export interface BuildArtifact {
    type: 'ipa' | 'apk' | 'aab' | 'dsym' | 'mapping';
    path: string;
    size: number;
    checksum: string;
    uploadUrl?: string;
    publicUrl?: string;
}
export interface TestResult {
    suite: string;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    coverage: number;
    report: string;
}
export interface CodeSignature {
    certificate: string;
    identity: string;
    valid: boolean;
    expiresAt: Date;
    entitlements: string[];
}
export interface BuildError {
    type: 'compile' | 'link' | 'sign' | 'package' | 'upload';
    file?: string;
    line?: number;
    message: string;
    severity: 'error' | 'warning';
}
export interface BuildWarning {
    type: string;
    file?: string;
    line?: number;
    message: string;
}
export interface BuildEnvironment {
    xcode?: string;
    swift?: string;
    android?: string;
    gradle?: string;
    node?: string;
    reactNative?: string;
    os: string;
    arch: string;
}
export interface AppSubmission {
    id: string;
    buildId: string;
    platform: 'ios' | 'android';
    store: 'app_store' | 'play_store' | 'test_flight' | 'internal_testing';
    status: 'preparing' | 'uploading' | 'processing' | 'review' | 'approved' | 'rejected' | 'live';
    submissionType: 'new_app' | 'update' | 'hotfix' | 'metadata_only';
    version: string;
    releaseType: 'automatic' | 'manual' | 'phased';
    releaseDate?: Date;
    reviewNotes: string;
    screenshots: Screenshot[];
    appStoreMetadata: AppStoreMetadata;
    submissionDate: Date;
    approvalDate?: Date;
    rejectionReason?: string;
    reviewHistory: ReviewEvent[];
    rolloutPercentage?: number;
    metrics: SubmissionMetrics;
}
export interface Screenshot {
    deviceType: string;
    orientation: 'portrait' | 'landscape';
    url: string;
    caption?: string;
    order: number;
}
export interface AppStoreMetadata {
    title: string;
    subtitle?: string;
    description: string;
    keywords: string[];
    categories: string[];
    contentRating: string;
    supportUrl: string;
    marketingUrl?: string;
    privacyPolicyUrl: string;
    releaseNotes: string;
    promotional: PromotionalContent;
    localization: LocalizationData[];
}
export interface PromotionalContent {
    iconUrl: string;
    featureGraphicUrl?: string;
    videoPreviewUrl?: string;
    promotionalText?: string;
}
export interface LocalizationData {
    locale: string;
    title: string;
    description: string;
    keywords: string[];
    releaseNotes: string;
    screenshots: Screenshot[];
}
export interface ReviewEvent {
    date: Date;
    status: string;
    reviewer?: string;
    notes?: string;
    requiredChanges?: string[];
    timeline?: string;
}
export interface SubmissionMetrics {
    downloadCount: number;
    installCount: number;
    rating: number;
    reviewCount: number;
    crashRate: number;
    conversionRate: number;
    retentionRate: {
        [days: string]: number;
    };
}
export interface AppStoreAnalytics {
    period: {
        start: Date;
        end: Date;
    };
    impressions: number;
    productPageViews: number;
    downloads: number;
    installs: number;
    updates: number;
    uninstalls: number;
    revenue: number;
    conversionRate: number;
    topCountries: CountryMetric[];
    topDevices: DeviceMetric[];
    userRatings: RatingMetric[];
    crashlytics: CrashMetric[];
    performance: PerformanceMetric[];
}
export interface CountryMetric {
    country: string;
    downloads: number;
    revenue: number;
    rating: number;
}
export interface DeviceMetric {
    device: string;
    percentage: number;
    crashes: number;
    performance: number;
}
export interface RatingMetric {
    stars: number;
    count: number;
    percentage: number;
}
export interface CrashMetric {
    type: string;
    count: number;
    affectedUsers: number;
    trend: 'increasing' | 'decreasing' | 'stable';
}
export interface PerformanceMetric {
    metric: 'app_launch' | 'memory_usage' | 'battery_usage' | 'network_requests';
    value: number;
    trend: 'improving' | 'degrading' | 'stable';
    percentile: number;
}
export interface ReleaseManagement {
    strategy: 'immediate' | 'phased' | 'scheduled' | 'feature_flag';
    rolloutPlan: RolloutPhase[];
    featureFlags: FeatureFlag[];
    abTests: ABTest[];
    rollbackPlan: RollbackPlan;
    approvals: ApprovalWorkflow;
    notifications: NotificationConfig[];
}
export interface RolloutPhase {
    name: string;
    percentage: number;
    duration: number;
    criteria: RolloutCriteria;
    pauseConditions: PauseCondition[];
    successMetrics: SuccessMetric[];
}
export interface RolloutCriteria {
    countries?: string[];
    userSegments?: string[];
    deviceTypes?: string[];
    osVersions?: string[];
    previousUsers?: boolean;
}
export interface PauseCondition {
    metric: string;
    threshold: number;
    operator: '>' | '<' | '==' | '>=' | '<=';
    action: 'pause' | 'rollback' | 'alert';
}
export interface SuccessMetric {
    name: string;
    target: number;
    current?: number;
    status: 'on_track' | 'at_risk' | 'failed';
}
export interface FeatureFlag {
    name: string;
    description: string;
    enabled: boolean;
    rolloutPercentage: number;
    targetSegments: string[];
    metrics: string[];
    expiration?: Date;
}
export interface ABTest {
    name: string;
    description: string;
    variants: TestVariant[];
    trafficAllocation: number;
    successMetrics: string[];
    startDate: Date;
    endDate: Date;
    status: 'draft' | 'running' | 'completed' | 'cancelled';
}
export interface TestVariant {
    name: string;
    description: string;
    percentage: number;
    config: Record<string, any>;
}
export interface RollbackPlan {
    triggers: RollbackTrigger[];
    procedure: RollbackStep[];
    communicationPlan: string[];
    recoveryTime: number;
}
export interface RollbackTrigger {
    condition: string;
    threshold: number;
    automatic: boolean;
    approvers: string[];
}
export interface RollbackStep {
    order: number;
    description: string;
    estimatedTime: number;
    responsible: string;
    dependencies: number[];
}
export interface ApprovalWorkflow {
    required: boolean;
    stages: ApprovalStage[];
    emergency: EmergencyApproval;
}
export interface ApprovalStage {
    name: string;
    approvers: string[];
    requiredApprovals: number;
    timeout: number;
    escalation: string[];
}
export interface EmergencyApproval {
    enabled: boolean;
    approvers: string[];
    conditions: string[];
    documentation: string[];
}
export interface NotificationConfig {
    event: string;
    channels: string[];
    recipients: string[];
    template: string;
    conditions?: string[];
}
/**
 * App Store Deployment and Management System
 * Handles mobile app building, testing, submission, and release management
 */
export declare class AppStoreManager extends EventEmitter {
    private config;
    private builds;
    private submissions;
    private analytics;
    private releaseManagement;
    constructor(config: AppStoreConfig);
    /**
     * Create new app build
     */
    createBuild(platform: 'ios' | 'android', buildType: 'debug' | 'release' | 'adhoc' | 'enterprise', version: string, options?: {
        incrementBuildNumber?: boolean;
        runTests?: boolean;
        uploadArtifacts?: boolean;
        notifyTeam?: boolean;
    }): Promise<AppBuild>;
    /**
     * Submit app to app store
     */
    submitToStore(buildId: string, store: 'app_store' | 'play_store' | 'test_flight' | 'internal_testing', metadata: AppStoreMetadata, options?: {
        releaseType?: 'automatic' | 'manual' | 'phased';
        releaseDate?: Date;
        reviewNotes?: string;
        screenshots?: Screenshot[];
    }): Promise<AppSubmission>;
    /**
     * Manage app release rollout
     */
    manageRollout(submissionId: string, action: 'start' | 'pause' | 'resume' | 'rollback' | 'complete', percentage?: number): Promise<void>;
    /**
     * Get app store analytics
     */
    getAnalytics(period: {
        start: Date;
        end: Date;
    }, platform?: 'ios' | 'android'): Promise<AppStoreAnalytics>;
    /**
     * Monitor app health and performance
     */
    monitorAppHealth(): Promise<{
        ios: AppHealthStatus;
        android: AppHealthStatus;
        overall: AppHealthStatus;
    }>;
    /**
     * Configure feature flags
     */
    configureFeatureFlag(flag: FeatureFlag, targetSegments?: string[]): Promise<void>;
    /**
     * Get deployment dashboard
     */
    generateDashboard(): DeploymentDashboard;
    private executeBuild;
    private executeSubmission;
    private startRollout;
    private pauseRollout;
    private resumeRollout;
    private rollbackRelease;
    private completeRollout;
    private fetchAnalytics;
    private checkPlatformHealth;
    private getWorstStatus;
    private generateHealthRecommendations;
    private getNextBuildNumber;
    private getCodeSignature;
    private getBuildEnvironment;
    private simulateBuildProcess;
    private runTests;
    private generateArtifacts;
    private uploadArtifacts;
    private notifyTeam;
    private determineSubmissionType;
    private uploadToStore;
    private submitForReview;
    private simulateReviewProcess;
    private monitorRolloutHealth;
    private getRolloutMetrics;
    private checkPauseCondition;
    private executeRollbackStep;
    private syncFeatureFlags;
    private calculateBuildMetrics;
    private calculateSubmissionMetrics;
    private calculateReleaseMetrics;
    private calculateAverageReviewTime;
    private getUpcomingReleases;
    private getActiveAlerts;
    private generateCountryMetrics;
    private generateDeviceMetrics;
    private generateRatingMetrics;
    private generateCrashMetrics;
    private generatePerformanceMetrics;
    private initializeReleaseManagement;
    private startAnalyticsCollection;
    private fetchAndStoreAnalytics;
}
interface AppHealthStatus {
    status: 'healthy' | 'warning' | 'critical';
    crashRate: number;
    performance: number;
    userSatisfaction: number;
    lastUpdated: Date;
    issues: string[];
    recommendations: string[];
}
interface DeploymentDashboard {
    summary: {
        totalBuilds: number;
        successfulBuilds: number;
        activeSubmissions: number;
        liveVersions: number;
        averageBuildTime: number;
        successRate: number;
    };
    recentBuilds: any[];
    activeSubmissions: any[];
    buildMetrics: any;
    submissionMetrics: any;
    releaseMetrics: any;
    upcomingReleases: any[];
    alerts: any[];
    lastUpdated: Date;
}
export default AppStoreManager;
