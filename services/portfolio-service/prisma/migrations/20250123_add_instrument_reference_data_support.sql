-- Migration to add comprehensive instrument reference data management
-- Includes instrument master data, corporate actions, market data, and data quality tracking

-- Create enum types for instrument reference data
CREATE TYPE "InstrumentType" AS ENUM (
    'EQUITY', 'BOND', 'MONEY_MARKET', 'MUTUAL_FUND', 'ETF', 'OPTION',
    'FUTURE', 'SWAP', 'FORWARD', 'COMMODITY', 'CURRENCY', 'INDEX',
    'WARRANT', 'CERTIFICATE', 'STRUCTURED_PRODUCT'
);

CREATE TYPE "InstrumentRelationshipType" AS ENUM (
    'PARENT_CHILD', 'UNDERLYING_DERIVATIVE', 'CONVERSION', 'SPLIT_FROM',
    'SPLIT_TO', 'MERGER_FROM', 'MERGER_TO', 'SPINOFF_FROM', 'SPINOFF_TO',
    'SUCCESSOR', 'PREDECESSOR'
);

CREATE TYPE "CorporateActionType" AS ENUM (
    'DIVIDEND', 'STOCK_SPLIT', 'STOCK_DIVIDEND', 'RIGHTS_OFFERING', 'SPINOFF',
    'MERGER', 'ACQUISITION', 'TENDER_OFFER', 'LIQUIDATION', 'BANKRUPTCY',
    'DELISTING', 'NAME_CHANGE', 'TICKER_CHANGE', 'INTEREST_PAYMENT',
    'PRINCIPAL_PAYMENT', 'CALL', 'PUT', 'MATURITY'
);

CREATE TYPE "CorporateActionStatus" AS ENUM (
    'ANNOUNCED', 'CONFIRMED', 'EFFECTIVE', 'COMPLETED', 'CANCELLED', 'PENDING'
);

CREATE TYPE "ProcessingStatus" AS ENUM (
    'PENDING', 'IN_PROGRESS', 'PROCESSED', 'FAILED', 'REQUIRES_MANUAL_REVIEW'
);

CREATE TYPE "MarketStatus" AS ENUM (
    'OPEN', 'CLOSED', 'PRE_MARKET', 'POST_MARKET', 'HALTED', 'SUSPENDED', 'DELAYED'
);

CREATE TYPE "DataQualityScore" AS ENUM (
    'EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'UNVERIFIED'
);

CREATE TYPE "MappingType" AS ENUM (
    'EXACT_MATCH', 'FUZZY_MATCH', 'MANUAL_MAPPING', 'ALGORITHMIC_MAPPING'
);

-- Create instrument master data table
CREATE TABLE IF NOT EXISTS instrument_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Primary identifier
    instrument_id VARCHAR(255) NOT NULL,
    
    -- Standard identifiers
    cusip VARCHAR(20),
    isin VARCHAR(20),
    sedol VARCHAR(20),
    ticker VARCHAR(20),
    bloomberg_id VARCHAR(50),
    refinitiv_ric VARCHAR(50),
    
    -- Basic information
    name VARCHAR(500) NOT NULL,
    short_name VARCHAR(200),
    description TEXT,
    instrument_type "InstrumentType" NOT NULL,
    
    -- Use existing SecurityType enum if available, otherwise create new
    security_type VARCHAR(50) NOT NULL,
    
    -- Issuer information
    issuer_id VARCHAR(100),
    issuer_name VARCHAR(500) NOT NULL,
    issuer_country VARCHAR(5),
    issuer_industry VARCHAR(100),
    
    -- Market information
    primary_exchange VARCHAR(20),
    secondary_exchanges TEXT[], -- Array of exchange codes
    trading_currency VARCHAR(5) NOT NULL,
    denomination_currency VARCHAR(5),
    country_of_risk VARCHAR(5),
    
    -- Status and lifecycle
    issued_date DATE,
    maturity_date DATE,
    first_trading_date DATE,
    last_trading_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_delisted BOOLEAN NOT NULL DEFAULT FALSE,
    delisting_date DATE,
    delisting_reason VARCHAR(500),
    
    -- Corporate structure
    parent_instrument_id UUID REFERENCES instrument_master(id),
    
    -- Data quality and sources
    data_source VARCHAR(100) NOT NULL DEFAULT 'Internal',
    data_vendor VARCHAR(100) NOT NULL DEFAULT 'Internal',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_quality "DataQualityScore" NOT NULL DEFAULT 'UNVERIFIED',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_by UUID NOT NULL,
    
    -- Constraints
    UNIQUE(tenant_id, instrument_id),
    CONSTRAINT valid_identifier_present CHECK (
        cusip IS NOT NULL OR isin IS NOT NULL OR ticker IS NOT NULL OR bloomberg_id IS NOT NULL
    ),
    CONSTRAINT valid_dates CHECK (
        (issued_date IS NULL OR maturity_date IS NULL OR issued_date < maturity_date) AND
        (first_trading_date IS NULL OR last_trading_date IS NULL OR first_trading_date <= last_trading_date) AND
        (delisting_date IS NULL OR is_delisted = TRUE)
    )
);

