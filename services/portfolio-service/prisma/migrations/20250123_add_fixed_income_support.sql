-- Migration to add comprehensive fixed income instrument support
-- Adds new security types, bond reference data, and enhanced analytics

-- First, add new values to the SecurityType enum for fixed income instruments
ALTER TYPE "SecurityType" ADD VALUE IF NOT EXISTS 'GOVERNMENT_BOND';
ALTER TYPE "SecurityType" ADD VALUE IF NOT EXISTS 'CORPORATE_BOND';
ALTER TYPE "SecurityType" ADD VALUE IF NOT EXISTS 'MUNICIPAL_BOND';
ALTER TYPE "SecurityType" ADD VALUE IF NOT EXISTS 'AGENCY_BOND';

-- Add new transaction types for fixed income operations
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'COUPON_PAYMENT';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'PRINCIPAL_PAYMENT';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'MATURITY';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'CALL';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'PUT';

-- Create table for bond reference data
CREATE TABLE IF NOT EXISTS bonds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bond_id VARCHAR(50) UNIQUE NOT NULL,
    cusip VARCHAR(20) UNIQUE NOT NULL,
    isin VARCHAR(20),
    
    -- Issuer information
    issuer_name VARCHAR(255) NOT NULL,
    bond_type VARCHAR(20) NOT NULL CHECK (bond_type IN ('GOVERNMENT', 'CORPORATE', 'MUNICIPAL', 'TREASURY', 'AGENCY')),
    
    -- Bond characteristics
    face_value DECIMAL(15, 2) NOT NULL DEFAULT 1000.00,
    coupon_rate DECIMAL(10, 6) NOT NULL DEFAULT 0,
    maturity_date DATE NOT NULL,
    issue_date DATE NOT NULL,
    first_coupon_date DATE,
    
    -- Payment details
    payment_frequency VARCHAR(20) NOT NULL DEFAULT 'SEMI_ANNUAL' 
        CHECK (payment_frequency IN ('MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'ZERO_COUPON')),
    day_count_convention VARCHAR(10) NOT NULL DEFAULT 'ACT_360'
        CHECK (day_count_convention IN ('ACT_360', 'ACT_365', '30_360', 'ACT_ACT')),
    
    -- Credit ratings
    moodys_rating VARCHAR(10),
    sp_rating VARCHAR(10),
    fitch_rating VARCHAR(10),
    
    -- Market data (updated regularly)
    current_price DECIMAL(12, 6) DEFAULT 100.000000,
    yield_to_maturity DECIMAL(10, 6) DEFAULT 0,
    yield_to_call DECIMAL(10, 6),
    duration DECIMAL(10, 6) DEFAULT 0,
    modified_duration DECIMAL(10, 6) DEFAULT 0,
    convexity DECIMAL(12, 6) DEFAULT 0,
    
    -- Call/put features
    is_callable BOOLEAN DEFAULT FALSE,
    call_date DATE,
    call_price DECIMAL(12, 6),
    is_putable BOOLEAN DEFAULT FALSE,
    put_date DATE,
    put_price DECIMAL(12, 6),
    
    -- Tax treatment
    is_tax_exempt BOOLEAN DEFAULT FALSE,
    is_subject_to_amt BOOLEAN DEFAULT FALSE,
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT TRUE,
    is_defaulted BOOLEAN DEFAULT FALSE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_coupon_rate CHECK (coupon_rate >= 0 AND coupon_rate <= 50),
    CONSTRAINT valid_yields CHECK (
        yield_to_maturity >= 0 AND yield_to_maturity <= 50 AND
        (yield_to_call IS NULL OR (yield_to_call >= 0 AND yield_to_call <= 50))
    ),
    CONSTRAINT valid_prices CHECK (
        current_price > 0 AND
        (call_price IS NULL OR call_price > 0) AND
        (put_price IS NULL OR put_price > 0)
    ),
    CONSTRAINT valid_dates CHECK (
        maturity_date > issue_date AND
        (call_date IS NULL OR call_date <= maturity_date) AND
        (put_date IS NULL OR put_date <= maturity_date)
    )
);

-- Create table for treasury bills (separate from bonds due to different characteristics)
CREATE TABLE IF NOT EXISTS treasury_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id VARCHAR(50) UNIQUE NOT NULL,
    cusip VARCHAR(20) UNIQUE NOT NULL,
    
    -- Treasury bill characteristics
    face_value DECIMAL(15, 2) NOT NULL DEFAULT 1000.00,
    discount_rate DECIMAL(10, 6) NOT NULL DEFAULT 0,
    current_price DECIMAL(12, 6) NOT NULL,
    yield_to_maturity DECIMAL(10, 6) NOT NULL DEFAULT 0,
    
    -- Dates
    maturity_date DATE NOT NULL,
    issue_date DATE NOT NULL,
    
    -- Term information
    term_days INTEGER NOT NULL,
    term_weeks INTEGER NOT NULL,
    
    -- Auction details
    auction_date DATE NOT NULL,
    competitive_bid BOOLEAN DEFAULT TRUE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_treasury_rates CHECK (
        discount_rate >= 0 AND discount_rate <= 50 AND
        yield_to_maturity >= 0 AND yield_to_maturity <= 50
    ),
    CONSTRAINT valid_treasury_dates CHECK (maturity_date > issue_date),
    CONSTRAINT valid_term CHECK (term_days > 0 AND term_weeks > 0)
);

