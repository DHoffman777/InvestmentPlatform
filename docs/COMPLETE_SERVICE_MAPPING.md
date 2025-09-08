# Complete Investment Platform Service Mapping

## Overview
This document provides a comprehensive mapping of every service, its purpose, dependencies, and relationships within the Investment Platform.

---

## 🏛️ Core Architecture Principles

### Domain-Driven Design
- Each service owns its domain logic
- Services communicate via events (Kafka) or REST APIs
- Shared types in `libs/types`
- No direct database access across services

### Multi-Tenant Isolation
- Every query includes `tenantId`
- Data isolation at database level
- Tenant context passed in JWT tokens

### Event-Driven Communication
```
Service A → Kafka Event → Service B
         ↓
    Event Store
```

---

## 📦 Service Catalog

### 1. Portfolio Service (`services/portfolio-service/`)
**Purpose**: Core portfolio management, positions, transactions, performance

#### Sub-Services Structure:
```
portfolio-service/src/services/
├── alternatives/
│   └── AlternativeInvestmentsService.ts
│       - Purpose: Private equity, hedge funds, real estate
│       - Dependencies: Prisma, Kafka
│       - Exports: Capital calls, NAV updates, J-curve analysis
│
├── analytics/
│   ├── AnomalyDetectionService.ts
│   │   - Purpose: Detect unusual patterns in portfolio data
│   │   - Dependencies: ML libraries, RealTimeAnalyticsEvent model
│   │   - Exports: Anomaly alerts, pattern detection
│   │
│   ├── BusinessIntelligenceService.ts
│   │   - Purpose: Executive dashboards, KPIs
│   │   - Dependencies: Data warehouse connections
│   │   - Exports: BI reports, metrics
│   │
│   ├── DashboardBuilderService.ts
│   │   - Purpose: Custom dashboard creation
│   │   - Dependencies: Widget templates, visualization libs
│   │   - Exports: Dashboard configurations
│   │
│   ├── DataVisualizationService.ts
│   │   - Purpose: Chart and graph generation
│   │   - Dependencies: D3.js, Chart.js
│   │   - Exports: Visual components
│   │
│   ├── DrillDownService.ts
│   │   - Purpose: Hierarchical data exploration
│   │   - Dependencies: Aggregation engine
│   │   - Exports: Drill-down navigation
│   │
│   ├── MachineLearningInsightsService.ts
│   │   - Purpose: ML-based predictions and insights
│   │   - Dependencies: TensorFlow, Python ML services
│   │   - Exports: Predictions, recommendations
│   │
│   ├── PredictiveModelingService.ts
│   │   - Purpose: Future performance predictions
│   │   - Dependencies: Historical data, ML models
│   │   - Exports: Forecasts, scenarios
│   │
│   └── RealTimeAnalyticsService.ts
│       - Purpose: Live portfolio analytics
│       - Dependencies: WebSocket, Redis, RealTimeAnalyticsEvent
│       - Exports: Real-time metrics stream
│
├── clientDocuments/
│   ├── ClientDocumentService.ts
│   │   - Purpose: Document storage and retrieval
│   │   - Dependencies: S3, Prisma ClientDocument model
│   │   - Exports: Document CRUD operations
│   │
│   └── DocumentProcessingService.ts
│       - Purpose: OCR, parsing, data extraction
│       - Dependencies: AWS Textract, ML services
│       - Exports: Extracted data, document classification
│
├── clientPortal/
│   ├── ClientPortalService.ts
│   │   - Purpose: Client-facing portal backend
│   │   - Dependencies: Auth service, Portfolio data
│   │   - Exports: Client views, permissions
│   │
│   └── DashboardWidgetService.ts
│       - Purpose: Widget management for client dashboards
│       - Dependencies: Widget templates
│       - Exports: Widget configurations
│
├── clientRelationship/
│   ├── ClientRelationshipService.ts
│   │   - Purpose: CRM functionality
│   │   - Dependencies: Prisma ClientProfile model
│   │   - Exports: Client management APIs
│   │
│   ├── HouseholdManagementService.ts
│   │   - Purpose: Family/household grouping
│   │   - Dependencies: HouseholdGroup model
│   │   - Exports: Household aggregations
│   │
│   ├── InvestmentObjectivesService.ts
│   │   - Purpose: Goal setting and tracking
│   │   - Dependencies: ClientInvestmentObjective model
│   │   - Exports: Objectives, constraints
│   │
│   └── RiskProfilingService.ts
│       - Purpose: Risk assessment and suitability
│       - Dependencies: RiskProfileQuestionnaire model
│       - Exports: Risk scores, recommendations
│
├── custodianIntegration/
│   ├── CustodianIntegrationService.ts
│   │   - Purpose: Abstract custodian interface
│   │   - Dependencies: Adapter pattern
│   │   - Exports: Unified custodian API
│   │
│   └── adapters/
│       ├── FidelityIntegrationService.ts
│       ├── PershingIntegrationService.ts
│       └── SchwabIntegrationService.ts
│           - Purpose: Custodian-specific implementations
│           - Dependencies: Custodian APIs
│           - Exports: Normalized data
│
├── documentManagement/
│   ├── OCRService.ts
│   ├── DataExtractionService.ts
│   ├── DocumentFilingService.ts
│   ├── DocumentSearchService.ts
│   ├── DocumentVersionControlService.ts
│   ├── MultiLanguageProcessingService.ts
│   └── TemplateRecognitionService.ts
│       - Purpose: Comprehensive document processing
│       - Dependencies: AWS Textract, Elasticsearch
│       - Exports: Document intelligence APIs
│
├── regulatory/
│   ├── AutomatedFilingWorkflowsService.ts
│   ├── BestExecutionService.ts
│   ├── ClientRegulatoryReportsService.ts
│   ├── Form13FService.ts
│   ├── FormADVService.ts
│   ├── FormPFService.ts
│   ├── GIPSCompositeService.ts
│   └── MultiJurisdictionComplianceService.ts
│       - Purpose: Regulatory compliance and reporting
│       - Dependencies: Compliance rules engine
│       - Exports: Regulatory filings, compliance checks
│
├── reporting/
│   ├── ReportGenerationService.ts
│   ├── ReportTemplateService.ts
│   └── ReportingEngineService.ts
│       - Purpose: Client and regulatory reporting
│       - Dependencies: Template engine, PDF generation
│       - Exports: Reports, statements
│
├── riskManagement/
│   ├── CorrelationAnalysisService.ts
│   ├── CounterpartyExposureTrackingService.ts
│   ├── CreditRiskMonitoringService.ts
│   ├── LiquidityRiskService.ts
│   ├── MonteCarloSimulationService.ts
│   ├── RiskLimitMonitoringService.ts
│   ├── StressTestingService.ts
│   └── VaRCalculationService.ts
│       - Purpose: Comprehensive risk analytics
│       - Dependencies: Market data, positions
│       - Exports: Risk metrics, alerts
│
├── structuredProducts/
│   ├── BarrierMonitoringService.ts
│   ├── DocumentParsingService.ts
│   ├── StructuredProductsService.ts
│   └── StructuredProductsValuationService.ts
│       - Purpose: Complex structured product handling
│       - Dependencies: Pricing models, market data
│       - Exports: Valuations, barrier alerts
│
└── Core Services:
    ├── portfolioService.ts - Portfolio CRUD
    ├── positionService.ts - Position management
    ├── transactionService.ts - Transaction processing
    ├── performanceMeasurementService.ts - TWR, IRR calculations
    ├── assetClassificationService.ts - Asset categorization
    ├── cashEquivalentService.ts - Cash management
    ├── complianceMonitoringService.ts - Compliance checks
    ├── complianceWorkflowService.ts - Compliance workflows
    ├── derivativesAnalyticsService.ts - Options, futures analytics
    ├── fixedIncomeAnalyticsService.ts - Bond analytics
    ├── fixedIncomeService.ts - Fixed income management
    ├── instrumentReferenceDataService.ts - Security master
    ├── orderManagementService.ts - Order processing
    ├── postTradeProcessingService.ts - Settlement
    └── regulatoryRuleEngine.ts - Rules processing
```