-- Create related instruments table for instrument relationships
CREATE TABLE IF NOT EXISTS related_instruments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Relationship definition
    primary_instrument_id UUID NOT NULL REFERENCES instrument_master(id),
    related_instrument_id UUID NOT NULL REFERENCES instrument_master(id),
    relationship_type "InstrumentRelationshipType" NOT NULL,
    
    -- Relationship details
    description TEXT,
    effective_date DATE,
    end_date DATE,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, primary_instrument_id, related_instrument_id, relationship_type),
    CONSTRAINT no_self_relationship CHECK (primary_instrument_id != related_instrument_id),
    CONSTRAINT valid_relationship_dates CHECK (
        effective_date IS NULL OR end_date IS NULL OR effective_date <= end_date
    )
);

-- Create instrument attributes table for detailed characteristics
CREATE TABLE IF NOT EXISTS instrument_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    instrument_id UUID NOT NULL REFERENCES instrument_master(id),
    
    -- Trading characteristics
    lot_size INTEGER,
    minimum_trading_unit INTEGER,
    tick_size DECIMAL(12, 8),
    price_multiplier DECIMAL(12, 6),
    
    -- Risk attributes
    volatility DECIMAL(10, 6),
    beta DECIMAL(10, 6),
    sharpe_ratio DECIMAL(10, 6),
    value_at_risk DECIMAL(15, 2),
    
    -- Liquidity metrics
    average_daily_volume BIGINT,
    bid_ask_spread DECIMAL(12, 6),
    market_capitalization DECIMAL(20, 2),
    liquidity_tier VARCHAR(20),
    
    -- Fundamental data (for equities)
    shares_outstanding BIGINT,
    float_shares BIGINT,
    dividend_yield DECIMAL(10, 6),
    price_earnings_ratio DECIMAL(10, 4),
    price_book_ratio DECIMAL(10, 4),
    
    -- Fixed income specific
    face_value DECIMAL(15, 2),
    coupon_rate DECIMAL(10, 6),
    duration DECIMAL(10, 6),
    modified_duration DECIMAL(10, 6),
    convexity DECIMAL(12, 6),
    yield_to_maturity DECIMAL(10, 6),
    credit_rating VARCHAR(20),
    
    -- Options specific
    underlying_instrument_id UUID REFERENCES instrument_master(id),
    strike_price DECIMAL(15, 4),
    expiration_date DATE,
    option_type VARCHAR(10) CHECK (option_type IN ('CALL', 'PUT')),
    implied_volatility DECIMAL(10, 6),
    
    -- Metadata
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_source VARCHAR(100) NOT NULL DEFAULT 'Internal',
    
    -- Constraints
    UNIQUE(tenant_id, instrument_id),
    CONSTRAINT valid_risk_metrics CHECK (
        (volatility IS NULL OR volatility >= 0) AND
        (sharpe_ratio IS NULL OR sharpe_ratio >= -10 AND sharpe_ratio <= 10) AND
        (beta IS NULL OR beta >= -5 AND beta <= 5)
    ),
    CONSTRAINT valid_fundamental_data CHECK (
        (shares_outstanding IS NULL OR shares_outstanding > 0) AND
        (float_shares IS NULL OR shares_outstanding IS NULL OR float_shares <= shares_outstanding) AND
        (dividend_yield IS NULL OR dividend_yield >= 0 AND dividend_yield <= 50)
    ),
    CONSTRAINT valid_fixed_income_data CHECK (
        (coupon_rate IS NULL OR coupon_rate >= 0 AND coupon_rate <= 50) AND
        (duration IS NULL OR duration >= 0) AND
        (yield_to_maturity IS NULL OR yield_to_maturity >= 0 AND yield_to_maturity <= 50)
    ),
    CONSTRAINT valid_option_data CHECK (
        (option_type IS NULL) = (strike_price IS NULL AND expiration_date IS NULL)
    )
);

