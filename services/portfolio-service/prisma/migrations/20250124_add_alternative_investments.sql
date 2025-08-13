-- Alternative Investments Database Migration
-- Phase 4.2 - Comprehensive alternative investments support including private equity, hedge funds, and real estate

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums for alternative investments
CREATE TYPE "AlternativeInvestmentType" AS ENUM (
    'PRIVATE_EQUITY',
    'HEDGE_FUND',
    'VENTURE_CAPITAL',
    'REAL_ESTATE',
    'INFRASTRUCTURE',
    'COMMODITY_FUND',
    'PRIVATE_DEBT',
    'FUND_OF_FUNDS',
    'DIRECT_INVESTMENT',
    'REIT_PRIVATE'
);

CREATE TYPE "InvestmentStage" AS ENUM (
    'SEED',
    'SERIES_A',
    'SERIES_B',
    'SERIES_C',
    'LATE_STAGE',
    'GROWTH',
    'BUYOUT',
    'DISTRESSED',
    'TURNAROUND',
    'MEZZANINE'
);

CREATE TYPE "FundStatus" AS ENUM (
    'FUNDRAISING',
    'INVESTING',
    'HARVESTING',
    'LIQUIDATING',
    'CLOSED'
);

CREATE TYPE "CommitmentStatus" AS ENUM (
    'COMMITTED',
    'CALLED',
    'INVESTED',
    'REALIZED',
    'WRITTEN_OFF'
);

CREATE TYPE "DistributionType" AS ENUM (
    'CASH',
    'STOCK',
    'PIK',
    'RETURN_OF_CAPITAL',
    'CAPITAL_GAIN'
);

CREATE TYPE "ValuationMethod" AS ENUM (
    'MARKET_MULTIPLE',
    'DCF',
    'TRANSACTION_MULTIPLE',
    'ASSET_BASED',
    'COST_BASIS',
    'THIRD_PARTY',
    'MARK_TO_MARKET'
);

CREATE TYPE "GeographicFocus" AS ENUM (
    'NORTH_AMERICA',
    'EUROPE',
    'ASIA_PACIFIC',
    'EMERGING_MARKETS',
    'GLOBAL',
    'CHINA',
    'INDIA',
    'LATIN_AMERICA'
);

CREATE TYPE "SectorFocus" AS ENUM (
    'TECHNOLOGY',
    'HEALTHCARE',
    'FINANCIAL_SERVICES',
    'ENERGY',
    'INDUSTRIALS',
    'CONSUMER',
    'REAL_ESTATE',
    'INFRASTRUCTURE',
    'DIVERSIFIED'
);

CREATE TYPE "LiquidityRisk" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);

CREATE TYPE "DistributionStatus" AS ENUM (
    'ANNOUNCED',
    'PAID',
    'PENDING',
    'CANCELLED'
);

CREATE TYPE "CompanyStatus" AS ENUM (
    'ACTIVE',
    'EXITED',
    'WRITTEN_OFF',
    'BANKRUPTCY'
);

CREATE TYPE "DocumentTypeAlt" AS ENUM (
    'PRIVATE_PLACEMENT_MEMORANDUM',
    'LIMITED_PARTNERSHIP_AGREEMENT',
    'SUBSCRIPTION_AGREEMENT',
    'QUARTERLY_REPORT',
    'ANNUAL_REPORT',
    'CAPITAL_CALL_NOTICE',
    'DISTRIBUTION_NOTICE',
    'NAV_STATEMENT',
    'AUDIT_REPORT',
    'TAX_DOCUMENT',
    'SIDE_LETTER',
    'AMENDMENT'
);

CREATE TYPE "ConfidentialityLevel" AS ENUM (
    'PUBLIC',
    'CONFIDENTIAL',
    'RESTRICTED'
);

CREATE TYPE "DocumentCategory" AS ENUM (
    'LEGAL',
    'FINANCIAL',
    'OPERATIONAL',
    'COMPLIANCE'
);

CREATE TYPE "ExitType" AS ENUM (
    'IPO',
    'TRADE_SALE',
    'SECONDARY',
    'WRITE_OFF'
);

