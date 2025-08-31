# Product Intelligence Agent - Technical Design

## 1. ARCHITECTURE DESIGN

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Product Intelligence Agent Architecture                │
└─────────────────────────────────────────────────────────────────────────────────┘

User Interface Layer:
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Image Upload    │    │   Chat Interface │    │  Progress Status │
│  Component       │◄───►│   Component      │◄───►│   Component      │
└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            WebSocket Connection Layer                           │
└─────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Next.js API Layer                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   Upload API    │  │   Chat API      │  │   Status API    │                │
│  │   /api/upload   │  │   /api/agents/  │  │   /api/status   │                │
│  │                 │  │   product-intel │  │                 │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      Product Intelligence Agent Core                           │
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │  Conversation   │  │  Image Analysis │  │  Context        │                │
│  │  Controller     │◄─►│  Engine         │◄─►│  Manager        │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
│           │                     │                     │                        │
│           ▼                     ▼                     ▼                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │  Prompt         │  │  Response       │  │  Session        │                │
│  │  Templates      │  │  Formatter      │  │  State          │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        External Services Layer                                 │
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │  Vertex AI      │  │  Cloud Storage  │  │  Firestore      │                │
│  │  Gemini Pro     │  │  Image Storage  │  │  Session Store  │                │
│  │  Vision API     │  │  & Processing   │  │  & Chat History │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
1. Image Upload Flow:
   User → Upload Component → API Route → Cloud Storage → Vertex AI → Analysis Engine

2. Chat Conversation Flow:
   User → Chat Interface → WebSocket → Conversation Controller → Gemini Pro → Response

3. Session Management Flow:
   Session State → Firestore → Context Manager → Conversation Controller

4. Agent Handoff Flow:
   Analysis Complete → Context Serialization → Agent Pipeline → Creative Director
```

### Data Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Product   │────►│   Image     │────►│  Analysis   │────►│  Creative   │
│   Image     │     │ Processing  │     │   Results   │     │  Director   │
│   Upload    │     │   & Vision  │     │    +        │     │   Agent     │
│             │     │   Analysis  │     │ Conversation│     │  (Agent 2)  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│File Upload  │     │Vision API   │     │Chat History │     │Structured   │
│Validation   │     │Call + Cost  │     │Context +    │     │Product Data │
│& Storage    │     │Tracking     │     │User Input   │     │for Next     │
│             │     │             │     │Refinement   │     │Agent        │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### WebSocket Connection Lifecycle

```
Connection Establishment:
1. Client connects to /api/websocket with session ID
2. Server validates session and establishes socket connection  
3. Session state loaded from Firestore
4. Connection confirmed to client

Message Flow:
1. Client sends user message via WebSocket
2. Server validates message and updates chat history
3. Agent processes message and generates response
4. Server emits response with typing indicators
5. Session state updated in Firestore

Error Handling:
1. Connection loss detected by client/server
2. Automatic reconnection attempt with exponential backoff
3. Session state recovery from Firestore
4. Resume conversation from last checkpoint

Session Cleanup:
1. Explicit disconnect or timeout detected
2. Session state saved to Firestore
3. Temporary resources cleaned up
4. Connection resources released
```

## 2. API DESIGN

### REST Endpoints

#### Image Upload API
```typescript
POST /api/upload
Content-Type: multipart/form-data

Request:
{
  image: File, // JPG, PNG, WEBP up to 10MB
  description?: string, // Optional product description
  sessionId?: string, // Resume existing session
  locale: 'en' | 'ja' // User language preference
}

Response: 200 OK
{
  success: true,
  data: {
    sessionId: string,
    imageUrl: string, // Signed Cloud Storage URL
    uploadTimestamp: string,
    processingStatus: 'uploaded' | 'analyzing' | 'complete' | 'error'
  }
}

Error Response: 400/500
{
  success: false,
  error: {
    code: 'INVALID_FILE' | 'FILE_TOO_LARGE' | 'UNSUPPORTED_FORMAT',
    message: string,
    userMessage: string // Localized error message
  }
}
```

#### Agent Processing API
```typescript
POST /api/agents/product-intelligence
Content-Type: application/json

Request:
{
  sessionId: string,
  action: 'analyze' | 'chat' | 'handoff',
  message?: string, // Required for chat action
  locale: 'en' | 'ja'
}