-- Create corporate actions table
CREATE TABLE IF NOT EXISTS corporate_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    instrument_id UUID NOT NULL REFERENCES instrument_master(id),
    
    -- Action details
    action_type "CorporateActionType" NOT NULL,
    action_code VARCHAR(10) NOT NULL,
    description TEXT NOT NULL,
    announcement_date DATE NOT NULL,
    
    -- Key dates
    ex_date DATE NOT NULL,
    record_date DATE NOT NULL,
    payable_date DATE,
    effective_date DATE,
    
    -- Action specifics (stored as JSONB for flexibility)
    action_details JSONB NOT NULL DEFAULT '{}',
    
    -- Status
    status "CorporateActionStatus" NOT NULL DEFAULT 'ANNOUNCED',
    processing_status "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    
    -- Data source
    data_source VARCHAR(100) NOT NULL DEFAULT 'Internal',
    source_reference VARCHAR(200),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID,
    
    -- Constraints
    CONSTRAINT valid_corporate_action_dates CHECK (
        announcement_date <= ex_date AND
        ex_date <= record_date AND
        (payable_date IS NULL OR record_date <= payable_date) AND
        (effective_date IS NULL OR ex_date <= effective_date)
    ),
    CONSTRAINT valid_processing_status CHECK (
        (processing_status = 'PROCESSED' AND processed_at IS NOT NULL AND processed_by IS NOT NULL) OR
        (processing_status != 'PROCESSED')
    )
);

-- Create market data snapshots table
CREATE TABLE IF NOT EXISTS market_data_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    instrument_id UUID NOT NULL REFERENCES instrument_master(id),
    
    -- Timestamp information
    as_of_date DATE NOT NULL,
    as_of_time TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Price data
    last_price DECIMAL(15, 6),
    open_price DECIMAL(15, 6),
    high_price DECIMAL(15, 6),
    low_price DECIMAL(15, 6),
    close_price DECIMAL(15, 6),
    previous_close DECIMAL(15, 6),
    price_change DECIMAL(15, 6),
    change_percent DECIMAL(10, 4),
    
    -- Volume data
    volume BIGINT,
    average_volume BIGINT,
    volume_weighted_average_price DECIMAL(15, 6),
    
    -- Bid/Ask data
    bid_price DECIMAL(15, 6),
    bid_size INTEGER,
    ask_price DECIMAL(15, 6),
    ask_size INTEGER,
    
    -- Market status
    market_status "MarketStatus" NOT NULL DEFAULT 'CLOSED',
    trading_session VARCHAR(50),
    
    -- Data quality
    data_source VARCHAR(100) NOT NULL,
    data_vendor VARCHAR(100) NOT NULL,
    data_quality "DataQualityScore" NOT NULL DEFAULT 'UNVERIFIED',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, instrument_id, as_of_date),
    CONSTRAINT valid_price_data CHECK (
        (last_price IS NULL OR last_price > 0) AND
        (open_price IS NULL OR open_price > 0) AND
        (high_price IS NULL OR high_price > 0) AND
        (low_price IS NULL OR low_price > 0) AND
        (close_price IS NULL OR close_price > 0) AND
        (previous_close IS NULL OR previous_close > 0) AND
        (bid_price IS NULL OR bid_price > 0) AND
        (ask_price IS NULL OR ask_price > 0)
    ),
    CONSTRAINT valid_ohlc_relationship CHECK (
        (open_price IS NULL OR high_price IS NULL OR low_price IS NULL OR close_price IS NULL) OR
        (low_price <= open_price AND low_price <= close_price AND 
         open_price <= high_price AND close_price <= high_price)
    ),
    CONSTRAINT valid_bid_ask_spread CHECK (
        (bid_price IS NULL OR ask_price IS NULL) OR (bid_price <= ask_price)
    )
);

