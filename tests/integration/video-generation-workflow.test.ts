import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { apiMocks, testDataFactory } from '../utils/api-mocks'

// Mock Next.js
vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    json: (data: any, options?: any) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200,
      headers: new Map(),
    }),
  },
}))

// Mock services before importing
vi.mock('@/lib/services', () => ({
  VeoService: {
    getInstance: vi.fn(() => ({
      generateVideo: vi.fn(),
      estimateCost: vi.fn(() => 1.50),
      getJobStatus: vi.fn(),
    })),
  },
  FirestoreService: {
    getInstance: vi.fn(() => ({
      createSession: vi.fn(),
      createVideoJob: vi.fn(),
      updateSession: vi.fn(),
      getSession: vi.fn(),
      addChatMessage: vi.fn(),
      isMock: vi.fn(() => true),
    })),
  },
  CostTracker: {
    getInstance: vi.fn(() => ({
      getBudgetStatus: vi.fn(() => ({ canProceed: true, remainingBudget: 250 })),
      recordCost: vi.fn(),
    })),
  },
  JobTracker: {
    getInstance: vi.fn(() => ({
      createJob: vi.fn(),
      getJobStatus: vi.fn(),
      updateJobStatus: vi.fn(),
    })),
  },
}))

// Mock validation utils
vi.mock('@/lib/utils/validation', () => ({
  VideoGenerationRequestSchema: {
    parse: vi.fn((data) => ({
      prompt: data.prompt || 'A beautiful sunset over mountains',
      duration: data.duration || 15,
      aspectRatio: data.aspectRatio || '16:9',
      style: data.style || 'cinematic',
    })),
  },
  createApiResponseSchema: vi.fn(() => ({
    parse: vi.fn((data) => data),
  })),
  ValidationUtils: {
    sanitizeInput: vi.fn((input) => input?.trim() || ''),
    validatePromptContent: vi.fn(() => ({ valid: true, errors: [] })),
    validateRateLimit: vi.fn(() => true),
  },
}))

