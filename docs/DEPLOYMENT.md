# AdCraft AI - Deployment Guide

Complete guide for deploying AdCraft AI to Google Cloud Platform.

## 🎯 Quick Start

### Automated Deployment (Recommended)

**Windows (PowerShell):**
```powershell
.\scripts\deploy.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

The automated script will:
1. ✅ Verify all prerequisites
2. 🔧 Configure Docker authentication
3. 🏗️ Build the Docker image
4. 🏷️ Tag for Artifact Registry
5. 📤 Push to Google Cloud
6. 🚀 Deploy to Cloud Run
7. 🌐 Provide the service URL

---

## 📋 Prerequisites

### Required Tools

1. **Google Cloud SDK**
   ```bash
   # Install from: https://cloud.google.com/sdk/docs/install

   # Verify installation
   gcloud --version
   ```

2. **Docker**
   ```bash
   # Install from: https://docs.docker.com/get-docker/

   # Verify installation
   docker --version
   ```

3. **Pulumi (Optional)**
   ```bash
   # Install from: https://www.pulumi.com/docs/get-started/install/

   # Verify installation
   pulumi version
   ```

### Google Cloud Setup

1. **Authenticate with Google Cloud:**
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

2. **Set the correct project:**
   ```bash
   gcloud config set project adcraft-dev-2025
   ```

3. **Enable required APIs:**
   ```bash
   gcloud services enable aiplatform.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   gcloud services enable storage-api.googleapis.com
   gcloud services enable firestore.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   ```

4. **Configure Docker for Artifact Registry:**
   ```bash
   gcloud auth configure-docker asia-northeast1-docker.pkg.dev
   ```

---

## 🚀 Deployment Methods

### Method 1: Automated Script (Recommended)

This is the **fastest and safest** method with built-in error checking.

**Windows:**
```powershell
.\scripts\deploy.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**What it does:**
- Pre-deployment validation (gcloud, Docker, authentication)
- Builds optimized Docker image
- Pushes to Artifact Registry
- Updates Cloud Run service
- Provides service URL and next steps

---

### Method 2: NPM Scripts (Manual Control)

For developers who want more control over each step.

#### Step 1: Build Docker Image
```bash
npm run docker:build
```

#### Step 2: Tag for Artifact Registry
```bash
npm run docker:tag
```

#### Step 3: Push to Artifact Registry
```bash
npm run docker:push
```

#### Step 4: Deploy to Cloud Run

**Option A: Via Pulumi (Recommended)**
```bash
cd infrastructure
pulumi up
cd ..
```

**Option B: Via gcloud (Direct)**
```bash
gcloud run deploy adcraft-service \
  --image asia-northeast1-docker.pkg.dev/adcraft-dev-2025/adcraft-ai/adcraft-ai:latest \
  --region asia-northeast1 \
  --platform managed \
  --allow-unauthenticated
```

#### Step 5: Get Service URL
```bash
npm run gcloud:url
```

---

### Method 3: One-Command Deployment

Build, tag, and push in one command:

```bash
npm run docker:deploy
```

Then deploy via Pulumi or gcloud (see Method 2, Step 4).

---

## 🏗️ Infrastructure Overview

### Pulumi-Managed Resources

Your infrastructure is defined in `infrastructure/` and includes:

| Resource | Purpose | Configuration |
|----------|---------|---------------|
| **Cloud Run** | Next.js application hosting | 0-10 instances, 2 vCPU, 2GB RAM |
| **Artifact Registry** | Docker image storage | asia-northeast1, Docker format |
| **Cloud Storage** | Temporary file storage | 12-hour lifecycle policy |
| **Firestore** | Session/job database | Native mode |
| **Service Account** | Secure API access | Least privilege IAM roles |
| **Budget Alerts** | Cost monitoring | 50%, 75%, 90% thresholds |

### Key Configuration Files

```
infrastructure/
├── index.ts          # Main Pulumi entry point
├── compute.ts        # Cloud Run configuration
├── iam.ts            # Service account & permissions
├── storage.ts        # Cloud Storage setup
├── database.ts       # Firestore configuration
└── monitoring.ts     # Budget alerts & monitoring
```

---

## 🔍 Verification & Testing

### 1. Check Deployment Status

```bash
gcloud run services describe adcraft-service \
  --region asia-northeast1 \
  --format="value(status.url,status.conditions[0].status)"
```

### 2. View Logs

```bash
gcloud run logs read adcraft-service --region asia-northeast1
```

### 3. Test the Application

```bash
# Get the service URL
SERVICE_URL=$(gcloud run services describe adcraft-service \
  --region asia-northeast1 \
  --format="value(status.url)")

# Test health endpoint
curl $SERVICE_URL/api/health

# Open in browser
echo "Visit: $SERVICE_URL"
```

### 4. Monitor Costs

```bash
# View current usage
gcloud billing accounts list

# Check budget alerts
gcloud alpha billing budgets list
```

---

## 🐛 Troubleshooting

### Docker Build Fails

**Error:** `next build` fails during Docker build

**Solution:**
```bash
# Check if local build works
npm run build:docker

# Clean Docker cache and rebuild
docker system prune -a
npm run docker:build
```

---

### Authentication Issues

**Error:** `permission denied` or `unauthorized`

**Solution:**
```bash
# Re-authenticate
gcloud auth login
gcloud auth application-default login

# Re-configure Docker
gcloud auth configure-docker asia-northeast1-docker.pkg.dev

# Verify current account
gcloud config list
```

---

### Image Push Fails

**Error:** `denied: Permission "artifactregistry.repositories.uploadArtifacts" denied`

**Solution:**
```bash
# Verify project is correct
gcloud config get-value project

# Ensure Artifact Registry API is enabled
gcloud services enable artifactregistry.googleapis.com

# Check if repository exists
gcloud artifacts repositories list --location=asia-northeast1
```

