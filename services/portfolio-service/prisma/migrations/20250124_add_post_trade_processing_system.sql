-- Migration to add comprehensive Post-Trade Processing System
-- Includes trade confirmations, settlement instructions, trade breaks, custodian integration,
-- regulatory reporting, transaction cost analysis, and trade matching

-- Add SettlementStatus enum if not exists (used by existing order_executions table)
DO $$ BEGIN
    CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'SETTLED', 'FAILED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum types for post-trade processing
DO $$ BEGIN
    CREATE TYPE "TradeConfirmationStatus" AS ENUM (
        'PENDING', 'CONFIRMED', 'AFFIRMED', 'REJECTED', 'DISPUTED', 'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TradeBreakType" AS ENUM (
        'PRICE_DISCREPANCY', 'QUANTITY_DISCREPANCY', 'SETTLEMENT_DISCREPANCY',
        'MISSING_COUNTERPARTY', 'INVALID_INSTRUMENT', 'DUPLICATE_TRADE', 'LATE_MATCHING'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TradeBreakSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TradeBreakStatus" AS ENUM (
        'OPEN', 'INVESTIGATING', 'RESOLVED', 'ESCALATED', 'CLOSED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SettlementInstructionType" AS ENUM ('DVP', 'RVP', 'FOP', 'DFOP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SettlementInstructionStatus" AS ENUM (
        'PENDING', 'SENT', 'ACKNOWLEDGED', 'MATCHED', 'SETTLED', 'FAILED', 'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "CustodianMessageType" AS ENUM (
        'SETTLEMENT_INSTRUCTION', 'POSITION_UPDATE', 'CASH_BALANCE',
        'CORPORATE_ACTION', 'TRADE_CONFIRMATION', 'ERROR_NOTIFICATION'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "CustodianMessageStatus" AS ENUM (
        'PENDING', 'SENT', 'ACKNOWLEDGED', 'PROCESSED', 'FAILED', 'RETRY'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "RegulatoryReportType" AS ENUM (
        'FORM_13F', 'FORM_PF', 'BEST_EXECUTION', 'TRF',
        'CAT', 'SDR', 'TRANSACTION_REPORTING'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "RegulatoryReportStatus" AS ENUM (
        'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SUBMITTED',
        'ACCEPTED', 'REJECTED', 'AMENDED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TransactionCostAnalysisType" AS ENUM (
        'IMPLEMENTATION_SHORTFALL', 'VWAP', 'TWAP',
        'ARRIVAL_PRICE', 'MARKET_IMPACT', 'TIMING_COST'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TradeMatchStatus" AS ENUM ('MATCHED', 'UNMATCHED', 'BREAK', 'EXCEPTION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add counterparty table if not exists (referenced by trade confirmations)
CREATE TABLE IF NOT EXISTS counterparties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(500) NOT NULL,
    code VARCHAR(50),
    type VARCHAR(100), -- 'BROKER_DEALER', 'EXCHANGE', 'ECN', 'MARKET_MAKER'
    is_active BOOLEAN NOT NULL DEFAULT true,
    contact_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

-- Create trade confirmations table
CREATE TABLE IF NOT EXISTS trade_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    trade_id UUID NOT NULL,
    order_id UUID NOT NULL,
    execution_id UUID NOT NULL,
    
    -- Trade Details
    instrument_id VARCHAR(255) NOT NULL,
    quantity DECIMAL(15, 6) NOT NULL CHECK (quantity > 0),
    price DECIMAL(15, 6) NOT NULL CHECK (price > 0),
    gross_amount DECIMAL(20, 4) NOT NULL,
    net_amount DECIMAL(20, 4) NOT NULL,
    trade_date DATE NOT NULL,
    settlement_date DATE NOT NULL,
    
    -- Counterparty Information
    counterparty_id UUID NOT NULL REFERENCES counterparties(id),
    counterparty_name VARCHAR(500) NOT NULL,
    broker_dealer_id VARCHAR(100),
    
    -- Confirmation Status
    confirmation_status "TradeConfirmationStatus" NOT NULL DEFAULT 'PENDING',
    confirmation_method VARCHAR(50) NOT NULL, -- 'ELECTRONIC', 'MANUAL', 'PHONE', 'EMAIL'
    
    -- Timing
    confirmation_sent_at TIMESTAMP WITH TIME ZONE,
    confirmation_received_at TIMESTAMP WITH TIME ZONE,
    affirmed_at TIMESTAMP WITH TIME ZONE,
    
    -- Settlement Instructions
    settlement_instruction_id UUID,
    custodian_instructions JSONB DEFAULT '{}',
    
    -- Commission and Fees
    commission DECIMAL(15, 4) NOT NULL DEFAULT 0,
    exchange_fees DECIMAL(15, 4) NOT NULL DEFAULT 0,
    regulatory_fees DECIMAL(15, 4) NOT NULL DEFAULT 0,
    other_fees DECIMAL(15, 4) NOT NULL DEFAULT 0,
    
    -- References
    confirmation_reference VARCHAR(100) NOT NULL UNIQUE,
    external_trade_id VARCHAR(100),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL,
    modified_by UUID,
    
    -- Constraints
    CONSTRAINT valid_confirmation_amounts CHECK (
        gross_amount > 0 AND net_amount > 0 AND
        net_amount <= gross_amount
    ),
    CONSTRAINT valid_settlement_date CHECK (settlement_date >= trade_date)
);

-- Create settlement instructions table
CREATE TABLE IF NOT EXISTS settlement_instructions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    trade_confirmation_id UUID NOT NULL REFERENCES trade_confirmations(id),
    
    -- Instruction Type and Details
    instruction_type "SettlementInstructionType" NOT NULL,
    instruction_status "SettlementInstructionStatus" NOT NULL DEFAULT 'PENDING',
    
    -- Settlement Details
    settlement_date DATE NOT NULL,
    instrument_id VARCHAR(255) NOT NULL,
    quantity DECIMAL(15, 6) NOT NULL CHECK (quantity > 0),
    settlement_amount DECIMAL(20, 4) NOT NULL,
    settlement_currency VARCHAR(5) NOT NULL DEFAULT 'USD',
    
    -- Delivery Instructions
    delivery_account VARCHAR(100),
    delivery_custodian VARCHAR(200),
    delivery_location VARCHAR(200),
    
    -- Receiving Instructions
    receive_account VARCHAR(100),
    receive_custodian VARCHAR(200),
    receive_location VARCHAR(200),
    
    -- Cash Settlement
    cash_account VARCHAR(100),
    cash_currency VARCHAR(5),
    cash_amount DECIMAL(20, 4),
    
    -- Processing Timestamps
    sent_to_custodian_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    matched_at TIMESTAMP WITH TIME ZONE,
    settled_at TIMESTAMP WITH TIME ZONE,
    
    -- External References
    custodian_reference VARCHAR(200),
    dtc_reference VARCHAR(200),
    swift_reference VARCHAR(200),
    
    -- Processing Control
    priority INTEGER NOT NULL DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    automatic_retry BOOLEAN NOT NULL DEFAULT true,
    max_retries INTEGER NOT NULL DEFAULT 3,
    retry_count INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL
);

-- Create trade breaks table
CREATE TABLE IF NOT EXISTS trade_breaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    trade_id UUID NOT NULL,
    order_id UUID,
    execution_id UUID,
    
    -- Break Details
    break_type "TradeBreakType" NOT NULL,
    severity "TradeBreakSeverity" NOT NULL,
    status "TradeBreakStatus" NOT NULL DEFAULT 'OPEN',
    
    -- Discrepancy Information
    expected_value JSONB NOT NULL,
    actual_value JSONB NOT NULL,
    discrepancy_amount DECIMAL(20, 4),
    discrepancy_percentage DECIMAL(8, 4),
    
    -- Description and Resolution
    description TEXT NOT NULL,
    potential_cause TEXT,
    resolution_notes TEXT,
    
    -- Assignment and Tracking
    assigned_to UUID,
    reported_by UUID NOT NULL,
    reported_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Timeline
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    escalated_at TIMESTAMP WITH TIME ZONE,
    
    -- Priority and SLA
    priority INTEGER NOT NULL CHECK (priority >= 1 AND priority <= 5),
    sla_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Related Records
    related_break_ids UUID[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custodian messages table
CREATE TABLE IF NOT EXISTS custodian_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    custodian_id VARCHAR(100) NOT NULL,
    
    -- Message Details
    message_type "CustodianMessageType" NOT NULL,
    message_format VARCHAR(20) NOT NULL DEFAULT 'JSON', -- 'FIX', 'SWIFT', 'XML', 'JSON', 'CSV'
    message_status "CustodianMessageStatus" NOT NULL DEFAULT 'PENDING',
    
    -- Content
    message_content JSONB NOT NULL,
    raw_message TEXT,
    
    -- Processing Timestamps
    sent_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- References
    external_reference VARCHAR(200),
    related_trade_id UUID,
    related_order_id UUID,
    
    -- Error Handling
    error_code VARCHAR(50),
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create regulatory reports table
CREATE TABLE IF NOT EXISTS regulatory_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    report_type "RegulatoryReportType" NOT NULL,
    report_status "RegulatoryReportStatus" NOT NULL DEFAULT 'DRAFT',
    
    -- Report Period
    reporting_period_start DATE NOT NULL,
    reporting_period_end DATE NOT NULL,
    reporting_date DATE NOT NULL,
    
    -- Content
    report_data JSONB NOT NULL,
    report_summary JSONB,
    
    -- Submission Details
    regulator_id VARCHAR(50) NOT NULL, -- 'SEC', 'FINRA', 'CFTC', etc.
    submission_id VARCHAR(200),
    submitted_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    
    -- Review Process
    prepared_by UUID NOT NULL,
    reviewed_by UUID,
    approved_by UUID,
    
    -- File Management
    report_file_name VARCHAR(500),
    report_file_size BIGINT,
    report_file_hash VARCHAR(128),
    
    -- Amendments
    is_amendment BOOLEAN NOT NULL DEFAULT false,
    original_report_id UUID REFERENCES regulatory_reports(id),
    amendment_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_reporting_period CHECK (reporting_period_end >= reporting_period_start),
    CONSTRAINT valid_amendment_reference CHECK (
        (is_amendment = false AND original_report_id IS NULL) OR
        (is_amendment = true AND original_report_id IS NOT NULL)
    )
);

-- Create transaction cost analysis table
CREATE TABLE IF NOT EXISTS transaction_cost_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    order_id UUID NOT NULL,
    
    -- Analysis Type and Period
    analysis_type "TransactionCostAnalysisType" NOT NULL,
    analysis_date DATE NOT NULL,
    
    -- Benchmark Data
    arrival_price DECIMAL(15, 6) NOT NULL,
    vwap_price DECIMAL(15, 6) NOT NULL,
    twap_price DECIMAL(15, 6) NOT NULL,
    closing_price DECIMAL(15, 6) NOT NULL,
    
    -- Execution Data
    average_execution_price DECIMAL(15, 6) NOT NULL,
    total_executed_quantity DECIMAL(15, 6) NOT NULL,
    total_execution_value DECIMAL(20, 4) NOT NULL,
    
    -- Cost Components (in currency units)
    market_impact_cost DECIMAL(15, 6) NOT NULL DEFAULT 0,
    timing_cost DECIMAL(15, 6) NOT NULL DEFAULT 0,
    spread_cost DECIMAL(15, 6) NOT NULL DEFAULT 0,
    commission_cost DECIMAL(15, 6) NOT NULL DEFAULT 0,
    
    -- Performance Metrics
    implementation_shortfall DECIMAL(15, 6) NOT NULL,
    implementation_shortfall_bps DECIMAL(8, 2) NOT NULL,
    price_improvement_bps DECIMAL(8, 2) NOT NULL,
    
    -- Benchmark Comparisons (in basis points)
    performance_vs_vwap DECIMAL(8, 2) NOT NULL,
    performance_vs_twap DECIMAL(8, 2) NOT NULL,
    performance_vs_arrival DECIMAL(8, 2) NOT NULL,
    performance_vs_close DECIMAL(8, 2) NOT NULL,
    
    -- Market Context
    market_volatility DECIMAL(8, 6) NOT NULL,
    average_daily_volume BIGINT NOT NULL,
    market_capitalization DECIMAL(20, 2),
    
    -- Attribution Analysis
    manager_performance DECIMAL(8, 2) NOT NULL,
    market_movement DECIMAL(8, 2) NOT NULL,
    timing_decision DECIMAL(8, 2) NOT NULL,
    
    -- Quality Metrics
    analysis_notes TEXT,
    data_quality_score INTEGER NOT NULL CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL
);

-- Create trade matching table
CREATE TABLE IF NOT EXISTS trade_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Trade References
    internal_trade_id UUID NOT NULL,
    external_trade_id VARCHAR(200) NOT NULL,
    counterparty_trade_id VARCHAR(200),
    
    -- Matching Results
    match_status "TradeMatchStatus" NOT NULL,
    match_confidence INTEGER NOT NULL CHECK (match_confidence >= 0 AND match_confidence <= 100),
    
    -- Field Matching Results
    instrument_matched BOOLEAN NOT NULL,
    quantity_matched BOOLEAN NOT NULL,
    price_matched BOOLEAN NOT NULL,
    settlement_date_matched BOOLEAN NOT NULL,
    counterparty_matched BOOLEAN NOT NULL,
    
    -- Tolerance Settings Used
    price_tolerance_bps DECIMAL(6, 2) NOT NULL DEFAULT 5.00,
    quantity_tolerance_shares DECIMAL(15, 6) NOT NULL DEFAULT 0,
    date_tolerance_days INTEGER NOT NULL DEFAULT 0,
    
    -- Discrepancies
    price_discrepancy DECIMAL(15, 6),
    quantity_discrepancy DECIMAL(15, 6),
    date_discrepancy INTEGER, -- days
    
    -- Processing
    matched_at TIMESTAMP WITH TIME ZONE NOT NULL,
    matched_by VARCHAR(50) NOT NULL, -- 'AUTOMATIC' or user ID
    reviewed_by UUID,
    
    -- Break Management
    trade_break_id UUID REFERENCES trade_breaks(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, internal_trade_id, external_trade_id)
);

