// Re-export all types from modules
export * from './session';
export * from './video';
export * from './cost';

// Re-export validation types and schemas
export * from '../lib/utils/validation';

// Re-export API types with explicit naming to avoid conflicts
export type {
  HttpMethod,
  ApiError,
  PaginatedRequest,
  PaginatedResponse,
  RateLimitInfo,
  RateLimitResponse,
  RequestContext,
  HealthStatus,
  ServiceHealth,
  UploadRequest,
  UploadProgress,
  WebhookPayload,
  WebhookResponse,
  StreamChunk,
  CacheConfig,
  EndpointConfig,
  ApiErrorCode,
  HttpStatusCode,
  ContentType,
  ApiVersion,
} from './api';

export {
  API_ERROR_CODES,
  HTTP_STATUS,
  CONTENT_TYPES,
} from './api';

// Global application types
export interface AppConfig {
  environment: 'development' | 'staging' | 'production';
  version: string;
  buildTime: Date;
  features: FeatureFlags;
  limits: AppLimits;
  urls: AppUrls;
}

export interface FeatureFlags {
  enableChatRefinement: boolean;
  enableBudgetAlerts: boolean;
  enableAnalytics: boolean;
  enableRateLimiting: boolean;
  enableFileUploads: boolean;
  enableWebhooks: boolean;
  maintenance: boolean;
}

export interface AppLimits {
  maxPromptLength: number;
  maxVideoDuration: number;
  maxFileSize: number;
  maxConcurrentJobs: number;
  maxChatMessages: number;
  defaultRateLimit: number;
}

export interface AppUrls {
  api: string;
  storage: string;
  cdn?: string;
  webhook?: string;
  support?: string;
  documentation?: string;
}

// User context (for future user system)
export interface UserProfile {
  id: string;
  email?: string;
  tier: 'free' | 'pro' | 'enterprise';
  usage: UserUsage;
  preferences: UserPreferences;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface UserUsage {
  videosGenerated: number;
  totalCost: number;
  currentMonth: {
    videos: number;
    cost: number;
  };
  limits: {
    videosPerMonth: number;
    budgetPerMonth: number;
  };
}

export interface UserPreferences {
  language: 'en' | 'ja';
  defaultVideoStyle?: string;
  defaultAspectRatio?: '16:9' | '9:16' | '1:1';
  emailNotifications: boolean;
  autoSaveChats: boolean;
}

// Device and browser detection
export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  screenSize: {
    width: number;
    height: number;
  };
  touchEnabled: boolean;
  orientation?: 'portrait' | 'landscape';
}

// Localization
export interface LocaleConfig {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  currency: string;
  dateFormat: string;
  numberFormat: Intl.NumberFormatOptions;
}

export const SUPPORTED_LOCALES: Record<string, LocaleConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    currency: 'USD',
    dateFormat: 'MM/dd/yyyy',
    numberFormat: { style: 'decimal', minimumFractionDigits: 2 },
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    direction: 'ltr',
    currency: 'JPY',
    dateFormat: 'yyyy/MM/dd',
    numberFormat: { style: 'decimal', minimumFractionDigits: 0 },
  },
};

// Event tracking for analytics
export interface AnalyticsEvent {
  name: string;
  category: 'video' | 'chat' | 'cost' | 'error' | 'navigation';
  action: string;
  properties?: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  userId?: string;
}

// Performance monitoring
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: Date;
  context?: Record<string, any>;
}

// Feature toggle system
export interface FeatureToggle {
  key: string;
  enabled: boolean;
  rolloutPercentage?: number;
  conditions?: ToggleCondition[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ToggleCondition {
  type: 'user_tier' | 'locale' | 'device_type' | 'date_range';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: any;
}

// Global constants
export const APP_CONSTANTS = {
  MAX_PROMPT_LENGTH: 500,
  MAX_VIDEO_DURATION: 15,
  MAX_CHAT_MESSAGES: 20,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SESSION_EXPIRY_HOURS: 12,
  DEFAULT_RATE_LIMIT: 60, // requests per hour
  SUPPORTED_VIDEO_FORMATS: ['mp4', 'webm'],
  SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
} as const;

// Environment variables interface
export interface EnvironmentVariables {
  NODE_ENV: string;
  GCP_PROJECT_ID: string;
  GCP_REGION: string;
  STORAGE_BUCKET_NAME: string;
  FIRESTORE_DATABASE_NAME: string;
  NEXT_PUBLIC_APP_URL?: string;
  NEXT_PUBLIC_CDN_URL?: string;
  WEBHOOK_SECRET?: string;
  ANALYTICS_KEY?: string;
}