-- Core alternative investments table
CREATE TABLE IF NOT EXISTS alternative_investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Basic Information
    investment_name VARCHAR(500) NOT NULL,
    investment_type "AlternativeInvestmentType" NOT NULL,
    fund_name VARCHAR(500),
    fund_id VARCHAR(255),
    general_partner VARCHAR(255) NOT NULL,
    administrator VARCHAR(255),
    
    -- Investment Details
    vintage INTEGER NOT NULL,
    fund_size DECIMAL(20, 2),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    investment_stage "InvestmentStage",
    
    -- Geographic and Sector Focus
    geographic_focus JSONB NOT NULL DEFAULT '[]',
    sector_focus JSONB NOT NULL DEFAULT '[]',
    
    -- Investment Terms
    commitment DECIMAL(20, 2) NOT NULL,
    management_fee DECIMAL(8, 4) NOT NULL, -- Percentage
    carried_interest DECIMAL(8, 4) NOT NULL, -- Percentage
    hurdle_rate DECIMAL(8, 4), -- Percentage
    catch_up DECIMAL(8, 4), -- Percentage
    
    -- Key Dates
    commitment_date DATE NOT NULL,
    first_closing_date DATE,
    final_closing_date DATE,
    investment_period_start DATE,
    investment_period_end DATE,
    fund_term INTEGER NOT NULL, -- Years
    
    -- Current Status
    status "FundStatus" NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Performance Metrics
    current_nav DECIMAL(20, 2),
    total_called DECIMAL(20, 2) NOT NULL DEFAULT 0,
    total_distributed DECIMAL(20, 2) NOT NULL DEFAULT 0,
    unrealized_value DECIMAL(20, 2) NOT NULL DEFAULT 0,
    
    -- Identifiers
    cusip VARCHAR(20),
    isin VARCHAR(20),
    lei VARCHAR(20), -- Legal Entity Identifier
    
    -- Risk and ESG
    risk_rating VARCHAR(20),
    esg_score DECIMAL(5, 2),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255) NOT NULL,
    
    -- Constraints
    CONSTRAINT alt_investments_tenant_name_unique UNIQUE (tenant_id, investment_name),
    CONSTRAINT alt_investments_commitment_positive CHECK (commitment > 0),
    CONSTRAINT alt_investments_vintage_valid CHECK (vintage >= 1900 AND vintage <= EXTRACT('year' FROM NOW()) + 5),
    CONSTRAINT alt_investments_fund_term_positive CHECK (fund_term > 0),
    CONSTRAINT alt_investments_management_fee_valid CHECK (management_fee >= 0 AND management_fee <= 10),
    CONSTRAINT alt_investments_carried_interest_valid CHECK (carried_interest >= 0 AND carried_interest <= 50),
    CONSTRAINT alt_investments_hurdle_rate_valid CHECK (hurdle_rate IS NULL OR (hurdle_rate >= 0 AND hurdle_rate <= 30)),
    CONSTRAINT alt_investments_catch_up_valid CHECK (catch_up IS NULL OR (catch_up >= 0 AND catch_up <= 100)),
    CONSTRAINT alt_investments_esg_score_valid CHECK (esg_score IS NULL OR (esg_score >= 0 AND esg_score <= 100))
);

-- Capital calls table
CREATE TABLE IF NOT EXISTS capital_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id UUID REFERENCES alternative_investments(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Call Details
    call_number INTEGER NOT NULL,
    call_date DATE NOT NULL,
    due_date DATE NOT NULL,
    call_amount DECIMAL(20, 2) NOT NULL,
    
    -- Purpose and allocation
    purpose TEXT NOT NULL,
    investment_allocations JSONB NOT NULL DEFAULT '[]',
    
    -- Management
    management_fee_amount DECIMAL(20, 2) DEFAULT 0,
    expense_amount DECIMAL(20, 2) DEFAULT 0,
    
    -- Status
    status "CommitmentStatus" NOT NULL,
    funded_date DATE,
    funded_amount DECIMAL(20, 2),
    
    -- Interest and penalties
    interest_rate DECIMAL(8, 4),
    penalty_rate DECIMAL(8, 4),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT capital_calls_investment_call_unique UNIQUE (investment_id, call_number),
    CONSTRAINT capital_calls_call_amount_positive CHECK (call_amount > 0),
    CONSTRAINT capital_calls_funded_amount_valid CHECK (funded_amount IS NULL OR funded_amount >= 0),
    CONSTRAINT capital_calls_dates_valid CHECK (due_date >= call_date),
    CONSTRAINT capital_calls_management_fee_valid CHECK (management_fee_amount >= 0),
    CONSTRAINT capital_calls_expense_amount_valid CHECK (expense_amount >= 0)
);