---

### Cloud Run Deployment Fails

**Error:** `Service deployment failed`

**Solution:**
```bash
# Check service account permissions
gcloud projects get-iam-policy adcraft-dev-2025 \
  --flatten="bindings[].members" \
  --filter="bindings.members:adcraft-service-account@*"

# View detailed error logs
gcloud run services describe adcraft-service \
  --region asia-northeast1 \
  --format="yaml(status.conditions)"
```

---

### Pulumi Update Fails

**Error:** `pulumi up` returns errors

**Solution:**
```bash
cd infrastructure

# Refresh Pulumi state
pulumi refresh

# View detailed error
pulumi up --debug

# If needed, destroy and recreate
pulumi destroy
pulumi up
```

---

## 🔄 Updating the Deployment

### Quick Update (Code Changes Only)

```bash
# Using automated script
.\scripts\deploy.ps1  # Windows
./scripts/deploy.sh   # Linux/Mac

# OR using npm scripts
npm run docker:deploy
cd infrastructure && pulumi up
```

### Infrastructure Changes

```bash
cd infrastructure

# Preview changes
pulumi preview

# Apply changes
pulumi up
```

### Environment Variables

Update in `infrastructure/compute.ts`:

```typescript
envs: [
  {
    name: 'APP_MODE',
    value: 'real',  // or 'demo'
  },
  {
    name: 'GCP_PROJECT_ID',
    value: projectId,
  },
  // Add more environment variables here
]
```

Then run:
```bash
cd infrastructure
pulumi up
```

---

## 💰 Cost Management

### Monitor Budget

```bash
# View current spend
gcloud billing accounts list

# Check budget alerts (set at 50%, 75%, 90% of $300)
gcloud alpha billing budgets list --billing-account=YOUR_BILLING_ACCOUNT_ID
```

### Cost Optimization Tips

1. **Cloud Run auto-scaling**: Scales to 0 when not in use (saves cost)
2. **Storage lifecycle**: Files auto-delete after 12 hours
3. **Firestore**: Optimize queries to reduce reads/writes
4. **Monitoring**: Only essential metrics enabled

### Estimated Costs

| Component | Estimated Cost per Video |
|-----------|--------------------------|
| Vertex AI (Gemini) | $0.50 - $0.70 |
| Veo (Video Gen) | $1.00 - $1.20 |
| Cloud Run | $0.10 - $0.20 |
| Storage | $0.01 - $0.05 |
| **Total** | **$1.61 - $2.15** |

**Budget**: $300 = ~140-186 videos

---

## 🔐 Security Best Practices

### Service Account Permissions

The deployment uses **least privilege** IAM roles:

```typescript
// Only required permissions (see infrastructure/iam.ts)
'roles/aiplatform.user',           // Vertex AI access
'roles/storage.objectUser',         // Storage read/write
'roles/datastore.user',             // Firestore access
'roles/run.invoker',                // Cloud Run invocation
'roles/monitoring.metricWriter',    // Metrics
'roles/logging.logWriter',          // Logs
```

### Secrets Management

**Never commit secrets to git!**

Use Google Secret Manager:

```bash
# Create a secret
gcloud secrets create my-api-key --data-file=./secret.txt

# Grant access to service account
gcloud secrets add-iam-policy-binding my-api-key \
  --member="serviceAccount:adcraft-service-account@adcraft-dev-2025.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 📊 Monitoring & Observability

### View Logs

```bash
# Real-time logs
gcloud run logs tail adcraft-service --region asia-northeast1

# Filter by severity
gcloud run logs read adcraft-service \
  --region asia-northeast1 \
  --filter="severity>=ERROR"
```

### Metrics Dashboard

Access at: https://console.cloud.google.com/run/detail/asia-northeast1/adcraft-service/metrics

Key metrics to monitor:
- Request count
- Request latency (p50, p95, p99)
- Error rate
- Container instance count
- CPU & memory utilization

---

## 🆘 Getting Help

### Common Commands

```bash
# Get service URL
npm run gcloud:url

# View service details
gcloud run services describe adcraft-service --region asia-northeast1

# List all Cloud Run services
gcloud run services list --region asia-northeast1

# View Pulumi stack outputs
cd infrastructure && pulumi stack output

# Check Docker images in Artifact Registry
gcloud artifacts docker images list asia-northeast1-docker.pkg.dev/adcraft-dev-2025/adcraft-ai
```

### Support Resources

- **Google Cloud Documentation**: https://cloud.google.com/run/docs
- **Pulumi Documentation**: https://www.pulumi.com/docs/
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Project README**: See [README.md](./README.md)

---

## ✅ Deployment Checklist

Before deploying to production:

- [ ] All tests passing (`npm run test:run`)
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] Environment variables configured in `infrastructure/compute.ts`
- [ ] Budget alerts configured and tested
- [ ] Service account permissions reviewed
- [ ] Secrets not committed to git
- [ ] Local build successful (`npm run build:docker`)
- [ ] Docker daemon running
- [ ] Authenticated with gcloud
- [ ] Correct GCP project selected
- [ ] Required APIs enabled
- [ ] Artifact Registry repository exists

---

## 🎉 Success Criteria

Your deployment is successful when:

1. ✅ Automated script completes without errors
2. ✅ Service URL is accessible
3. ✅ Health check endpoint returns 200: `curl $SERVICE_URL/api/health`
4. ✅ Application loads in browser
5. ✅ Logs show no errors: `gcloud run logs read adcraft-service`
6. ✅ Budget alerts configured and working

---

**Need help?** Check the troubleshooting section above or review the infrastructure configuration in `infrastructure/`.
