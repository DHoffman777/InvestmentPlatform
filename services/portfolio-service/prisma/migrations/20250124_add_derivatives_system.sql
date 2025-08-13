-- Derivatives System Migration
-- Phase 3.5 - Comprehensive derivatives support with options, futures, and analytics

-- Create derivative types enum
CREATE TYPE "DerivativeType" AS ENUM (
    'CALL_OPTION',
    'PUT_OPTION', 
    'FUTURE',
    'SWAP',
    'FORWARD',
    'WARRANT',
    'CONVERTIBLE_BOND'
);

-- Create option style enum
CREATE TYPE "OptionStyle" AS ENUM (
    'AMERICAN',
    'EUROPEAN',
    'BERMUDAN',
    'ASIAN',
    'BARRIER',
    'EXOTIC'
);

-- Create exercise type enum
CREATE TYPE "ExerciseType" AS ENUM (
    'PHYSICAL_DELIVERY',
    'CASH_SETTLEMENT',
    'CHOICE_OF_SETTLEMENT'
);

-- Create option status enum
CREATE TYPE "OptionStatus" AS ENUM (
    'ACTIVE',
    'EXPIRED',
    'EXERCISED',
    'ASSIGNED',
    'CLOSED',
    'CANCELLED'
);

-- Create margin type enum
CREATE TYPE "MarginType" AS ENUM (
    'INITIAL_MARGIN',
    'MAINTENANCE_MARGIN',
    'VARIATION_MARGIN',
    'SPAN_MARGIN',
    'PORTFOLIO_MARGIN'
);

-- Create volatility model enum
CREATE TYPE "VolatilityModel" AS ENUM (
    'BLACK_SCHOLES',
    'BINOMIAL',
    'TRINOMIAL',
    'MONTE_CARLO',
    'HESTON',
    'LOCAL_VOLATILITY'
);

-- Create strategy type enum
CREATE TYPE "StrategyType" AS ENUM (
    'SINGLE_OPTION',
    'COVERED_CALL',
    'PROTECTIVE_PUT',
    'STRADDLE',
    'STRANGLE',
    'SPREAD_BULL_CALL',
    'SPREAD_BULL_PUT',
    'SPREAD_BEAR_CALL',
    'SPREAD_BEAR_PUT',
    'IRON_CONDOR',
    'IRON_BUTTERFLY',
    'COLLAR',
    'CUSTOM'
);

-- Core derivative instruments table
CREATE TABLE IF NOT EXISTS derivative_instruments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    instrument_id VARCHAR(255) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    underlying_symbol VARCHAR(50) NOT NULL,
    underlying_instrument_id VARCHAR(255),
    
    -- Basic derivative information
    derivative_type "DerivativeType" NOT NULL,
    exchange VARCHAR(100) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    country VARCHAR(3) NOT NULL DEFAULT 'US',
    
    -- Contract specifications
    contract_size DECIMAL(20, 4) NOT NULL DEFAULT 100,
    multiplier DECIMAL(10, 4) NOT NULL DEFAULT 1,
    tick_size DECIMAL(10, 6) NOT NULL DEFAULT 0.01,
    tick_value DECIMAL(10, 4) NOT NULL DEFAULT 1,
    
    -- Dates
    issue_date DATE,
    expiration_date DATE NOT NULL,
    last_trading_date DATE,
    settlement_date DATE,
    
    -- Status and lifecycle
    status "OptionStatus" NOT NULL DEFAULT 'ACTIVE',
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Market data
    current_price DECIMAL(12, 6) NOT NULL,
    underlying_price DECIMAL(12, 6) NOT NULL,
    price_date DATE NOT NULL,
    bid_price DECIMAL(12, 6),
    ask_price DECIMAL(12, 6),
    last_price DECIMAL(12, 6),
    volume BIGINT DEFAULT 0,
    open_interest BIGINT DEFAULT 0,
    
    -- Risk and margin
    initial_margin DECIMAL(15, 4),
    maintenance_margin DECIMAL(15, 4),
    margin_requirement DECIMAL(15, 4),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_derivative_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT unique_derivative_per_tenant UNIQUE (tenant_id, instrument_id),
    CONSTRAINT check_positive_prices CHECK (current_price >= 0 AND underlying_price >= 0),
    CONSTRAINT check_positive_contract_specs CHECK (contract_size > 0 AND multiplier > 0 AND tick_size > 0 AND tick_value > 0),
    CONSTRAINT check_expiration_after_issue CHECK (expiration_date >= issue_date OR issue_date IS NULL)
);