-- Distributions table
CREATE TABLE IF NOT EXISTS distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id UUID REFERENCES alternative_investments(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Distribution Details
    distribution_number INTEGER NOT NULL,
    distribution_date DATE NOT NULL,
    payment_date DATE NOT NULL,
    total_amount DECIMAL(20, 2) NOT NULL,
    
    -- Distribution Components
    distribution_components JSONB NOT NULL DEFAULT '[]',
    
    -- Tax Information
    taxable_amount DECIMAL(20, 2),
    return_of_capital DECIMAL(20, 2),
    capital_gain DECIMAL(20, 2),
    
    -- Source
    source_companies JSONB NOT NULL DEFAULT '[]',
    
    -- Status
    status "DistributionStatus" NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT distributions_investment_dist_unique UNIQUE (investment_id, distribution_number),
    CONSTRAINT distributions_total_amount_positive CHECK (total_amount > 0),
    CONSTRAINT distributions_taxable_amount_valid CHECK (taxable_amount IS NULL OR taxable_amount >= 0),
    CONSTRAINT distributions_return_of_capital_valid CHECK (return_of_capital IS NULL OR return_of_capital >= 0),
    CONSTRAINT distributions_capital_gain_valid CHECK (capital_gain IS NULL OR capital_gain >= 0),
    CONSTRAINT distributions_dates_valid CHECK (payment_date >= distribution_date)
);

-- NAV updates table
CREATE TABLE IF NOT EXISTS nav_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id UUID REFERENCES alternative_investments(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Valuation Details
    as_of_date DATE NOT NULL,
    reporting_date DATE NOT NULL,
    net_asset_value DECIMAL(20, 2) NOT NULL,
    share_price DECIMAL(15, 8),
    
    -- Portfolio Level Metrics
    gross_asset_value DECIMAL(20, 2) NOT NULL,
    total_liabilities DECIMAL(20, 2) NOT NULL,
    unrealized_gain DECIMAL(20, 2) NOT NULL,
    realized_gain DECIMAL(20, 2) NOT NULL,
    
    -- Performance Metrics
    irr DECIMAL(8, 4), -- Internal Rate of Return
    multiple DECIMAL(8, 4), -- Investment Multiple
    pme_index DECIMAL(8, 4), -- Public Market Equivalent
    
    -- Valuation Methods
    valuation_method "ValuationMethod" NOT NULL,
    valuation_source VARCHAR(50) NOT NULL,
    
    -- Portfolio Companies
    portfolio_companies JSONB NOT NULL DEFAULT '[]',
    
    -- Quality Metrics
    confidence_level VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',
    data_quality_score INTEGER NOT NULL DEFAULT 75,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255) NOT NULL,
    
    -- Constraints
    CONSTRAINT nav_updates_nav_positive CHECK (net_asset_value >= 0),
    CONSTRAINT nav_updates_gross_asset_value_positive CHECK (gross_asset_value >= 0),
    CONSTRAINT nav_updates_total_liabilities_valid CHECK (total_liabilities >= 0),
    CONSTRAINT nav_updates_data_quality_score_valid CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
    CONSTRAINT nav_updates_confidence_level_valid CHECK (confidence_level IN ('HIGH', 'MEDIUM', 'LOW')),
    CONSTRAINT nav_updates_dates_valid CHECK (reporting_date >= as_of_date)
);