-- Create indexes for performance optimization

-- Trade Confirmations indexes
CREATE INDEX IF NOT EXISTS idx_trade_confirmations_tenant ON trade_confirmations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trade_confirmations_trade_id ON trade_confirmations(trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_confirmations_status ON trade_confirmations(confirmation_status);
CREATE INDEX IF NOT EXISTS idx_trade_confirmations_counterparty ON trade_confirmations(counterparty_id);
CREATE INDEX IF NOT EXISTS idx_trade_confirmations_trade_date ON trade_confirmations(trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_trade_confirmations_settlement_date ON trade_confirmations(settlement_date);
CREATE INDEX IF NOT EXISTS idx_trade_confirmations_reference ON trade_confirmations(confirmation_reference);

-- Settlement Instructions indexes
CREATE INDEX IF NOT EXISTS idx_settlement_instructions_tenant ON settlement_instructions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_settlement_instructions_confirmation ON settlement_instructions(trade_confirmation_id);
CREATE INDEX IF NOT EXISTS idx_settlement_instructions_status ON settlement_instructions(instruction_status);
CREATE INDEX IF NOT EXISTS idx_settlement_instructions_settlement_date ON settlement_instructions(settlement_date);
CREATE INDEX IF NOT EXISTS idx_settlement_instructions_priority ON settlement_instructions(priority);

-- Trade Breaks indexes
CREATE INDEX IF NOT EXISTS idx_trade_breaks_tenant ON trade_breaks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trade_breaks_trade_id ON trade_breaks(trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_breaks_status ON trade_breaks(status);
CREATE INDEX IF NOT EXISTS idx_trade_breaks_severity ON trade_breaks(severity);
CREATE INDEX IF NOT EXISTS idx_trade_breaks_assigned_to ON trade_breaks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_trade_breaks_sla_deadline ON trade_breaks(sla_deadline);
CREATE INDEX IF NOT EXISTS idx_trade_breaks_detected_at ON trade_breaks(detected_at DESC);

-- Custodian Messages indexes
CREATE INDEX IF NOT EXISTS idx_custodian_messages_tenant ON custodian_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_custodian_messages_custodian ON custodian_messages(custodian_id);
CREATE INDEX IF NOT EXISTS idx_custodian_messages_type ON custodian_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_custodian_messages_status ON custodian_messages(message_status);
CREATE INDEX IF NOT EXISTS idx_custodian_messages_created_at ON custodian_messages(created_at DESC);

-- Regulatory Reports indexes
CREATE INDEX IF NOT EXISTS idx_regulatory_reports_tenant ON regulatory_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_reports_type ON regulatory_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_regulatory_reports_status ON regulatory_reports(report_status);
CREATE INDEX IF NOT EXISTS idx_regulatory_reports_regulator ON regulatory_reports(regulator_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_reports_period ON regulatory_reports(reporting_period_start, reporting_period_end);

-- Transaction Cost Analysis indexes
CREATE INDEX IF NOT EXISTS idx_tca_tenant ON transaction_cost_analysis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tca_order_id ON transaction_cost_analysis(order_id);
CREATE INDEX IF NOT EXISTS idx_tca_analysis_type ON transaction_cost_analysis(analysis_type);
CREATE INDEX IF NOT EXISTS idx_tca_analysis_date ON transaction_cost_analysis(analysis_date DESC);

-- Trade Matches indexes
CREATE INDEX IF NOT EXISTS idx_trade_matches_tenant ON trade_matches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trade_matches_internal ON trade_matches(internal_trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_matches_external ON trade_matches(external_trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_matches_status ON trade_matches(match_status);
CREATE INDEX IF NOT EXISTS idx_trade_matches_matched_at ON trade_matches(matched_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_trade_confirmations_tenant_status_date ON trade_confirmations(tenant_id, confirmation_status, trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_settlement_instructions_tenant_status_date ON settlement_instructions(tenant_id, instruction_status, settlement_date);
CREATE INDEX IF NOT EXISTS idx_trade_breaks_tenant_status_priority ON trade_breaks(tenant_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_custodian_messages_tenant_custodian_type ON custodian_messages(tenant_id, custodian_id, message_type);

-- Add foreign key to settlement_instructions if trade_confirmations reference should be enforced
ALTER TABLE settlement_instructions 
ADD CONSTRAINT fk_settlement_instructions_confirmation 
FOREIGN KEY (settlement_instruction_id) REFERENCES settlement_instructions(id);

-- Create triggers for updated_at fields
CREATE OR REPLACE FUNCTION update_post_trade_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trade_confirmations_updated_at 
    BEFORE UPDATE ON trade_confirmations 
    FOR EACH ROW EXECUTE FUNCTION update_post_trade_updated_at_column();

CREATE TRIGGER update_settlement_instructions_updated_at 
    BEFORE UPDATE ON settlement_instructions 
    FOR EACH ROW EXECUTE FUNCTION update_post_trade_updated_at_column();

CREATE TRIGGER update_trade_breaks_updated_at 
    BEFORE UPDATE ON trade_breaks 
    FOR EACH ROW EXECUTE FUNCTION update_post_trade_updated_at_column();

CREATE TRIGGER update_custodian_messages_updated_at 
    BEFORE UPDATE ON custodian_messages 
    FOR EACH ROW EXECUTE FUNCTION update_post_trade_updated_at_column();

CREATE TRIGGER update_regulatory_reports_updated_at 
    BEFORE UPDATE ON regulatory_reports 
    FOR EACH ROW EXECUTE FUNCTION update_post_trade_updated_at_column();

CREATE TRIGGER update_trade_matches_updated_at 
    BEFORE UPDATE ON trade_matches 
    FOR EACH ROW EXECUTE FUNCTION update_post_trade_updated_at_column();

-- Insert sample counterparties
INSERT INTO counterparties (tenant_id, name, code, type) VALUES 
    ('system', 'Goldman Sachs & Co.', 'GS', 'BROKER_DEALER'),
    ('system', 'Morgan Stanley & Co.', 'MS', 'BROKER_DEALER'),
    ('system', 'NASDAQ', 'NASDAQ', 'EXCHANGE'),
    ('system', 'New York Stock Exchange', 'NYSE', 'EXCHANGE'),
    ('system', 'Citadel Securities', 'CITADEL', 'MARKET_MAKER')
ON CONFLICT (tenant_id, code) DO NOTHING;

-- Insert sample trade confirmations
INSERT INTO trade_confirmations (
    tenant_id, trade_id, order_id, execution_id, instrument_id,
    quantity, price, gross_amount, net_amount, trade_date, settlement_date,
    counterparty_id, counterparty_name, confirmation_status, confirmation_method,
    commission, exchange_fees, regulatory_fees, confirmation_reference, created_by
) 
SELECT 
    'system',
    '11111111-1111-1111-1111-111111111111', -- sample trade ID
    o.id,
    oe.id,
    o.instrument_id,
    oe.execution_quantity,
    oe.execution_price,
    oe.execution_price * oe.execution_quantity,
    (oe.execution_price * oe.execution_quantity) - COALESCE(oe.commission, 0) - COALESCE(oe.regulatory_fees, 0),
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '2 days',
    c.id,
    c.name,
    'CONFIRMED',
    'ELECTRONIC',
    COALESCE(oe.commission, 1.50),
    COALESCE(oe.exchange_fees, 0.25),
    COALESCE(oe.regulatory_fees, 0.10),
    'CONF-' || EXTRACT(EPOCH FROM NOW())::TEXT || '-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 6),
    '00000000-0000-0000-0000-000000000000'
FROM orders o
JOIN order_executions oe ON o.id = oe.order_id
CROSS JOIN counterparties c
WHERE o.tenant_id = 'system' 
  AND o.order_status = 'FILLED'
  AND c.tenant_id = 'system'
  AND c.code = 'GS'
LIMIT 3
ON CONFLICT (confirmation_reference) DO NOTHING;

-- Insert sample settlement instructions
INSERT INTO settlement_instructions (
    tenant_id, trade_confirmation_id, instruction_type, settlement_date,
    instrument_id, quantity, settlement_amount, delivery_account,
    receive_account, priority, created_by
)
SELECT 
    tc.tenant_id,
    tc.id,
    'DVP',
    tc.settlement_date,
    tc.instrument_id,
    tc.quantity,
    tc.net_amount,
    'ACCT-DELIVERY-001',
    'ACCT-RECEIVE-001',
    2,
    tc.created_by
FROM trade_confirmations tc
WHERE tc.tenant_id = 'system'
LIMIT 2;

-- Insert sample trade break
INSERT INTO trade_breaks (
    tenant_id, trade_id, break_type, severity, status, expected_value,
    actual_value, description, reported_by, reported_at, detected_at,
    priority, sla_deadline
) VALUES (
    'system',
    '11111111-1111-1111-1111-111111111111',
    'PRICE_DISCREPANCY',
    'MEDIUM',
    'OPEN',
    '{"price": 150.00}',
    '{"price": 150.25}',
    'Price discrepancy of $0.25 detected between internal and external trade records',
    '00000000-0000-0000-0000-000000000000',
    NOW(),
    NOW(),
    3,
    NOW() + INTERVAL '1 day'
);

-- Insert sample regulatory report
INSERT INTO regulatory_reports (
    tenant_id, report_type, reporting_period_start, reporting_period_end,
    reporting_date, report_data, regulator_id, prepared_by
) VALUES (
    'system',
    'FORM_13F',
    DATE_TRUNC('quarter', CURRENT_DATE - INTERVAL '3 months'),
    DATE_TRUNC('quarter', CURRENT_DATE) - INTERVAL '1 day',
    CURRENT_DATE,
    '{"holdings": [], "total_value": 0, "institution_name": "Sample Investment Management"}',
    'SEC',
    '00000000-0000-0000-0000-000000000000'
);

-- Insert sample custodian message
INSERT INTO custodian_messages (
    tenant_id, custodian_id, message_type, message_content, retry_count
) VALUES (
    'system',
    'CUSTODIAN-001',
    'SETTLEMENT_INSTRUCTION',
    '{"instruction_type": "DVP", "instrument": "AAPL", "quantity": 100, "settlement_date": "2025-01-26"}',
    0
);