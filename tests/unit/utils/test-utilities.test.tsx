import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  renderWithProviders, 
  createMockFn, 
  createTestData, 
  customMatchers,
  screen
} from '../../utils'
import { apiMocks, testDataFactory } from '../../utils/api-mocks'

// Test component to verify utilities work
function TestComponent({ onClick, hasError, isLoading }: { 
  onClick?: () => void
  hasError?: boolean 
  isLoading?: boolean 
}) {
  return (
    <div>
      <button onClick={onClick} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Click me'}
        {isLoading && <div className="animate-spin">Loading</div>}
      </button>
      {hasError && (
        <div className="text-red-500" role="alert">
          Error message
        </div>
      )}
      <input 
        aria-invalid={hasError} 
        placeholder="Test input"
      />
    </div>
  )
}

describe('Test Utilities', () => {
  beforeEach(() => {
    apiMocks.reset()
  })

  describe('renderWithProviders', () => {
    it('renders components with default locale', () => {
      renderWithProviders(<TestComponent />)
      
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument()
      expect(screen.getByTestId('app-wrapper')).toBeInTheDocument()
    })

    it('renders components with Japanese locale', () => {
      renderWithProviders(<TestComponent />, { locale: 'ja' })
      
      expect(screen.getByTestId('app-wrapper')).toBeInTheDocument()
    })
  })

  describe('createMockFn utilities', () => {
    it('creates resolving mock function', async () => {
      const mockFn = createMockFn.resolving('success', 100)
      
      const result = await mockFn()
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('creates rejecting mock function', async () => {
      const mockFn = createMockFn.rejecting(new Error('test error'), 50)
      
      await expect(mockFn()).rejects.toThrow('test error')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('creates sequence mock function', () => {
      const mockFn = createMockFn.sequence(
        () => 'first',
        () => 'second',
        () => 'third'
      )
      
      expect(mockFn()).toBe('first')
      expect(mockFn()).toBe('second')
      expect(mockFn()).toBe('third')
      expect(mockFn).toHaveBeenCalledTimes(3)
    })
  })

  describe('createTestData utilities', () => {
    it('creates video job test data', () => {
      const videoJob = createTestData.videoJob({
        prompt: 'Custom prompt',
        status: 'processing'
      })
      
      expect(videoJob).toMatchObject({
        id: 'test-job-123',
        prompt: 'Custom prompt',
        status: 'processing'
      })
      expect(videoJob.createdAt).toBeDefined()
    })

    it('creates chat message test data', () => {
      const message = createTestData.chatMessage({
        role: 'assistant',
        content: 'Custom response'
      })
      
      expect(message).toMatchObject({
        id: 'msg-123',
        role: 'assistant',
        content: 'Custom response'
      })
    })
  })

  describe('custom matchers', () => {
    it('toHaveLoadingSpinner matcher works', () => {
      renderWithProviders(<TestComponent isLoading />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveLoadingSpinner()
    })

    it('toBeInErrorState matcher works', () => {
      renderWithProviders(<TestComponent hasError />)
      
      const errorDiv = screen.getByRole('alert')
      expect(errorDiv).toBeInErrorState()
    })

    it('toHaveValidationError matcher works', () => {
      renderWithProviders(<TestComponent hasError />)
      
      const input = screen.getByPlaceholderText('Test input')
      expect(input).toHaveValidationError()
    })
  })

  describe('API mocks', () => {
    it('mocks successful video generation', async () => {
      apiMocks.mockGenerateVideoSuccess('custom-job-id')
      
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'test' })
      })
      
      const data = await response.json()
      
      expect(data).toMatchObject({
        success: true,
        data: {
          jobId: 'custom-job-id',
          status: 'pending'
        }
      })
      
      apiMocks.expectFetchCallCount(1)
    })

    it('mocks video generation error', async () => {
      apiMocks.mockGenerateVideoError('Custom error message')
      
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'test' })
      })
      
      const data = await response.json()
      
      expect(data).toMatchObject({
        success: false,
        error: {
          message: 'Custom error message'
        }
      })
    })

    it('mocks job status progression', async () => {
      apiMocks.mockJobProgressSequence('test-job')
      
      // First call - pending
      let response = await fetch('/api/status/test-job')
      let data = await response.json()
      expect(data.data.status).toBe('pending')
      
      // Second call - processing
      response = await fetch('/api/status/test-job')
      data = await response.json()
      expect(data.data.status).toBe('processing')
      expect(data.data.progress).toBe(25)
      
      // Third call - more progress
      response = await fetch('/api/status/test-job')
      data = await response.json()
      expect(data.data.progress).toBe(75)
      
      // Fourth call - completed
      response = await fetch('/api/status/test-job')
      data = await response.json()
      expect(data.data.status).toBe('completed')
      expect(data.data.videoUrl).toBeDefined()
    })
  })

  describe('testDataFactory', () => {
    it('creates video job with defaults', () => {
      const videoJob = testDataFactory.videoJob()
      
      expect(videoJob).toMatchObject({
        id: 'test-job-123',
        status: 'pending',
        progress: 0
      })
    })

    it('creates video job with overrides', () => {
      const videoJob = testDataFactory.videoJob({
        status: 'completed',
        progress: 100,
        videoUrl: 'https://example.com/video.mp4'
      })
      
      expect(videoJob.status).toBe('completed')
      expect(videoJob.progress).toBe(100)
      expect(videoJob.videoUrl).toBe('https://example.com/video.mp4')
    })
  })
})