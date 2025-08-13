-- Migration to add comprehensive Fixed Income Analytics System
-- Includes yield calculations, duration/convexity analysis, credit analytics, and portfolio analytics

-- Create enum types for fixed income analytics
DO $$ BEGIN
    CREATE TYPE "BondType" AS ENUM (
        'GOVERNMENT', 'CORPORATE', 'MUNICIPAL', 'TREASURY', 'AGENCY', 
        'SUPRANATIONAL', 'MORTGAGE_BACKED', 'ASSET_BACKED', 'CONVERTIBLE', 
        'FLOATING_RATE', 'ZERO_COUPON'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "CreditRating" AS ENUM (
        'AAA', 'AA_PLUS', 'AA', 'AA_MINUS', 'A_PLUS', 'A', 'A_MINUS',
        'BBB_PLUS', 'BBB', 'BBB_MINUS', 'BB_PLUS', 'BB', 'BB_MINUS',
        'B_PLUS', 'B', 'B_MINUS', 'CCC_PLUS', 'CCC', 'CCC_MINUS',
        'CC', 'C', 'D', 'NR'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentFrequency" AS ENUM (
        'ANNUAL', 'SEMI_ANNUAL', 'QUARTERLY', 'MONTHLY', 'WEEKLY', 
        'DAILY', 'ZERO_COUPON', 'IRREGULAR'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "DayCountConvention" AS ENUM (
        'THIRTY_360', 'THIRTY_360_ISDA', 'THIRTY_E_360', 'ACT_360', 
        'ACT_365', 'ACT_ACT', 'ACT_ACT_ISDA', 'BUS_252'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "CallType" AS ENUM (
        'CALL', 'PUT', 'SINK', 'MAKE_WHOLE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "YieldType" AS ENUM (
        'YIELD_TO_MATURITY', 'YIELD_TO_WORST', 'YIELD_TO_CALL', 'YIELD_TO_PUT',
        'CURRENT_YIELD', 'RUNNING_YIELD', 'DISCOUNT_YIELD', 'TAX_EQUIVALENT_YIELD',
        'AFTER_TAX_YIELD', 'OPTION_ADJUSTED_YIELD'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "DurationType" AS ENUM (
        'MODIFIED_DURATION', 'MACAULAY_DURATION', 'EFFECTIVE_DURATION',
        'KEY_RATE_DURATION', 'OPTION_ADJUSTED_DURATION', 'DOLLAR_DURATION'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create fixed income securities table with comprehensive analytics support
CREATE TABLE IF NOT EXISTS fixed_income_securities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    instrument_id VARCHAR(255) NOT NULL,
    cusip VARCHAR(9),
    isin VARCHAR(12),
    symbol VARCHAR(50),
    
    -- Basic Security Information
    issuer_name VARCHAR(500) NOT NULL,
    bond_type "BondType" NOT NULL,
    security_description TEXT,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    country VARCHAR(3) NOT NULL DEFAULT 'US',
    sector VARCHAR(100),
    industry VARCHAR(100),
    
    -- Bond Characteristics
    issue_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    original_maturity DECIMAL(8, 4) NOT NULL, -- in years
    remaining_maturity DECIMAL(8, 4) NOT NULL, -- in years
    face_value DECIMAL(20, 4) NOT NULL DEFAULT 1000,
    coupon_rate DECIMAL(8, 6) NOT NULL, -- as decimal (e.g., 0.05 for 5%)
    payment_frequency "PaymentFrequency" NOT NULL DEFAULT 'SEMI_ANNUAL',
    day_count_convention "DayCountConvention" NOT NULL DEFAULT 'THIRTY_360',
    
    -- Credit Information
    credit_rating_moody "CreditRating",
    credit_rating_sp "CreditRating",
    credit_rating_fitch "CreditRating",
    seniority VARCHAR(100),
    security_type VARCHAR(100),
    
    -- Callable/Putable Features
    is_callable BOOLEAN NOT NULL DEFAULT false,
    is_putable BOOLEAN NOT NULL DEFAULT false,
    
    -- Pricing and Market Data
    current_price DECIMAL(12, 6) NOT NULL,
    price_date DATE NOT NULL,
    accrued_interest DECIMAL(12, 6) NOT NULL DEFAULT 0,
    clean_price DECIMAL(12, 6) NOT NULL,
    dirty_price DECIMAL(12, 6) NOT NULL,
    spread_to_treasury DECIMAL(8, 4), -- in basis points
    spread_to_benchmark DECIMAL(8, 4), -- in basis points
    
    -- Analytics Status
    last_analyzed TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_maturity CHECK (maturity_date > issue_date),
    CONSTRAINT valid_remaining_maturity CHECK (remaining_maturity >= 0),
    CONSTRAINT valid_coupon_rate CHECK (coupon_rate >= 0),
    CONSTRAINT valid_face_value CHECK (face_value > 0),
    CONSTRAINT valid_current_price CHECK (current_price > 0),
    UNIQUE(tenant_id, instrument_id)
);

-- Create call provisions table
CREATE TABLE IF NOT EXISTS fixed_income_call_provisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    security_id UUID NOT NULL REFERENCES fixed_income_securities(id) ON DELETE CASCADE,
    call_date DATE NOT NULL,
    call_price DECIMAL(12, 6) NOT NULL,
    call_type "CallType" NOT NULL,
    notice_days INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_call_price CHECK (call_price > 0),
    CONSTRAINT valid_notice_days CHECK (notice_days >= 0)
);

-- Create put provisions table
CREATE TABLE IF NOT EXISTS fixed_income_put_provisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    security_id UUID NOT NULL REFERENCES fixed_income_securities(id) ON DELETE CASCADE,
    put_date DATE NOT NULL,
    put_price DECIMAL(12, 6) NOT NULL,
    notice_days INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_put_price CHECK (put_price > 0),
    CONSTRAINT valid_put_notice_days CHECK (notice_days >= 0)
);

-- Create yield analytics table
CREATE TABLE IF NOT EXISTS fixed_income_yield_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    security_id UUID NOT NULL REFERENCES fixed_income_securities(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Yield Metrics
    yield_to_maturity DECIMAL(10, 6) NOT NULL,
    yield_to_worst DECIMAL(10, 6) NOT NULL,
    yield_to_call DECIMAL(10, 6),
    yield_to_put DECIMAL(10, 6),
    current_yield DECIMAL(10, 6) NOT NULL,
    running_yield DECIMAL(10, 6) NOT NULL,
    discount_yield DECIMAL(10, 6),
    tax_equivalent_yield DECIMAL(10, 6),
    after_tax_yield DECIMAL(10, 6),
    option_adjusted_yield DECIMAL(10, 6),
    
    -- Yield Curve Analysis
    benchmark_yield DECIMAL(10, 6),
    yield_spread DECIMAL(8, 4), -- in basis points
    z_spread DECIMAL(8, 4), -- in basis points
    option_adjusted_spread DECIMAL(8, 4), -- in basis points
    asset_swap_spread DECIMAL(8, 4), -- in basis points
    
    -- Municipal Bond Specific
    municipal_tax_rate DECIMAL(8, 6),
    federal_tax_rate DECIMAL(8, 6),
    state_tax_rate DECIMAL(8, 6),
    
    -- Calculation Metadata
    calculation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    calculation_method VARCHAR(100) NOT NULL,
    settlement_date DATE NOT NULL,
    price_used DECIMAL(12, 6) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL,
    
    CONSTRAINT valid_yields CHECK (
        yield_to_maturity >= -1 AND yield_to_worst >= -1 AND 
        current_yield >= -1 AND running_yield >= -1
    )
);

-- Create duration analytics table
CREATE TABLE IF NOT EXISTS fixed_income_duration_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    security_id UUID NOT NULL REFERENCES fixed_income_securities(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Duration Metrics
    modified_duration DECIMAL(10, 6) NOT NULL,
    macaulay_duration DECIMAL(10, 6) NOT NULL,
    effective_duration DECIMAL(10, 6),
    option_adjusted_duration DECIMAL(10, 6),
    dollar_duration DECIMAL(15, 6) NOT NULL,
    
    -- Key Rate Durations (JSON array)
    key_rate_durations JSONB,
    
    -- Risk Metrics
    dv01 DECIMAL(15, 8) NOT NULL, -- Dollar Value of 01 basis point
    pv01 DECIMAL(15, 8) NOT NULL, -- Present Value of 01 basis point
    
    -- Calculation Metadata
    calculation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    yield_shock DECIMAL(8, 4) NOT NULL, -- basis points used for calculation
    yield_used DECIMAL(10, 6) NOT NULL,
    price_used DECIMAL(12, 6) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL,
    
    CONSTRAINT valid_durations CHECK (
        modified_duration >= 0 AND macaulay_duration >= 0 AND dollar_duration >= 0
    )
);

-- Create convexity analytics table
CREATE TABLE IF NOT EXISTS fixed_income_convexity_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    security_id UUID NOT NULL REFERENCES fixed_income_securities(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Convexity Metrics
    convexity DECIMAL(12, 6) NOT NULL,
    effective_convexity DECIMAL(12, 6),
    option_adjusted_convexity DECIMAL(12, 6),
    dollar_convexity DECIMAL(18, 6) NOT NULL,
    
    -- Second-order price sensitivity
    gamma DECIMAL(15, 8) NOT NULL,
    
    -- Calculation Metadata
    calculation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    yield_shock DECIMAL(8, 4) NOT NULL, -- basis points used for calculation
    yield_used DECIMAL(10, 6) NOT NULL,
    price_used DECIMAL(12, 6) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL,
    
    CONSTRAINT valid_convexity CHECK (convexity >= 0 AND dollar_convexity >= 0)
);

-- Create credit analytics table
CREATE TABLE IF NOT EXISTS fixed_income_credit_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    security_id UUID NOT NULL REFERENCES fixed_income_securities(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Credit Risk Metrics
    credit_spread DECIMAL(8, 4) NOT NULL, -- in basis points
    default_probability DECIMAL(10, 8) NOT NULL,
    recovery_rate DECIMAL(8, 6) NOT NULL,
    credit_var DECIMAL(18, 6) NOT NULL,
    expected_loss DECIMAL(18, 6) NOT NULL,
    unexpected_loss DECIMAL(18, 6) NOT NULL,
    
    -- Credit Curve Analysis
    hazard_rate DECIMAL(10, 8) NOT NULL,
    survival_probability DECIMAL(10, 8) NOT NULL,
    
    -- Calculation Metadata
    calculation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    horizon_days INTEGER NOT NULL,
    confidence_level DECIMAL(6, 4) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL,
    
    CONSTRAINT valid_credit_metrics CHECK (
        default_probability >= 0 AND default_probability <= 1 AND
        recovery_rate >= 0 AND recovery_rate <= 1 AND
        confidence_level > 0 AND confidence_level < 1
    )
);

-- Create option analytics table (for callable/putable bonds)
CREATE TABLE IF NOT EXISTS fixed_income_option_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    security_id UUID NOT NULL REFERENCES fixed_income_securities(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Option Valuation
    option_value DECIMAL(15, 6) NOT NULL,
    option_adjusted_price DECIMAL(12, 6) NOT NULL,
    implied_volatility DECIMAL(8, 6),
    
    -- Greeks for embedded options
    delta DECIMAL(8, 6),
    gamma DECIMAL(8, 6),
    theta DECIMAL(8, 6),
    vega DECIMAL(8, 6),
    rho DECIMAL(8, 6),
    
    -- Call/Put specific
    call_value DECIMAL(15, 6),
    put_value DECIMAL(15, 6),
    
    -- Calculation Metadata
    calculation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    model_used VARCHAR(100) NOT NULL,
    volatility_used DECIMAL(8, 6),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL
);

-- Create mortgage-backed securities analytics table
CREATE TABLE IF NOT EXISTS fixed_income_mbs_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    security_id UUID NOT NULL REFERENCES fixed_income_securities(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) NOT NULL,
    
    -- MBS Specific Metrics
    weighted_average_maturity DECIMAL(8, 4) NOT NULL,
    weighted_average_coupon DECIMAL(8, 6) NOT NULL,
    weighted_average_life DECIMAL(8, 4) NOT NULL,
    prepayment_speed DECIMAL(8, 4) NOT NULL, -- CPR (Conditional Prepayment Rate)
    psa DECIMAL(8, 4) NOT NULL, -- PSA (Public Securities Association) speed
    
    -- Cash Flow Analysis
    principal_paydown DECIMAL(18, 6) NOT NULL,
    interest_payment DECIMAL(18, 6) NOT NULL,
    prepayment_amount DECIMAL(18, 6) NOT NULL,
    
    -- Option-Adjusted Metrics
    option_adjusted_spread DECIMAL(8, 4) NOT NULL,
    option_adjusted_duration DECIMAL(10, 6) NOT NULL,
    option_adjusted_convexity DECIMAL(12, 6) NOT NULL,
    
    calculation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL
);

-- Create asset-backed securities analytics table
CREATE TABLE IF NOT EXISTS fixed_income_abs_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    security_id UUID NOT NULL REFERENCES fixed_income_securities(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) NOT NULL,
    
    -- ABS Specific Metrics
    underlying_asset_type VARCHAR(100) NOT NULL,
    collateral_factor DECIMAL(8, 6) NOT NULL,
    enhancement_level DECIMAL(8, 6) NOT NULL,
    average_life DECIMAL(8, 4) NOT NULL,
    
    -- Credit Enhancement
    subordination DECIMAL(8, 6) NOT NULL,
    excess_spread DECIMAL(8, 4) NOT NULL,
    reserve_fund DECIMAL(8, 6) NOT NULL,
    
    -- Loss Analysis
    expected_loss_rate DECIMAL(8, 6) NOT NULL,
    worst_case_loss_rate DECIMAL(8, 6) NOT NULL,
    break_even_default_rate DECIMAL(8, 6) NOT NULL,
    
    calculation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL
);

