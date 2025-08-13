-- Compliance Monitoring System Migration
-- Phase 3.6 - Comprehensive compliance monitoring with investment guidelines, breach detection, and regulatory oversight

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums for compliance monitoring
CREATE TYPE "ComplianceRuleType" AS ENUM (
    'INVESTMENT_GUIDELINE',
    'CONCENTRATION_LIMIT', 
    'RESTRICTED_LIST',
    'SUITABILITY_CHECK',
    'REGULATORY_LIMIT',
    'RISK_LIMIT',
    'SECTOR_LIMIT',
    'ASSET_CLASS_LIMIT',
    'LIQUIDITY_REQUIREMENT',
    'ESG_CRITERIA'
);

CREATE TYPE "ComplianceStatus" AS ENUM (
    'COMPLIANT',
    'WARNING',
    'BREACH',
    'PENDING_REVIEW',
    'WAIVED'
);

CREATE TYPE "BreachSeverity" AS ENUM (
    'LOW',
    'MEDIUM', 
    'HIGH',
    'CRITICAL'
);

CREATE TYPE "MonitoringFrequency" AS ENUM (
    'REAL_TIME',
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'QUARTERLY'
);

CREATE TYPE "ActionType" AS ENUM (
    'AUTOMATIC_BLOCK',
    'REQUIRE_APPROVAL',
    'ALERT_ONLY',
    'SOFT_WARNING'
);

CREATE TYPE "WorkflowStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'RESOLVED',
    'ESCALATED',
    'CANCELLED'
);

CREATE TYPE "RestrictedListType" AS ENUM (
    'PROHIBITED',
    'WATCH',
    'RESTRICTED',
    'APPROVED_ONLY'
);

CREATE TYPE "RestrictionLevel" AS ENUM (
    'PROHIBITED',
    'WATCH',
    'RESTRICTED',
    'APPROVED_ONLY'
);

CREATE TYPE "RiskTolerance" AS ENUM (
    'CONSERVATIVE',
    'MODERATE',
    'AGGRESSIVE',
    'SPECULATIVE'
);

CREATE TYPE "RiskCapacity" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);

CREATE TYPE "LiquidityNeed" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);

CREATE TYPE "InvestmentExperience" AS ENUM (
    'NONE',
    'LIMITED',
    'GOOD',
    'EXTENSIVE'
);

CREATE TYPE "SuitabilityType" AS ENUM (
    'SUITABLE',
    'UNSUITABLE',
    'REQUIRES_REVIEW'
);

CREATE TYPE "CheckType" AS ENUM (
    'INITIAL',
    'ONGOING',
    'TRANSACTION_BASED'
);

-- Core compliance rules table
CREATE TABLE IF NOT EXISTS compliance_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    rule_code VARCHAR(100) NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_type "ComplianceRuleType" NOT NULL,
    
    -- Rule Logic (stored as JSONB for flexibility)
    conditions JSONB NOT NULL DEFAULT '[]',
    parameters JSONB NOT NULL DEFAULT '{}',
    thresholds JSONB NOT NULL DEFAULT '[]',
    
    -- Scope
    applicable_portfolios JSONB,
    applicable_clients JSONB,
    applicable_asset_classes JSONB,
    applicable_security_types JSONB,
    
    -- Monitoring
    monitoring_frequency "MonitoringFrequency" NOT NULL DEFAULT 'DAILY',
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 5,
    
    -- Actions
    breach_action "ActionType" NOT NULL DEFAULT 'ALERT_ONLY',
    warning_threshold DECIMAL(10, 4),
    
    -- Metadata
    regulatory_source VARCHAR(255),
    compliance_officer VARCHAR(255) NOT NULL,
    effective_date DATE NOT NULL,
    expiration_date DATE,
    last_review_date DATE,
    next_review_date DATE NOT NULL,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255) NOT NULL,
    
    -- Constraints
    CONSTRAINT compliance_rules_tenant_rule_code_unique UNIQUE (tenant_id, rule_code),
    CONSTRAINT compliance_rules_priority_check CHECK (priority >= 1 AND priority <= 10),
    CONSTRAINT compliance_rules_dates_check CHECK (expiration_date IS NULL OR expiration_date > effective_date)
);

