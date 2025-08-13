export interface CommunicationRecord {
  id: string;
  client_id: string;
  advisor_id: string;
  type: CommunicationType;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  subject?: string;
  content: string;
  timestamp: Date;
  duration?: number; // in seconds for calls/meetings
  status: CommunicationStatus;
  category: CommunicationCategory;
  tags: string[];
  attachments: CommunicationAttachment[];
  participants: CommunicationParticipant[];
  metadata: CommunicationMetadata;
  compliance: ComplianceInfo;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by?: string;
}

export enum CommunicationType {
  EMAIL = 'email',
  PHONE_CALL = 'phone_call',
  VIDEO_CALL = 'video_call',
  IN_PERSON_MEETING = 'in_person_meeting',
  SMS = 'sms',
  CHAT = 'chat',
  LETTER = 'letter',
  FAX = 'fax',
  SECURE_MESSAGE = 'secure_message',
  DOCUMENT_SHARING = 'document_sharing',
  VOICE_MESSAGE = 'voice_message',
  CONFERENCE_CALL = 'conference_call',
  WEBINAR = 'webinar',
  SYSTEM_NOTIFICATION = 'system_notification'
}

export enum CommunicationChannel {
  DIRECT = 'direct',
  PLATFORM = 'platform',
  THIRD_PARTY = 'third_party',
  MOBILE_APP = 'mobile_app',
  WEB_PORTAL = 'web_portal',
  PHONE_SYSTEM = 'phone_system',
  EMAIL_SYSTEM = 'email_system',
  VIDEO_PLATFORM = 'video_platform',
  MESSAGING_SYSTEM = 'messaging_system',
  DOCUMENT_PORTAL = 'document_portal',
  CRM_SYSTEM = 'crm_system'
}

export enum CommunicationDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
  INTERNAL = 'internal',
  BIDIRECTIONAL = 'bidirectional'
}

export enum CommunicationStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  REPLIED = 'replied',
  FORWARDED = 'forwarded',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
  FAILED = 'failed',
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export enum CommunicationCategory {
  GENERAL_INQUIRY = 'general_inquiry',
  ACCOUNT_MANAGEMENT = 'account_management',
  PORTFOLIO_REVIEW = 'portfolio_review',
  INVESTMENT_ADVICE = 'investment_advice',
  TRADE_EXECUTION = 'trade_execution',
  PERFORMANCE_REPORT = 'performance_report',
  COMPLIANCE_MATTER = 'compliance_matter',
  ONBOARDING = 'onboarding',
  SUPPORT_REQUEST = 'support_request',
  COMPLAINT = 'complaint',
  MARKETING = 'marketing',
  BILLING_INQUIRY = 'billing_inquiry',
  DOCUMENT_REQUEST = 'document_request',
  REGULATORY_NOTICE = 'regulatory_notice',
  EMERGENCY = 'emergency',
  RESEARCH_SHARING = 'research_sharing',
  CLIENT_EDUCATION = 'client_education',
  REMINDER = 'reminder',
  FOLLOW_UP = 'follow_up',
  SOCIAL = 'social',
  OTHER = 'other'
}

export interface CommunicationParticipant {
  id: string;
  type: ParticipantType;
  role: ParticipantRole;
  name: string;
  email?: string;
  phone?: string;
  organization?: string;
  department?: string;
  is_primary: boolean;
  joined_at?: Date;
  left_at?: Date;
}

export enum ParticipantType {
  CLIENT = 'client',
  ADVISOR = 'advisor',
  SUPPORT_AGENT = 'support_agent',
  COMPLIANCE_OFFICER = 'compliance_officer',
  MANAGER = 'manager',
  EXTERNAL_PARTY = 'external_party',
  SYSTEM = 'system',
  THIRD_PARTY_VENDOR = 'third_party_vendor'
}

export enum ParticipantRole {
  SENDER = 'sender',
  RECIPIENT = 'recipient',
  CC = 'cc',
  BCC = 'bcc',
  ORGANIZER = 'organizer',
  ATTENDEE = 'attendee',
  MODERATOR = 'moderator',
  OBSERVER = 'observer',
  APPROVER = 'approver',
  REVIEWER = 'reviewer'
}

