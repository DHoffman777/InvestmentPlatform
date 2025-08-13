-- Structured Products Database Migration
-- Phase 4.1 - Comprehensive structured products support with valuation, barrier monitoring, and document parsing

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums for structured products
CREATE TYPE "StructuredProductType" AS ENUM (
    'STRUCTURED_NOTE',
    'MARKET_LINKED_CD',
    'REVERSE_CONVERTIBLE',
    'AUTOCALLABLE',
    'BARRIER_OPTION',
    'EXOTIC_DERIVATIVE',
    'EQUITY_LINKED',
    'RATE_LINKED',
    'COMMODITY_LINKED',
    'CURRENCY_LINKED'
);

CREATE TYPE "BarrierType" AS ENUM (
    'KNOCK_IN',
    'KNOCK_OUT',
    'UP_AND_IN',
    'UP_AND_OUT',
    'DOWN_AND_IN',
    'DOWN_AND_OUT',
    'DOUBLE_BARRIER'
);

CREATE TYPE "PayoffType" AS ENUM (
    'FIXED_COUPON',
    'FLOATING_COUPON',
    'PARTICIPATION',
    'LEVERAGED',
    'CAPPED',
    'FLOORED',
    'DIGITAL',
    'BASKET'
);

CREATE TYPE "ObservationFrequency" AS ENUM (
    'CONTINUOUS',
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'MATURITY_ONLY'
);

CREATE TYPE "SettlementType" AS ENUM (
    'CASH',
    'PHYSICAL',
    'ELECTION'
);

CREATE TYPE "UnderlyingType" AS ENUM (
    'SINGLE_STOCK',
    'INDEX',
    'BASKET',
    'COMMODITY',
    'CURRENCY',
    'INTEREST_RATE',
    'CREDIT',
    'HYBRID'
);

CREATE TYPE "DocumentStatus" AS ENUM (
    'DRAFT',
    'PENDING_REVIEW',
    'APPROVED',
    'ACTIVE',
    'MATURED',
    'CALLED',
    'DEFAULTED'
);

CREATE TYPE "RiskLevel" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'VERY_HIGH'
);

CREATE TYPE "ParsingStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'FAILED'
);

CREATE TYPE "DocumentType" AS ENUM (
    'TERM_SHEET',
    'PROSPECTUS',
    'MARKETING',
    'LEGAL'
);

CREATE TYPE "AlertType" AS ENUM (
    'BARRIER_APPROACH',
    'BARRIER_HIT',
    'BARRIER_RECOVERY',
    'STALE_PRICE',
    'PRICE_DEVIATION',
    'VOLATILITY_SPIKE',
    'MODEL_FAILURE'
);

CREATE TYPE "AlertSeverity" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);

-- Core structured products table
CREATE TABLE IF NOT EXISTS structured_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    instrument_id VARCHAR(255) NOT NULL,
    
    -- Basic Information
    product_name VARCHAR(500) NOT NULL,
    product_type "StructuredProductType" NOT NULL,
    issuer VARCHAR(255) NOT NULL,
    issuer_id VARCHAR(255) NOT NULL,
    cusip VARCHAR(20),
    isin VARCHAR(20),
    ticker VARCHAR(20),
    
    -- Financial Terms
    notional_amount DECIMAL(20, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    issue_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    min_investment DECIMAL(20, 2) NOT NULL,
    increment_amount DECIMAL(20, 2),
    
    -- Payoff Structure
    payoff_type "PayoffType" NOT NULL,
    payoff_formula TEXT NOT NULL,
    payoff_parameters JSONB NOT NULL DEFAULT '{}',
    
    -- Underlying Assets
    underlying_type "UnderlyingType" NOT NULL,
    underlying_assets JSONB NOT NULL DEFAULT '[]',
    
    -- Barrier Features
    has_barrier BOOLEAN NOT NULL DEFAULT false,
    barriers JSONB DEFAULT '[]',
    
    -- Coupon/Interest Features
    has_coupon BOOLEAN NOT NULL DEFAULT false,
    coupons JSONB DEFAULT '[]',
    
    -- Call/Put Features
    is_callable BOOLEAN NOT NULL DEFAULT false,
    is_putable BOOLEAN NOT NULL DEFAULT false,
    call_schedule JSONB DEFAULT '[]',
    put_schedule JSONB DEFAULT '[]',
    
    -- Protection Features
    has_capital_protection BOOLEAN NOT NULL DEFAULT false,
    protection_level DECIMAL(5, 2), -- Percentage of principal protected
    protection_type VARCHAR(50),
    
    -- Settlement
    settlement_type "SettlementType" NOT NULL DEFAULT 'CASH',
    settlement_days INTEGER NOT NULL DEFAULT 3,
    
    -- Documentation
    term_sheet JSONB NOT NULL DEFAULT '{}',
    prospectus TEXT,
    marketing_materials JSONB DEFAULT '[]',
    
    -- Risk Assessment
    risk_level "RiskLevel" NOT NULL,
    risk_factors JSONB NOT NULL DEFAULT '[]',
    credit_rating VARCHAR(10),
    
    -- Pricing
    current_price DECIMAL(15, 8),
    last_price_update TIMESTAMP WITH TIME ZONE,
    pricing_model VARCHAR(100),
    pricing_parameters JSONB DEFAULT '{}',
    
    -- Status
    status "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255) NOT NULL,
    
    -- Constraints
    CONSTRAINT structured_products_tenant_instrument_unique UNIQUE (tenant_id, instrument_id),
    CONSTRAINT structured_products_notional_positive CHECK (notional_amount > 0),
    CONSTRAINT structured_products_min_investment_positive CHECK (min_investment > 0),
    CONSTRAINT structured_products_dates_check CHECK (maturity_date > issue_date),
    CONSTRAINT structured_products_protection_level_check CHECK (
        protection_level IS NULL OR (protection_level >= 0 AND protection_level <= 100)
    )
);

