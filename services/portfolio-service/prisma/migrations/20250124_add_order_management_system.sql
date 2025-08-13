-- Migration to add comprehensive Order Management System (OMS)
-- Includes orders, executions, allocations, smart routing, and risk management

-- Create enum types for order management
CREATE TYPE "OrderType" AS ENUM (
    'MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT', 'MARKET_ON_CLOSE', 'LIMIT_ON_CLOSE',
    'ICEBERG', 'HIDDEN', 'PEGGED', 'BRACKET', 'ONE_CANCELS_OTHER', 'ALGORITHMIC'
);

CREATE TYPE "OrderSide" AS ENUM (
    'BUY', 'SELL', 'BUY_TO_COVER', 'SELL_SHORT'
);

CREATE TYPE "TimeInForce" AS ENUM (
    'DAY', 'GOOD_TILL_CANCELED', 'IMMEDIATE_OR_CANCEL', 'FILL_OR_KILL',
    'GOOD_TILL_DATE', 'AT_THE_OPENING', 'AT_THE_CLOSE'
);

CREATE TYPE "OrderStatus" AS ENUM (
    'PENDING_NEW', 'NEW', 'PARTIALLY_FILLED', 'FILLED', 'CANCELED',
    'PENDING_CANCEL', 'REJECTED', 'EXPIRED', 'SUSPENDED', 'CALCULATED', 'STOPPED'
);

CREATE TYPE "OrderState" AS ENUM (
    'CREATED', 'VALIDATED', 'SUBMITTED', 'ACKNOWLEDGED', 'IN_MARKET',
    'WORKING', 'COMPLETED', 'FAILED'
);

CREATE TYPE "TradingSession" AS ENUM (
    'PRE_MARKET', 'REGULAR', 'POST_MARKET', 'EXTENDED_HOURS'
);

CREATE TYPE "PreTradeCheckStatus" AS ENUM (
    'PENDING', 'PASSED', 'FAILED', 'WARNING', 'BYPASSED'
);

CREATE TYPE "ExecutionVenueType" AS ENUM (
    'EXCHANGE', 'DARK_POOL', 'ECN', 'MARKET_MAKER', 'CROSSING_NETWORK', 'INTERNAL'
);

CREATE TYPE "AllocationStatus" AS ENUM (
    'PENDING', 'ALLOCATED', 'PARTIAL', 'FAILED'
);

CREATE TYPE "AllocationMethod" AS ENUM (
    'PROPORTIONAL', 'PRIORITY', 'MANUAL', 'FIFO', 'PRO_RATA'
);

CREATE TYPE "RoutingAlgorithm" AS ENUM (
    'SMART_ORDER_ROUTING', 'TWAP', 'VWAP', 'IMPLEMENTATION_SHORTFALL',
    'PARTICIPATION_RATE', 'ARRIVAL_PRICE'
);

CREATE TYPE "ExecutionStrategy" AS ENUM (
    'AGGRESSIVE', 'PASSIVE', 'NEUTRAL', 'OPPORTUNISTIC'
);

CREATE TYPE "ExecutionInstructionType" AS ENUM (
    'NOT_HELD', 'WORK', 'GO_ALONG', 'OVER_THE_DAY', 'HELD',
    'PARTICIPATE_DONT_INITIATE', 'STRICT_SCALE', 'TRY_TO_SCALE',
    'STAY_ON_BID_SIDE', 'STAY_ON_OFFER_SIDE', 'NO_CROSS', 'OK_TO_CROSS',
    'CALL_FIRST', 'PERCENT_OF_VOLUME'
);

CREATE TYPE "ComplianceFlagType" AS ENUM (
    'RESTRICTED_LIST', 'CONCENTRATION_LIMIT', 'SUITABILITY', 'WASH_SALE',
    'BEST_EXECUTION', 'REGULATORY_LIMIT'
);

CREATE TYPE "ComplianceSeverity" AS ENUM (
    'INFO', 'WARNING', 'ERROR', 'BLOCKING'
);

CREATE TYPE "RiskBreachType" AS ENUM (
    'POSITION_LIMIT', 'EXPOSURE_LIMIT', 'CONCENTRATION_LIMIT', 'VOLUME_LIMIT',
    'LIQUIDITY_RISK', 'MARKET_RISK'
);