export interface CommunicationAttachment {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  checksum: string;
  is_encrypted: boolean;
  uploaded_at: Date;
  uploaded_by: string;
  access_level: AttachmentAccessLevel;
  retention_policy?: string;
  virus_scan_status: VirusScanStatus;
  download_count: number;
  last_downloaded_at?: Date;
}

export enum AttachmentAccessLevel {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted',
  TOP_SECRET = 'top_secret'
}

export enum VirusScanStatus {
  PENDING = 'pending',
  CLEAN = 'clean',
  INFECTED = 'infected',
  QUARANTINED = 'quarantined',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

export interface CommunicationMetadata {
  client_ip?: string;
  user_agent?: string;
  device_type?: string;
  location?: GeographicLocation;
  call_id?: string;
  meeting_id?: string;
  thread_id?: string;
  reference_id?: string;
  response_time?: number;
  delivery_attempts?: number;
  encryption_type?: string;
  signature?: string;
  priority: Priority;
  urgency: Urgency;
  sensitivity: SensitivityLevel;
  language: string;
  timezone: string;
  business_context?: BusinessContext;
}

export interface GeographicLocation {
  country: string;
  state?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  ip_address?: string;
  timezone?: string;
}

export enum Priority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export enum Urgency {
  CAN_WAIT = 'can_wait',
  NORMAL_BUSINESS = 'normal_business',
  SAME_DAY = 'same_day',
  IMMEDIATE = 'immediate',
  EMERGENCY = 'emergency'
}

export enum SensitivityLevel {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  HIGHLY_CONFIDENTIAL = 'highly_confidential',
  TOP_SECRET = 'top_secret'
}

export interface BusinessContext {
  account_id?: string;
  portfolio_id?: string;
  trade_id?: string;
  order_id?: string;
  document_id?: string;
  meeting_id?: string;
  case_id?: string;
  ticket_id?: string;
  campaign_id?: string;
  project_id?: string;
  regulation_reference?: string;
  client_segment?: string;
  product_type?: string;
  service_type?: string;
}

export interface ComplianceInfo {
  retention_required: boolean;
  retention_period_years: number;
  legal_hold: boolean;
  regulatory_requirements: string[];
  privacy_classification: PrivacyClassification;
  data_residency_requirements?: string[];
  access_restrictions: AccessRestriction[];
  audit_trail_required: boolean;
  encryption_required: boolean;
  review_status: ComplianceReviewStatus;
  reviewed_by?: string;
  reviewed_at?: Date;
  compliance_notes?: string;
  regulatory_filing_required?: boolean;
  archival_date?: Date;
  destruction_date?: Date;
}

export enum PrivacyClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  PERSONAL_DATA = 'personal_data',
  SENSITIVE_PERSONAL_DATA = 'sensitive_personal_data',
  FINANCIAL_DATA = 'financial_data',
  MEDICAL_DATA = 'medical_data',
  PROPRIETARY = 'proprietary'
}

export interface AccessRestriction {
  type: AccessRestrictionType;
  value: string;
  reason: string;
  applies_from: Date;
  expires_at?: Date;
  created_by: string;
}

export enum AccessRestrictionType {
  ROLE_BASED = 'role_based',
  DEPARTMENT_BASED = 'department_based',
  INDIVIDUAL_BASED = 'individual_based',
  TIME_BASED = 'time_based',
  LOCATION_BASED = 'location_based',
  IP_BASED = 'ip_based',
  DEVICE_BASED = 'device_based'
}

export enum ComplianceReviewStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REQUIRES_REDACTION = 'requires_redaction',
  REQUIRES_LEGAL_REVIEW = 'requires_legal_review',
  ESCALATED = 'escalated',
  ARCHIVED = 'archived'
}

export interface CommunicationThread {
  id: string;
  subject: string;
  participants: CommunicationParticipant[];
  messages: CommunicationRecord[];
  created_at: Date;
  updated_at: Date;
  status: ThreadStatus;
  category: CommunicationCategory;
  tags: string[];
  priority: Priority;
  client_id: string;
  advisor_id: string;
  business_context?: BusinessContext;
  compliance_info: ComplianceInfo;
}

