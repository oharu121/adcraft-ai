import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock Google Cloud SDKs
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

vi.mock('@google-cloud/storage', () => ({
  Storage: vi.fn(() => ({
    bucket: vi.fn(() => ({
      file: vi.fn(() => ({
        getSignedUrl: vi.fn(),
        save: vi.fn(),
        delete: vi.fn(),
        exists: vi.fn(),
      })),
    })),
  })),
}))

vi.mock('@google-cloud/aiplatform', () => ({
  aiplatform: vi.fn(() => ({
    PredictionServiceClient: vi.fn(() => ({
      predict: vi.fn(),
    })),
  })),
}))

// Mock Google Generative AI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: vi.fn(),
      startChat: vi.fn(() => ({
        sendMessage: vi.fn(),
      })),
    })),
  })),
}))

describe('Service Layer Integration Tests', () => {
  let mockFirestore: any
  let mockStorage: any
  let mockGenerativeAI: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset modules to ensure fresh instances
    vi.resetModules()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('VeoService Integration', () => {
    it('should generate video request with proper parameters', async () => {
      // Arrange
      const mockPredict = vi.fn().mockResolvedValue([{
        responses: [{
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  operationId: 'projects/test/locations/us-central1/operations/veo-12345',
                  status: 'pending',
                  estimatedCompletionTime: 300
                })
              }]
            }
          }]
        }]
      }])

      vi.doMock('@google-cloud/aiplatform', () => ({
        aiplatform: vi.fn(() => ({
          PredictionServiceClient: vi.fn(() => ({
            predict: mockPredict,
          })),
        })),
      }))

      const { VeoService } = await import('@/lib/services/veo')
      const veoService = VeoService.getInstance()

      const videoRequest = {
        prompt: 'A serene mountain lake at sunset with gentle ripples on the water',
        duration: 15,
        aspectRatio: '16:9' as const,
        style: 'cinematic' as const,
      }

      // Act
      const result = await veoService.generateVideo(videoRequest)

      // Assert
      expect(result).toMatchObject({
        jobId: 'projects/test/locations/us-central1/operations/veo-12345',
        status: 'pending',
        estimatedCompletionTime: 300
      })

      expect(mockPredict).toHaveBeenCalledWith(
        expect.objectContaining({
          instances: expect.arrayContaining([
            expect.objectContaining({
              prompt: videoRequest.prompt,
              duration: videoRequest.duration,
              aspectRatio: videoRequest.aspectRatio,
              style: videoRequest.style,
            })
          ])
        })
      )
    })

    it('should handle VEO API errors gracefully', async () => {
      // Arrange
      const mockPredict = vi.fn().mockRejectedValue(new Error('VEO API quota exceeded'))

      vi.doMock('@google-cloud/aiplatform', () => ({
        aiplatform: vi.fn(() => ({
          PredictionServiceClient: vi.fn(() => ({
            predict: mockPredict,
          })),
        })),
      }))

      const { VeoService } = await import('@/lib/services/veo')
      const veoService = VeoService.getInstance()

      const videoRequest = {
        prompt: 'Test prompt',
        duration: 15,
        aspectRatio: '16:9' as const,
        style: 'natural' as const,
      }

      // Act & Assert
      await expect(veoService.generateVideo(videoRequest)).rejects.toThrow('VEO API quota exceeded')
    })

    it('should provide accurate cost estimates for different configurations', async () => {
      // Arrange
      const { VeoService } = await import('@/lib/services/veo')
      const veoService = VeoService.getInstance()

      // Test different video configurations
      const configs = [
        { duration: 5, aspectRatio: '16:9' as const, expectedCost: 0.50 },
        { duration: 15, aspectRatio: '16:9' as const, expectedCost: 1.50 },
        { duration: 30, aspectRatio: '9:16' as const, expectedCost: 3.00 },
      ]

      for (const config of configs) {
        // Act
        const cost = veoService.estimateCost({
          prompt: 'Test prompt',
          duration: config.duration,
          aspectRatio: config.aspectRatio,
          style: 'natural',
        })

        // Assert
        expect(cost).toBeCloseTo(config.expectedCost, 2)
      }
    })

    it('should track job status correctly', async () => {
      // Arrange
      const operationId = 'projects/test/locations/us-central1/operations/veo-status-test'
      
      const mockPredict = vi.fn().mockResolvedValue([{
        responses: [{
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  status: 'completed',
                  progress: 100,
                  videoUrl: 'https://storage.googleapis.com/test-bucket/video-123.mp4'
                })
              }]
            }
          }]
        }]
      }])

      vi.doMock('@google-cloud/aiplatform', () => ({
        aiplatform: vi.fn(() => ({
          PredictionServiceClient: vi.fn(() => ({
            predict: mockPredict,
          })),
        })),
      }))

      const { VeoService } = await import('@/lib/services/veo')
      const veoService = VeoService.getInstance()

      // Act
      const status = await veoService.getJobStatus(operationId)

      // Assert
      expect(status).toMatchObject({
        status: 'completed',
        progress: 100,
        videoUrl: 'https://storage.googleapis.com/test-bucket/video-123.mp4'
      })
    })
  })

  describe('FirestoreService Integration', () => {
    beforeEach(() => {
      const { Firestore } = require('@google-cloud/firestore')
      mockFirestore = new Firestore()
    })

    it('should create and manage video sessions', async () => {
      // Arrange
      const sessionId = 'session-test-123'
      const testPrompt = 'A beautiful sunset over mountains'
      
      mockFirestore.collection().add.mockResolvedValue({ id: sessionId })
      mockFirestore.collection().doc().get.mockResolvedValue({
        exists: true,
        id: sessionId,
        data: () => ({
          id: sessionId,
          prompt: testPrompt,
          chatHistory: [],
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      })

      const { FirestoreService } = await import('@/lib/services/firestore')
      const firestoreService = FirestoreService.getInstance()

      // Act
      const session = await firestoreService.createSession(testPrompt)

      // Assert
      expect(mockFirestore.collection).toHaveBeenCalledWith('sessions')
      expect(mockFirestore.collection().add).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: testPrompt,
          chatHistory: [],
          status: 'draft',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          expiresAt: expect.any(Date),
        })
      )
    })

    it('should handle session expiration correctly', async () => {
      // Arrange
      const expiredSessionId = 'expired-session-456'
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
      
      mockFirestore.collection().doc().get.mockResolvedValue({
        exists: true,
        id: expiredSessionId,
        data: () => ({
          id: expiredSessionId,
          prompt: 'Test prompt',
          status: 'draft',
          expiresAt: pastDate,
        })
      })

      const { FirestoreService } = await import('@/lib/services/firestore')
      const firestoreService = FirestoreService.getInstance()

      // Act
      const session = await firestoreService.getSession(expiredSessionId)

      // Assert
      expect(session).toBeNull() // Expired session should return null
    })

    it('should manage chat history with proper ordering', async () => {
      // Arrange
      const sessionId = 'chat-session-789'
      const messages = [
        { role: 'user' as const, content: 'First message', timestamp: new Date() },
        { role: 'assistant' as const, content: 'First response', timestamp: new Date() },
        { role: 'user' as const, content: 'Second message', timestamp: new Date() },
      ]

      mockFirestore.collection().doc().get.mockResolvedValue({
        exists: true,
        id: sessionId,
        data: () => ({
          id: sessionId,
          chatHistory: messages,
          updatedAt: new Date(),
        })
      })

      mockFirestore.collection().doc().update.mockResolvedValue({})

      const { FirestoreService } = await import('@/lib/services/firestore')
      const firestoreService = FirestoreService.getInstance()

      // Act
      await firestoreService.addChatMessage(sessionId, {
        role: 'assistant',
        content: 'Second response',
        timestamp: new Date(),
      })

      // Assert
      expect(mockFirestore.collection().doc().update).toHaveBeenCalledWith(
        expect.objectContaining({
          chatHistory: expect.arrayContaining([
            expect.objectContaining({ role: 'user', content: 'First message' }),
            expect.objectContaining({ role: 'assistant', content: 'First response' }),
            expect.objectContaining({ role: 'user', content: 'Second message' }),
            expect.objectContaining({ role: 'assistant', content: 'Second response' }),
          ]),
          updatedAt: expect.any(Date),
        })
      )
    })

    it('should create and track video jobs', async () => {
      // Arrange
      const sessionId = 'session-video-job'
      const jobId = 'job-123'
      const prompt = 'Mountain landscape video'
      const estimatedCost = 1.75
      const operationId = 'projects/test/operations/veo-123'

      mockFirestore.collection().add.mockResolvedValue({ id: jobId })

      const { FirestoreService } = await import('@/lib/services/firestore')
      const firestoreService = FirestoreService.getInstance()

      // Act
      const videoJob = await firestoreService.createVideoJob(
        sessionId,
        prompt,
        estimatedCost,
        jobId,
        operationId
      )

      // Assert
      expect(mockFirestore.collection).toHaveBeenCalledWith('videoJobs')
      expect(mockFirestore.collection().add).toHaveBeenCalledWith(
        expect.objectContaining({
          id: jobId,
          sessionId,
          prompt,
          status: 'pending',
          progress: 0,
          estimatedCost,
          veoOperationId: operationId,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      )
    })
  })

  describe('JobTracker Integration', () => {
    it('should create and monitor job lifecycle', async () => {
      // Arrange
      mockFirestore.collection().add.mockResolvedValue({ id: 'job-tracker-123' })
      mockFirestore.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => ({
          id: 'job-tracker-123',
          sessionId: 'session-123',
          status: 'processing',
          progress: 50,
          veoOperationId: 'projects/test/operations/veo-123',
        })
      })
      mockFirestore.collection().doc().update.mockResolvedValue({})

      const { JobTracker } = await import('@/lib/services/job-tracker')
      const jobTracker = JobTracker.getInstance()

      const jobData = {
        sessionId: 'session-123',
        prompt: 'Test video prompt',
        operationId: 'projects/test/operations/veo-123',
        estimatedCost: 1.50,
      }

      // Act
      await jobTracker.createJob(
        jobData.sessionId,
        jobData.prompt,
        jobData.operationId,
        jobData.estimatedCost
      )

      const status = await jobTracker.getJobProgress('job-tracker-123')
      
      await jobTracker.updateJobStatus('job-tracker-123', {
        jobId: 'job-tracker-123',
        status: 'completed',
        progress: 100,
        videoUrl: 'https://storage.googleapis.com/bucket/video.mp4',
      })

      // Assert
      expect(mockFirestore.collection).toHaveBeenCalledWith('jobs')
      expect(status).toMatchObject({
        id: 'job-tracker-123',
        status: 'processing',
        progress: 50,
      })
      expect(mockFirestore.collection().doc().update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          progress: 100,
          videoUrl: 'https://storage.googleapis.com/bucket/video.mp4',
          updatedAt: expect.any(Date),
        })
      )
    })

    it('should handle job not found scenarios', async () => {
      // Arrange
      mockFirestore.collection().doc().get.mockResolvedValue({
        exists: false,
      })

      const { JobTracker } = await import('@/lib/services/job-tracker')
      const jobTracker = JobTracker.getInstance()

      // Act
      const status = await jobTracker.getJobProgress('nonexistent-job')

      // Assert
      expect(status).toBeNull()
    })
  })

  describe('PromptRefiner Integration', () => {
    beforeEach(() => {
      const { GoogleGenerativeAI } = require('@google/generative-ai')
      mockGenerativeAI = new GoogleGenerativeAI()
    })

    it('should refine prompts using Gemini API', async () => {
      // Arrange
      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => 'Here\'s an improved version of your prompt: "A cinematic mountain landscape at golden hour with dramatic lighting and depth of field"'
        }
      })

      mockGenerativeAI.getGenerativeModel.mockReturnValue({
        generateContent: mockGenerateContent,
      })

      const { PromptRefiner } = await import('@/lib/services/prompt-refiner')
      const promptRefiner = PromptRefiner.getInstance()

      // Act
      const result = await promptRefiner.refinePrompt('A mountain scene')

      // Assert
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining('A mountain scene')
      )
      expect(result).toContain('cinematic mountain landscape')
    })

    it('should handle chat conversations with context', async () => {
      // Arrange
      const mockSendMessage = vi.fn().mockResolvedValue({
        response: {
          text: () => 'To make your video more dramatic, try adding "with storm clouds gathering overhead and dramatic lighting contrasts"'
        }
      })

      const mockStartChat = vi.fn().mockReturnValue({
        sendMessage: mockSendMessage,
      })

      mockGenerativeAI.getGenerativeModel.mockReturnValue({
        startChat: mockStartChat,
      })

      const { PromptRefiner } = await import('@/lib/services/prompt-refiner')
      const promptRefiner = PromptRefiner.getInstance()

      const chatContext = {
        messages: [
          { role: 'user' as const, content: 'I want to make a mountain video' },
          { role: 'assistant' as const, content: 'Great! What style are you looking for?' },
          { role: 'user' as const, content: 'Make it more dramatic' },
        ],
        sessionId: 'chat-session-123',
      }

      // Act
      const response = await promptRefiner.chatAboutPrompt('Make it more dramatic', chatContext)

      // Assert
      expect(mockStartChat).toHaveBeenCalledWith({
        history: expect.arrayContaining([
          expect.objectContaining({ 
            role: 'user', 
            parts: [{ text: 'I want to make a mountain video' }] 
          }),
          expect.objectContaining({ 
            role: 'model', 
            parts: [{ text: 'Great! What style are you looking for?' }] 
          }),
        ]),
      })
      expect(mockSendMessage).toHaveBeenCalledWith('Make it more dramatic')
      expect(response).toContain('dramatic lighting')
    })

    it('should provide helpful prompt suggestions', async () => {
      // Arrange
      const { PromptRefiner } = await import('@/lib/services/prompt-refiner')
      const promptRefiner = PromptRefiner.getInstance()

      // Act
      const tips = promptRefiner.getPromptTips()

      // Assert
      expect(tips).toBeInstanceOf(Array)
      expect(tips.length).toBeGreaterThan(0)
      expect(tips[0]).toContain('specific details')
    })
  })

  describe('CloudStorageService Integration', () => {
    beforeEach(() => {
      const { Storage } = require('@google-cloud/storage')
      mockStorage = new Storage()
    })

    it('should generate signed URLs for video access', async () => {
      // Arrange
      const testVideoUrl = 'https://signed-url.example.com/video.mp4'
      mockStorage.bucket().file().getSignedUrl.mockResolvedValue([testVideoUrl])

      const { CloudStorageService } = await import('@/lib/services/cloud-storage')
      const storageService = CloudStorageService.getInstance()

      // Act
      const signedUrl = await storageService.getSignedUrl('test-video.mp4', 'read')

      // Assert
      expect(mockStorage.bucket).toHaveBeenCalledWith(expect.any(String))
      expect(mockStorage.bucket().file).toHaveBeenCalledWith('test-video.mp4')
      expect(mockStorage.bucket().file().getSignedUrl).toHaveBeenCalledWith({
        version: 'v4',
        action: 'read',
        expires: expect.any(Date),
      })
      expect(signedUrl).toBe(testVideoUrl)
    })

    it('should handle file cleanup with lifecycle policies', async () => {
      // Arrange
      mockStorage.bucket().file().delete.mockResolvedValue([])
      mockStorage.bucket().file().exists.mockResolvedValue([true])

      const { CloudStorageService } = await import('@/lib/services/cloud-storage')
      const storageService = CloudStorageService.getInstance()

      // Act
      await storageService.deleteFile('old-video.mp4')

      // Assert
      expect(mockStorage.bucket().file().delete).toHaveBeenCalled()
    })
  })

  describe('Service Integration and Dependencies', () => {
    it('should handle cross-service communication properly', async () => {
      // Arrange - Mock all services
      mockFirestore.collection().add.mockResolvedValue({ id: 'integration-test' })
      mockFirestore.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => ({ status: 'completed', progress: 100 })
      })

      const mockPredict = vi.fn().mockResolvedValue([{
        responses: [{ candidates: [{ content: { parts: [{ text: JSON.stringify({ status: 'completed' }) }] } }] }]
      }])

      vi.doMock('@google-cloud/aiplatform', () => ({
        aiplatform: vi.fn(() => ({
          PredictionServiceClient: vi.fn(() => ({ predict: mockPredict })),
        })),
      }))

      const { VeoService } = await import('@/lib/services/veo')
      const { JobTracker } = await import('@/lib/services/job-tracker')
      const { CostTracker } = await import('@/lib/services/cost-tracker')

      const veoService = VeoService.getInstance()
      const jobTracker = JobTracker.getInstance()
      const costTracker = CostTracker.getInstance()

      // Act - Simulate complete workflow
      const operationId = 'projects/test/operations/integration-123'
      
      await jobTracker.createJob('session-123', 'Integration test', operationId, 1.50)
      await costTracker.recordCost('veo', 1.50, 'Integration test', 'session-123')
      const status = await veoService.getJobStatus(operationId)

      // Assert
      expect(status).toBeDefined()
      expect(mockFirestore.collection().add).toHaveBeenCalledTimes(2) // Job + Cost
    })

    it('should maintain singleton pattern across services', async () => {
      // Arrange & Act
      const { VeoService } = await import('@/lib/services/veo')
      const { CostTracker } = await import('@/lib/services/cost-tracker')
      const { JobTracker } = await import('@/lib/services/job-tracker')

      const veo1 = VeoService.getInstance()
      const veo2 = VeoService.getInstance()
      const cost1 = CostTracker.getInstance()
      const cost2 = CostTracker.getInstance()
      const job1 = JobTracker.getInstance()
      const job2 = JobTracker.getInstance()

      // Assert
      expect(veo1).toBe(veo2)
      expect(cost1).toBe(cost2)
      expect(job1).toBe(job2)
    })
  })
})