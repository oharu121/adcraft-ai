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
  PromptRefiner: {
    getInstance: vi.fn(() => ({
      chatAboutPrompt: vi.fn(),
      getPromptTips: vi.fn(() => [
        'Add more specific details about the scene',
        'Consider the target audience for your video',
        'Specify the desired mood and atmosphere'
      ]),
    })),
  },
  FirestoreService: {
    getInstance: vi.fn(() => ({
      getSession: vi.fn(),
      addChatMessage: vi.fn(),
      updateSession: vi.fn(),
      isMock: vi.fn(() => true),
    })),
  },
  CostTracker: {
    getInstance: vi.fn(() => ({
      getBudgetStatus: vi.fn(() => ({ canProceed: true, remainingBudget: 250 })),
      recordCost: vi.fn(),
    })),
  },
}))

// Mock validation utils
vi.mock('@/lib/utils/validation', () => ({
  ChatRefinementRequestSchema: {
    parse: vi.fn((data) => ({
      sessionId: data.sessionId || 'session-123',
      message: data.message || 'Can you make the video more dramatic?',
      currentPrompt: data.currentPrompt || 'A beautiful sunset over mountains',
    })),
  },
  createApiResponseSchema: vi.fn(() => ({
    parse: vi.fn((data) => data),
  })),
  ValidationUtils: {
    sanitizeInput: vi.fn((input) => input?.trim() || ''),
    validateRateLimit: vi.fn(() => true),
  },
}))