-- Investment guidelines table
CREATE TABLE IF NOT EXISTS investment_guidelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    portfolio_id VARCHAR(255) NOT NULL,
    client_id VARCHAR(255),
    
    guideline_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    
    -- Allocation Guidelines
    min_equity_allocation DECIMAL(5, 2),
    max_equity_allocation DECIMAL(5, 2),
    min_fixed_income_allocation DECIMAL(5, 2),
    max_fixed_income_allocation DECIMAL(5, 2),
    min_cash_allocation DECIMAL(5, 2),
    max_cash_allocation DECIMAL(5, 2),
    min_alternative_allocation DECIMAL(5, 2),
    max_alternative_allocation DECIMAL(5, 2),
    
    -- Sector Guidelines (stored as JSONB)
    sector_limits JSONB DEFAULT '[]',
    
    -- Security Guidelines
    max_security_concentration DECIMAL(5, 2) NOT NULL,
    max_issuer_concentration DECIMAL(5, 2) NOT NULL,
    min_credit_rating VARCHAR(10),
    allowed_security_types JSONB NOT NULL,
    
    -- Risk Guidelines
    max_portfolio_volatility DECIMAL(6, 4),
    max_drawdown DECIMAL(5, 2),
    max_beta DECIMAL(6, 4),
    min_liquidity DECIMAL(5, 2),
    
    -- ESG Guidelines
    esg_min_score DECIMAL(3, 1),
    exclude_sectors JSONB,
    require_esg_screening BOOLEAN NOT NULL DEFAULT false,
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    effective_date DATE NOT NULL,
    expiration_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT investment_guidelines_allocations_check CHECK (
        (min_equity_allocation IS NULL OR min_equity_allocation >= 0) AND
        (max_equity_allocation IS NULL OR max_equity_allocation <= 100) AND
        (min_equity_allocation IS NULL OR max_equity_allocation IS NULL OR min_equity_allocation <= max_equity_allocation)
    ),
    CONSTRAINT investment_guidelines_concentrations_check CHECK (
        max_security_concentration > 0 AND max_security_concentration <= 100 AND
        max_issuer_concentration > 0 AND max_issuer_concentration <= 100
    )
);

-- Compliance breaches table
CREATE TABLE IF NOT EXISTS compliance_breaches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    rule_id UUID REFERENCES compliance_rules(id),
    portfolio_id VARCHAR(255) NOT NULL,
    
    breach_type "ComplianceRuleType" NOT NULL,
    severity "BreachSeverity" NOT NULL,
    status "ComplianceStatus" NOT NULL DEFAULT 'BREACH',
    
    -- Breach Details
    breach_description TEXT NOT NULL,
    actual_value DECIMAL(20, 8) NOT NULL,
    limit_value DECIMAL(20, 8) NOT NULL,
    excess_amount DECIMAL(20, 8) NOT NULL,
    percentage_over DECIMAL(10, 4) NOT NULL,
    
    -- Context
    instrument_id VARCHAR(255),
    instrument_symbol VARCHAR(50),
    asset_class VARCHAR(100),
    sector VARCHAR(100),
    
    -- Detection
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    detection_method VARCHAR(50) NOT NULL DEFAULT 'REAL_TIME',
    
    -- Resolution
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by VARCHAR(255),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(255),
    resolution_notes TEXT,
    
    -- Workflow
    workflow_id UUID,
    assigned_to VARCHAR(255),
    escalated_at TIMESTAMP WITH TIME ZONE,
    escalated_to VARCHAR(255),
    
    -- Auto-remediation
    auto_remediation_attempted BOOLEAN NOT NULL DEFAULT false,
    auto_remediation_successful BOOLEAN,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT compliance_breaches_amounts_check CHECK (
        actual_value >= 0 AND limit_value >= 0 AND excess_amount >= 0
    )
);

-- Restricted lists table
CREATE TABLE IF NOT EXISTS restricted_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    
    list_name VARCHAR(255) NOT NULL,
    list_type "RestrictedListType" NOT NULL,
    description TEXT,
    
    -- Securities (stored as JSONB array)
    securities JSONB NOT NULL DEFAULT '[]',
    
    -- Scope
    applicable_portfolios JSONB,
    applicable_clients JSONB,
    
    -- Actions
    violation_action "ActionType" NOT NULL DEFAULT 'ALERT_ONLY',
    allow_existing_positions BOOLEAN NOT NULL DEFAULT true,
    block_new_positions BOOLEAN NOT NULL DEFAULT true,
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    effective_date DATE NOT NULL,
    expiration_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255) NOT NULL,
    
    -- Constraints
    CONSTRAINT restricted_lists_tenant_name_unique UNIQUE (tenant_id, list_name)
);

