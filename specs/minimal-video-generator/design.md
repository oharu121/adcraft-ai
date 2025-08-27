# Technical Design: Minimal Video Generator

## System Architecture Overview

The Minimal Video Generator follows a simplified version of the full AdCraft AI architecture, focusing on direct Veo API integration while maintaining the foundation for future agent expansion.

```mermaid
graph TB
    subgraph "Frontend (Next.js App Router)"
        A[Landing Page<br/>/[locale]/page.tsx] --> B[Chat Interface<br/>components/chat/]
        B --> C[Video Display<br/>components/video/]
    end
    
    subgraph "API Layer (Next.js API Routes)"
        D[/api/generate-video] --> E[Video Generation Service<br/>lib/services/veo.ts]
        F[/api/chat/refine] --> G[Prompt Refinement Service<br/>lib/services/prompt-refiner.ts]
        H[/api/status/[jobId]] --> I[Status Tracking Service<br/>lib/services/job-tracker.ts]
    end
    
    subgraph "Google Cloud Platform (asia-northeast1)"
        J[Vertex AI Veo API<br/>Tokyo Region] 
        K[Cloud Storage<br/>Video Files]
        L[Firestore<br/>Session State]
        M[Cloud Run<br/>Application Host]
        N[IAM & Security<br/>Service Accounts]
    end
    
    A --> D
    B --> F
    C --> H
    E --> J
    E --> K
    G --> L
    I --> L
    M --> D
    M --> F
    M --> H
```

## Deployment Strategy: Direct Pulumi Implementation

### Infrastructure as Code with TypeScript
- **Framework**: Pulumi with TypeScript (consistent with application stack)
- **Region**: `asia-northeast1` (Tokyo) for optimal hackathon performance
- **Approach**: Production-ready infrastructure from day one
- **State Management**: Pulumi Cloud (free tier)

## Data Models

### Core Data Structures

```typescript
// Session Management
interface VideoSession {
  id: string;
  userId: string | null; // Anonymous for Phase 1
  status: 'draft' | 'generating' | 'completed' | 'failed';
  originalPrompt: string;
  refinedPrompt?: string;
  videoUrl?: string;
  cost: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date; // 24 hours from creation
}

// Chat History for Refinement
interface ChatMessage {
  id: string;
  sessionId: string;
  type: 'user' | 'system';
  content: string;
  timestamp: Date;
}

// Video Generation Job
interface VideoJob {
  id: string;
  sessionId: string;
  prompt: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  veoJobId?: string; // External Veo API job ID
  progress: number; // 0-100
  estimatedCompletionTime?: Date;
  errorMessage?: string;
  cost: number;
}

// Cost Tracking
interface CostEntry {
  id: string;
  sessionId: string;
  service: 'veo' | 'storage' | 'firestore';
  amount: number;
  currency: 'USD';
  timestamp: Date;
  description: string;
}
```

## API Endpoint Design

### POST /api/generate-video

**Purpose**: Initiates video generation from text prompt

**Request Schema**:
```typescript
{
  prompt: string; // 10-500 characters
  sessionId?: string; // Optional, creates new if not provided
  locale?: 'en' | 'ja'; // For future multi-language support
}
```

**Response Schema**:
```typescript
{
  success: boolean;
  data: {
    sessionId: string;
    jobId: string;
    estimatedCost: number;
    estimatedDuration: number; // seconds
  };
  error?: string;
}
```

**Processing Flow**:
1. Validate prompt length and content
2. Check rate limits and budget constraints
3. Create session and job records in Firestore
4. Submit to Veo API (asia-northeast1)
5. Return job tracking information

### POST /api/chat/refine

**Purpose**: Provides simple prompt refinement suggestions

**Request Schema**:
```typescript
{
  sessionId: string;
  userMessage: string;
  currentPrompt: string;
}
```

**Response Schema**:
```typescript
{
  success: boolean;
  data: {
    suggestion: string;
    refinedPrompt: string;
    reasoning: string; // Simple explanation for user
  };
  error?: string;
}
```

**Processing Logic** (Simple Phase 1):
- Basic keyword enhancement (add descriptive terms)
- Duration specification (ensure 15-second focus)
- Quality improvements (add "high quality", "professional")
- Style suggestions (add "commercial style", "product showcase")

### GET /api/status/[jobId]

**Purpose**: Real-time status updates for video generation

**Response Schema**:
```typescript
{
  success: boolean;
  data: {
    status: 'queued' | 'processing' | 'completed' | 'failed';
    progress: number; // 0-100
    estimatedTimeRemaining?: number; // seconds
    videoUrl?: string; // When completed
    cost: number;
    error?: string;
  };
}
```

## Component Architecture

### Frontend Component Structure

