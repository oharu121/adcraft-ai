---
title: Technology Stack
description: "Comprehensive technology stack, architecture patterns, and implementation standards for the  AdCraft AI system."
inclusion: always
---

# Technology Stack - AdCraft AI

## Core Technology Stack

### Frontend Stack

- **Framework**: Next.js 15.5.0 with App Router (TypeScript)
- **Language**: TypeScript 5.x (strict mode enabled)
- **Styling**: Tailwind CSS 4.x with PostCSS
- **Components**: React 19.1.0 + Lucide React icons
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion 12.x
- **Real-Time**: Server-Sent Events (SSE) client for real-time updates
- **Internationalization**: next-intl 4.3.5 for bilingual support (Japanese/English)

### Backend Stack

- **Runtime**: Node.js 18+ via Next.js API Routes
- **Framework**: Next.js API Routes with App Router pattern
- **Language**: TypeScript (strict mode)
- **Real-Time**: Server-Sent Events (SSE) API endpoints for agent chat
- **File Processing**: Sharp 0.34.3 for image optimization
- **Validation**: Zod 4.1.1 for runtime type validation

### Google Cloud Platform Services (MANDATORY)

- **Vertex AI Gemini Pro Vision**: Product image analysis and chat conversations
- **Imagen API**: Visual asset generation for commercials
- **Veo API**: Final commercial video generation
- **Text-to-Speech API**: Narration generation in multiple languages
- **Cloud Storage**: Media file storage with signed URLs
- **Firestore**: Session state and chat history persistence
- **Cloud Run**: Primary deployment platform (REQUIRED for hackathon judging)
- **Cloud Functions**: Heavy processing tasks and background jobs
- **Cloud Monitoring**: Cost tracking and performance monitoring

### Development Tools

- **Testing**: Vitest 3.x + Testing Library + Playwright for E2E
- **Code Quality**: ESLint 9.x + Prettier 3.6.2 + TypeScript compiler
- **Build Tools**: Next.js Turbopack for development and production builds
- **Package Manager**: npm with package-lock.json for consistency
- **Version Control**: Git with conventional commit messages

## Architecture Patterns

### Multi-Agent System Design

```typescript
// Agent Module Structure Pattern
lib/agents/{agent-name}/
├── agent.ts          // Main agent logic and orchestration
├── tools.ts          // Agent-specific tools and API integrations
├── prompts.ts        // Bilingual system prompts and templates
├── types.ts          // Agent-specific TypeScript types
└── index.ts          // Public exports and interface
```

### API Architecture Pattern

```typescript
// Next.js App Router API Pattern
app / api / agents / [agentType] / route.ts;

export async function POST(
  request: Request,
  { params }: { params: { agentType: string } }
) {
  // 1. Authentication and validation
  // 2. Route to appropriate agent
  // 3. Process with error handling
  // 4. Return structured response with cost tracking
}
```

### Server-Sent Events (SSE) Integration Pattern

```typescript
// Real-time chat with session persistence
export class AgentChatHandler {
  async handleUserMessage(socket: Socket, message: UserMessage) {
    // 1. Validate session and user input
    // 2. Route to current agent in pipeline
    // 3. Process with cost and time tracking
    // 4. Emit response with typing indicators
    // 5. Update session state in Firestore
  }
}
```

### Error Handling Pattern

```typescript
// Consistent error handling across all services
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
    public cost: number = 0
  ) {
    super(message);
  }
}

// Usage in agents
try {
  const result = await this.vertexAI.analyzeImage(imageUrl);
} catch (error) {
  if (error.retryable && retryCount < 3) {
    // Exponential backoff retry
  } else {
    // Fallback to basic analysis
  }
}
```

## Critical Technical Requirements

### Google Cloud Integration

- **Authentication**: Service account credentials (NEVER expose in frontend)
- **Endpoint Format**: `{location}-aiplatform.googleapis.com` for all Vertex AI calls
- **API Versions**: Use latest stable versions for all GCP APIs
- **Rate Limiting**: Implement exponential backoff for quota management
- **Cost Tracking**: Real-time monitoring of API usage costs

### Performance Requirements

- **API Response Times**: <2 seconds for status updates
- **File Upload**: <30 seconds for product image processing
- **Agent Processing**:
  - Agent 1 (Analysis): <5 seconds
  - Agent 2 (Asset Generation): <60 seconds
  - Agent 3 (Video Generation): <300 seconds
- **Concurrent Users**: Support 5+ simultaneous sessions

### Cost Constraints

- **Total Budget**: $300 Google Cloud credits for entire hackathon
- **Per Commercial Target**: <$2.01 total cost breakdown:
  - Gemini Pro Vision + Chat: $0.20-0.40
  - Imagen API: $0.10-0.20
  - Veo API: $1.50-1.40 (primary cost driver)
  - Text-to-Speech: $0.01