export enum ThreadStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
  ESCALATED = 'escalated',
  ON_HOLD = 'on_hold',
  AWAITING_RESPONSE = 'awaiting_response',
  RESOLVED = 'resolved'
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  description: string;
  type: CommunicationType;
  category: CommunicationCategory;
  subject_template?: string;
  content_template: string;
  variables: TemplateVariable[];
  is_active: boolean;
  compliance_approved: boolean;
  language: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  approved_by?: string;
  approved_at?: Date;
  usage_count: number;
  last_used_at?: Date;
}

export interface TemplateVariable {
  name: string;
  type: VariableType;
  description: string;
  required: boolean;
  default_value?: string;
  validation_pattern?: string;
  options?: string[];
}

export enum VariableType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  CURRENCY = 'currency',
  PERCENTAGE = 'percentage'
}

export interface CommunicationRule {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  applies_to: RuleScope;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  execution_count: number;
  last_executed_at?: Date;
}

export interface RuleCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
  logical_operator?: LogicalOperator;
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',
  IN = 'in',
  NOT_IN = 'not_in',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
  REGEX_MATCH = 'regex_match'
}

export enum LogicalOperator {
  AND = 'and',
  OR = 'or',
  NOT = 'not'
}

export interface RuleAction {
  type: ActionType;
  parameters: Record<string, any>;
  order: number;
}

export enum ActionType {
  AUTO_CATEGORIZE = 'auto_categorize',
  AUTO_TAG = 'auto_tag',
  ASSIGN_PRIORITY = 'assign_priority',
  NOTIFY_USER = 'notify_user',
  CREATE_TASK = 'create_task',
  ESCALATE = 'escalate',
  AUTO_REPLY = 'auto_reply',
  FORWARD = 'forward',
  ARCHIVE = 'archive',
  FLAG_COMPLIANCE = 'flag_compliance',
  APPLY_TEMPLATE = 'apply_template',
  SET_REMINDER = 'set_reminder',
  UPDATE_STATUS = 'update_status',
  LOG_EVENT = 'log_event',
  TRIGGER_WORKFLOW = 'trigger_workflow'
}

export enum RuleScope {
  ALL_COMMUNICATIONS = 'all_communications',
  SPECIFIC_CLIENT = 'specific_client',
  SPECIFIC_ADVISOR = 'specific_advisor',
  SPECIFIC_CHANNEL = 'specific_channel',
  SPECIFIC_TYPE = 'specific_type',
  SPECIFIC_CATEGORY = 'specific_category',
  CLIENT_SEGMENT = 'client_segment',
  BUSINESS_UNIT = 'business_unit'
}

export interface CommunicationSearchQuery {
  query?: string;
  client_id?: string;
  advisor_id?: string;
  type?: CommunicationType[];
  channel?: CommunicationChannel[];
  category?: CommunicationCategory[];
  status?: CommunicationStatus[];
  priority?: Priority[];
  date_from?: Date;
  date_to?: Date;
  tags?: string[];
  participants?: string[];
  has_attachments?: boolean;
  content_keywords?: string[];
  business_context?: Partial<BusinessContext>;
  compliance_status?: ComplianceReviewStatus[];
  sort_by?: CommunicationSortField;
  sort_order?: SortOrder;
  page?: number;
  page_size?: number;
  include_archived?: boolean;
  include_deleted?: boolean;
}

