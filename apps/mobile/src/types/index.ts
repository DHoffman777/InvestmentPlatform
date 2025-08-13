export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  clientId: string;
  roles: string[];
  preferences: UserPreferences;
  lastLoginAt: Date;
  createdAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  currency: string;
  language: string;
  notifications: NotificationPreferences;
  biometricsEnabled: boolean;
  autoLockTimeout: number;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  priceAlerts: boolean;
  portfolioUpdates: boolean;
  marketNews: boolean;
  securityAlerts: boolean;
}

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  totalValue: number;
  currency: string;
  performance: PerformanceMetrics;
  positions: Position[];
  lastUpdated: Date;
}

export interface Position {
  id: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  quantity: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedGainLoss: number;
  unrealizedGainLossPercent: number;
  weight: number;
  lastUpdated: Date;
}

export interface PerformanceMetrics {
  totalReturn: number;
  totalReturnPercent: number;
  dayChange: number;
  dayChangePercent: number;
  weekChange: number;
  weekChangePercent: number;
  monthChange: number;
  monthChangePercent: number;
  yearChange: number;
  yearChangePercent: number;
  benchmarkComparison?: BenchmarkComparison;
}

export interface BenchmarkComparison {
  benchmarkName: string;
  portfolioReturn: number;
  benchmarkReturn: number;
  outperformance: number;
}

export interface Transaction {
  id: string;
  portfolioId: string;
  symbol: string;
  type: TransactionType;
  quantity: number;
  price: number;
  amount: number;
  fees: number;
  netAmount: number;
  settlementDate: Date;
  tradeDate: Date;
  description?: string;
  status: TransactionStatus;
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high52Week: number;
  low52Week: number;
  marketCap?: number;
  peRatio?: number;
  dividendYield?: number;
  lastUpdated: Date;
}

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  severity: AlertSeverity;
  portfolioId?: string;
  symbol?: string;
  isRead: boolean;
  actionRequired: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  category: string;
  size: number;
  mimeType: string;
  url: string;
  isEncrypted: boolean;
  thumbnailUrl?: string;
  portfolioId?: string;
  createdAt: Date;
  lastModified: Date;
}

export interface Message {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  subject: string;
  body: string;
  isRead: boolean;
  hasAttachments: boolean;
  attachments?: MessageAttachment[];
  priority: MessagePriority;
  createdAt: Date;
  readAt?: Date;
}

export interface MessageAttachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
}

export interface BiometricInfo {
  isAvailable: boolean;
  biometryType?: 'TouchID' | 'FaceID' | 'Fingerprint';
  isEnabled: boolean;
}

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
  details?: any;
}

export enum AssetType {
  EQUITY = 'EQUITY',
  FIXED_INCOME = 'FIXED_INCOME',
  ETF = 'ETF',
  MUTUAL_FUND = 'MUTUAL_FUND',
  REIT = 'REIT',
  CASH = 'CASH',
  ALTERNATIVE = 'ALTERNATIVE',
  DERIVATIVE = 'DERIVATIVE',
}

export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
  DIVIDEND = 'DIVIDEND',
  INTEREST = 'INTEREST',
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  FEE = 'FEE',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  SETTLED = 'SETTLED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum AlertType {
  PRICE_ALERT = 'PRICE_ALERT',
  PORTFOLIO_PERFORMANCE = 'PORTFOLIO_PERFORMANCE',
  MARKET_NEWS = 'MARKET_NEWS',
  SECURITY_ALERT = 'SECURITY_ALERT',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  ACCOUNT_UPDATE = 'ACCOUNT_UPDATE',
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum DocumentType {
  STATEMENT = 'STATEMENT',
  CONFIRMATION = 'CONFIRMATION',
  TAX_DOCUMENT = 'TAX_DOCUMENT',
  PROSPECTUS = 'PROSPECTUS',
  REPORT = 'REPORT',
  CONTRACT = 'CONTRACT',
  OTHER = 'OTHER',
}

export enum MessagePriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface ChartDataPoint {
  x: number | Date;
  y: number;
  label?: string;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  data: number[];
  color?: string;
  strokeWidth?: number;
}

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  config: any;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isVisible: boolean;
  refreshInterval?: number;
}

export interface AppState {
  isAuthenticated: boolean;
  user: User | null;
  portfolios: Portfolio[];
  selectedPortfolioId: string | null;
  notifications: Alert[];
  isLoading: boolean;
  error: string | null;
  networkStatus: NetworkStatus;
  biometricInfo: BiometricInfo;
  lastSyncTime: Date | null;
}