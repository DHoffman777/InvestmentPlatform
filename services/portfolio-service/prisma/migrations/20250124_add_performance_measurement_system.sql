-- Migration to add comprehensive Performance Measurement System
-- Includes performance periods, attribution analysis, benchmark comparisons, composites, and calculation engines

-- Create enum types for performance measurement
DO $$ BEGIN
    CREATE TYPE "PeriodType" AS ENUM (
        'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 
        'ANNUAL', 'INCEPTION_TO_DATE', 'YEAR_TO_DATE', 'CUSTOM'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "CalculationMethod" AS ENUM (
        'TIME_WEIGHTED', 'MONEY_WEIGHTED', 'SIMPLE', 'LOGARITHMIC',
        'MODIFIED_DIETZ', 'TRUE_TIME_WEIGHTED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AttributionType" AS ENUM (
        'BRINSON_HOOD_BEEBOWER', 'BRINSON_FACHLER', 'GEOMETRIC', 
        'ARITHMETIC', 'FACTOR_BASED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AttributionLevel" AS ENUM (
        'ASSET_CLASS', 'SECTOR', 'SECURITY', 'FACTOR', 'CURRENCY'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "FactorType" AS ENUM (
        'FUNDAMENTAL', 'MACROECONOMIC', 'STATISTICAL', 'RISK', 'STYLE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "RiskFactorType" AS ENUM (
        'MARKET', 'SECTOR', 'STYLE', 'CURRENCY', 'SPECIFIC'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReturnCalculationBasis" AS ENUM (
        'TRADE_DATE', 'SETTLEMENT_DATE', 'BOOK_DATE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "FeeCalculationMethod" AS ENUM (
        'ACTUAL', 'MODEL', 'HIGHEST_FEE', 'COMPOSITE_FEE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ValuationFrequency" AS ENUM (
        'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "CalculationFrequency" AS ENUM (
        'REAL_TIME', 'DAILY', 'WEEKLY', 'MONTHLY'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "CashFlowTiming" AS ENUM (
        'BEGINNING_OF_DAY', 'END_OF_DAY', 'ACTUAL_TIME', 'MODIFIED_DIETZ'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AttributionMethod" AS ENUM (
        'BRINSON', 'GEOMETRIC', 'FACTOR_BASED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "FactorModel" AS ENUM (
        'FAMA_FRENCH_3_FACTOR', 'FAMA_FRENCH_5_FACTOR', 'CARHART_4_FACTOR', 'CUSTOM'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "RebalancingFrequency" AS ENUM (
        'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create performance periods table
CREATE TABLE IF NOT EXISTS performance_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    portfolio_id UUID NOT NULL REFERENCES portfolios(id),
    
    -- Period Definition
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type "PeriodType" NOT NULL,
    
    -- Return Calculations
    time_weighted_return DECIMAL(12, 8) NOT NULL,
    money_weighted_return DECIMAL(12, 8) NOT NULL,
    simple_return DECIMAL(12, 8) NOT NULL,
    logarithmic_return DECIMAL(12, 8) NOT NULL,
    
    -- Gross vs Net Returns
    gross_return DECIMAL(12, 8) NOT NULL,
    net_return DECIMAL(12, 8) NOT NULL,
    management_fees DECIMAL(15, 4) NOT NULL DEFAULT 0,
    performance_fees DECIMAL(15, 4) NOT NULL DEFAULT 0,
    other_fees DECIMAL(15, 4) NOT NULL DEFAULT 0,
    
    -- After-tax Returns
    pre_tax_return DECIMAL(12, 8) NOT NULL DEFAULT 0,
    after_tax_return DECIMAL(12, 8) NOT NULL DEFAULT 0,
    tax_drag DECIMAL(12, 8) NOT NULL DEFAULT 0,
    
    -- Portfolio Values
    beginning_value DECIMAL(20, 4) NOT NULL,
    ending_value DECIMAL(20, 4) NOT NULL,
    average_value DECIMAL(20, 4) NOT NULL,
    high_water_mark DECIMAL(20, 4) NOT NULL,
    
    -- Cash Flow Information
    total_cash_flows DECIMAL(20, 4) NOT NULL DEFAULT 0,
    net_cash_flows DECIMAL(20, 4) NOT NULL DEFAULT 0,
    contributions DECIMAL(20, 4) NOT NULL DEFAULT 0,
    withdrawals DECIMAL(20, 4) NOT NULL DEFAULT 0,
    
    -- Risk Metrics
    volatility DECIMAL(10, 6) NOT NULL DEFAULT 0,
    standard_deviation DECIMAL(10, 6) NOT NULL DEFAULT 0,
    downside_deviation DECIMAL(10, 6) NOT NULL DEFAULT 0,
    max_drawdown DECIMAL(10, 6) NOT NULL DEFAULT 0,
    max_drawdown_duration INTEGER NOT NULL DEFAULT 0,
    
    -- Risk-Adjusted Performance
    sharpe_ratio DECIMAL(10, 6) NOT NULL DEFAULT 0,
    sortino_ratio DECIMAL(10, 6) NOT NULL DEFAULT 0,
    calmar_ratio DECIMAL(10, 6) NOT NULL DEFAULT 0,
    information_ratio DECIMAL(10, 6) NOT NULL DEFAULT 0,
    treynor_ratio DECIMAL(10, 6) NOT NULL DEFAULT 0,
    jensen_alpha DECIMAL(10, 6) NOT NULL DEFAULT 0,
    beta DECIMAL(10, 6) NOT NULL DEFAULT 0,
    
    -- Benchmark Comparison
    benchmark_return DECIMAL(12, 8) NOT NULL DEFAULT 0,
    excess_return DECIMAL(12, 8) NOT NULL DEFAULT 0,
    active_return DECIMAL(12, 8) NOT NULL DEFAULT 0,
    tracking_error DECIMAL(10, 6) NOT NULL DEFAULT 0,
    
    -- Attribution Results
    security_selection DECIMAL(12, 8) NOT NULL DEFAULT 0,
    asset_allocation DECIMAL(12, 8) NOT NULL DEFAULT 0,
    interaction_effect DECIMAL(12, 8) NOT NULL DEFAULT 0,
    total_attribution DECIMAL(12, 8) NOT NULL DEFAULT 0,
    
    -- Currency Impact
    local_currency_return DECIMAL(12, 8) NOT NULL DEFAULT 0,
    currency_return DECIMAL(12, 8) NOT NULL DEFAULT 0,
    total_return DECIMAL(12, 8) NOT NULL DEFAULT 0,
    
    -- Data Quality and Processing
    data_quality_score INTEGER NOT NULL CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
    calculation_method "CalculationMethod" NOT NULL,
    calculation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_rebalancing_period BOOLEAN NOT NULL DEFAULT false,
    has_significant_cash_flows BOOLEAN NOT NULL DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL,
    notes TEXT,
    
    -- Constraints
    CONSTRAINT valid_period CHECK (period_end >= period_start),
    CONSTRAINT valid_portfolio_values CHECK (
        beginning_value >= 0 AND ending_value >= 0 AND 
        average_value >= 0 AND high_water_mark >= 0
    )
);

-- Create performance attribution table
CREATE TABLE IF NOT EXISTS performance_attributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    performance_period_id UUID NOT NULL REFERENCES performance_periods(id),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id),
    
    -- Attribution Analysis
    attribution_type "AttributionType" NOT NULL,
    attribution_level "AttributionLevel" NOT NULL,
    
    -- Performance Decomposition
    total_portfolio_return DECIMAL(12, 8) NOT NULL,
    benchmark_return DECIMAL(12, 8) NOT NULL,
    excess_return DECIMAL(12, 8) NOT NULL,
    
    -- Attribution Components
    allocation_effect DECIMAL(12, 8) NOT NULL DEFAULT 0,
    selection_effect DECIMAL(12, 8) NOT NULL DEFAULT 0,
    interaction_effect DECIMAL(12, 8) NOT NULL DEFAULT 0,
    currency_effect DECIMAL(12, 8) NOT NULL DEFAULT 0,
    
    -- Risk Attribution
    total_risk DECIMAL(10, 6) NOT NULL DEFAULT 0,
    active_risk DECIMAL(10, 6) NOT NULL DEFAULT 0,
    
    -- Period Information
    attribution_period_start DATE NOT NULL,
    attribution_period_end DATE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL
);

-- Create sector attribution table
CREATE TABLE IF NOT EXISTS sector_attributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    performance_attribution_id UUID NOT NULL REFERENCES performance_attributions(id),
    sector_id VARCHAR(100) NOT NULL,
    sector_name VARCHAR(255) NOT NULL,
    
    -- Weights
    portfolio_weight DECIMAL(8, 6) NOT NULL,
    benchmark_weight DECIMAL(8, 6) NOT NULL,
    active_weight DECIMAL(8, 6) NOT NULL,
    
    -- Returns
    portfolio_return DECIMAL(12, 8) NOT NULL,
    benchmark_return DECIMAL(12, 8) NOT NULL,
    excess_return DECIMAL(12, 8) NOT NULL,
    
    -- Attribution Effects
    allocation_effect DECIMAL(12, 8) NOT NULL,
    selection_effect DECIMAL(12, 8) NOT NULL,
    interaction_effect DECIMAL(12, 8) NOT NULL,
    total_contribution DECIMAL(12, 8) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create asset class attribution table
CREATE TABLE IF NOT EXISTS asset_class_attributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    performance_attribution_id UUID NOT NULL REFERENCES performance_attributions(id),
    asset_class_id VARCHAR(100) NOT NULL,
    asset_class_name VARCHAR(255) NOT NULL,
    
    -- Weights and Returns
    portfolio_weight DECIMAL(8, 6) NOT NULL,
    benchmark_weight DECIMAL(8, 6) NOT NULL,
    portfolio_return DECIMAL(12, 8) NOT NULL,
    benchmark_return DECIMAL(12, 8) NOT NULL,
    
    -- Attribution Effects
    allocation_effect DECIMAL(12, 8) NOT NULL,
    selection_effect DECIMAL(12, 8) NOT NULL,
    total_contribution DECIMAL(12, 8) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create security attribution table
CREATE TABLE IF NOT EXISTS security_attributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    performance_attribution_id UUID NOT NULL REFERENCES performance_attributions(id),
    instrument_id VARCHAR(255) NOT NULL,
    instrument_name VARCHAR(500) NOT NULL,
    
    -- Position Information
    average_weight DECIMAL(8, 6) NOT NULL,
    beginning_weight DECIMAL(8, 6) NOT NULL,
    ending_weight DECIMAL(8, 6) NOT NULL,
    
    -- Return Information
    security_return DECIMAL(12, 8) NOT NULL,
    contribution DECIMAL(12, 8) NOT NULL,
    
    -- Attribution Details
    specific_return DECIMAL(12, 8) NOT NULL,
    systematic_return DECIMAL(12, 8) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create factor attribution table
CREATE TABLE IF NOT EXISTS factor_attributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    performance_attribution_id UUID NOT NULL REFERENCES performance_attributions(id),
    factor_id VARCHAR(100) NOT NULL,
    factor_name VARCHAR(255) NOT NULL,
    factor_type "FactorType" NOT NULL,
    
    -- Factor Exposure
    portfolio_exposure DECIMAL(10, 6) NOT NULL,
    benchmark_exposure DECIMAL(10, 6) NOT NULL,
    active_exposure DECIMAL(10, 6) NOT NULL,
    
    -- Factor Returns
    factor_return DECIMAL(12, 8) NOT NULL,
    contribution DECIMAL(12, 8) NOT NULL,
    
    -- Risk Contribution
    risk_contribution DECIMAL(10, 6) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create risk attribution table
CREATE TABLE IF NOT EXISTS risk_attributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    performance_attribution_id UUID NOT NULL REFERENCES performance_attributions(id),
    risk_factor_id VARCHAR(100) NOT NULL,
    risk_factor_name VARCHAR(255) NOT NULL,
    risk_factor_type "RiskFactorType" NOT NULL,
    
    -- Risk Measures
    risk_contribution DECIMAL(10, 6) NOT NULL,
    marginal_risk DECIMAL(10, 6) NOT NULL,
    component_risk DECIMAL(10, 6) NOT NULL,
    percentage_contribution DECIMAL(8, 4) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create benchmark comparison table
CREATE TABLE IF NOT EXISTS benchmark_comparisons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    portfolio_id UUID NOT NULL REFERENCES portfolios(id),
    benchmark_id VARCHAR(255) NOT NULL,
    
    -- Period Information
    comparison_period_start DATE NOT NULL,
    comparison_period_end DATE NOT NULL,
    period_type "PeriodType" NOT NULL,
    
    -- Performance Comparison
    portfolio_return DECIMAL(12, 8) NOT NULL,
    benchmark_return DECIMAL(12, 8) NOT NULL,
    excess_return DECIMAL(12, 8) NOT NULL,
    
    -- Risk Comparison
    portfolio_volatility DECIMAL(10, 6) NOT NULL,
    benchmark_volatility DECIMAL(10, 6) NOT NULL,
    tracking_error DECIMAL(10, 6) NOT NULL,
    
    -- Risk-Adjusted Comparison
    portfolio_sharpe_ratio DECIMAL(10, 6) NOT NULL,
    benchmark_sharpe_ratio DECIMAL(10, 6) NOT NULL,
    information_ratio DECIMAL(10, 6) NOT NULL,
    
    -- Statistical Measures
    correlation DECIMAL(8, 6) NOT NULL,
    beta DECIMAL(10, 6) NOT NULL,
    alpha DECIMAL(10, 6) NOT NULL,
    r_squared DECIMAL(8, 6) NOT NULL,
    
    -- Performance Rankings
    percentile_rank DECIMAL(6, 2),
    quartile_rank INTEGER CHECK (quartile_rank >= 1 AND quartile_rank <= 4),
    
    -- Hit Rate Analysis
    up_capture_ratio DECIMAL(8, 4) NOT NULL,
    down_capture_ratio DECIMAL(8, 4) NOT NULL,
    hit_rate DECIMAL(6, 2) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_comparison_period CHECK (comparison_period_end >= comparison_period_start),
    CONSTRAINT valid_statistical_measures CHECK (
        correlation >= -1 AND correlation <= 1 AND
        r_squared >= 0 AND r_squared <= 1
    )
);

-- Create performance composites table
CREATE TABLE IF NOT EXISTS performance_composites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    composite_name VARCHAR(255) NOT NULL,
    composite_description TEXT,
    
    -- GIPS Compliance
    is_gips_compliant BOOLEAN NOT NULL DEFAULT false,
    gips_version VARCHAR(20),
    composite_definition TEXT,
    inclusion_criteria TEXT,
    
    -- Composite Portfolios
    portfolio_ids UUID[] NOT NULL,
    total_assets DECIMAL(20, 4) NOT NULL DEFAULT 0,
    number_of_portfolios INTEGER NOT NULL DEFAULT 0,
    
    -- Risk Metrics
    three_year_volatility DECIMAL(10, 6),
    dispersion DECIMAL(10, 6),
    
    -- Benchmark Information
    benchmark_id VARCHAR(255),
    benchmark_name VARCHAR(255),
    
    -- Compliance
    creation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_review_date DATE,
    next_review_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_portfolio_count CHECK (number_of_portfolios >= 0),
    CONSTRAINT valid_assets CHECK (total_assets >= 0),
    UNIQUE(tenant_id, composite_name)
);

