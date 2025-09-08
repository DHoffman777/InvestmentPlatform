# Portfolio Service - Detailed Analysis

## File: `services/portfolio-service/src/services/portfolioService.ts`

### Imports & Dependencies
```typescript
import { PrismaClient, Portfolio, Prisma } from '@prisma/client/runtime';
import { logger } from '../utils/logger';
import { getKafkaService } from '../utils/kafka-mock';
```

**Issue Found #1**: Import from `@prisma/client/runtime` should be `@prisma/client`

### Key Interfaces Defined

#### CreatePortfolioRequest
- Contains portfolio creation fields
- Includes `tenantId`, `ownerId`, `createdBy`, `updatedBy`
- Portfolio types: MANAGED, ADVISORY, DISCRETIONARY, MODEL_BASED, CUSTOM
- Risk profiles: CONSERVATIVE, MODERATE_CONSERVATIVE, MODERATE, MODERATE_AGGRESSIVE, AGGRESSIVE

#### PortfolioSummary
- Simplified view with financial metrics
- Includes `totalValue`, `cashBalance`, `totalGainLoss`, `dayChange`
- Has percentage calculations

### Class: PortfolioService

#### Dependencies
- `PrismaClient` - Database access
- `kafkaService` - Event publishing (using mock)

#### Core Methods

##### `getPortfolios(request: GetPortfoliosRequest)`
- **Purpose**: Fetch portfolios with pagination and filtering
- **Multi-tenant**: Filters by `tenantId`
- **Authorization**: Only returns portfolios where user is owner OR manager
- **Database calls**: 
  - `prisma.portfolio.findMany()` with complex where clause
  - `prisma.portfolio.count()` for pagination
- **Returns**: Paginated portfolio list with counts

##### `getPortfolioById(id, tenantId, userId)`
- **Purpose**: Get single portfolio with positions
- **Multi-tenant**: Enforces tenantId check
- **Authorization**: Owner or manager only
- **Includes**: Top 10 positions by market value
- **Database relations**: Includes positions and transaction counts

##### `createPortfolio(data: CreatePortfolioRequest)`
- **Purpose**: Create new portfolio
- **Decimal handling**: Converts percentages to Prisma.Decimal
- **Event publishing**: Publishes 'portfolio.created' event to Kafka
- **Default values**: Sets status to 'ACTIVE', currency to 'USD'

### Prisma Model Expectations

From this file, the Portfolio model needs:
- `id`, `name`, `description`
- `portfolioType`, `status`
- `totalValue`, `cashBalance` (likely Decimal fields)
- `baseCurrency`, `riskProfile`
- `investmentObjective`
- `minCashPercentage`, `maxCashPercentage` (Decimal nullable)
- `tenantId`, `ownerId`, `managerId`
- `createdBy`, `updatedBy`
- `createdAt`, `updatedAt`
- Relations: `positions`, `transactions`

### Event Publishing Pattern
```typescript
await this.publishPortfolioEvent('portfolio.created', portfolio);
```
- Events sent to Kafka
- Includes full portfolio object
- Event types: portfolio.created, portfolio.updated, portfolio.deleted

---

## File: `services/portfolio-service/src/services/positionService.ts`

### Imports & Dependencies
```typescript
import { PrismaClient, Prisma } from '@prisma/client/runtime';  // ISSUE: Should be '@prisma/client'
import { logger } from '../utils/logger';
import { Decimal } from 'decimal.js';  // External decimal library
```

### Key Interfaces

#### PositionAggregation
- Aggregates positions across portfolios
- All financial values use `Decimal` type from decimal.js
- Includes unrealized gains, day changes with percentages
- Contains tax lots array

#### TaxLotMethod
- Supports: FIFO, LIFO, HIFO, SPECIFIC_ID, AVERAGE_COST
- Tracks quantity, cost basis, realized gains

### Class: PositionService

#### Core Methods

##### `getAggregatedPositions(tenantId, portfolioIds?, assetClasses?)`
- **Purpose**: Aggregate positions across multiple portfolios
- **Multi-tenant**: Filters by tenantId through portfolio relation
- **Complex logic**: 
  - Groups positions by securityId
  - Calculates weighted averages for cost basis
  - Computes unrealized gains/losses
  - Handles day change percentages
- **Database relations**: Includes security, taxLots, portfolio
- **Financial calculations**: Uses Prisma.Decimal for all money values

##### `calculateTaxLots(positionId, sellQuantity, method)`
- **Purpose**: Calculate tax implications for sales
- **Tax methods**: FIFO, LIFO, HIFO, specific identification
- **Sorting logic**: Different orderBy based on method
- **Database**: Fetches tax lots with quantity > 0

### Prisma Model Expectations

Position model needs:
- `id`, `portfolioId`, `securityId`
- `quantity` (Decimal)
- `costBasis`, `marketValue` (Decimal, nullable)
- `dayChange` (Decimal, nullable)
- Relations: `portfolio`, `security`, `taxLots`

TaxLot model needs:
- `quantity` (Decimal)
- `costBasis` (Decimal)
- `openDate` (DateTime)
- Relation to Position

Security model needs:
- `assetClass` field

---

## Summary of Findings So Far

### Key Patterns
1. **Multi-tenancy**: Every query includes `tenantId`
2. **Authorization**: Owner/manager checks on every access
3. **Event-driven**: Publishes events after state changes
4. **Decimal handling**: Financial values use Prisma.Decimal
5. **Pagination**: Standard skip/take pattern

### Issues Identified
1. Import from wrong Prisma path (`/runtime` should be removed)
2. Type casting with `as any` for enums (lines 89, 93)
3. Error handling catches `any` instead of typed errors

### Dependencies Graph
```
portfolioService.ts
    ├── @prisma/client (Database)
    ├── ../utils/logger (Logging)
    └── ../utils/kafka-mock (Events)
```

---

*Next: Analyzing positionService.ts to understand position management...*