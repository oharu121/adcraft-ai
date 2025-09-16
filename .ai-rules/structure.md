---
title: Project Structure
description: "File organization patterns, naming conventions, and architectural structure guidelines for the  AdCraft AI codebase."
inclusion: always
---

# Project Structure - AdCraft AI

## Root Directory Organization

```
adcraft-ai/
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
│   ├── page.tsx                # Main application page with hero section
│   └── layout.tsx               # Locale-specific layout
├── api/                         # Backend API routes
│   ├── agents/                  # Agent endpoint handlers
│   │   └── product-intelligence/    # Maya's API endpoints
│   │       ├── route.ts            # Main PI agent endpoint
│   │       ├── analyze/route.ts    # Product analysis endpoint
│   │       ├── upload/route.ts     # Image upload handling
│   │       ├── chat/               # Chat system endpoints
│   │       │   ├── route.ts        # Main chat endpoint
│   │       │   └── confirm-strategy/route.ts # Strategy confirmation
│   │       ├── events/route.ts     # Server-Sent Events (SSE)
│   │       └── handoff/route.ts    # Agent handoff coordination
│   └── debug/                   # Development and debugging endpoints
│       └── mode/route.ts        # App mode configuration
├── globals.css                  # Global styles and Tailwind imports
├── layout.tsx                   # Root application layout
├── favicon.ico                  # Application favicon
└── not-found.tsx               # 404 error page
```

### Component Library (`components/`)

```
components/                  # Reusable React components
├── home/                        # Home page and main UI components
│   ├── HeroSection.tsx          # Compelling hero section with CTA
│   ├── InstructionsCard.tsx     # Step-by-step instructions
│   ├── ProductAnalysisCard.tsx  # Dual input mode (image/text) interface
│   └── HandoffCard.tsx          # Agent transition and progress tracking
├── product-intelligence/        # Maya's Product Intelligence Agent components
│   ├── ChatContainer.tsx        # Advanced chat with Maya's personality
│   ├── ImageUploadArea.tsx      # Image upload with drag-and-drop
│   └── TextInputArea.tsx        # Rich text input for product descriptions
├── ui/                          # Base UI components
│   ├── Button.tsx               # Standard button component
│   ├── Card.tsx                 # Magical content cards with gradients
│   ├── Input.tsx                # Form input components
│   ├── Modal.tsx                # Modal dialog component
│   ├── LoadingSpinner.tsx       # Loading state indicator
│   └── AgentAvatar.tsx          # Agent personality avatars (Maya, David, Alex)
└── creative-director/           # David's Creative Director Agent components (future)
    └── video-producer/          # Alex's Video Producer Agent components (future)
```

### Business Logic (`lib/`)

```
lib/                         # Core business logic and utilities
├── agents/                      # Multi-agent system implementation
│   ├── product-intelligence/    # Maya - Agent 1: Product Intelligence
│   │   ├── core/               # Core Maya intelligence system
│   │   │   ├── chat.ts         # Maya's conversational AI logic
│   │   │   ├── demo-handler.ts # Sophisticated demo mode implementation
│   │   │   └── real-handler.ts # Real mode with Vertex AI integration
│   │   ├── tools/              # Maya's analysis tools
│   │   │   ├── image-analyzer.ts    # Gemini Pro Vision integration
│   │   │   ├── text-analyzer.ts     # Gemini Pro text analysis
│   │   │   ├── strategy-generator.ts # Commercial strategy generation
│   │   │   └── prompt-builder.ts    # Dynamic prompt generation
│   │   ├── types/              # Maya's type definitions
│   │   │   ├── api-types.ts    # API request/response types
│   │   │   ├── chat-types.ts   # Chat and conversation types
│   │   │   └── analysis-types.ts    # Product analysis types
│   │   ├── enums.ts           # Maya's enums (ProductCategory, TopicStatus, etc.)
│   │   └── index.ts           # Public API exports
│   ├── creative-director/      # David - Agent 2: Creative Direction (future)
│   │   ├── core/              # David's creative intelligence
│   │   ├── tools/             # Imagen API and visual tools
│   │   ├── types/             # Creative-specific types
│   │   └── index.ts           # Public API exports
│   └── video-producer/         # Alex - Agent 3: Video Production (future)
│       ├── core/              # Alex's production logic
│       ├── tools/             # Veo API and video tools
│       ├── types/             # Production-specific types
│       └── index.ts           # Public API exports
├── services/                    # External API integrations
│   ├── vertex-ai.ts            # Gemini Pro Vision and chat services
│   ├── imagen.ts               # Imagen API for asset generation
│   ├── veo.ts                  # Veo API for video generation
│   ├── cloud-storage.ts        # Google Cloud Storage operations
│   └── text-to-speech.ts       # Narration generation service
├── stores/                      # Zustand state management
│   └── product-intelligence-store.ts # Maya's state management with persistence
├── services/                    # Core business services
│   └── firestore.ts           # Firestore session and strategy management
├── services/                    # Core business services
│   ├── sse.ts                  # Server-Sent Events implementation
│   ├── event-handler.ts        # Event routing and agent coordination
│   └── types.ts                # SSE-specific types
└── utils/                       # Helper functions and utilities
    ├── validation.ts           # Zod schemas and input validation
    ├── cost-calculator.ts      # Cost tracking and budget monitoring
    ├── file-handlers.ts        # File processing and validation
    ├── error-handlers.ts       # Error handling and user messages
    └── i18n-helpers.ts         # Internationalization utilities
```

### React Hooks (`hooks/`)

```
hooks/                       # Custom React hooks (future - currently using Zustand)
├── useSSE.ts                    # Server-Sent Events connection management (future)
├── useChatSession.ts            # Chat state and message handling (future)
├── useFileUpload.ts             # File upload progress and validation (future)
├── useAgentStatus.ts            # Agent processing status tracking (future)
├── useCostTracking.ts           # Real-time cost monitoring (future)
└── useLanguage.ts               # Language switching and preferences (future)

# NOTE: Currently using Zustand stores instead of custom hooks for better state management
```

### Type Definitions (`types/`)

```
types/                       # Global TypeScript type definitions
├── dictionary.ts                # Internationalization and dictionary types
└── global.ts                    # Global type definitions

# NOTE: Agent-specific types are located within each agent's types/ directory
```

### Internationalization (`i18n/`)

```
dictionaries/                # Bilingual support with next-intl
├── en.json                      # English translations for all agents
└── ja.json                      # Japanese translations for all agents

i18n/                        # Internationalization configuration
├── config.ts                    # next-intl configuration
└── request.ts                   # Request handling for locales
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
│   ├── sse-flow.test.ts         # Real-time communication
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
