# Investment Platform - Complete Project Architecture Map

## 🏗️ Project Structure Overview

```
InvestmentPlatform/
├── apps/                      # Frontend applications
│   ├── mobile/               # React Native mobile app
│   └── web-portal/           # Next.js web application
├── services/                 # Microservices (backend)
│   ├── analytics/            # Analytics and reporting service
│   ├── audit/                # Audit logging service
│   ├── auth/                 # Authentication service (OAuth 2.0, JWT)
│   ├── auth-service/         # Extended auth with ABAC
│   ├── auto-scaling/         # Auto-scaling management
│   ├── cdn-management/       # CDN and asset optimization
│   ├── client-service/       # Client relationship management
│   ├── compliance/           # Regulatory compliance
│   ├── document/             # Document processing (OCR, parsing)
│   ├── fixed-income-service/ # Fixed income analytics
│   ├── load-testing/         # Load testing utilities
│   ├── market-data/          # Market data feeds and processing
│   ├── notification/         # Notification service
│   ├── performance-optimization/ # Performance monitoring
│   ├── portfolio/            # Basic portfolio management
│   ├── portfolio-service/    # Advanced portfolio management
│   ├── reporting/            # Report generation
│   ├── trading-service/      # Order management and trading
│   ├── user-service/         # User management
│   └── workflow/             # Workflow automation
├── libs/                     # Shared libraries
│   ├── shared/              # Common utilities (logger, kafka, etc.)
│   └── types/               # Shared TypeScript interfaces
├── infrastructure/          # Infrastructure and DevOps
│   ├── continuity/          # Business continuity
│   ├── database/            # Database utilities
│   ├── monitoring/          # Monitoring and observability
│   └── security/            # Security implementations
├── deployment/              # Deployment configurations
├── disaster-recovery/       # DR procedures
├── mobile-app/             # Mobile app specific configs
├── security/               # Security audit tools
├── testing/                # Test suites
└── docs/                   # Documentation

```

---

## 📦 Core Services Architecture

### 1. Authentication Service (`services/auth/`)
**Purpose**: Core authentication and authorization
**Key Files**:
- `src/index.ts` - Express server setup
- `src/controllers/authController.ts` - Auth endpoints
- `src/services/auth.ts` - Auth business logic
- `src/services/jwt.ts` - JWT token management
- `src/middleware/auth.ts` - Auth middleware
- `src/mfa/MFAService.ts` - Multi-factor authentication
- `src/sso/SSOService.ts` - Single sign-on

**Dependencies**:
- PostgreSQL (user storage)
- Redis (session management)
- @libs/types (shared interfaces)
- @libs/shared (utilities)

**Exports to Other Services**:
- JWT verification middleware
- User context (id, email, tenantId, role)
- Authentication decorators

---

### 2. Portfolio Service (`services/portfolio-service/`)
**Purpose**: Comprehensive portfolio management
**Database**: PostgreSQL with Prisma ORM

**Key Directories**:
```
portfolio-service/src/
├── controllers/         # REST API endpoints
├── middleware/         # Auth, validation, error handling
├── models/            # Prisma models and interfaces
│   ├── alternatives/  # Alternative investments
│   ├── analytics/     # Analytics models
│   ├── assets/        # Asset classification
│   ├── clientDocuments/
│   ├── clientPortal/
│   ├── clientRelationship/
│   ├── compliance/
│   ├── derivatives/
│   ├── fixedIncome/
│   ├── performance/
│   ├── regulatory/
│   ├── reporting/
│   ├── riskManagement/
│   ├── structuredProducts/
│   └── trading/
├── routes/            # Express route definitions
├── services/          # Business logic
│   ├── alternatives/
│   ├── analytics/
│   ├── clientDocuments/
│   ├── clientPortal/
│   ├── clientRelationship/
│   ├── custodianIntegration/
│   ├── documentManagement/
│   ├── regulatory/
│   ├── reporting/
│   ├── riskManagement/
│   └── structuredProducts/
├── templates/         # Portfolio templates
└── utils/            # Utilities (prisma, logger, kafka)
```