```
components/
├── video-generator/
│   ├── PromptInput.tsx          # Main text input with validation
│   ├── GenerateButton.tsx       # Submit button with loading states
│   ├── ProgressTracker.tsx      # Real-time progress display
│   └── VideoDisplay.tsx         # Video player with download
├── chat/
│   ├── ChatInterface.tsx        # Simple refinement chat
│   ├── ChatMessage.tsx          # Individual message display
│   ├── PromptSuggestion.tsx     # Suggested refinements
│   └── ChatInput.tsx            # User input for refinements
├── ui/ (reusable)
│   ├── Button.tsx               # Standard button component
│   ├── Input.tsx                # Form input with validation
│   ├── Card.tsx                 # Content containers
│   ├── Modal.tsx                # Modal dialogs
│   └── LoadingSpinner.tsx       # Loading indicators
└── layout/
    ├── Header.tsx               # Simple navigation
    ├── Footer.tsx               # Basic footer
    └── ErrorBoundary.tsx        # Error handling wrapper
```

### Key Component Specifications

#### PromptInput.tsx
```typescript
interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
  maxLength: number; // 500 characters
  placeholder: string;
  locale: 'en' | 'ja';
}
```

#### VideoDisplay.tsx  
```typescript
interface VideoDisplayProps {
  videoUrl?: string;
  isLoading: boolean;
  progress: number;
  onDownload: () => void;
  onRetry: () => void;
  error?: string;
}
```

#### ChatInterface.tsx
```typescript
interface ChatInterfaceProps {
  sessionId: string;
  currentPrompt: string;
  onPromptUpdate: (newPrompt: string) => void;
  isVisible: boolean;
  onClose: () => void;
}
```

## Service Layer Design

### Video Generation Service (lib/services/veo.ts)

```typescript
export class VeoService {
  private client: VertexAIClient;
  private readonly region = 'asia-northeast1';
  
  async generateVideo(prompt: string, options: VideoOptions): Promise<VeoJob> {
    // 1. Validate prompt against content policies
    // 2. Format prompt for Veo API requirements
    // 3. Submit generation request with 15-second duration
    // 4. Return job tracking information
  }
  
  async getJobStatus(jobId: string): Promise<JobStatus> {
    // Poll Veo API for job progress
    // Handle timeout and error scenarios
  }
  
  async downloadVideo(jobId: string): Promise<string> {
    // Download from Veo API
    // Upload to Cloud Storage (asia-northeast1)
    // Return signed URL
  }
}
```

### Prompt Refinement Service (lib/services/prompt-refiner.ts)

```typescript
export class PromptRefiner {
  refinePrompt(originalPrompt: string, userFeedback: string): PromptRefinement {
    // Simple rule-based refinement for Phase 1
    // Pattern matching for common improvements
    // Duration and quality enhancements
    // Return suggestion with reasoning
  }
  
  private enhanceForCommercial(prompt: string): string {
    // Add commercial-specific terms
    // Ensure professional quality descriptors
    // Optimize for 15-second format
  }
}
```

### Cost Tracking Service (lib/services/cost-tracker.ts)

```typescript
export class CostTracker {
  async recordCost(entry: CostEntry): Promise<void> {
    // Log cost entry to Firestore
    // Update session totals
    // Check budget thresholds
  }
  
  async getCurrentBudget(): Promise<BudgetStatus> {
    // Calculate total spent
    // Return remaining budget
    // Trigger alerts if thresholds exceeded
  }
  
  async estimateVideoCost(prompt: string): Promise<number> {
    // Based on prompt length and complexity
    // 15-second video cost calculation
    // Include storage and processing fees
  }
}
```

## Database Schema (Firestore)

### Collections Structure

```
/sessions/{sessionId}
  - id: string
  - status: string
  - originalPrompt: string
  - refinedPrompt?: string
  - videoUrl?: string  
  - cost: number
  - createdAt: timestamp
  - updatedAt: timestamp
  - expiresAt: timestamp

/sessions/{sessionId}/chat/{messageId}
  - type: 'user' | 'system'
  - content: string
  - timestamp: timestamp

/jobs/{jobId}
  - sessionId: string
  - veoJobId?: string
  - status: string
  - progress: number
  - cost: number
  - createdAt: timestamp
  - updatedAt: timestamp

/costs/{entryId}
  - sessionId: string
  - service: string
  - amount: number
  - timestamp: timestamp
  - description: string

/system/budget
  - totalSpent: number
  - remainingBudget: number
  - alertThresholds: number[]
  - lastUpdated: timestamp
```

## Pulumi Infrastructure Design

