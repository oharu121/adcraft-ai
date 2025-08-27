---
title: Project Structure
description: "File organization patterns, naming conventions, and architectural structure guidelines for the  AdCraft AI codebase."
inclusion: always
---

# Project Structure - AdCraft AI

## Root Directory Organization

```
commercial-generator/
├── .ai-rules/                    # AI assistant steering documents
│   ├── product.md               # Product vision and requirements
│   ├── tech.md                  # Technology stack and standards
│   └── structure.md             # This file - project organization
├──                          # Main application source code
├── tests/                       # All test files and test utilities
├── functions/                   # Google Cloud Functions for heavy processing
├── infrastructure/              # Pulumi Infrastructure as Code
├── deploy/                      # Deployment configurations and scripts
├── PRPs/                        # Project Requirements and Planning documents
├── discussion/                  # Architectural decisions and design docs
├── use-cases/                   # Reference implementations and patterns
├── examples/                    # Working solutions and code snippets
├── public/                      # Static assets and public files
└── Configuration Files          # Root-level configs (package.json, etc.)
```

### Application Layer (`app/`)

```
app/                         # Next.js App Router structure
├── [locale]/                    # Internationalization routing
│   ├── page.tsx                # Main application page
│   ├── chat/
│   │   └── [sessionId]/page.tsx # Individual chat session interface
│   └── layout.tsx               # Locale-specific layout
├── api/                         # Backend API routes
│   ├── agents/                  # Agent endpoint handlers
│   │   ├── product-intelligence/route.ts
│   │   ├── creative-director/route.ts
│   │   └── video-producer/route.ts
│   ├── upload/route.ts          # File upload handling
│   ├── status/route.ts          # Processing status endpoints
│   └── websocket/route.ts       # WebSocket connection handling
├── globals.css                  # Global styles and Tailwind imports
├── layout.tsx                   # Root application layout
├── favicon.ico                  # Application favicon
└── not-found.tsx               # 404 error page
```

### Component Library (`components/`)

```
components/                  # Reusable React components
├── chat/                        # Chat interface components
│   ├── ChatInterface.tsx        # Main chat UI container
│   ├── AgentMessage.tsx         # Individual message rendering
│   ├── TypingIndicator.tsx      # Real-time typing indicators
│   ├── MessageInput.tsx         # User input interface
│   └── AgentHandoff.tsx         # Agent transition indicators
├── upload/                      # File upload components
│   ├── ProductImageUpload.tsx   # Drag-and-drop upload interface
│   ├── ImagePreview.tsx         # Uploaded image preview
│   └── UploadProgress.tsx       # Upload progress indicator
├── ui/                          # Base UI components
│   ├── Button.tsx               # Standard button component
│   ├── Card.tsx                 # Content card wrapper
│   ├── Input.tsx                # Form input components
│   ├── Modal.tsx                # Modal dialog component
│   └── LoadingSpinner.tsx       # Loading state indicator
└── layout/                      # Layout components
    ├── Navigation.tsx           # Main navigation
    ├── Sidebar.tsx              # Sidebar layout
    └── Footer.tsx               # Application footer
```

### Business Logic (`lib/`)

```
lib/                         # Core business logic and utilities
├── agents/                      # Multi-agent system implementation
│   ├── product-intelligence/    # Agent 1: Product analysis
│   │   ├── agent.ts            # Main agent logic and conversation flow
│   │   ├── tools.ts            # Image analysis and feature extraction
│   │   ├── prompts.ts          # Bilingual prompts and templates
│   │   ├── types.ts            # Agent-specific TypeScript types
│   │   └── index.ts            # Public API exports
│   ├── creative-director/       # Agent 2: Creative and asset generation
│   │   ├── agent.ts            # Creative conversation and asset coordination
│   │   ├── tools.ts            # Imagen API integration and style tools
│   │   ├── prompts.ts          # Creative direction prompts
│   │   ├── types.ts            # Creative-specific types
│   │   └── index.ts            # Public API exports
│   └── video-producer/          # Agent 3: Video production
│       ├── agent.ts            # Production logic and Veo integration
│       ├── tools.ts            # Video generation and composition tools
│       ├── prompts.ts          # Production prompts and scripts
│       ├── types.ts            # Production-specific types
│       └── index.ts            # Public API exports
├── services/                    # External API integrations
│   ├── vertex-ai.ts            # Gemini Pro Vision and chat services
│   ├── imagen.ts               # Imagen API for asset generation
│   ├── veo.ts                  # Veo API for video generation
│   ├── cloud-storage.ts        # Google Cloud Storage operations
│   └── text-to-speech.ts       # Narration generation service
├── database/                    # Firestore utilities and models
│   ├── session.ts              # Chat session persistence
│   ├── chat-history.ts         # Message history management
│   └── commercial-jobs.ts      # Processing job queue management
├── websocket/                   # Real-time communication
│   ├── server.ts               # WebSocket server implementation
│   ├── handlers.ts             # Message routing and agent coordination
│   └── types.ts                # WebSocket-specific types
└── utils/                       # Helper functions and utilities
    ├── validation.ts           # Zod schemas and input validation
    ├── cost-calculator.ts      # Cost tracking and budget monitoring
    ├── file-handlers.ts        # File processing and validation
    ├── error-handlers.ts       # Error handling and user messages
    └── i18n-helpers.ts         # Internationalization utilities
```

### React Hooks (`hooks/`)

```
hooks/                       # Custom React hooks
├── useWebSocket.ts              # WebSocket connection management
├── useChatSession.ts            # Chat state and message handling
├── useFileUpload.ts             # File upload progress and validation
├── useAgentStatus.ts            # Agent processing status tracking
├── useCostTracking.ts           # Real-time cost monitoring
└── useLanguage.ts               # Language switching and preferences
```

