-- Migration to add comprehensive asset classification and categorization system
-- Supports multi-dimensional classification, asset allocation models, and compliance monitoring

-- Create enum types for asset classification
CREATE TYPE "AssetType" AS ENUM ('EQUITY', 'FIXED_INCOME', 'CASH_EQUIVALENT', 'ALTERNATIVE', 'DERIVATIVE');
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'VERY_HIGH');
CREATE TYPE "LiquidityTier" AS ENUM ('T0', 'T1', 'T2', 'T3', 'ILLIQUID');
CREATE TYPE "RiskProfile" AS ENUM ('CONSERVATIVE', 'MODERATE', 'AGGRESSIVE', 'VERY_AGGRESSIVE');
CREATE TYPE "TimeHorizon" AS ENUM ('SHORT', 'MEDIUM', 'LONG', 'VERY_LONG');
CREATE TYPE "RebalancingFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'TACTICAL');
CREATE TYPE "MarketCapCategory" AS ENUM ('LARGE_CAP', 'MID_CAP', 'SMALL_CAP', 'MICRO_CAP');
CREATE TYPE "StyleClassification" AS ENUM ('VALUE', 'GROWTH', 'BLEND');
CREATE TYPE "ConstraintType" AS ENUM ('MIN_ALLOCATION', 'MAX_ALLOCATION', 'MAX_CONCENTRATION', 'MIN_DIVERSIFICATION', 'ESG_MINIMUM', 'SECTOR_LIMIT', 'GEOGRAPHIC_LIMIT');
CREATE TYPE "ConstraintUnit" AS ENUM ('PERCENTAGE', 'DOLLAR_AMOUNT', 'COUNT');
CREATE TYPE "AllocationSeverity" AS ENUM ('WARNING', 'VIOLATION', 'CRITICAL');

-- Create asset classes table - hierarchical classification system
CREATE TABLE IF NOT EXISTS asset_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Basic information
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    parent_class_id UUID REFERENCES asset_classes(id),
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
    
    -- Classification attributes
    asset_type "AssetType" NOT NULL,
    risk_level "RiskLevel" NOT NULL,
    liquidity_tier "LiquidityTier" NOT NULL,
    
    -- Regulatory classifications
    regulatory_category VARCHAR(100),
    sec_classification VARCHAR(100),
    
    -- Investment characteristics
    minimum_investment DECIMAL(15, 2),
    typical_holding_period VARCHAR(50),
    
    -- Status and metadata
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, code),
    CONSTRAINT valid_hierarchy CHECK (
        (parent_class_id IS NULL AND level = 1) OR 
        (parent_class_id IS NOT NULL AND level > 1)
    )
);

-- Create asset sub-classes table - detailed classification within asset classes
CREATE TABLE IF NOT EXISTS asset_sub_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    asset_class_id UUID NOT NULL REFERENCES asset_classes(id),
    
    -- Basic information
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    
    -- Specific characteristics (stored as JSONB for flexibility)
    characteristics JSONB NOT NULL DEFAULT '{}',
    
    -- Performance benchmarks
    primary_benchmark VARCHAR(100),
    secondary_benchmarks TEXT[],
    
    -- Risk metrics
    expected_return DECIMAL(10, 6),
    volatility DECIMAL(10, 6),
    sharpe_ratio DECIMAL(10, 6),
    max_drawdown DECIMAL(10, 6),
    
    -- Correlation data
    correlation_to_market DECIMAL(6, 4),
    correlation_to_bonds DECIMAL(6, 4),
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, asset_class_id, code),
    CONSTRAINT valid_risk_metrics CHECK (
        (expected_return IS NULL OR (expected_return >= -100 AND expected_return <= 100)) AND
        (volatility IS NULL OR (volatility >= 0 AND volatility <= 200)) AND
        (sharpe_ratio IS NULL OR (sharpe_ratio >= -10 AND sharpe_ratio <= 10)) AND
        (max_drawdown IS NULL OR (max_drawdown >= 0 AND max_drawdown <= 100))
    ),
    CONSTRAINT valid_correlations CHECK (
        (correlation_to_market IS NULL OR (correlation_to_market >= -1 AND correlation_to_market <= 1)) AND
        (correlation_to_bonds IS NULL OR (correlation_to_bonds >= -1 AND correlation_to_bonds <= 1))
    )
);