-- Options-specific table
CREATE TABLE IF NOT EXISTS option_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    derivative_instrument_id UUID NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Option-specific fields
    option_type VARCHAR(4) NOT NULL CHECK (option_type IN ('CALL', 'PUT')),
    option_style "OptionStyle" NOT NULL DEFAULT 'AMERICAN',
    strike_price DECIMAL(12, 6) NOT NULL,
    exercise_type "ExerciseType" NOT NULL DEFAULT 'PHYSICAL_DELIVERY',
    
    -- Premium and intrinsic value
    premium DECIMAL(12, 6) NOT NULL,
    intrinsic_value DECIMAL(12, 6) NOT NULL DEFAULT 0,
    time_value DECIMAL(12, 6) NOT NULL DEFAULT 0,
    
    -- Greeks (current values)
    delta DECIMAL(10, 8) NOT NULL DEFAULT 0,
    gamma DECIMAL(10, 8) NOT NULL DEFAULT 0,
    theta DECIMAL(10, 8) NOT NULL DEFAULT 0,
    vega DECIMAL(10, 8) NOT NULL DEFAULT 0,
    rho DECIMAL(10, 8) NOT NULL DEFAULT 0,
    
    -- Volatility
    implied_volatility DECIMAL(8, 6) NOT NULL,
    historical_volatility DECIMAL(8, 6),
    volatility_model "VolatilityModel" NOT NULL DEFAULT 'BLACK_SCHOLES',
    
    -- Exercise and assignment
    can_exercise BOOLEAN NOT NULL DEFAULT true,
    exercise_count INTEGER DEFAULT 0,
    assignment_count INTEGER DEFAULT 0,
    
    -- Dividend adjustments
    dividend_amount DECIMAL(10, 4),
    ex_dividend_date DATE,
    dividend_adjusted BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_option_derivative FOREIGN KEY (derivative_instrument_id) REFERENCES derivative_instruments(id) ON DELETE CASCADE,
    CONSTRAINT fk_option_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT check_positive_strike CHECK (strike_price > 0),
    CONSTRAINT check_positive_premium CHECK (premium >= 0),
    CONSTRAINT check_positive_volatility CHECK (implied_volatility > 0),
    CONSTRAINT check_valid_greeks CHECK (delta BETWEEN -2 AND 2 AND gamma >= 0 AND vega >= 0)
);

-- Futures-specific table
CREATE TABLE IF NOT EXISTS future_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    derivative_instrument_id UUID NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Futures-specific fields
    future_type VARCHAR(50) NOT NULL, -- e.g., 'COMMODITY', 'FINANCIAL', 'EQUITY_INDEX'
    delivery_month VARCHAR(10) NOT NULL, -- e.g., 'MAR2024', 'JUN2024'
    delivery_location VARCHAR(100),
    
    -- Pricing
    settlement_price DECIMAL(12, 6) NOT NULL,
    daily_settlement DECIMAL(12, 6) NOT NULL DEFAULT 0,
    mark_to_market DECIMAL(15, 4) NOT NULL DEFAULT 0,
    
    -- Margin
    initial_margin_rate DECIMAL(8, 6) NOT NULL,
    maintenance_margin_rate DECIMAL(8, 6) NOT NULL,
    variation_margin DECIMAL(15, 4) NOT NULL DEFAULT 0,
    
    -- Limits
    daily_price_limit DECIMAL(12, 6),
    position_limit BIGINT,
    
    -- Delivery
    delivery_method "ExerciseType" NOT NULL DEFAULT 'PHYSICAL_DELIVERY',
    first_notice_date DATE,
    last_delivery_date DATE,
    
    -- Position tracking
    open_interest BIGINT DEFAULT 0,
    volume BIGINT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_future_derivative FOREIGN KEY (derivative_instrument_id) REFERENCES derivative_instruments(id) ON DELETE CASCADE,
    CONSTRAINT fk_future_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT check_positive_settlement CHECK (settlement_price >= 0),
    CONSTRAINT check_positive_margin_rates CHECK (initial_margin_rate >= 0 AND maintenance_margin_rate >= 0),
    CONSTRAINT check_margin_rates_order CHECK (initial_margin_rate >= maintenance_margin_rate)
);

