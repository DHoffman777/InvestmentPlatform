# Investment Platform - Complete Project Structure

## Project Statistics
- **Total TypeScript/TSX Files**: 425 (excluding node_modules, dist, .next)
- **Files Mapped**: ~50 files
- **Coverage**: ~11.8%
- **Architecture**: Microservices Monorepo
- **Primary Stack**: TypeScript, Node.js, React, React Native

---

## Service Distribution

### By Directory
- **services/**: 263 files
- **infrastructure/**: 66 files
- **apps/**: 55 files
- **libs/**: 17 files
- **Other**: ~24 files

---

## Detailed Service Breakdown

### 1. Portfolio Management Service
**Location**: `services/portfolio-service/`
**Files**: 66 total
**Mapped**: 13 files (19.7%)
**Database**: Prisma ORM
**Pattern**: Class-based with DI

#### Directory Structure:
```
/src/services/
├── alternatives/ (1 file)
│   └── AlternativeInvestmentsService.ts
├── analytics/ (8 files)
│   ├── AnomalyDetectionService.ts
│   ├── BusinessIntelligenceService.ts
│   ├── DashboardBuilderService.ts
│   ├── DataVisualizationService.ts
│   ├── DrillDownService.ts
│   ├── MachineLearningInsightsService.ts [MAPPED]
│   ├── PredictiveModelingService.ts
│   └── RealTimeAnalyticsService.ts
├── clientDocuments/ (2 files)
│   ├── ClientDocumentService.ts
│   └── DocumentProcessingService.ts
├── clientPortal/ (2 files)
│   ├── ClientPortalService.ts
│   └── DashboardWidgetService.ts
├── clientRelationship/ (4 files)
│   ├── ClientRelationshipService.ts [MAPPED]
│   ├── HouseholdManagementService.ts
│   ├── InvestmentObjectivesService.ts
│   └── RiskProfilingService.ts
├── custodianIntegration/ (7 files)
│   ├── CustodianIntegrationService.ts
│   └── adapters/
│       ├── FidelityIntegrationService.ts
│       ├── PershingIntegrationService.ts
│       └── SchwabIntegrationService.ts [MAPPED]
├── documentManagement/ (7 files)
│   ├── DataExtractionService.ts
│   ├── DocumentFilingService.ts
│   ├── DocumentSearchService.ts
│   ├── DocumentVersionControlService.ts
│   ├── MultiLanguageProcessingService.ts
│   ├── OCRService.ts
│   └── TemplateRecognitionService.ts
├── regulatory/ (8 files)
│   ├── AutomatedFilingWorkflowsService.ts
│   ├── BestExecutionService.ts
│   ├── ClientRegulatoryReportsService.ts
│   ├── Form13FService.ts [MAPPED]
│   ├── FormADVService.ts
│   ├── FormPFService.ts
│   ├── GIPSCompositeService.ts
│   └── MultiJurisdictionComplianceService.ts
├── reporting/ (3 files)
│   ├── ReportGenerationService.ts
│   ├── ReportingEngineService.ts
│   └── ReportTemplateService.ts
├── riskManagement/ (7 files)
│   ├── CorrelationAnalysisService.ts
│   ├── CounterpartyExposureTrackingService.ts
│   ├── CreditRiskMonitoringService.ts
│   ├── LiquidityRiskService.ts
│   ├── MonteCarloSimulationService.ts
│   ├── RiskLimitMonitoringService.ts
│   ├── StressTestingService.ts
│   └── VaRCalculationService.ts [MAPPED]
├── structuredProducts/ (4 files)
│   ├── BarrierMonitoringService.ts
│   ├── DocumentParsingService.ts
│   ├── StructuredProductsService.ts
│   └── StructuredProductsValuationService.ts
└── [Core Services]
    ├── assetClassificationService.ts [MAPPED]
    ├── cashEquivalentService.ts
    ├── complianceMonitoringService.ts [MAPPED]
    ├── complianceWorkflowService.ts
    ├── derivativesAnalyticsService.ts
    ├── fixedIncomeAnalyticsService.ts [MAPPED]
    ├── fixedIncomeService.ts
    ├── instrumentReferenceDataService.ts
    ├── orderManagementService.ts [MAPPED]
    ├── performanceMeasurementService.ts [MAPPED]
    ├── portfolioService.ts [MAPPED]
    ├── positionService.ts [MAPPED]
    ├── postTradeProcessingService.ts
    ├── regulatoryRuleEngine.ts
    └── transactionService.ts [MAPPED]
```

---

### 2. Market Data Service
**Location**: `services/market-data/`
**Files**: 26 total
**Mapped**: 2 files (7.7%)
**Database**: Prisma ORM

#### Structure:
```
/src/
├── config/ (3 files)
│   ├── database.ts
│   ├── logger.ts
│   └── redis.ts
├── middleware/ (3 files)
│   ├── auth.ts
│   ├── errorHandler.ts
│   └── metrics.ts
├── routes/ (9 files)
│   ├── cash.ts
│   ├── corporateActions.ts
│   ├── equities.ts
│   ├── funds.ts
│   ├── health.ts
│   ├── historical.ts
│   ├── quotes.ts
│   ├── reits.ts
│   └── securities.ts
├── seeders/ (4 files)
│   ├── cashSeeder.ts
│   ├── equitiesSeeder.ts
│   ├── fundsSeeder.ts
│   └── reitsSeeder.ts
├── services/ (5 files)
│   ├── cashService.ts
│   ├── equitiesService.ts [MAPPED]
│   ├── fundsService.ts [MAPPED]
│   ├── marketDataService.ts
│   └── reitsService.ts
├── utils/ (1 file)
│   └── logger.ts
└── index.ts
```

---

### 3. Trading Service
**Location**: `services/trading-service/`
**Files**: 8 total (all in settlement-risk/)
**Mapped**: 1 file (12.5%)
**Pattern**: EventEmitter-based

#### Files:
```
/src/settlement-risk/
├── CounterpartyRiskAssessmentService.ts
├── PreSettlementRiskChecksService.ts
├── RiskMitigationWorkflowsService.ts
├── SettlementFailurePredictionService.ts
├── SettlementRiskCalculationEngine.ts [MAPPED]
├── SettlementRiskController.ts
├── SettlementRiskReportingService.ts
└── SettlementTimelineTrackingService.ts
```

---

### 4. User Service
**Location**: `services/user-service/`
**Files**: 16 total
**Mapped**: 1 file (6.3%)

#### Structure:
```
/src/
├── activity-monitoring/ (8 files)
│   ├── ActivityAnalyticsService.ts
│   ├── ActivityCaptureMiddleware.ts
│   ├── ActivityMonitoringController.ts
│   ├── ActivityPrivacyService.ts
│   ├── ActivityRetentionService.ts
│   ├── ActivityStreamingService.ts
│   ├── ActivityTrackingService.ts [MAPPED]
│   └── SuspiciousActivityDetectionService.ts
└── self-service/ (8 files)
    ├── AccountClosureService.ts
    ├── AccountSecurityDashboardService.ts
    ├── DataRequestService.ts
    ├── MFAManagementService.ts
    ├── NotificationPreferencesService.ts
    ├── PasswordSecurityService.ts
    ├── SelfServiceController.ts
    └── UserProfileService.ts
```

---

### 5. Client Service
**Location**: `services/client-service/`
**Files**: 26 total
**Mapped**: 1 file (3.8%)

#### Structure:
```
/src/
├── communication/ (9 files)
│   ├── CommunicationAnalyticsService.ts
│   ├── CommunicationCategorizationService.ts
│   ├── CommunicationController.ts
│   ├── CommunicationDataModel.ts
│   ├── CommunicationSearchService.ts
│   ├── CommunicationTimelineService.ts
│   ├── ComplianceRecordingService.ts
│   ├── MultiChannelTrackingService.ts
│   └── index.ts
├── onboarding/ (8 files)
│   ├── AccountSetupService.ts
│   ├── ComplianceApprovalService.ts
│   ├── DocumentCollectionService.ts
│   ├── IdentityVerificationService.ts
│   ├── KYCAMLIntegrationService.ts
│   ├── OnboardingController.ts [MAPPED]
│   ├── OnboardingProgressService.ts
│   └── OnboardingWorkflowStateMachine.ts
└── scheduling/ (9 files)
    ├── AvailabilityManagementService.ts
    ├── CalendarIntegrationService.ts
    ├── MeetingAnalyticsService.ts
    ├── MeetingBookingService.ts
    ├── MeetingNotesService.ts
    ├── MeetingNotificationService.ts
    ├── SchedulingController.ts
    ├── VideoConferencingService.ts
    └── index.ts
```

---

### 6. Compliance Services
**Location**: `services/compliance/`
**Files**: 13 total
**Mapped**: 1 file (7.7%)

#### Structure:
```
├── finserv-compliance/ (4 files)
│   ├── FinancialServicesComplianceService.ts
│   ├── ComplianceMonitoringService.ts
│   ├── RegulatoryFilingService.ts
│   └── index.ts
├── gdpr-compliance/ (2 files)
│   ├── ConsentManagementService.ts
│   └── types/index.ts
└── regulatory-validator/ (7 files)
    ├── RegulatoryValidatorService.ts [MAPPED]
    ├── ComplianceAuditService.ts
    ├── ComplianceReportingService.ts
    ├── RegulatoryRuleEngine.ts
    ├── index.ts
    └── types/index.ts
```

---

### 7. Infrastructure Services

#### Auto-Scaling Service
**Location**: `services/auto-scaling/`
**Files**: 6 total
**Mapped**: 1 file (16.7%)

```
/src/
├── AutoScalingService.ts [MAPPED]
├── index.ts
├── types/index.ts
└── services/
    ├── MetricsCollector.ts
    ├── ScalingDecisionEngine.ts
    └── ScalingExecutor.ts
```

#### CDN Management Service
**Location**: `services/cdn-management/`
**Files**: 5 total
**Mapped**: 0 files

```
/src/
├── index.ts
├── types/index.ts
├── providers/
│   └── CloudFrontProvider.ts
└── services/
    ├── AssetOptimizationService.ts
    └── CDNManagementService.ts
```

#### Performance Optimization Service
**Location**: `services/performance-optimization/`
**Files**: 6 total
**Mapped**: 1 file (16.7%)

```
/src/
├── PerformanceOptimizationService.ts
└── services/
    ├── ApiPerformanceOptimizer.ts
    ├── CachingStrategy.ts
    ├── DatabaseMonitor.ts
    ├── DatabaseOptimizer.ts [MAPPED]
    └── QueryPerformanceAnalyzer.ts
```

#### Load Testing Service
**Location**: `services/load-testing/`
**Files**: 5 total
**Mapped**: 0 files

#### Fixed Income Service
**Location**: `services/fixed-income-service/`
**Files**: 1 total
**Mapped**: 1 file (100%)

```
/src/structured-products/
└── StructuredProductsService.ts [MAPPED]
```

---

### 8. Infrastructure Monitoring
**Location**: `infrastructure/monitoring/`
**Files**: 52 total
**Mapped**: 2 files (3.8%)

#### Domains:
```
├── bottleneck-analysis/ (10 files)
├── business-metrics/ (9 files)
├── capacity-planning/ (9 files)
├── error-tracking/ (6 files)
│   └── ErrorTrackingService.ts [MAPPED]
├── resource-monitoring/ (8 files)
└── sla-monitoring/ (10 files)
    └── SLATrackingService.ts [MAPPED - partial]
```

---

### 9. Authentication Service
**Location**: `services/auth/`
**Files**: Multiple (core mapped)
**Mapped**: 1 file
**Pattern**: Singleton, Raw SQL

#### Key File:
- `auth.ts` [MAPPED] - Complete authentication logic

---

### 10. Frontend Applications

#### Web Portal
**Location**: `apps/web-portal/`
**Files**: 14 TSX files in src/
**Mapped**: 2 files (14.3%)

```
/src/
├── app/
│   ├── error.tsx
│   ├── global-error.tsx
│   ├── layout.tsx [MAPPED]
│   ├── not-found.tsx
│   ├── page.tsx
│   └── providers.tsx
└── components/
    ├── dashboard/
    │   ├── AssetAllocationChart.tsx
    │   ├── MarketSummary.tsx
    │   ├── PerformanceChart.tsx
    │   ├── PortfolioSummaryCard.tsx
    │   ├── RecentTransactions.tsx
    │   └── WelcomeCard.tsx
    ├── layout/
    │   └── DashboardLayout.tsx
    └── providers/
        └── ThemeProvider.tsx
```

#### Mobile App
**Location**: `apps/mobile/`
**Files**: Multiple
**Mapped**: 1 file

```
/src/
└── App.tsx [MAPPED]
```

---

### 11. Shared Libraries
**Location**: `libs/`
**Files**: 17 total
**Mapped**: 0 files

```
├── shared/
│   ├── kafka utilities
│   └── logger
└── types/
    └── shared TypeScript types
```

---

## Additional Services (Empty/Minimal)
- `services/analytics/` - No files
- `services/audit/` - No files
- `services/auth-service/` - Duplicate of auth?
- `services/document/` - No files
- `services/notification/` - No files
- `services/portfolio/` - No files (separate from portfolio-service)
- `services/reporting/` - No files
- `services/workflow/` - No files

---

## Architecture Summary

### Database Patterns (Inconsistent)
1. **Prisma ORM**: portfolio-service, market-data, performance-optimization
2. **Raw SQL**: auth service
3. **In-Memory**: monitoring services

### Service Patterns (Inconsistent)
1. **Class-based DI**: portfolio-service, market-data
2. **Singleton**: auth service
3. **EventEmitter**: trading-service, monitoring, client-service

### Communication
- Direct database access (primary)
- Kafka events (mocked)
- EventEmitter (local)
- Missing: REST APIs between services

---

## Progress Summary
- **Total Files**: 425
- **Files Mapped**: ~52
- **Coverage**: ~12.2%
- **Remaining**: ~373 files

## Critical Issues
1. Prisma import errors (13+ files)
2. Missing database models
3. Type safety issues (100+ 'any')
4. Architectural inconsistencies
5. No service mesh/discovery
6. No API gateway

---

## Next Steps to 100% Coverage
1. Complete portfolio-service (53 files remaining)
2. Complete trading-service (7 files remaining)
3. Complete market-data (24 files remaining)
4. Complete user-service (15 files remaining)
5. Complete client-service (25 files remaining)
6. Complete compliance services (12 files remaining)
7. Complete infrastructure monitoring (50 files remaining)
8. Map all utility services
9. Map shared libraries (17 files)
10. Complete frontend mapping

**Estimated Remaining Work**: Need to map ~373 more files to achieve 100% coverage as instructed.