-- Create instrument classifications table - links instruments to classifications
CREATE TABLE IF NOT EXISTS instrument_classifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Instrument identification
    instrument_id VARCHAR(255) NOT NULL, -- CUSIP, ISIN, or internal ID
    symbol VARCHAR(50),
    instrument_name VARCHAR(255) NOT NULL,
    
    -- Primary classification
    asset_class_id UUID REFERENCES asset_classes(id),
    asset_sub_class_id UUID REFERENCES asset_sub_classes(id),
    
    -- Multiple classification dimensions (stored as JSONB array)
    classifications JSONB NOT NULL DEFAULT '[]',
    
    -- Sector/Industry classification (GICS)
    gics_code VARCHAR(20),
    gics_sector VARCHAR(100),
    gics_industry_group VARCHAR(100),
    gics_industry VARCHAR(100),
    gics_sub_industry VARCHAR(100),
    
    -- Geographic classification
    country_code VARCHAR(5),
    region_code VARCHAR(50),
    developed_market BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Market capitalization (for equities)
    market_cap_category "MarketCapCategory",
    
    -- Style classification (for equities)
    style_classification "StyleClassification",
    
    -- Credit quality (for fixed income)
    credit_rating VARCHAR(20),
    investment_grade BOOLEAN,
    
    -- ESG classification
    esg_score INTEGER CHECK (esg_score >= 0 AND esg_score <= 100),
    esg_rating VARCHAR(5),
    sustainability_compliant BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Regulatory classifications
    accredited_investor_only BOOLEAN NOT NULL DEFAULT FALSE,
    institutional_only BOOLEAN NOT NULL DEFAULT FALSE,
    retail_suitable BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Status and metadata
    classification_date DATE NOT NULL,
    last_review_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, instrument_id),
    CONSTRAINT valid_esg_rating CHECK (esg_rating IS NULL OR esg_rating IN ('AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC')),
    CONSTRAINT valid_dates CHECK (last_review_date >= classification_date),
    CONSTRAINT valid_sub_class_relationship CHECK (
        (asset_class_id IS NULL AND asset_sub_class_id IS NULL) OR
        (asset_class_id IS NOT NULL) -- sub_class relationship validated by foreign key
    )
);

-- Create asset allocation models table
CREATE TABLE IF NOT EXISTS asset_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    portfolio_id UUID, -- Optional - can be portfolio-specific or template
    
    -- Basic information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Allocation targets (stored as JSONB array)
    allocations JSONB NOT NULL DEFAULT '[]',
    
    -- Constraints (stored as JSONB array)
    constraints JSONB NOT NULL DEFAULT '[]',
    
    -- Rebalancing rules
    rebalancing_threshold DECIMAL(5, 2) NOT NULL DEFAULT 5.00 CHECK (rebalancing_threshold >= 0 AND rebalancing_threshold <= 100),
    rebalancing_frequency "RebalancingFrequency" NOT NULL DEFAULT 'QUARTERLY',
    
    -- Model characteristics
    risk_profile "RiskProfile" NOT NULL,
    time_horizon "TimeHorizon" NOT NULL,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL,
    
    -- Constraints
    UNIQUE(tenant_id, name)
);

-- Create allocation targets table (normalized from JSONB for better performance)
CREATE TABLE IF NOT EXISTS allocation_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    allocation_id UUID NOT NULL REFERENCES asset_allocations(id) ON DELETE CASCADE,
    
    -- Target specification
    asset_class_id UUID REFERENCES asset_classes(id),
    asset_sub_class_id UUID REFERENCES asset_sub_classes(id),
    
    -- Allocation percentages
    target_percentage DECIMAL(5, 2) NOT NULL CHECK (target_percentage >= 0 AND target_percentage <= 100),
    min_percentage DECIMAL(5, 2) CHECK (min_percentage >= 0 AND min_percentage <= 100),
    max_percentage DECIMAL(5, 2) CHECK (max_percentage >= 0 AND max_percentage <= 100),
    
    -- Strategic vs tactical allocation
    is_strategic BOOLEAN NOT NULL DEFAULT TRUE,
    tactical_adjustment DECIMAL(5, 2) DEFAULT 0 CHECK (tactical_adjustment >= -50 AND tactical_adjustment <= 50),
    
    -- Metadata
    rationale TEXT,
    last_review_date DATE,
    
    -- Constraints
    CONSTRAINT valid_percentage_ranges CHECK (
        (min_percentage IS NULL OR max_percentage IS NULL OR min_percentage <= max_percentage) AND
        (min_percentage IS NULL OR target_percentage >= min_percentage) AND
        (max_percentage IS NULL OR target_percentage <= max_percentage)
    ),
    CONSTRAINT valid_allocation_target CHECK (
        asset_class_id IS NOT NULL OR asset_sub_class_id IS NOT NULL
    )
);