Response: 200 OK
{
  success: true,
  data: {
    sessionId: string,
    agentResponse?: string, // Chat response
    analysis?: ProductAnalysis, // Structured analysis
    nextAction: 'continue_chat' | 'ready_for_handoff' | 'error',
    cost: {
      current: number,
      total: number,
      remaining: number
    }
  }
}
```

#### Session Management API
```typescript
GET /api/status/:sessionId

Response: 200 OK
{
  success: true,
  data: {
    sessionId: string,
    status: 'active' | 'completed' | 'error' | 'expired',
    currentAgent: 'product-intelligence' | 'creative-director' | 'video-producer',
    progress: {
      step: number,
      totalSteps: number,
      description: string
    },
    cost: CostTracking,
    lastActivity: string
  }
}

PUT /api/status/:sessionId
{
  action: 'pause' | 'resume' | 'cancel'
}
```

### WebSocket Message Protocols

#### Client → Server Messages
```typescript
interface UserMessage {
  type: 'user_message' | 'typing_start' | 'typing_stop',
  sessionId: string,
  content?: string,
  timestamp: number,
  locale: 'en' | 'ja'
}
```

#### Server → Client Messages
```typescript
interface AgentMessage {
  type: 'agent_message' | 'agent_typing' | 'status_update' | 'error',
  sessionId: string,
  content?: string,
  agentName: 'Product Intelligence',
  timestamp: number,
  metadata?: {
    cost: CostTracking,
    processingTime: number,
    nextAction: string
  }
}

interface StatusUpdate {
  type: 'status_update',
  sessionId: string,
  status: SessionStatus,
  progress: ProgressInfo
}
```

### Zod Validation Schemas

```typescript
import { z } from 'zod';

export const ImageUploadSchema = z.object({
  sessionId: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
  locale: z.enum(['en', 'ja']).default('en')
});

export const ChatMessageSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(1000),
  locale: z.enum(['en', 'ja']).default('en')
});

export const ProductAnalysisSchema = z.object({
  category: z.string(),
  features: z.array(z.string()),
  materials: z.array(z.string()),
  colors: z.array(z.string()),
  targetAudience: z.object({
    demographics: z.object({
      ageRange: z.string(),
      income: z.string(),
      location: z.string()
    }),
    psychographics: z.array(z.string()),
    behaviors: z.array(z.string())
  }),
  positioning: z.object({
    keySellingPoints: z.array(z.string()),
    competitiveAdvantages: z.array(z.string()),
    emotionalTriggers: z.array(z.string())
  }),
  visualPreferences: z.object({
    style: z.string(),
    mood: z.string(),
    colorPalette: z.array(z.string())
  })
});
```

## 3. DATA STRUCTURES

### Core Product Analysis Output

```typescript
interface ProductAnalysis {
  // Basic Product Information
  product: {
    id: string;
    category: ProductCategory;
    subcategory: string;
    name: string;
    description: string;
    keyFeatures: string[];
    materials: string[];
    colors: Color[];
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
      weight?: number;
      unit: 'cm' | 'inch' | 'kg' | 'lb';
    };
    priceRange?: {
      min: number;
      max: number;
      currency: string;
    };
    usageContext: string[];
    seasonality?: 'spring' | 'summer' | 'fall' | 'winter' | 'year-round';
  };

  // Target Audience Analysis
  targetAudience: {
    primary: {
      demographics: {
        ageRange: string;
        gender: 'male' | 'female' | 'unisex';
        incomeLevel: 'budget' | 'mid-range' | 'premium' | 'luxury';
        location: string[];
        lifestyle: string[];
      };
      psychographics: {
        values: string[];
        interests: string[];
        personalityTraits: string[];
        motivations: string[];
      };
      behaviors: {
        shoppingHabits: string[];
        mediaConsumption: string[];
        brandLoyalty: 'low' | 'medium' | 'high';
        decisionFactors: string[];
      };
    };
    secondary?: TargetAudienceSegment;
  };

  // Brand Positioning Strategy
  positioning: {
    brandPersonality: {
      traits: string[];
      tone: 'professional' | 'friendly' | 'luxury' | 'playful' | 'authoritative';
      voice: string;
    };
    valueProposition: {
      primaryBenefit: string;
      supportingBenefits: string[];
      differentiators: string[];
    };
    competitiveAdvantages: {
      functional: string[];
      emotional: string[];
      experiential: string[];
    };
    marketPosition: {
      tier: 'budget' | 'mainstream' | 'premium' | 'luxury';
      niche?: string;
      marketShare?: 'challenger' | 'leader' | 'niche';
    };
  };

  // Commercial Strategy Insights  
  commercialStrategy: {
    keyMessages: {
      headline: string;
      tagline: string;
      supportingMessages: string[];
    };
    emotionalTriggers: {
      primary: EmotionalTrigger;
      secondary: EmotionalTrigger[];
    };
    callToAction: {
      primary: string;
      secondary: string[];
    };
    storytelling: {
      narrative: string;
      conflict: string;
      resolution: string;
    };
  };

  // Visual Direction for Creative Agent
  visualPreferences: {
    overallStyle: 'modern' | 'classic' | 'minimalist' | 'bold' | 'organic';
    colorPalette: {
      primary: Color[];
      secondary: Color[];
      accent: Color[];
    };
    mood: 'energetic' | 'calm' | 'sophisticated' | 'playful' | 'inspiring';
    composition: 'clean' | 'dynamic' | 'intimate' | 'grand' | 'artistic';
    lighting: 'bright' | 'warm' | 'dramatic' | 'natural' | 'studio';
    environment: string[];
  };

  // Session Metadata
  metadata: {
    sessionId: string;
    analysisVersion: string;
    confidenceScore: number; // 0-1
    processingTime: number; // milliseconds
    cost: CostTracking;
    locale: 'en' | 'ja';
    timestamp: string;
    agentInteractions: number;
  };
}

