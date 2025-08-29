import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Declare jest-dom matchers for TypeScript
declare module 'vitest' {
  interface Assertion<T = any> extends jest.Matchers<void, T> {
    toBeInTheDocument(): T
    toBeDisabled(): T
    toHaveClass(className: string): T
    toHaveAttribute(attr: string, value?: string): T
    toHaveTextContent(text: string): T
    toHaveAccessibleName(name?: string): T
    toHaveFocus(): T
  }
}

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  })),
  usePathname: vi.fn(() => '/en'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useParams: vi.fn(() => ({ locale: 'en' })),
  notFound: vi.fn(),
  redirect: vi.fn(),
}))

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: (props: any) => {
    return {
      $$typeof: Symbol.for('react.element'),
      type: 'img',
      props: props,
      key: null,
      ref: null,
    }
  },
}))

// Mock environment variables
vi.stubEnv('NODE_ENV', 'test')

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock console methods in test environment
global.console = {
  ...console,
  // Uncomment to silence logs during tests
  // log: vi.fn(),
  // debug: vi.fn(),
  // info: vi.fn(),
  // warn: vi.fn(),
  // error: vi.fn(),
}