-- Create allocation constraints table (normalized from JSONB)
CREATE TABLE IF NOT EXISTS allocation_constraints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    allocation_id UUID NOT NULL REFERENCES asset_allocations(id) ON DELETE CASCADE,
    
    -- Constraint specification
    constraint_type "ConstraintType" NOT NULL,
    target_identifier VARCHAR(255) NOT NULL, -- What the constraint applies to
    constraint_value DECIMAL(15, 2) NOT NULL,
    constraint_unit "ConstraintUnit" NOT NULL,
    description TEXT NOT NULL,
    is_hard_constraint BOOLEAN NOT NULL DEFAULT TRUE, -- Hard vs soft constraint
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create compliance violations tracking table
CREATE TABLE IF NOT EXISTS compliance_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    portfolio_id UUID NOT NULL,
    constraint_id UUID REFERENCES allocation_constraints(id),
    
    -- Violation details
    constraint_type "ConstraintType" NOT NULL,
    description TEXT NOT NULL,
    current_value DECIMAL(15, 2) NOT NULL,
    limit_value DECIMAL(15, 2) NOT NULL,
    severity "AllocationSeverity" NOT NULL,
    recommended_action TEXT,
    
    -- Resolution tracking
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID
);

-- Create portfolio classification analysis cache table
CREATE TABLE IF NOT EXISTS portfolio_classification_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    portfolio_id UUID NOT NULL,
    
    -- Analysis metadata
    as_of_date DATE NOT NULL,
    analysis_data JSONB NOT NULL DEFAULT '{}', -- Cached analysis results
    
    -- Key metrics (extracted for performance)
    total_market_value DECIMAL(15, 2) NOT NULL,
    portfolio_esg_score INTEGER CHECK (portfolio_esg_score >= 0 AND portfolio_esg_score <= 100),
    portfolio_risk_level "RiskLevel",
    diversification_score DECIMAL(5, 2) CHECK (diversification_score >= 0 AND diversification_score <= 100),
    
    -- Status
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, portfolio_id, as_of_date)
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_asset_classes_tenant ON asset_classes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_asset_classes_type ON asset_classes(asset_type);
CREATE INDEX IF NOT EXISTS idx_asset_classes_parent ON asset_classes(parent_class_id);
CREATE INDEX IF NOT EXISTS idx_asset_classes_active ON asset_classes(is_active);

CREATE INDEX IF NOT EXISTS idx_asset_sub_classes_tenant ON asset_sub_classes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_asset_sub_classes_class ON asset_sub_classes(asset_class_id);
CREATE INDEX IF NOT EXISTS idx_asset_sub_classes_active ON asset_sub_classes(is_active);

CREATE INDEX IF NOT EXISTS idx_instrument_classifications_tenant ON instrument_classifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_instrument_classifications_instrument ON instrument_classifications(instrument_id);
CREATE INDEX IF NOT EXISTS idx_instrument_classifications_symbol ON instrument_classifications(symbol);
CREATE INDEX IF NOT EXISTS idx_instrument_classifications_asset_class ON instrument_classifications(asset_class_id);
CREATE INDEX IF NOT EXISTS idx_instrument_classifications_gics ON instrument_classifications(gics_sector);
CREATE INDEX IF NOT EXISTS idx_instrument_classifications_country ON instrument_classifications(country_code);
CREATE INDEX IF NOT EXISTS idx_instrument_classifications_active ON instrument_classifications(is_active);