-- Suitability profiles table
CREATE TABLE IF NOT EXISTS suitability_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    
    -- Risk Profile
    risk_tolerance "RiskTolerance" NOT NULL,
    risk_capacity "RiskCapacity" NOT NULL,
    
    -- Investment Objectives
    primary_objective VARCHAR(255) NOT NULL,
    secondary_objectives JSONB DEFAULT '[]',
    time_horizon INTEGER NOT NULL, -- in years
    liquidity_needs "LiquidityNeed" NOT NULL,
    
    -- Financial Information
    net_worth DECIMAL(20, 2),
    annual_income DECIMAL(20, 2),
    investment_experience "InvestmentExperience" NOT NULL,
    
    -- Restrictions
    personal_restrictions JSONB DEFAULT '[]',
    regulatory_restrictions JSONB DEFAULT '[]',
    
    -- Suitability Rules
    max_equity_allocation DECIMAL(5, 2) NOT NULL,
    max_alternative_allocation DECIMAL(5, 2) NOT NULL,
    max_concentration DECIMAL(5, 2) NOT NULL,
    min_credit_rating VARCHAR(10),
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    next_review_date DATE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT suitability_profiles_client_unique UNIQUE (tenant_id, client_id),
    CONSTRAINT suitability_profiles_allocations_check CHECK (
        max_equity_allocation >= 0 AND max_equity_allocation <= 100 AND
        max_alternative_allocation >= 0 AND max_alternative_allocation <= 100 AND
        max_concentration > 0 AND max_concentration <= 100
    ),
    CONSTRAINT suitability_profiles_time_horizon_check CHECK (time_horizon > 0)
);

-- Suitability checks table
CREATE TABLE IF NOT EXISTS suitability_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    portfolio_id VARCHAR(255) NOT NULL,
    
    check_type "CheckType" NOT NULL,
    check_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Assessment Results
    overall_suitability "SuitabilityType" NOT NULL,
    suitability_score DECIMAL(5, 2) NOT NULL, -- 0-100
    
    -- Individual Scores
    risk_alignment_score DECIMAL(5, 2) NOT NULL,
    objective_alignment_score DECIMAL(5, 2) NOT NULL,
    concentration_score DECIMAL(5, 2) NOT NULL,
    liquidity_score DECIMAL(5, 2) NOT NULL,
    
    -- Issues and Recommendations (stored as JSONB)
    suitability_issues JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    required_actions JSONB DEFAULT '[]',
    
    performed_by VARCHAR(255) NOT NULL,
    reviewed_by VARCHAR(255),
    approved_by VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT suitability_checks_scores_check CHECK (
        suitability_score >= 0 AND suitability_score <= 100 AND
        risk_alignment_score >= 0 AND risk_alignment_score <= 100 AND
        objective_alignment_score >= 0 AND objective_alignment_score <= 100 AND
        concentration_score >= 0 AND concentration_score <= 100 AND
        liquidity_score >= 0 AND liquidity_score <= 100
    )
);

-- Compliance workflows table
CREATE TABLE IF NOT EXISTS compliance_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    breach_id UUID REFERENCES compliance_breaches(id),
    
    workflow_type VARCHAR(100) NOT NULL,
    status "WorkflowStatus" NOT NULL DEFAULT 'PENDING',
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    
    -- Assignment
    assigned_to VARCHAR(255) NOT NULL,
    assigned_by VARCHAR(255) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Workflow Steps (stored as JSONB)
    steps JSONB NOT NULL DEFAULT '[]',
    current_step INTEGER NOT NULL DEFAULT 1,
    
    -- Progress
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Resolution
    resolution_type VARCHAR(50),
    resolution_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT compliance_workflows_priority_check CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    CONSTRAINT compliance_workflows_current_step_check CHECK (current_step >= 1)
);

-- Regulatory rules table (for rule engine)
CREATE TABLE IF NOT EXISTS regulatory_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    
    regulation_code VARCHAR(100) NOT NULL,
    regulation_name VARCHAR(255) NOT NULL,
    jurisdiction VARCHAR(100) NOT NULL,
    regulatory_body VARCHAR(255) NOT NULL,
    
    -- Rule Definition (stored as JSONB for flexibility)
    rule_expression TEXT NOT NULL,
    rule_logic JSONB NOT NULL,
    parameters JSONB DEFAULT '[]',
    
    -- Metadata
    effective_date DATE NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT regulatory_rules_tenant_code_unique UNIQUE (tenant_id, regulation_code, version)
);

