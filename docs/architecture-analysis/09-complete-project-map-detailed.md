# Complete Investment Platform Project Map (Detailed)

## Executive Summary
- **Project Type**: Multi-tenant Investment Management Platform
- **Architecture**: Microservices with Monorepo (Lerna)
- **Primary Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM (inconsistent usage)
- **Frontend**: Next.js 14 (web), React Native (mobile)
- **Total Services**: 20+ microservices
- **Total Files**: 200+ TypeScript files across all services
- **Mapping Coverage**: ~15% (continuing to expand)

---

## Service Architecture Overview

### Domain Services (Core Business Logic)

#### 1. Portfolio Management Service (`services/portfolio-service/`)
**Status**: Partially Mapped (10/66 files)
**Database**: Prisma ORM
**Pattern**: Class-based with Constructor DI

**Subdirectories**:
- `/services/` - 66 service files total
  - `/alternatives/` - Alternative investments (1 file)
  - `/analytics/` - 8 analytics services (ML, BI, visualization)
  - `/clientDocuments/` - 2 document services
  - `/clientPortal/` - 2 portal services
  - `/clientRelationship/` - 4 relationship services
  - `/custodianIntegration/` - 4 integration services + 3 adapters
  - `/documentManagement/` - 7 document processing services
  - `/regulatory/` - 8 regulatory services
  - `/reporting/` - 3 reporting services
  - `/riskManagement/` - 7 risk services
  - `/structuredProducts/` - 4 structured product services

**Key Services Mapped**:
1. `portfolioService.ts` (428 lines) - Portfolio CRUD, multi-tenancy
2. `positionService.ts` (387 lines) - Position tracking, aggregation
3. `transactionService.ts` (735 lines) - Trade capture, tax lots
4. `assetClassificationService.ts` (864 lines) - GICS, ESG scoring
5. `ClientRelationshipService.ts` (1,113 lines) - Largest service file
6. `VaRCalculationService.ts` (100 lines) - Risk calculations
7. `complianceMonitoringService.ts` (150 lines) - Compliance checks
8. `performanceMeasurementService.ts` (150 lines) - Performance metrics
9. `orderManagementService.ts` (150 lines) - Order lifecycle
10. `fixedIncomeAnalyticsService.ts` (150 lines) - Bond analytics

**Critical Issues Found**:
- Wrong Prisma imports in 13+ files
- Missing Transaction model fields
- Type casting with 'any' everywhere
- Decimal type confusion

---

#### 2. Market Data Service (`services/market-data/`)
**Status**: Partially Mapped (1 file analyzed)
**Database**: Prisma ORM
**Pattern**: Class-based services

**Key Features**:
- Security master data
- Equity types (Common, Preferred, ADR/GDR)
- Fund data management
- REIT data
- Cash equivalents
- Corporate actions
- Historical prices

**Services Mapped**:
1. `equitiesService.ts` (505 lines) - Equity data management

---

#### 3. Trading Service (`services/trading-service/`)
**Status**: Partially Mapped (1/8 files)
**Location**: All in `/settlement-risk/` subdirectory
**Pattern**: EventEmitter-based

**Settlement Risk Services** (8 files):
1. `SettlementRiskCalculationEngine.ts` (150 lines mapped) - Risk calculations
2. `CounterpartyRiskAssessmentService.ts`
3. `PreSettlementRiskChecksService.ts`
4. `RiskMitigationWorkflowsService.ts`
5. `SettlementFailurePredictionService.ts`
6. `SettlementRiskController.ts`
7. `SettlementRiskReportingService.ts`
8. `SettlementTimelineTrackingService.ts`

---

#### 4. Client Service (`services/client-service/`)
**Status**: Partially Mapped
**Pattern**: EventEmitter controllers

**Domains**:
- `/onboarding/` - Onboarding workflows, KYC/AML
- `/scheduling/` - Meeting management, calendars
- `/communication/` - Client communications

**Key Service Mapped**:
1. `OnboardingController.ts` (100 lines) - Workflow orchestration

---

#### 5. User Service (`services/user-service/`)
**Status**: Partially Mapped
**Pattern**: Mixed

**Domains**:
- `/activity-monitoring/` - User activity tracking
- `/self-service/` - User self-service portal

**Key Service Mapped**:
1. `ActivityTrackingService.ts` (100 lines) - Activity monitoring

---

#### 6. Authentication Service (`services/auth/`)
**Status**: Fully Mapped
**Database**: Raw SQL with custom abstraction
**Pattern**: Singleton

**Key Features**:
- JWT management
- MFA support
- SSO integration
- Account lockout

**Services Mapped**:
1. `auth.ts` (258 lines) - Complete auth logic

---

### Compliance Services (`services/compliance/`)
**Status**: Not Mapped (13 files found)