-- Greeks calculations table
CREATE TABLE IF NOT EXISTS greeks_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    instrument_id VARCHAR(255) NOT NULL,
    calculation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- First-order Greeks
    delta DECIMAL(10, 8) NOT NULL,
    delta_cash DECIMAL(15, 4),
    
    -- Second-order Greeks
    gamma DECIMAL(10, 8) NOT NULL,
    gamma_cash DECIMAL(15, 4),
    
    -- Time decay
    theta DECIMAL(10, 8) NOT NULL,
    theta_daily DECIMAL(10, 8),
    
    -- Volatility sensitivity
    vega DECIMAL(10, 8) NOT NULL,
    vega_percent DECIMAL(10, 8),
    
    -- Interest rate sensitivity
    rho DECIMAL(10, 8) NOT NULL,
    rho_percent DECIMAL(10, 8),
    
    -- Additional Greeks
    lambda DECIMAL(10, 8), -- Leverage/elasticity
    epsilon DECIMAL(10, 8), -- Dividend sensitivity
    volga DECIMAL(10, 8), -- Vega of vega
    vanna DECIMAL(10, 8), -- Delta of vega
    charm DECIMAL(10, 8), -- Delta of theta
    color DECIMAL(10, 8), -- Gamma of theta
    
    -- Calculation parameters
    underlying_price DECIMAL(12, 6) NOT NULL,
    volatility DECIMAL(8, 6) NOT NULL,
    risk_free_rate DECIMAL(8, 6) NOT NULL,
    dividend_yield DECIMAL(8, 6),
    time_to_expiration DECIMAL(10, 8) NOT NULL, -- In years
    
    -- Metadata
    calculation_method "VolatilityModel" NOT NULL,
    calculation_time INTEGER, -- Milliseconds
    warnings TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_greeks_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT check_positive_market_data CHECK (underlying_price > 0 AND volatility > 0),
    CONSTRAINT check_time_to_expiration CHECK (time_to_expiration >= 0)
);

-- Implied volatility analysis table
CREATE TABLE IF NOT EXISTS implied_volatility_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    instrument_id VARCHAR(255) NOT NULL,
    analysis_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Current IV metrics
    implied_volatility DECIMAL(8, 6) NOT NULL,
    bid_iv DECIMAL(8, 6),
    ask_iv DECIMAL(8, 6),
    mid_iv DECIMAL(8, 6),
    
    -- Historical context
    historical_volatility DECIMAL(8, 6),
    iv_rank DECIMAL(5, 2), -- 0-100 percentile rank
    iv_percentile DECIMAL(5, 4), -- 0-1 percentile
    
    -- IV surface data
    atm_iv DECIMAL(8, 6), -- At-the-money IV
    skew DECIMAL(8, 6), -- IV skew metric
    term_structure JSONB, -- IV term structure points
    
    -- Volatility metrics
    realized_volatility DECIMAL(8, 6),
    vol_of_vol DECIMAL(8, 6), -- Volatility of volatility
    mean_reversion DECIMAL(8, 6),
    
    -- Statistical measures
    iv_standard_deviation DECIMAL(8, 6),
    confidence_95_upper DECIMAL(8, 6),
    confidence_95_lower DECIMAL(8, 6),
    
    -- Term structure
    front_month_iv DECIMAL(8, 6),
    back_month_iv DECIMAL(8, 6),
    term_structure_slope DECIMAL(8, 6),
    
    -- Analysis metadata
    data_points INTEGER,
    calculation_method VARCHAR(50),
    warnings TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_iv_analysis_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT check_positive_iv CHECK (implied_volatility > 0),
    CONSTRAINT check_valid_percentiles CHECK (iv_rank >= 0 AND iv_rank <= 100 AND iv_percentile >= 0 AND iv_percentile <= 1)
);

-- Option strategies table
CREATE TABLE IF NOT EXISTS option_strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    portfolio_id UUID,
    
    -- Strategy details
    strategy_name VARCHAR(255) NOT NULL,
    strategy_type "StrategyType" NOT NULL,
    description TEXT,
    
    -- Strategy metrics
    max_profit DECIMAL(15, 4),
    max_loss DECIMAL(15, 4),
    breakeven DECIMAL(12, 6)[],
    probability_of_profit DECIMAL(5, 4),
    
    -- Greeks aggregation
    net_delta DECIMAL(10, 8) NOT NULL DEFAULT 0,
    net_gamma DECIMAL(10, 8) NOT NULL DEFAULT 0,
    net_theta DECIMAL(10, 8) NOT NULL DEFAULT 0,
    net_vega DECIMAL(10, 8) NOT NULL DEFAULT 0,
    net_rho DECIMAL(10, 8) NOT NULL DEFAULT 0,
    
    -- Cost and margin
    net_premium DECIMAL(15, 4) NOT NULL, -- Net debit/credit
    margin_requirement DECIMAL(15, 4),
    buying_power DECIMAL(15, 4),
    
    -- Risk metrics
    risk_reward_ratio DECIMAL(8, 4),
    maximum_drawdown DECIMAL(8, 4),
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    expiration_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_strategy_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_strategy_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id),
    CONSTRAINT check_positive_probability CHECK (probability_of_profit IS NULL OR (probability_of_profit >= 0 AND probability_of_profit <= 1))
);