-- Portfolio companies table
CREATE TABLE IF NOT EXISTS portfolio_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id UUID REFERENCES alternative_investments(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Company Details
    company_name VARCHAR(255) NOT NULL,
    business_description TEXT,
    sector "SectorFocus" NOT NULL,
    geography "GeographicFocus" NOT NULL,
    
    -- Investment Details
    initial_investment_date DATE NOT NULL,
    initial_investment_amount DECIMAL(20, 2) NOT NULL,
    current_ownership DECIMAL(8, 4) NOT NULL, -- Percentage
    total_invested DECIMAL(20, 2) NOT NULL,
    
    -- Company Metrics
    current_revenue DECIMAL(20, 2),
    current_ebitda DECIMAL(20, 2),
    employee_count INTEGER,
    
    -- Key People
    ceo VARCHAR(255),
    board_members JSONB NOT NULL DEFAULT '[]',
    
    -- Investment Thesis
    investment_thesis TEXT NOT NULL,
    key_value_drivers JSONB NOT NULL DEFAULT '[]',
    exit_strategy TEXT,
    
    -- Status
    status "CompanyStatus" NOT NULL,
    
    -- Performance
    performance_metrics JSONB NOT NULL DEFAULT '[]',
    
    -- Exit Information
    exit_date DATE,
    exit_valuation DECIMAL(20, 2),
    exit_multiple DECIMAL(8, 4),
    exit_type "ExitType",
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT portfolio_companies_investment_company_unique UNIQUE (investment_id, company_name),
    CONSTRAINT portfolio_companies_initial_amount_positive CHECK (initial_investment_amount > 0),
    CONSTRAINT portfolio_companies_total_invested_positive CHECK (total_invested > 0),
    CONSTRAINT portfolio_companies_ownership_valid CHECK (current_ownership >= 0 AND current_ownership <= 100),
    CONSTRAINT portfolio_companies_employee_count_valid CHECK (employee_count IS NULL OR employee_count >= 0),
    CONSTRAINT portfolio_companies_exit_valuation_valid CHECK (exit_valuation IS NULL OR exit_valuation >= 0),
    CONSTRAINT portfolio_companies_exit_multiple_valid CHECK (exit_multiple IS NULL OR exit_multiple >= 0)
);

-- J-curve analysis table
CREATE TABLE IF NOT EXISTS j_curve_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id UUID REFERENCES alternative_investments(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Analysis Parameters
    analysis_date DATE NOT NULL,
    time_horizon INTEGER NOT NULL, -- Years
    
    -- J-Curve Points
    j_curve_points JSONB NOT NULL DEFAULT '[]',
    
    -- Key Metrics
    bottom_of_j_curve JSONB NOT NULL DEFAULT '{}',
    crossover_point JSONB DEFAULT '{}',
    projected_final_metrics JSONB NOT NULL DEFAULT '{}',
    
    -- Benchmarking
    peer_group_comparison JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255) NOT NULL,
    
    -- Constraints
    CONSTRAINT j_curve_analysis_time_horizon_positive CHECK (time_horizon > 0)
);

-- Alternative investment positions table
CREATE TABLE IF NOT EXISTS alternative_investment_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    portfolio_id VARCHAR(255) NOT NULL,
    investment_id UUID REFERENCES alternative_investments(id) ON DELETE CASCADE,
    
    -- Position Details
    commitment DECIMAL(20, 2) NOT NULL,
    total_called DECIMAL(20, 2) NOT NULL DEFAULT 0,
    total_distributed DECIMAL(20, 2) NOT NULL DEFAULT 0,
    current_nav DECIMAL(20, 2) NOT NULL DEFAULT 0,
    unrealized_value DECIMAL(20, 2) NOT NULL DEFAULT 0,
    
    -- Performance
    current_irr DECIMAL(8, 4) NOT NULL DEFAULT 0,
    current_multiple DECIMAL(8, 4) NOT NULL DEFAULT 1,
    
    -- Calculated Fields
    unfunded_commitment DECIMAL(20, 2) NOT NULL DEFAULT 0,
    distributed_to_invested DECIMAL(8, 4) NOT NULL DEFAULT 0, -- DPI
    residual_to_invested DECIMAL(8, 4) NOT NULL DEFAULT 1, -- RVPI
    total_to_invested DECIMAL(8, 4) NOT NULL DEFAULT 1, -- TVPI
    
    -- Cash Flow Summary
    total_cash_invested DECIMAL(20, 2) NOT NULL DEFAULT 0,
    total_cash_received DECIMAL(20, 2) NOT NULL DEFAULT 0,
    net_cash_flow DECIMAL(20, 2) NOT NULL DEFAULT 0,
    
    -- Risk Metrics
    concentration_risk DECIMAL(8, 4) NOT NULL DEFAULT 0,
    liquidity_risk "LiquidityRisk" NOT NULL DEFAULT 'HIGH',
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_valuation_date DATE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT alt_positions_tenant_portfolio_investment_unique UNIQUE (tenant_id, portfolio_id, investment_id),
    CONSTRAINT alt_positions_commitment_positive CHECK (commitment > 0),
    CONSTRAINT alt_positions_total_called_valid CHECK (total_called >= 0),
    CONSTRAINT alt_positions_total_distributed_valid CHECK (total_distributed >= 0),
    CONSTRAINT alt_positions_current_nav_valid CHECK (current_nav >= 0),
    CONSTRAINT alt_positions_unrealized_value_valid CHECK (unrealized_value >= 0),
    CONSTRAINT alt_positions_concentration_risk_valid CHECK (concentration_risk >= 0 AND concentration_risk <= 1)
);