-- Create table for tax lot tracking (important for fixed income)
CREATE TABLE IF NOT EXISTS fixed_income_tax_lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position_id UUID NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Tax lot details
    quantity DECIMAL(15, 6) NOT NULL,
    purchase_price DECIMAL(12, 6) NOT NULL,
    purchase_date DATE NOT NULL,
    cost_basis DECIMAL(15, 2) NOT NULL,
    accrued_interest_at_purchase DECIMAL(15, 2) DEFAULT 0,
    
    -- Premium/discount amortization
    original_premium_discount DECIMAL(15, 2) DEFAULT 0,
    remaining_premium_discount DECIMAL(15, 2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_tax_lot_values CHECK (
        quantity > 0 AND
        purchase_price > 0 AND
        cost_basis > 0
    )
);

-- Create table for coupon payments tracking
CREATE TABLE IF NOT EXISTS coupon_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position_id UUID NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Payment details
    payment_date DATE NOT NULL,
    record_date DATE NOT NULL,
    ex_date DATE NOT NULL,
    
    -- Amounts
    coupon_rate DECIMAL(10, 6) NOT NULL,
    payment_amount DECIMAL(15, 2) NOT NULL,
    face_value_held DECIMAL(15, 2) NOT NULL,
    
    -- Tax information
    taxable_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    tax_exempt_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'PAID', 'REINVESTED')),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_coupon_amounts CHECK (
        payment_amount > 0 AND
        face_value_held > 0 AND
        taxable_amount >= 0 AND
        tax_exempt_amount >= 0 AND
        (taxable_amount + tax_exempt_amount) = payment_amount
    ),
    CONSTRAINT valid_coupon_dates CHECK (ex_date <= record_date AND record_date <= payment_date)
);

-- Create table for yield calculations (historical tracking)
CREATE TABLE IF NOT EXISTS fixed_income_yield_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position_id UUID NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Calculation details
    calculation_date DATE NOT NULL,
    price_used DECIMAL(12, 6) NOT NULL,
    
    -- Yield metrics
    current_yield DECIMAL(10, 6) NOT NULL DEFAULT 0,
    yield_to_maturity DECIMAL(10, 6) NOT NULL DEFAULT 0,
    yield_to_call DECIMAL(10, 6),
    yield_to_worst DECIMAL(10, 6) NOT NULL DEFAULT 0,
    tax_equivalent_yield DECIMAL(10, 6),
    
    -- Risk metrics
    duration DECIMAL(10, 6) NOT NULL DEFAULT 0,
    modified_duration DECIMAL(10, 6) NOT NULL DEFAULT 0,
    convexity DECIMAL(12, 6) NOT NULL DEFAULT 0,
    
    -- Advanced analytics
    price_value_01 DECIMAL(15, 8), -- Price value of a basis point
    dv01 DECIMAL(15, 2), -- Dollar value of a basis point
    effective_duration DECIMAL(10, 6),
    effective_convexity DECIMAL(12, 6),
    option_adjusted_spread DECIMAL(10, 6),
    z_spread DECIMAL(10, 6),
    
    -- Calculation metadata
    calculation_method VARCHAR(20) DEFAULT 'STANDARD',
    market_data_source VARCHAR(50),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    calculated_by UUID,
    
    -- Constraints
    CONSTRAINT valid_fi_yields CHECK (
        current_yield >= 0 AND current_yield <= 50 AND
        yield_to_maturity >= 0 AND yield_to_maturity <= 50 AND
        (yield_to_call IS NULL OR (yield_to_call >= 0 AND yield_to_call <= 50)) AND
        yield_to_worst >= 0 AND yield_to_worst <= 50
    ),
    CONSTRAINT valid_duration_convexity CHECK (
        duration >= 0 AND
        modified_duration >= 0 AND
        convexity >= 0
    )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bonds_cusip ON bonds(cusip);