-- Compliance reports table
CREATE TABLE IF NOT EXISTS compliance_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    
    report_type VARCHAR(100) NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Report Parameters (stored as JSONB)
    portfolio_ids JSONB,
    client_ids JSONB,
    date_range JSONB NOT NULL,
    
    -- Report Data (stored as JSONB)
    report_data JSONB NOT NULL,
    
    -- Generation Info
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    generated_by VARCHAR(255) NOT NULL,
    format VARCHAR(20) NOT NULL DEFAULT 'JSON',
    
    -- Distribution
    recipients JSONB DEFAULT '[]',
    distributed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_compliance_rules_tenant_active ON compliance_rules(tenant_id, is_active);
CREATE INDEX idx_compliance_rules_type ON compliance_rules(rule_type);
CREATE INDEX idx_compliance_rules_effective_date ON compliance_rules(effective_date);

CREATE INDEX idx_investment_guidelines_tenant_portfolio ON investment_guidelines(tenant_id, portfolio_id);
CREATE INDEX idx_investment_guidelines_active ON investment_guidelines(is_active);

CREATE INDEX idx_compliance_breaches_tenant_portfolio ON compliance_breaches(tenant_id, portfolio_id);
CREATE INDEX idx_compliance_breaches_status ON compliance_breaches(status);
CREATE INDEX idx_compliance_breaches_severity ON compliance_breaches(severity);
CREATE INDEX idx_compliance_breaches_detected_at ON compliance_breaches(detected_at);
CREATE INDEX idx_compliance_breaches_rule_id ON compliance_breaches(rule_id);

CREATE INDEX idx_restricted_lists_tenant_active ON restricted_lists(tenant_id, is_active);
CREATE INDEX idx_restricted_lists_type ON restricted_lists(list_type);

CREATE INDEX idx_suitability_profiles_tenant_client ON suitability_profiles(tenant_id, client_id);
CREATE INDEX idx_suitability_profiles_active ON suitability_profiles(is_active);

CREATE INDEX idx_suitability_checks_tenant_client ON suitability_checks(tenant_id, client_id);
CREATE INDEX idx_suitability_checks_portfolio ON suitability_checks(portfolio_id);
CREATE INDEX idx_suitability_checks_check_date ON suitability_checks(check_date);

CREATE INDEX idx_compliance_workflows_tenant_status ON compliance_workflows(tenant_id, status);
CREATE INDEX idx_compliance_workflows_assigned_to ON compliance_workflows(assigned_to);
CREATE INDEX idx_compliance_workflows_due_date ON compliance_workflows(due_date);

CREATE INDEX idx_regulatory_rules_tenant_active ON regulatory_rules(tenant_id, is_active);
CREATE INDEX idx_regulatory_rules_jurisdiction ON regulatory_rules(jurisdiction);

CREATE INDEX idx_compliance_reports_tenant_type ON compliance_reports(tenant_id, report_type);
CREATE INDEX idx_compliance_reports_generated_at ON compliance_reports(generated_at);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_compliance_rules_updated_at
    BEFORE UPDATE ON compliance_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_investment_guidelines_updated_at
    BEFORE UPDATE ON investment_guidelines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_compliance_breaches_updated_at
    BEFORE UPDATE ON compliance_breaches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_restricted_lists_updated_at
    BEFORE UPDATE ON restricted_lists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_suitability_profiles_updated_at
    BEFORE UPDATE ON suitability_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_suitability_checks_updated_at
    BEFORE UPDATE ON suitability_checks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_compliance_workflows_updated_at
    BEFORE UPDATE ON compliance_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_regulatory_rules_updated_at
    BEFORE UPDATE ON regulatory_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Sample compliance rules
