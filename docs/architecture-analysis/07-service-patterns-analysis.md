# Service Patterns Analysis

## Architecture Patterns Found

### 1. Database Access Patterns

#### Pattern A: Prisma ORM
**Used by**: portfolio-service, market-data
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```

#### Pattern B: Raw SQL with Custom Abstraction
**Used by**: auth service
```typescript
import { DatabaseService } from '../config/database';
const db = DatabaseService.getInstance();
await db.queryOne<User>('SELECT * FROM users WHERE email = $1', [email]);
```

#### Pattern C: No Database (In-Memory)
**Used by**: infrastructure/monitoring services
```typescript
private slas: Map<string, SLADefinition> = new Map();
private metrics: Map<string, SLAMetric> = new Map();
```

### 2. Service Instantiation Patterns

#### Pattern A: Class-based with Constructor DI
**Used by**: portfolio-service, market-data, client-service
```typescript
export class PortfolioService {
  constructor(private prisma: PrismaClient) {}
}
```

#### Pattern B: Singleton Pattern
**Used by**: auth service
```typescript
export class AuthService {
  private static instance: AuthService;
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }
}
```

#### Pattern C: EventEmitter Pattern
**Used by**: monitoring services, onboarding controllers
```typescript
export class SLATrackingService extends EventEmitter {
  constructor(config: SLATrackingConfig) {
    super();
  }
}
```

### 3. Multi-Tenancy Patterns

#### Pattern A: Query-level Filtering
**Used by**: portfolio-service
```typescript
where: { 
  tenantId,
  portfolioId 
}
```

#### Pattern B: Database Context Switching
**Used by**: auth service
```typescript
await this.db.setTenantContext(tenantId);
```

### 4. Event Publishing Patterns

#### Pattern A: Kafka Mock Service
**Used by**: portfolio-service
```typescript
import { getKafkaService } from '../utils/kafka-mock';
await this.kafkaService.publish('portfolio.created', data);
```

#### Pattern B: EventEmitter
**Used by**: client-service, monitoring
```typescript
this.emit('onboardingInitiated', workflow);
```

---

## Type Definition Patterns

### 1. Shared Types Package
**Location**: `@investment-platform/types`
**Used by**: auth service
```typescript
import { User, CreateUserRequest, LoginRequest } from '@investment-platform/types';
```

### 2. Local Model Definitions
**Used by**: portfolio-service
```typescript
import { ClientProfile } from '../../models/clientRelationship/ClientRelationship';
```

### 3. Prisma Generated Types
**Used by**: market-data, portfolio-service
```typescript
import { Security, Portfolio } from '@prisma/client';
```

---

## Decimal Handling Patterns

### Issue: Mixed Decimal Libraries

#### decimal.js Library
```typescript
import { Decimal } from 'decimal.js';
const value = new Decimal(100);
```

#### Prisma.Decimal
```typescript
import { Prisma } from '@prisma/client';
const value = new Prisma.Decimal(100);
```

#### Wrong Import (Still Present)
```typescript
import { Decimal } from '@prisma/client/runtime/library';  // WRONG
```

---

## Service Communication Patterns

### 1. Direct Database Access
- Services directly query their own domain tables
- No service-to-service API calls observed

### 2. Event-Driven Communication
- Kafka for async events
- EventEmitter for local events

### 3. Missing Patterns
- No REST API clients between services
- No gRPC implementation found
- No service mesh configuration

---

## Error Handling Patterns

### Pattern A: Try-Catch with Logging
```typescript
try {
  logger.info('Starting operation', { data });
  // operation
} catch (error: any) {
  logger.error('Operation failed:', error);
  throw error;
}
```

### Pattern B: Type Casting Issues
```typescript
catch (error: any) {  // Using 'any' everywhere
  logger.error('Error:', error instanceof Error ? error.message : String(error));
}
```

---

## Frontend Architecture

### Web Portal (Next.js)
- **Framework**: Next.js 14 with App Router
- **State**: Redux with RTK
- **UI**: Material-UI
- **Styling**: Tailwind CSS
- **Features**:
  - Server-side rendering
  - Theme provider
  - Error boundaries

### Mobile App (React Native)
- **Framework**: React Native with TypeScript
- **State**: Redux with persist
- **UI**: React Native Paper
- **Navigation**: React Navigation
- **Features**:
  - Biometric authentication
  - Offline support
  - Network status monitoring
  - Error boundaries

---

## Key Architectural Issues

### 1. Inconsistent Patterns
- Three different database access patterns
- Two different service instantiation patterns
- Mixed type definition approaches

### 2. Import Path Problems
- Wrong Prisma imports in 13+ files
- Decimal type confusion
- Missing type exports

### 3. Missing Infrastructure
- No API gateway visible
- No service discovery
- No distributed tracing
- No circuit breakers

### 4. Type Safety Issues
- Extensive use of `any` type
- Type casting with `as any`
- Missing TypeScript strict mode

### 5. Schema Mismatches
- Transaction model missing fields
- Security relations not defined
- Settlement models don't exist

---

## Service Complexity Analysis

### Most Complex Services
1. **ClientRelationshipService.ts**: 1,113 lines
   - Onboarding workflows
   - Suitability assessments
   - Meeting management
   - Communication tracking

2. **AssetClassificationService.ts**: 864 lines
   - GICS classification
   - ESG scoring
   - Concentration risk
   - Compliance checking

3. **TransactionService.ts**: 735 lines
   - Trade capture
   - Settlement tracking
   - Reconciliation
   - Failed trade management

### Simplest Services
1. **Auth.ts**: 258 lines (but uses raw SQL)
2. **VaRCalculationService.ts**: Complex logic but clean structure
3. **Web portal layout**: 38 lines (minimal)

---

## Recommendations for Standardization

### Immediate
1. Choose ONE database pattern (recommend Prisma everywhere)
2. Choose ONE service pattern (recommend class-based DI)
3. Fix all import paths
4. Standardize Decimal handling

### Short-term
1. Create shared types package for all services
2. Implement proper error types
3. Add TypeScript strict mode
4. Fix schema mismatches

### Long-term
1. Implement API gateway
2. Add service mesh
3. Implement distributed tracing
4. Add health checks and circuit breakers