-- Create instrument mappings table for external system integration
CREATE TABLE IF NOT EXISTS instrument_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Source system information
    source_system VARCHAR(100) NOT NULL,
    source_identifier VARCHAR(255) NOT NULL,
    source_instrument_type VARCHAR(100),
    
    -- Target mapping
    target_instrument_id UUID NOT NULL REFERENCES instrument_master(id),
    mapping_type "MappingType" NOT NULL,
    mapping_confidence INTEGER NOT NULL CHECK (mapping_confidence >= 0 AND mapping_confidence <= 100),
    
    -- Validation
    is_validated BOOLEAN NOT NULL DEFAULT FALSE,
    validated_by UUID,
    validated_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, source_system, source_identifier),
    CONSTRAINT valid_validation CHECK (
        (is_validated = TRUE AND validated_by IS NOT NULL AND validated_at IS NOT NULL) OR
        (is_validated = FALSE)
    )
);

-- Create data quality tracking table
CREATE TABLE IF NOT EXISTS instrument_data_quality (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    instrument_id UUID NOT NULL REFERENCES instrument_master(id),
    
    -- Quality assessment
    overall_quality "DataQualityScore" NOT NULL,
    field_quality JSONB NOT NULL DEFAULT '{}', -- Field-level quality scores
    missing_fields TEXT[], -- Array of missing required fields
    inconsistencies TEXT[], -- Array of data inconsistencies
    
    -- Assessment details
    last_validated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated_by UUID,
    recommendations TEXT[], -- Array of improvement recommendations
    
    -- Metrics
    completeness_score INTEGER CHECK (completeness_score >= 0 AND completeness_score <= 100),
    accuracy_score INTEGER CHECK (accuracy_score >= 0 AND accuracy_score <= 100),
    timeliness_score INTEGER CHECK (timeliness_score >= 0 AND timeliness_score <= 100),
    
    -- Constraints
    UNIQUE(tenant_id, instrument_id)
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_instrument_master_tenant ON instrument_master(tenant_id);
CREATE INDEX IF NOT EXISTS idx_instrument_master_instrument_id ON instrument_master(instrument_id);
CREATE INDEX IF NOT EXISTS idx_instrument_master_cusip ON instrument_master(cusip) WHERE cusip IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_instrument_master_isin ON instrument_master(isin) WHERE isin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_instrument_master_ticker ON instrument_master(ticker) WHERE ticker IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_instrument_master_bloomberg ON instrument_master(bloomberg_id) WHERE bloomberg_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_instrument_master_type ON instrument_master(instrument_type);
CREATE INDEX IF NOT EXISTS idx_instrument_master_issuer ON instrument_master(issuer_name);
CREATE INDEX IF NOT EXISTS idx_instrument_master_exchange ON instrument_master(primary_exchange);
CREATE INDEX IF NOT EXISTS idx_instrument_master_currency ON instrument_master(trading_currency);
CREATE INDEX IF NOT EXISTS idx_instrument_master_active ON instrument_master(is_active);

CREATE INDEX IF NOT EXISTS idx_related_instruments_primary ON related_instruments(primary_instrument_id);
CREATE INDEX IF NOT EXISTS idx_related_instruments_related ON related_instruments(related_instrument_id);
CREATE INDEX IF NOT EXISTS idx_related_instruments_type ON related_instruments(relationship_type);

CREATE INDEX IF NOT EXISTS idx_instrument_attributes_instrument ON instrument_attributes(instrument_id);
CREATE INDEX IF NOT EXISTS idx_instrument_attributes_underlying ON instrument_attributes(underlying_instrument_id) WHERE underlying_instrument_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_corporate_actions_instrument ON corporate_actions(instrument_id);
CREATE INDEX IF NOT EXISTS idx_corporate_actions_tenant ON corporate_actions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_corporate_actions_type ON corporate_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_corporate_actions_ex_date ON corporate_actions(ex_date);
CREATE INDEX IF NOT EXISTS idx_corporate_actions_status ON corporate_actions(status);
CREATE INDEX IF NOT EXISTS idx_corporate_actions_processing_status ON corporate_actions(processing_status);

CREATE INDEX IF NOT EXISTS idx_market_data_instrument ON market_data_snapshots(instrument_id);
CREATE INDEX IF NOT EXISTS idx_market_data_tenant ON market_data_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_market_data_date ON market_data_snapshots(as_of_date);
CREATE INDEX IF NOT EXISTS idx_market_data_vendor ON market_data_snapshots(data_vendor);

CREATE INDEX IF NOT EXISTS idx_instrument_mappings_source ON instrument_mappings(source_system, source_identifier);
CREATE INDEX IF NOT EXISTS idx_instrument_mappings_target ON instrument_mappings(target_instrument_id);
CREATE INDEX IF NOT EXISTS idx_instrument_mappings_active ON instrument_mappings(is_active);

CREATE INDEX IF NOT EXISTS idx_data_quality_instrument ON instrument_data_quality(instrument_id);
CREATE INDEX IF NOT EXISTS idx_data_quality_overall ON instrument_data_quality(overall_quality);

-- Create full-text search index for instrument names
CREATE INDEX IF NOT EXISTS idx_instrument_master_name_fts ON instrument_master 
    USING gin(to_tsvector('english', name || ' ' || COALESCE(short_name, '') || ' ' || COALESCE(ticker, '')));

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_instrument_master_active_type ON instrument_master(tenant_id, is_active, instrument_type);
CREATE INDEX IF NOT EXISTS idx_corporate_actions_instrument_date ON corporate_actions(instrument_id, ex_date DESC);
CREATE INDEX IF NOT EXISTS idx_market_data_current ON market_data_snapshots(tenant_id, instrument_id, as_of_date DESC);

-- Insert sample instrument data for testing
INSERT INTO instrument_master (
    tenant_id, instrument_id, cusip, isin, ticker, name, short_name,
    instrument_type, security_type, issuer_name, issuer_country,
    primary_exchange, trading_currency, is_active,
    data_source, data_vendor, data_quality,
    created_by, updated_by
) VALUES 
    ('system', 'AAPL-US', '037833100', 'US0378331005', 'AAPL',
     'Apple Inc. Common Stock', 'Apple Inc.', 'EQUITY', 'COMMON_STOCK',
     'Apple Inc.', 'US', 'NASDAQ', 'USD', TRUE,
     'Bloomberg', 'Bloomberg', 'EXCELLENT',
     '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    
    ('system', 'MSFT-US', '594918104', 'US5949181045', 'MSFT',
     'Microsoft Corporation Common Stock', 'Microsoft', 'EQUITY', 'COMMON_STOCK',
     'Microsoft Corporation', 'US', 'NASDAQ', 'USD', TRUE,
     'Bloomberg', 'Bloomberg', 'EXCELLENT',
     '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
     
    ('system', 'SPY-US', '78462F103', 'US78462F1030', 'SPY',
     'SPDR S&P 500 ETF Trust', 'SPDR S&P 500', 'ETF', 'ETF',
     'State Street Global Advisors', 'US', 'NYSE', 'USD', TRUE,
     'Bloomberg', 'Bloomberg', 'EXCELLENT',
     '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
     
    ('system', 'US10Y-BOND', '912828YK8', 'US912828YK83', NULL,
     'U.S. Treasury Note 4.25% Due 2034-01-15', 'UST 4.25% 01/34', 'BOND', 'GOVERNMENT_BOND',
     'U.S. Treasury', 'US', 'OTC', 'USD', TRUE,
     'Bloomberg', 'Bloomberg', 'EXCELLENT',
     '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (tenant_id, instrument_id) DO NOTHING;

-- Create triggers for updated_at fields
CREATE OR REPLACE FUNCTION update_instrument_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_instrument_master_updated_at 
    BEFORE UPDATE ON instrument_master 
    FOR EACH ROW EXECUTE FUNCTION update_instrument_updated_at_column();

CREATE TRIGGER update_corporate_actions_updated_at 
    BEFORE UPDATE ON corporate_actions 
    FOR EACH ROW EXECUTE FUNCTION update_instrument_updated_at_column();

CREATE TRIGGER update_instrument_mappings_updated_at 
    BEFORE UPDATE ON instrument_mappings 
    FOR EACH ROW EXECUTE FUNCTION update_instrument_updated_at_column();

-- Create function to automatically update data quality when instrument data changes
CREATE OR REPLACE FUNCTION update_instrument_data_quality()
RETURNS TRIGGER AS $$
BEGIN
    -- Simple data quality assessment based on completeness
    INSERT INTO instrument_data_quality (
        tenant_id, instrument_id, overall_quality,
        completeness_score, last_validated
    ) VALUES (
        NEW.tenant_id, NEW.id,
        CASE 
            WHEN NEW.cusip IS NOT NULL AND NEW.isin IS NOT NULL AND NEW.ticker IS NOT NULL 
                 AND NEW.name IS NOT NULL AND NEW.issuer_name IS NOT NULL THEN 'EXCELLENT'
            WHEN NEW.name IS NOT NULL AND NEW.issuer_name IS NOT NULL AND 
                 (NEW.cusip IS NOT NULL OR NEW.isin IS NOT NULL OR NEW.ticker IS NOT NULL) THEN 'GOOD'
            WHEN NEW.name IS NOT NULL AND NEW.issuer_name IS NOT NULL THEN 'FAIR'
            ELSE 'POOR'
        END,
        CASE 
            WHEN NEW.cusip IS NOT NULL AND NEW.isin IS NOT NULL AND NEW.ticker IS NOT NULL 
                 AND NEW.name IS NOT NULL AND NEW.issuer_name IS NOT NULL THEN 95
            WHEN NEW.name IS NOT NULL AND NEW.issuer_name IS NOT NULL AND 
                 (NEW.cusip IS NOT NULL OR NEW.isin IS NOT NULL OR NEW.ticker IS NOT NULL) THEN 80
            WHEN NEW.name IS NOT NULL AND NEW.issuer_name IS NOT NULL THEN 60
            ELSE 30
        END,
        NOW()
    ) ON CONFLICT (tenant_id, instrument_id) DO UPDATE SET
        overall_quality = EXCLUDED.overall_quality,
        completeness_score = EXCLUDED.completeness_score,
        last_validated = EXCLUDED.last_validated;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_data_quality_on_instrument_change
    AFTER INSERT OR UPDATE ON instrument_master
    FOR EACH ROW EXECUTE FUNCTION update_instrument_data_quality();