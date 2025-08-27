import { vi, expect } from 'vitest'
import type { VideoJob, ChatMessage, ApiResponse } from '@/types'

/**
 * Mock implementations for API endpoints
 */
export class ApiMocks {
  private static instance: ApiMocks
  private mockFetch: any

  private constructor() {
    this.mockFetch = vi.fn()
    global.fetch = this.mockFetch
  }

  static getInstance(): ApiMocks {
    if (!ApiMocks.instance) {
      ApiMocks.instance = new ApiMocks()
    }
    return ApiMocks.instance
  }

  /**
   * Reset all mocks
   */
  reset() {
    this.mockFetch.mockClear()
  }

  /**
   * Mock successful video generation API call
   */
  mockGenerateVideoSuccess(jobId = 'test-job-123') {
    this.mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        data: {
          jobId,
          status: 'pending',
          estimatedTime: 300
        }
      })
    })
  }

  /**
   * Mock failed video generation API call
   */
  mockGenerateVideoError(errorMessage = 'Generation failed') {
    this.mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        success: false,
        error: {
          message: errorMessage,
          code: 'GENERATION_FAILED'
        }
      })
    })
  }

  /**
   * Mock successful chat refinement API call
   */
  mockChatRefineSuccess(refinedPrompt = 'Improved prompt') {
    this.mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        data: {
          refinedPrompt,
          suggestions: [
            'Add more specific details',
            'Consider the target audience',
            'Specify the video duration'
          ]
        }
      })
    })
  }

  /**
   * Mock job status API calls with different states
   */
  mockJobStatus(status: 'pending' | 'processing' | 'completed' | 'failed', jobId = 'test-job-123') {
    const responses = {
      pending: {
        id: jobId,
        status: 'pending',
        progress: 0,
        message: 'Job queued for processing'
      },
      processing: {
        id: jobId,
        status: 'processing',
        progress: 45,
        message: 'Generating video...'
      },
      completed: {
        id: jobId,
        status: 'completed',
        progress: 100,
        videoUrl: `https://storage.googleapis.com/test-bucket/${jobId}.mp4`,
        downloadUrl: `https://storage.googleapis.com/test-bucket/${jobId}.mp4?download=true`
      },
      failed: {
        id: jobId,
        status: 'failed',
        progress: 30,
        error: 'Video generation failed',
        message: 'An error occurred during processing'
      }
    }

    this.mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        data: responses[status]
      })
    })
  }

  /**
   * Mock network error
   */
  mockNetworkError() {
    this.mockFetch.mockRejectedValueOnce(new Error('Network error'))
  }

  /**
   * Mock rate limiting error
   */
  mockRateLimitError() {
    this.mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: () => Promise.resolve({
        success: false,
        error: {
          message: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: 60
        }
      })
    })
  }

  /**
   * Mock server error
   */
  mockServerError(status = 500) {
    this.mockFetch.mockResolvedValueOnce({
      ok: false,
      status,
      json: () => Promise.resolve({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR'
        }
      })
    })
  }

  /**
   * Mock progressive job status updates (pending -> processing -> completed)
   */
  mockJobProgressSequence(jobId = 'test-job-123') {
    this.mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: {
            id: jobId,
            status: 'pending',
            progress: 0
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: {
            id: jobId,
            status: 'processing',
            progress: 25
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: {
            id: jobId,
            status: 'processing',
            progress: 75
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: {
            id: jobId,
            status: 'completed',
            progress: 100,
            videoUrl: `https://storage.googleapis.com/test-bucket/${jobId}.mp4`
          }
        })
      })
  }

  /**
   * Get the mock fetch function for custom assertions
   */
  getFetchMock() {
    return this.mockFetch
  }

  /**
   * Verify that fetch was called with specific parameters
   */
  expectFetchCalledWith(url: string, options?: RequestInit) {
    expect(this.mockFetch).toHaveBeenCalledWith(url, options)
  }

  /**
   * Verify the number of fetch calls
   */
  expectFetchCallCount(count: number) {
    expect(this.mockFetch).toHaveBeenCalledTimes(count)
  }
}

// Export a singleton instance
export const apiMocks = ApiMocks.getInstance()

/**
 * Test data factories
 */
export const testDataFactory = {
  videoJob: (overrides: Partial<VideoJob> = {}): VideoJob => ({
    id: 'test-job-123',
    sessionId: 'test-session-123',
    prompt: 'A beautiful sunset over mountains',
    status: 'pending',
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    estimatedCost: 1.50,
    metadata: {
      duration: 15,
      aspectRatio: '16:9',
    },
    ...overrides
  }),

  chatMessage: (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
    id: 'msg-123',
    role: 'user',
    content: 'Can you make the video more dramatic?',
    timestamp: new Date(),
    ...overrides
  }),

  apiError: (overrides = {}) => ({
    message: 'An error occurred',
    code: 'UNKNOWN_ERROR',
    details: {},
    ...overrides
  })
}

/**
 * Helper to create realistic test files
 */
export const createTestFile = (name = 'test.txt', content = 'test content', type = 'text/plain') => {
  return new File([content], name, { type })
}

/**
 * Helper to wait for async operations in tests
 */
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Helper to simulate user typing with realistic delays
 */
export const simulateTyping = async (element: Element, text: string, delay = 50) => {
  for (const char of text) {
    await new Promise(resolve => setTimeout(resolve, delay))
    // Simulate character input
    element.dispatchEvent(new InputEvent('input', { data: char, inputType: 'insertText' }))
  }
}