-- Create fixed income portfolio analytics table
CREATE TABLE IF NOT EXISTS fixed_income_portfolio_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id),
    tenant_id VARCHAR(255) NOT NULL,
    analysis_date DATE NOT NULL,
    
    -- Portfolio-level metrics
    portfolio_yield DECIMAL(10, 6) NOT NULL,
    portfolio_duration DECIMAL(10, 6) NOT NULL,
    portfolio_convexity DECIMAL(12, 6) NOT NULL,
    portfolio_spread DECIMAL(8, 4) NOT NULL,
    
    -- Risk Metrics
    interest_rate_var DECIMAL(18, 6) NOT NULL,
    credit_var DECIMAL(18, 6) NOT NULL,
    total_var DECIMAL(18, 6) NOT NULL,
    
    -- Allocation Breakdowns (stored as JSONB)
    sector_allocation JSONB NOT NULL,
    rating_allocation JSONB NOT NULL,
    maturity_distribution JSONB NOT NULL,
    
    -- Cash Flow Analysis
    expected_cash_flows JSONB NOT NULL,
    
    -- Stress Testing
    stress_test_results JSONB NOT NULL,
    
    -- Metadata
    calculation_time INTEGER NOT NULL, -- milliseconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL,
    
    CONSTRAINT valid_portfolio_metrics CHECK (
        portfolio_yield >= -1 AND portfolio_duration >= 0 AND 
        interest_rate_var >= 0 AND credit_var >= 0 AND total_var >= 0
    )
);