describe('Video Generation Workflow Integration Tests', () => {
  let mockVeoService: any
  let mockFirestoreService: any
  let mockCostTracker: any
  let mockJobTracker: any

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    apiMocks.reset()

    // Get fresh mock instances
    const { VeoService, FirestoreService, CostTracker, JobTracker } = require('@/lib/services')
    mockVeoService = VeoService.getInstance()
    mockFirestoreService = FirestoreService.getInstance()
    mockCostTracker = CostTracker.getInstance()
    mockJobTracker = JobTracker.getInstance()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Video Generation Flow', () => {
    it('should successfully generate video with valid prompt and track progress', async () => {
      // Arrange
      const testPrompt = 'A serene mountain lake at sunset with gentle waves'
      const testJobId = 'test-job-123'
      const testSessionId = 'session-123'

      // Mock service responses
      mockFirestoreService.createSession.mockResolvedValue({
        id: testSessionId,
        prompt: testPrompt,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockVeoService.generateVideo.mockResolvedValue({
        jobId: `projects/test/locations/us-central1/operations/veo-${testJobId}`,
        status: 'pending',
        estimatedCompletionTime: 300,
      })

      mockFirestoreService.createVideoJob.mockResolvedValue({
        id: testJobId,
        sessionId: testSessionId,
        prompt: testPrompt,
        status: 'pending',
        estimatedCost: 1.50,
        createdAt: new Date(),
      })

      // Import and test the API route
      const { POST } = await import('../../app/api/generate-video/route')
      
      // Mock request
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          prompt: testPrompt,
          duration: 15,
          aspectRatio: '16:9',
          style: 'cinematic'
        }),
        headers: {
          get: vi.fn().mockReturnValue('127.0.0.1')
        }
      } as any

      // Act
      const response = await POST(mockRequest)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(202)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toMatchObject({
        jobId: expect.any(String),
        sessionId: expect.any(String),
        status: 'pending',
        estimatedCost: 1.50,
        message: expect.stringContaining('Video generation started successfully')
      })

      // Verify service interactions
      expect(mockCostTracker.getBudgetStatus).toHaveBeenCalled()
      expect(mockVeoService.estimateCost).toHaveBeenCalledWith({
        prompt: testPrompt,
        duration: 15,
        aspectRatio: '16:9',
        style: 'cinematic'
      })
      expect(mockFirestoreService.createSession).toHaveBeenCalled()
      expect(mockVeoService.generateVideo).toHaveBeenCalledWith({
        prompt: testPrompt,
        duration: 15,
        aspectRatio: '16:9',
        style: 'cinematic'
      })
      expect(mockJobTracker.createJob).toHaveBeenCalled()
      expect(mockCostTracker.recordCost).toHaveBeenCalledWith(
        'veo',
        1.50,
        expect.stringContaining('Video generation'),
        expect.any(String),
        expect.any(String)
      )
    })

    it('should handle budget exceeded scenarios gracefully', async () => {
      // Arrange
      mockCostTracker.getBudgetStatus.mockResolvedValue({
        canProceed: false,
        remainingBudget: 0,
        totalSpent: 300,
        budgetLimit: 300
      })

      const { POST } = await import('../../app/api/generate-video/route')
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          prompt: 'A test video prompt',
          duration: 15,
          aspectRatio: '16:9'
        }),
        headers: {
          get: vi.fn().mockReturnValue('127.0.0.1')
        }
      } as any

      // Act
      const response = await POST(mockRequest)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(402)
      expect(responseData.success).toBe(false)
      expect(responseData.error.code).toBe('BUDGET_EXCEEDED')
      expect(responseData.error.message).toContain('Budget limit exceeded')

      // Verify no video generation was attempted
      expect(mockVeoService.generateVideo).not.toHaveBeenCalled()
      expect(mockFirestoreService.createVideoJob).not.toHaveBeenCalled()
    })

    it('should handle insufficient budget for specific request', async () => {
      // Arrange
      mockCostTracker.getBudgetStatus.mockResolvedValue({
        canProceed: true,
        remainingBudget: 1.00,
        totalSpent: 299,
        budgetLimit: 300
      })
      
      mockVeoService.estimateCost.mockReturnValue(1.50)

      const { POST } = await import('../../app/api/generate-video/route')
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          prompt: 'An expensive video prompt',
          duration: 15,
          aspectRatio: '16:9'
        }),
        headers: {
          get: vi.fn().mockReturnValue('127.0.0.1')
        }
      } as any

      // Act
      const response = await POST(mockRequest)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(402)
      expect(responseData.success).toBe(false)
      expect(responseData.error.code).toBe('INSUFFICIENT_BUDGET')
      expect(responseData.error.details).toMatchObject({
        estimatedCost: 1.50,
        remainingBudget: 1.00
      })
    })

    it('should validate and sanitize prompts correctly', async () => {
      // Arrange
      const { ValidationUtils } = await import('@/lib/utils/validation')
      
      // Mock validation failure
      ValidationUtils.validatePromptContent.mockReturnValue({
        valid: false,
        errors: ['Contains inappropriate content']
      })

      const { POST } = await import('../../app/api/generate-video/route')
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          prompt: 'Some inappropriate content here',
          duration: 15,
          aspectRatio: '16:9'
        }),
        headers: {
          get: vi.fn().mockReturnValue('127.0.0.1')
        }
      } as any

      // Act
      const response = await POST(mockRequest)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.code).toBe('INVALID_PROMPT')
      expect(responseData.error.details.errors).toContain('Contains inappropriate content')

      // Verify no generation was attempted
      expect(mockVeoService.generateVideo).not.toHaveBeenCalled()
    })

    it('should handle rate limiting correctly', async () => {
      // Arrange
      const { ValidationUtils } = await import('@/lib/utils/validation')
      ValidationUtils.validateRateLimit.mockReturnValue(false)

      const { POST } = await import('../../app/api/generate-video/route')
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          prompt: 'A valid video prompt',
          duration: 15,
          aspectRatio: '16:9'
        }),
        headers: {
          get: vi.fn().mockReturnValue('192.168.1.1')
        }
      } as any

      // Act
      const response = await POST(mockRequest)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(429)
      expect(responseData.success).toBe(false)
      expect(responseData.error.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(responseData.error.message).toContain('Rate limit exceeded')
    })

    it('should handle VEO API errors gracefully', async () => {
      // Arrange
      mockVeoService.generateVideo.mockRejectedValue(new Error('Veo API connection failed'))

      const { POST } = await import('../../app/api/generate-video/route')
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          prompt: 'A valid video prompt',
          duration: 15,
          aspectRatio: '16:9'
        }),
        headers: {
          get: vi.fn().mockReturnValue('127.0.0.1')
        }
      } as any

      // Act
      const response = await POST(mockRequest)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(502)
      expect(responseData.success).toBe(false)
      expect(responseData.error.code).toBe('VEO_API_ERROR')
      expect(responseData.error.message).toContain('Veo API')
    })
  })

  describe('Job Status Tracking', () => {
    it('should track job status progression from pending to completed', async () => {
      // Arrange
      const testJobId = 'test-job-456'
      
      mockFirestoreService.getVideoJob = vi.fn().mockResolvedValue({
        id: testJobId,
        sessionId: 'session-456',
        status: 'processing',
        progress: 50,
        veoOperationId: 'projects/test/locations/us-central1/operations/veo-456',
      })

      mockJobTracker.getJobStatus.mockResolvedValue({
        id: testJobId,
        status: 'completed',
        progress: 100,
        videoUrl: `https://storage.googleapis.com/test-bucket/${testJobId}.mp4`,
      })

      const { GET } = await import('../../app/api/status/[jobId]/route')
      
      // Mock request params
      const mockRequest = {} as any
      const mockParams = { params: { jobId: testJobId } }

      // Act
      const response = await GET(mockRequest, mockParams)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toMatchObject({
        id: testJobId,
        status: 'completed',
        progress: 100,
        videoUrl: expect.stringContaining('.mp4')
      })
      
      expect(mockJobTracker.getJobStatus).toHaveBeenCalledWith(testJobId)
    })

    it('should handle job not found scenarios', async () => {
      // Arrange
      const testJobId = 'nonexistent-job'
      
      mockFirestoreService.getVideoJob = vi.fn().mockResolvedValue(null)

      const { GET } = await import('../../app/api/status/[jobId]/route')
      
      const mockRequest = {} as any
      const mockParams = { params: { jobId: testJobId } }

      // Act
      const response = await GET(mockRequest, mockParams)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(responseData.success).toBe(false)
      expect(responseData.error.code).toBe('JOB_NOT_FOUND')
    })
  })

  describe('Health Check Endpoints', () => {
    it('should return healthy status when services are operational', async () => {
      // Arrange
      const { GET } = await import('../../app/api/generate-video/route')

      // Act
      const response = await GET()
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.status).toBe('healthy')
      expect(responseData.data.services.veo.status).toBe('healthy')
      expect(responseData.data.services.budget.status).toBe('healthy')
      expect(responseData.data.configuration).toMatchObject({
        maxDuration: 15,
        supportedAspectRatios: expect.arrayContaining(['16:9', '9:16', '1:1']),
        estimatedCostPer15s: 1.50
      })
    })

    it('should return degraded status when budget is exceeded', async () => {
      // Arrange
      mockCostTracker.getBudgetStatus.mockResolvedValue({
        canProceed: false,
        remainingBudget: 0,
      })

      const { GET } = await import('../../app/api/generate-video/route')

      // Act
      const response = await GET()
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.status).toBe('degraded')
      expect(responseData.data.services.budget.status).toBe('unhealthy')
    })
  })
})