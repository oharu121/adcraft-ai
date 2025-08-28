# Developer Onboarding Guide

## Welcome to AdCraft AI! 🎬✨

This guide will help you get up and running with the AdCraft AI codebase, understand our development practices, and start contributing effectively to the project.

## Project Overview

AdCraft AI is an AI-powered video generation platform that transforms product images into professional commercials using Google's advanced AI services (Vertex AI, Veo). The application is built with Next.js, TypeScript, and deployed on Google Cloud Platform.

### Key Features
- **AI Video Generation**: Real AI video creation using Google DeepMind Veo
- **Interactive Chat**: Refine video concepts through natural language
- **Multi-language Support**: Full English/Japanese localization
- **Real-time Monitoring**: Comprehensive observability and alerting
- **Cost Management**: Built-in budget tracking and optimization
- **Enterprise Security**: Production-ready security and rate limiting

---

## Development Environment Setup

### Prerequisites

Before starting, ensure you have the following installed:

#### Required Software
- **Node.js**: v18.17.0 or later ([Download](https://nodejs.org/))
- **npm**: v9.0.0 or later (comes with Node.js)
- **Git**: Latest stable version ([Download](https://git-scm.com/))
- **Docker**: Latest stable version ([Download](https://www.docker.com/))
- **Google Cloud SDK**: Latest version ([Install Guide](https://cloud.google.com/sdk/docs/install))

#### Recommended Tools
- **Visual Studio Code**: For development ([Download](https://code.visualstudio.com/))
- **Postman**: For API testing ([Download](https://www.postman.com/))

#### Verification Commands
```bash
# Verify Node.js installation
node --version    # Should show v18.17.0 or higher
npm --version     # Should show v9.0.0 or higher

# Verify Git
git --version     # Should show latest stable

# Verify Docker
docker --version  # Should show latest stable

# Verify Google Cloud SDK
gcloud --version  # Should show latest SDK
```

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-org/adcraft-ai.git
cd adcraft-ai

# Create and switch to your feature branch
git checkout -b feature/your-feature-name
```

### Step 2: Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Verify installation
npm run build  # Should complete without errors
```

### Step 3: Environment Configuration

#### Create Development Environment File
```bash
# Copy environment template
cp .env.example .env.development

# Edit development environment
nano .env.development
```

#### Development Environment Variables
```bash
# .env.development
NODE_ENV=development
LOG_LEVEL=debug
GOOGLE_CLOUD_PROJECT=adcraft-dev-2025
BUDGET_LIMIT=50
RATE_LIMIT_ENABLED=false
MOCK_MODE_ENABLED=true
VEO_MOCK_ENABLED=true
GEMINI_MOCK_ENABLED=true
SECURITY_MONITORING_ENABLED=false
ADMIN_API_KEY=dev-admin-key-not-secure
```

### Step 4: Google Cloud Setup (Optional for Mock Mode)

For full development with real AI services:

```bash
# Login to Google Cloud
gcloud auth login
gcloud auth application-default login

# Set project
gcloud config set project adcraft-dev-2025

# Create service account for development
gcloud iam service-accounts create adcraft-dev \
  --display-name="AdCraft AI Development"

# Generate service account key
mkdir -p keys/
gcloud iam service-accounts keys create keys/dev-service-account.json \
  --iam-account=adcraft-dev@adcraft-dev-2025.iam.gserviceaccount.com

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/keys/dev-service-account.json"
```

**⚠️ Important**: Add `keys/` to `.gitignore` (already included). Never commit service account keys!

### Step 5: Start Development Server

```bash
# Start development server
npm run dev

# Application will be available at:
# - English: http://localhost:3000/en
# - Japanese: http://localhost:3000/ja
# - Health Check: http://localhost:3000/api/health
```

### Step 6: Verify Setup

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test admin dashboard (development)
curl -H "Authorization: Bearer dev-admin-key-not-secure" \
  http://localhost:3000/api/admin/monitoring

# Run tests
npm test

# All should pass with mock mode enabled
```

---

## Project Architecture

### Directory Structure

```
adcraft-ai/
├── app/                    # Next.js App Router (frontend + API routes)
│   ├── [locale]/          # Internationalized pages (en, ja)
│   ├── api/               # API endpoints
│   │   ├── generate-video/
│   │   ├── chat/refine/
│   │   ├── status/[jobId]/
│   │   ├── admin/
│   │   └── health/
│   └── globals.css        # Global styles
├── components/            # Reusable React components
│   ├── ui/               # Base UI components
│   ├── video-generator/  # Video generation specific components
│   └── layout/           # Layout components
├── lib/                  # Core application logic
│   ├── services/         # Service layer (15 services)
│   ├── utils/            # Utility functions
│   ├── hooks/            # Custom React hooks
│   └── types/            # TypeScript type definitions
├── dictionaries/         # Internationalization files
│   ├── en.json          # English translations
│   └── ja.json          # Japanese translations
├── infrastructure/      # Pulumi Infrastructure as Code
│   ├── index.ts         # Main Pulumi program
│   ├── storage.ts       # Cloud Storage configuration
│   ├── compute.ts       # Cloud Run configuration
│   └── monitoring.ts    # Monitoring setup
├── tests/               # Test files
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── utils/           # Test utilities
├── docs/                # Documentation
│   ├── api/             # API documentation
│   ├── technical/       # Technical documentation
│   ├── deployment/      # Deployment guides
│   └── troubleshooting/ # Troubleshooting guides
└── specs/               # Project specifications and planning
```

### Service Architecture

The application follows a service-oriented architecture with 15 core services:

#### AI & Generation Services
- **VertexAI Service**: Google Vertex AI integration (Gemini Pro Vision & Text)
- **Veo Service**: Google DeepMind Veo video generation
- **Prompt Refiner Service**: AI prompt optimization

#### Infrastructure Services
- **Cloud Storage Service**: File upload/download management
- **Firestore Service**: Database operations
- **Job Tracker Service**: Asynchronous job management

#### Monitoring & Observability
- **Logger Service**: Structured logging with correlation IDs
- **Metrics Service**: Performance and system metrics
- **Monitoring Service**: Health checks and system monitoring
- **Alerting Service**: Rule-based alerting
- **Cost Tracker Service**: Budget management

#### Security & Rate Limiting
- **Security Monitor Service**: Security event tracking
- **Rate Limiter Service**: API rate limiting

All services follow the **singleton pattern** and provide comprehensive error handling, logging, and metrics collection.

---

## Development Workflow

### 1. Feature Development Process

#### Creating a New Feature
```bash
# 1. Create feature branch
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# 2. Make your changes following code standards
# 3. Write tests for new functionality
# 4. Update documentation if needed

# 5. Run quality checks
npm run lint        # ESLint checks
npm run typecheck   # TypeScript checks
npm test           # Run test suite
npm run build      # Verify build works

# 6. Commit changes
git add .
git commit -m "feat: add new feature description"

# 7. Push branch
git push origin feature/your-feature-name

# 8. Create Pull Request
```

#### Code Quality Standards

We maintain high code quality through automated tools and manual reviews:

```bash
# Linting (ESLint + Prettier)
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues

# Type checking (TypeScript strict mode)
npm run typecheck     # Full type check

# Testing (Vitest + React Testing Library)
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report

# Build verification
npm run build         # Production build
```

#### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add video generation retry logic
fix: resolve memory leak in monitoring service
docs: update API documentation
style: format code with prettier
refactor: optimize service initialization
test: add integration tests for video workflow
chore: update dependencies
```

### 2. Testing Strategy

#### Test Categories

1. **Unit Tests**: Individual service and component testing
2. **Integration Tests**: End-to-end workflow testing
3. **Security Tests**: Security feature validation
4. **Performance Tests**: Load and stress testing

#### Writing Tests

##### Unit Test Example
```typescript
// tests/unit/services/cost-tracker.test.ts
import { describe, test, expect, beforeEach } from 'vitest';
import { CostTracker } from '@/lib/services/cost-tracker';

describe('CostTracker', () => {
  let costTracker: CostTracker;

  beforeEach(() => {
    costTracker = CostTracker.getInstance();
  });

  test('should track cost correctly', () => {
    costTracker.trackCost('vertex-ai', 'text-generation', 0.25);
    
    const budget = costTracker.getBudgetStatus();
    expect(budget.currentSpend).toBe(0.25);
  });

  test('should trigger alert at 90% threshold', () => {
    // Test implementation
  });
});
```

##### Integration Test Example
```typescript
// tests/integration/video-generation.test.ts
import { describe, test, expect } from 'vitest';
import request from 'supertest';
import { app } from '@/app';

describe('Video Generation Workflow', () => {
  test('should generate video successfully', async () => {
    const response = await request(app)
      .post('/api/generate-video')
      .send({
        productName: 'Test Product',
        targetAudience: 'Test Audience',
        keyMessage: 'Test Message'
      });

    expect(response.status).toBe(200);
    expect(response.body.jobId).toBeDefined();
  }, 30000); // 30 second timeout
});
```

### 3. Code Style and Standards

#### TypeScript Standards
- **Strict Mode**: All TypeScript strict flags enabled
- **Type Definitions**: Comprehensive interfaces for all data
- **Error Handling**: Custom error classes with proper typing
- **Validation**: Runtime validation with Zod schemas

#### React/Next.js Standards
- **Server Components**: Use Server Components by default
- **Client Components**: Use 'use client' only when necessary
- **Error Boundaries**: Implement error boundaries for robustness
- **Performance**: Optimize with React.memo, useMemo, useCallback

#### Service Standards
- **Singleton Pattern**: All services use singleton instances
- **Error Handling**: Comprehensive try-catch with logging
- **Metrics**: Track performance metrics for all operations
- **Health Checks**: Implement health check methods

#### Example Service Implementation
```typescript
// lib/services/example-service.ts
import { Logger } from './logger';
import { MetricsService } from './metrics';

export class ExampleService {
  private static instance: ExampleService;
  private logger = Logger.getInstance();
  private metrics = MetricsService.getInstance();

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): ExampleService {
    if (!ExampleService.instance) {
      ExampleService.instance = new ExampleService();
    }
    return ExampleService.instance;
  }

  async performOperation(data: string): Promise<string> {
    const correlationId = this.logger.generateCorrelationId();
    const startTime = Date.now();

    try {
      this.logger.info('Operation started', { correlationId, data });

      // Perform operation
      const result = await this.processData(data);

      const duration = Date.now() - startTime;
      this.logger.info('Operation completed', { correlationId, duration });
      this.metrics.recordCustomMetric('example_operation_duration', duration);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Operation failed', { correlationId, duration }, error);
      this.metrics.recordCustomMetric('example_operation_error', 1);
      throw error;
    }
  }

  private async processData(data: string): Promise<string> {
    // Implementation
    return `processed: ${data}`;
  }

  healthCheck(): boolean {
    return true; // Implement actual health check
  }
}
```

---

## Common Development Tasks

### Adding a New API Endpoint

1. **Create the API route**:
```typescript
// app/api/your-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Logger } from '@/lib/services/logger';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const logger = Logger.getInstance();
  const correlationId = logger.generateCorrelationId();

  try {
    const body = await request.json();
    
    // Validate input with Zod schema
    const validatedData = YourSchema.parse(body);

    // Process request
    const result = await processRequest(validatedData);

    return NextResponse.json({
      success: true,
      data: result,
      correlationId
    });

  } catch (error) {
    logger.error('API endpoint error', { correlationId }, error);
    
    return NextResponse.json({
      error: 'Internal server error',
      correlationId
    }, { status: 500 });
  }
}
```

2. **Add input validation schema**:
```typescript
// lib/utils/validation.ts
import { z } from 'zod';

export const YourSchema = z.object({
  field1: z.string().min(1).max(100),
  field2: z.number().positive(),
  field3: z.boolean().optional()
});

export type YourType = z.infer<typeof YourSchema>;
```

3. **Write tests**:
```typescript
// tests/integration/your-endpoint.test.ts
describe('/api/your-endpoint', () => {
  test('should handle valid request', async () => {
    const response = await request(app)
      .post('/api/your-endpoint')
      .send(validData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

4. **Update API documentation**:
```yaml
# docs/api/openapi.yaml
/your-endpoint:
  post:
    summary: Your endpoint description
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/YourSchema'
    responses:
      '200':
        description: Success response
```

### Adding a New Service

1. **Create service file**:
```typescript
// lib/services/your-service.ts
export class YourService {
  private static instance: YourService;
  private logger = Logger.getInstance();

  private constructor() {}

  static getInstance(): YourService {
    if (!YourService.instance) {
      YourService.instance = new YourService();
    }
    return YourService.instance;
  }

  async yourMethod(): Promise<void> {
    // Implementation with logging and error handling
  }

  healthCheck(): boolean {
    return true;
  }
}
```

2. **Export from services index**:
```typescript
// lib/services/index.ts
export { YourService } from './your-service';
```

3. **Write comprehensive tests**:
```typescript
// tests/unit/services/your-service.test.ts
describe('YourService', () => {
  test('should be singleton', () => {
    const instance1 = YourService.getInstance();
    const instance2 = YourService.getInstance();
    expect(instance1).toBe(instance2);
  });
});
```

### Adding UI Components

1. **Create component with proper typing**:
```typescript
// components/your-component.tsx
import { FC } from 'react';

interface YourComponentProps {
  title: string;
  optional?: boolean;
  onClick: () => void;
}

export const YourComponent: FC<YourComponentProps> = ({
  title,
  optional = false,
  onClick
}) => {
  return (
    <div className="your-component">
      <h2>{title}</h2>
      {optional && <p>Optional content</p>}
      <button onClick={onClick}>Click me</button>
    </div>
  );
};
```

2. **Write component tests**:
```typescript
// tests/unit/components/your-component.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { YourComponent } from '@/components/your-component';

describe('YourComponent', () => {
  test('should render correctly', () => {
    const handleClick = vi.fn();
    
    render(
      <YourComponent 
        title="Test Title" 
        onClick={handleClick} 
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

### Internationalization

1. **Add translations**:
```json
// dictionaries/en.json
{
  "yourFeature": {
    "title": "Your Feature",
    "description": "Feature description"
  }
}
```

```json
// dictionaries/ja.json
{
  "yourFeature": {
    "title": "あなたの機能",
    "description": "機能の説明"
  }
}
```

2. **Use translations in components**:
```typescript
// components/your-component.tsx
import { useTranslations } from 'next-intl';

export const YourComponent = () => {
  const t = useTranslations('yourFeature');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
};
```

---

## Debugging and Development Tools

### Local Development Tools

#### VS Code Extensions (Recommended)
```json
// .vscode/extensions.json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json"
  ]
}
```

#### VS Code Settings
```json
// .vscode/settings.json
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
```

### Debugging Techniques

#### Server-side Debugging
```typescript
// Use logger for debugging
const logger = Logger.getInstance();

logger.debug('Debug information', {
  variable1: value1,
  variable2: value2,
  correlationId: req.correlationId
});
```

#### Client-side Debugging
```typescript
// Use proper error boundaries
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary
  FallbackComponent={ErrorFallback}
  onError={(error, errorInfo) => {
    console.error('React Error:', error, errorInfo);
  }}
>
  <YourComponent />
</ErrorBoundary>
```

#### API Testing with curl
```bash
# Test video generation endpoint
curl -X POST http://localhost:3000/api/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Test Product",
    "targetAudience": "Test Audience",
    "keyMessage": "Test Message"
  }'

# Test admin endpoints
curl -H "Authorization: Bearer dev-admin-key-not-secure" \
  http://localhost:3000/api/admin/monitoring
```

---

## Contributing Guidelines

### Pull Request Process

1. **Fork the Repository** (for external contributors)
2. **Create Feature Branch**: `git checkout -b feature/your-feature`
3. **Make Changes**: Follow coding standards and write tests
4. **Quality Checks**: Ensure all checks pass
5. **Commit**: Use conventional commit messages
6. **Push**: Push your feature branch
7. **Create Pull Request**: Use the PR template
8. **Code Review**: Address feedback from reviewers
9. **Merge**: Maintainer will merge after approval

### Pull Request Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that causes existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] New tests added for new functionality

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No breaking changes without migration guide
```

### Code Review Guidelines

#### For Reviewers
- **Be Constructive**: Provide helpful feedback and suggestions
- **Check Logic**: Verify business logic is correct
- **Test Coverage**: Ensure adequate test coverage
- **Security**: Review for security implications
- **Performance**: Consider performance impact
- **Documentation**: Verify documentation is updated

#### For Authors
- **Self-Review**: Review your own PR before requesting review
- **Small PRs**: Keep PRs focused and reasonably sized
- **Tests**: Include comprehensive tests
- **Documentation**: Update relevant documentation
- **Response**: Respond to feedback promptly and professionally

### Issue Reporting

#### Bug Reports
Use this template for bug reports:

```markdown
**Bug Description**
A clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., macOS, Windows]
- Browser: [e.g., Chrome, Safari]
- Version: [e.g., 1.0.0]

**Additional Context**
Any other context about the problem.
```

#### Feature Requests
```markdown
**Feature Description**
A clear description of the feature you'd like to see.

**Problem Statement**
What problem does this solve?

**Proposed Solution**
Describe your solution.

**Alternatives Considered**
Other solutions you've considered.

**Additional Context**
Any other context or screenshots.
```

---

## Getting Help

### Resources
- **Documentation**: Check the `/docs` directory first
- **API Reference**: See `/docs/api/openapi.yaml`
- **Troubleshooting**: Check `/docs/troubleshooting/common-issues.md`
- **Architecture**: Review `/docs/technical/services-architecture.md`

### Communication Channels
- **Issues**: GitHub Issues for bugs and feature requests
- **Discussions**: GitHub Discussions for questions and ideas
- **Email**: Contact maintainers for sensitive issues

### Development Support

#### Common Questions
1. **"How do I run tests?"** - Use `npm test` for all tests, `npm run test:watch` for watch mode
2. **"How do I debug API calls?"** - Check logs with correlation IDs, use admin dashboard
3. **"How do I add a new service?"** - Follow the service pattern in existing services
4. **"How do I handle errors?"** - Use structured logging and proper error boundaries

#### Best Practices Reminders
- Always use TypeScript strict mode
- Write tests for new functionality
- Use the singleton pattern for services
- Include correlation IDs in all logs
- Follow the established error handling patterns
- Update documentation for user-facing changes

---

## Next Steps

### After Initial Setup
1. **Explore the Codebase**: Familiarize yourself with the service architecture
2. **Run the Tests**: Understand the testing patterns
3. **Try the APIs**: Use the admin dashboard and main application
4. **Read the Architecture**: Review the technical documentation
5. **Start Contributing**: Pick up a good first issue

### Learning Path
1. **Week 1**: Environment setup, run application, understand basic flows
2. **Week 2**: Deep dive into service architecture, write first test
3. **Week 3**: Make first contribution (bug fix or small feature)
4. **Week 4**: Understand deployment process, monitoring, and alerts

### Advanced Topics
- **Infrastructure as Code**: Learn Pulumi for infrastructure changes
- **Google Cloud Services**: Deep dive into Vertex AI, Veo, and other GCP services
- **Performance Optimization**: Learn about caching, rate limiting, and scaling
- **Security**: Understand the security architecture and monitoring

Welcome to the team! We're excited to have you contributing to AdCraft AI. If you have any questions, don't hesitate to ask. Happy coding! 🚀