-- Structured product market data table
CREATE TABLE IF NOT EXISTS structured_product_market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES structured_products(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Pricing
    theoretical_value DECIMAL(20, 8) NOT NULL,
    market_price DECIMAL(20, 8),
    bid DECIMAL(20, 8),
    ask DECIMAL(20, 8),
    spread DECIMAL(10, 6),
    
    -- Greeks (for derivatives)
    delta DECIMAL(15, 8),
    gamma DECIMAL(15, 8),
    theta DECIMAL(15, 8),
    vega DECIMAL(15, 8),
    rho DECIMAL(15, 8),
    
    -- Risk Metrics
    implied_volatility DECIMAL(8, 6),
    time_to_maturity DECIMAL(10, 6),
    
    -- Underlying Levels
    underlying_levels JSONB NOT NULL DEFAULT '{}',
    
    -- Barrier Status
    barrier_distances JSONB DEFAULT '{}',
    barrier_probabilities JSONB DEFAULT '{}',
    
    -- Sensitivity Analysis
    price_scenarios JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Valuation models table
CREATE TABLE IF NOT EXISTS valuation_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(255) NOT NULL,
    model_type VARCHAR(50) NOT NULL,
    
    -- Model Parameters
    parameters JSONB NOT NULL DEFAULT '{}',
    
    -- Monte Carlo Specific
    simulations INTEGER,
    time_steps INTEGER,
    random_seed INTEGER,
    
    -- Calibration
    calibration_date DATE,
    calibration_method VARCHAR(100),
    calibration_parameters JSONB DEFAULT '{}',
    
    -- Validation
    back_test_results JSONB DEFAULT '[]',
    
    -- Performance
    calculation_time INTEGER, -- milliseconds
    convergence_metrics JSONB DEFAULT '{}',
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valuation_models_simulations_positive CHECK (simulations IS NULL OR simulations > 0),
    CONSTRAINT valuation_models_time_steps_positive CHECK (time_steps IS NULL OR time_steps > 0)
);

-- Structured product positions table
CREATE TABLE IF NOT EXISTS structured_product_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    portfolio_id VARCHAR(255) NOT NULL,
    product_id UUID REFERENCES structured_products(id) ON DELETE CASCADE,
    
    -- Position Details
    quantity DECIMAL(15, 6) NOT NULL,
    notional_value DECIMAL(20, 2) NOT NULL,
    average_cost DECIMAL(15, 8) NOT NULL,
    current_value DECIMAL(20, 2) NOT NULL,
    unrealized_pnl DECIMAL(20, 2) NOT NULL DEFAULT 0,
    realized_pnl DECIMAL(20, 2) NOT NULL DEFAULT 0,
    
    -- Acquisition
    acquisition_date DATE NOT NULL,
    acquisition_price DECIMAL(15, 8) NOT NULL,
    
    -- Current Status
    last_valuation_date DATE NOT NULL,
    last_valuation_price DECIMAL(15, 8) NOT NULL,
    
    -- Risk Metrics
    var_95 DECIMAL(20, 2), -- Value at Risk 95%
    var_99 DECIMAL(20, 2), -- Value at Risk 99%
    expected_shortfall DECIMAL(20, 2),
    
    -- Greeks Portfolio Level
    portfolio_delta DECIMAL(15, 8),
    portfolio_gamma DECIMAL(15, 8),
    portfolio_theta DECIMAL(15, 8),
    portfolio_vega DECIMAL(15, 8),
    
    -- Settlement
    pending_settlement DECIMAL(20, 2) DEFAULT 0,
    settled_amount DECIMAL(20, 2) DEFAULT 0,
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT sp_positions_tenant_portfolio_product_unique UNIQUE (tenant_id, portfolio_id, product_id),
    CONSTRAINT sp_positions_quantity_positive CHECK (quantity > 0),
    CONSTRAINT sp_positions_notional_positive CHECK (notional_value > 0),
    CONSTRAINT sp_positions_average_cost_positive CHECK (average_cost > 0)
);

