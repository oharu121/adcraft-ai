import { z } from "zod";
import { SecurityMonitorService } from "@/lib/monitor/security-monitor";

// Base validation schemas
export const IdSchema = z.string().min(1, "ID is required");
export const PromptSchema = z
  .string()
  .min(5, "Prompt must be at least 5 characters")
  .max(500, "Prompt must be 500 characters or less")
  .trim();

export const DurationSchema = z
  .number()
  .min(1, "Duration must be at least 1 second")
  .max(15, "Duration must be 15 seconds or less")
  .int("Duration must be a whole number");

export const AspectRatioSchema = z.enum(["16:9", "9:16", "1:1"]);
export const VideoStatusSchema = z.enum(["pending", "processing", "completed", "failed"]);
export const SessionStatusSchema = z.enum(["draft", "generating", "completed", "failed"]);
export const ChatRoleSchema = z.enum(["user", "assistant"]);
export const ServiceSchema = z.enum(["veo", "gemini", "storage", "other"]);

// Video Generation Request Schema
export const VideoGenerationRequestSchema = z.object({
  prompt: PromptSchema,
  duration: DurationSchema.optional().default(15),
  aspectRatio: AspectRatioSchema.optional().default("16:9"),
  style: z.string().max(100).optional(),
});

export type VideoGenerationRequest = z.infer<typeof VideoGenerationRequestSchema>;

// Video Generation Response Schema
export const VideoGenerationResponseSchema = z.object({
  jobId: IdSchema,
  sessionId: IdSchema,
  status: VideoStatusSchema,
  estimatedCompletionTime: z.number().positive().optional(),
  estimatedCost: z.number().positive(),
  message: z.string().optional(),
});

export type VideoGenerationResponse = z.infer<typeof VideoGenerationResponseSchema>;

// Job Status Request Schema
export const JobStatusRequestSchema = z.object({
  jobId: IdSchema,
});

export type JobStatusRequest = z.infer<typeof JobStatusRequestSchema>;

// Job Status Response Schema
export const JobStatusResponseSchema = z.object({
  jobId: IdSchema,
  status: VideoStatusSchema,
  progress: z.number().min(0).max(100).optional(),
  statusMessage: z.string(),
  videoUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  estimatedTimeRemaining: z.number().positive().optional(),
  error: z.string().optional(),
});

export type JobStatusResponse = z.infer<typeof JobStatusResponseSchema>;

// Chat Message Schema
export const ChatMessageSchema = z.object({
  id: IdSchema.optional(),
  role: ChatRoleSchema,
  content: z.string().min(1, "Message content is required").max(1000),
  timestamp: z.date().default(new Date()),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// Chat Refinement Request Schema
export const ChatRefinementRequestSchema = z.object({
  sessionId: IdSchema,
  message: z.string().min(1).max(1000),
  currentPrompt: z.string().optional(),
  context: z
    .object({
      messages: z.array(ChatMessageSchema).max(20, "Too many messages in context"),
    })
    .optional(),
});

export type ChatRefinementRequest = z.infer<typeof ChatRefinementRequestSchema>;

// Chat Refinement Response Schema
export const ChatRefinementResponseSchema = z.object({
  response: z.string(),
  suggestions: z.array(z.string()).max(5),
  refinedPrompt: z.string().optional(),
});

export type ChatRefinementResponse = z.infer<typeof ChatRefinementResponseSchema>;

// Prompt Refinement Request Schema
export const PromptRefinementRequestSchema = z.object({
  prompt: PromptSchema,
  sessionId: IdSchema.optional(),
});

export type PromptRefinementRequest = z.infer<typeof PromptRefinementRequestSchema>;

// Prompt Refinement Response Schema
export const PromptRefinementResponseSchema = z.object({
  originalPrompt: z.string(),
  refinedPrompt: z.string(),
  suggestions: z.array(z.string()).max(10),
  improvements: z
    .array(
      z.object({
        category: z.string(),
        description: z.string(),
        impact: z.enum(["high", "medium", "low"]),
      })
    )
    .max(10),
  confidence: z.number().min(0).max(1),
  analysis: z
    .object({
      score: z.number().min(0).max(1),
      feedback: z.array(z.string()).max(5),
      strengths: z.array(z.string()).max(5),
      improvements: z.array(z.string()).max(5),
    })
    .optional(),
});

export type PromptRefinementResponse = z.infer<typeof PromptRefinementResponseSchema>;

// Session Creation Request Schema
export const SessionCreationRequestSchema = z.object({
  prompt: PromptSchema,
  userId: z.string().optional(),
});

export type SessionCreationRequest = z.infer<typeof SessionCreationRequestSchema>;

// Session Response Schema
export const SessionResponseSchema = z.object({
  id: IdSchema,
  prompt: z.string(),
  refinedPrompt: z.string().optional(),
  status: SessionStatusSchema,
  chatHistory: z.array(ChatMessageSchema),
  videoJobId: IdSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  expiresAt: z.date(),
});

export type SessionResponse = z.infer<typeof SessionResponseSchema>;

// Budget Status Response Schema
export const BudgetStatusResponseSchema = z.object({
  totalBudget: z.number().positive(),
  currentSpend: z.number().min(0),
  remainingBudget: z.number(),
  percentageUsed: z.number().min(0).max(100),
  alertLevel: z.enum(["safe", "warning", "danger", "exceeded"]),
  canProceed: z.boolean(),
  costBreakdown: z
    .object({
      veo: z.number().min(0),
      gemini: z.number().min(0),
      storage: z.number().min(0),
      other: z.number().min(0),
      total: z.number().min(0),
    })
    .optional(),
});

export type BudgetStatusResponse = z.infer<typeof BudgetStatusResponseSchema>;

// File Upload Schema
export const FileUploadSchema = z.object({
  file: z.any(), // File object will be validated separately
  folder: z.string().max(100).optional().default("uploads"),
});

export type FileUploadRequest = z.infer<typeof FileUploadSchema>;

// File Upload Response Schema
export const FileUploadResponseSchema = z.object({
  fileName: z.string(),
  publicUrl: z.string().url(),
  signedUrl: z.string().url(),
  size: z.number().positive(),
  contentType: z.string(),
});

export type FileUploadResponse = z.infer<typeof FileUploadResponseSchema>;

// Error Response Schema
export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.any()).optional(),
    timestamp: z.date().default(new Date()),
  }),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// API Response Wrapper Schema