-- Create yield calculation history table
CREATE TABLE IF NOT EXISTS fixed_income_yield_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    security_id UUID NOT NULL REFERENCES fixed_income_securities(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Calculation Request
    price_used DECIMAL(12, 6) NOT NULL,
    settlement_date DATE NOT NULL,
    yield_types VARCHAR(50)[] NOT NULL,
    tax_rate DECIMAL(8, 6),
    
    -- Calculation Results (stored as JSONB)
    yield_results JSONB NOT NULL,
    warnings TEXT[],
    
    -- Performance Metrics
    calculation_time INTEGER NOT NULL, -- milliseconds
    calculation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID NOT NULL,
    
    CONSTRAINT valid_calculation_price CHECK (price_used > 0)
);

-- Create duration/convexity calculation history table
CREATE TABLE IF NOT EXISTS fixed_income_duration_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    security_id UUID NOT NULL REFERENCES fixed_income_securities(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Calculation Request
    price_used DECIMAL(12, 6) NOT NULL,
    yield_used DECIMAL(10, 6) NOT NULL,
    settlement_date DATE NOT NULL,
    yield_shock DECIMAL(8, 4) NOT NULL,
    duration_types VARCHAR(50)[] NOT NULL,
    
    -- Calculation Results (stored as JSONB)
    duration_results JSONB NOT NULL,
    convexity_results JSONB NOT NULL,
    warnings TEXT[],
    
    -- Performance Metrics
    calculation_time INTEGER NOT NULL, -- milliseconds
    calculation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID NOT NULL,
    
    CONSTRAINT valid_duration_inputs CHECK (price_used > 0 AND yield_shock > 0)
);

