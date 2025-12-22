# Vertex AI vs AI Studio: Why It Works Differently in Production

**Date**: October 30, 2025
**Issue**: Image generation fails in production but works locally
**Root Cause**: Environment variable configuration difference

---

## TL;DR - The Problem

**Local (Works)**:
- `GEMINI_API_KEY` is set → AI Studio client initialized → Image generation succeeds

**Production (Fails)**:
- `GEMINI_API_KEY` is NOT set → Only Vertex AI client initialized → Image generation throws error

**Error Message**:
```
"Image generation requires AI Studio client - Vertex AI doesn't support Gemini 2.0 Flash yet"
```

---

## Deep Dive: Why This Happens

### The Client Selection Logic (gemini.ts:26-36)

```typescript
constructor(vertexAIService?: VertexAIService) {
  // Initialize AI Studio client if API key is available
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey) {
    this.aiStudioClient = new GeminiAIStudioClient(geminiApiKey);
  }

  // Initialize Vertex AI client if service is provided
  if (vertexAIService) {
    this.vertexAIClient = new VertexAIClient(vertexAIService);
  }
}
```

**What This Does**:
1. **Checks for `GEMINI_API_KEY`** in environment variables
2. **If found**: Creates AI Studio client (supports Gemini 2.0 Flash + image generation)
3. **If VertexAIService provided**: Creates Vertex AI client (supports Gemini Pro, but NOT 2.0 Flash for images)
4. **Both can coexist**: AI Studio has priority for image generation

---

### Image Generation Method (gemini.ts:101-108)

```typescript
public async generateImages(prompt: string, count: number = 4): Promise<GeminiImageResponse> {
  if (this.aiStudioClient) {
    console.log("[GEMINI CLIENT] Using AI Studio for image generation");
    return await this.aiStudioClient.generateImages(prompt, count);
  } else {
    throw new Error("Image generation requires AI Studio client - Vertex AI doesn't support Gemini 2.0 Flash yet");
  }
}
```

**Critical Logic**:
- **ONLY works with AI Studio client**
- **Vertex AI cannot generate images** (Gemini 2.0 Flash not available on Vertex AI yet)
- **Throws error if AI Studio client is missing**

---

### Production (Cloud Run - infrastructure/compute.ts:55-80)

```typescript
envs: [
  { name: 'APP_MODE', value: 'real' },
  { name: 'GCP_PROJECT_ID', value: projectId },
  { name: 'GCP_REGION', value: region },
  { name: 'STORAGE_BUCKET_NAME', value: bucketName },
  { name: 'FIRESTORE_DATABASE_NAME', value: databaseName },
  { name: 'NODE_ENV', value: 'production' },
  // ❌ GEMINI_API_KEY is MISSING!
]
```

**Result**:
- ❌ AI Studio client NOT initialized (no API key)
- ✅ Vertex AI client initialized (service account auth from Cloud Run)
- ❌ Image generation fails (no AI Studio client)

---

## Why Vertex AI Works Differently

### Authentication Methods

#### AI Studio (REST API)
```typescript
// Simple API key authentication
const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent', {
  headers: {
    'x-goog-api-key': process.env.GEMINI_API_KEY
  }
});
```

**Characteristics**:
- ✅ Works anywhere (local, production, mobile apps)
- ✅ Simple to set up (just an API key)
- ✅ Supports latest models (Gemini 2.0 Flash)
- ✅ Image generation available
- ❌ Less secure (API key can be leaked)
- ❌ No VPC service controls
- ❌ Limited enterprise features

---

#### Vertex AI (gRPC + Service Account)
```typescript
// Service account authentication via Google Cloud SDK
const vertexai = new VertexAI({
  project: process.env.GCP_PROJECT_ID,
  location: process.env.GCP_REGION,
});
```

**Authentication Flow**:
1. **Local Development**:
   ```bash
   gcloud auth application-default login
   # Creates credential file at:
   # ~/.config/gcloud/application_default_credentials.json
   ```
   - App reads credential file
   - Impersonates your user account
   - Uses your GCP permissions

2. **Production (Cloud Run)**:
   ```yaml
   serviceAccountName: adcraft-service-account@adcraft-dev-2025.iam.gserviceaccount.com
   ```
   - Cloud Run automatically injects service account credentials
   - No credential files needed
   - Uses IAM role permissions