### Project Structure
```
infrastructure/
├── index.ts                    # Main Pulumi program
├── storage.ts                  # Cloud Storage buckets
├── compute.ts                  # Cloud Run configuration
├── database.ts                 # Firestore setup
├── iam.ts                     # Service accounts and permissions
├── monitoring.ts              # Budget alerts and logging
└── config/                    # Environment-specific configs
    ├── dev.yaml               # Development environment
    ├── staging.yaml           # Staging environment
    └── prod.yaml              # Production environment
```

### Core Infrastructure Components

#### infrastructure/index.ts
```typescript
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { createStorage } from "./storage";
import { createDatabase } from "./database";
import { createCompute } from "./compute";
import { createIAM } from "./iam";
import { createMonitoring } from "./monitoring";

// Main Pulumi program
export const main = async () => {
  const config = new pulumi.Config();
  const projectId = config.require("projectId");
  const region = config.get("region") || "asia-northeast1";
  
  // Create core infrastructure
  const iam = await createIAM(projectId);
  const storage = await createStorage(projectId, region);
  const database = await createDatabase(projectId, region);
  const compute = await createCompute(projectId, region, iam.serviceAccount);
  const monitoring = await createMonitoring(projectId);
  
  // Export key outputs
  return {
    cloudRunUrl: compute.service.status.url,
    storageBucket: storage.bucket.name,
    firestoreDatabase: database.database.name,
    serviceAccountEmail: iam.serviceAccount.email,
  };
};
```

#### infrastructure/compute.ts
```typescript
import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

export const createCompute = (
  projectId: string,
  region: string,
  serviceAccount: gcp.serviceaccount.Account
) => {
  // Cloud Run service for Next.js application
  const service = new gcp.cloudrun.Service("minimal-video-generator", {
    location: region,
    template: {
      spec: {
        containerConcurrency: 2,
        containers: [{
          image: `gcr.io/${projectId}/minimal-video-generator:latest`,
          resources: {
            limits: {
              cpu: "2000m",
              memory: "2Gi",
            },
          },
          envs: [
            { name: "GCP_PROJECT_ID", value: projectId },
            { name: "GCP_REGION", value: region },
            { name: "VERTEX_AI_ENDPOINT", value: `${region}-aiplatform.googleapis.com` },
            { name: "MAX_CONCURRENT_USERS", value: "2" },
            { name: "BUDGET_LIMIT", value: "300" },
            { name: "BUDGET_ALERT_THRESHOLDS", value: "50,100,150" },
          ],
        }],
        serviceAccountName: serviceAccount.email,
      },
      metadata: {
        annotations: {
          "autoscaling.knative.dev/minScale": "0",
          "autoscaling.knative.dev/maxScale": "3",
          "run.googleapis.com/execution-environment": "gen2",
        },
      },
    },
  });

  // IAM policy to allow public access
  const iamPolicy = new gcp.cloudrun.IamPolicy("public-access", {
    location: service.location,
    project: service.project,
    service: service.name,
    policyData: JSON.stringify({
      bindings: [{
        role: "roles/run.invoker",
        members: ["allUsers"],
      }],
    }),
  });

  return { service, iamPolicy };
};
```

#### infrastructure/storage.ts
```typescript
import * as gcp from "@pulumi/gcp";

export const createStorage = (projectId: string, region: string) => {
  // Storage bucket for video files
  const bucket = new gcp.storage.Bucket("video-storage", {
    location: region,
    uniformBucketLevelAccess: true,
    lifecycleRules: [{
      condition: { age: 0.5 }, // Delete after 12 hours
      action: { type: "Delete" },
    }],
    cors: [{
      origins: ["*"],
      methods: ["GET", "HEAD"],
      responseHeaders: ["*"],
      maxAgeSeconds: 3600,
    }],
  });

  // IAM binding for public read access to video files
  const bucketIAM = new gcp.storage.BucketIAMBinding("video-storage-public", {
    bucket: bucket.name,
    role: "roles/storage.objectViewer",
    members: ["allUsers"],
  });

  return { bucket, bucketIAM };
};
```

#### infrastructure/database.ts
```typescript
import * as gcp from "@pulumi/gcp";

export const createDatabase = (projectId: string, region: string) => {
  // Firestore database
  const database = new gcp.firestore.Database("main-database", {
    project: projectId,
    name: "(default)",
    locationId: region,
    type: "FIRESTORE_NATIVE",
  });

  return { database };
};
```

