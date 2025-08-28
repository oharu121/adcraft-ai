import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

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

// Mock Firestore
vi.mock('@google-cloud/firestore', () => ({
  Firestore: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        set: vi.fn(),
        get: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      })),
      add: vi.fn(),
      where: vi.fn(() => ({
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: vi.fn(),
          })),
          get: vi.fn(),
        })),
        get: vi.fn(),
      })),
      orderBy: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: vi.fn(),
        })),
        get: vi.fn(),
      })),
      get: vi.fn(),
    })),
  })),
}))

describe('Cost Tracking and Budget Monitoring Integration Tests', () => {
  let mockFirestore: any
  let CostTracker: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // Reset modules and get fresh instances
    vi.resetModules()
    
    // Mock Firestore responses
    const { Firestore } = await import('@google-cloud/firestore')
    mockFirestore = new (Firestore as any)()

    // Import CostTracker after mocks are set up
    const { CostTracker: CT } = await import('@/lib/services/cost-tracker')
    CostTracker = CT
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Budget Status Monitoring', () => {
    it('should return healthy status when budget is within limits', async () => {
      // Arrange
      const mockCostData = [
        { data: () => ({ service: 'veo', cost: 10.50, timestamp: new Date(), description: 'Video 1' }) },
        { data: () => ({ service: 'gemini', cost: 2.30, timestamp: new Date(), description: 'Chat 1' }) },
        { data: () => ({ service: 'veo', cost: 15.75, timestamp: new Date(), description: 'Video 2' }) },
      ]

      mockFirestore.collection().where().orderBy().get.mockResolvedValue({
        docs: mockCostData,
        empty: false,
      })

      const costTracker = CostTracker.getInstance()

      // Act
      const budgetStatus = await costTracker.getBudgetStatus()

      // Assert
      expect(budgetStatus).toMatchObject({
        totalSpent: 28.55, // 10.50 + 2.30 + 15.75
        budgetLimit: 300,
        remainingBudget: 271.45,
        utilizationPercentage: expect.closeTo(9.52, 2),
        canProceed: true,
        alertLevel: 'none',
        dailySpent: expect.any(Number),
        hourlySpent: expect.any(Number),
      })
    })

    it('should trigger warning alert at 50% budget utilization', async () => {
      // Arrange
      const mockCostData = Array.from({ length: 100 }, (_, i) => ({
        data: () => ({ service: 'veo', cost: 1.50, timestamp: new Date(), description: `Video ${i}` })
      }))

      mockFirestore.collection().where().orderBy().get.mockResolvedValue({
        docs: mockCostData, // 100 * 1.50 = $150 (50% of $300)
        empty: false,
      })

      const costTracker = CostTracker.getInstance()

      // Act
      const budgetStatus = await costTracker.getBudgetStatus()

      // Assert
      expect(budgetStatus).toMatchObject({
        totalSpent: 150,
        budgetLimit: 300,
        remainingBudget: 150,
        utilizationPercentage: 50,
        canProceed: true,
        alertLevel: 'warning',
      })
      expect(budgetStatus.canProceed).toBe(true)
    })

    it('should trigger critical alert at 75% budget utilization', async () => {
      // Arrange
      const mockCostData = Array.from({ length: 150 }, (_, i) => ({
        data: () => ({ service: 'veo', cost: 1.50, timestamp: new Date(), description: `Video ${i}` })
      }))

      mockFirestore.collection().where().orderBy().get.mockResolvedValue({
        docs: mockCostData, // 150 * 1.50 = $225 (75% of $300)
        empty: false,
      })

      const costTracker = CostTracker.getInstance()

      // Act
      const budgetStatus = await costTracker.getBudgetStatus()

      // Assert
      expect(budgetStatus).toMatchObject({
        totalSpent: 225,
        budgetLimit: 300,
        remainingBudget: 75,
        utilizationPercentage: 75,
        canProceed: true,
        alertLevel: 'critical',
      })
      expect(budgetStatus.canProceed).toBe(true)
    })

    it('should prevent new operations at 90% budget utilization', async () => {
      // Arrange
      const mockCostData = Array.from({ length: 180 }, (_, i) => ({
        data: () => ({ service: 'veo', cost: 1.50, timestamp: new Date(), description: `Video ${i}` })
      }))

      mockFirestore.collection().where().orderBy().get.mockResolvedValue({
        docs: mockCostData, // 180 * 1.50 = $270 (90% of $300)
        empty: false,
      })

      const costTracker = CostTracker.getInstance()

      // Act
      const budgetStatus = await costTracker.getBudgetStatus()

      // Assert
      expect(budgetStatus).toMatchObject({
        totalSpent: 270,
        budgetLimit: 300,
        remainingBudget: 30,
        utilizationPercentage: 90,
        canProceed: false,
        alertLevel: 'emergency',
      })
    })

    it('should block all operations when budget is exceeded', async () => {
      // Arrange
      const mockCostData = Array.from({ length: 210 }, (_, i) => ({
        data: () => ({ service: 'veo', cost: 1.50, timestamp: new Date(), description: `Video ${i}` })
      }))

      mockFirestore.collection().where().orderBy().get.mockResolvedValue({
        docs: mockCostData, // 210 * 1.50 = $315 (105% of $300)
        empty: false,
      })

      const costTracker = CostTracker.getInstance()

      // Act
      const budgetStatus = await costTracker.getBudgetStatus()

      // Assert
      expect(budgetStatus).toMatchObject({
        totalSpent: 315,
        budgetLimit: 300,
        remainingBudget: -15,
        utilizationPercentage: 105,
        canProceed: false,
        alertLevel: 'emergency',
      })
    })
  })

  describe('Cost Recording and Tracking', () => {
    it('should record individual service costs correctly', async () => {
      // Arrange
      mockFirestore.collection().add.mockResolvedValue({ id: 'cost-entry-123' })
      
      const costTracker = CostTracker.getInstance()
      const testCost = 2.45
      const testService = 'veo'
      const testDescription = 'Video generation - Mountain sunset scene'
      const testSessionId = 'session-456'
      const testJobId = 'job-789'

      // Act
      await costTracker.recordCost(testService, testCost, testDescription, testSessionId, testJobId)

      // Assert
      expect(mockFirestore.collection).toHaveBeenCalledWith('costs')
      expect(mockFirestore.collection().add).toHaveBeenCalledWith({
        service: testService,
        cost: testCost,
        description: testDescription,
        sessionId: testSessionId,
        jobId: testJobId,
        timestamp: expect.any(Date),
        metadata: expect.objectContaining({
          source: 'adcraft-ai',
          version: '1.0.0',
        }),
      })
    })

    it('should handle concurrent cost recording', async () => {
      // Arrange
      mockFirestore.collection().add
        .mockResolvedValueOnce({ id: 'cost-1' })
        .mockResolvedValueOnce({ id: 'cost-2' })
        .mockResolvedValueOnce({ id: 'cost-3' })

      const costTracker = CostTracker.getInstance()

      // Act - Record multiple costs simultaneously
      const promises = [
        costTracker.recordCost('veo', 1.50, 'Video 1', 'session-1', 'job-1'),
        costTracker.recordCost('gemini', 0.05, 'Chat 1', 'session-2', 'job-2'),
        costTracker.recordCost('veo', 1.50, 'Video 2', 'session-3', 'job-3'),
      ]

      await Promise.all(promises)

      // Assert
      expect(mockFirestore.collection().add).toHaveBeenCalledTimes(3)
    })

    it('should handle cost recording failures gracefully', async () => {
      // Arrange
      mockFirestore.collection().add.mockRejectedValue(new Error('Firestore write failed'))
      
      const costTracker = CostTracker.getInstance()

      // Act & Assert
      await expect(
        costTracker.recordCost('veo', 1.50, 'Test video', 'session-123')
      ).rejects.toThrow('Failed to record cost')
    })
  })

  describe('Usage Analytics and Reporting', () => {
    it('should calculate daily spending patterns', async () => {
      // Arrange
      const today = new Date()
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      
      const mockCostData = [
        { data: () => ({ service: 'veo', cost: 5.00, timestamp: today, description: 'Today Video 1' }) },
        { data: () => ({ service: 'veo', cost: 3.50, timestamp: today, description: 'Today Video 2' }) },
        { data: () => ({ service: 'gemini', cost: 0.25, timestamp: today, description: 'Today Chat' }) },
        { data: () => ({ service: 'veo', cost: 7.00, timestamp: yesterday, description: 'Yesterday Video' }) },
      ]

      // Mock calls for different time ranges
      mockFirestore.collection().where().orderBy().get
        .mockResolvedValueOnce({ docs: mockCostData, empty: false }) // All costs
        .mockResolvedValueOnce({ docs: mockCostData.slice(0, 3), empty: false }) // Today's costs

      const costTracker = CostTracker.getInstance()

      // Act
      const budgetStatus = await costTracker.getBudgetStatus()

      // Assert
      expect(budgetStatus.dailySpent).toBe(8.75) // 5.00 + 3.50 + 0.25
      expect(budgetStatus.totalSpent).toBe(15.75) // All costs
    })

    it('should provide service breakdown', async () => {
      // Arrange
      const mockCostData = [
        { data: () => ({ service: 'veo', cost: 10.50, timestamp: new Date(), description: 'Video 1' }) },
        { data: () => ({ service: 'veo', cost: 8.25, timestamp: new Date(), description: 'Video 2' }) },
        { data: () => ({ service: 'gemini', cost: 0.30, timestamp: new Date(), description: 'Chat 1' }) },
        { data: () => ({ service: 'gemini', cost: 0.15, timestamp: new Date(), description: 'Chat 2' }) },
      ]

      mockFirestore.collection().where().orderBy().get.mockResolvedValue({
        docs: mockCostData,
        empty: false,
      })

      const costTracker = CostTracker.getInstance()

      // Act
      const budgetStatus = await costTracker.getBudgetStatus()

      // Assert
      expect(budgetStatus.serviceBreakdown).toEqual({
        veo: 18.75,
        gemini: 0.45,
      })
      expect(budgetStatus.totalSpent).toBe(19.20)
    })
  })

  describe('Budget Alert Integration', () => {
    it('should integrate with video generation API for budget checking', async () => {
      // Arrange - Mock budget near limit
      const mockCostData = Array.from({ length: 175 }, (_, i) => ({
        data: () => ({ service: 'veo', cost: 1.50, timestamp: new Date(), description: `Video ${i}` })
      }))

      mockFirestore.collection().where().orderBy().get.mockResolvedValue({
        docs: mockCostData, // 175 * 1.50 = $262.50 (87.5% of $300)
        empty: false,
      })

      // Mock services
      vi.doMock('@/lib/services', () => ({
        CostTracker: {
          getInstance: vi.fn(() => {
            const ct = new (require('@/lib/services/cost-tracker').CostTracker)()
            return ct
          })
        },
        VeoService: {
          getInstance: vi.fn(() => ({
            estimateCost: vi.fn(() => 1.50),
            generateVideo: vi.fn(),
          }))
        },
        FirestoreService: { getInstance: vi.fn(() => ({ createSession: vi.fn() })) },
        JobTracker: { getInstance: vi.fn(() => ({ createJob: vi.fn() })) },
      }))

      vi.doMock('@/lib/utils/validation', () => ({
        VideoGenerationRequestSchema: { parse: vi.fn(() => ({ prompt: 'test', duration: 15, aspectRatio: '16:9' })) },
        createApiResponseSchema: vi.fn(() => ({ parse: vi.fn() })),
        ValidationUtils: {
          sanitizeInput: vi.fn((input) => input),
          validatePromptContent: vi.fn(() => ({ valid: true, errors: [] })),
          validateRateLimit: vi.fn(() => true),
        },
      }))

      const { POST } = await import('../../app/api/generate-video/route')
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          prompt: 'Test prompt',
          duration: 15,
          aspectRatio: '16:9',
        }),
        headers: { get: vi.fn().mockReturnValue('127.0.0.1') }
      } as any

      // Act
      const response = await POST(mockRequest)
      const responseData = await response.json()

      // Assert - Should still allow the request but with warnings
      expect(response.status).toBe(202)
      expect(responseData.success).toBe(true)
    })

    it('should block video generation when budget threshold is reached', async () => {
      // Arrange - Mock budget at emergency level
      const mockCostData = Array.from({ length: 195 }, (_, i) => ({
        data: () => ({ service: 'veo', cost: 1.50, timestamp: new Date(), description: `Video ${i}` })
      }))

      mockFirestore.collection().where().orderBy().get.mockResolvedValue({
        docs: mockCostData, // 195 * 1.50 = $292.50 (97.5% of $300)
        empty: false,
      })

      // Mock services with budget exceeded
      vi.doMock('@/lib/services', () => ({
        CostTracker: {
          getInstance: vi.fn(() => ({
            getBudgetStatus: vi.fn().mockResolvedValue({
              totalSpent: 292.50,
              budgetLimit: 300,
              remainingBudget: 7.50,
              canProceed: false,
              alertLevel: 'emergency',
            }),
            recordCost: vi.fn(),
          }))
        },
        VeoService: { getInstance: vi.fn(() => ({ estimateCost: vi.fn(() => 1.50) })) },
        FirestoreService: { getInstance: vi.fn(() => ({})) },
        JobTracker: { getInstance: vi.fn(() => ({})) },
      }))

      vi.doMock('@/lib/utils/validation', () => ({
        VideoGenerationRequestSchema: { parse: vi.fn(() => ({ prompt: 'test', duration: 15, aspectRatio: '16:9' })) },
        createApiResponseSchema: vi.fn(() => ({ parse: vi.fn() })),
        ValidationUtils: {
          sanitizeInput: vi.fn((input) => input),
          validatePromptContent: vi.fn(() => ({ valid: true, errors: [] })),
          validateRateLimit: vi.fn(() => true),
        },
      }))

      const { POST } = await import('../../app/api/generate-video/route')
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          prompt: 'Test prompt',
          duration: 15,
          aspectRatio: '16:9',
        }),
        headers: { get: vi.fn().mockReturnValue('127.0.0.1') }
      } as any

      // Act
      const response = await POST(mockRequest)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(402)
      expect(responseData.success).toBe(false)
      expect(responseData.error.code).toBe('BUDGET_EXCEEDED')
      expect(responseData.error.message).toContain('Budget limit exceeded')
    })
  })

  describe('Real-time Cost Monitoring', () => {
    it('should handle rapid cost accumulation scenarios', async () => {
      // Arrange
      const costTracker = CostTracker.getInstance()
      const costs = Array.from({ length: 10 }, (_, i) => ({
        service: 'veo',
        cost: 15.0, // High cost operations
        description: `Large video generation ${i}`,
        sessionId: `session-${i}`,
        jobId: `job-${i}`,
      }))

      // Mock progressive cost accumulation
      let totalCost = 0
      mockFirestore.collection().add.mockImplementation(() => {
        totalCost += 15.0
        return Promise.resolve({ id: `cost-${Math.random()}` })
      })

      // Act - Record costs rapidly
      const promises = costs.map(cost => 
        costTracker.recordCost(cost.service, cost.cost, cost.description, cost.sessionId, cost.jobId)
      )

      await Promise.all(promises)

      // Assert
      expect(mockFirestore.collection().add).toHaveBeenCalledTimes(10)
      expect(totalCost).toBe(150.0)
    })

    it('should provide accurate cost estimates for different services', async () => {
      // Arrange
      const costTracker = CostTracker.getInstance()
      
      // Mock service cost data for estimation
      const mockHistoricalData = [
        { data: () => ({ service: 'veo', cost: 1.50, metadata: { duration: 15, aspectRatio: '16:9' } }) },
        { data: () => ({ service: 'veo', cost: 3.00, metadata: { duration: 30, aspectRatio: '16:9' } }) },
        { data: () => ({ service: 'gemini', cost: 0.05, metadata: { tokens: 1000 } }) },
      ]

      mockFirestore.collection().where().orderBy().limit().get.mockResolvedValue({
        docs: mockHistoricalData,
        empty: false,
      })

      // Act
      const veoEstimate = await costTracker.estimateServiceCost('veo', { duration: 15, aspectRatio: '16:9' })
      const geminiEstimate = await costTracker.estimateServiceCost('gemini', { tokens: 1000 })

      // Assert
      expect(veoEstimate).toBeCloseTo(1.50, 2)
      expect(geminiEstimate).toBeCloseTo(0.05, 2)
    })
  })
})