-- Investment documents table
CREATE TABLE IF NOT EXISTS investment_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id UUID REFERENCES alternative_investments(id) ON DELETE CASCADE,
    
    -- Document Details
    document_type "DocumentTypeAlt" NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    
    -- Metadata
    upload_date DATE NOT NULL,
    uploaded_by VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    
    -- Classification
    confidentiality_level "ConfidentialityLevel" NOT NULL,
    document_category "DocumentCategory" NOT NULL,
    
    -- Versioning
    version INTEGER NOT NULL DEFAULT 1,
    is_latest_version BOOLEAN NOT NULL DEFAULT true,
    
    -- Access Control
    access_list JSONB NOT NULL DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT investment_documents_file_size_positive CHECK (file_size > 0),
    CONSTRAINT investment_documents_version_positive CHECK (version > 0)
);

-- ESG metrics table
CREATE TABLE IF NOT EXISTS esg_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id UUID REFERENCES alternative_investments(id) ON DELETE CASCADE,
    as_of_date DATE NOT NULL,
    
    -- ESG Scores
    overall_esg_score DECIMAL(5, 2),
    environmental_score DECIMAL(5, 2),
    social_score DECIMAL(5, 2),
    governance_score DECIMAL(5, 2),
    
    -- Specific Metrics
    carbon_footprint DECIMAL(15, 4),
    diversity_metrics JSONB DEFAULT '{}',
    
    -- Impact Metrics
    impact_metrics JSONB DEFAULT '[]',
    
    -- Compliance
    sustainability_compliance BOOLEAN NOT NULL DEFAULT false,
    impact_reporting_compliance BOOLEAN NOT NULL DEFAULT false,
    
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    data_source VARCHAR(255) NOT NULL,
    
    -- Constraints
    CONSTRAINT esg_metrics_overall_score_valid CHECK (overall_esg_score IS NULL OR (overall_esg_score >= 0 AND overall_esg_score <= 100)),
    CONSTRAINT esg_metrics_environmental_score_valid CHECK (environmental_score IS NULL OR (environmental_score >= 0 AND environmental_score <= 100)),
    CONSTRAINT esg_metrics_social_score_valid CHECK (social_score IS NULL OR (social_score >= 0 AND social_score <= 100)),
    CONSTRAINT esg_metrics_governance_score_valid CHECK (governance_score IS NULL OR (governance_score >= 0 AND governance_score <= 100)),
    CONSTRAINT esg_metrics_carbon_footprint_valid CHECK (carbon_footprint IS NULL OR carbon_footprint >= 0)
);

-- Create indexes for performance
CREATE INDEX idx_alt_investments_tenant_type ON alternative_investments(tenant_id, investment_type);
CREATE INDEX idx_alt_investments_vintage ON alternative_investments(vintage);
CREATE INDEX idx_alt_investments_status ON alternative_investments(status);
CREATE INDEX idx_alt_investments_gp ON alternative_investments(general_partner);
CREATE INDEX idx_alt_investments_active ON alternative_investments(is_active);

CREATE INDEX idx_capital_calls_investment_id ON capital_calls(investment_id);
CREATE INDEX idx_capital_calls_status ON capital_calls(status);
CREATE INDEX idx_capital_calls_due_date ON capital_calls(due_date);
CREATE INDEX idx_capital_calls_call_date ON capital_calls(call_date DESC);

CREATE INDEX idx_distributions_investment_id ON distributions(investment_id);
CREATE INDEX idx_distributions_status ON distributions(status);
CREATE INDEX idx_distributions_payment_date ON distributions(payment_date DESC);
CREATE INDEX idx_distributions_distribution_date ON distributions(distribution_date DESC);

