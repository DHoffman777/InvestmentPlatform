-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('INDIVIDUAL', 'JOINT', 'ENTITY', 'TRUST', 'RETIREMENT', 'CORPORATE');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PROSPECT', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "InvestmentExperience" AS ENUM ('NOVICE', 'LIMITED', 'MODERATE', 'EXTENSIVE', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "LiquidityNeeds" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'IMMEDIATE');

-- CreateEnum
CREATE TYPE "DocumentDeliveryPreference" AS ENUM ('ELECTRONIC', 'PAPER', 'BOTH');

-- CreateEnum
CREATE TYPE "CommunicationMethod" AS ENUM ('EMAIL', 'PHONE', 'SMS', 'MAIL', 'SECURE_MESSAGE');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'DOCUMENTATION_PENDING', 'COMPLIANCE_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('INITIAL', 'PERIODIC', 'TRIGGER_EVENT', 'REGULATORY');

-- CreateEnum
CREATE TYPE "RiskCapacity" AS ENUM ('LOW', 'MODERATE', 'HIGH');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('INITIAL_CONSULTATION', 'PORTFOLIO_REVIEW', 'FINANCIAL_PLANNING', 'INVESTMENT_DISCUSSION', 'ADMINISTRATIVE', 'COMPLAINT_RESOLUTION', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('NOT_RESPONDED', 'ACCEPTED', 'DECLINED', 'TENTATIVE', 'ATTENDED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ActionItemPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ActionItemStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CommunicationDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "CommunicationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ConfidentialityLevel" AS ENUM ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "DocumentPermissionType" AS ENUM ('READ', 'WRITE', 'DELETE', 'ADMIN');

-- CreateTable
CREATE TABLE "client_profiles" (
    "id" UUID NOT NULL,
    "tenant_id" VARCHAR(255) NOT NULL,
    "client_number" VARCHAR(50) NOT NULL,
    "client_type" "ClientType" NOT NULL,
    "status" "ClientStatus" NOT NULL DEFAULT 'PROSPECT',
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "middle_name" VARCHAR(100),
    "entity_name" VARCHAR(255),
    "date_of_birth" DATE,
    "social_security_number" VARCHAR(20),
    "tax_id" VARCHAR(50),
    "email" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(20),
    "mobile_number" VARCHAR(20),
    "risk_tolerance" "RiskTolerance" NOT NULL,
    "investment_experience" "InvestmentExperience" NOT NULL,
    "liquidity_needs" "LiquidityNeeds" NOT NULL,
    "time_horizon" INTEGER NOT NULL,
    "net_worth" DECIMAL(15,2),
    "annual_income" DECIMAL(15,2),
    "liquid_net_worth" DECIMAL(15,2),
    "investment_experience_years" INTEGER,
    "document_delivery_preference" "DocumentDeliveryPreference" NOT NULL,
    "politically_exposed_person" BOOLEAN NOT NULL DEFAULT false,
    "employee_of_broker_dealer" BOOLEAN NOT NULL DEFAULT false,
    "director_of_public_company" BOOLEAN NOT NULL DEFAULT false,
    "primary_advisor" UUID,
    "assigned_team" TEXT[],
    "relationship_start_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_contact_date" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID NOT NULL,
    "updated_by" UUID NOT NULL,

    CONSTRAINT "client_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_addresses" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "street1" VARCHAR(255) NOT NULL,
    "street2" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(50) NOT NULL,
    "postal_code" VARCHAR(20) NOT NULL,
    "country" VARCHAR(3) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "client_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_investment_objectives" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "objective" VARCHAR(255) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "target_allocation" DECIMAL(5,2),
    "description" TEXT,

    CONSTRAINT "client_investment_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_investment_restrictions" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "restriction_type" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "applies_to" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "effective_date" TIMESTAMPTZ NOT NULL,
    "expiration_date" TIMESTAMPTZ,

    CONSTRAINT "client_investment_restrictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_communication_preferences" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "method" "CommunicationMethod" NOT NULL,
    "frequency" VARCHAR(50) NOT NULL,
    "time_preference" VARCHAR(50),
    "is_preferred" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "client_communication_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_workflows" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "tenant_id" VARCHAR(255) NOT NULL,
    "workflow_template" VARCHAR(100) NOT NULL,
    "status" "OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "total_steps" INTEGER NOT NULL,
    "started_date" TIMESTAMPTZ NOT NULL,
    "estimated_completion_date" TIMESTAMPTZ,
    "actual_completion_date" TIMESTAMPTZ,
    "assigned_advisor" UUID NOT NULL,
    "assigned_team" TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID NOT NULL,
    "updated_by" UUID NOT NULL,

    CONSTRAINT "onboarding_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_steps" (
    "id" UUID NOT NULL,
    "workflow_id" UUID NOT NULL,
    "step_number" INTEGER NOT NULL,
    "step_name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_date" TIMESTAMPTZ,
    "completed_by" UUID,
    "required_documents" TEXT[],
    "required_actions" TEXT[],
    "depends_on_steps" INTEGER[],
    "estimated_duration" INTEGER NOT NULL,
    "due_date" TIMESTAMPTZ,
    "notes" TEXT,

    CONSTRAINT "onboarding_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suitability_assessments" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "tenant_id" VARCHAR(255) NOT NULL,
    "assessment_date" TIMESTAMPTZ NOT NULL,
    "assessment_type" "AssessmentType" NOT NULL,
    "risk_tolerance" "RiskTolerance" NOT NULL,
    "risk_capacity" "RiskCapacity" NOT NULL,
    "investment_objectives" TEXT[],
    "time_horizon" INTEGER NOT NULL,
    "liquidity_needs" "LiquidityNeeds" NOT NULL,
    "net_worth" DECIMAL(15,2) NOT NULL,
    "annual_income" DECIMAL(15,2) NOT NULL,
    "investment_experience" "InvestmentExperience" NOT NULL,
    "overall_score" INTEGER NOT NULL,
    "risk_score" INTEGER NOT NULL,
    "objective_alignment" INTEGER NOT NULL,
    "recommended_allocation" JSONB NOT NULL DEFAULT '{}',
    "unsuitable_investments" TEXT[],
    "reviewed_by" UUID NOT NULL,
    "approved_by" UUID,
    "review_date" TIMESTAMPTZ NOT NULL,
    "approval_date" TIMESTAMPTZ,
    "next_review_date" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID NOT NULL,

    CONSTRAINT "suitability_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_meetings" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "tenant_id" VARCHAR(255) NOT NULL,
    "meeting_type" "MeetingType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "scheduled_date" TIMESTAMPTZ NOT NULL,
    "duration" INTEGER NOT NULL,
    "location" VARCHAR(255),
    "is_virtual" BOOLEAN NOT NULL DEFAULT false,
    "virtual_meeting_link" VARCHAR(500),
    "agenda" TEXT[],
    "meeting_notes" TEXT,
    "follow_up_required" BOOLEAN NOT NULL DEFAULT false,
    "next_meeting_date" TIMESTAMPTZ,
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID NOT NULL,
    "updated_by" UUID NOT NULL,

    CONSTRAINT "client_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_participants" (
    "id" UUID NOT NULL,
    "meeting_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "role" VARCHAR(100) NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "attendance_status" "AttendanceStatus" NOT NULL DEFAULT 'NOT_RESPONDED',

    CONSTRAINT "meeting_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_action_items" (
    "id" UUID NOT NULL,
    "meeting_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "assigned_to" UUID NOT NULL,
    "due_date" TIMESTAMPTZ,
    "priority" "ActionItemPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "ActionItemStatus" NOT NULL DEFAULT 'OPEN',
    "completed_date" TIMESTAMPTZ,
    "notes" TEXT,

    CONSTRAINT "meeting_action_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_history" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "tenant_id" VARCHAR(255) NOT NULL,
    "communication_type" "CommunicationMethod" NOT NULL,
    "subject" VARCHAR(500) NOT NULL,
    "content" TEXT NOT NULL,
    "direction" "CommunicationDirection" NOT NULL,
    "contacted_by" UUID NOT NULL,
    "contacted_at" TIMESTAMPTZ NOT NULL,
    "follow_up_required" BOOLEAN NOT NULL DEFAULT false,
    "follow_up_date" TIMESTAMPTZ,
    "category" VARCHAR(100) NOT NULL,
    "priority" "CommunicationPriority" NOT NULL DEFAULT 'MEDIUM',
    "related_meeting_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,

    CONSTRAINT "communication_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_attachments" (
    "id" UUID NOT NULL,
    "communication_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "storage_location" VARCHAR(500) NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "uploaded_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "communication_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_documents" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "tenant_id" VARCHAR(255) NOT NULL,
    "document_type" VARCHAR(100) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "original_file_name" VARCHAR(255) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "subcategory" VARCHAR(100),
    "tags" TEXT[],
    "confidentiality_level" "ConfidentialityLevel" NOT NULL DEFAULT 'INTERNAL',
    "storage_location" VARCHAR(500) NOT NULL,
    "checksum" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "document_date" DATE,
    "expiration_date" DATE,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "retention_period" INTEGER,
    "version" VARCHAR(20) NOT NULL,
    "previous_version_id" UUID,
    "is_latest_version" BOOLEAN NOT NULL DEFAULT true,
    "uploaded_by" UUID NOT NULL,
    "uploaded_at" TIMESTAMPTZ NOT NULL,
    "last_accessed_at" TIMESTAMPTZ,
    "last_accessed_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "client_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_document_permissions" (
    "id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "permission" "DocumentPermissionType" NOT NULL,
    "granted_by" UUID NOT NULL,
    "granted_at" TIMESTAMPTZ NOT NULL,
    "expires_at" TIMESTAMPTZ,

    CONSTRAINT "client_document_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_profiles_tenant_id_client_number_key" ON "client_profiles"("tenant_id", "client_number");

-- CreateIndex
CREATE UNIQUE INDEX "client_profiles_tenant_id_email_key" ON "client_profiles"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "client_profiles_tenant_id_status_idx" ON "client_profiles"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "client_profiles_tenant_id_client_type_idx" ON "client_profiles"("tenant_id", "client_type");

-- CreateIndex
CREATE INDEX "client_profiles_tenant_id_primary_advisor_idx" ON "client_profiles"("tenant_id", "primary_advisor");

-- CreateIndex
CREATE INDEX "client_profiles_last_contact_date_idx" ON "client_profiles"("last_contact_date");

-- CreateIndex
CREATE INDEX "client_addresses_client_id_idx" ON "client_addresses"("client_id");

-- CreateIndex
CREATE INDEX "client_investment_objectives_client_id_idx" ON "client_investment_objectives"("client_id");

-- CreateIndex
CREATE INDEX "client_investment_restrictions_client_id_is_active_idx" ON "client_investment_restrictions"("client_id", "is_active");

-- CreateIndex
CREATE INDEX "client_communication_preferences_client_id_idx" ON "client_communication_preferences"("client_id");

-- CreateIndex
CREATE INDEX "onboarding_workflows_tenant_id_status_idx" ON "onboarding_workflows"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "onboarding_workflows_client_id_idx" ON "onboarding_workflows"("client_id");

-- CreateIndex
CREATE INDEX "onboarding_workflows_assigned_advisor_idx" ON "onboarding_workflows"("assigned_advisor");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_steps_workflow_id_step_number_key" ON "onboarding_steps"("workflow_id", "step_number");

-- CreateIndex
CREATE INDEX "onboarding_steps_workflow_id_is_completed_idx" ON "onboarding_steps"("workflow_id", "is_completed");

-- CreateIndex
CREATE INDEX "suitability_assessments_tenant_id_client_id_idx" ON "suitability_assessments"("tenant_id", "client_id");

-- CreateIndex
CREATE INDEX "suitability_assessments_assessment_type_assessment_date_idx" ON "suitability_assessments"("assessment_type", "assessment_date");

-- CreateIndex
CREATE INDEX "suitability_assessments_next_review_date_idx" ON "suitability_assessments"("next_review_date");

-- CreateIndex
CREATE INDEX "client_meetings_tenant_id_client_id_idx" ON "client_meetings"("tenant_id", "client_id");

-- CreateIndex
CREATE INDEX "client_meetings_scheduled_date_idx" ON "client_meetings"("scheduled_date");

-- CreateIndex
CREATE INDEX "client_meetings_status_idx" ON "client_meetings"("status");

-- CreateIndex
CREATE INDEX "meeting_participants_meeting_id_idx" ON "meeting_participants"("meeting_id");

-- CreateIndex
CREATE INDEX "meeting_participants_user_id_idx" ON "meeting_participants"("user_id");

-- CreateIndex
CREATE INDEX "meeting_action_items_meeting_id_idx" ON "meeting_action_items"("meeting_id");

-- CreateIndex
CREATE INDEX "meeting_action_items_assigned_to_status_idx" ON "meeting_action_items"("assigned_to", "status");

-- CreateIndex
CREATE INDEX "meeting_action_items_due_date_idx" ON "meeting_action_items"("due_date");

-- CreateIndex
CREATE INDEX "communication_history_tenant_id_client_id_idx" ON "communication_history"("tenant_id", "client_id");

-- CreateIndex
CREATE INDEX "communication_history_communication_type_contacted_at_idx" ON "communication_history"("communication_type", "contacted_at");

-- CreateIndex
CREATE INDEX "communication_history_follow_up_required_follow_up_date_idx" ON "communication_history"("follow_up_required", "follow_up_date");

-- CreateIndex
CREATE INDEX "communication_history_category_idx" ON "communication_history"("category");

-- CreateIndex
CREATE INDEX "communication_attachments_communication_id_idx" ON "communication_attachments"("communication_id");

-- CreateIndex
CREATE INDEX "client_documents_tenant_id_client_id_idx" ON "client_documents"("tenant_id", "client_id");

-- CreateIndex
CREATE INDEX "client_documents_document_type_category_idx" ON "client_documents"("document_type", "category");

-- CreateIndex
CREATE INDEX "client_documents_is_archived_expiration_date_idx" ON "client_documents"("is_archived", "expiration_date");

-- CreateIndex
CREATE INDEX "client_documents_checksum_idx" ON "client_documents"("checksum");

-- CreateIndex
CREATE UNIQUE INDEX "client_document_permissions_document_id_user_id_key" ON "client_document_permissions"("document_id", "user_id");

-- CreateIndex
CREATE INDEX "client_document_permissions_user_id_idx" ON "client_document_permissions"("user_id");

-- AddForeignKey
ALTER TABLE "client_addresses" ADD CONSTRAINT "client_addresses_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_investment_objectives" ADD CONSTRAINT "client_investment_objectives_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_investment_restrictions" ADD CONSTRAINT "client_investment_restrictions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_communication_preferences" ADD CONSTRAINT "client_communication_preferences_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_workflows" ADD CONSTRAINT "onboarding_workflows_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_steps" ADD CONSTRAINT "onboarding_steps_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "onboarding_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suitability_assessments" ADD CONSTRAINT "suitability_assessments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_meetings" ADD CONSTRAINT "client_meetings_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "client_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_action_items" ADD CONSTRAINT "meeting_action_items_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "client_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_history" ADD CONSTRAINT "communication_history_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_attachments" ADD CONSTRAINT "communication_attachments_communication_id_fkey" FOREIGN KEY ("communication_id") REFERENCES "communication_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_document_permissions" ADD CONSTRAINT "client_document_permissions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "client_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;