CREATE TYPE "RiskSeverity" AS ENUM (
    'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    portfolio_id UUID NOT NULL,
    instrument_id VARCHAR(255) NOT NULL,
    
    -- Order identification
    client_order_id VARCHAR(100) NOT NULL UNIQUE,
    exchange_order_id VARCHAR(100),
    parent_order_id UUID REFERENCES orders(id),
    
    -- Order details
    order_type "OrderType" NOT NULL,
    order_side "OrderSide" NOT NULL,
    time_in_force "TimeInForce" NOT NULL,
    quantity DECIMAL(15, 6) NOT NULL CHECK (quantity > 0),
    filled_quantity DECIMAL(15, 6) NOT NULL DEFAULT 0 CHECK (filled_quantity >= 0),
    remaining_quantity DECIMAL(15, 6) NOT NULL CHECK (remaining_quantity >= 0),
    
    -- Pricing
    order_price DECIMAL(15, 6) CHECK (order_price IS NULL OR order_price > 0),
    stop_price DECIMAL(15, 6) CHECK (stop_price IS NULL OR stop_price > 0),
    limit_price DECIMAL(15, 6) CHECK (limit_price IS NULL OR limit_price > 0),
    average_fill_price DECIMAL(15, 6) CHECK (average_fill_price IS NULL OR average_fill_price > 0),
    
    -- Order status and lifecycle
    order_status "OrderStatus" NOT NULL DEFAULT 'PENDING_NEW',
    order_state "OrderState" NOT NULL DEFAULT 'CREATED',
    
    -- Execution details (stored as JSONB for flexibility)
    execution_instructions JSONB DEFAULT '[]',
    routing_instructions JSONB DEFAULT '{}',
    
    -- Timing
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiration_date DATE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    last_modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Trading session
    trading_session "TradingSession" NOT NULL DEFAULT 'REGULAR',
    
    -- Risk and compliance
    pre_trade_check_status "PreTradeCheckStatus" NOT NULL DEFAULT 'PENDING',
    risk_limits JSONB DEFAULT '{}',
    compliance_flags JSONB DEFAULT '[]',
    
    -- Allocation (for block orders)
    allocation_method "AllocationMethod",
    
    -- Audit and tracking
    created_by UUID NOT NULL,
    modified_by UUID,
    cancelled_by UUID,
    cancel_reason TEXT,
    
    -- Market data context
    market_data_snapshot JSONB DEFAULT '{}',
    
    -- Settlement
    settlement_date DATE,
    settlement_currency VARCHAR(5) NOT NULL DEFAULT 'USD',
    
    -- Metadata
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_quantities CHECK (
        filled_quantity <= quantity AND
        remaining_quantity = quantity - filled_quantity
    ),
    CONSTRAINT valid_order_dates CHECK (
        expiration_date IS NULL OR expiration_date >= order_date
    ),
    CONSTRAINT valid_price_for_order_type CHECK (
        (order_type = 'MARKET' AND order_price IS NULL) OR
        (order_type = 'LIMIT' AND order_price IS NOT NULL) OR
        (order_type = 'STOP' AND stop_price IS NOT NULL) OR
        (order_type = 'STOP_LIMIT' AND stop_price IS NOT NULL AND limit_price IS NOT NULL) OR
        (order_type NOT IN ('MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'))
    )
);

-- Create order executions table
CREATE TABLE IF NOT EXISTS order_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    order_id UUID NOT NULL REFERENCES orders(id),
    
    -- Execution details
    execution_id VARCHAR(100) NOT NULL UNIQUE,
    execution_price DECIMAL(15, 6) NOT NULL CHECK (execution_price > 0),
    execution_quantity DECIMAL(15, 6) NOT NULL CHECK (execution_quantity > 0),
    execution_time TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Venue information
    execution_venue VARCHAR(100) NOT NULL,
    execution_venue_type "ExecutionVenueType" NOT NULL,
    
    -- Trade details
    trade_id VARCHAR(100) NOT NULL,
    contra_party VARCHAR(200),
    
    -- Fees and costs
    commission DECIMAL(15, 4) DEFAULT 0,
    regulatory_fees DECIMAL(15, 4) DEFAULT 0,
    exchange_fees DECIMAL(15, 4) DEFAULT 0,
    other_fees DECIMAL(15, 4) DEFAULT 0,
    total_costs DECIMAL(15, 4) DEFAULT 0,
    
    -- Settlement
    settlement_date DATE NOT NULL,
    settlement_status "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    
    -- Audit
    reported_by UUID NOT NULL,
    reported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_execution_costs CHECK (
        total_costs = COALESCE(commission, 0) + COALESCE(regulatory_fees, 0) + 
                     COALESCE(exchange_fees, 0) + COALESCE(other_fees, 0)
    )
);