export function createApiResponseSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: ErrorResponseSchema.shape.error.optional(),
    timestamp: z.date().default(new Date()),
  });
}

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: Date;
  };
  timestamp: Date;
};

// Health Check Response Schema
export const HealthCheckResponseSchema = z.object({
  status: z.enum(["healthy", "degraded", "unhealthy"]),
  timestamp: z.date().default(new Date()),
  services: z
    .record(
      z.string(),
      z.object({
        status: z.enum(["healthy", "unhealthy"]),
        responseTime: z.number().optional(),
        lastCheck: z.date(),
        error: z.string().optional(),
      })
    )
    .optional(),
  version: z.string().optional(),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;

// Validation helper functions
export function validateAndParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  customError?: string
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map((err: any) => `${err.path.join(".")}: ${err.message}`);
    throw new Error(customError || `Validation failed: ${errors.join(", ")}`);
  }

  return result.data;
}

export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    return validateAndParse(schema, data);
  };
}

// Common validation utilities
export const ValidationUtils = {
  /**
   * Validate file upload constraints
   */
  validateFile(file: File): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ["image/", "video/", "text/"];

    if (file.size > maxSize) {
      errors.push("File size must be less than 10MB");
    }

    const hasAllowedType = allowedTypes.some((type) => file.type.startsWith(type));
    if (!hasAllowedType) {
      errors.push("File type not supported");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Validate rate limiting parameters
   * @deprecated Use RateLimiterService.checkRateLimit() directly instead
   */
  validateRateLimit(ip: string, identifier?: string): boolean {
    // Legacy method - kept for backward compatibility
    // New implementations should use RateLimiterService directly
    console.warn(
      "ValidationUtils.validateRateLimit is deprecated. Use RateLimiterService.checkRateLimit() instead."
    );
    return true;
  },

  /**
   * Sanitize user input to prevent XSS and other injection attacks
   */
  sanitizeInput(input: string, source?: string): string {
    if (!input || typeof input !== "string") {
      return "";
    }

    const originalInput = input;
    const securityMonitor = SecurityMonitorService.getInstance();

    // Check for XSS patterns before sanitization
    const xssPatterns = [
      /<script[^>]*>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        if (source) {
          securityMonitor.logXSSAttempt(source, originalInput);
        }
        break;
      }
    }

    // Check for injection attempts
    const injectionPatterns = [
      /union\s+select/gi,
      /drop\s+table/gi,
      /insert\s+into/gi,
      /delete\s+from/gi,
      /'.*or.*'.*=/gi,
      /\d+\s*=\s*\d+/g,
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(input)) {
        if (source) {
          securityMonitor.logInjectionAttempt(source, originalInput, "sql");
        }
        break;
      }
    }

    const sanitized = input
      .trim()
      // Remove all HTML tags and their content
      .replace(/<script[^>]*>.*?<\/script>/gi, "")
      .replace(/<style[^>]*>.*?<\/style>/gi, "")
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "")
      .replace(/<object[^>]*>.*?<\/object>/gi, "")
      .replace(/<embed[^>]*>.*?<\/embed>/gi, "")
      .replace(/<link[^>]*>/gi, "")
      .replace(/<meta[^>]*>/gi, "")
      .replace(/<[^>]*>/g, "")
      // Remove JavaScript-like patterns
      .replace(/javascript:/gi, "")
      .replace(/vbscript:/gi, "")
      .replace(/data:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      // Remove potentially dangerous characters
      .replace(/[<>'"&]/g, (match) => {
        const htmlEntities: Record<string, string> = {
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#x27;",
          "&": "&amp;",
        };
        return htmlEntities[match] || match;
      })
      // Remove null bytes and control characters
      .replace(/[\0-\x1F\x7F]/g, "")
      // Limit length
      .substring(0, 1000);

    // Log if significant changes were made during sanitization
    if (source && originalInput !== sanitized && originalInput.length > sanitized.length + 10) {
      securityMonitor.logMaliciousInput(
        source,
        originalInput,
        "Input significantly modified during sanitization"
      );
    }

    return sanitized;
  },

  /**
   * Validate prompt content for safety and policy compliance
   */
  validatePromptContent(prompt: string, source?: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic length validation
    if (!prompt || prompt.trim().length < 5) {
      errors.push("Prompt is too short (minimum 5 characters)");
    }

    if (prompt.length > 500) {
      errors.push("Prompt is too long (maximum 500 characters)");
    }

    // Enhanced content policy validation
    const bannedPatterns = [
      // Violence and harmful content
      /\b(violence|violent|kill|murder|death|blood|gore|torture|harm)\b/gi,
      // Explicit adult content
      /\b(explicit|nude|naked|sexual|porn|adult|erotic)\b/gi,
      // Illegal activities
      /\b(illegal|drugs|weapon|bomb|terrorist|hack|steal|fraud)\b/gi,
      // Hate speech indicators
      /\b(hate|racist|discrimination|nazi|supremacist)\b/gi,
      // Personal information patterns
      /\b(\d{3}-\d{2}-\d{4}|\d{4}\s?\d{4}\s?\d{4}\s?\d{4}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g,
    ];

    const lowerPrompt = prompt.toLowerCase();

    const securityMonitor = SecurityMonitorService.getInstance();
    const violations: string[] = [];

    for (const pattern of bannedPatterns) {
      const matches = lowerPrompt.match(pattern);
      if (matches) {
        violations.push(`Pattern: ${pattern.toString()}`);
        errors.push(`Content contains prohibited terms or patterns`);
        break; // Don't reveal specific words for security
      }
    }

    // Log content policy violations
    if (violations.length > 0 && source) {
      securityMonitor.logContentPolicyViolation(source, prompt, violations);
    }

    // Check for excessive repetition (potential spam)
    const words = prompt.split(/\s+/);
    const wordCounts = new Map<string, number>();
    for (const word of words) {
      if (word.length > 2) {
        wordCounts.set(word.toLowerCase(), (wordCounts.get(word.toLowerCase()) || 0) + 1);
      }
    }

    for (const [word, count] of wordCounts.entries()) {
      if (count > 5 && words.length > 10) {
        errors.push("Content contains excessive repetition");
        break;
      }
    }

    // Check for suspicious patterns (base64, hex encoding, etc.)
    const suspiciousPatterns = [
      /[A-Za-z0-9+/]{20,}={0,2}/, // Base64-like patterns
      /0x[0-9a-fA-F]{10,}/, // Hex patterns
      /\\x[0-9a-fA-F]{2}/, // Hex escape sequences
      /%[0-9a-fA-F]{2}/, // URL encoding
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(prompt)) {
        errors.push("Content contains suspicious encoding patterns");
        break;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

// Export all schemas for reuse
export const Schemas = {
  VideoGenerationRequest: VideoGenerationRequestSchema,
  VideoGenerationResponse: VideoGenerationResponseSchema,
  JobStatusRequest: JobStatusRequestSchema,
  JobStatusResponse: JobStatusResponseSchema,
  ChatMessage: ChatMessageSchema,
  ChatRefinementRequest: ChatRefinementRequestSchema,
  ChatRefinementResponse: ChatRefinementResponseSchema,
  PromptRefinementRequest: PromptRefinementRequestSchema,
  PromptRefinementResponse: PromptRefinementResponseSchema,
  SessionCreationRequest: SessionCreationRequestSchema,
  SessionResponse: SessionResponseSchema,
  BudgetStatusResponse: BudgetStatusResponseSchema,
  FileUploadRequest: FileUploadSchema,
  FileUploadResponse: FileUploadResponseSchema,
  ErrorResponse: ErrorResponseSchema,
  HealthCheckResponse: HealthCheckResponseSchema,
};