CREATE INDEX IF NOT EXISTS idx_bonds_issuer ON bonds(issuer_name);
CREATE INDEX IF NOT EXISTS idx_bonds_type ON bonds(bond_type);
CREATE INDEX IF NOT EXISTS idx_bonds_maturity ON bonds(maturity_date);
CREATE INDEX IF NOT EXISTS idx_bonds_active ON bonds(is_active);
CREATE INDEX IF NOT EXISTS idx_bonds_callable ON bonds(is_callable);

CREATE INDEX IF NOT EXISTS idx_treasury_bills_cusip ON treasury_bills(cusip);
CREATE INDEX IF NOT EXISTS idx_treasury_bills_maturity ON treasury_bills(maturity_date);
CREATE INDEX IF NOT EXISTS idx_treasury_bills_active ON treasury_bills(is_active);

CREATE INDEX IF NOT EXISTS idx_fi_tax_lots_position ON fixed_income_tax_lots(position_id);
CREATE INDEX IF NOT EXISTS idx_fi_tax_lots_tenant ON fixed_income_tax_lots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fi_tax_lots_active ON fixed_income_tax_lots(is_active);

CREATE INDEX IF NOT EXISTS idx_coupon_payments_position ON coupon_payments(position_id);
CREATE INDEX IF NOT EXISTS idx_coupon_payments_tenant ON coupon_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_coupon_payments_date ON coupon_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_coupon_payments_status ON coupon_payments(status);

CREATE INDEX IF NOT EXISTS idx_fi_yield_calc_position ON fixed_income_yield_calculations(position_id);
CREATE INDEX IF NOT EXISTS idx_fi_yield_calc_tenant ON fixed_income_yield_calculations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fi_yield_calc_date ON fixed_income_yield_calculations(calculation_date);

-- Insert sample bond data for testing
INSERT INTO bonds (
    bond_id, cusip, issuer_name, bond_type,
    face_value, coupon_rate, maturity_date, issue_date,
    payment_frequency, day_count_convention,
    moodys_rating, sp_rating,
    current_price, yield_to_maturity, duration, modified_duration, convexity,
    is_callable, is_tax_exempt,
    is_active
) VALUES 
    ('US-TREASURY-10Y-001', '912828YK8', 'U.S. Treasury', 'GOVERNMENT',
     1000.00, 4.25, '2034-01-15', '2024-01-15',
     'SEMI_ANNUAL', 'ACT_ACT',
     'Aaa', 'AAA',
     98.50, 4.35, 8.5, 8.2, 72.5,
     FALSE, FALSE,
     TRUE),
    ('AAPL-CORP-BOND-001', '037833CR7', 'Apple Inc.', 'CORPORATE',
     1000.00, 3.75, '2029-09-12', '2024-09-12',
     'SEMI_ANNUAL', 'ACT_360',
     'Aa1', 'AA+',
     102.25, 3.45, 4.8, 4.6, 28.3,
     TRUE, FALSE,
     TRUE),
    ('NYC-MUNI-001', '649445AH5', 'New York City', 'MUNICIPAL',
     1000.00, 5.00, '2039-06-01', '2024-06-01',
     'SEMI_ANNUAL', 'ACT_365',
     'Aa2', 'AA',
     105.75, 4.65, 12.2, 11.8, 156.4,
     TRUE, TRUE,
     TRUE)
ON CONFLICT (cusip) DO NOTHING;

-- Insert sample treasury bills
INSERT INTO treasury_bills (
    bill_id, cusip, face_value, discount_rate, current_price, yield_to_maturity,
    maturity_date, issue_date, term_days, term_weeks,
    auction_date, competitive_bid, is_active
) VALUES 
    ('T-BILL-91D-001', '912797JV5', 1000.00, 4.85, 987.50, 5.05,
     '2025-04-24', '2025-01-23', 91, 13,
     '2025-01-22', TRUE, TRUE),
    ('T-BILL-182D-001', '912797KA7', 1000.00, 4.92, 975.20, 5.15,
     '2025-07-24', '2025-01-23', 182, 26,
     '2025-01-22', TRUE, TRUE),
    ('T-BILL-364D-001', '912797KB5', 1000.00, 5.10, 951.00, 5.35,
     '2026-01-22', '2025-01-23', 364, 52,
     '2025-01-22', TRUE, TRUE)
ON CONFLICT (cusip) DO NOTHING;

-- Update trigger for updated_at fields
CREATE OR REPLACE FUNCTION update_fi_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bonds_updated_at 
    BEFORE UPDATE ON bonds 
    FOR EACH ROW EXECUTE FUNCTION update_fi_updated_at_column();

CREATE TRIGGER update_treasury_bills_updated_at 
    BEFORE UPDATE ON treasury_bills 
    FOR EACH ROW EXECUTE FUNCTION update_fi_updated_at_column();