### Type Definitions (`types/`)

```
types/                       # TypeScript type definitions
├── agents.ts                    # Core agent and message types
├── api.ts                       # API request/response types
├── chat.ts                      # Chat session and conversation types
├── commercial.ts                # Commercial generation and output types
├── storage.ts                   # File storage and asset types
└── i18n.ts                      # Internationalization types
```

### Internationalization (`i18n/`)

```
i18n/                        # Bilingual support
├── config.ts                    # next-intl configuration
├── messages/                    # Translation files
│   ├── en.json                 # English translations
│   └── ja.json                 # Japanese translations
└── types.ts                     # Translation key types
```

## Testing Structure (`tests/`)

```
tests/                           # Comprehensive test suite
├── unit/                        # Unit tests for individual components
│   ├── agents/                 # Agent logic testing
│   │   ├── product-intelligence.test.ts
│   │   ├── creative-director.test.ts
│   │   └── video-producer.test.ts
│   ├── services/               # External service integration tests
│   │   ├── vertex-ai.test.ts
│   │   ├── imagen.test.ts
│   │   └── veo.test.ts
│   ├── components/             # React component tests
│   │   ├── chat/
│   │   └── upload/
│   └── utils/                  # Utility function tests
├── integration/                # Integration and workflow tests
│   ├── agent-pipeline.test.ts  # Complete agent workflow
│   ├── websocket-flow.test.ts  # Real-time communication
│   └── api-endpoints.test.ts   # API route integration
├── e2e/                        # End-to-end Playwright tests
│   ├── complete-workflow.spec.ts  # Full user journey
│   ├── error-handling.spec.ts     # Error recovery scenarios
│   └── multilingual.spec.ts       # Bilingual functionality
├── fixtures/                   # Test data and mock files
│   ├── sample-images/          # Test product images
│   ├── mock-responses/         # API response mocks
│   └── test-sessions.json      # Sample chat sessions
└── setup/                      # Test configuration and utilities
    ├── vitest.config.ts        # Vitest configuration
    ├── test-utils.tsx          # React testing utilities
    └── mock-services.ts        # Service mocks and stubs
```

## Infrastructure and Deployment (`infrastructure/`, `deploy/`)

```
infrastructure/                  # Pulumi Infrastructure as Code
├── index.ts                    # Main Pulumi program
├── storage.ts                  # Cloud Storage bucket configuration
├── compute.ts                  # Cloud Run and Cloud Functions
├── database.ts                 # Firestore configuration
├── monitoring.ts               # Logging and alerting setup
└── iam.ts                      # Service accounts and permissions

deploy/                         # Deployment configurations
├── Dockerfile                  # Container build configuration
├── cloudbuild.yaml             # Google Cloud Build pipeline
├── docker-compose.yml          # Local development environment
└── .dockerignore               # Docker build exclusions
```

## Documentation and Planning

```
discussion/                     # Architectural decisions and research
├── DESIGN.md                   # Technical design document
├── 02-development/architecture/  # Architecture documentation
├── 05-gcp-reference/           # GCP implementation guides
└── hackathon-analysis.md       # Hackathon strategy and analysis

use-cases/                      # Reference implementations
├── agent-factory-with-subagents/  # Multi-agent patterns
├── pydantic-ai/               # Agent coordination examples
└── template-generator/        # Code generation templates

examples/                       # Working solutions and snippets
├── github-cli-windows-setup.md   # Platform-specific setup guides
└── implementation-patterns/      # Common solution patterns
```

## File Naming Conventions

### TypeScript Files

- **Components**: PascalCase (`ChatInterface.tsx`, `ProductImageUpload.tsx`)
- **Utilities**: camelCase (`cost-calculator.ts`, `file-handlers.ts`)
- **Types**: camelCase with descriptive names (`agents.ts`, `commercial.ts`)
- **Services**: camelCase with service suffix (`vertex-ai.ts`, `cloud-storage.ts`)

### Directory Naming

- **All lowercase with hyphens** for multi-word directories (`product-intelligence/`)
- **Descriptive names** that clearly indicate purpose (`chat/`, `upload/`, `services/`)
- **Consistent structure** across similar modules (all agents follow same pattern)

### Import/Export Patterns

```typescript
// Prefer relative imports within same module
import { ProductAnalysis } from "./types";

// Use absolute imports for cross-module dependencies
import { VertexAIService } from "@/lib/services/vertex-ai";

// Export patterns - always use index.ts for public API
export { ProductIntelligenceAgent } from "./agent";
export type { ProductAnalysis } from "./types";
```

## Code Organization Rules

### Maximum File Size

- **500 lines maximum** per file - enforce through linting
- **Refactor into modules** when approaching limit
- **Single responsibility** principle for each file

### Module Boundaries

- **Agent modules are self-contained** with clear public interfaces
- **Services handle external integrations** only
- **Components are purely presentational** where possible
- **Utilities are pure functions** without side effects

### Dependency Rules

- **Agents can import services and utilities**
- **Services only import utilities and types**
- **Components import hooks and utilities**
- **No circular dependencies** enforced by linting

### Error Handling Structure

```typescript
// Consistent error handling pattern across all modules
export class CommercialGeneratorError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public retryable: boolean = false,
    public userMessage?: string
  ) {
    super(message);
  }
}
```

This structure ensures maintainability, scalability, and clear separation of concerns throughout the AdCraft AI system while supporting the complex multi-agent architecture and real-time interaction requirements.