CREATE INDEX IF NOT EXISTS idx_asset_allocations_tenant ON asset_allocations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_asset_allocations_portfolio ON asset_allocations(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_asset_allocations_active ON asset_allocations(is_active);

CREATE INDEX IF NOT EXISTS idx_allocation_targets_allocation ON allocation_targets(allocation_id);
CREATE INDEX IF NOT EXISTS idx_allocation_targets_asset_class ON allocation_targets(asset_class_id);

CREATE INDEX IF NOT EXISTS idx_allocation_constraints_allocation ON allocation_constraints(allocation_id);
CREATE INDEX IF NOT EXISTS idx_allocation_constraints_type ON allocation_constraints(constraint_type);
CREATE INDEX IF NOT EXISTS idx_allocation_constraints_active ON allocation_constraints(is_active);

CREATE INDEX IF NOT EXISTS idx_compliance_violations_tenant ON compliance_violations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_portfolio ON compliance_violations(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_active ON compliance_violations(is_active);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_detected ON compliance_violations(detected_at);

CREATE INDEX IF NOT EXISTS idx_portfolio_analysis_tenant ON portfolio_classification_analysis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_analysis_portfolio ON portfolio_classification_analysis(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_analysis_date ON portfolio_classification_analysis(as_of_date);
CREATE INDEX IF NOT EXISTS idx_portfolio_analysis_current ON portfolio_classification_analysis(is_current);

-- Insert standard asset classes
INSERT INTO asset_classes (
    tenant_id, name, code, description, level, asset_type, risk_level, liquidity_tier, is_active
) VALUES 
    ('system', 'Equity', 'EQ', 'Equity securities including stocks and equity-like instruments', 1, 'EQUITY', 'HIGH', 'T1', TRUE),
    ('system', 'Fixed Income', 'FI', 'Fixed income securities including bonds and money market instruments', 1, 'FIXED_INCOME', 'MODERATE', 'T2', TRUE),
    ('system', 'Cash Equivalents', 'CASH', 'Highly liquid, short-term instruments', 1, 'CASH_EQUIVALENT', 'LOW', 'T0', TRUE),
    ('system', 'Alternative Investments', 'ALT', 'Alternative asset classes including private markets', 1, 'ALTERNATIVE', 'VERY_HIGH', 'ILLIQUID', TRUE),
    ('system', 'Derivatives', 'DERV', 'Financial derivatives and structured products', 1, 'DERIVATIVE', 'VERY_HIGH', 'T1', TRUE)
ON CONFLICT (tenant_id, code) DO NOTHING;

-- Get the IDs for the standard asset classes we just inserted
DO $$
DECLARE
    equity_id UUID;
    fi_id UUID;
    cash_id UUID;
    alt_id UUID;
BEGIN
    -- Get asset class IDs
    SELECT id INTO equity_id FROM asset_classes WHERE tenant_id = 'system' AND code = 'EQ';
    SELECT id INTO fi_id FROM asset_classes WHERE tenant_id = 'system' AND code = 'FI';
    SELECT id INTO cash_id FROM asset_classes WHERE tenant_id = 'system' AND code = 'CASH';
    SELECT id INTO alt_id FROM asset_classes WHERE tenant_id = 'system' AND code = 'ALT';

    -- Insert equity sub-classes
    INSERT INTO asset_sub_classes (
        tenant_id, asset_class_id, name, code, description, 
        characteristics, expected_return, volatility, is_active
    ) VALUES 
        ('system', equity_id, 'Domestic Large Cap', 'DOM_LC', 'Domestic large capitalization equity', 
         '{"marketCap": "large", "geography": "domestic"}', 8.5, 16.2, TRUE),
        ('system', equity_id, 'Domestic Mid Cap', 'DOM_MC', 'Domestic mid capitalization equity',
         '{"marketCap": "mid", "geography": "domestic"}', 9.2, 18.5, TRUE),
        ('system', equity_id, 'Domestic Small Cap', 'DOM_SC', 'Domestic small capitalization equity',
         '{"marketCap": "small", "geography": "domestic"}', 10.1, 22.3, TRUE),
        ('system', equity_id, 'International Developed', 'INTL_DEV', 'International developed market equity',
         '{"geography": "international", "developed": true}', 7.8, 17.8, TRUE),
        ('system', equity_id, 'Emerging Markets', 'EM', 'Emerging markets equity',
         '{"geography": "emerging", "developed": false}', 9.5, 25.1, TRUE)
    ON CONFLICT (tenant_id, asset_class_id, code) DO NOTHING;

    -- Insert fixed income sub-classes
    INSERT INTO asset_sub_classes (
        tenant_id, asset_class_id, name, code, description,
        characteristics, expected_return, volatility, is_active
    ) VALUES 
        ('system', fi_id, 'Government Bonds', 'GOVT', 'Government bonds and treasury securities',
         '{"issuerType": "government", "creditQuality": "highest"}', 3.2, 4.8, TRUE),
        ('system', fi_id, 'Corporate Bonds', 'CORP', 'Investment grade corporate bonds',
         '{"issuerType": "corporate", "creditQuality": "investment"}', 4.1, 6.2, TRUE),
        ('system', fi_id, 'High Yield Bonds', 'HY', 'High yield corporate bonds',
         '{"issuerType": "corporate", "creditQuality": "speculative"}', 6.8, 11.5, TRUE),
        ('system', fi_id, 'Municipal Bonds', 'MUNI', 'Municipal bonds and local government debt',
         '{"issuerType": "municipal", "taxAdvantaged": true}', 3.8, 5.1, TRUE)
    ON CONFLICT (tenant_id, asset_class_id, code) DO NOTHING;

    -- Insert cash equivalent sub-classes
    INSERT INTO asset_sub_classes (
        tenant_id, asset_class_id, name, code, description,
        characteristics, expected_return, volatility, is_active
    ) VALUES 
        ('system', cash_id, 'Money Market', 'MM', 'Money market funds and instruments',
         '{"liquidity": "daily", "duration": "short"}', 2.1, 0.5, TRUE),
        ('system', cash_id, 'Bank Deposits', 'BANK', 'Bank deposits and CDs',
         '{"liquidity": "high", "insured": true}', 1.8, 0.2, TRUE)
    ON CONFLICT (tenant_id, asset_class_id, code) DO NOTHING;

    -- Insert alternative investment sub-classes
    INSERT INTO asset_sub_classes (
        tenant_id, asset_class_id, name, code, description,
        characteristics, expected_return, volatility, is_active
    ) VALUES 
        ('system', alt_id, 'Private Equity', 'PE', 'Private equity funds and investments',
         '{"liquidity": "illiquid", "investmentPeriod": "long"}', 12.5, 28.4, TRUE),
        ('system', alt_id, 'Hedge Funds', 'HF', 'Hedge funds and alternative strategies',
         '{"liquidity": "limited", "strategy": "absolute_return"}', 8.1, 12.8, TRUE),
        ('system', alt_id, 'Real Estate', 'RE', 'Real estate investments and REITs',
         '{"assetType": "real_estate", "incomeGenerating": true}', 7.2, 19.3, TRUE),
        ('system', alt_id, 'Commodities', 'COMM', 'Commodity investments and funds',
         '{"assetType": "commodities", "inflationHedge": true}', 5.8, 24.1, TRUE)
    ON CONFLICT (tenant_id, asset_class_id, code) DO NOTHING;
END $$;

-- Create triggers for updated_at fields
CREATE OR REPLACE FUNCTION update_classification_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_asset_classes_updated_at 
    BEFORE UPDATE ON asset_classes 
    FOR EACH ROW EXECUTE FUNCTION update_classification_updated_at_column();

CREATE TRIGGER update_asset_sub_classes_updated_at 
    BEFORE UPDATE ON asset_sub_classes 
    FOR EACH ROW EXECUTE FUNCTION update_classification_updated_at_column();

CREATE TRIGGER update_instrument_classifications_updated_at 
    BEFORE UPDATE ON instrument_classifications 
    FOR EACH ROW EXECUTE FUNCTION update_classification_updated_at_column();

CREATE TRIGGER update_asset_allocations_updated_at 
    BEFORE UPDATE ON asset_allocations 
    FOR EACH ROW EXECUTE FUNCTION update_classification_updated_at_column();

-- Create function to invalidate classification analysis cache
CREATE OR REPLACE FUNCTION invalidate_portfolio_analysis_cache()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark existing analysis as not current when positions change
    UPDATE portfolio_classification_analysis 
    SET is_current = FALSE 
    WHERE portfolio_id = COALESCE(NEW.portfolio_id, OLD.portfolio_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Note: This trigger would be applied to positions table when it exists
-- CREATE TRIGGER invalidate_analysis_on_positions_change
--     AFTER INSERT OR UPDATE OR DELETE ON positions
--     FOR EACH ROW EXECUTE FUNCTION invalidate_portfolio_analysis_cache();