#### Key Dependencies:
- **Database**: PostgreSQL via Prisma
- **Cache**: Redis for performance data
- **Events**: Kafka for portfolio updates
- **External**: Market data providers, custodians

#### Published Events:
- `portfolio.created`
- `portfolio.updated`
- `position.updated`
- `transaction.executed`
- `compliance.breach`
- `risk.alert`

#### Consumed Events:
- `market.price.updated`
- `corporate.action`
- `client.updated`

---

### 2. Market Data Service (`services/market-data/`)
**Purpose**: Real-time and historical market data management

#### Structure:
```
market-data/src/
├── services/
│   ├── equitiesService.ts - Stock prices
│   ├── fundsService.ts - Mutual fund/ETF NAVs
│   ├── cashService.ts - Money market rates
│   ├── reitsService.ts - REIT pricing
│   └── marketDataService.ts - Aggregation layer
├── routes/
│   └── [REST endpoints for each asset type]
└── seeders/
    └── [Data seeding scripts]
```

#### Dependencies:
- Bloomberg API
- Refinitiv/Reuters
- Yahoo Finance (backup)
- PostgreSQL (historical storage)
- Redis (real-time cache)

#### Published Events:
- `price.updated`
- `corporate.action.announced`
- `market.hours.changed`

---

### 3. Auth Service (`services/auth/`)
**Purpose**: Authentication, authorization, session management