- **Monitoring**: Alerts at 50%, 75%, 90% budget usage

## Development Workflow Standards

### File Organization Rules

- **Maximum File Size**: 500 lines of code per file
- **Module Structure**: Single responsibility principle
- **Import Strategy**: Prefer relative imports within packages
- **Path Aliases**: Use `@/` prefix for src directory imports

### Code Quality Standards

- **TypeScript**: Strict mode enabled, comprehensive type annotations
- **Linting**: ESLint with Next.js and TypeScript rules
- **Formatting**: Prettier with 2-space indentation
- **Documentation**: JSDoc for all public functions and classes
- **Testing**: >80% coverage for core business logic

### Testing Strategy

```bash
# Unit Testing Pattern
npm test                    # Vitest with TypeScript support
npm run test:coverage       # Coverage reports >80% target
npm run test:watch         # Development mode testing

# Integration Testing
npm run test:integration    # Full agent pipeline tests
npm run test:e2e           # Playwright browser automation

# Production Validation
npm run typecheck          # TypeScript compilation
npm run lint               # Code quality checks
npm run build              # Production build validation
```

## Security and Compliance

### Authentication Patterns

- **GCP Service Accounts**: Server-side authentication only
- **API Key Management**: Environment variables with proper scoping
- **File Security**: Signed URLs for Cloud Storage access
- **Session Security**: Secure SSE connections

### Privacy Compliance

- **Data Retention**: Automatic deletion of user content after 24 hours
- **User Consent**: Clear disclosure of AI processing and data usage
- **No Personal Data**: No user registration or personal information collection
- **Content Filtering**: Appropriate content validation for generated assets

## Environment Configuration

### Required Environment Variables

```bash
# Google Cloud Configuration
GCP_PROJECT_ID=hackathon-project-2025
GCP_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=./credentials/service-account.json

# Vertex AI Configuration
VERTEX_AI_ENDPOINT=us-central1-aiplatform.googleapis.com
GEMINI_MODEL=gemini-pro-vision
IMAGEN_MODEL=imagegeneration@006
VEO_MODEL=veo-2

# Application Configuration
NEXT_PUBLIC_SSE_URL=http://localhost:3000
NEXT_PUBLIC_SUPPORTED_LOCALES=en,ja
NEXT_PUBLIC_DEFAULT_LOCALE=en

# Rate Limiting and Costs
MAX_CONCURRENT_SESSIONS=5
MAX_PROCESSING_TIME_MS=600000
BUDGET_ALERT_THRESHOLD=250
```

### Build Configuration

```typescript
// next.config.ts pattern
const nextConfig: NextConfig = {
  images: {
    domains: ["storage.googleapis.com"],
    formats: ["image/webp", "image/avif"],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "localhost:3001"],
    },
  },
};

export default withNextIntl(nextConfig);
```

## Deployment Architecture

### Cloud Run Configuration

- **Container Registry**: Google Container Registry
- **Scaling**: 0 to 10 instances based on demand
- **Resource Limits**: 2GB memory, 2 vCPU per instance
- **Environment**: Production, Staging, Development stacks
- **Monitoring**: Cloud Logging + custom metrics

### Infrastructure as Code

- **Tool**: Pulumi with TypeScript for consistency
- **Resources**: Cloud Run, Cloud Storage, Firestore, IAM
- **Environments**: Separate stacks for dev/staging/production
- **Cost Control**: Budget alerts and automatic preservation mode

## Key Dependencies and Versions

```json
{
  "dependencies": {
    "@google-cloud/aiplatform": "^5.6.0",
    "@google-cloud/firestore": "^7.11.3",
    "@google-cloud/storage": "^7.17.0",
    "@google-cloud/text-to-speech": "^6.2.0",
    "next": "15.5.0",
    "next-intl": "^4.3.5",
    "react": "19.1.0",
    "@types/event-stream": "^1.0.0",
    "zod": "^4.1.1"
  }
}
```

## Critical Technical Gotchas

### Next.js App Router Specifics

- API routes must export named functions (GET, POST, etc.)
- Server vs Client components have different capabilities
- SSE integration uses Next.js API routes
- Internationalization routing requires specific structure

### Google Cloud API Constraints

- Vertex AI requires specific endpoint format and authentication
- Imagen and Veo APIs have different rate limits and pricing
- Service account authentication must be server-side only
- Cost tracking requires careful token and API call monitoring

### SSE Session Management

- Use SSE for cross-platform compatibility
- Store session state in Firestore for persistence
- Handle disconnections gracefully with resume capability
- Implement timeout handling for user interactions

### Bilingual Support Requirements

- next-intl requires specific routing structure (/en/_, /ja/_)
- Agent prompts must adapt to user's selected language
- GCP Text-to-Speech supports both languages for narration
- All error messages and UI elements need translation