-- Create composite performance periods table
CREATE TABLE IF NOT EXISTS composite_performance_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    composite_id UUID NOT NULL REFERENCES performance_composites(id),
    
    -- Period Information
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Composite Performance
    gross_return DECIMAL(12, 8) NOT NULL,
    net_return DECIMAL(12, 8) NOT NULL,
    benchmark_return DECIMAL(12, 8) NOT NULL,
    
    -- Risk Metrics
    volatility DECIMAL(10, 6) NOT NULL,
    dispersion DECIMAL(10, 6) NOT NULL,
    
    -- Assets
    total_assets DECIMAL(20, 4) NOT NULL,
    number_of_portfolios INTEGER NOT NULL,
    
    -- GIPS Requirements
    fees_deducted DECIMAL(15, 4) NOT NULL DEFAULT 0,
    is_actual_fees BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_composite_period CHECK (period_end >= period_start),
    CONSTRAINT valid_composite_assets CHECK (total_assets >= 0)
);

-- Create performance calculation engines table
CREATE TABLE IF NOT EXISTS performance_calculation_engines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Calculation Configuration
    calculation_method "CalculationMethod" NOT NULL,
    return_calculation_basis "ReturnCalculationBasis" NOT NULL,
    fee_calculation_method "FeeCalculationMethod" NOT NULL,
    
    -- Timing Settings
    valuation_frequency "ValuationFrequency" NOT NULL,
    calculation_frequency "CalculationFrequency" NOT NULL,
    
    -- Cash Flow Settings
    cash_flow_timing "CashFlowTiming" NOT NULL,
    significant_cash_flow_threshold DECIMAL(6, 4) NOT NULL DEFAULT 0.10,
    
    -- Attribution Settings
    attribution_method "AttributionMethod" NOT NULL,
    factor_model "FactorModel" NOT NULL,
    
    -- Risk Settings
    risk_free_rate DECIMAL(8, 6) NOT NULL DEFAULT 0.02,
    confidence_level DECIMAL(6, 4) NOT NULL DEFAULT 0.95,
    
    -- Benchmark Settings
    default_benchmark_id VARCHAR(255),
    benchmark_rebalancing_frequency "RebalancingFrequency" NOT NULL DEFAULT 'MONTHLY',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_threshold CHECK (significant_cash_flow_threshold > 0 AND significant_cash_flow_threshold <= 1),
    CONSTRAINT valid_confidence_level CHECK (confidence_level > 0 AND confidence_level < 1),
    CONSTRAINT valid_risk_free_rate CHECK (risk_free_rate >= 0)
);