export enum CommunicationSortField {
  TIMESTAMP = 'timestamp',
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
  PRIORITY = 'priority',
  STATUS = 'status',
  TYPE = 'type',
  CATEGORY = 'category',
  CLIENT_NAME = 'client_name',
  ADVISOR_NAME = 'advisor_name',
  SUBJECT = 'subject',
  DURATION = 'duration',
  ATTACHMENT_COUNT = 'attachment_count'
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

export interface CommunicationSearchResult {
  records: CommunicationRecord[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  facets: SearchFacet[];
  search_time_ms: number;
  suggestions?: string[];
}

export interface SearchFacet {
  field: string;
  values: FacetValue[];
}

export interface FacetValue {
  value: string;
  count: number;
  selected: boolean;
}

export interface CommunicationAnalytics {
  period: AnalyticsPeriod;
  total_communications: number;
  communications_by_type: Record<CommunicationType, number>;
  communications_by_channel: Record<CommunicationChannel, number>;
  communications_by_category: Record<CommunicationCategory, number>;
  communications_by_status: Record<CommunicationStatus, number>;
  average_response_time: number;
  response_time_by_priority: Record<Priority, number>;
  busiest_hours: HourlyStats[];
  busiest_days: DailyStats[];
  top_clients: ClientCommunicationStats[];
  top_advisors: AdvisorCommunicationStats[];
  compliance_metrics: ComplianceMetrics;
  satisfaction_metrics?: SatisfactionMetrics;
  trends: AnalyticsTrend[];
}

export interface AnalyticsPeriod {
  start_date: Date;
  end_date: Date;
  granularity: TimeGranularity;
}

export enum TimeGranularity {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year'
}

export interface HourlyStats {
  hour: number;
  count: number;
  average_response_time: number;
}

export interface DailyStats {
  day_of_week: number;
  count: number;
  average_response_time: number;
}

export interface ClientCommunicationStats {
  client_id: string;
  client_name: string;
  total_communications: number;
  inbound_count: number;
  outbound_count: number;
  average_response_time: number;
  satisfaction_score?: number;
  last_communication_at: Date;
}

export interface AdvisorCommunicationStats {
  advisor_id: string;
  advisor_name: string;
  total_communications: number;
  response_rate: number;
  average_response_time: number;
  client_satisfaction_score?: number;
  workload_score: number;
}

export interface ComplianceMetrics {
  total_reviewed: number;
  pending_review: number;
  approved_count: number;
  rejected_count: number;
  flagged_count: number;
  average_review_time: number;
  retention_compliance_rate: number;
  encryption_compliance_rate: number;
}

export interface SatisfactionMetrics {
  average_rating: number;
  response_count: number;
  rating_distribution: Record<number, number>;
  nps_score: number;
  satisfaction_trend: number;
}

export interface AnalyticsTrend {
  metric: string;
  period: AnalyticsPeriod;
  current_value: number;
  previous_value: number;
  change_percentage: number;
  trend_direction: TrendDirection;
}

export enum TrendDirection {
  UP = 'up',
  DOWN = 'down',
  STABLE = 'stable',
  VOLATILE = 'volatile'
}

export interface CommunicationConfiguration {
  retention_policies: RetentionPolicy[];
  notification_settings: NotificationSettings;
  integration_settings: IntegrationSettings;
  security_settings: SecuritySettings;
  business_rules: CommunicationRule[];
  templates: CommunicationTemplate[];
  auto_categorization_enabled: boolean;
  auto_tagging_enabled: boolean;
  sentiment_analysis_enabled: boolean;
  language_detection_enabled: boolean;
  translation_enabled: boolean;
  supported_languages: string[];
  max_attachment_size_mb: number;
  allowed_file_types: string[];
  virus_scanning_enabled: boolean;
  encryption_required: boolean;
  digital_signature_required: boolean;
}

export interface RetentionPolicy {
  id: string;
  name: string;
  category: CommunicationCategory;
  retention_period_years: number;
  archival_period_years: number;
  auto_delete_enabled: boolean;
  legal_hold_exempt: boolean;
  compliance_requirements: string[];
}

export interface NotificationSettings {
  email_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;
  push_notifications_enabled: boolean;
  desktop_notifications_enabled: boolean;
  notification_frequency: NotificationFrequency;
  quiet_hours: QuietHours;
  escalation_rules: EscalationRule[];
}

export enum NotificationFrequency {
  IMMEDIATE = 'immediate',
  EVERY_15_MINUTES = 'every_15_minutes',
  EVERY_30_MINUTES = 'every_30_minutes',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly'
}

export interface QuietHours {
  enabled: boolean;
  start_time: string;
  end_time: string;
  timezone: string;
  days_of_week: number[];
  exceptions: string[];
}

export interface EscalationRule {
  id: string;
  name: string;
  conditions: RuleCondition[];
  escalation_levels: EscalationLevel[];
  max_escalation_level: number;
  is_active: boolean;
}

export interface EscalationLevel {
  level: number;
  delay_minutes: number;
  recipients: string[];
  action: ActionType;
  message_template: string;
}

export interface IntegrationSettings {
  email_providers: EmailProviderConfig[];
  phone_systems: PhoneSystemConfig[];
  video_platforms: VideoPlatformConfig[];
  chat_systems: ChatSystemConfig[];
  crm_systems: CRMSystemConfig[];
  document_management: DocumentManagementConfig[];
}

export interface EmailProviderConfig {
  provider: string;
  is_primary: boolean;
  smtp_settings: SMTPSettings;
  oauth_settings?: OAuthSettings;
  encryption_enabled: boolean;
  signature_enabled: boolean;
}

export interface SMTPSettings {
  host: string;
  port: number;
  username: string;
  password: string;
  use_tls: boolean;
  use_ssl: boolean;
}

export interface OAuthSettings {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  scope: string[];
  auth_url: string;
  token_url: string;
}

export interface PhoneSystemConfig {
  provider: string;
  is_primary: boolean;
  api_endpoint: string;
  api_key: string;
  features: PhoneFeature[];
  recording_enabled: boolean;
  transcription_enabled: boolean;
}

export enum PhoneFeature {
  OUTBOUND_CALLING = 'outbound_calling',
  INBOUND_ROUTING = 'inbound_routing',
  CALL_RECORDING = 'call_recording',
  CALL_TRANSCRIPTION = 'call_transcription',
  CONFERENCE_CALLING = 'conference_calling',
  VOICEMAIL = 'voicemail',
  SMS = 'sms',
  CALL_ANALYTICS = 'call_analytics'
}

export interface VideoPlatformConfig {
  provider: string;
  is_primary: boolean;
  api_endpoint: string;
  api_key: string;
  features: VideoFeature[];
  recording_enabled: boolean;
  transcription_enabled: boolean;
  max_participants: number;
}

export enum VideoFeature {
  MEETINGS = 'meetings',
  WEBINARS = 'webinars',
  RECORDING = 'recording',
  TRANSCRIPTION = 'transcription',
  SCREEN_SHARING = 'screen_sharing',
  CHAT = 'chat',
  WHITEBOARD = 'whiteboard',
  BREAKOUT_ROOMS = 'breakout_rooms'
}

export interface ChatSystemConfig {
  provider: string;
  is_primary: boolean;
  api_endpoint: string;
  api_key: string;
  features: ChatFeature[];
  encryption_enabled: boolean;
  file_sharing_enabled: boolean;
}

export enum ChatFeature {
  REAL_TIME_MESSAGING = 'real_time_messaging',
  FILE_SHARING = 'file_sharing',
  GROUP_CHAT = 'group_chat',
  VOICE_MESSAGES = 'voice_messages',
  VIDEO_MESSAGES = 'video_messages',
  SCREEN_SHARING = 'screen_sharing',
  TYPING_INDICATORS = 'typing_indicators',
  READ_RECEIPTS = 'read_receipts'
}

export interface CRMSystemConfig {
  provider: string;
  api_endpoint: string;
  api_key: string;
  sync_enabled: boolean;
  sync_frequency: SyncFrequency;
  field_mappings: FieldMapping[];
}

export enum SyncFrequency {
  REAL_TIME = 'real_time',
  EVERY_5_MINUTES = 'every_5_minutes',
  EVERY_15_MINUTES = 'every_15_minutes',
  EVERY_30_MINUTES = 'every_30_minutes',
  HOURLY = 'hourly',
  DAILY = 'daily'
}

export interface FieldMapping {
  source_field: string;
  target_field: string;
  transformation?: string;
  is_required: boolean;
}

export interface DocumentManagementConfig {
  provider: string;
  api_endpoint: string;
  api_key: string;
  auto_upload_enabled: boolean;
  folder_structure: string;
  retention_policy: string;
  version_control_enabled: boolean;
}

export interface SecuritySettings {
  encryption_at_rest: boolean;
  encryption_in_transit: boolean;
  encryption_algorithm: string;
  digital_signatures_required: boolean;
  access_logging_enabled: boolean;
  data_loss_prevention_enabled: boolean;
  content_filtering_enabled: boolean;
  malware_scanning_enabled: boolean;
  geo_blocking_enabled: boolean;
  allowed_countries: string[];
  blocked_countries: string[];
  ip_whitelisting_enabled: boolean;
  allowed_ip_ranges: string[];
  session_timeout_minutes: number;
  password_policy: PasswordPolicy;
}

export interface PasswordPolicy {
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_special_chars: boolean;
  max_age_days: number;
  history_count: number;
  lockout_attempts: number;
  lockout_duration_minutes: number;
}