-- Strategy legs table
CREATE TABLE IF NOT EXISTS strategy_legs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_id UUID NOT NULL,
    instrument_id VARCHAR(255) NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Leg details
    side VARCHAR(4) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    quantity INTEGER NOT NULL,
    strike_price DECIMAL(12, 6),
    expiration_date DATE,
    option_type VARCHAR(4) CHECK (option_type IN ('CALL', 'PUT')),
    
    -- Pricing
    entry_price DECIMAL(12, 6) NOT NULL,
    current_price DECIMAL(12, 6) NOT NULL,
    premium DECIMAL(12, 6) NOT NULL,
    
    -- Greeks contribution
    delta_contribution DECIMAL(10, 8) NOT NULL DEFAULT 0,
    gamma_contribution DECIMAL(10, 8) NOT NULL DEFAULT 0,
    theta_contribution DECIMAL(10, 8) NOT NULL DEFAULT 0,
    vega_contribution DECIMAL(10, 8) NOT NULL DEFAULT 0,
    rho_contribution DECIMAL(10, 8) NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_leg_strategy FOREIGN KEY (strategy_id) REFERENCES option_strategies(id) ON DELETE CASCADE,
    CONSTRAINT fk_leg_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT check_positive_quantity CHECK (quantity > 0),
    CONSTRAINT check_positive_prices CHECK (entry_price >= 0 AND current_price >= 0 AND premium >= 0)
);

-- Margin calculations table
CREATE TABLE IF NOT EXISTS margin_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    portfolio_id UUID,
    calculation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Margin requirements
    initial_margin DECIMAL(15, 4) NOT NULL,
    maintenance_margin DECIMAL(15, 4) NOT NULL,
    variation_margin DECIMAL(15, 4) NOT NULL DEFAULT 0,
    
    -- Portfolio-level metrics
    portfolio_margin DECIMAL(15, 4) NOT NULL,
    net_liquidation_value DECIMAL(20, 4) NOT NULL,
    excess_liquidity DECIMAL(20, 4) NOT NULL,
    
    -- Risk metrics
    portfolio_risk DECIMAL(15, 4),
    concentration_risk DECIMAL(15, 4),
    liquidity_risk DECIMAL(15, 4),
    
    -- SPAN margin (for exchanges that use it)
    span_margin DECIMAL(15, 4),
    
    -- Calculation metadata
    calculation_method VARCHAR(50) NOT NULL,
    risk_arrays JSONB, -- Exchange-specific risk arrays
    warnings TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_margin_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_margin_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id),
    CONSTRAINT check_positive_margins CHECK (initial_margin >= 0 AND maintenance_margin >= 0),
    CONSTRAINT check_margin_order CHECK (initial_margin >= maintenance_margin)
);

-- Position margins table
CREATE TABLE IF NOT EXISTS position_margins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    margin_calculation_id UUID NOT NULL,
    instrument_id VARCHAR(255) NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Position margin details
    initial_margin DECIMAL(15, 4) NOT NULL,
    maintenance_margin DECIMAL(15, 4) NOT NULL,
    risk_contribution DECIMAL(15, 4) NOT NULL DEFAULT 0,
    hedge_credit DECIMAL(15, 4),
    
    -- Position details
    quantity INTEGER NOT NULL,
    price DECIMAL(12, 6) NOT NULL,
    side VARCHAR(5) NOT NULL CHECK (side IN ('LONG', 'SHORT')),
    notional_value DECIMAL(20, 4) NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_pos_margin_calculation FOREIGN KEY (margin_calculation_id) REFERENCES margin_calculations(id) ON DELETE CASCADE,
    CONSTRAINT fk_pos_margin_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT check_positive_pos_margins CHECK (initial_margin >= 0 AND maintenance_margin >= 0),
    CONSTRAINT check_nonzero_quantity CHECK (quantity != 0),
    CONSTRAINT check_positive_price CHECK (price >= 0)
);

-- Exercise events table
CREATE TABLE IF NOT EXISTS exercise_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    instrument_id VARCHAR(255) NOT NULL,
    portfolio_id UUID NOT NULL,
    
    -- Exercise details
    exercise_date DATE NOT NULL,
    exercise_price DECIMAL(12, 6) NOT NULL,
    exercise_quantity INTEGER NOT NULL,
    exercise_type "ExerciseType" NOT NULL,
    
    -- Settlement
    settlement_date DATE NOT NULL,
    settlement_amount DECIMAL(20, 4) NOT NULL,
    
    -- Related transactions
    stock_transaction_id UUID,
    cash_transaction_id UUID,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SETTLED', 'FAILED')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_exercise_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_exercise_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id),
    CONSTRAINT check_positive_exercise_price CHECK (exercise_price > 0),
    CONSTRAINT check_nonzero_exercise_quantity CHECK (exercise_quantity != 0),
    CONSTRAINT check_exercise_before_settlement CHECK (exercise_date <= settlement_date)
);