// Supporting Types
enum ProductCategory {
  ELECTRONICS = 'electronics',
  FASHION = 'fashion',
  FOOD_BEVERAGE = 'food-beverage',
  HOME_GARDEN = 'home-garden',
  HEALTH_BEAUTY = 'health-beauty',
  SPORTS_OUTDOORS = 'sports-outdoors',
  AUTOMOTIVE = 'automotive',
  BOOKS_MEDIA = 'books-media',
  TOYS_GAMES = 'toys-games',
  BUSINESS = 'business',
  OTHER = 'other'
}

interface Color {
  name: string;
  hex: string;
  role: 'primary' | 'secondary' | 'accent';
}

interface EmotionalTrigger {
  type: 'aspiration' | 'fear' | 'joy' | 'trust' | 'excitement' | 'comfort' | 'pride';
  description: string;
  intensity: 'subtle' | 'moderate' | 'strong';
}

interface CostTracking {
  current: number;
  total: number;
  breakdown: {
    imageAnalysis: number;
    chatInteractions: number;
  };
  remaining: number;
  budgetAlert: boolean;
}
```

### Session State Management

```typescript
interface SessionState {
  sessionId: string;
  status: 'initializing' | 'active' | 'analyzing' | 'chatting' | 'ready_for_handoff' | 'completed' | 'error';
  currentAgent: 'product-intelligence' | 'creative-director' | 'video-producer';
  
  // User Data
  user: {
    locale: 'en' | 'ja';
    ipAddress: string; // For rate limiting
    preferences: UserPreferences;
  };

  // Product Data
  product: {
    imageUrl: string;
    originalFilename: string;
    initialDescription?: string;
    analysis?: ProductAnalysis;
  };

  // Conversation History
  conversation: {
    messages: ChatMessage[];
    context: ConversationContext;
    currentTopic?: string;
    completedTopics: string[];
  };

  // Progress Tracking
  progress: {
    currentStep: number;
    totalSteps: number;
    stepsCompleted: string[];
    nextActions: string[];
  };

  // Cost and Performance
  costs: CostTracking;
  performance: {
    startTime: number;
    lastActivity: number;
    processingTimes: Record<string, number>;
  };

  // Handoff Data
  handoff: {
    readyForNext: boolean;
    nextAgent: string;
    serializedContext: string;
    handoffTimestamp?: number;
  };

  // Metadata
  metadata: {
    createdAt: number;
    updatedAt: number;
    version: string;
    environment: 'development' | 'staging' | 'production';
  };
}