-- Create order allocations table
CREATE TABLE IF NOT EXISTS order_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id),
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Allocation target
    portfolio_id UUID NOT NULL,
    account_id VARCHAR(100),
    
    -- Allocation amounts
    requested_quantity DECIMAL(15, 6) NOT NULL CHECK (requested_quantity > 0),
    allocated_quantity DECIMAL(15, 6) NOT NULL DEFAULT 0 CHECK (allocated_quantity >= 0),
    allocated_value DECIMAL(20, 4) NOT NULL DEFAULT 0,
    
    -- Allocation method details
    allocation_percentage DECIMAL(5, 2) CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
    allocation_priority INTEGER CHECK (allocation_priority > 0),
    
    -- Status
    allocation_status "AllocationStatus" NOT NULL DEFAULT 'PENDING',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_allocation_amounts CHECK (allocated_quantity <= requested_quantity)
);

-- Create smart order routing table
CREATE TABLE IF NOT EXISTS smart_order_routing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    order_id UUID NOT NULL REFERENCES orders(id),
    
    -- Routing strategy
    routing_algorithm "RoutingAlgorithm" NOT NULL,
    routing_parameters JSONB NOT NULL DEFAULT '{}',
    
    -- Venue preferences
    preferred_venues TEXT[] DEFAULT '{}',
    excluded_venues TEXT[] DEFAULT '{}',
    
    -- Execution strategy
    execution_strategy "ExecutionStrategy" NOT NULL DEFAULT 'NEUTRAL',
    participation_rate DECIMAL(5, 4) CHECK (participation_rate > 0 AND participation_rate <= 1),
    max_participation_rate DECIMAL(5, 4) CHECK (max_participation_rate > 0 AND max_participation_rate <= 1),
    
    -- Dark pool preferences
    use_dark_pools BOOLEAN NOT NULL DEFAULT FALSE,
    dark_pool_min_size INTEGER CHECK (dark_pool_min_size > 0),
    
    -- Timing constraints
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    
    -- Performance metrics
    implementation_shortfall DECIMAL(10, 6),
    volume_weighted_average_price DECIMAL(15, 6),
    time_weighted_average_price DECIMAL(15, 6),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_participation_rates CHECK (
        participation_rate IS NULL OR max_participation_rate IS NULL OR 
        participation_rate <= max_participation_rate
    ),
    CONSTRAINT valid_routing_times CHECK (
        start_time IS NULL OR end_time IS NULL OR start_time < end_time
    )
);

-- Create order risk table
CREATE TABLE IF NOT EXISTS order_risk (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    order_id UUID NOT NULL REFERENCES orders(id),
    
    -- Risk assessments
    pre_trade_risk_score INTEGER NOT NULL CHECK (pre_trade_risk_score >= 0 AND pre_trade_risk_score <= 100),
    concentration_risk INTEGER NOT NULL DEFAULT 0 CHECK (concentration_risk >= 0 AND concentration_risk <= 100),
    liquidity_risk INTEGER NOT NULL DEFAULT 0 CHECK (liquidity_risk >= 0 AND liquidity_risk <= 100),
    market_risk INTEGER NOT NULL DEFAULT 0 CHECK (market_risk >= 0 AND market_risk <= 100),
    
    -- Risk limits
    position_limit DECIMAL(15, 6) CHECK (position_limit > 0),
    exposure_limit DECIMAL(20, 4) CHECK (exposure_limit > 0),
    volume_limit DECIMAL(15, 6) CHECK (volume_limit > 0),
    
    -- Breach tracking (stored as JSONB array)
    risk_breaches JSONB DEFAULT '[]',
    
    -- Risk monitoring
    last_risk_check TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    next_risk_check TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, order_id)
);