-- Assignment events table
CREATE TABLE IF NOT EXISTS assignment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    instrument_id VARCHAR(255) NOT NULL,
    portfolio_id UUID NOT NULL,
    
    -- Assignment details
    assignment_date DATE NOT NULL,
    assignment_price DECIMAL(12, 6) NOT NULL,
    assignment_quantity INTEGER NOT NULL,
    assignment_type "ExerciseType" NOT NULL,
    
    -- Settlement
    settlement_date DATE NOT NULL,
    settlement_amount DECIMAL(20, 4) NOT NULL,
    
    -- Related transactions
    stock_transaction_id UUID,
    cash_transaction_id UUID,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SETTLED', 'FAILED')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_assignment_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_assignment_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id),
    CONSTRAINT check_positive_assignment_price CHECK (assignment_price > 0),
    CONSTRAINT check_nonzero_assignment_quantity CHECK (assignment_quantity != 0),
    CONSTRAINT check_assignment_before_settlement CHECK (assignment_date <= settlement_date)
);

-- Mark-to-market valuations table
CREATE TABLE IF NOT EXISTS mark_to_market_valuations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    instrument_id VARCHAR(255) NOT NULL,
    valuation_date DATE NOT NULL,
    
    -- Pricing
    market_price DECIMAL(12, 6) NOT NULL,
    theoretical_price DECIMAL(12, 6) NOT NULL,
    intrinsic_value DECIMAL(12, 6) NOT NULL DEFAULT 0,
    time_value DECIMAL(12, 6) NOT NULL DEFAULT 0,
    
    -- P&L
    unrealized_pnl DECIMAL(15, 4) NOT NULL DEFAULT 0,
    daily_pnl DECIMAL(15, 4) NOT NULL DEFAULT 0,
    inception_pnl DECIMAL(15, 4) NOT NULL DEFAULT 0,
    
    -- Greeks P&L attribution
    delta_pnl DECIMAL(15, 4) NOT NULL DEFAULT 0,
    gamma_pnl DECIMAL(15, 4) NOT NULL DEFAULT 0,
    theta_pnl DECIMAL(15, 4) NOT NULL DEFAULT 0,
    vega_pnl DECIMAL(15, 4) NOT NULL DEFAULT 0,
    rho_pnl DECIMAL(15, 4) NOT NULL DEFAULT 0,
    residual_pnl DECIMAL(15, 4) NOT NULL DEFAULT 0,
    
    -- Valuation parameters
    underlying_price DECIMAL(12, 6) NOT NULL,
    volatility DECIMAL(8, 6) NOT NULL,
    risk_free_rate DECIMAL(8, 6) NOT NULL,
    dividend_yield DECIMAL(8, 6),
    time_to_expiration DECIMAL(10, 8) NOT NULL,
    
    -- Valuation method
    pricing_model "VolatilityModel" NOT NULL,
    confidence DECIMAL(5, 4) NOT NULL DEFAULT 0.95,
    
    -- Metadata
    data_source VARCHAR(100),
    calculation_time INTEGER,
    warnings TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_mtm_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT check_positive_market_data_mtm CHECK (market_price >= 0 AND theoretical_price >= 0 AND underlying_price > 0 AND volatility > 0),
    CONSTRAINT check_time_to_expiration_mtm CHECK (time_to_expiration >= 0),
    CONSTRAINT check_confidence_range CHECK (confidence >= 0 AND confidence <= 1),
    CONSTRAINT unique_valuation_per_day UNIQUE (tenant_id, instrument_id, valuation_date)
);