-- Pricing alerts table
CREATE TABLE IF NOT EXISTS pricing_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position_id UUID REFERENCES structured_product_positions(id) ON DELETE CASCADE,
    alert_type "AlertType" NOT NULL,
    severity "AlertSeverity" NOT NULL,
    message TEXT NOT NULL,
    
    -- Alert Data
    current_value DECIMAL(20, 8),
    expected_value DECIMAL(20, 8),
    deviation DECIMAL(10, 6),
    threshold DECIMAL(10, 6),
    
    -- Timing
    alert_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by VARCHAR(255),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Barrier alerts table
CREATE TABLE IF NOT EXISTS barrier_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position_id UUID REFERENCES structured_product_positions(id) ON DELETE CASCADE,
    barrier_id VARCHAR(255) NOT NULL,
    alert_type "AlertType" NOT NULL,
    severity "AlertSeverity" NOT NULL,
    
    -- Alert Data
    current_level DECIMAL(15, 8) NOT NULL,
    barrier_level DECIMAL(15, 8) NOT NULL,
    distance DECIMAL(15, 8) NOT NULL,
    distance_percentage DECIMAL(8, 4) NOT NULL,
    
    -- Timing
    alert_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by VARCHAR(255),
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Document parsing results table
CREATE TABLE IF NOT EXISTS document_parsing_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id VARCHAR(255) NOT NULL,
    document_type "DocumentType" NOT NULL,
    
    -- Parsing Status
    parsing_status "ParsingStatus" NOT NULL DEFAULT 'PENDING',
    parsing_engine VARCHAR(100) NOT NULL,
    
    -- Extracted Data
    extracted_terms JSONB NOT NULL DEFAULT '{}',
    structured_data JSONB NOT NULL DEFAULT '{}',
    
    -- Confidence Scores
    extraction_confidence JSONB NOT NULL DEFAULT '{}',
    overall_confidence DECIMAL(5, 4) NOT NULL DEFAULT 0,
    
    -- Validation
    validation_errors JSONB DEFAULT '[]',
    validation_warnings JSONB DEFAULT '[]',
    
    -- Processing Info
    processing_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    processing_end_time TIMESTAMP WITH TIME ZONE,
    processing_duration INTEGER, -- milliseconds
    
    -- Human Review
    requires_review BOOLEAN NOT NULL DEFAULT false,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT doc_parsing_confidence_check CHECK (overall_confidence >= 0 AND overall_confidence <= 1),
    CONSTRAINT doc_parsing_duration_positive CHECK (processing_duration IS NULL OR processing_duration >= 0)
);

-- Issuer credit risk table
CREATE TABLE IF NOT EXISTS issuer_credit_risk (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issuer_id VARCHAR(255) NOT NULL,
    issuer_name VARCHAR(255) NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Credit Ratings
    moodys_rating VARCHAR(10),
    sp_rating VARCHAR(10),
    fitch_rating VARCHAR(10),
    internal_rating VARCHAR(10),
    
    -- Credit Metrics
    credit_spread DECIMAL(8, 4) NOT NULL, -- basis points
    probability_of_default DECIMAL(6, 4) NOT NULL, -- percentage
    recovery_rate DECIMAL(5, 4) NOT NULL, -- percentage
    credit_var DECIMAL(20, 2) NOT NULL,
    
    -- Exposure
    total_exposure DECIMAL(20, 2) NOT NULL,
    concentration_limit DECIMAL(20, 2),
    utilization_ratio DECIMAL(5, 4) NOT NULL,
    
    -- Monitoring
    last_review_date DATE NOT NULL,
    next_review_date DATE NOT NULL,
    watch_list_status VARCHAR(20) NOT NULL DEFAULT 'NONE',
    
    -- Historical Data
    rating_history JSONB DEFAULT '[]',
    spread_history JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT issuer_credit_risk_tenant_issuer_unique UNIQUE (tenant_id, issuer_id),
    CONSTRAINT issuer_credit_risk_spread_positive CHECK (credit_spread >= 0),
    CONSTRAINT issuer_credit_risk_pod_check CHECK (probability_of_default >= 0 AND probability_of_default <= 100),
    CONSTRAINT issuer_credit_risk_recovery_check CHECK (recovery_rate >= 0 AND recovery_rate <= 1),
    CONSTRAINT issuer_credit_risk_exposure_positive CHECK (total_exposure >= 0),
    CONSTRAINT issuer_credit_risk_utilization_check CHECK (utilization_ratio >= 0 AND utilization_ratio <= 1),
    CONSTRAINT issuer_credit_risk_watch_list_check CHECK (
        watch_list_status IN ('NONE', 'WATCH', 'RESTRICTED', 'PROHIBITED')
    )
);