interface ChatMessage {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
  agentName?: string;
  metadata?: {
    processingTime?: number;
    cost?: number;
    confidence?: number;
  };
}

interface ConversationContext {
  topics: {
    productFeatures: 'pending' | 'in_progress' | 'completed';
    targetAudience: 'pending' | 'in_progress' | 'completed';
    brandPositioning: 'pending' | 'in_progress' | 'completed';
    visualPreferences: 'pending' | 'in_progress' | 'completed';
  };
  
  userIntent: string;
  keyInsights: string[];
  uncertainties: string[];
  followUpQuestions: string[];
}
```

## 4. FILE STRUCTURE

### Complete Module Organization

```
src/lib/agents/product-intelligence/
├── agent.ts                 # Main agent orchestration and conversation flow
├── tools.ts                 # Vertex AI Vision integration and analysis tools  
├── prompts.ts              # Bilingual system prompts and conversation templates
├── types.ts                # Product Intelligence specific TypeScript types
├── context-manager.ts      # Session state and conversation context management
├── cost-tracker.ts         # Real-time cost monitoring and budget management
└── index.ts                # Public API exports

src/components/product-intelligence/
├── ImageUploadArea.tsx     # Drag-and-drop image upload interface
├── ProductAnalysisCard.tsx # Display structured product analysis results
├── ChatContainer.tsx       # Main chat interface container
├── AgentTypingIndicator.tsx # Real-time typing status display
├── ProgressStepper.tsx     # Visual progress through analysis steps
├── CostDisplay.tsx         # Real-time cost tracking display
├── HandoffPreview.tsx      # Preview of data being sent to next agent
└── index.ts                # Component exports

src/hooks/product-intelligence/
├── useProductAnalysis.ts   # Image upload and analysis state management
├── useAgentChat.ts         # Chat conversation and WebSocket management
├── useSessionProgress.ts   # Progress tracking and step management
├── useCostMonitoring.ts    # Budget tracking and alerts
└── index.ts                # Hook exports

app/api/agents/product-intelligence/
├── route.ts                # Main API route handler
├── upload/route.ts         # Image upload processing
├── analyze/route.ts        # Vision API analysis endpoint
├── chat/route.ts           # Chat conversation handling  
└── handoff/route.ts        # Agent handoff processing

app/(routes)/product-intelligence/
├── page.tsx                # Main Product Intelligence interface
├── [sessionId]/page.tsx    # Individual session interface
└── layout.tsx              # Product Intelligence specific layout

src/services/product-intelligence/
├── vision-analyzer.ts      # Vertex AI Gemini Pro Vision integration
├── conversation-engine.ts  # Chat conversation processing
├── session-manager.ts      # Firestore session persistence
├── image-processor.ts      # Image optimization and validation
└── handoff-coordinator.ts  # Agent pipeline coordination
```

### Integration Points

```typescript
// Shared utilities integration
import { CostCalculator } from '@/lib/utils/cost-calculator';
import { FileHandler } from '@/lib/utils/file-handlers';
import { ErrorHandler } from '@/lib/utils/error-handlers';

// Database integration
import { SessionStore } from '@/lib/database/session';
import { ChatHistoryStore } from '@/lib/database/chat-history';

// Service integrations
import { CloudStorageService } from '@/lib/services/cloud-storage';
import { VertexAIService } from '@/lib/services/vertex-ai';

// WebSocket integration
import { WebSocketServer } from '@/lib/websocket/server';
import { MessageHandler } from '@/lib/websocket/handlers';