-- Create order workflow states table for audit trail
CREATE TABLE IF NOT EXISTS order_workflow_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    order_id UUID NOT NULL REFERENCES orders(id),
    
    -- State transition
    from_status "OrderStatus",
    to_status "OrderStatus" NOT NULL,
    from_state "OrderState",
    to_state "OrderState" NOT NULL,
    
    -- Transition details
    transition_reason VARCHAR(500),
    transition_metadata JSONB DEFAULT '{}',
    
    -- Audit
    transitioned_by UUID NOT NULL,
    transitioned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_portfolio ON orders(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_orders_instrument ON orders(instrument_id);
CREATE INDEX IF NOT EXISTS idx_orders_client_order_id ON orders(client_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_state ON orders(order_state);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_side ON orders(order_side);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by);
CREATE INDEX IF NOT EXISTS idx_orders_trading_session ON orders(trading_session);
CREATE INDEX IF NOT EXISTS idx_orders_tags ON orders USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_order_executions_order ON order_executions(order_id);
CREATE INDEX IF NOT EXISTS idx_order_executions_tenant ON order_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_executions_execution_id ON order_executions(execution_id);
CREATE INDEX IF NOT EXISTS idx_order_executions_trade_id ON order_executions(trade_id);
CREATE INDEX IF NOT EXISTS idx_order_executions_time ON order_executions(execution_time);
CREATE INDEX IF NOT EXISTS idx_order_executions_venue ON order_executions(execution_venue);
CREATE INDEX IF NOT EXISTS idx_order_executions_venue_type ON order_executions(execution_venue_type);

CREATE INDEX IF NOT EXISTS idx_order_allocations_order ON order_allocations(order_id);
CREATE INDEX IF NOT EXISTS idx_order_allocations_tenant ON order_allocations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_allocations_portfolio ON order_allocations(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_order_allocations_status ON order_allocations(allocation_status);

CREATE INDEX IF NOT EXISTS idx_smart_routing_order ON smart_order_routing(order_id);
CREATE INDEX IF NOT EXISTS idx_smart_routing_tenant ON smart_order_routing(tenant_id);
CREATE INDEX IF NOT EXISTS idx_smart_routing_algorithm ON smart_order_routing(routing_algorithm);

CREATE INDEX IF NOT EXISTS idx_order_risk_order ON order_risk(order_id);
CREATE INDEX IF NOT EXISTS idx_order_risk_tenant ON order_risk(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_risk_score ON order_risk(pre_trade_risk_score);

CREATE INDEX IF NOT EXISTS idx_workflow_states_order ON order_workflow_states(order_id);
CREATE INDEX IF NOT EXISTS idx_workflow_states_tenant ON order_workflow_states(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_states_transitioned_at ON order_workflow_states(transitioned_at);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_orders_tenant_status_date ON orders(tenant_id, order_status, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_portfolio_status ON orders(portfolio_id, order_status, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_instrument_date ON orders(instrument_id, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_executions_order_time ON order_executions(order_id, execution_time DESC);

-- Insert sample orders for testing
INSERT INTO orders (
    tenant_id, portfolio_id, instrument_id, client_order_id,
    order_type, order_side, time_in_force, quantity, remaining_quantity,
    order_price, order_status, order_state, order_date,
    trading_session, pre_trade_check_status, settlement_currency,
    created_by
) VALUES 
    ('system', '11111111-1111-1111-1111-111111111111', 'AAPL-US', 'ORD-TEST-001',
     'LIMIT', 'BUY', 'DAY', 100, 100, 150.00, 'NEW', 'VALIDATED', CURRENT_DATE,
     'REGULAR', 'PASSED', 'USD', '00000000-0000-0000-0000-000000000000'),
    
    ('system', '11111111-1111-1111-1111-111111111111', 'MSFT-US', 'ORD-TEST-002',
     'MARKET', 'SELL', 'DAY', 50, 0, NULL, 'FILLED', 'COMPLETED', CURRENT_DATE,
     'REGULAR', 'PASSED', 'USD', '00000000-0000-0000-0000-000000000000'),
     
    ('system', '22222222-2222-2222-2222-222222222222', 'SPY-US', 'ORD-TEST-003',
     'STOP_LIMIT', 'BUY', 'GOOD_TILL_CANCELED', 200, 150, 420.00, 'PARTIALLY_FILLED', 'WORKING', CURRENT_DATE,
     'REGULAR', 'PASSED', 'USD', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (client_order_id) DO NOTHING;

-- Update filled_quantity for partially filled order
UPDATE orders 
SET filled_quantity = 50, remaining_quantity = 150, average_fill_price = 418.50
WHERE client_order_id = 'ORD-TEST-003';

-- Insert sample executions
INSERT INTO order_executions (
    tenant_id, order_id, execution_id, execution_price, execution_quantity,
    execution_time, execution_venue, execution_venue_type, trade_id,
    settlement_date, reported_by
) 
SELECT 
    'system', o.id, 'EXEC-TEST-001', 320.50, 50,
    NOW() - INTERVAL '1 hour', 'NASDAQ', 'EXCHANGE', 'TRD-TEST-001',
    CURRENT_DATE + INTERVAL '2 days', '00000000-0000-0000-0000-000000000000'
FROM orders o 
WHERE o.client_order_id = 'ORD-TEST-002'
ON CONFLICT (execution_id) DO NOTHING;

INSERT INTO order_executions (
    tenant_id, order_id, execution_id, execution_price, execution_quantity,
    execution_time, execution_venue, execution_venue_type, trade_id,
    settlement_date, reported_by
) 
SELECT 
    'system', o.id, 'EXEC-TEST-002', 418.50, 50,
    NOW() - INTERVAL '30 minutes', 'NYSE', 'EXCHANGE', 'TRD-TEST-002',
    CURRENT_DATE + INTERVAL '2 days', '00000000-0000-0000-0000-000000000000'
FROM orders o 
WHERE o.client_order_id = 'ORD-TEST-003'
ON CONFLICT (execution_id) DO NOTHING;

-- Create triggers for updated_at fields
CREATE OR REPLACE FUNCTION update_order_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW EXECUTE FUNCTION update_order_updated_at_column();

CREATE TRIGGER update_order_allocations_updated_at 
    BEFORE UPDATE ON order_allocations 
    FOR EACH ROW EXECUTE FUNCTION update_order_updated_at_column();

CREATE TRIGGER update_smart_routing_updated_at 
    BEFORE UPDATE ON smart_order_routing 
    FOR EACH ROW EXECUTE FUNCTION update_order_updated_at_column();

CREATE TRIGGER update_order_risk_updated_at 
    BEFORE UPDATE ON order_risk 
    FOR EACH ROW EXECUTE FUNCTION update_order_updated_at_column();

-- Create trigger to automatically create workflow state records
CREATE OR REPLACE FUNCTION create_order_workflow_state()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create workflow state if status or state actually changed
    IF (OLD.order_status IS DISTINCT FROM NEW.order_status) OR 
       (OLD.order_state IS DISTINCT FROM NEW.order_state) THEN
        
        INSERT INTO order_workflow_states (
            tenant_id, order_id, from_status, to_status, from_state, to_state,
            transition_reason, transitioned_by
        ) VALUES (
            NEW.tenant_id, NEW.id, OLD.order_status, NEW.order_status, 
            OLD.order_state, NEW.order_state,
            'Automatic state transition', NEW.modified_by
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_workflow_state_on_order_update
    AFTER UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION create_order_workflow_state();

-- Create function to automatically update order quantities on execution
CREATE OR REPLACE FUNCTION update_order_on_execution()
RETURNS TRIGGER AS $$
DECLARE
    order_record orders%ROWTYPE;
    total_filled DECIMAL(15,6);
    new_remaining DECIMAL(15,6);
    new_status "OrderStatus";
    new_state "OrderState";
    avg_price DECIMAL(15,6);
BEGIN
    -- Get the order
    SELECT * INTO order_record FROM orders WHERE id = NEW.order_id;
    
    -- Calculate new filled quantity
    SELECT COALESCE(SUM(execution_quantity), 0) INTO total_filled
    FROM order_executions 
    WHERE order_id = NEW.order_id;
    
    new_remaining := order_record.quantity - total_filled;
    
    -- Determine new status and state
    IF new_remaining = 0 THEN
        new_status := 'FILLED';
        new_state := 'COMPLETED';
    ELSE
        new_status := 'PARTIALLY_FILLED';
        new_state := 'WORKING';
    END IF;
    
    -- Calculate average fill price
    SELECT 
        SUM(execution_price * execution_quantity) / SUM(execution_quantity)
    INTO avg_price
    FROM order_executions 
    WHERE order_id = NEW.order_id;
    
    -- Update the order
    UPDATE orders SET
        filled_quantity = total_filled,
        remaining_quantity = new_remaining,
        average_fill_price = avg_price,
        order_status = new_status,
        order_state = new_state,
        last_modified_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.order_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_order_on_execution_insert
    AFTER INSERT ON order_executions
    FOR EACH ROW EXECUTE FUNCTION update_order_on_execution();