-- Barrier monitoring history table
CREATE TABLE IF NOT EXISTS barrier_monitoring_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES structured_products(id) ON DELETE CASCADE,
    barrier_id VARCHAR(255) NOT NULL,
    
    event_type VARCHAR(50) NOT NULL, -- 'HIT', 'APPROACH', 'RECOVERY'
    event_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    level DECIMAL(15, 8) NOT NULL,
    distance DECIMAL(15, 8) NOT NULL,
    distance_percentage DECIMAL(8, 4) NOT NULL,
    
    -- Market context
    underlying_levels JSONB NOT NULL DEFAULT '{}',
    volatility_levels JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT barrier_history_event_type_check CHECK (
        event_type IN ('HIT', 'APPROACH', 'RECOVERY')
    )
);

-- Create indexes for performance
CREATE INDEX idx_structured_products_tenant_type ON structured_products(tenant_id, product_type);
CREATE INDEX idx_structured_products_issuer ON structured_products(issuer_id);
CREATE INDEX idx_structured_products_status ON structured_products(status);
CREATE INDEX idx_structured_products_maturity ON structured_products(maturity_date);
CREATE INDEX idx_structured_products_active ON structured_products(is_active);

CREATE INDEX idx_sp_market_data_product_timestamp ON structured_product_market_data(product_id, timestamp DESC);

CREATE INDEX idx_sp_positions_tenant_portfolio ON structured_product_positions(tenant_id, portfolio_id);
CREATE INDEX idx_sp_positions_product ON structured_product_positions(product_id);
CREATE INDEX idx_sp_positions_active ON structured_product_positions(is_active);

CREATE INDEX idx_pricing_alerts_position_active ON pricing_alerts(position_id, is_active);
CREATE INDEX idx_pricing_alerts_alert_time ON pricing_alerts(alert_time DESC);
CREATE INDEX idx_pricing_alerts_severity ON pricing_alerts(severity);

CREATE INDEX idx_barrier_alerts_position_active ON barrier_alerts(position_id, is_active);
CREATE INDEX idx_barrier_alerts_alert_time ON barrier_alerts(alert_time DESC);
CREATE INDEX idx_barrier_alerts_barrier_id ON barrier_alerts(barrier_id);

CREATE INDEX idx_doc_parsing_document_id ON document_parsing_results(document_id);
CREATE INDEX idx_doc_parsing_status ON document_parsing_results(parsing_status);
CREATE INDEX idx_doc_parsing_requires_review ON document_parsing_results(requires_review);

CREATE INDEX idx_issuer_credit_risk_tenant_issuer ON issuer_credit_risk(tenant_id, issuer_id);
CREATE INDEX idx_issuer_credit_risk_watch_list ON issuer_credit_risk(watch_list_status);
CREATE INDEX idx_issuer_credit_risk_review_date ON issuer_credit_risk(next_review_date);