// i18n integration
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
```

## 5. IMPLEMENTATION PHASES

### Phase 1: Core Infrastructure and API Setup (40 hours)

**Week 1 - Foundation**

#### Tasks:
1. **Project Structure Setup (8 hours)**
   - Create directory structure following established patterns
   - Set up TypeScript configurations and path aliases
   - Configure ESLint and Prettier for code quality
   - Initialize test framework with Vitest

2. **API Route Foundation (12 hours)**
   - Implement basic Next.js API routes structure
   - Set up middleware for authentication and validation
   - Create error handling patterns
   - Implement rate limiting middleware

3. **Database Schema Design (8 hours)**
   - Design Firestore collections for sessions and chat history
   - Create TypeScript interfaces for all data structures
   - Implement basic CRUD operations for session management
   - Set up Firestore security rules

4. **Cloud Storage Integration (12 hours)**
   - Set up Google Cloud Storage bucket
   - Implement secure file upload with signed URLs
   - Create image validation and processing pipeline
   - Configure automatic cleanup policies

**Deliverables:**
- Complete API route structure
- Database schema and basic operations
- File upload functionality
- Error handling framework

**Dependencies:** 
- Google Cloud Platform account setup
- Service account credentials configuration
- Environment variables configuration

### Phase 2: Image Upload and Gemini Vision Integration (32 hours)

**Week 2 - Core Processing**

#### Tasks:
1. **Image Upload Component (8 hours)**
   - Implement drag-and-drop interface with React Hook Form
   - Add image preview and validation feedback
   - Create progress indicators for upload process
   - Handle file compression and optimization

2. **Vertex AI Integration (16 hours)**
   - Set up authentication with service account
   - Implement Gemini Pro Vision API calls
   - Create structured response parsing
   - Add error handling and retry logic
   - Implement cost tracking for API calls

3. **Product Analysis Engine (8 hours)**
   - Build analysis result processing pipeline
   - Create structured data extraction from Vision API
   - Implement confidence scoring and validation
   - Add fallback handling for incomplete analysis

**Deliverables:**
- Working image upload with validation
- Gemini Pro Vision integration
- Structured product analysis output
- Cost tracking system

**Dependencies:**
- Phase 1 completion
- Vertex AI API access and quotas
- Test product images for development

### Phase 3: Text Input and Gemini Pro Integration (28 hours)

**Week 2-3 - Conversation Engine**

#### Tasks:
1. **Chat Interface Components (12 hours)**
   - Build chat UI with message history
   - Implement typing indicators and status displays
   - Add message formatting and rendering
   - Create responsive design for mobile/desktop

2. **Conversation Engine (16 hours)**
   - Implement Gemini Pro chat integration
   - Create conversation flow control logic
   - Build context management for multi-turn conversations
   - Add conversation topic tracking and completion detection

**Deliverables:**
- Complete chat interface
- Working conversation with Gemini Pro
- Context-aware responses
- Topic completion detection

**Dependencies:**
- Phase 2 completion
- Gemini Pro API access
- Conversation flow design approval

### Phase 4: WebSocket Chat System (36 hours)

**Week 3-4 - Real-Time Communication**

#### Tasks:
1. **WebSocket Server Setup (12 hours)**
   - Configure Socket.io server with Next.js
   - Implement connection authentication
   - Set up room management for sessions
   - Add connection lifecycle handling

2. **Real-Time Message Handling (16 hours)**
   - Implement bidirectional message routing
   - Add typing indicators and presence
   - Create message persistence to Firestore
   - Handle connection drops and reconnection

3. **Session State Management (8 hours)**
   - Implement real-time session updates
   - Add progress tracking across WebSocket
   - Create session recovery mechanisms
   - Handle concurrent session management

**Deliverables:**
- Working WebSocket communication
- Real-time chat experience
- Session persistence and recovery
- Connection management

**Dependencies:**
- Phase 3 completion
- Socket.io configuration
- WebSocket server deployment setup

### Phase 5: Agent Handoff and Integration (24 hours)

**Week 4 - Pipeline Integration**

#### Tasks:
1. **Agent Coordination (12 hours)**
   - Implement handoff trigger detection
   - Create structured data serialization for next agent
   - Add agent pipeline status management
   - Build handoff validation and confirmation

2. **Session Transition (12 hours)**
   - Implement smooth UI transition between agents
   - Create handoff preview for users
   - Add progress indication across agent pipeline
   - Handle handoff errors and rollback

**Deliverables:**
- Working agent handoff system
- Seamless user experience transitions
- Agent pipeline integration
- Error handling for handoffs

**Dependencies:**
- Phase 4 completion
- Creative Director Agent interface definition
- Agent pipeline coordination design

### Phase 6: UI/UX and Internationalization (32 hours)

**Week 5 - Polish and Localization**

#### Tasks:
1. **Internationalization (16 hours)**
   - Implement next-intl configuration
   - Create bilingual prompts and responses
   - Add language switching functionality
   - Translate all UI components and error messages

2. **UI/UX Polish (16 hours)**
   - Refine visual design with Tailwind CSS
   - Add animations and transitions with Framer Motion
   - Implement responsive design improvements
   - Add accessibility features and ARIA labels

**Deliverables:**
- Complete bilingual support (English/Japanese)
- Polished user interface
- Responsive design
- Accessibility compliance

**Dependencies:**
- Phase 5 completion
- UI/UX design approval
- Translation content review

### Phase Implementation Timeline

```
Week 1: Phase 1 (Infrastructure)
Week 2: Phase 2 (Vision) + Phase 3 (Chat) 
Week 3: Phase 3 (Chat) + Phase 4 (WebSocket)
Week 4: Phase 4 (WebSocket) + Phase 5 (Handoff)
Week 5: Phase 6 (UI/UX + i18n)

