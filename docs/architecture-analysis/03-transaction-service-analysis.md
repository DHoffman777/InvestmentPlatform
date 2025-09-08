# Transaction Service Analysis

## File: `services/portfolio-service/src/services/transactionService.ts`

### Import Status ✅
```typescript
import { PrismaClient, Prisma } from '@prisma/client';  // CORRECT!
import { Decimal } from 'decimal.js';
```

### Key Features

#### 1. Trade Capture from Multiple Sources
- Supports sources: MANUAL, BROKER_API, FIX_FEED, FILE_UPLOAD, CUSTODIAN_FEED
- Duplicate detection via external trade ID
- Auto-calculates settlement dates based on asset class
- Creates settlement instructions automatically

#### 2. Transaction Matching & Reconciliation
- Matches external transactions with system records
- Confidence scoring for matches
- Identifies discrepancies in quantity, price, type
- Stores reconciliation results

#### 3. Settlement Management
- Creates settlement instructions (DVP, FREE_DELIVERY, CASH_SETTLEMENT)
- Tracks settlement status lifecycle
- Failed trade management with priority levels

#### 4. Bulk Processing
- Batch processing in chunks of 50
- Error tracking per transaction
- Summary statistics

### Schema Issues Found 🔴

#### Missing Fields in Transaction Model
```typescript
// Line 138-139: Field doesn't exist
// transactionDate: tradeData.tradeDate,  // TODO: Field doesn't exist, using createdAt
// settleDate,  // TODO: Field doesn't exist in schema

// Line 136: Missing relation
// securityId: tradeData.securityId,  // TODO: Add security relation to schema
```

#### Missing Models
```typescript
// Line 92: security model accessed but not defined in Transaction relation
const security = await (this.prisma as any).security.findUnique({

// Line 323: settlementInstruction model doesn't exist
await (this.prisma as any).settlementInstruction.create({

// Line 423: failedTrade model doesn't exist
await (this.prisma as any).failedTrade.create({

// Line 713: transactionReconciliation model doesn't exist
await (this.prisma as any).transactionReconciliation.create({
```

### Type Casting Issues
- Extensive use of `as any` for missing models (lines 92, 120-122, 323, 364, 423, 554, 655, 713)
- Mixing `Decimal` from decimal.js with Prisma.Decimal

### Settlement Date Calculation Logic
```typescript
private calculateSettlementDate(tradeDate: Date, assetClass: string): Date {
  // EQUITY, ETF: T+2
  // BOND, CORPORATE_BOND, GOVERNMENT_BOND: T+1
  // MONEY_MARKET: Same day
  // Skips weekends (not holidays)
}
```

### Matching Algorithm
- Security match by symbol, CUSIP, or ISIN
- Date match within 3 days tolerance
- Confidence scoring:
  - Symbol match: 30%
  - Quantity match: 25%
  - Price match: 20%
  - Transaction type: 15%
  - Date match: 10%
- Minimum 60% confidence threshold

### Event Publishing
```typescript
// Events published:
- 'trade-captured'
- 'settlement-instruction-created'
- 'settlement-status-updated'
- 'trade-failed'
```

### Cash Flow Calculations
- BUY, TRANSFER_IN, DEPOSIT = Cash out
- SELL, TRANSFER_OUT, WITHDRAWAL, DIVIDEND, INTEREST = Cash in
- Tracks net cash flow per portfolio

---

## File: `services/portfolio-service/src/services/assetClassificationService.ts`

### Import Status ✅
```typescript
import { PrismaClient, AssetClass as PrismaAssetClass, AssetType, RiskTolerance, LiquidityTier } from '@prisma/client';  // CORRECT!
```

### Complex Domain Model

#### Asset Classification Hierarchy
1. **AssetClass** - Top level (Equity, Fixed Income, etc.)
2. **AssetSubClass** - Second level (specific categories)
3. **InstrumentClassification** - Individual instrument mapping

#### Key Features

##### 1. Asset Class Management
- CRUD operations for asset classes
- Hierarchical structure with parent/child relationships
- Risk levels: CONSERVATIVE to AGGRESSIVE
- Liquidity tiers tracking
- Regulatory class mapping

##### 2. Instrument Classification
- Auto-classification based on instrument type
- GICS classification support (Sector, Industry, Sub-Industry)
- Geographic classification (Country, Region, Developed/Emerging)
- ESG scoring and ratings
- Investment restrictions (accredited, institutional, retail)

##### 3. Asset Allocation Management
- Portfolio allocation targets
- Constraints system (hard/soft constraints)
- Rebalancing thresholds and frequency
- Risk profile alignment

##### 4. Portfolio Analysis
- Asset class allocation breakdown
- Geographic diversification
- Sector allocation
- Style allocation (Growth/Value)
- Credit quality distribution
- ESG scoring
- Concentration risk detection
- Compliance violation checking

### Schema Validation

#### Models Used ✅
- `assetClass`
- `assetSubClass`
- `instrumentClassification`
- `assetAllocation`
- `position` (with security relation)

#### Field Mapping Issues
```typescript
// Many fields stored in JSON columns
characteristics: subClass.characteristics as any,  // Line 139
allocations: allocation.allocations as any,  // Line 436
constraints: allocation.constraints as any,  // Line 437
classifications: classification.classifications as any,  // Line 250
```

### Risk Assessment Algorithm
```typescript
// Weight-based risk scoring
EQUITY: weight * 3
FIXED_INCOME: weight * 2
CASH_EQUIVALENT: weight * 1
ALTERNATIVE: weight * 4
DERIVATIVE: weight * 5
```

### Diversification Metrics
- Herfindahl-Hirschman Index calculation
- Score 0-100 (higher = better diversification)

### Concentration Risk Thresholds
- Individual instrument > 10% = Risk flag
- Sector > 20% = Risk flag
- Critical levels at 25% (instrument) and 40% (sector)

### Compliance Engine
- MAX_CONCENTRATION constraints
- Hard constraints = VIOLATION
- Soft constraints = WARNING
- Automated recommended actions

### Events Published
```typescript
'asset-class-created'
'asset-class-updated'
'asset-subclass-created'
'instrument-classified'
'instrument-classification-updated'
'asset-allocation-created'
```

---

## Summary

### Positive Findings ✅
1. Both services have CORRECT Prisma imports
2. Comprehensive business logic implementation
3. Good event-driven architecture
4. Proper multi-tenancy support
5. Rich domain modeling

### Issues to Address 🔴

#### Transaction Service
1. Missing schema fields: transactionDate, settleDate, securityId relation
2. Missing models: security, settlementInstruction, failedTrade, transactionReconciliation
3. Heavy use of `as any` casting for missing models

#### Asset Classification Service
1. Heavy reliance on JSON columns (may impact query performance)
2. Some complex joins that might need optimization
3. Manual type casting for Prisma enums

### Decimal Type Usage
Both services mix:
- `Decimal` from decimal.js library
- `Prisma.Decimal` from Prisma
- Need standardization

### Next Steps
1. Verify if missing models exist in schema
2. Add missing fields to Transaction model
3. Create missing models if confirmed absent
4. Standardize Decimal usage across services