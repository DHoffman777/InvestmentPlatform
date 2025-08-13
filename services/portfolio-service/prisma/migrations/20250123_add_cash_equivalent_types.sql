-- Migration to add enhanced cash equivalent support
-- Add new security types for money market funds and sweep accounts

-- First, add new values to the SecurityType enum
ALTER TYPE "SecurityType" ADD VALUE IF NOT EXISTS 'MONEY_MARKET_FUND';
ALTER TYPE "SecurityType" ADD VALUE IF NOT EXISTS 'SWEEP_ACCOUNT';
ALTER TYPE "SecurityType" ADD VALUE IF NOT EXISTS 'TREASURY_BILL';
ALTER TYPE "SecurityType" ADD VALUE IF NOT EXISTS 'COMMERCIAL_PAPER';
ALTER TYPE "SecurityType" ADD VALUE IF NOT EXISTS 'CERTIFICATE_OF_DEPOSIT';

-- Add new transaction types for cash equivalent operations
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'SWEEP_IN';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'SWEEP_OUT';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'YIELD_DISTRIBUTION';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'MATURITY_PROCEEDS';

-- Create table for money market fund reference data
CREATE TABLE IF NOT EXISTS money_market_funds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(20) UNIQUE NOT NULL,
    provider VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('GOVERNMENT', 'PRIME', 'MUNICIPAL', 'TREASURY')),
    
    -- Fund characteristics
    seven_day_yield DECIMAL(10, 6) DEFAULT 0,
    thirty_day_yield DECIMAL(10, 6) DEFAULT 0,
    expense_ratio DECIMAL(10, 6) DEFAULT 0,
    min_investment DECIMAL(15, 2) DEFAULT 0,
    net_asset_value DECIMAL(10, 6) DEFAULT 1.000000,
    
    -- Stability metrics
    wam_days INTEGER DEFAULT 0, -- Weighted Average Maturity
    wal_days INTEGER DEFAULT 0, -- Weighted Average Life
    
    -- Credit quality (percentages)
    credit_quality_aaa DECIMAL(5, 2) DEFAULT 0,
    credit_quality_aa DECIMAL(5, 2) DEFAULT 0,
    credit_quality_a DECIMAL(5, 2) DEFAULT 0,
    credit_quality_other DECIMAL(5, 2) DEFAULT 0,
    
    -- Liquidity features
    daily_liquidity DECIMAL(5, 2) DEFAULT 100,
    weekly_liquidity DECIMAL(5, 2) DEFAULT 100,
    gate_threshold DECIMAL(5, 2),
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT TRUE,
    rating_agency_code VARCHAR(20),
    prospectus_date DATE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_yields CHECK (
        seven_day_yield >= 0 AND seven_day_yield <= 50 AND
        thirty_day_yield >= 0 AND thirty_day_yield <= 50
    ),
    CONSTRAINT valid_credit_quality CHECK (
        credit_quality_aaa + credit_quality_aa + credit_quality_a + credit_quality_other <= 100.01
    ),
    CONSTRAINT valid_liquidity CHECK (
        daily_liquidity >= 0 AND daily_liquidity <= 100 AND
        weekly_liquidity >= 0 AND weekly_liquidity <= 100
    )
);

-- Create table for sweep account configurations
CREATE TABLE IF NOT EXISTS sweep_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id VARCHAR(50) UNIQUE NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('FDIC_INSURED', 'MONEY_MARKET', 'TREASURY_BILLS')),
    
    -- Account characteristics
    current_rate DECIMAL(10, 6) DEFAULT 0,
    tier1_rate DECIMAL(10, 6),
    tier2_rate DECIMAL(10, 6),
    tier1_limit DECIMAL(15, 2),
    
    -- FDIC insurance
    fdic_insured BOOLEAN DEFAULT FALSE,
    fdic_limit DECIMAL(15, 2),
    
    -- Sweep features
    sweep_threshold DECIMAL(15, 2) DEFAULT 0,
    sweep_frequency VARCHAR(20) DEFAULT 'DAILY' CHECK (sweep_frequency IN ('DAILY', 'WEEKLY', 'REAL_TIME')),
    auto_sweep_enabled BOOLEAN DEFAULT TRUE,
    
    -- Restrictions
    minimum_balance DECIMAL(15, 2) DEFAULT 0,
    maximum_balance DECIMAL(15, 2),
    monthly_transaction_limit INTEGER,
    
    -- Status and dates
    is_active BOOLEAN DEFAULT TRUE,
    open_date DATE NOT NULL,
    last_sweep_date TIMESTAMP WITH TIME ZONE,
    next_sweep_date TIMESTAMP WITH TIME ZONE,
    
    -- Associated accounts
    custodian_account VARCHAR(50),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_rates CHECK (
        current_rate >= 0 AND current_rate <= 50 AND
        (tier1_rate IS NULL OR (tier1_rate >= 0 AND tier1_rate <= 50)) AND
        (tier2_rate IS NULL OR (tier2_rate >= 0 AND tier2_rate <= 50))
    ),
    CONSTRAINT valid_balances CHECK (
        minimum_balance >= 0 AND
        (maximum_balance IS NULL OR maximum_balance > minimum_balance)
    )
);