Total Estimated Hours: 192 hours
Estimated Calendar Time: 5 weeks
Buffer for Testing/Debugging: 20% additional time
```

## 6. INTEGRATION POINTS

### Navigation Flow Integration

```typescript
// Shared routing patterns
export const ROUTES = {
  HOME: '/',
  PRODUCT_INTELLIGENCE: '/product-intelligence',
  CHAT_SESSION: '/product-intelligence/[sessionId]',
  CREATIVE_DIRECTOR: '/creative-director',
  VIDEO_PRODUCER: '/video-producer',
  RESULTS: '/results/[sessionId]'
} as const;

// Navigation state management
interface NavigationState {
  currentAgent: AgentType;
  sessionId: string;
  progress: {
    completed: AgentType[];
    current: AgentType;
    upcoming: AgentType[];
  };
  canNavigateBack: boolean;
  canSkipToNext: boolean;
}
```

### Shared Components and Utilities

```typescript
// Shared component exports
export { ChatInterface } from '@/components/chat/ChatInterface';
export { ProgressStepper } from '@/components/ui/ProgressStepper';
export { CostDisplay } from '@/components/ui/CostDisplay';
export { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Shared utility exports
export { CostCalculator } from '@/lib/utils/cost-calculator';
export { SessionManager } from '@/lib/utils/session-manager';
export { FileValidator } from '@/lib/utils/file-validator';
export { ErrorHandler } from '@/lib/utils/error-handlers';

// Shared hooks
export { useSessionProgress } from '@/hooks/useSessionProgress';
export { useCostTracking } from '@/hooks/useCostTracking';
export { useWebSocket } from '@/hooks/useWebSocket';
```

### Database Schema Updates

```typescript
// Extend existing collections
interface Sessions {
  // Existing fields...
  agents: {
    productIntelligence: {
      status: AgentStatus;
      startTime: number;
      completionTime?: number;
      analysis?: ProductAnalysis;
      conversationSummary: string;
      cost: number;
    };
    creativeDirector: AgentSessionData;
    videoProducer: AgentSessionData;
  };
  
  handoffs: {
    timestamp: number;
    fromAgent: AgentType;
    toAgent: AgentType;
    data: SerializedAgentData;
    status: 'pending' | 'completed' | 'failed';
  }[];
}

// New collections
interface ProductAnalyses {
  sessionId: string;
  analysis: ProductAnalysis;
  version: string;
  createdAt: number;
  expiresAt: number; // Auto-cleanup after 24 hours
}
```

### Configuration Changes

```typescript
// Environment variables updates
export const ENV = {
  // Existing variables...
  VERTEX_AI_PRODUCT_MODEL: 'gemini-pro-vision',
  VERTEX_AI_CHAT_MODEL: 'gemini-pro',
  MAX_PRODUCT_INTELLIGENCE_COST: 0.50,
  PRODUCT_ANALYSIS_TIMEOUT: 30000,
  CHAT_SESSION_TIMEOUT: 1800000, // 30 minutes
} as const;

// Next.js configuration updates
const nextConfig = {
  // Existing config...
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', process.env.PRODUCTION_URL]
    }
  },
  images: {
    domains: [
      'storage.googleapis.com',
      'us-central1-aiplatform.googleapis.com'
    ]
  }
};
```

This comprehensive technical design provides the complete blueprint for implementing the Product Intelligence Agent as the first component in the AdCraft AI multi-agent system, ensuring seamless integration with the overall architecture while maintaining the high performance and cost efficiency requirements for the hackathon demonstration.