-- Create indexes for performance optimization

-- Performance Periods indexes
CREATE INDEX IF NOT EXISTS idx_performance_periods_tenant ON performance_periods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_performance_periods_portfolio ON performance_periods(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_performance_periods_period_end ON performance_periods(period_end DESC);
CREATE INDEX IF NOT EXISTS idx_performance_periods_period_type ON performance_periods(period_type);
CREATE INDEX IF NOT EXISTS idx_performance_periods_calculation_date ON performance_periods(calculation_date DESC);
CREATE INDEX IF NOT EXISTS idx_performance_periods_net_return ON performance_periods(net_return DESC);

-- Performance Attribution indexes
CREATE INDEX IF NOT EXISTS idx_performance_attributions_tenant ON performance_attributions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_performance_attributions_performance_period ON performance_attributions(performance_period_id);
CREATE INDEX IF NOT EXISTS idx_performance_attributions_portfolio ON performance_attributions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_performance_attributions_type ON performance_attributions(attribution_type);

-- Sector Attribution indexes
CREATE INDEX IF NOT EXISTS idx_sector_attributions_attribution ON sector_attributions(performance_attribution_id);
CREATE INDEX IF NOT EXISTS idx_sector_attributions_sector ON sector_attributions(sector_id);

-- Asset Class Attribution indexes
CREATE INDEX IF NOT EXISTS idx_asset_class_attributions_attribution ON asset_class_attributions(performance_attribution_id);
CREATE INDEX IF NOT EXISTS idx_asset_class_attributions_class ON asset_class_attributions(asset_class_id);

-- Security Attribution indexes
CREATE INDEX IF NOT EXISTS idx_security_attributions_attribution ON security_attributions(performance_attribution_id);
CREATE INDEX IF NOT EXISTS idx_security_attributions_instrument ON security_attributions(instrument_id);

-- Factor Attribution indexes
CREATE INDEX IF NOT EXISTS idx_factor_attributions_attribution ON factor_attributions(performance_attribution_id);
CREATE INDEX IF NOT EXISTS idx_factor_attributions_factor ON factor_attributions(factor_id);
CREATE INDEX IF NOT EXISTS idx_factor_attributions_type ON factor_attributions(factor_type);

-- Risk Attribution indexes
CREATE INDEX IF NOT EXISTS idx_risk_attributions_attribution ON risk_attributions(performance_attribution_id);
CREATE INDEX IF NOT EXISTS idx_risk_attributions_factor ON risk_attributions(risk_factor_id);
CREATE INDEX IF NOT EXISTS idx_risk_attributions_type ON risk_attributions(risk_factor_type);

-- Benchmark Comparison indexes
CREATE INDEX IF NOT EXISTS idx_benchmark_comparisons_tenant ON benchmark_comparisons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_comparisons_portfolio ON benchmark_comparisons(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_comparisons_benchmark ON benchmark_comparisons(benchmark_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_comparisons_period_end ON benchmark_comparisons(comparison_period_end DESC);

-- Performance Composites indexes
CREATE INDEX IF NOT EXISTS idx_performance_composites_tenant ON performance_composites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_performance_composites_name ON performance_composites(composite_name);
CREATE INDEX IF NOT EXISTS idx_performance_composites_benchmark ON performance_composites(benchmark_id);

-- Composite Performance Periods indexes
CREATE INDEX IF NOT EXISTS idx_composite_performance_periods_composite ON composite_performance_periods(composite_id);
CREATE INDEX IF NOT EXISTS idx_composite_performance_periods_period_end ON composite_performance_periods(period_end DESC);

-- Performance Calculation Engines indexes
CREATE INDEX IF NOT EXISTS idx_performance_calculation_engines_tenant ON performance_calculation_engines(tenant_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_performance_periods_tenant_portfolio_period ON performance_periods(tenant_id, portfolio_id, period_end DESC);
CREATE INDEX IF NOT EXISTS idx_performance_periods_tenant_type_period ON performance_periods(tenant_id, period_type, period_end DESC);
CREATE INDEX IF NOT EXISTS idx_benchmark_comparisons_tenant_portfolio_period ON benchmark_comparisons(tenant_id, portfolio_id, comparison_period_end DESC);
CREATE INDEX IF NOT EXISTS idx_performance_attributions_tenant_period ON performance_attributions(tenant_id, attribution_period_end DESC);

-- Create triggers for updated_at fields
CREATE OR REPLACE FUNCTION update_performance_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_performance_periods_updated_at 
    BEFORE UPDATE ON performance_periods 
    FOR EACH ROW EXECUTE FUNCTION update_performance_updated_at_column();

CREATE TRIGGER update_performance_attributions_updated_at 
    BEFORE UPDATE ON performance_attributions 
    FOR EACH ROW EXECUTE FUNCTION update_performance_updated_at_column();

CREATE TRIGGER update_benchmark_comparisons_updated_at 
    BEFORE UPDATE ON benchmark_comparisons 
    FOR EACH ROW EXECUTE FUNCTION update_performance_updated_at_column();

CREATE TRIGGER update_performance_composites_updated_at 
    BEFORE UPDATE ON performance_composites 
    FOR EACH ROW EXECUTE FUNCTION update_performance_updated_at_column();

CREATE TRIGGER update_performance_calculation_engines_updated_at 
    BEFORE UPDATE ON performance_calculation_engines 
    FOR EACH ROW EXECUTE FUNCTION update_performance_updated_at_column();

-- Insert sample performance calculation engine
INSERT INTO performance_calculation_engines (
    tenant_id,
    calculation_method,
    return_calculation_basis,
    fee_calculation_method,
    valuation_frequency,
    calculation_frequency,
    cash_flow_timing,
    significant_cash_flow_threshold,
    attribution_method,
    factor_model,
    risk_free_rate,
    confidence_level,
    benchmark_rebalancing_frequency,
    created_by
) VALUES (
    'system',
    'TIME_WEIGHTED',
    'TRADE_DATE',
    'ACTUAL',
    'DAILY',
    'DAILY',
    'END_OF_DAY',
    0.10,
    'BRINSON',
    'FAMA_FRENCH_3_FACTOR',
    0.02,
    0.95,
    'MONTHLY',
    '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- Insert sample performance composite
INSERT INTO performance_composites (
    tenant_id,
    composite_name,
    composite_description,
    is_gips_compliant,
    gips_version,
    composite_definition,
    inclusion_criteria,
    portfolio_ids,
    total_assets,
    number_of_portfolios,
    benchmark_id,
    benchmark_name,
    created_by
) 
SELECT 
    'system',
    'All Portfolios Composite',
    'Composite including all actively managed portfolios for performance reporting',
    true,
    '2020',
    'All discretionary fee-paying portfolios managed according to the equity growth strategy',
    'Minimum account size of $1M, full discretion, fee-paying',
    ARRAY(SELECT id FROM portfolios WHERE tenant_id = 'system' LIMIT 5),
    (SELECT COALESCE(SUM(p.current_value), 0) FROM portfolios p WHERE tenant_id = 'system' LIMIT 5),
    (SELECT COUNT(*) FROM portfolios WHERE tenant_id = 'system' LIMIT 5),
    'SPX',
    'S&P 500 Total Return Index',
    '00000000-0000-0000-0000-000000000000'
WHERE EXISTS (SELECT 1 FROM portfolios WHERE tenant_id = 'system')
ON CONFLICT (tenant_id, composite_name) DO NOTHING;

-- Insert sample performance periods for existing portfolios
INSERT INTO performance_periods (
    tenant_id,
    portfolio_id,
    period_start,
    period_end,
    period_type,
    time_weighted_return,
    money_weighted_return,
    simple_return,
    logarithmic_return,
    gross_return,
    net_return,
    management_fees,
    performance_fees,
    other_fees,
    beginning_value,
    ending_value,
    average_value,
    high_water_mark,
    total_cash_flows,
    net_cash_flows,
    contributions,
    withdrawals,
    volatility,
    standard_deviation,
    downside_deviation,
    max_drawdown,
    max_drawdown_duration,
    sharpe_ratio,
    sortino_ratio,
    calmar_ratio,
    information_ratio,
    treynor_ratio,
    jensen_alpha,
    beta,
    benchmark_return,
    excess_return,
    active_return,
    tracking_error,
    data_quality_score,
    calculation_method,
    calculation_date,
    is_rebalancing_period,
    has_significant_cash_flows,
    created_by
)
SELECT 
    p.tenant_id,
    p.id,
    CURRENT_DATE - INTERVAL '1 month',
    CURRENT_DATE,
    'MONTHLY',
    0.0850,  -- 8.5% TWR
    0.0830,  -- 8.3% IRR
    0.0845,  -- 8.45% simple return
    0.0814,  -- log return
    0.0875,  -- 8.75% gross return
    0.0850,  -- 8.5% net return
    250.00,  -- management fees
    0.00,    -- performance fees
    15.00,   -- other fees
    100000.00,  -- beginning value
    108500.00,  -- ending value
    104250.00,  -- average value
    108500.00,  -- high water mark
    2500.00,    -- total cash flows
    2500.00,    -- net cash flows
    2500.00,    -- contributions
    0.00,       -- withdrawals
    0.1250,     -- 12.5% volatility
    0.0089,     -- daily standard deviation
    0.0065,     -- downside deviation
    -0.0350,    -- -3.5% max drawdown
    15,         -- max drawdown duration (days)
    0.52,       -- Sharpe ratio
    0.78,       -- Sortino ratio
    2.43,       -- Calmar ratio
    0.35,       -- Information ratio
    0.045,      -- Treynor ratio
    0.0025,     -- Jensen's alpha
    1.15,       -- Beta
    0.0780,     -- 7.8% benchmark return
    0.0070,     -- 0.7% excess return
    0.0070,     -- 0.7% active return
    0.0200,     -- 2% tracking error
    95,         -- data quality score
    'TIME_WEIGHTED',
    NOW(),
    false,      -- not a rebalancing period
    true,       -- has significant cash flows
    '00000000-0000-0000-0000-000000000000'
FROM portfolios p
WHERE p.tenant_id = 'system'
LIMIT 3
ON CONFLICT DO NOTHING;

-- Insert sample benchmark comparisons
INSERT INTO benchmark_comparisons (
    tenant_id,
    portfolio_id,
    benchmark_id,
    comparison_period_start,
    comparison_period_end,
    period_type,
    portfolio_return,
    benchmark_return,
    excess_return,
    portfolio_volatility,
    benchmark_volatility,
    tracking_error,
    portfolio_sharpe_ratio,
    benchmark_sharpe_ratio,
    information_ratio,
    correlation,
    beta,
    alpha,
    r_squared,
    percentile_rank,
    quartile_rank,
    up_capture_ratio,
    down_capture_ratio,
    hit_rate,
    created_by
)
SELECT 
    pp.tenant_id,
    pp.portfolio_id,
    'SPX',
    pp.period_start,
    pp.period_end,
    pp.period_type,
    pp.net_return,
    pp.benchmark_return,
    pp.excess_return,
    pp.volatility,
    0.1180,  -- benchmark volatility
    pp.tracking_error,
    pp.sharpe_ratio,
    0.42,    -- benchmark Sharpe ratio
    pp.information_ratio,
    0.85,    -- 85% correlation
    pp.beta,
    pp.jensen_alpha,
    0.72,    -- 72% R-squared
    65.5,    -- 65.5th percentile
    2,       -- 2nd quartile
    0.95,    -- 95% up capture
    0.88,    -- 88% down capture
    58.3,    -- 58.3% hit rate
    pp.created_by
FROM performance_periods pp
WHERE pp.tenant_id = 'system'
LIMIT 2
ON CONFLICT DO NOTHING;