**Characteristics**:
- ✅ More secure (service account with IAM policies)
- ✅ VPC service controls
- ✅ Enterprise features (audit logs, quotas, monitoring)
- ✅ Works seamlessly in Cloud Run (automatic auth)
- ❌ Only supports stable models (Gemini Pro, not 2.0 Flash yet)
- ❌ Image generation NOT available
- ❌ Requires GCP setup

---

## Why Vertex AI "Never Works Locally"

**This is actually a MISCONCEPTION!** Let me explain:

### What You're Experiencing

**Scenario 1: Vertex AI Seems to Fail Locally**
```
Reality: Vertex AI DOES work locally, but...
- Text generation: ✅ Works (Gemini Pro)
- Vision analysis: ✅ Works (Gemini Pro Vision)
- Image generation: ❌ Fails (not supported on Vertex AI)
```

**Scenario 2: "But It Works in Production!"**
```
Reality: In production, Vertex AI ALSO works for text/vision, but...
- AI Studio client is missing (no GEMINI_API_KEY)
- Falls back to Vertex AI for everything
- Image generation fails because Vertex AI doesn't support it
```

**The Truth**:
- Vertex AI works IDENTICALLY in local and production
- The DIFFERENCE is which client gets initialized
- Local: AI Studio (because API key exists)
- Production: Only Vertex AI (because API key missing)

---

### Proof: Vertex AI Works Locally

**Test it yourself**:

1. **Temporarily remove AI Studio client** (gemini.ts):
```typescript
constructor(vertexAIService?: VertexAIService) {
  // Comment out AI Studio initialization
  // const geminiApiKey = process.env.GEMINI_API_KEY;
  // if (geminiApiKey) {
  //   this.aiStudioClient = new GeminiAIStudioClient(geminiApiKey);
  // }

  // Only use Vertex AI
  if (vertexAIService) {
    this.vertexAIClient = new VertexAIClient(vertexAIService);
  }
}
```

2. **Test product analysis** (text generation):
```bash
# Upload product image and analyze
# This will use ONLY Vertex AI locally
# You'll see it works perfectly!
```

**Result**: Vertex AI works fine locally for supported operations (text, vision).

---

## The Real Issue: Feature Availability

| Feature | AI Studio | Vertex AI | Notes |
|---------|-----------|-----------|-------|
| **Text Generation** | ✅ Gemini 2.0 Flash | ✅ Gemini Pro | Both work |
| **Vision Analysis** | ✅ Gemini 2.0 Flash | ✅ Gemini Pro Vision | Both work |
| **Image Generation** | ✅ Gemini 2.0 Flash (Imagen) | ❌ NOT SUPPORTED | Only AI Studio |
| **Latest Models** | ✅ Beta/experimental | ❌ Stable only | AI Studio first |
| **Authentication** | API Key | Service Account | Different methods |
| **Local Development** | ✅ Simple setup | ✅ Works (needs gcloud auth) | Both supported |
| **Production** | ✅ Works (needs env var) | ✅ Works (automatic) | Both supported |

---

## Honest Assessment & Solutions

### Why You See This Pattern

**Local Development**:
```
You: "I need to generate images"
App: Checks GEMINI_API_KEY → Found → Uses AI Studio → Success!
You: "Vertex AI never works!"
Reality: Vertex AI WOULD work, but AI Studio has priority
```

**Production**:
```
You: "I need to generate images"
App: Checks GEMINI_API_KEY → Not found → Only Vertex AI available → Fails!
Error: "Vertex AI doesn't support image generation"
You: "Why does Vertex AI work in production but not locally?"
Reality: Vertex AI works the same everywhere, but image generation isn't supported
```

---

## Solutions (Ranked by Recommendation)

### ✅ Solution 1: Add GEMINI_API_KEY to Cloud Run (RECOMMENDED)

**Why This is Best**:
- ✅ Minimal code changes
- ✅ Uses existing working logic
- ✅ AI Studio has latest features
- ✅ Image generation works immediately
- ✅ Consistent with local development

**How to Implement**:

#### Option A: Via Pulumi (Recommended)
```typescript
// infrastructure/compute.ts
envs: [
  {
    name: 'APP_MODE',
    value: 'real',
  },
  {
    name: 'GCP_PROJECT_ID',
    value: projectId,
  },
  {
    name: 'GCP_REGION',
    value: region,
  },
  {
    name: 'STORAGE_BUCKET_NAME',
    value: bucketName,
  },
  {
    name: 'FIRESTORE_DATABASE_NAME',
    value: databaseName,
  },
  {
    name: 'NODE_ENV',
    value: 'production',
  },
  // ✅ ADD THIS
  {
    name: 'GEMINI_API_KEY',
    value: process.env.GEMINI_API_KEY || '',
  },
],
```

**Then deploy**:
```bash
# Set API key in Pulumi config (secure)
cd infrastructure
pulumi config set --secret gemini-api-key AIzaSyC4DWI8zy-KywLFXj9l5pjwQs7Lxy-Loro

# Update compute.ts to read from config
const config = new pulumi.Config();
const geminiApiKey = config.getSecret('gemini-api-key');

// Then in envs array
{
  name: 'GEMINI_API_KEY',
  value: geminiApiKey,
}

# Deploy
pulumi up
```

#### Option B: Via Google Secret Manager (Most Secure)
```bash
# 1. Create secret
gcloud secrets create gemini-api-key \
  --data-file=- <<EOF
AIzaSyC4DWI8zy-KywLFXj9l5pjwQs7Lxy-Loro
EOF

# 2. Grant access to service account
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:adcraft-service-account@adcraft-dev-2025.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# 3. Update Pulumi to reference secret
{
  name: 'GEMINI_API_KEY',
  valueFrom: {
    secretKeyRef: {
      name: 'gemini-api-key',
      version: 'latest'
    }
  }
}
```

**Pros**:
- ✅ Fastest to implement
- ✅ Works immediately
- ✅ Consistent behavior local/prod
- ✅ Latest Gemini features

**Cons**:
- ⚠️ Relies on AI Studio (external service)
- ⚠️ API key needs rotation
- ⚠️ Less enterprise control

---

### ⚠️ Solution 2: Wait for Vertex AI Image Support (NOT RECOMMENDED)

**When Vertex AI Adds Gemini 2.0 Flash**:
```typescript
// Future: When Vertex AI supports image generation
public async generateImages(prompt: string, count: number = 4): Promise<GeminiImageResponse> {
  if (this.aiStudioClient) {
    return await this.aiStudioClient.generateImages(prompt, count);
  } else if (this.vertexAIClient) {
    // This will work in the future
    return await this.vertexAIClient.generateImages(prompt, count);
  } else {
    throw new Error("No client available");
  }
}
```

**Pros**:
- ✅ Enterprise-grade (Vertex AI)
- ✅ VPC controls
- ✅ Better security

**Cons**:
- ❌ Unknown timeline (could be months)
- ❌ Blocks current functionality
- ❌ No workaround

**Verdict**: Don't wait. Use Solution 1 now, migrate later if needed.

---

### 🔧 Solution 3: Use Imagen API Directly via Vertex AI (COMPLEX)

**Alternative**: Use Vertex AI's Imagen 3 API instead of Gemini 2.0 Flash.

```typescript
// New service: lib/services/imagen.ts
import { ImageGenerationModel } from '@google-cloud/vertexai';

export class ImagenService {
  async generateImages(prompt: string, count: number = 4) {
    const model = new ImageGenerationModel('imagen-3.0-generate-001');
    const result = await model.predict({
      instances: [{ prompt }],
      parameters: {
        sampleCount: count,
        aspectRatio: '1:1',
        safetyFilterLevel: 'block_some',
      }
    });
    return result.predictions;
  }
}
```

**Pros**:
- ✅ Uses Vertex AI (enterprise)
- ✅ No API key needed
- ✅ Production-grade

**Cons**:
- ⚠️ Different API (requires code changes)
- ⚠️ Different image quality/style
- ⚠️ Different pricing model
- ⚠️ More complex implementation

**Verdict**: Possible, but requires significant refactoring.

---

### ❌ Solution 4: Remove Image Generation Feature (BAD IDEA)

**Don't Do This**:
```typescript
// Just disable the feature in production
if (process.env.NODE_ENV === 'production') {
  throw new Error("Image generation not available in production");
}
```

**Why This is Bad**:
- ❌ Removes valuable feature
- ❌ Poor user experience
- ❌ Doesn't solve the root issue