**Sub-services**:
1. **finserv-compliance/** (4 files)
   - `FinancialServicesComplianceService.ts`
   - `ComplianceMonitoringService.ts`
   - `RegulatoryFilingService.ts`
   - Types and index

2. **gdpr-compliance/** (2 files)
   - `ConsentManagementService.ts`
   - Types

3. **regulatory-validator/** (5 files)
   - `RegulatoryValidatorService.ts`
   - `RegulatoryRuleEngine.ts`
   - `ComplianceAuditService.ts`
   - `ComplianceReportingService.ts`
   - Types and index

---

### Infrastructure Services

#### Auto-Scaling Service (`services/auto-scaling/`)
**Status**: Not Mapped

#### CDN Management (`services/cdn-management/`)
**Status**: Not Mapped

#### Load Testing (`services/load-testing/`)
**Status**: Not Mapped

#### Performance Optimization (`services/performance-optimization/`)
**Status**: Not Mapped

#### Notification Service (`services/notification/`)
**Status**: Not Mapped

---

### Infrastructure Monitoring (`infrastructure/monitoring/`)
**Status**: Partially Mapped (1/52 files)
**Pattern**: EventEmitter with in-memory storage

**Domains** (52 total files):

1. **bottleneck-analysis/** (10 files)
   - Performance bottleneck detection
   - Root cause analysis
   - Performance optimization

2. **business-metrics/** (9 files)
   - KPI tracking
   - Executive dashboards
   - Real-time streaming

3. **capacity-planning/** (9 files)
   - Resource prediction
   - Scaling recommendations
   - Cost optimization

4. **error-tracking/** (6 files)
   - Error monitoring
   - Recovery services
   - Correlation analysis

5. **resource-monitoring/** (8 files)
   - Resource utilization
   - Cost analysis
   - Efficiency analytics

6. **sla-monitoring/** (10 files)
   - SLA tracking and compliance
   - Breach detection
   - Customer notifications

**Key Service Mapped**:
1. `SLATrackingService.ts` (partial) - SLA monitoring

---

### Security Infrastructure (`infrastructure/security/`)
**Status**: Not Mapped

**Components**:
- Container scanning
- Dependency vulnerability scanning
- IDS/IPS
- Network segmentation

---

## Frontend Applications

### Web Portal (`apps/web-portal/`)
**Status**: Mapped
**Stack**: Next.js 14, TypeScript, Redux, Material-UI
**Pattern**: App Router

**Key Files Mapped**:
1. `layout.tsx` (38 lines) - Root layout with providers
2. Various dashboard components
3. Redux store setup
4. Theme configuration

**Features**:
- Server-side rendering
- Error boundaries
- Theme customization
- Dashboard widgets

---

### Mobile App (`apps/mobile/`)
**Status**: Mapped
**Stack**: React Native, TypeScript, Redux
**Pattern**: Standard React Native

**Key File Mapped**:
1. `App.tsx` (49 lines) - App root with providers

**Features**:
- Biometric authentication
- Offline support
- Push notifications
- Network monitoring

---

## Shared Libraries

### `libs/shared/`
- Kafka utilities (mocked)
- Logger
- Common utilities

### `libs/types/`
- Shared TypeScript types
- **Issue**: Only used by auth service, not other services

---

## Database Schema Issues

### Missing Models
1. Settlement-related models
2. Security relationship in Transaction
3. Various field definitions

### Prisma Issues
- Wrong imports from `@prisma/client/runtime/library`
- Should be: `import { Prisma } from '@prisma/client'`
- Affects 13+ files

---

## Architectural Patterns Summary

### Database Access (3 patterns - INCONSISTENT)
1. **Prisma ORM**: portfolio-service, market-data
2. **Raw SQL**: auth service
3. **In-Memory**: monitoring services

### Service Instantiation (3 patterns - INCONSISTENT)
1. **Class with DI**: portfolio-service
2. **Singleton**: auth service
3. **EventEmitter**: monitoring, client-service

### Multi-Tenancy (2 patterns - INCONSISTENT)
1. **Query filtering**: `WHERE tenantId = ?`
2. **Database context**: `setTenantContext()`

### Communication Patterns
1. **Direct DB access**: Primary method
2. **Kafka events**: Async (mocked)
3. **EventEmitter**: Local events
4. **Missing**: No REST/gRPC between services

---

## Critical Technical Debt

### Immediate (Blocking Production)
1. Fix Prisma imports (13+ files)
2. Add missing database models
3. Fix Transaction model fields
4. Resolve Decimal type confusion

### High Priority
1. Standardize database access pattern
2. Standardize service instantiation
3. Remove 'any' type usage (100+ occurrences)
4. Implement shared types usage

### Infrastructure Gaps
1. No API gateway
2. No service discovery
3. No distributed tracing
4. No circuit breakers
5. No health checks

---

## Project Statistics

### Current Mapping Progress
- **Total Services**: 20+
- **Total TypeScript Files**: 200+
- **Files Fully Mapped**: ~30
- **Lines Analyzed**: ~5,000
- **Estimated Total Lines**: 50,000+
- **Coverage**: ~15%

### Complexity Metrics
- **Largest File**: ClientRelationshipService.ts (1,113 lines)
- **Most Complex Domain**: portfolio-service (66 service files)
- **Simplest Service**: auth (258 lines, but uses raw SQL)

### Technical Debt Metrics
- **Import Errors**: 13+ files
- **Type Issues**: 100+ 'any' usages
- **Missing Models**: 4+ Prisma models
- **Pattern Inconsistencies**: 3 database patterns, 3 service patterns

---

## Next Steps for Complete Mapping

### Remaining Work (85% of project):
1. Complete portfolio-service mapping (56/66 files remaining)
2. Complete trading-service mapping (7/8 files remaining)
3. Map all compliance services (13 files)
4. Map all infrastructure monitoring (51/52 files remaining)
5. Map infrastructure security services
6. Map utility services (auto-scaling, CDN, performance, etc.)
7. Complete market-data service mapping
8. Map notification service
9. Document all route handlers
10. Map all model definitions
11. Document all middleware
12. Map test files if present

### Estimated Time to 100% Coverage
At current pace (~15% in first pass), need approximately 5-6 more passes through the codebase to achieve complete mapping.

---

## Conclusion

This is a large, complex investment management platform with significant architectural inconsistencies and technical debt. The platform appears functional but requires substantial standardization and infrastructure improvements for production readiness.

The mapping effort has revealed:
- Rich business logic implementation
- Multiple architectural anti-patterns
- Missing critical infrastructure
- Inconsistent coding standards
- Type safety issues throughout

Continuing the systematic mapping process to reach 100% coverage before attempting any fixes, as instructed.