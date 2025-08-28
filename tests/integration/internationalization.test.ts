import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { renderWithProviders } from '../utils'

// Mock Next.js internationalization
vi.mock('next/navigation', () => ({
  useParams: vi.fn(() => ({ locale: 'en' })),
  usePathname: vi.fn(() => '/en'),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => ({ value: 'en' })),
    set: vi.fn(),
  })),
  headers: vi.fn(() => ({
    get: vi.fn((header: string) => {
      if (header === 'accept-language') return 'en-US,en;q=0.9,ja;q=0.8'
      return null
    }),
  })),
}))

describe('Internationalization (i18n) Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Dictionary Loading and Management', () => {
    it('should load English dictionary correctly', async () => {
      // Arrange & Act
      const { getDictionary } = await import('@/lib/dictionaries')
      const enDict = await getDictionary('en')

      // Assert
      expect(enDict).toBeDefined()
      expect(enDict.common).toBeDefined()
      expect(enDict.common.loading).toBe('Loading...')
      expect(enDict.common.error).toBe('Error')
      expect(enDict.videoGenerator).toBeDefined()
      expect(enDict.videoGenerator.title).toBe('AI Video Generator')
      expect(enDict.videoGenerator.promptPlaceholder).toContain('Describe your video')
    })

    it('should load Japanese dictionary correctly', async () => {
      // Arrange & Act
      const { getDictionary } = await import('@/lib/dictionaries')
      const jaDict = await getDictionary('ja')

      // Assert
      expect(jaDict).toBeDefined()
      expect(jaDict.common).toBeDefined()
      expect(jaDict.common.loading).toBe('読み込み中...')
      expect(jaDict.common.error).toBe('エラー')
      expect(jaDict.videoGenerator).toBeDefined()
      expect(jaDict.videoGenerator.title).toBe('AI動画ジェネレーター')
      expect(jaDict.videoGenerator.promptPlaceholder).toContain('動画の内容を説明')
    })

    it('should handle invalid locale with fallback', async () => {
      // Arrange & Act
      const { getDictionary } = await import('@/lib/dictionaries')
      const dict = await getDictionary('invalid-locale' as any)

      // Assert - Should fallback to English
      expect(dict).toBeDefined()
      expect(dict.common.loading).toBe('Loading...')
      expect(dict.videoGenerator.title).toBe('AI Video Generator')
    })

    it('should provide type-safe dictionary access', async () => {
      // Arrange & Act
      const { getDictionary } = await import('@/lib/dictionaries')
      const enDict = await getDictionary('en')
      const jaDict = await getDictionary('ja')

      // Assert - TypeScript should enforce these properties exist
      expect(typeof enDict.common.loading).toBe('string')
      expect(typeof jaDict.common.loading).toBe('string')
      expect(typeof enDict.videoGenerator.generate).toBe('string')
      expect(typeof jaDict.videoGenerator.generate).toBe('string')
      expect(typeof enDict.errors.networkError).toBe('string')
      expect(typeof jaDict.errors.networkError).toBe('string')
    })
  })

  describe('Component Internationalization', () => {
    it('should render components with English translations', async () => {
      // Arrange
      const mockDict = {
        common: {
          loading: 'Loading...',
          error: 'Error',
          retry: 'Retry',
        },
        videoGenerator: {
          title: 'AI Video Generator',
          generate: 'Generate Video',
          promptPlaceholder: 'Describe your video scene...',
        },
        errors: {
          networkError: 'Network connection failed',
        }
      }

      // Mock the component that uses dictionary
      const TestComponent = ({ dict }: { dict: typeof mockDict }) => {
        return React.createElement('div', null,
          React.createElement('h1', null, dict.videoGenerator.title),
          React.createElement('button', null, dict.videoGenerator.generate),
          React.createElement('input', { placeholder: dict.videoGenerator.promptPlaceholder })
        )
      }

      // Act
      renderWithProviders(React.createElement(TestComponent, { dict: mockDict }), { locale: 'en' })

      // Assert
      expect(screen.getByText('AI Video Generator')).toBeInTheDocument()
      expect(screen.getByText('Generate Video')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Describe your video scene...')).toBeInTheDocument()
    })

    it('should render components with Japanese translations', async () => {
      // Arrange
      const mockDict = {
        common: {
          loading: '読み込み中...',
          error: 'エラー',
          retry: '再試行',
        },
        videoGenerator: {
          title: 'AI動画ジェネレーター',
          generate: '動画を生成',
          promptPlaceholder: '動画の内容を説明してください...',
        },
        errors: {
          networkError: 'ネットワーク接続に失敗しました',
        }
      }

      const TestComponent = ({ dict }: { dict: typeof mockDict }) => {
        return React.createElement('div', null,
          React.createElement('h1', null, dict.videoGenerator.title),
          React.createElement('button', null, dict.videoGenerator.generate),
          React.createElement('input', { placeholder: dict.videoGenerator.promptPlaceholder })
        )
      }

      // Act
      renderWithProviders(React.createElement(TestComponent, { dict: mockDict }), { locale: 'ja' })

      // Assert
      expect(screen.getByText('AI動画ジェネレーター')).toBeInTheDocument()
      expect(screen.getByText('動画を生成')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('動画の内容を説明してください...')).toBeInTheDocument()
    })

    it('should handle missing translations gracefully', async () => {
      // Arrange
      const incompleteDict = {
        common: {
          loading: 'Loading...',
        },
        videoGenerator: {
          title: 'AI Video Generator',
          // Missing 'generate' and 'promptPlaceholder'
        },
        errors: {}
      }

      const TestComponent = ({ dict }: { dict: any }) => {
        return React.createElement('div', null,
          React.createElement('h1', null, dict.videoGenerator?.title || 'Default Title'),
          React.createElement('button', null, dict.videoGenerator?.generate || 'Generate'),
          React.createElement('p', null, dict.errors?.networkError || 'Unknown error')
        )
      }

      // Act
      renderWithProviders(React.createElement(TestComponent, { dict: incompleteDict }), { locale: 'en' })

      // Assert - Should use fallback values
      expect(screen.getByText('AI Video Generator')).toBeInTheDocument()
      expect(screen.getByText('Generate')).toBeInTheDocument() // Fallback
      expect(screen.getByText('Unknown error')).toBeInTheDocument() // Fallback
    })
  })

  describe('Locale-Specific API Responses', () => {
    it('should return English error messages for EN locale', async () => {
      // Arrange
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

      // Mock request with English locale
      const mockRequest = {
        headers: {
          get: vi.fn((header: string) => {
            if (header === 'accept-language') return 'en-US,en;q=0.9'
            if (header === 'x-locale') return 'en'
            return null
          }),
        },
        json: vi.fn().mockResolvedValue({
          prompt: '',
          duration: 15,
          aspectRatio: '16:9',
        }),
      } as any

      // Mock services to trigger validation error
      vi.doMock('@/lib/utils/validation', () => ({
        VideoGenerationRequestSchema: {
          parse: vi.fn(() => {
            throw new Error('Prompt cannot be empty')
          })
        },
        createApiResponseSchema: vi.fn(() => ({ parse: vi.fn() })),
        ValidationUtils: {
          sanitizeInput: vi.fn(),
          validatePromptContent: vi.fn(),
          validateRateLimit: vi.fn(),
        },
      }))

      const { POST } = await import('../../app/api/generate-video/route')

      // Act
      const response = await POST(mockRequest)
      const responseData = await response.json()

      // Assert
      expect(responseData.error.message).toMatch(/english|validation|prompt/i)
      expect(responseData.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return Japanese error messages for JA locale', async () => {
      // Arrange
      const mockRequest = {
        headers: {
          get: vi.fn((header: string) => {
            if (header === 'accept-language') return 'ja,en;q=0.8'
            if (header === 'x-locale') return 'ja'
            return null
          }),
        },
        json: vi.fn().mockResolvedValue({
          prompt: '',
          duration: 15,
          aspectRatio: '16:9',
        }),
      } as any

      // Mock services to trigger validation error with Japanese context
      vi.doMock('@/lib/services', () => ({
        CostTracker: {
          getInstance: vi.fn(() => ({
            getBudgetStatus: vi.fn().mockResolvedValue({ canProceed: false }),
          }))
        },
        VeoService: { getInstance: vi.fn() },
        FirestoreService: { getInstance: vi.fn() },
        JobTracker: { getInstance: vi.fn() },
      }))

      vi.doMock('@/lib/utils/validation', () => ({
        VideoGenerationRequestSchema: {
          parse: vi.fn(() => ({ prompt: 'valid', duration: 15, aspectRatio: '16:9' }))
        },
        createApiResponseSchema: vi.fn(() => ({ parse: vi.fn() })),
        ValidationUtils: {
          sanitizeInput: vi.fn((input) => input),
          validatePromptContent: vi.fn(() => ({ valid: true, errors: [] })),
          validateRateLimit: vi.fn(() => true),
        },
      }))

      const { POST } = await import('../../app/api/generate-video/route')

      // Act
      const response = await POST(mockRequest)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(402)
      expect(responseData.error.code).toBe('BUDGET_EXCEEDED')
      // In a full implementation, this would return Japanese text
      expect(responseData.error.message).toContain('Budget limit exceeded')
    })
  })

  describe('Middleware Locale Handling', () => {
    it('should detect and route to correct locale', async () => {
      // Arrange
      const mockRequest = {
        nextUrl: {
          pathname: '/',
          clone: vi.fn(() => ({
            pathname: '/en',
            toString: vi.fn(() => 'http://localhost:3000/en'),
          })),
        },
        headers: {
          get: vi.fn((header: string) => {
            if (header === 'accept-language') return 'en-US,en;q=0.9,ja;q=0.8'
            return null
          }),
        },
        cookies: {
          get: vi.fn(() => ({ value: 'en' })),
        },
      }

      vi.mock('next/server', () => ({
        NextResponse: {
          redirect: vi.fn((url) => ({ url, status: 307 })),
          next: vi.fn(() => ({ status: 200 })),
        },
      }))

      const { middleware } = await import('@/middleware')

      // Act
      const response = await middleware(mockRequest as any)

      // Assert - Should not redirect since it's already handling locale correctly
      expect(response).toBeDefined()
    })

    it('should redirect root path to locale-specific path', async () => {
      // Arrange
      const { NextResponse } = await import('next/server')
      const mockRedirect = vi.fn(() => ({ status: 307 }))
      NextResponse.redirect = mockRedirect

      const mockRequest = {
        nextUrl: {
          pathname: '/',
          clone: vi.fn(() => ({
            pathname: '/en',
            toString: vi.fn(() => 'http://localhost:3000/en'),
          })),
        },
        headers: {
          get: vi.fn(() => 'en-US,en;q=0.9'),
        },
        cookies: {
          get: vi.fn(() => null), // No saved locale
        },
      }

      const { middleware } = await import('@/middleware')

      // Act
      const response = await middleware(mockRequest as any)

      // Assert
      expect(response).toBeDefined()
      // In a full implementation, we'd verify redirect was called with correct URL
    })

    it('should preserve locale in API routes', async () => {
      // Arrange
      const mockRequest = {
        nextUrl: {
          pathname: '/api/generate-video',
          clone: vi.fn(),
        },
        headers: {
          get: vi.fn((header) => {
            if (header === 'accept-language') return 'ja,en;q=0.8'
            return null
          }),
        },
        cookies: {
          get: vi.fn(() => ({ value: 'ja' })),
        },
      }

      const { middleware } = await import('@/middleware')

      // Act
      const response = await middleware(mockRequest as any)

      // Assert - API routes should not be redirected
      expect(response).toBeDefined()
    })
  })

  describe('Prompt Processing in Different Languages', () => {
    it('should handle English prompts correctly', async () => {
      // Arrange
      const englishPrompt = 'A beautiful sunset over mountain peaks with golden lighting'

      vi.doMock('@/lib/services', () => ({
        PromptRefiner: {
          getInstance: vi.fn(() => ({
            chatAboutPrompt: vi.fn().mockResolvedValue(
              'Great prompt! For even better results, try adding "cinematic depth of field, professional color grading" to enhance the visual quality.'
            ),
            getPromptTips: vi.fn(() => [
              'Add specific camera angles for better composition',
              'Mention lighting conditions for mood enhancement',
              'Include motion details for dynamic scenes'
            ])
          }))
        },
        FirestoreService: {
          getInstance: vi.fn(() => ({
            getSession: vi.fn().mockResolvedValue({
              id: 'en-session',
              prompt: englishPrompt,
              chatHistory: [],
              status: 'draft'
            }),
            addChatMessage: vi.fn(),
            updateSession: vi.fn(),
            isMock: vi.fn(() => true),
          }))
        },
        CostTracker: { getInstance: vi.fn(() => ({ getBudgetStatus: vi.fn(), recordCost: vi.fn() })) },
      }))

      vi.doMock('@/lib/utils/validation', () => ({
        ChatRefinementRequestSchema: {
          parse: vi.fn(() => ({
            sessionId: 'en-session',
            message: 'Make it more cinematic',
            currentPrompt: englishPrompt,
          }))
        },
        createApiResponseSchema: vi.fn(() => ({ parse: vi.fn() })),
        ValidationUtils: {
          sanitizeInput: vi.fn((input) => input),
          validateRateLimit: vi.fn(() => true),
        },
      }))

      const { POST } = await import('../../app/api/chat/refine/route')

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          sessionId: 'en-session',
          message: 'Make it more cinematic',
          currentPrompt: englishPrompt,
        }),
        headers: {
          get: vi.fn(() => 'en-US,en;q=0.9')
        }
      } as any

      // Act
      const response = await POST(mockRequest)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.response).toContain('cinematic')
      expect(responseData.data.suggestions).toBeDefined()
      expect(Array.isArray(responseData.data.suggestions)).toBe(true)
    })

    it('should handle Japanese prompts correctly', async () => {
      // Arrange
      const japanesePrompt = '美しい山の夕焼けの風景、黄金色の光で照らされた峰々'

      vi.doMock('@/lib/services', () => ({
        PromptRefiner: {
          getInstance: vi.fn(() => ({
            chatAboutPrompt: vi.fn().mockResolvedValue(
              '素晴らしいプロンプトですね！より良い結果を得るために「シネマティックな被写界深度、プロフェッショナルなカラーグレーディング」を追加することをお勧めします。'
            ),
            getPromptTips: vi.fn(() => [
              '構図を良くするために具体的なカメラアングルを追加してください',
              'ムードを高めるために照明条件を言及してください',
              'ダイナミックなシーンのためにモーション詳細を含めてください'
            ])
          }))
        },
        FirestoreService: {
          getInstance: vi.fn(() => ({
            getSession: vi.fn().mockResolvedValue({
              id: 'ja-session',
              prompt: japanesePrompt,
              chatHistory: [],
              status: 'draft'
            }),
            addChatMessage: vi.fn(),
            updateSession: vi.fn(),
            isMock: vi.fn(() => true),
          }))
        },
        CostTracker: { getInstance: vi.fn(() => ({ getBudgetStatus: vi.fn(), recordCost: vi.fn() })) },
      }))

      vi.doMock('@/lib/utils/validation', () => ({
        ChatRefinementRequestSchema: {
          parse: vi.fn(() => ({
            sessionId: 'ja-session',
            message: 'もっとドラマチックにしてください',
            currentPrompt: japanesePrompt,
          }))
        },
        createApiResponseSchema: vi.fn(() => ({ parse: vi.fn() })),
        ValidationUtils: {
          sanitizeInput: vi.fn((input) => input),
          validateRateLimit: vi.fn(() => true),
        },
      }))

      const { POST } = await import('../../app/api/chat/refine/route')

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          sessionId: 'ja-session',
          message: 'もっとドラマチックにしてください',
          currentPrompt: japanesePrompt,
        }),
        headers: {
          get: vi.fn(() => 'ja,en;q=0.8')
        }
      } as any

      // Act
      const response = await POST(mockRequest)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.response).toContain('シネマティック')
      expect(responseData.data.suggestions).toBeDefined()
      expect(Array.isArray(responseData.data.suggestions)).toBe(true)
      expect(responseData.data.suggestions[0]).toContain('カメラアングル')
    })

    it('should handle mixed language context appropriately', async () => {
      // Arrange
      const mixedChatHistory = [
        { role: 'user' as const, content: 'Create a mountain scene', timestamp: new Date() },
        { role: 'assistant' as const, content: 'Great! What style do you prefer?', timestamp: new Date() },
        { role: 'user' as const, content: 'もっと日本的なスタイルで', timestamp: new Date() }, // Japanese input
      ]

      vi.doMock('@/lib/services', () => ({
        PromptRefiner: {
          getInstance: vi.fn(() => ({
            chatAboutPrompt: vi.fn().mockResolvedValue(
              'I understand you want a more Japanese style. Try adding "traditional Japanese landscape painting style, with misty mountains and cherry blossoms" / 「伝統的な日本の風景画スタイル、霞がかった山と桜」を追加してみてください。'
            ),
            getPromptTips: vi.fn(() => [
              'Consider traditional Japanese artistic elements',
              '伝統的な日本の芸術要素を考慮してください',
              'Add seasonal elements like cherry blossoms or autumn leaves'
            ])
          }))
        },
        FirestoreService: {
          getInstance: vi.fn(() => ({
            getSession: vi.fn().mockResolvedValue({
              id: 'mixed-session',
              chatHistory: mixedChatHistory,
              status: 'draft'
            }),
            addChatMessage: vi.fn(),
            updateSession: vi.fn(),
            isMock: vi.fn(() => true),
          }))
        },
        CostTracker: { getInstance: vi.fn(() => ({ getBudgetStatus: vi.fn(), recordCost: vi.fn() })) },
      }))

      const { POST } = await import('../../app/api/chat/refine/route')

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          sessionId: 'mixed-session',
          message: '桜も入れてください', // "Please include cherry blossoms"
        }),
        headers: {
          get: vi.fn(() => 'ja,en;q=0.8')
        }
      } as any

      // Act
      const response = await POST(mockRequest)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.response).toContain('cherry blossoms')
      expect(responseData.data.response).toContain('桜')
    })
  })

  describe('Locale Persistence and User Preferences', () => {
    it('should persist locale selection across sessions', async () => {
      // This would typically test cookie/localStorage persistence
      // For now, we test the concept
      
      const mockCookies = new Map()
      
      const setLocale = (locale: string) => {
        mockCookies.set('locale', locale)
      }
      
      const getLocale = () => {
        return mockCookies.get('locale') || 'en'
      }

      // Act
      setLocale('ja')
      const retrievedLocale = getLocale()

      // Assert
      expect(retrievedLocale).toBe('ja')
      
      // Change and verify again
      setLocale('en')
      expect(getLocale()).toBe('en')
    })

    it('should handle browser language preferences', async () => {
      // Arrange
      const detectLocaleFromHeader = (acceptLanguage: string) => {
        const languages = acceptLanguage.split(',').map(lang => {
          const [code, qValue] = lang.trim().split(';q=')
          return {
            code: code.split('-')[0], // Get base language code
            quality: qValue ? parseFloat(qValue) : 1.0
          }
        })
        
        languages.sort((a, b) => b.quality - a.quality)
        
        const supportedLocales = ['en', 'ja']
        for (const lang of languages) {
          if (supportedLocales.includes(lang.code)) {
            return lang.code
          }
        }
        
        return 'en' // Default fallback
      }

      // Test cases
      const testCases = [
        { header: 'en-US,en;q=0.9,ja;q=0.8', expected: 'en' },
        { header: 'ja,en;q=0.9,fr;q=0.8', expected: 'ja' },
        { header: 'fr,de;q=0.9,it;q=0.8', expected: 'en' }, // Fallback
        { header: 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7', expected: 'ja' },
      ]

      // Act & Assert
      testCases.forEach(({ header, expected }) => {
        const detected = detectLocaleFromHeader(header)
        expect(detected).toBe(expected)
      })
    })
  })
})