CREATE INDEX idx_nav_updates_investment_id ON nav_updates(investment_id);
CREATE INDEX idx_nav_updates_as_of_date ON nav_updates(as_of_date DESC);
CREATE INDEX idx_nav_updates_reporting_date ON nav_updates(reporting_date DESC);

CREATE INDEX idx_portfolio_companies_investment_id ON portfolio_companies(investment_id);
CREATE INDEX idx_portfolio_companies_status ON portfolio_companies(status);
CREATE INDEX idx_portfolio_companies_sector ON portfolio_companies(sector);

CREATE INDEX idx_j_curve_analysis_investment_id ON j_curve_analysis(investment_id);
CREATE INDEX idx_j_curve_analysis_analysis_date ON j_curve_analysis(analysis_date DESC);

CREATE INDEX idx_alt_positions_tenant_portfolio ON alternative_investment_positions(tenant_id, portfolio_id);
CREATE INDEX idx_alt_positions_investment_id ON alternative_investment_positions(investment_id);
CREATE INDEX idx_alt_positions_active ON alternative_investment_positions(is_active);

CREATE INDEX idx_investment_documents_investment_id ON investment_documents(investment_id);
CREATE INDEX idx_investment_documents_type ON investment_documents(document_type);
CREATE INDEX idx_investment_documents_latest ON investment_documents(is_latest_version);

CREATE INDEX idx_esg_metrics_investment_id ON esg_metrics(investment_id);
CREATE INDEX idx_esg_metrics_as_of_date ON esg_metrics(as_of_date DESC);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_alt_investments_updated_at
    BEFORE UPDATE ON alternative_investments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_capital_calls_updated_at
    BEFORE UPDATE ON capital_calls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_distributions_updated_at
    BEFORE UPDATE ON distributions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_portfolio_companies_updated_at
    BEFORE UPDATE ON portfolio_companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_alt_positions_updated_at
    BEFORE UPDATE ON alternative_investment_positions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Sample data for testing
INSERT INTO alternative_investments (
    tenant_id, investment_name, investment_type, fund_name, general_partner,
    vintage, commitment, management_fee, carried_interest, commitment_date,
    fund_term, status, geographic_focus, sector_focus, created_by, updated_by
) VALUES 
(
    'tenant_001', 'Apollo Global Management Fund VIII', 'PRIVATE_EQUITY',
    'Apollo VIII', 'Apollo Global Management', 2021, 25000000.00,
    2.00, 20.00, '2021-03-15', 10, 'INVESTING',
    '["NORTH_AMERICA", "EUROPE"]', '["TECHNOLOGY", "HEALTHCARE", "FINANCIAL_SERVICES"]',
    'system', 'system'
),
(
    'tenant_001', 'Sequoia Capital Fund XIX', 'VENTURE_CAPITAL',
    'Sequoia XIX', 'Sequoia Capital', 2022, 10000000.00,
    2.50, 25.00, '2022-01-10', 10, 'INVESTING',
    '["NORTH_AMERICA", "ASIA_PACIFIC"]', '["TECHNOLOGY"]',
    'system', 'system'
),
(
    'tenant_001', 'Blackstone Real Estate Partners IX', 'REAL_ESTATE',
    'BREP IX', 'Blackstone', 2020, 15000000.00,
    1.50, 15.00, '2020-09-01', 8, 'HARVESTING',
    '["GLOBAL"]', '["REAL_ESTATE"]',
    'system', 'system'
);

-- Sample capital calls
INSERT INTO capital_calls (
    investment_id, tenant_id, call_number, call_date, due_date, call_amount,
    purpose, status, management_fee_amount
) VALUES 
(
    (SELECT id FROM alternative_investments WHERE investment_name = 'Apollo Global Management Fund VIII'),
    'tenant_001', 1, '2021-06-01', '2021-06-30', 2500000.00,
    'Initial investment in portfolio companies', 'INVESTED', 50000.00
),
(
    (SELECT id FROM alternative_investments WHERE investment_name = 'Sequoia Capital Fund XIX'),
    'tenant_001', 1, '2022-03-01', '2022-03-31', 1000000.00,
    'Seed stage investments', 'INVESTED', 25000.00
);