-- Portfolio derivatives analytics table
CREATE TABLE IF NOT EXISTS derivatives_portfolio_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    portfolio_id UUID NOT NULL,
    analysis_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Portfolio composition
    total_positions INTEGER NOT NULL DEFAULT 0,
    total_notional DECIMAL(20, 4) NOT NULL DEFAULT 0,
    total_market_value DECIMAL(20, 4) NOT NULL DEFAULT 0,
    
    -- Asset allocation
    options_allocation DECIMAL(8, 4) NOT NULL DEFAULT 0,
    futures_allocation DECIMAL(8, 4) NOT NULL DEFAULT 0,
    other_derivatives_allocation DECIMAL(8, 4) NOT NULL DEFAULT 0,
    
    -- Greeks aggregation
    portfolio_delta DECIMAL(15, 8) NOT NULL DEFAULT 0,
    portfolio_gamma DECIMAL(15, 8) NOT NULL DEFAULT 0,
    portfolio_theta DECIMAL(15, 8) NOT NULL DEFAULT 0,
    portfolio_vega DECIMAL(15, 8) NOT NULL DEFAULT 0,
    portfolio_rho DECIMAL(15, 8) NOT NULL DEFAULT 0,
    
    -- Risk metrics
    portfolio_var DECIMAL(15, 4) NOT NULL DEFAULT 0,
    max_drawdown DECIMAL(8, 4),
    sharpe_ratio DECIMAL(8, 4),
    
    -- Strategy analysis
    active_strategies INTEGER NOT NULL DEFAULT 0,
    strategy_breakdown JSONB,
    
    -- Margin utilization
    total_margin_used DECIMAL(20, 4) NOT NULL DEFAULT 0,
    available_margin DECIMAL(20, 4) NOT NULL DEFAULT 0,
    margin_utilization DECIMAL(8, 4) NOT NULL DEFAULT 0, -- Percentage
    
    -- Expiration analysis
    near_term_expirations JSONB,
    
    -- Performance
    total_return DECIMAL(8, 4) NOT NULL DEFAULT 0,
    daily_pnl DECIMAL(15, 4) NOT NULL DEFAULT 0,
    monthly_pnl DECIMAL(15, 4) NOT NULL DEFAULT 0,
    year_to_date_pnl DECIMAL(15, 4) NOT NULL DEFAULT 0,
    
    -- Metadata
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_quality DECIMAL(5, 4) NOT NULL DEFAULT 1.0,
    warnings TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_deriv_analytics_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_deriv_analytics_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id),
    CONSTRAINT check_positive_positions CHECK (total_positions >= 0),
    CONSTRAINT check_allocation_percentages CHECK (options_allocation >= 0 AND futures_allocation >= 0 AND other_derivatives_allocation >= 0),
    CONSTRAINT check_margin_utilization CHECK (margin_utilization >= 0 AND margin_utilization <= 200), -- Allow over 100% for leverage
    CONSTRAINT check_data_quality CHECK (data_quality >= 0 AND data_quality <= 1),
    CONSTRAINT unique_portfolio_analysis_per_day UNIQUE (tenant_id, portfolio_id, analysis_date)
);

-- Create comprehensive indexes for performance

-- Derivative instruments indexes
CREATE INDEX idx_derivative_instruments_tenant ON derivative_instruments(tenant_id);
CREATE INDEX idx_derivative_instruments_symbol ON derivative_instruments(symbol);
CREATE INDEX idx_derivative_instruments_underlying ON derivative_instruments(underlying_symbol);
CREATE INDEX idx_derivative_instruments_type ON derivative_instruments(derivative_type);
CREATE INDEX idx_derivative_instruments_expiration ON derivative_instruments(expiration_date);
CREATE INDEX idx_derivative_instruments_status ON derivative_instruments(status);
CREATE INDEX idx_derivative_instruments_active ON derivative_instruments(is_active);
CREATE INDEX idx_derivative_instruments_price_date ON derivative_instruments(price_date);

-- Option contracts indexes
CREATE INDEX idx_option_contracts_tenant ON option_contracts(tenant_id);
CREATE INDEX idx_option_contracts_type ON option_contracts(option_type);
CREATE INDEX idx_option_contracts_style ON option_contracts(option_style);
CREATE INDEX idx_option_contracts_strike ON option_contracts(strike_price);
CREATE INDEX idx_option_contracts_volatility ON option_contracts(implied_volatility);
CREATE INDEX idx_option_contracts_greeks ON option_contracts(delta, gamma, theta, vega);

-- Future contracts indexes
CREATE INDEX idx_future_contracts_tenant ON future_contracts(tenant_id);
CREATE INDEX idx_future_contracts_type ON future_contracts(future_type);
CREATE INDEX idx_future_contracts_delivery ON future_contracts(delivery_month);
CREATE INDEX idx_future_contracts_settlement ON future_contracts(settlement_price);

-- Greeks calculations indexes
CREATE INDEX idx_greeks_tenant ON greeks_calculations(tenant_id);
CREATE INDEX idx_greeks_instrument ON greeks_calculations(instrument_id);
CREATE INDEX idx_greeks_date ON greeks_calculations(calculation_date);
CREATE INDEX idx_greeks_method ON greeks_calculations(calculation_method);
CREATE INDEX idx_greeks_lookup ON greeks_calculations(tenant_id, instrument_id, calculation_date);

-- Implied volatility indexes
CREATE INDEX idx_iv_analysis_tenant ON implied_volatility_analyses(tenant_id);
CREATE INDEX idx_iv_analysis_instrument ON implied_volatility_analyses(instrument_id);
CREATE INDEX idx_iv_analysis_date ON implied_volatility_analyses(analysis_date);
CREATE INDEX idx_iv_analysis_volatility ON implied_volatility_analyses(implied_volatility);

-- Option strategies indexes
CREATE INDEX idx_option_strategies_tenant ON option_strategies(tenant_id);
CREATE INDEX idx_option_strategies_portfolio ON option_strategies(portfolio_id);
CREATE INDEX idx_option_strategies_type ON option_strategies(strategy_type);
CREATE INDEX idx_option_strategies_active ON option_strategies(is_active);
CREATE INDEX idx_option_strategies_expiration ON option_strategies(expiration_date);