describe('Chat Refinement Integration Tests', () => {
  let mockPromptRefiner: any
  let mockFirestoreService: any
  let mockCostTracker: any

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    apiMocks.reset()

    // Get fresh mock instances
    const { PromptRefiner, FirestoreService, CostTracker } = require('@/lib/services')
    mockPromptRefiner = PromptRefiner.getInstance()
    mockFirestoreService = FirestoreService.getInstance()
    mockCostTracker = CostTracker.getInstance()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Chat Message Processing', () => {
    it('should successfully process chat refinement requests with existing session', async () => {
      // Arrange
      const testSessionId = 'session-abc123'
      const testMessage = 'Can you make this video more cinematic with dramatic lighting?'
      const testCurrentPrompt = 'A sunset over mountains'
      
      const mockSession = {
        id: testSessionId,
        prompt: testCurrentPrompt,
        chatHistory: [
          {
            id: 'msg-1',
            role: 'user' as const,
            content: 'Initial message',
            timestamp: new Date(),
          }
        ],
        status: 'draft' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockFirestoreService.getSession.mockResolvedValue(mockSession)
      mockPromptRefiner.chatAboutPrompt.mockResolvedValue(
        'I can help you make that more cinematic! Try adding "with dramatic golden hour lighting, cinematic shadows, and film-like depth of field" to enhance the visual drama.'
      )

      const { POST } = await import('../../app/api/chat/refine/route')
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          sessionId: testSessionId,
          message: testMessage,
          currentPrompt: testCurrentPrompt,
        }),
        headers: {
          get: vi.fn().mockReturnValue('127.0.0.1')
        }
      } as any

      // Act
      const response = await POST(mockRequest)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toMatchObject({
        response: expect.stringContaining('cinematic'),
        suggestions: expect.arrayContaining([
          expect.stringContaining('specific details'),
          expect.stringContaining('target audience'),
          expect.stringContaining('mood')
        ])
      })

      // Verify service interactions
      expect(mockFirestoreService.getSession).toHaveBeenCalledWith(testSessionId)
      expect(mockPromptRefiner.chatAboutPrompt).toHaveBeenCalledWith(
        testMessage,
        {
          messages: [
            ...mockSession.chatHistory,
            { role: 'user', content: testMessage }
          ],
          sessionId: testSessionId
        }
      )
      expect(mockFirestoreService.addChatMessage).toHaveBeenCalledTimes(2) // User + assistant messages
      expect(mockCostTracker.recordCost).toHaveBeenCalledWith(
        'gemini',
        0.05,
        'Chat refinement',
        testSessionId
      )
    })

    it('should handle new sessions in mock mode', async () => {
      // Arrange
      const testSessionId = 'new-session-456'
      const testMessage = 'How can I improve my prompt?'
      
      mockFirestoreService.getSession.mockResolvedValue(null)
      mockFirestoreService.isMock.mockReturnValue(true)
      mockPromptRefiner.chatAboutPrompt.mockResolvedValue(
        'Great question! To improve your prompt, try being more specific about the visual elements you want to see.'
      )

      const { POST } = await import('../../app/api/chat/refine/route')
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          sessionId: testSessionId,
          message: testMessage,
        }),
        headers: {
          get: vi.fn().mockReturnValue('127.0.0.1')
        }
      } as any

      // Act
      const response = await POST(mockRequest)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.response).toContain('improve your prompt')

      // Verify temporary session handling
      expect(mockPromptRefiner.chatAboutPrompt).toHaveBeenCalledWith(
        testMessage,
        expect.objectContaining({
          messages: expect.arrayContaining([
            { role: 'user', content: testMessage }
          ]),
          sessionId: testSessionId
        })
      )
    })

    it('should handle session not found in production mode', async () => {
      // Arrange
      mockFirestoreService.getSession.mockResolvedValue(null)
      mockFirestoreService.isMock.mockReturnValue(false) // Production mode

      const { POST } = await import('../../app/api/chat/refine/route')
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          sessionId: 'nonexistent-session',
          message: 'Test message',
        }),
        headers: {
          get: vi.fn().mockReturnValue('127.0.0.1')
        }
      } as any

      // Act
      const response = await POST(mockRequest)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(responseData.success).toBe(false)
      expect(responseData.error.code).toBe('SESSION_NOT_FOUND')
      expect(responseData.error.message).toContain('Session not found')
    })

    it('should validate and sanitize user messages', async () => {
      // Arrange
      const { ValidationUtils } = await import('@/lib/utils/validation')
      const mockSanitizeInput = vi.mocked(ValidationUtils.sanitizeInput)
      
      // Mock empty message after sanitization
      mockSanitizeInput.mockReturnValue('')

      const { POST } = await import('../../app/api/chat/refine/route')
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          sessionId: 'session-123',
          message: '   \n\t  ', // Whitespace only
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
      expect(responseData.error.code).toBe('EMPTY_MESSAGE')
      expect(responseData.error.message).toContain('cannot be empty')

      // Verify no AI processing was attempted
      expect(mockPromptRefiner.chatAboutPrompt).not.toHaveBeenCalled()
    })

    it('should handle rate limiting for chat messages', async () => {
      // Arrange
      const { ValidationUtils } = await import('@/lib/utils/validation')
      const mockValidateRateLimit = vi.mocked(ValidationUtils.validateRateLimit)
      mockValidateRateLimit.mockReturnValue(false)

      const { POST } = await import('../../app/api/chat/refine/route')
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          sessionId: 'session-123',
          message: 'Valid message',
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
      expect(responseData.error.message).toContain('slow down')

      // Verify rate limiting checked session ID
      expect(ValidationUtils.validateRateLimit).toHaveBeenCalledWith(
        '192.168.1.1',
        'session-123'
      )
    })

    it('should handle budget exceeded scenarios', async () => {
      // Arrange
      mockCostTracker.getBudgetStatus.mockResolvedValue({
        canProceed: false,
        remainingBudget: 0,
      })

      const { POST } = await import('../../app/api/chat/refine/route')
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          sessionId: 'session-123',
          message: 'Test message',
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

      // Verify no AI processing was attempted
      expect(mockPromptRefiner.chatAboutPrompt).not.toHaveBeenCalled()
    })
  })

  describe('Chat History Management', () => {
    it('should maintain conversation context with chat history', async () => {
      // Arrange
      const testSessionId = 'session-history-test'
      const previousMessages = [
        { id: 'msg-1', role: 'user' as const, content: 'Make a mountain scene', timestamp: new Date() },
        { id: 'msg-2', role: 'assistant' as const, content: 'Great! What kind of mountains?', timestamp: new Date() },
        { id: 'msg-3', role: 'user' as const, content: 'Snow-capped peaks', timestamp: new Date() },
      ]

      const mockSession = {
        id: testSessionId,
        prompt: 'A mountain scene with snow-capped peaks',
        chatHistory: previousMessages,
        status: 'draft' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockFirestoreService.getSession.mockResolvedValue(mockSession)
      mockPromptRefiner.chatAboutPrompt.mockResolvedValue(
        'Perfect! For snow-capped peaks, I suggest adding "alpine scenery with pristine white snow, crisp mountain air, and dramatic contrast between peaks and sky".'
      )

      const { POST } = await import('../../app/api/chat/refine/route')
      
      const newMessage = 'Add more detail about the snow'
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          sessionId: testSessionId,
          message: newMessage,
        }),
        headers: {
          get: vi.fn().mockReturnValue('127.0.0.1')
        }
      } as any

      // Act
      const response = await POST(mockRequest)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)

      // Verify context was built correctly
      expect(mockPromptRefiner.chatAboutPrompt).toHaveBeenCalledWith(
        newMessage,
        {
          messages: [
            ...previousMessages,
            { role: 'user', content: newMessage }
          ],
          sessionId: testSessionId
        }
      )

      // Verify both user and assistant messages were added to history
      expect(mockFirestoreService.addChatMessage).toHaveBeenCalledWith(
        testSessionId,
        expect.objectContaining({
          role: 'user',
          content: newMessage
        })
      )
      expect(mockFirestoreService.addChatMessage).toHaveBeenCalledWith(
        testSessionId,
        expect.objectContaining({
          role: 'assistant',
          content: expect.stringContaining('alpine scenery')
        })
      )
    })

    it('should update session timestamp after chat interaction', async () => {
      // Arrange
      const testSessionId = 'session-timestamp-test'
      const mockSession = testDataFactory.session({ id: testSessionId })

      mockFirestoreService.getSession.mockResolvedValue(mockSession)
      mockPromptRefiner.chatAboutPrompt.mockResolvedValue('AI response')

      const { POST } = await import('../../app/api/chat/refine/route')
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          sessionId: testSessionId,
          message: 'Test message',
        }),
        headers: {
          get: vi.fn().mockReturnValue('127.0.0.1')
        }
      } as any

      // Act
      await POST(mockRequest)

      // Assert
      expect(mockFirestoreService.updateSession).toHaveBeenCalledWith(
        testSessionId,
        expect.objectContaining({
          updatedAt: expect.any(Date)
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle Gemini API errors gracefully', async () => {
      // Arrange
      mockFirestoreService.getSession.mockResolvedValue(testDataFactory.session())
      mockPromptRefiner.chatAboutPrompt.mockRejectedValue(new Error('Gemini API connection failed'))

      const { POST } = await import('../../app/api/chat/refine/route')
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          sessionId: 'session-123',
          message: 'Test message',
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
      expect(responseData.error.code).toBe('AI_API_ERROR')
      expect(responseData.error.message).toBe('AI service temporarily unavailable. Please try again.')
    })

    it('should handle Firestore errors gracefully', async () => {
      // Arrange
      mockFirestoreService.getSession.mockRejectedValue(new Error('Firestore connection timeout'))

      const { POST } = await import('../../app/api/chat/refine/route')
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          sessionId: 'session-123',
          message: 'Test message',
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
      expect(responseData.error.code).toBe('SESSION_ERROR')
      expect(responseData.error.message).toContain('Session data error')
    })
  })

  describe('Health Check Endpoint', () => {
    it('should return comprehensive health status', async () => {
      // Arrange
      const { GET } = await import('../../app/api/chat/refine/route')

      // Act
      const response = await GET()
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toMatchObject({
        status: 'healthy',
        services: {
          gemini: { status: 'healthy' },
          budget: { status: 'healthy' },
          firestore: { status: 'healthy' }
        },
        configuration: {
          maxMessageLength: 1000,
          maxChatHistory: 20,
          estimatedCostPerMessage: 0.05,
          supportedLanguages: ['en', 'ja']
        },
        capabilities: expect.arrayContaining([
          'Prompt refinement and improvement',
          'Interactive chat conversations',
          'Multi-language support'
        ]),
        version: '1.0.0'
      })
    })

    it('should show degraded status when budget is exceeded', async () => {
      // Arrange
      mockCostTracker.getBudgetStatus.mockResolvedValue({
        canProceed: false,
        remainingBudget: 0
      })

      const { GET } = await import('../../app/api/chat/refine/route')

      // Act
      const response = await GET()
      const responseData = await response.json()

      // Assert
      expect(responseData.data.status).toBe('degraded')
      expect(responseData.data.services.budget.status).toBe('unhealthy')
    })
  })
})

// Helper to create test session data
const testDataFactoryLocal = {
  session: (overrides: any = {}) => ({
    id: 'test-session-123',
    prompt: 'A beautiful mountain landscape',
    chatHistory: [],
    status: 'draft' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
    ...overrides
  })
}