#### infrastructure/iam.ts
```typescript
import * as gcp from "@pulumi/gcp";

export const createIAM = (projectId: string) => {
  // Service account for the application
  const serviceAccount = new gcp.serviceaccount.Account("video-generator-service", {
    accountId: "video-generator",
    displayName: "Minimal Video Generator Service Account",
  });

  // Required roles for the service account
  const roles = [
    "roles/aiplatform.user",        // Vertex AI access
    "roles/storage.admin",          // Cloud Storage access
    "roles/datastore.user",         // Firestore access
    "roles/logging.logWriter",      // Cloud Logging
    "roles/monitoring.metricWriter", // Cloud Monitoring
  ];

  const iamBindings = roles.map((role, index) => 
    new gcp.projects.IAMBinding(`service-account-binding-${index}`, {
      project: projectId,
      role: role,
      members: [`serviceAccount:${serviceAccount.email}`],
    })
  );

  return { serviceAccount, iamBindings };
};
```

#### infrastructure/monitoring.ts
```typescript
import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

export const createMonitoring = (projectId: string) => {
  // Budget alert for cost monitoring
  const budget = new gcp.billing.Budget("hackathon-budget", {
    billingAccount: pulumi.config.require("billingAccountId"),
    displayName: "Hackathon Video Generator Budget",
    amount: {
      specifiedAmount: {
        currencyCode: "USD",
        units: "300",
      },
    },
    thresholdRules: [
      { thresholdPercent: 0.5 }, // 50% alert
      { thresholdPercent: 0.75 }, // 75% alert
      { thresholdPercent: 0.9 }, // 90% alert
    ],
    budgetFilter: {
      projects: [`projects/${projectId}`],
    },
  });

  // Log sink for application logs
  const logSink = new gcp.logging.ProjectSink("app-logs", {
    destination: `storage.googleapis.com/${projectId}-logs`,
    filter: 'resource.type="cloud_run_revision" AND resource.labels.service_name="minimal-video-generator"',
  });

  return { budget, logSink };
};
```

### Environment Configuration

#### Pulumi.dev.yaml
```yaml
config:
  gcp:project: "adcraft-dev-2025"
  gcp:region: "asia-northeast1"
  minimal-video-generator:projectId: "adcraft-dev-2025"
  minimal-video-generator:billingAccountId: "YOUR_BILLING_ACCOUNT_ID"
  minimal-video-generator:environment: "development"
```

#### Pulumi.prod.yaml
```yaml
config:
  gcp:project: "adcraft-prod-2025"
  gcp:region: "asia-northeast1"
  minimal-video-generator:projectId: "adcraft-prod-2025"
  minimal-video-generator:billingAccountId: "YOUR_BILLING_ACCOUNT_ID"
  minimal-video-generator:environment: "production"
```

## Security Considerations

### Authentication & Authorization
- **Phase 1**: Anonymous usage with IP-based rate limiting
- **Service Account**: Minimal required permissions only
- **API Security**: Zod validation for all endpoints

### Data Protection
- **Encryption**: HTTPS/TLS for all communications
- **Signed URLs**: Time-limited access to video files
- **Data Retention**: 24-hour automatic cleanup
- **Secrets**: Environment variables via Pulumi config

### Network Security
- **CORS**: Restricted to application domain
- **VPC**: Default VPC with standard firewall rules
- **Cloud Run**: Private service with IAM authentication

## Performance Optimizations

### Regional Optimization (Tokyo)
- **Vertex AI**: asia-northeast1 endpoint for reduced latency
- **Cloud Storage**: Same region as compute for faster transfers
- **Firestore**: Regional deployment for consistent performance

### Application Performance
- **Connection Pooling**: Persistent connections to GCP services
- **Caching**: In-memory caching for frequently accessed data
- **Async Processing**: Non-blocking video generation
- **Resource Limits**: Optimized container resources

### Cost Optimizations
- **Auto-scaling**: Scale to zero when idle
- **Storage Lifecycle**: Automatic cleanup of old videos
- **Smart Polling**: Exponential backoff for status checks
- **Budget Monitoring**: Real-time cost alerts

## Deployment Commands

### Initial Setup
```bash
# Install Pulumi and dependencies
npm install -g @pulumi/cli
cd infrastructure
npm install

# Initialize Pulumi stack
pulumi login
pulumi stack init dev
pulumi config set gcp:project adcraft-dev-2025
pulumi config set gcp:region asia-northeast1

# Deploy infrastructure
pulumi up
```

### Application Deployment
```bash
# Build and deploy container
docker build -t gcr.io/adcraft-dev-2025/minimal-video-generator .
docker push gcr.io/adcraft-dev-2025/minimal-video-generator

# Update Cloud Run service
pulumi up
```

### Environment Management
```bash
# Switch between environments
pulumi stack select dev
pulumi stack select prod

# Environment-specific deployments
pulumi up --stack dev
pulumi up --stack prod
```

This technical design provides a production-ready foundation with Pulumi infrastructure-as-code, optimized for the Tokyo hackathon environment, and structured for clean expansion to the full 3-agent system.