-- Strategy legs indexes
CREATE INDEX idx_strategy_legs_strategy ON strategy_legs(strategy_id);
CREATE INDEX idx_strategy_legs_instrument ON strategy_legs(instrument_id);
CREATE INDEX idx_strategy_legs_tenant ON strategy_legs(tenant_id);

-- Margin calculations indexes
CREATE INDEX idx_margin_calculations_tenant ON margin_calculations(tenant_id);
CREATE INDEX idx_margin_calculations_portfolio ON margin_calculations(portfolio_id);
CREATE INDEX idx_margin_calculations_date ON margin_calculations(calculation_date);
CREATE INDEX idx_margin_calculations_request ON margin_calculations(request_id);

-- Mark-to-market indexes
CREATE INDEX idx_mtm_tenant ON mark_to_market_valuations(tenant_id);
CREATE INDEX idx_mtm_instrument ON mark_to_market_valuations(instrument_id);
CREATE INDEX idx_mtm_date ON mark_to_market_valuations(valuation_date);
CREATE INDEX idx_mtm_lookup ON mark_to_market_valuations(tenant_id, instrument_id, valuation_date);

-- Portfolio analytics indexes
CREATE INDEX idx_deriv_analytics_tenant ON derivatives_portfolio_analytics(tenant_id);
CREATE INDEX idx_deriv_analytics_portfolio ON derivatives_portfolio_analytics(portfolio_id);
CREATE INDEX idx_deriv_analytics_date ON derivatives_portfolio_analytics(analysis_date);

-- Exercise and assignment indexes
CREATE INDEX idx_exercise_events_tenant ON exercise_events(tenant_id);
CREATE INDEX idx_exercise_events_portfolio ON exercise_events(portfolio_id);
CREATE INDEX idx_exercise_events_instrument ON exercise_events(instrument_id);
CREATE INDEX idx_exercise_events_date ON exercise_events(exercise_date);
CREATE INDEX idx_exercise_events_status ON exercise_events(status);

CREATE INDEX idx_assignment_events_tenant ON assignment_events(tenant_id);
CREATE INDEX idx_assignment_events_portfolio ON assignment_events(portfolio_id);
CREATE INDEX idx_assignment_events_instrument ON assignment_events(instrument_id);
CREATE INDEX idx_assignment_events_date ON assignment_events(assignment_date);
CREATE INDEX idx_assignment_events_status ON assignment_events(status);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_derivatives_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_derivative_instruments_updated_at BEFORE UPDATE ON derivative_instruments FOR EACH ROW EXECUTE FUNCTION update_derivatives_updated_at_column();
CREATE TRIGGER update_option_contracts_updated_at BEFORE UPDATE ON option_contracts FOR EACH ROW EXECUTE FUNCTION update_derivatives_updated_at_column();
CREATE TRIGGER update_future_contracts_updated_at BEFORE UPDATE ON future_contracts FOR EACH ROW EXECUTE FUNCTION update_derivatives_updated_at_column();
CREATE TRIGGER update_option_strategies_updated_at BEFORE UPDATE ON option_strategies FOR EACH ROW EXECUTE FUNCTION update_derivatives_updated_at_column();
CREATE TRIGGER update_strategy_legs_updated_at BEFORE UPDATE ON strategy_legs FOR EACH ROW EXECUTE FUNCTION update_derivatives_updated_at_column();
CREATE TRIGGER update_exercise_events_updated_at BEFORE UPDATE ON exercise_events FOR EACH ROW EXECUTE FUNCTION update_derivatives_updated_at_column();
CREATE TRIGGER update_assignment_events_updated_at BEFORE UPDATE ON assignment_events FOR EACH ROW EXECUTE FUNCTION update_derivatives_updated_at_column();

-- Insert sample derivative instruments for testing
INSERT INTO derivative_instruments (
    tenant_id, instrument_id, symbol, underlying_symbol, underlying_instrument_id,
    derivative_type, exchange, currency, country,
    contract_size, multiplier, tick_size, tick_value,
    expiration_date, status, is_active,
    current_price, underlying_price, price_date
) VALUES 
('tenant1', 'AAPL240315C00150000', 'AAPL 15MAR24 150 C', 'AAPL', 'AAPL_STOCK',
 'CALL_OPTION', 'CBOE', 'USD', 'US',
 100, 1, 0.01, 1,
 '2024-03-15', 'ACTIVE', true,
 5.25, 152.50, CURRENT_DATE),

('tenant1', 'AAPL240315P00145000', 'AAPL 15MAR24 145 P', 'AAPL', 'AAPL_STOCK',
 'PUT_OPTION', 'CBOE', 'USD', 'US',
 100, 1, 0.01, 1,
 '2024-03-15', 'ACTIVE', true,
 2.10, 152.50, CURRENT_DATE),