-- Create credit analysis history table
CREATE TABLE IF NOT EXISTS fixed_income_credit_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    security_id UUID NOT NULL REFERENCES fixed_income_securities(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Calculation Request
    horizon_days INTEGER NOT NULL,
    confidence_level DECIMAL(6, 4) NOT NULL,
    recovery_rate DECIMAL(8, 6),
    include_rating_migration BOOLEAN NOT NULL DEFAULT false,
    
    -- Calculation Results (stored as JSONB)
    credit_results JSONB NOT NULL,
    warnings TEXT[],
    
    -- Performance Metrics
    calculation_time INTEGER NOT NULL, -- milliseconds
    calculation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID NOT NULL,
    
    CONSTRAINT valid_credit_inputs CHECK (
        horizon_days > 0 AND confidence_level > 0 AND confidence_level < 1
    )
);

-- Create indexes for performance optimization

-- Fixed Income Securities indexes
CREATE INDEX IF NOT EXISTS idx_fixed_income_securities_tenant ON fixed_income_securities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fixed_income_securities_instrument ON fixed_income_securities(instrument_id);
CREATE INDEX IF NOT EXISTS idx_fixed_income_securities_bond_type ON fixed_income_securities(bond_type);
CREATE INDEX IF NOT EXISTS idx_fixed_income_securities_credit_rating ON fixed_income_securities(credit_rating_sp);
CREATE INDEX IF NOT EXISTS idx_fixed_income_securities_maturity ON fixed_income_securities(maturity_date);
CREATE INDEX IF NOT EXISTS idx_fixed_income_securities_issuer ON fixed_income_securities(issuer_name);
CREATE INDEX IF NOT EXISTS idx_fixed_income_securities_sector ON fixed_income_securities(sector);
CREATE INDEX IF NOT EXISTS idx_fixed_income_securities_callable ON fixed_income_securities(is_callable);
CREATE INDEX IF NOT EXISTS idx_fixed_income_securities_putable ON fixed_income_securities(is_putable);

