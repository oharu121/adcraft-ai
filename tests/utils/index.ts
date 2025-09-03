import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'
import React from 'react'
import { expect } from 'vitest'
import userEvent from '@testing-library/user-event'

// Re-export everything from testing-library/react
export * from '@testing-library/react'
export { userEvent }

/**
 * Custom render function that includes common providers
 */
export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  locale?: 'en' | 'ja'
  initialProps?: Record<string, any>
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const { locale = 'en', ...renderOptions } = options

  // Mock dictionary for testing - structured by locale
  const mockDictionaries = {
    ja: {
      common: {
        loading: '読み込み中...',
        error: 'エラー',
        cancel: 'キャンセル',
        submit: '送信',
      },
      videoGenerator: {
        title: 'AI動画ジェネレーター',
        promptPlaceholder: 'どのような動画を作成したいかを説明してください...',
        generateButton: '動画を生成',
      }
    },
    en: {
      common: {
        loading: 'Loading...',
        error: 'Error',
        cancel: 'Cancel',
        submit: 'Submit',
      },
      videoGenerator: {
        title: 'AI Video Generator',
        promptPlaceholder: 'Describe what kind of video you want to create...',
        generateButton: 'Generate Video',
      }
    }
  }

  const mockDictionary = mockDictionaries[locale]

  // Wrapper component that provides necessary context
  function AllTheProviders({ children }: { children: ReactNode }) {
    // In a real app, you might have Context providers here
    // Using React.createElement to avoid JSX compilation issues in test setup
    return React.createElement('div', { 'data-testid': 'app-wrapper' }, children)
  }

  return render(ui, { wrapper: AllTheProviders, ...renderOptions })
}

/**
 * Utility to create mock functions with specific behaviors
 */
export const createMockFn = {
  /**
   * Creates a mock function that resolves with the given value after a delay
   */
  resolving: <T>(value: T, delay = 0) => {
    return vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(value), delay))
    )
  },

  /**
   * Creates a mock function that rejects with the given error after a delay
   */
  rejecting: (error: any, delay = 0) => {
    return vi.fn().mockImplementation(() => 
      new Promise((_, reject) => setTimeout(() => reject(error), delay))
    )
  },

  /**
   * Creates a mock function that calls different implementations on successive calls
   */
  sequence: (...implementations: any[]) => {
    const fn = vi.fn()
    implementations.forEach((impl, index) => {
      fn.mockImplementationOnce(impl)
    })
    return fn
  }
}

/**
 * Utility to wait for multiple promises to resolve
 */
export const waitForAll = (promises: Promise<any>[]) => Promise.all(promises)

/**
 * Utility to create test data
 */
export const createTestData = {
  videoJob: (overrides = {}) => ({
    id: 'test-job-123',
    status: 'pending' as const,
    prompt: 'A test video prompt',
    progress: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }),

  chatMessage: (overrides = {}) => ({
    id: 'msg-123',
    role: 'user' as const,
    content: 'Test message',
    timestamp: new Date().toISOString(),
    ...overrides
  }),

  apiError: (overrides = {}) => ({
    message: 'Test error',
    code: 'TEST_ERROR',
    details: {},
    ...overrides
  })
}

/**
 * Custom matchers for common testing scenarios
 */
export const customMatchers = {
  /**
   * Checks if an element has a loading spinner
   */
  toHaveLoadingSpinner: (received: Element) => {
    const spinner = received.querySelector('[data-testid="loading-spinner"], .animate-spin, svg')
    return {
      message: () => 
        spinner 
          ? `Expected element not to have loading spinner`
          : `Expected element to have loading spinner`,
      pass: !!spinner
    }
  },

  /**
   * Checks if an element is in an error state
   */
  toBeInErrorState: (received: Element) => {
    const hasErrorClass = received.classList.contains('error') || 
                         received.classList.contains('border-red-500') ||
                         received.getAttribute('aria-invalid') === 'true'
    const hasErrorText = received.textContent?.toLowerCase().includes('error')
    
    const isInErrorState = hasErrorClass || hasErrorText
    
    return {
      message: () =>
        isInErrorState
          ? `Expected element not to be in error state`
          : `Expected element to be in error state`,
      pass: isInErrorState
    }
  },

  /**
   * Checks if a form field has validation error
   */
  toHaveValidationError: (received: Element) => {
    const hasAriaInvalid = received.getAttribute('aria-invalid') === 'true'
    const hasErrorSibling = received.parentElement?.querySelector('[role="alert"], .text-red-500')
    
    return {
      message: () =>
        hasAriaInvalid || hasErrorSibling
          ? `Expected field not to have validation error`
          : `Expected field to have validation error`,
      pass: !!(hasAriaInvalid || hasErrorSibling)
    }
  }
}

// Extend expect with custom matchers
expect.extend(customMatchers)

// Type declarations for custom matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toHaveLoadingSpinner(): T
    toBeInErrorState(): T
    toHaveValidationError(): T
  }
  interface AsymmetricMatchersContaining {
    toHaveLoadingSpinner(): any
    toBeInErrorState(): any
    toHaveValidationError(): any
  }
}

/**
 * Mock implementations for common external dependencies
 */
export const mocks = {
  nextRouter: {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  },

  localStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },

  fetch: vi.fn(),

  // Mock successful API responses
  apiResponses: {
    generateVideo: {
      success: {
        jobId: 'test-job-123',
        status: 'pending',
        estimatedTime: 300
      },
      error: {
        message: 'Failed to generate video',
        code: 'GENERATION_FAILED'
      }
    },

    chatRefine: {
      success: {
        refinedPrompt: 'Improved test prompt',
        suggestions: ['Add more detail', 'Specify duration']
      },
      error: {
        message: 'Failed to refine prompt',
        code: 'REFINEMENT_FAILED'
      }
    },

    jobStatus: {
      pending: {
        id: 'test-job-123',
        status: 'pending',
        progress: 25
      },
      completed: {
        id: 'test-job-123',
        status: 'completed',
        progress: 100,
        videoUrl: 'https://example.com/test-video.mp4'
      },
      failed: {
        id: 'test-job-123',
        status: 'failed',
        progress: 50,
        error: 'Video generation failed'
      }
    }
  }
}

/**
 * Utility to simulate user interactions
 */
export const userInteractions = {
  /**
   * Types text into an input with realistic delay
   */
  typeText: async (element: HTMLElement, text: string) => {
    const user = userEvent.setup()
    await user.type(element, text)
  },

  /**
   * Uploads a file to a file input
   */
  uploadFile: async (fileInput: HTMLElement, file: File) => {
    const user = userEvent.setup()
    await user.upload(fileInput, file)
  },

  /**
   * Submits a form
   */
  submitForm: async (form: HTMLElement) => {
    const user = userEvent.setup()
    const submitButton = form.querySelector('[type="submit"], button[form]') as HTMLElement
    if (submitButton) {
      await user.click(submitButton)
    }
  }
}

// Re-import vi from vitest for mocking
import { vi } from 'vitest'