CREATE INDEX idx_barrier_history_product_barrier ON barrier_monitoring_history(product_id, barrier_id);
CREATE INDEX idx_barrier_history_event_time ON barrier_monitoring_history(event_time DESC);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_structured_products_updated_at
    BEFORE UPDATE ON structured_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_valuation_models_updated_at
    BEFORE UPDATE ON valuation_models
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_sp_positions_updated_at
    BEFORE UPDATE ON structured_product_positions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_doc_parsing_updated_at
    BEFORE UPDATE ON document_parsing_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_issuer_credit_risk_updated_at
    BEFORE UPDATE ON issuer_credit_risk
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Sample data for testing
INSERT INTO structured_products (
    tenant_id, instrument_id, product_name, product_type, issuer, issuer_id,
    cusip, notional_amount, currency, issue_date, maturity_date, min_investment,
    payoff_type, payoff_formula, payoff_parameters, underlying_type, underlying_assets,
    has_barrier, barriers, settlement_type, risk_level, risk_factors,
    status, created_by, updated_by
) VALUES 
(
    'tenant_001', 'inst_sp_001', 'AAPL Barrier Note', 'STRUCTURED_NOTE',
    'Goldman Sachs Bank USA', 'issuer_gs', '38141GXX1',
    1000000.00, 'USD', '2024-01-15', '2026-01-15', 10000.00,
    'PARTICIPATION', 'max(0, participation * (finalLevel / initialLevel - 1))',
    '{"participation": 1.0}', 'SINGLE_STOCK',
    '[{"id": "underlying_001", "symbol": "AAPL", "name": "Apple Inc.", "assetType": "EQUITY", "weight": 100, "initialLevel": 140.0}]',
    true, '[{"id": "barrier_001", "barrierType": "DOWN_AND_OUT", "level": 98.0, "observationFrequency": "DAILY", "isAmerican": true, "isActive": true, "hasBeenHit": false}]',
    'CASH', 'HIGH', '["Market Risk", "Credit Risk", "Barrier Risk"]',
    'ACTIVE', 'system', 'system'
),
(
    'tenant_001', 'inst_sp_002', 'S&P 500 Autocallable Note', 'AUTOCALLABLE',
    'J.P. Morgan Securities LLC', 'issuer_jpm', '46625HXX2',
    500000.00, 'USD', '2024-02-01', '2027-02-01', 5000.00,
    'CAPPED', 'min(cap, max(0, participation * (finalLevel / initialLevel - 1)))',
    '{"participation": 1.0, "cap": 0.3}', 'INDEX',
    '[{"id": "underlying_002", "symbol": "SPX", "name": "S&P 500 Index", "assetType": "INDEX", "weight": 100, "initialLevel": 4500.0}]',
    false, '[]', 'CASH', 'MEDIUM', '["Market Risk", "Credit Risk"]',
    'ACTIVE', 'system', 'system'
);

-- Sample valuation models
INSERT INTO valuation_models (
    model_name, model_type, parameters, simulations, time_steps, is_active
) VALUES 
(
    'Monte Carlo Standard', 'MONTE_CARLO', 
    '{"antithetic": true, "controlVariates": true, "sobolSequence": true}',
    100000, 252, true
),
(
    'Binomial Tree', 'BINOMIAL',
    '{"steps": 1000, "smoothing": true}',
    null, null, true
),
(
    'Black-Scholes Closed Form', 'CLOSED_FORM',
    '{"method": "BLACK_SCHOLES", "greeksCalculation": true}',
    null, null, true
);

-- Sample issuer credit risk data
INSERT INTO issuer_credit_risk (
    issuer_id, issuer_name, tenant_id, sp_rating, credit_spread,
    probability_of_default, recovery_rate, credit_var, total_exposure,
    utilization_ratio, last_review_date, next_review_date
) VALUES 
(
    'issuer_gs', 'Goldman Sachs Bank USA', 'tenant_001', 'A+',
    150.0, 1.2, 0.4, 50000.00, 1500000.00,
    0.75, CURRENT_DATE, CURRENT_DATE + INTERVAL '6 months'
),
(
    'issuer_jpm', 'J.P. Morgan Securities LLC', 'tenant_001', 'AA-',
    125.0, 0.8, 0.45, 30000.00, 800000.00,
    0.6, CURRENT_DATE, CURRENT_DATE + INTERVAL '6 months'
);

-- Comments
COMMENT ON TABLE structured_products IS 'Core structured products with comprehensive product definitions';
COMMENT ON TABLE structured_product_market_data IS 'Real-time and historical market data for structured products';
COMMENT ON TABLE valuation_models IS 'Valuation models configuration for pricing structured products';
COMMENT ON TABLE structured_product_positions IS 'Portfolio positions in structured products';
COMMENT ON TABLE pricing_alerts IS 'Pricing-related alerts for structured product positions';
COMMENT ON TABLE barrier_alerts IS 'Barrier monitoring alerts for structured products';
COMMENT ON TABLE document_parsing_results IS 'Document parsing results from OCR and ML processing';
COMMENT ON TABLE issuer_credit_risk IS 'Credit risk assessment for structured product issuers';
COMMENT ON TABLE barrier_monitoring_history IS 'Historical barrier monitoring events';