**Critical Services**:
- `portfolioService.ts` - Core portfolio CRUD
- `positionService.ts` - Position management
- `transactionService.ts` - Transaction processing
- `performanceMeasurementService.ts` - Performance calculations
- `assetClassificationService.ts` - Asset categorization
- `riskManagement/*` - VaR, stress testing, Monte Carlo

**Prisma Schema Location**: `portfolio-service/prisma/schema.prisma`

---

### 3. Market Data Service (`services/market-data/`)
**Purpose**: Real-time and historical market data
**Database**: PostgreSQL with Prisma ORM

**Key Components**:
- `src/services/equitiesService.ts` - Equity pricing
- `src/services/fundsService.ts` - Fund NAVs
- `src/services/cashService.ts` - Money market rates
- `src/services/reitsService.ts` - REIT data
- `src/routes/*.ts` - REST endpoints
- `src/seeders/*.ts` - Data seeders

**Prisma Schema Location**: `market-data/prisma/schema.prisma`

---

### 4. Client Service (`services/client-service/`)
**Purpose**: Client relationship and communication

**Key Modules**:
- `src/onboarding/` - Client onboarding workflows
  - `OnboardingWorkflowStateMachine.ts`
  - `KYCAMLIntegrationService.ts`
  - `IdentityVerificationService.ts`
- `src/communication/` - Communication tracking
  - `CommunicationController.ts`
  - `ComplianceRecordingService.ts`
- `src/scheduling/` - Meeting management
  - `CalendarIntegrationService.ts`
  - `VideoConferencingService.ts`

---

### 5. Trading Service (`services/trading-service/`)
**Purpose**: Order management and settlement

**Key Components**:
- `src/settlement-risk/`
  - `SettlementRiskCalculationEngine.ts`
  - `CounterpartyRiskAssessmentService.ts`
  - `SettlementFailurePredictionService.ts`
  - `PreSettlementRiskChecksService.ts`

---

### 6. Compliance Service (`services/compliance/`)
**Purpose**: Regulatory compliance and reporting

**Sub-services**:
- `finserv-compliance/` - Financial services compliance
- `gdpr-compliance/` - GDPR data privacy
- `regulatory-validator/` - Rule validation engine

---

## 🔗 Service Dependencies & Communication

### Event-Driven Architecture (Kafka)
```
Portfolio Service ──publishes──> portfolio.updated
                              └──> position.created
                              └──> transaction.executed

Market Data Service ──publishes──> price.updated
                                └──> corporate.action

Analytics Service ──subscribes──> portfolio.updated
                              └──> price.updated
                ──publishes──> risk.alert
                           └──> performance.calculated

Compliance Service ──subscribes──> transaction.executed
                 ──publishes──> compliance.breach
                            └──> regulatory.filing
```

### Direct Service Dependencies
```
Portfolio Service ──depends on──> Market Data Service (prices)
                              └──> Auth Service (user context)
                              └──> Document Service (statements)

Trading Service ──depends on──> Portfolio Service (positions)
                           └──> Market Data Service (quotes)
                           └──> Compliance Service (pre-trade)

Client Service ──depends on──> Portfolio Service (holdings)
                          └──> Auth Service (authentication)
                          └──> Document Service (documents)
```

---

## 🗄️ Prisma Schemas Analysis

### Portfolio Service Schema (`services/portfolio-service/prisma/schema.prisma`)
**Current Models**:
- Portfolio
- Position
- Transaction
- Security
- Order
- User
- Tenant

**Missing Models** (per BUILD_FIXING_MASTER_PLAN):
- ❌ AssetClass (enhanced version)
- ❌ AssetSubClass
- ❌ InstrumentClassification (enhanced)
- ❌ AssetAllocation
- ❌ RealTimeAnalyticsEvent
- ❌ Comprehensive enums (AssetType, RiskLevel, etc.)

### Market Data Schema (`services/market-data/prisma/schema.prisma`)
**Current Models**:
- Equity
- Fund
- Cash
- REIT
- HistoricalPrice
- CorporateAction

**Issues**:
- Separate from portfolio service schema
- No relationships to portfolio positions
- Missing derivative and structured product models

---

## 🔴 Critical Type Mismatches

