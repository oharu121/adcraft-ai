# Testing Setup for Minimal Video Generator

## Overview

This project uses **Vitest** as the testing framework, which provides:
- Fast test execution with hot reloading
- Native TypeScript support
- Built-in coverage reporting
- Modern ESM support
- Vitest-native API with Jest compatibility

## Test Structure

```
tests/
├── setup.ts                    # Global test setup and mocks
├── utils/                      # Test utilities and helpers
│   ├── index.ts               # Main utilities and custom matchers
│   └── api-mocks.ts           # API mocking utilities
├── unit/                      # Unit tests
│   ├── components/            # Component tests
│   ├── lib/                   # Library/utility tests
│   └── utils/                 # Test utility tests
├── integration/               # Integration tests
└── e2e/                       # End-to-end tests
```

## Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Test Setup Features

### 1. Global Setup (`tests/setup.ts`)
- Extends Vitest's expect with testing-library/jest-dom matchers
- Mocks Next.js components (Image, router, etc.)
- Sets up global test environment
- Configures common test utilities

### 2. Test Utilities (`tests/utils/index.ts`)
- **renderWithProviders**: Custom render with locale support
- **createMockFn**: Utilities for creating mock functions
- **createTestData**: Factories for test data
- **customMatchers**: Custom expect matchers
- **userInteractions**: Helper functions for user events

### 3. API Mocking (`tests/utils/api-mocks.ts`)
- **ApiMocks**: Singleton class for API mocking
- Pre-configured mock responses for all endpoints
- Support for error scenarios and rate limiting
- Progressive status updates simulation

### 4. Custom Matchers

The following custom matchers are available:

```typescript
expect(element).toHaveLoadingSpinner()
expect(element).toBeInErrorState()
expect(element).toHaveValidationError()
```

## Writing Tests

### Component Tests

```typescript
import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen, userEvent } from '../../utils'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    renderWithProviders(<MyComponent />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('handles user interactions', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    renderWithProviders(<MyComponent onClick={handleClick} />)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### API Tests with Mocks

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { apiMocks } from '../../utils/api-mocks'

describe('Video Generation API', () => {
  beforeEach(() => {
    apiMocks.reset()
  })

  it('generates video successfully', async () => {
    apiMocks.mockGenerateVideoSuccess('test-job-123')
    
    const response = await fetch('/api/generate-video', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'test video' })
    })
    
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.jobId).toBe('test-job-123')
  })
})
```

### Service Layer Tests

```typescript
import { describe, it, expect, vi } from 'vitest'
import { MyService } from '@/lib/services/MyService'

// Mock external dependencies
vi.mock('@google-cloud/storage')

describe('MyService', () => {
  it('processes data correctly', async () => {
    const service = new MyService()
    const result = await service.processData('test input')
    
    expect(result).toMatchObject({
      success: true,
      data: expect.any(String)
    })
  })
})
```

## Coverage Configuration

Coverage is configured in `vitest.config.ts`:
- **Provider**: V8 (fast and accurate)
- **Threshold**: 80% for branches, functions, lines, and statements
- **Reports**: Text, LCOV, and HTML formats
- **Include**: All source files in app/, components/, lib/, hooks/
- **Exclude**: Test files, config files, node_modules

## Integration with Next.js

The test setup is optimized for Next.js 15 with:
- App Router support
- Server/Client component testing
- Internationalization testing
- API route testing
- Mock implementations for Next.js features

## Best Practices

1. **Test Structure**: Follow the AAA pattern (Arrange, Act, Assert)
2. **Mock External Dependencies**: Use vi.mock() for external APIs
3. **Use Test Utilities**: Leverage the provided utilities for consistency
4. **Coverage Goals**: Aim for 80%+ coverage, focus on critical paths
5. **Descriptive Names**: Use clear, descriptive test names
6. **Isolation**: Each test should be independent and isolated

## Troubleshooting

### Common Issues

1. **JSX in Setup Files**: Use React.createElement instead of JSX syntax
2. **Module Imports**: Ensure proper path aliases are configured
3. **Async Operations**: Use proper async/await and waitFor utilities
4. **Mock Cleanup**: Reset mocks in beforeEach hooks

### Performance Tips

1. Use `vi.mock()` at the top level for expensive modules
2. Prefer `screen` queries over `container` queries
3. Use `userEvent.setup()` for more realistic user interactions
4. Run tests in parallel (Vitest default behavior)

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Testing Library Jest-DOM Matchers](https://github.com/testing-library/jest-dom)
- [Next.js Testing Documentation](https://nextjs.org/docs/testing)