---

## My Honest Recommendation

### Best Approach: Solution 1 (Add GEMINI_API_KEY to Cloud Run)

**Implementation Steps**:

1. **Use Google Secret Manager** (most secure):
```bash
# Create secret
echo -n "AIzaSyC4DWI8zy-KywLFXj9l5pjwQs7Lxy-Loro" | \
  gcloud secrets create gemini-api-key --data-file=-

# Grant access
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:adcraft-service-account@adcraft-dev-2025.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

2. **Update Pulumi to use secret**:
```typescript
// infrastructure/compute.ts
import * as gcp from '@pulumi/gcp';

// Get secret
const geminiApiKeySecret = gcp.secretmanager.getSecretVersionOutput({
  secret: 'gemini-api-key',
  version: 'latest',
});

// In container envs
{
  name: 'GEMINI_API_KEY',
  value: geminiApiKeySecret.secretData,
}
```

3. **Deploy**:
```bash
cd infrastructure
pulumi up
```

4. **Test**:
```bash
curl -X POST https://adcraft-service-ybvh3xrona-an.a.run.app/api/agents/product-intelligence/generate-images \
  -H "Content-Type: application/json" \
  -d '{"productName":"Tea Bag","productDescription":"Organic green tea","locale":"en"}'
```

**Why This is Best**:
- ✅ 15 minutes to implement
- ✅ Secure (Secret Manager)
- ✅ Works immediately
- ✅ No code changes needed
- ✅ Consistent local/prod behavior
- ✅ Easy to rotate API key

---

## Understanding "Why Vertex AI Works Differently"

### The Misconception

**What You Think**:
> "Vertex AI doesn't work locally but works in production"

**The Reality**:
> "Vertex AI works IDENTICALLY in both environments. The DIFFERENCE is:
> - **Local**: AI Studio gets priority (because API key exists)
> - **Production**: Only Vertex AI available (because API key missing)
> - **Image generation**: Only AI Studio supports it (Vertex AI doesn't have this feature yet)"

### The Truth About Vertex AI

**Vertex AI is ENVIRONMENT-AGNOSTIC**:

| Operation | Local (with gcloud auth) | Production (with service account) |
|-----------|-------------------------|-----------------------------------|
| Text generation | ✅ Works | ✅ Works |
| Vision analysis | ✅ Works | ✅ Works |
| Image generation | ❌ Not supported | ❌ Not supported |
| Authentication | Uses user account | Uses service account |
| Performance | Same | Same |

**The difference you see is NOT Vertex AI behavior - it's which CLIENT gets used!**

---

## Final Thoughts

### What's Really Happening

```
Local Development:
  GEMINI_API_KEY exists
      ↓
  AI Studio client created (has image generation)
      ↓
  Vertex AI client also created
      ↓
  AI Studio has priority for image generation
      ↓
  ✅ Images generated successfully
      ↓
  You think: "AI Studio works, Vertex AI doesn't work locally"
  Reality: Both work, but AI Studio handles image requests

Production:
  GEMINI_API_KEY missing
      ↓
  AI Studio client NOT created
      ↓
  Only Vertex AI client created
      ↓
  Image generation request arrives
      ↓
  ❌ Vertex AI doesn't support image generation
      ↓
  Error thrown
      ↓
  You think: "Vertex AI works in production but not locally"
  Reality: Vertex AI always worked, but can't generate images
```

### Root Cause

**Not a Vertex AI bug or environment difference.**
**It's a FEATURE AVAILABILITY issue combined with MISSING ENVIRONMENT VARIABLE.**

### The Fix

**Add `GEMINI_API_KEY` to Cloud Run environment variables.**
**That's it. Problem solved.**

---

## Implementation Guide

Want me to implement Solution 1 for you? I can:

1. Update Pulumi configuration to use Secret Manager
2. Create the secret in GCP
3. Grant appropriate permissions
4. Redeploy to Cloud Run
5. Verify image generation works

Just let me know and I'll implement it step-by-step!

---

**Document Date**: October 30, 2025
**Status**: Analysis Complete
**Recommendation**: Implement Solution 1 (Add GEMINI_API_KEY via Secret Manager)
**Estimated Time**: 15 minutes
**Risk Level**: Low (non-breaking change, just adds missing env var)
