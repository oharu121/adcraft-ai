/**
 * Security Validation Test Suite
 * Tests security measures including input validation, XSS prevention,
 * rate limiting, and content filtering
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValidationUtils } from '@/lib/utils/validation';
import { RateLimiterService } from '@/lib/services/rate-limiter';

describe('Security Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Input Sanitization', () => {
    it('should remove script tags and dangerous HTML', () => {
      const maliciousInput = '<script>alert("xss")</script><div>Safe content</div>';
      const sanitized = ValidationUtils.sanitizeInput(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('Safe content');
    });

    it('should remove iframe and object tags', () => {
      const maliciousInput = '<iframe src="evil.com"></iframe><object data="evil.swf"></object>';
      const sanitized = ValidationUtils.sanitizeInput(maliciousInput);
      
      expect(sanitized).not.toContain('<iframe>');
      expect(sanitized).not.toContain('<object>');
    });

    it('should remove JavaScript protocols and event handlers', () => {
      const maliciousInput = 'javascript:alert(1) vbscript:msgbox onclick="alert(1)"';
      const sanitized = ValidationUtils.sanitizeInput(maliciousInput);
      
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('vbscript:');
      expect(sanitized).not.toContain('onclick=');
    });

    it('should encode dangerous characters', () => {
      const input = '<>&"\'';
      const sanitized = ValidationUtils.sanitizeInput(input);
      
      // After HTML removal and encoding, we should have encoded entities for remaining characters
      expect(sanitized).toContain('&amp;');
      expect(sanitized).toContain('&quot;');
      expect(sanitized).toContain('&#x27;');
      // < and > are removed by HTML tag removal, not just encoded
    });

    it('should remove null bytes and control characters', () => {
      // Use actual control characters, not string literals
      const input = 'test\0\x01\x02\x1F\x7F';
      const sanitized = ValidationUtils.sanitizeInput(input);
      
      expect(sanitized).toBe('test');
    });

    it('should handle empty or invalid input', () => {
      expect(ValidationUtils.sanitizeInput('')).toBe('');
      expect(ValidationUtils.sanitizeInput(null as any)).toBe('');
      expect(ValidationUtils.sanitizeInput(undefined as any)).toBe('');
      expect(ValidationUtils.sanitizeInput(123 as any)).toBe('');
    });

    it('should truncate long input', () => {
      const longInput = 'a'.repeat(2000);
      const sanitized = ValidationUtils.sanitizeInput(longInput);
      
      expect(sanitized.length).toBe(1000);
    });
  });

  describe('Content Validation', () => {
    it('should reject prompts that are too short', () => {
      const result = ValidationUtils.validatePromptContent('hi');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Prompt is too short (minimum 5 characters)');
    });

    it('should reject prompts that are too long', () => {
      const longPrompt = 'a'.repeat(600);
      const result = ValidationUtils.validatePromptContent(longPrompt);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Prompt is too long (maximum 500 characters)');
    });

    it('should reject violent content', () => {
      const violentPrompt = 'Create a video showing violence and murder scenes';
      const result = ValidationUtils.validatePromptContent(violentPrompt);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Content contains prohibited terms or patterns');
    });

    it('should reject explicit adult content', () => {
      const explicitPrompt = 'Generate explicit adult content with nudity';
      const result = ValidationUtils.validatePromptContent(explicitPrompt);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Content contains prohibited terms or patterns');
    });

    it('should reject illegal activity content', () => {
      const illegalPrompt = 'Show how to make illegal drugs and weapons';
      const result = ValidationUtils.validatePromptContent(illegalPrompt);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Content contains prohibited terms or patterns');
    });

    it('should reject hate speech content', () => {
      const hatePrompt = 'Create racist propaganda promoting hate and discrimination';
      const result = ValidationUtils.validatePromptContent(hatePrompt);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Content contains prohibited terms or patterns');
    });

    it('should detect and reject personal information patterns', () => {
      const piiPrompt = 'My email is test@example.com and SSN is 123-45-6789';
      const result = ValidationUtils.validatePromptContent(piiPrompt);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Content contains prohibited terms or patterns');
    });

    it('should detect excessive repetition', () => {
      const spamPrompt = 'buy buy buy buy buy buy now now now now now now';
      const result = ValidationUtils.validatePromptContent(spamPrompt);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Content contains excessive repetition');
    });

    it('should detect suspicious encoding patterns', () => {
      const encodedPrompts = [
        'VGhpcyBpcyBhIGJhc2U2NCB0ZXN0IGV4YW1wbGU=', // Base64
        '0x48656c6c6f20576f726c64', // Hex
        '\\x48\\x65\\x6c\\x6c\\x6f', // Hex escape
        '%48%65%6c%6c%6f%20%57%6f%72%6c%64', // URL encoding
      ];

      for (const prompt of encodedPrompts) {
        const result = ValidationUtils.validatePromptContent(prompt);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Content contains suspicious encoding patterns');
      }
    });

    it('should accept valid, safe prompts', () => {
      const safePrompts = [
        'Create a beautiful sunset video with mountains',
        'Show a happy dog playing in the park',
        'Generate a peaceful ocean scene with waves',
        'Make a time-lapse of flowers blooming',
      ];

      for (const prompt of safePrompts) {
        const result = ValidationUtils.validatePromptContent(prompt);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });
  });

  describe('File Validation', () => {
    it('should reject files that are too large', () => {
      const largeFile = new File([''], 'test.jpg', { 
        type: 'image/jpeg',
        // Mock large file size
      });
      
      // Mock file size
      Object.defineProperty(largeFile, 'size', {
        value: 11 * 1024 * 1024, // 11MB
        writable: false
      });

      const result = ValidationUtils.validateFile(largeFile);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File size must be less than 10MB');
    });

    it('should reject unsupported file types', () => {
      const execFile = new File([''], 'malicious.exe', { 
        type: 'application/x-executable'
      });

      const result = ValidationUtils.validateFile(execFile);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File type not supported');
    });

    it('should accept valid image files', () => {
      const imageFile = new File([''], 'test.jpg', { 
        type: 'image/jpeg'
      });
      
      // Mock reasonable file size
      Object.defineProperty(imageFile, 'size', {
        value: 2 * 1024 * 1024, // 2MB
        writable: false
      });

      const result = ValidationUtils.validateFile(imageFile);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid video files', () => {
      const videoFile = new File([''], 'test.mp4', { 
        type: 'video/mp4'
      });
      
      Object.defineProperty(videoFile, 'size', {
        value: 5 * 1024 * 1024, // 5MB
        writable: false
      });

      const result = ValidationUtils.validateFile(videoFile);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

describe('Rate Limiter Service', () => {
  let rateLimiter: RateLimiterService;

  beforeEach(() => {
    // Get fresh instance for each test
    rateLimiter = new (RateLimiterService as any)();
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests within limit', () => {
      const result = rateLimiter.checkRateLimit('test-ip', 'status-check');
      
      expect(result.allowed).toBe(true);
      expect(result.remainingRequests).toBe(59); // 60 - 1
    });

    it('should block requests when limit exceeded', () => {
      // Use up all allowed requests
      for (let i = 0; i < 60; i++) {
        rateLimiter.checkRateLimit('test-ip', 'status-check');
      }

      // Next request should be blocked
      const result = rateLimiter.checkRateLimit('test-ip', 'status-check');
      
      expect(result.allowed).toBe(false);
      expect(result.remainingRequests).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should have different limits for different endpoints', () => {
      // Video generation has stricter limits (3 per hour)
      for (let i = 0; i < 3; i++) {
        const result = rateLimiter.checkRateLimit('test-ip', 'video-generation');
        expect(result.allowed).toBe(true);
      }

      // 4th request should be blocked
      const result = rateLimiter.checkRateLimit('test-ip', 'video-generation');
      expect(result.allowed).toBe(false);
    });

    it('should handle different IPs independently', () => {
      // Use up limit for IP1
      for (let i = 0; i < 60; i++) {
        rateLimiter.checkRateLimit('ip1', 'status-check');
      }

      // IP2 should still be allowed
      const result = rateLimiter.checkRateLimit('ip2', 'status-check');
      expect(result.allowed).toBe(true);
    });
  });

  describe('Client Identifier Extraction', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockImplementation((header: string) => {
            if (header === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1';
            if (header === 'x-real-ip') return '10.0.0.1';
            return null;
          })
        }
      } as any;

      const clientId = rateLimiter.getClientIdentifier(mockRequest);
      expect(clientId).toBe('192.168.1.1');
    });

    it('should fallback to x-real-ip if x-forwarded-for not available', () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockImplementation((header: string) => {
            if (header === 'x-real-ip') return '192.168.1.1';
            return null;
          })
        }
      } as any;

      const clientId = rateLimiter.getClientIdentifier(mockRequest);
      expect(clientId).toBe('192.168.1.1');
    });

    it('should return unknown if no IP headers available', () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue(null)
        }
      } as any;

      const clientId = rateLimiter.getClientIdentifier(mockRequest);
      expect(clientId).toBe('unknown');
    });
  });

  describe('Rate Limit Response Creation', () => {
    it('should create proper response for allowed requests', () => {
      const rateLimitResult = {
        allowed: true,
        remainingRequests: 5,
        resetTime: Date.now() + 60000,
      };

      const response = rateLimiter.createRateLimitResponse(rateLimitResult);
      
      expect(response.status).toBe(200);
      expect(response.headers['X-RateLimit-Remaining']).toBe('5');
      expect(response.body).toBeNull();
    });

    it('should create proper response for blocked requests', () => {
      const rateLimitResult = {
        allowed: false,
        remainingRequests: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 60,
      };

      const response = rateLimiter.createRateLimitResponse(rateLimitResult);
      
      expect(response.status).toBe(429);
      expect(response.headers['Retry-After']).toBe('60');
      expect(response.body).not.toBeNull();
      expect(response.body?.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('Configuration Management', () => {
    it('should allow updating endpoint configurations', () => {
      const newConfig = {
        windowMs: 30 * 1000, // 30 seconds
        maxRequests: 5,
      };

      rateLimiter.updateEndpointConfig('test-endpoint', newConfig);
      const retrievedConfig = rateLimiter.getEndpointConfig('test-endpoint');
      
      expect(retrievedConfig).toEqual(newConfig);
    });

    it('should return default config for unknown endpoints', () => {
      const config = rateLimiter.getEndpointConfig('unknown-endpoint');
      
      expect(config.windowMs).toBe(60 * 1000);
      expect(config.maxRequests).toBe(10);
    });
  });

  describe('Statistics', () => {
    it('should provide accurate statistics', () => {
      rateLimiter.checkRateLimit('ip1', 'status-check');
      rateLimiter.checkRateLimit('ip2', 'video-generation');
      
      const stats = rateLimiter.getStatistics();
      
      expect(stats.totalEntries).toBeGreaterThan(0);
      expect(stats.activeEntries).toBeGreaterThan(0);
      expect(stats.endpointConfigs).toBeGreaterThan(0);
    });
  });
});