### 1. Asset Classification
**Business Logic Expects**:
```typescript
interface AssetClass {
  id: string;
  tenantId: string;
  name: string;
  code: string;          // Missing in schema
  assetType: AssetType;  // Missing enum
  riskLevel: RiskLevel;  // Missing enum
  liquidityTier: LiquidityTier; // Missing enum
  // ... more fields
}
```

**Prisma Schema Has**:
```prisma
model AssetClass {
  id          String
  tenantId    String
  name        String
  description String?
  // Missing most fields!
}
```

### 2. Position Model
**Business Logic Expects**:
- `currentValue` field
- `instrumentClassification` relation
- `security` relation

**Prisma Schema Has**:
- `marketValue` field (different name)
- No classification relations

### 3. Analytics Events
**Business Logic Expects**:
- RealTimeAnalyticsEvent model
- AnalyticsEventType enum
- AnalyticsMetricType enum

**Prisma Schema Has**:
- None of these models exist

---

## 📊 Shared Type Contracts (`libs/types/`)

### Core Interfaces
- `User` - User authentication data
- `Tenant` - Multi-tenant context
- `ApiResponse` - Standard API response
- `PaginatedResponse` - Pagination wrapper
- `ErrorResponse` - Error format

### Missing Shared Types
- ❌ `AssetClassification` interfaces
- ❌ `RiskMetrics` types
- ❌ `PerformanceMetrics` types
- ❌ `ComplianceRules` interfaces

---

## 🏭 Infrastructure Services

### Monitoring (`infrastructure/monitoring/`)
- `bottleneck-analysis/` - Performance bottleneck detection
- `business-metrics/` - Business KPI tracking
- `capacity-planning/` - Resource planning
- `error-tracking/` - Error monitoring
- `resource-monitoring/` - Resource utilization
- `sla-monitoring/` - SLA compliance

### Security (`infrastructure/security/`)
- `container-scanner.ts` - Container vulnerability scanning
- `dependency-scanner/` - Dependency vulnerability checks
- `ids-ips.ts` - Intrusion detection
- `network-segmentation.ts` - Network security

---

## 🎯 Key Business Logic Patterns

### 1. Multi-Tenant Isolation
Every service query includes `tenantId`:
```typescript
const portfolio = await prisma.portfolio.findFirst({
  where: {
    id: portfolioId,
    tenantId: req.user.tenantId // Always filter by tenant
  }
});
```

### 2. Event Publishing
After significant operations:
```typescript
await kafkaProducer.send({
  topic: 'portfolio.updated',
  messages: [{
    value: JSON.stringify({
      tenantId,
      portfolioId,
      timestamp: new Date()
    })
  }]
});
```

### 3. Financial Calculations
High precision using Decimal:
```typescript
import { Decimal } from '@prisma/client/runtime';
const value = new Decimal(position.quantity)
  .mul(new Decimal(price))
  .toNumber();
```

### 4. Compliance Checks
Pre and post-trade:
```typescript
const violations = await complianceService.checkRules({
  portfolio,
  proposedTrade,
  rules: await getRulesForClient(clientId)
});
```

---

## 🔥 Hot Paths (High Traffic Areas)

1. **Portfolio Valuation** - Called constantly for real-time NAV
2. **Position Updates** - Market data triggers mass updates
3. **Risk Calculations** - VaR computed frequently
4. **Performance Metrics** - TWR/IRR calculations
5. **Compliance Monitoring** - Every trade checked

---

## 📝 Configuration Files

### Root Level
- `package.json` - Monorepo configuration
- `lerna.json` - Lerna workspace config
- `tsconfig.json` - Base TypeScript config
- `docker-compose.yml` - Local development setup

### Service Level
Each service has:
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config
- `Dockerfile` - Container definition
- `.env.example` - Environment variables

---

## 🚨 Critical Issues Summary

1. **Prisma Schema Gaps**: Missing ~15+ models and ~10+ enums
2. **Type Mismatches**: Field names don't match (currentValue vs marketValue)
3. **Missing Relations**: No proper foreign keys defined
4. **Separate Schemas**: Market data and portfolio schemas are disconnected
5. **Enum Inconsistencies**: Business logic uses enums that don't exist in Prisma

---

*This map will be continuously updated as more discoveries are made during the fix process.*