INSERT INTO compliance_rules (
    tenant_id, rule_code, rule_name, description, rule_type,
    conditions, parameters, thresholds,
    monitoring_frequency, breach_action, compliance_officer,
    effective_date, next_review_date, created_by, updated_by
) VALUES 
(
    'tenant_001', 'EQUITY_LIMIT_001', 'Maximum Equity Allocation', 
    'Ensures equity allocation does not exceed 80% of portfolio value',
    'ASSET_CLASS_LIMIT',
    '[{"field": "equity_allocation", "operator": "LESS_EQUAL", "value": 80}]',
    '{"asset_class": "EQUITY", "allocation_type": "PERCENTAGE"}',
    '[{"name": "max_allocation", "value": 80, "unit": "PERCENTAGE", "warningLevel": 75, "breachLevel": 80}]',
    'DAILY', 'ALERT_ONLY', 'compliance@example.com',
    CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 'system', 'system'
),
(
    'tenant_001', 'CONC_LIMIT_001', 'Security Concentration Limit',
    'No single security can exceed 10% of portfolio value',
    'CONCENTRATION_LIMIT',
    '[{"field": "security_concentration", "operator": "LESS_EQUAL", "value": 10}]',
    '{"concentration_type": "SECURITY", "measurement": "PERCENTAGE"}',
    '[{"name": "max_concentration", "value": 10, "unit": "PERCENTAGE", "warningLevel": 8, "breachLevel": 10}]',
    'REAL_TIME', 'REQUIRE_APPROVAL', 'compliance@example.com',
    CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 'system', 'system'
);

-- Sample investment guidelines
INSERT INTO investment_guidelines (
    tenant_id, portfolio_id, guideline_name, description,
    max_equity_allocation, max_fixed_income_allocation, max_cash_allocation,
    max_security_concentration, max_issuer_concentration,
    allowed_security_types, effective_date
) VALUES 
(
    'tenant_001', 'portfolio_001', 'Conservative Portfolio Guidelines',
    'Investment guidelines for conservative risk tolerance clients',
    60.0, 85.0, 20.0, 5.0, 10.0,
    '["EQUITY", "FIXED_INCOME", "CASH", "ETF", "MUTUAL_FUND"]',
    CURRENT_DATE
),
(
    'tenant_001', 'portfolio_002', 'Aggressive Growth Guidelines', 
    'Investment guidelines for aggressive growth portfolios',
    95.0, 40.0, 10.0, 10.0, 15.0,
    '["EQUITY", "ETF", "DERIVATIVES", "ALTERNATIVES"]',
    CURRENT_DATE
);

-- Sample restricted list
INSERT INTO restricted_lists (
    tenant_id, list_name, list_type, description,
    securities, violation_action, effective_date,
    created_by, updated_by
) VALUES 
(
    'tenant_001', 'Prohibited Securities', 'PROHIBITED',
    'Securities that are completely prohibited for investment',
    '[
        {
            "instrumentId": "RESTRICTED_001",
            "symbol": "XXXX",
            "securityName": "Restricted Company A",
            "securityType": "EQUITY",
            "restrictionReason": "Regulatory compliance",
            "restrictionLevel": "PROHIBITED",
            "addedDate": "2025-01-01",
            "addedBy": "compliance_officer",
            "isActive": true
        }
    ]',
    'AUTOMATIC_BLOCK', CURRENT_DATE, 'system', 'system'
);

-- Sample suitability profile
INSERT INTO suitability_profiles (
    tenant_id, client_id, risk_tolerance, risk_capacity,
    primary_objective, time_horizon, liquidity_needs,
    investment_experience, max_equity_allocation,
    max_alternative_allocation, max_concentration,
    next_review_date
) VALUES 
(
    'tenant_001', 'client_001', 'MODERATE', 'MEDIUM',
    'Balanced Growth and Income', 10, 'MEDIUM',
    'GOOD', 70.0, 20.0, 5.0,
    CURRENT_DATE + INTERVAL '1 year'
);

COMMENT ON TABLE compliance_rules IS 'Core compliance rules and regulations';
COMMENT ON TABLE investment_guidelines IS 'Investment guidelines and restrictions for portfolios';
COMMENT ON TABLE compliance_breaches IS 'Compliance violations and breaches';
COMMENT ON TABLE restricted_lists IS 'Lists of restricted or prohibited securities';
COMMENT ON TABLE suitability_profiles IS 'Client suitability profiles and risk assessments';
COMMENT ON TABLE suitability_checks IS 'Suitability verification results';
COMMENT ON TABLE compliance_workflows IS 'Workflows for breach resolution and compliance tasks';
COMMENT ON TABLE regulatory_rules IS 'Regulatory rules for automated compliance checking';
COMMENT ON TABLE compliance_reports IS 'Generated compliance reports and documentation';