('tenant1', 'ES24M', 'E-mini S&P 500 Jun 2024', 'SPX', 'SPX_INDEX',
 'FUTURE', 'CME', 'USD', 'US',
 50, 50, 0.25, 12.50,
 '2024-06-21', 'ACTIVE', true,
 4285.75, 4285.75, CURRENT_DATE);

-- Insert sample option contracts
INSERT INTO option_contracts (
    derivative_instrument_id, tenant_id,
    option_type, option_style, strike_price, exercise_type,
    premium, intrinsic_value, time_value,
    delta, gamma, theta, vega, rho,
    implied_volatility, volatility_model
) VALUES 
((SELECT id FROM derivative_instruments WHERE instrument_id = 'AAPL240315C00150000'), 'tenant1',
 'CALL', 'AMERICAN', 150.00, 'PHYSICAL_DELIVERY',
 5.25, 2.50, 2.75,
 0.6234, 0.0187, -0.0425, 0.1845, 0.0672,
 0.2850, 'BLACK_SCHOLES'),

((SELECT id FROM derivative_instruments WHERE instrument_id = 'AAPL240315P00145000'), 'tenant1',
 'PUT', 'AMERICAN', 145.00, 'PHYSICAL_DELIVERY',
 2.10, 0.00, 2.10,
 -0.2156, 0.0201, -0.0312, 0.1654, -0.0445,
 0.2650, 'BLACK_SCHOLES');

-- Insert sample future contract
INSERT INTO future_contracts (
    derivative_instrument_id, tenant_id,
    future_type, delivery_month,
    settlement_price, daily_settlement, mark_to_market,
    initial_margin_rate, maintenance_margin_rate, variation_margin,
    delivery_method, first_notice_date, last_delivery_date
) VALUES 
((SELECT id FROM derivative_instruments WHERE instrument_id = 'ES24M'), 'tenant1',
 'EQUITY_INDEX', 'JUN2024',
 4285.75, 12.25, 612.50,
 0.05, 0.04, 0,
 'CASH_SETTLEMENT', '2024-06-14', '2024-06-21');

-- Create views for common queries

-- Active options view
CREATE VIEW active_options AS
SELECT 
    di.tenant_id,
    di.instrument_id,
    di.symbol,
    di.underlying_symbol,
    oc.option_type,
    oc.strike_price,
    di.expiration_date,
    oc.implied_volatility,
    oc.delta,
    oc.gamma,
    oc.theta,
    oc.vega,
    di.current_price,
    di.underlying_price,
    di.volume,
    di.open_interest
FROM derivative_instruments di
JOIN option_contracts oc ON di.id = oc.derivative_instrument_id
WHERE di.is_active = true 
  AND di.status = 'ACTIVE'
  AND di.expiration_date > CURRENT_DATE;

-- Portfolio derivatives summary view
CREATE VIEW portfolio_derivatives_summary AS
SELECT 
    dpa.tenant_id,
    dpa.portfolio_id,
    dpa.analysis_date,
    dpa.total_positions,
    dpa.total_market_value,
    dpa.portfolio_delta,
    dpa.portfolio_gamma,
    dpa.portfolio_theta,
    dpa.portfolio_vega,
    dpa.total_margin_used,
    dpa.margin_utilization,
    dpa.daily_pnl,
    dpa.total_return
FROM derivatives_portfolio_analytics dpa
WHERE dpa.analysis_date = (
    SELECT MAX(analysis_date) 
    FROM derivatives_portfolio_analytics 
    WHERE portfolio_id = dpa.portfolio_id 
      AND tenant_id = dpa.tenant_id
);

-- Add comments for documentation
COMMENT ON TABLE derivative_instruments IS 'Core table for all derivative instruments including options, futures, swaps, etc.';
COMMENT ON TABLE option_contracts IS 'Options-specific data including Greeks, volatility, and exercise features';
COMMENT ON TABLE future_contracts IS 'Futures-specific data including margin, settlement, and delivery specifications';
COMMENT ON TABLE greeks_calculations IS 'Historical Greeks calculations for risk management and P&L attribution';
COMMENT ON TABLE implied_volatility_analyses IS 'Implied volatility analysis including surface data and historical context';
COMMENT ON TABLE option_strategies IS 'Multi-leg option strategies with aggregated risk metrics';
COMMENT ON TABLE margin_calculations IS 'Margin requirement calculations using various methodologies including SPAN';
COMMENT ON TABLE mark_to_market_valuations IS 'Daily mark-to-market valuations with P&L attribution';
COMMENT ON TABLE derivatives_portfolio_analytics IS 'Portfolio-level derivatives analytics and risk metrics';

-- Migration completed successfully
SELECT 'Derivatives system migration completed successfully' as result;