-- Create table for yield calculations and distributions
CREATE TABLE IF NOT EXISTS yield_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position_id UUID NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Calculation details
    calculation_date DATE NOT NULL,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    
    -- Yield metrics
    current_yield DECIMAL(10, 6) DEFAULT 0,
    effective_yield DECIMAL(10, 6) DEFAULT 0,
    compound_yield DECIMAL(10, 6) DEFAULT 0,
    tax_equivalent_yield DECIMAL(10, 6),
    
    -- Yield components
    dividend_yield DECIMAL(10, 6) DEFAULT 0,
    interest_yield DECIMAL(10, 6) DEFAULT 0,
    fee_adjusted_yield DECIMAL(10, 6) DEFAULT 0,
    
    -- Calculation metadata
    period_days INTEGER NOT NULL,
    annualization_factor DECIMAL(10, 6) NOT NULL,
    calculation_method VARCHAR(20) DEFAULT 'SIMPLE' CHECK (calculation_method IN ('SIMPLE', 'COMPOUND', 'SEC_YIELD')),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    calculated_by UUID,
    
    -- Foreign keys will be added via application-level constraints
    -- since we can't reference across services easily
    
    -- Indexes
    CONSTRAINT valid_yields CHECK (
        current_yield >= 0 AND current_yield <= 50 AND
        effective_yield >= 0 AND effective_yield <= 50 AND
        compound_yield >= 0 AND compound_yield <= 50
    )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_money_market_funds_symbol ON money_market_funds(symbol);
CREATE INDEX IF NOT EXISTS idx_money_market_funds_provider ON money_market_funds(provider);
CREATE INDEX IF NOT EXISTS idx_money_market_funds_category ON money_market_funds(category);
CREATE INDEX IF NOT EXISTS idx_money_market_funds_active ON money_market_funds(is_active);

CREATE INDEX IF NOT EXISTS idx_sweep_accounts_account_id ON sweep_accounts(account_id);
CREATE INDEX IF NOT EXISTS idx_sweep_accounts_provider ON sweep_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_sweep_accounts_type ON sweep_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_sweep_accounts_active ON sweep_accounts(is_active);

CREATE INDEX IF NOT EXISTS idx_yield_calculations_position ON yield_calculations(position_id);
CREATE INDEX IF NOT EXISTS idx_yield_calculations_tenant ON yield_calculations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_yield_calculations_date ON yield_calculations(calculation_date);

-- Add some sample money market funds for testing
INSERT INTO money_market_funds (
    fund_id, name, symbol, provider, category,
    seven_day_yield, thirty_day_yield, expense_ratio,
    min_investment, net_asset_value,
    wam_days, wal_days,
    credit_quality_aaa, credit_quality_aa, credit_quality_a, credit_quality_other,
    daily_liquidity, weekly_liquidity,
    is_active, prospectus_date
) VALUES 
    ('VMFXX', 'Vanguard Federal Money Market Fund', 'VMFXX', 'Vanguard', 'GOVERNMENT',
     4.85, 4.80, 0.11, 3000, 1.000000, 
     28, 45, 100, 0, 0, 0, 100, 100, 
     TRUE, '2024-01-01'),
    ('SPAXX', 'Fidelity Government Cash Reserves', 'SPAXX', 'Fidelity', 'GOVERNMENT',
     4.78, 4.75, 0.42, 1, 1.000000,
     25, 42, 100, 0, 0, 0, 100, 100,
     TRUE, '2024-01-01'),
    ('SWVXX', 'Charles Schwab Value Advantage Money Fund', 'SWVXX', 'Schwab', 'PRIME',
     5.02, 4.98, 0.34, 1, 1.000000,
     32, 48, 65, 20, 15, 0, 100, 100,
     TRUE, '2024-01-01')
ON CONFLICT (fund_id) DO NOTHING;

-- Add sample sweep account configurations
INSERT INTO sweep_accounts (
    account_id, account_number, provider, account_type,
    current_rate, fdic_insured, fdic_limit,
    sweep_threshold, sweep_frequency, auto_sweep_enabled,
    minimum_balance, monthly_transaction_limit,
    is_active, open_date
) VALUES 
    ('SCHWAB_SWEEP_001', 'SW-SWEEP-001', 'Charles Schwab', 'FDIC_INSURED',
     4.25, TRUE, 250000, 1000, 'DAILY', TRUE,
     0, 6, TRUE, '2024-01-01'),
    ('FIDELITY_CORE_001', 'FID-CORE-001', 'Fidelity', 'MONEY_MARKET',
     4.35, FALSE, NULL, 500, 'REAL_TIME', TRUE,
     0, NULL, TRUE, '2024-01-01'),
    ('VANGUARD_SWEEP_001', 'VG-SWEEP-001', 'Vanguard', 'MONEY_MARKET',
     4.20, FALSE, NULL, 2000, 'DAILY', TRUE,
     100, 12, TRUE, '2024-01-01')
ON CONFLICT (account_id) DO NOTHING;

-- Update trigger for updated_at fields
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_money_market_funds_updated_at 
    BEFORE UPDATE ON money_market_funds 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sweep_accounts_updated_at 
    BEFORE UPDATE ON sweep_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();