-- Call/Put Provisions indexes
CREATE INDEX IF NOT EXISTS idx_call_provisions_security ON fixed_income_call_provisions(security_id);
CREATE INDEX IF NOT EXISTS idx_call_provisions_date ON fixed_income_call_provisions(call_date);
CREATE INDEX IF NOT EXISTS idx_call_provisions_active ON fixed_income_call_provisions(is_active);
CREATE INDEX IF NOT EXISTS idx_put_provisions_security ON fixed_income_put_provisions(security_id);
CREATE INDEX IF NOT EXISTS idx_put_provisions_date ON fixed_income_put_provisions(put_date);
CREATE INDEX IF NOT EXISTS idx_put_provisions_active ON fixed_income_put_provisions(is_active);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_yield_analytics_security ON fixed_income_yield_analytics(security_id);
CREATE INDEX IF NOT EXISTS idx_yield_analytics_tenant ON fixed_income_yield_analytics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_yield_analytics_calculation_date ON fixed_income_yield_analytics(calculation_date DESC);

CREATE INDEX IF NOT EXISTS idx_duration_analytics_security ON fixed_income_duration_analytics(security_id);
CREATE INDEX IF NOT EXISTS idx_duration_analytics_tenant ON fixed_income_duration_analytics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_duration_analytics_calculation_date ON fixed_income_duration_analytics(calculation_date DESC);

CREATE INDEX IF NOT EXISTS idx_convexity_analytics_security ON fixed_income_convexity_analytics(security_id);
CREATE INDEX IF NOT EXISTS idx_convexity_analytics_tenant ON fixed_income_convexity_analytics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_convexity_analytics_calculation_date ON fixed_income_convexity_analytics(calculation_date DESC);

CREATE INDEX IF NOT EXISTS idx_credit_analytics_security ON fixed_income_credit_analytics(security_id);
CREATE INDEX IF NOT EXISTS idx_credit_analytics_tenant ON fixed_income_credit_analytics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_credit_analytics_calculation_date ON fixed_income_credit_analytics(calculation_date DESC);