-- Sample distributions
INSERT INTO distributions (
    investment_id, tenant_id, distribution_number, distribution_date, payment_date,
    total_amount, status, return_of_capital, capital_gain
) VALUES 
(
    (SELECT id FROM alternative_investments WHERE investment_name = 'Blackstone Real Estate Partners IX'),
    'tenant_001', 1, '2023-12-15', '2023-12-31', 1200000.00,
    'PAID', 800000.00, 400000.00
);

-- Sample NAV updates
INSERT INTO nav_updates (
    investment_id, tenant_id, as_of_date, reporting_date, net_asset_value,
    gross_asset_value, total_liabilities, unrealized_gain, realized_gain,
    valuation_method, valuation_source, updated_by
) VALUES 
(
    (SELECT id FROM alternative_investments WHERE investment_name = 'Apollo Global Management Fund VIII'),
    'tenant_001', '2023-12-31', '2024-01-15', 27500000.00,
    28000000.00, 500000.00, 2000000.00, 500000.00,
    'MARKET_MULTIPLE', 'FUND_REPORT', 'system'
),
(
    (SELECT id FROM alternative_investments WHERE investment_name = 'Sequoia Capital Fund XIX'),
    'tenant_001', '2023-12-31', '2024-01-15', 12500000.00,
    12500000.00, 0.00, 1500000.00, 1000000.00,
    'TRANSACTION_MULTIPLE', 'FUND_REPORT', 'system'
);

-- Sample portfolio companies
INSERT INTO portfolio_companies (
    investment_id, tenant_id, company_name, business_description, sector, geography,
    initial_investment_date, initial_investment_amount, current_ownership,
    total_invested, investment_thesis, status
) VALUES 
(
    (SELECT id FROM alternative_investments WHERE investment_name = 'Apollo Global Management Fund VIII'),
    'tenant_001', 'TechCorp Solutions', 'Enterprise software solutions for manufacturing',
    'TECHNOLOGY', 'NORTH_AMERICA', '2021-08-15', 5000000.00, 25.5,
    7500000.00, 'Market-leading position in manufacturing software with strong growth potential',
    'ACTIVE'
),
(
    (SELECT id FROM alternative_investments WHERE investment_name = 'Sequoia Capital Fund XIX'),
    'tenant_001', 'HealthTech Startup', 'AI-powered diagnostic platform',
    'HEALTHCARE', 'NORTH_AMERICA', '2022-05-01', 2000000.00, 15.0,
    3500000.00, 'Disruptive AI technology with strong IP and experienced team',
    'ACTIVE'
);

-- Sample alternative investment positions
INSERT INTO alternative_investment_positions (
    tenant_id, portfolio_id, investment_id, commitment, total_called, total_distributed,
    current_nav, unrealized_value, unfunded_commitment, last_valuation_date
) VALUES 
(
    'tenant_001', 'portfolio_001',
    (SELECT id FROM alternative_investments WHERE investment_name = 'Apollo Global Management Fund VIII'),
    25000000.00, 5000000.00, 0.00, 27500000.00, 22500000.00, 20000000.00, '2023-12-31'
),
(
    'tenant_001', 'portfolio_001',
    (SELECT id FROM alternative_investments WHERE investment_name = 'Sequoia Capital Fund XIX'),
    10000000.00, 2000000.00, 0.00, 12500000.00, 10500000.00, 8000000.00, '2023-12-31'
),
(
    'tenant_001', 'portfolio_002',
    (SELECT id FROM alternative_investments WHERE investment_name = 'Blackstone Real Estate Partners IX'),
    15000000.00, 12000000.00, 1200000.00, 14500000.00, 2500000.00, 3000000.00, '2023-12-31'
);

-- Comments
COMMENT ON TABLE alternative_investments IS 'Core alternative investments including private equity, hedge funds, and real estate';
COMMENT ON TABLE capital_calls IS 'Capital call tracking for alternative investments';
COMMENT ON TABLE distributions IS 'Distribution tracking for alternative investments';
COMMENT ON TABLE nav_updates IS 'Net Asset Value updates and valuations';
COMMENT ON TABLE portfolio_companies IS 'Portfolio companies within alternative investments';
COMMENT ON TABLE j_curve_analysis IS 'J-curve analysis and performance projections';
COMMENT ON TABLE alternative_investment_positions IS 'Portfolio positions in alternative investments';
COMMENT ON TABLE investment_documents IS 'Document management for alternative investments';
COMMENT ON TABLE esg_metrics IS 'ESG metrics and impact measurement';