#### Structure:
```
auth/src/
├── controllers/
│   └── authController.ts - Login, logout, refresh
├── services/
│   ├── auth.ts - Core auth logic
│   └── jwt.ts - Token management
├── middleware/
│   └── auth.ts - Auth verification
├── mfa/
│   └── MFAService.ts - 2FA implementation
└── sso/
    └── SSOService.ts - SAML, OAuth providers
```

#### Dependencies:
- PostgreSQL (user storage)
- Redis (session cache)
- External IdPs (Okta, Auth0)

#### Exports:
- JWT tokens with user context
- Auth middleware for other services
- User/tenant information

---

### 4. Client Service (`services/client-service/`)
**Purpose**: Client onboarding, communication, scheduling

#### Key Components:
- **Onboarding**: KYC/AML, document collection
- **Communication**: Email, chat, video tracking
- **Scheduling**: Calendar integration, meetings

#### Dependencies:
- Portfolio service (account creation)
- Document service (KYC documents)
- Compliance service (AML checks)

---

### 5. Trading Service (`services/trading-service/`)
**Purpose**: Order management, execution, settlement

#### Key Components:
- Order routing
- Execution management
- Settlement risk monitoring
- Counterparty management

#### Dependencies:
- Portfolio service (positions)
- Market data (pricing)
- Custodians (execution)

---

### 6. Infrastructure Services (`infrastructure/`)

#### Monitoring:
- **bottleneck-analysis/**: Performance bottleneck detection
- **business-metrics/**: KPI tracking
- **capacity-planning/**: Resource planning
- **error-tracking/**: Error monitoring
- **resource-monitoring/**: Resource utilization
- **sla-monitoring/**: SLA compliance

#### Security:
- **container-scanner**: Vulnerability scanning
- **dependency-scanner**: Package security
- **ids-ips**: Intrusion detection
- **network-segmentation**: Network security

---

## 🔄 Data Flow Patterns

### 1. Portfolio Valuation Flow
```
Market Data Service → Price Update Event
                    ↓
Portfolio Service → Recalculate Positions
                 ↓
Analytics Service → Update Risk Metrics
                 ↓
Client Portal → Display Updated Values
```

### 2. Trade Execution Flow
```
Client Portal → Place Order
            ↓
Trading Service → Compliance Check
              ↓
Custodian Integration → Execute
                     ↓
Portfolio Service → Update Positions
                 ↓
Reporting Service → Generate Confirmation
```

### 3. Compliance Check Flow
```
Any Service → Action Request
          ↓
Compliance Service → Rule Evaluation
                  ↓
Success: Continue → Action Executed
Failure: Block → Compliance Alert
```

---

## 🔗 Critical Integration Points

### 1. Prisma Schema Dependencies
Each service expects specific Prisma models:
- Portfolio Service: 70+ models (Portfolio, Position, Transaction, etc.)
- Market Data: Separate schema (Equity, Fund, Cash, REIT)
- Auth Service: User, Tenant models

### 2. Shared Types (`libs/types/`)
- User context
- Tenant context
- API response formats
- Error types

### 3. Event Schema
All events follow format:
```typescript
{
  eventType: string;
  tenantId: string;
  timestamp: Date;
  data: any;
  metadata?: Record<string, any>;
}
```

---

## 🚨 Current Issues Root Cause Analysis

### 1. Missing Models in Prisma
- `RealTimeAnalyticsEvent` - Used by analytics services
- `Error` model - Used by error tracking
- Enhanced `AssetClass` - Business logic expects more fields

### 2. Type Mismatches
- Business logic uses enums not in Prisma
- Field names differ (currentValue vs marketValue)
- Decimal vs number conversions

### 3. Service Boundaries
- Some services import from others directly
- Should communicate via events/APIs only

---

## 📋 Next Steps for Fix

1. **Complete Prisma Schema Enhancement**
   - Add all missing models
   - Align field names with business logic
   - Add missing enums

2. **Generate Prisma Client**
   - Run `npx prisma generate`
   - Update type imports

3. **Fix Service Boundaries**
   - Remove direct imports between services
   - Use events or REST APIs

4. **Validate Business Logic**
   - Ensure calculations remain accurate
   - Test multi-tenant isolation
   - Verify compliance rules

---

*This is a living document that should be updated as the architecture evolves.*