-- Portfolio Analytics indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_portfolio ON fixed_income_portfolio_analytics(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_tenant ON fixed_income_portfolio_analytics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_analysis_date ON fixed_income_portfolio_analytics(analysis_date DESC);

-- Calculation History indexes
CREATE INDEX IF NOT EXISTS idx_yield_calculations_security ON fixed_income_yield_calculations(security_id);
CREATE INDEX IF NOT EXISTS idx_yield_calculations_tenant ON fixed_income_yield_calculations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_yield_calculations_date ON fixed_income_yield_calculations(calculation_date DESC);

CREATE INDEX IF NOT EXISTS idx_duration_calculations_security ON fixed_income_duration_calculations(security_id);
CREATE INDEX IF NOT EXISTS idx_duration_calculations_tenant ON fixed_income_duration_calculations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_duration_calculations_date ON fixed_income_duration_calculations(calculation_date DESC);

CREATE INDEX IF NOT EXISTS idx_credit_calculations_security ON fixed_income_credit_calculations(security_id);
CREATE INDEX IF NOT EXISTS idx_credit_calculations_tenant ON fixed_income_credit_calculations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_credit_calculations_date ON fixed_income_credit_calculations(calculation_date DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_fixed_income_securities_tenant_type_rating ON fixed_income_securities(tenant_id, bond_type, credit_rating_sp);
CREATE INDEX IF NOT EXISTS idx_fixed_income_securities_tenant_maturity_yield ON fixed_income_securities(tenant_id, maturity_date, current_price);
CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_tenant_portfolio_date ON fixed_income_portfolio_analytics(tenant_id, portfolio_id, analysis_date DESC);

-- Create triggers for updated_at fields
CREATE OR REPLACE FUNCTION update_fixed_income_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fixed_income_securities_updated_at 
    BEFORE UPDATE ON fixed_income_securities 
    FOR EACH ROW EXECUTE FUNCTION update_fixed_income_updated_at_column();

-- Insert sample fixed income securities for testing
INSERT INTO fixed_income_securities (
    tenant_id,
    instrument_id,
    cusip,
    isin,
    symbol,
    issuer_name,
    bond_type,
    security_description,
    currency,
    country,
    sector,
    industry,
    issue_date,
    maturity_date,
    original_maturity,
    remaining_maturity,
    face_value,
    coupon_rate,
    payment_frequency,
    day_count_convention,
    credit_rating_moody,
    credit_rating_sp,
    credit_rating_fitch,
    seniority,
    security_type,
    is_callable,
    is_putable,
    current_price,
    price_date,
    accrued_interest,
    clean_price,
    dirty_price,
    spread_to_treasury,
    spread_to_benchmark,
    created_by
) VALUES 
(
    'system',
    'US-GOVT-10Y-001',
    '912828Z29',
    'US912828Z292',
    'T 2.5 05/15/2034',
    'United States Treasury',
    'TREASURY',
    'Treasury Note 2.50% due 05/15/2034',
    'USD',
    'US',
    'Government',
    'Sovereign',
    '2024-05-15',
    '2034-05-15',
    10.0,
    9.33,
    1000.00,
    0.025,
    'SEMI_ANNUAL',
    'ACT_ACT',
    'AAA',
    'AAA',
    'AAA',
    'Senior',
    'Government Bond',
    false,
    false,
    98.50,
    CURRENT_DATE,
    12.34,
    98.50,
    110.84,
    0,
    0,
    '00000000-0000-0000-0000-000000000000'
),
(
    'system',
    'US-CORP-AAPL-001',
    '037833100',
    'US0378331005',
    'AAPL 3.25 02/23/2029',
    'Apple Inc.',
    'CORPORATE',
    'Apple Inc. 3.25% Senior Notes due 02/23/2029',
    'USD',
    'US',
    'Technology',
    'Technology Hardware',
    '2019-02-23',
    '2029-02-23',
    10.0,
    4.2,
    1000.00,
    0.0325,
    'SEMI_ANNUAL',
    'THIRTY_360',
    'AA_PLUS',
    'AA_PLUS',
    'AA_PLUS',
    'Senior Unsecured',
    'Corporate Bond',
    false,
    false,
    102.25,
    CURRENT_DATE,
    8.12,
    102.25,
    110.37,
    45,
    45,
    '00000000-0000-0000-0000-000000000000'
),
(
    'system',
    'US-MUNI-NYC-001',
    '65035E123',
    'US65035E1234',
    'NYC GO 4.0 08/01/2035',
    'New York City',
    'MUNICIPAL',
    'New York City General Obligation Bond 4.00% due 08/01/2035',
    'USD',
    'US',
    'Municipal',
    'General Obligation',
    '2020-08-01',
    '2035-08-01',
    15.0,
    10.6,
    1000.00,
    0.04,
    'SEMI_ANNUAL',
    'THIRTY_360',
    'AA',
    'AA_MINUS',
    'AA',
    'General Obligation',
    'Municipal Bond',
    true,
    false,
    105.75,
    CURRENT_DATE,
    20.00,
    105.75,
    125.75,
    65,
    65,
    '00000000-0000-0000-0000-000000000000'
);

-- Insert sample call provisions for the callable municipal bond
INSERT INTO fixed_income_call_provisions (
    security_id,
    call_date,
    call_price,
    call_type,
    notice_days,
    is_active
)
SELECT 
    s.id,
    '2030-08-01',
    102.00,
    'CALL',
    30,
    true
FROM fixed_income_securities s
WHERE s.instrument_id = 'US-MUNI-NYC-001'
ON CONFLICT DO NOTHING;

-- Insert sample yield analytics
INSERT INTO fixed_income_yield_analytics (
    security_id,
    tenant_id,
    yield_to_maturity,
    yield_to_worst,
    yield_to_call,
    current_yield,
    running_yield,
    tax_equivalent_yield,
    benchmark_yield,
    yield_spread,
    z_spread,
    calculation_date,
    calculation_method,
    settlement_date,
    price_used,
    created_by
)
SELECT 
    s.id,
    s.tenant_id,
    CASE s.bond_type
        WHEN 'TREASURY' THEN 0.0265
        WHEN 'CORPORATE' THEN 0.0378
        WHEN 'MUNICIPAL' THEN 0.0342
        ELSE 0.035
    END,
    CASE s.bond_type
        WHEN 'TREASURY' THEN 0.0265
        WHEN 'CORPORATE' THEN 0.0378
        WHEN 'MUNICIPAL' THEN 0.0320  -- YTW due to call feature
        ELSE 0.035
    END,
    CASE WHEN s.is_callable THEN 0.0320 ELSE NULL END,
    s.coupon_rate / (s.current_price / 100),
    s.coupon_rate / (s.current_price / 100),
    CASE WHEN s.bond_type = 'MUNICIPAL' THEN 0.0513 ELSE NULL END, -- TEY at 33% tax rate
    CASE s.bond_type
        WHEN 'TREASURY' THEN 0.0265
        WHEN 'CORPORATE' THEN 0.0265  -- Treasury benchmark
        WHEN 'MUNICIPAL' THEN 0.0265
        ELSE 0.0265
    END,
    CASE s.bond_type
        WHEN 'TREASURY' THEN 0
        WHEN 'CORPORATE' THEN 113  -- 113bp spread
        WHEN 'MUNICIPAL' THEN 77   -- 77bp spread
        ELSE 50
    END,
    CASE s.bond_type
        WHEN 'TREASURY' THEN 5
        WHEN 'CORPORATE' THEN 125
        WHEN 'MUNICIPAL' THEN 85
        ELSE 60
    END,
    NOW(),
    'Newton-Raphson',
    CURRENT_DATE,
    s.current_price,
    '00000000-0000-0000-0000-000000000000'
FROM fixed_income_securities s
WHERE s.tenant_id = 'system'
ON CONFLICT DO NOTHING;

-- Insert sample duration analytics
INSERT INTO fixed_income_duration_analytics (
    security_id,
    tenant_id,
    modified_duration,
    macaulay_duration,
    effective_duration,
    dollar_duration,
    dv01,
    pv01,
    calculation_date,
    yield_shock,
    yield_used,
    price_used,
    created_by
)
SELECT 
    s.id,
    s.tenant_id,
    CASE s.bond_type
        WHEN 'TREASURY' THEN 8.45
        WHEN 'CORPORATE' THEN 3.82
        WHEN 'MUNICIPAL' THEN 7.23
        ELSE 5.0
    END,
    CASE s.bond_type
        WHEN 'TREASURY' THEN 8.73
        WHEN 'CORPORATE' THEN 3.95
        WHEN 'MUNICIPAL' THEN 7.58
        ELSE 5.2
    END,
    CASE s.bond_type
        WHEN 'TREASURY' THEN 8.45
        WHEN 'CORPORATE' THEN 3.82
        WHEN 'MUNICIPAL' THEN 6.85  -- Lower due to call option
        ELSE 5.0
    END,
    CASE s.bond_type
        WHEN 'TREASURY' THEN 8.32  -- 8.45 * 98.50 / 100
        WHEN 'CORPORATE' THEN 3.91  -- 3.82 * 102.25 / 100
        WHEN 'MUNICIPAL' THEN 7.65  -- 7.23 * 105.75 / 100
        ELSE 5.0
    END,
    CASE s.bond_type
        WHEN 'TREASURY' THEN 0.0832
        WHEN 'CORPORATE' THEN 0.0391
        WHEN 'MUNICIPAL' THEN 0.0765
        ELSE 0.05
    END,
    CASE s.bond_type
        WHEN 'TREASURY' THEN 0.0832
        WHEN 'CORPORATE' THEN 0.0391
        WHEN 'MUNICIPAL' THEN 0.0765
        ELSE 0.05
    END,
    NOW(),
    100.0,  -- 100bp shock
    CASE s.bond_type
        WHEN 'TREASURY' THEN 0.0265
        WHEN 'CORPORATE' THEN 0.0378
        WHEN 'MUNICIPAL' THEN 0.0342
        ELSE 0.035
    END,
    s.current_price,
    '00000000-0000-0000-0000-000000000000'
FROM fixed_income_securities s
WHERE s.tenant_id = 'system'
ON CONFLICT DO NOTHING;

-- Insert sample convexity analytics
INSERT INTO fixed_income_convexity_analytics (
    security_id,
    tenant_id,
    convexity,
    effective_convexity,
    dollar_convexity,
    gamma,
    calculation_date,
    yield_shock,
    yield_used,
    price_used,
    created_by
)
SELECT 
    s.id,
    s.tenant_id,
    CASE s.bond_type
        WHEN 'TREASURY' THEN 85.3
        WHEN 'CORPORATE' THEN 18.7
        WHEN 'MUNICIPAL' THEN 65.2
        ELSE 40.0
    END,
    CASE s.bond_type
        WHEN 'TREASURY' THEN 85.3
        WHEN 'CORPORATE' THEN 18.7
        WHEN 'MUNICIPAL' THEN 58.9  -- Lower due to negative convexity from call
        ELSE 40.0
    END,
    CASE s.bond_type
        WHEN 'TREASURY' THEN 8.40   -- 85.3 * 98.50 / 1000
        WHEN 'CORPORATE' THEN 1.91  -- 18.7 * 102.25 / 1000
        WHEN 'MUNICIPAL' THEN 6.90  -- 65.2 * 105.75 / 1000
        ELSE 4.0
    END,
    CASE s.bond_type
        WHEN 'TREASURY' THEN 0.00085
        WHEN 'CORPORATE' THEN 0.00019
        WHEN 'MUNICIPAL' THEN 0.00065
        ELSE 0.0004
    END,
    NOW(),
    100.0,  -- 100bp shock
    CASE s.bond_type
        WHEN 'TREASURY' THEN 0.0265
        WHEN 'CORPORATE' THEN 0.0378
        WHEN 'MUNICIPAL' THEN 0.0342
        ELSE 0.035
    END,
    s.current_price,
    '00000000-0000-0000-0000-000000000000'
FROM fixed_income_securities s
WHERE s.tenant_id = 'system'
ON CONFLICT DO NOTHING;

-- Insert sample credit analytics
INSERT INTO fixed_income_credit_analytics (
    security_id,
    tenant_id,
    credit_spread,
    default_probability,
    recovery_rate,
    credit_var,
    expected_loss,
    unexpected_loss,
    hazard_rate,
    survival_probability,
    calculation_date,
    horizon_days,
    confidence_level,
    created_by
)
SELECT 
    s.id,
    s.tenant_id,
    CASE s.bond_type
        WHEN 'TREASURY' THEN 0
        WHEN 'CORPORATE' THEN 113
        WHEN 'MUNICIPAL' THEN 77
        ELSE 50
    END,
    CASE s.bond_type
        WHEN 'TREASURY' THEN 0.0001
        WHEN 'CORPORATE' THEN 0.0025  -- AA+ rating
        WHEN 'MUNICIPAL' THEN 0.0015  -- AA rating
        ELSE 0.005
    END,
    0.40,  -- 40% recovery rate
    CASE s.bond_type
        WHEN 'TREASURY' THEN 0.01
        WHEN 'CORPORATE' THEN 15.3
        WHEN 'MUNICIPAL' THEN 9.5
        ELSE 12.0
    END,
    CASE s.bond_type
        WHEN 'TREASURY' THEN 0.006  -- 0.0001 * 0.6 * 100 (per $100 face)
        WHEN 'CORPORATE' THEN 1.53  -- 0.0025 * 0.6 * 1022.5
        WHEN 'MUNICIPAL' THEN 0.95  -- 0.0015 * 0.6 * 1057.5
        ELSE 3.0
    END,
    CASE s.bond_type
        WHEN 'TREASURY' THEN 0.01
        WHEN 'CORPORATE' THEN 12.8
        WHEN 'MUNICIPAL' THEN 8.2
        ELSE 10.0
    END,
    CASE s.bond_type
        WHEN 'TREASURY' THEN 0.0001
        WHEN 'CORPORATE' THEN 0.0025
        WHEN 'MUNICIPAL' THEN 0.0015
        ELSE 0.005
    END,
    CASE s.bond_type
        WHEN 'TREASURY' THEN 0.9999
        WHEN 'CORPORATE' THEN 0.9975
        WHEN 'MUNICIPAL' THEN 0.9985
        ELSE 0.995
    END,
    NOW(),
    365,  -- 1 year horizon
    0.95, -- 95% confidence level
    '00000000-0000-0000-0000-000000000000'
FROM fixed_income_securities s
WHERE s.tenant_id = 'system'
ON CONFLICT DO NOTHING;