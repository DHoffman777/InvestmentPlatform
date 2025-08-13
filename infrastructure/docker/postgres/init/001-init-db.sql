-- Investment Platform Database Initialization
-- Multi-tenant setup with schema isolation

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create shared tables (cross-tenant)
CREATE SCHEMA IF NOT EXISTS shared;

-- System users table (platform administrators)
CREATE TABLE shared.system_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenants table
CREATE TABLE shared.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    subscription_plan JSONB NOT NULL,
    billing_info JSONB NOT NULL,
    settings JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{}',
    features JSONB DEFAULT '{}',
    compliance_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenant schemas function
CREATE OR REPLACE FUNCTION create_tenant_schema(tenant_id TEXT)
RETURNS VOID AS $$
BEGIN
    -- Create tenant-specific schema
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS tenant_%s', tenant_id);
    
    -- Users table for the tenant
    EXECUTE format('
        CREATE TABLE tenant_%s.users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id UUID NOT NULL REFERENCES shared.tenants(id),
            email VARCHAR(255) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            phone VARCHAR(20),
            status VARCHAR(20) DEFAULT ''ACTIVE'',
            email_verified BOOLEAN DEFAULT FALSE,
            phone_verified BOOLEAN DEFAULT FALSE,
            last_login_at TIMESTAMP WITH TIME ZONE,
            password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            failed_login_attempts INTEGER DEFAULT 0,
            locked_until TIMESTAMP WITH TIME ZONE,
            mfa_enabled BOOLEAN DEFAULT FALSE,
            mfa_secret VARCHAR(255),
            preferences JSONB DEFAULT ''{"language": "en", "timezone": "UTC", "theme": "light"}'',
            profile JSONB DEFAULT ''{}'',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by UUID,
            updated_by UUID,
            version INTEGER DEFAULT 1,
            UNIQUE(tenant_id, email)
        )', tenant_id);
    
    -- User roles table
    EXECUTE format('
        CREATE TABLE tenant_%s.user_roles (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id UUID NOT NULL,
            user_id UUID NOT NULL REFERENCES tenant_%s.users(id),
            role VARCHAR(50) NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            expires_at TIMESTAMP WITH TIME ZONE,
            assigned_by UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by UUID,
            updated_by UUID,
            version INTEGER DEFAULT 1
        )', tenant_id, tenant_id);
    
    -- User permissions table
    EXECUTE format('
        CREATE TABLE tenant_%s.user_permissions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id UUID NOT NULL,
            user_id UUID NOT NULL REFERENCES tenant_%s.users(id),
            permission VARCHAR(100) NOT NULL,
            resource VARCHAR(255),
            is_active BOOLEAN DEFAULT TRUE,
            expires_at TIMESTAMP WITH TIME ZONE,
            assigned_by UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by UUID,
            updated_by UUID,
            version INTEGER DEFAULT 1
        )', tenant_id, tenant_id);
    
    -- User invitations table
    EXECUTE format('
        CREATE TABLE tenant_%s.user_invitations (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id UUID NOT NULL,
            email VARCHAR(255) NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            roles VARCHAR(50)[] NOT NULL,
            invited_by UUID NOT NULL,
            token VARCHAR(255) UNIQUE NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            accepted_at TIMESTAMP WITH TIME ZONE,
            status VARCHAR(20) DEFAULT ''PENDING'',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by UUID,
            updated_by UUID,
            version INTEGER DEFAULT 1
        )', tenant_id);
    
    -- Audit log table
    EXECUTE format('
        CREATE TABLE tenant_%s.audit_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id UUID NOT NULL,
            user_id UUID,
            action VARCHAR(100) NOT NULL,
            entity_type VARCHAR(100) NOT NULL,
            entity_id UUID,
            old_values JSONB,
            new_values JSONB,
            ip_address INET,
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )', tenant_id);
    
    -- Create indexes
    EXECUTE format('CREATE INDEX idx_tenant_%s_users_email ON tenant_%s.users(email)', tenant_id, tenant_id);
    EXECUTE format('CREATE INDEX idx_tenant_%s_users_tenant_id ON tenant_%s.users(tenant_id)', tenant_id, tenant_id);
    EXECUTE format('CREATE INDEX idx_tenant_%s_user_roles_user_id ON tenant_%s.user_roles(user_id)', tenant_id, tenant_id);
    EXECUTE format('CREATE INDEX idx_tenant_%s_user_permissions_user_id ON tenant_%s.user_permissions(user_id)', tenant_id, tenant_id);
    EXECUTE format('CREATE INDEX idx_tenant_%s_audit_logs_user_id ON tenant_%s.audit_logs(user_id)', tenant_id, tenant_id);
    EXECUTE format('CREATE INDEX idx_tenant_%s_audit_logs_created_at ON tenant_%s.audit_logs(created_at)', tenant_id, tenant_id);
    
END;
$$ LANGUAGE plpgsql;

-- Create indexes on shared tables
CREATE INDEX idx_tenants_domain ON shared.tenants(domain);
CREATE INDEX idx_tenants_status ON shared.tenants(status);
CREATE INDEX idx_system_users_email ON shared.system_users(email);

-- Insert default system admin user
INSERT INTO shared.system_users (email, password_hash, first_name, last_name) 
VALUES ('admin@platform.local', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System', 'Admin');

-- Create demo tenant
INSERT INTO shared.tenants (name, domain, subscription_plan, billing_info, settings, limits, features)
VALUES (
    'Demo Investment Firm',
    'demo',
    '{"planId": "professional", "planName": "Professional", "billingCycle": "MONTHLY", "price": 299, "currency": "USD", "status": "ACTIVE"}',
    '{"companyName": "Demo Investment Firm", "address": {"street1": "123 Main St", "city": "New York", "state": "NY", "postalCode": "10001", "country": "US"}}',
    '{"branding": {"primaryColor": "#1f2937", "secondaryColor": "#3b82f6"}, "security": {"passwordPolicy": {"minLength": 8, "requireUppercase": true}}}',
    '{"maxUsers": 100, "maxPortfolios": 1000, "storageLimit": 100}',
    '{"portfolioManagement": true, "trading": true, "reporting": true, "analytics": true, "compliance": true}'
);

-- Create schema for demo tenant
SELECT create_tenant_schema(REPLACE(id::text, '-', '')) FROM shared.tenants WHERE domain = 'demo';

-- Function to get tenant ID from domain
CREATE OR REPLACE FUNCTION get_tenant_id(tenant_domain TEXT)
RETURNS UUID AS $$
DECLARE
    tenant_id UUID;
BEGIN
    SELECT id INTO tenant_id FROM shared.tenants WHERE domain = tenant_domain AND status = 'ACTIVE';
    RETURN tenant_id;
END;
$$ LANGUAGE plpgsql;