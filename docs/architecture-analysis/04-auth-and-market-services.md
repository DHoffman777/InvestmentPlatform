# Auth and Market-Data Services Analysis

## Auth Service (`services/auth/src/services/auth.ts`)

### Architecture Pattern
- **Singleton Pattern**: All services use getInstance()
- **No Prisma**: Uses raw SQL with DatabaseService
- **No direct ORM**: Custom database abstraction layer

### Import Analysis ✅
```typescript
import { User, CreateUserRequest, LoginRequest, TokenPair, UserRole, Permission } from '@investment-platform/types';
// Uses shared types package - good pattern!
```

### Key Components

#### DatabaseService
- Custom abstraction over database connections
- Supports multi-tenancy via `setTenantContext(tenantId)`
- Methods: `queryOne()`, `query()`
- Raw SQL execution

#### CacheService
- Redis caching layer
- Session management

#### JWTService
- Token generation and validation
- Session revocation
- Refresh token handling

### Security Features

#### Password Management
- bcrypt with configurable rounds (default 12)
- Hashed password storage
- Compare on login

#### Account Lockout
- Failed login tracking
- Account locking after max attempts (default 5)
- Lockout duration (default 900 seconds)
- Status tracking: PENDING_VERIFICATION, SUSPENDED, LOCKED, DELETED

#### Token Strategy
```typescript
const tokens = await this.jwtService.generateTokenPair({
  userId: user.id,
  tenantId,
  email: user.email,
  roles: roles.map(r => r.name),
  permissions: permissions.map(p => p.name),
});
```

### Database Schema (Inferred from SQL)

#### users table
- id, email, first_name, last_name
- password_hash
- status
- failed_login_attempts
- locked_until
- email_verified
- last_login
- created_at, updated_at

#### roles table
- id, name

#### permissions table
- id, name

#### user_roles table
- user_id, role_id, assigned_at

#### role_permissions table
- role_id, permission_id

### Multi-Tenancy
- Every operation requires tenantId
- Database context switching per tenant
- Tenant isolation at database level

### Role Assignment
- Default role: 'CLIENT' on registration
- Role-based permissions
- Hierarchical permission system

---

## Market-Data Service (`services/market-data/src/services/equitiesService.ts`)

### Import Status ✅
```typescript
import { PrismaClient, Security } from '@prisma/client';  // CORRECT!
import { Decimal } from 'decimal.js';
```

### Domain Model

#### Equity Types Supported
1. **COMMON_STOCK** - Regular equities
2. **PREFERRED_STOCK** - With dividend rate, par value, call features
3. **ADR** (American Depositary Receipt)
4. **GDR** (Global Depositary Receipt)

#### Extended Metadata

##### Common Stock
- Market cap, shares outstanding
- PE ratio, PB ratio, Beta
- Dividend yield and frequency

##### Preferred Stock
```typescript
interface PreferredStockData {
  dividendRate: Decimal;
  parValue: Decimal;
  callPrice?: Decimal;
  callDate?: Date;
  convertible?: boolean;
  conversionRatio?: Decimal;
  cumulative: boolean;
  perpetual: boolean;
  maturityDate?: Date;
}
```

##### ADR/GDR
```typescript
interface ADRData {
  underlyingSymbol: string;
  underlyingExchange: string;
  underlyingCurrency: string;
  adrRatio: string; // "1:2" format
  depositoryBank: string;
  level: 1 | 2 | 3; // ADR levels
  sponsored: boolean;
}
```

### Prisma Models Used ✅
- `security` - Main security master
- `quotes` - Real-time quotes
- `historicalData` - Historical prices
- `corporateAction` - Dividends, splits, etc.
- `fundamental` - Financial data

### Key Features

#### 1. Security Master Management
- Upsert pattern for create/update
- Multiple identifiers: Symbol, CUSIP, ISIN, SEDOL
- Exchange and currency tracking
- Sector and industry classification

#### 2. Quote Integration
```typescript
include: {
  quotes: {
    take: 1,
    orderBy: { quoteTime: 'desc' },
  },
}
```

#### 3. Corporate Actions
- Dividend tracking
- Action types: DIVIDEND, SPLIT, etc.
- Status tracking: PROCESSED

#### 4. Dividend Analytics
- Yield calculation
- Payout ratio
- Growth rate (YoY comparison)
- Annual dividend aggregation

### Search Capabilities
```typescript
searchEquities(filters: {
  query?: string;        // Symbol or name search
  equityType?: string;   // Filter by type
  exchange?: string;     // Exchange filter
  sector?: string;       // Sector filter
  country?: string;      // Geographic filter
  minMarketCap?: number; // Market cap range
  maxMarketCap?: number;
})
```

### Metadata Storage Pattern
```typescript
// Using fundamental table for extended metadata
// periodType: 'METADATA' as special marker
// Stores in additionalData JSON field
```

### Type Casting Issues
```typescript
// Line 292: Decimal constructor issue
whereClause.marketCap.gte = new (Decimal as any)(minMarketCap);
```

---

## Architectural Differences

### Auth Service
- **Pattern**: Singleton services
- **Database**: Raw SQL with custom abstraction
- **Types**: Shared types package
- **Multi-tenancy**: Database context switching

### Market-Data Service
- **Pattern**: Class instantiation
- **Database**: Prisma ORM
- **Types**: Prisma-generated types
- **Multi-tenancy**: Not visible in this service

### Portfolio Service (for comparison)
- **Pattern**: Class instantiation
- **Database**: Prisma ORM
- **Types**: Mix of Prisma and custom interfaces
- **Multi-tenancy**: tenantId in queries

---

## Key Observations

### 1. Inconsistent Architecture
- Auth uses raw SQL while others use Prisma
- Different patterns (Singleton vs Class instantiation)
- Different multi-tenancy approaches

### 2. Shared Types Package
- `@investment-platform/types` exists and is used by auth
- Other services don't use it (rely on Prisma types)

### 3. Decimal Handling
- Market-data: Uses decimal.js with Prisma
- Proper conversion to/from Prisma.Decimal
- Some type casting issues remain

### 4. Metadata Storage
- Creative use of fundamental table for metadata
- JSON fields for flexible schema
- Potential performance implications

### 5. Security Considerations
- Good password hashing in auth
- Session management with Redis
- Account lockout protection
- JWT with roles and permissions

---

## Recommendations

### Immediate
1. Standardize database access (all Prisma or all raw SQL)
2. Fix Decimal type casting issues
3. Use shared types package consistently

### Medium-term
1. Create dedicated metadata tables instead of JSON
2. Standardize service patterns (Singleton vs Class)
3. Align multi-tenancy approach

### Long-term
1. Consider service mesh for inter-service communication
2. Implement distributed tracing
3. Add circuit breakers for external dependencies