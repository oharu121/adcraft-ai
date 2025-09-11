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
- **State Management**: Zustand 5.x for sophisticated state persistence (PREFERRED over Context API)
- **Styling**: Tailwind CSS 4.x with magical gradient designs and smooth animations
- **Components**: React 19.1.0 + Lucide React icons + custom AgentAvatar components
- **Forms**: React Hook Form + Zod validation for dual input modes (image/text)
- **Real-Time**: Server-Sent Events (SSE) for agent conversations (HTTP-based implementation)
- **Internationalization**: next-intl 4.3.5 for bilingual Maya, David, and Alex personalities

### Backend Stack

- **Runtime**: Node.js 18+ via Next.js API Routes
- **Framework**: Next.js API Routes with sophisticated agent orchestration
- **Language**: TypeScript (strict mode) with comprehensive agent-specific type systems
- **Architecture**: Demo-First Development with sophisticated mock implementations
- **Agent Personalities**: Maya (Product Intelligence), David (Creative Director), Alex (Video Producer)
- **Real-Time**: HTTP-based chat system with advanced conversational AI
- **File Processing**: Sharp 0.34.3 for dual input mode (image/text) optimization
- **Validation**: Zod 4.1.1 for runtime type validation across all agent interactions

### Google Cloud Platform Services (MANDATORY)

- **Vertex AI Gemini Pro Vision**: Maya's image analysis capabilities in real mode
- **Vertex AI Gemini Pro**: Maya's text analysis and conversational intelligence
- **Imagen API**: David's visual asset generation for commercials
- **Veo API**: Alex's final commercial video generation
- **Text-to-Speech API**: Multi-language narration for Alex's video production
- **Cloud Storage**: Media file storage with signed URLs for all agent assets
- **Firestore**: Advanced session management with strategy confirmation system
- **Cloud Run**: Primary deployment platform (REQUIRED for hackathon judging)
- **Cloud Functions**: Heavy processing tasks for video production pipeline
- **Cloud Monitoring**: Real-time cost tracking with <$2.01 per commercial target

### Development Tools

- **Testing**: Vitest 3.x + Testing Library + Playwright for E2E
- **Code Quality**: ESLint 9.x + Prettier 3.6.2 + TypeScript compiler
- **Build Tools**: Next.js Turbopack for development and production builds
- **Package Manager**: npm with package-lock.json for consistency
- **Version Control**: Git with conventional commit messages

## Architecture Patterns

### Multi-Agent System Design

```typescript
// Advanced Agent Module Structure Pattern
lib/agents/{agent-name}/
├── core/
│   ├── chat.ts           // Agent conversational intelligence
│   ├── demo-handler.ts   // Sophisticated demo mode implementation
│   └── real-handler.ts   // Real mode with GCP integration
├── tools/
│   ├── {agent}-analyzer.ts    // Agent-specific analysis tools
│   ├── strategy-generator.ts  // Commercial strategy generation
│   └── prompt-builder.ts      // Dynamic prompt generation
├── types/
│   ├── api-types.ts      // API request/response types
│   ├── chat-types.ts     // Conversation and message types
│   └── analysis-types.ts // Agent-specific analysis types
├── enums.ts             // Agent-specific enums and constants
└── index.ts             // Public exports and interface
```

### API Architecture Pattern

```typescript
// Advanced Agent API Pattern with Demo-First Architecture
app/api/agents/{agent-name}/
├── route.ts              // Main agent orchestration
├── analyze/route.ts      // Product/creative analysis
├── chat/
│   ├── route.ts         // Conversational intelligence
│   └── confirm-strategy/route.ts  // Strategy update confirmation
├── upload/route.ts       // File upload handling
├── events/route.ts       // Server-Sent Events
└── handoff/route.ts      // Agent-to-agent transitions

export async function POST(request: Request) {
  // 1. Demo/Real mode detection via AppModeConfig
  // 2. Agent personality routing (Maya/David/Alex)
  // 3. Sophisticated conversation processing
  // 4. Strategy confirmation system
  // 5. Cost tracking and budget monitoring
}
```

### Zustand State Management Pattern

```typescript
// Advanced State Management with Persistence
export const useProductIntelligenceStore = create<PIStore>((set, get) => ({
  // Maya's conversation state
  messages: [],
  isAgentTyping: false,
  chatInputMessage: "",
  
  // Analysis and strategy state
  analysis: null,
  showCommercialChat: false,
  expandedSections: {},
  
  // Actions with persistence
  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
    // Auto-persist to localStorage
  },
  
  setAnalysis: (analysis) => set({ analysis }),
  
  // Strategy confirmation system
  confirmStrategy: async (confirmed) => {
    // Handle strategy update confirmation
  }
}));
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

### Demo-First Architecture (MANDATORY)

- **Demo Mode**: Sophisticated demo implementations that bypass GCP APIs
- **Real Mode**: Production-ready GCP integration after demo approval
- **Mode Configuration**: AppModeConfig for backend-only mode detection
- **Feature Parity**: Demo and real modes must provide identical user experience
- **Cost Protection**: Demo mode prevents accidental API spend during development

### Google Cloud Integration

- **Authentication**: Service account credentials (NEVER expose in frontend)
- **Endpoint Format**: `{location}-aiplatform.googleapis.com` for all Vertex AI calls
- **Agent-Specific APIs**: Maya (Gemini), David (Imagen), Alex (Veo)
- **Rate Limiting**: Implement exponential backoff for quota management
- **Cost Tracking**: Real-time monitoring with <$2.01 per commercial target

### Performance Requirements

- **Maya's Chat Response**: <2 seconds for conversational intelligence
- **Dual Input Processing**: <30 seconds for image/text analysis
- **Agent Processing Pipeline**:
  - Maya (Product Intelligence): <5 seconds for analysis + strategy generation
  - David (Creative Director): <60 seconds for visual asset generation
  - Alex (Video Producer): <300 seconds for final commercial creation
- **State Management**: Zustand persistence with <100ms state updates
- **Concurrent Users**: Support 5+ simultaneous sessions across all agents

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

- **Component Size**: <500 lines per file, prefer <300 lines for maintainability
- **State Management**: Zustand over Context API for complex state (4+ variables)
- **Module Structure**: Single responsibility principle with clear agent boundaries
- **Import Strategy**: Prefer relative imports within agent modules
- **Path Aliases**: Use `@/` prefix for cross-module dependencies
- **Agent Isolation**: Each agent (Maya, David, Alex) is self-contained with clear interfaces

### Code Quality Standards

- **TypeScript**: Strict mode with agent-specific type systems (Maya/David/Alex)
- **State Management**: Zustand patterns with persistence and type safety
- **Linting**: ESLint with Next.js and TypeScript rules
- **Formatting**: Prettier with 2-space indentation
- **Agent Personalities**: Consistent conversational patterns across all agents
- **Demo-First**: All features implemented in demo mode first, then real mode
- **Testing**: >80% coverage for agent logic and conversation flows

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
