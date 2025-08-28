# Google Cloud Platform Deployment Guide

## Overview

This guide provides comprehensive step-by-step instructions for deploying AdCraft AI to Google Cloud Platform. The deployment uses infrastructure-as-code (Pulumi) for consistent, reproducible deployments across environments.

## Prerequisites

### Required Tools
- **Node.js**: v18.17.0 or later
- **Docker**: Latest stable version
- **Google Cloud SDK**: Latest version
- **Pulumi CLI**: v3.191.0 or later
- **Git**: For source code management

### Required Accounts
- **Google Cloud Platform**: Account with billing enabled
- **Pulumi Cloud**: Account for state management (free tier available)
- **GitHub**: For source code repository (optional)

### Local Development Setup
```bash
# Install required tools (macOS with Homebrew)
brew install node@18
brew install docker
brew install google-cloud-sdk
brew install pulumi

# Verify installations
node --version    # Should show v18.17.0+
docker --version  # Should show latest stable
gcloud --version  # Should show latest SDK
pulumi version    # Should show v3.191.0+
```

## Phase 1: Google Cloud Project Setup

### Step 1: Create New GCP Project

```bash
# Login to Google Cloud
gcloud auth login

# Create new project (replace PROJECT_ID with your preferred ID)
export PROJECT_ID="adcraft-prod-2025"
gcloud projects create $PROJECT_ID

# Set as default project
gcloud config set project $PROJECT_ID

# Verify project creation
gcloud projects describe $PROJECT_ID
```

### Step 2: Enable Required APIs

```bash
# Enable all required APIs
gcloud services enable \
  run.googleapis.com \
  storage.googleapis.com \
  firestore.googleapis.com \
  compute.googleapis.com \
  containerregistry.googleapis.com \
  cloudbuild.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com \
  aiplatform.googleapis.com \
  translate.googleapis.com

# Verify API enablement (this may take 2-3 minutes)
gcloud services list --enabled --filter="name:(run.googleapis.com OR storage.googleapis.com OR firestore.googleapis.com)"
```

### Step 3: Set Up Billing

⚠️ **CRITICAL**: Ensure billing is enabled for your project

```bash
# Check if billing is enabled
gcloud beta billing projects describe $PROJECT_ID

# If not enabled, link billing account (replace BILLING_ACCOUNT_ID)
gcloud beta billing projects link $PROJECT_ID --billing-account=BILLING_ACCOUNT_ID

# Set up budget alerts to prevent overspend
gcloud beta billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="AdCraft AI Production Budget" \
  --budget-amount=300USD \
  --threshold-rule=percent-of-budget=50,spend-basis=current-spend \
  --threshold-rule=percent-of-budget=75,spend-basis=current-spend \
  --threshold-rule=percent-of-budget=90,spend-basis=current-spend
```

## Phase 2: Service Account Configuration

### Step 1: Create Service Accounts

```bash
# Create main application service account
gcloud iam service-accounts create adcraft-app \
  --display-name="AdCraft AI Application" \
  --description="Main service account for AdCraft AI application"

# Create Pulumi deployment service account
gcloud iam service-accounts create adcraft-deploy \
  --display-name="AdCraft AI Deployment" \
  --description="Service account for Pulumi infrastructure deployment"

# Get service account emails
export APP_SA_EMAIL="adcraft-app@${PROJECT_ID}.iam.gserviceaccount.com"
export DEPLOY_SA_EMAIL="adcraft-deploy@${PROJECT_ID}.iam.gserviceaccount.com"
```

### Step 2: Assign IAM Roles

```bash
# Application service account permissions (principle of least privilege)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$APP_SA_EMAIL" \
  --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$APP_SA_EMAIL" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$APP_SA_EMAIL" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$APP_SA_EMAIL" \
  --role="roles/logging.logWriter"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$APP_SA_EMAIL" \
  --role="roles/monitoring.metricWriter"

# Deployment service account permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$DEPLOY_SA_EMAIL" \
  --role="roles/owner"
```

### Step 3: Generate Service Account Keys

```bash
# Create keys directory
mkdir -p keys/

# Generate application service account key
gcloud iam service-accounts keys create keys/app-service-account.json \
  --iam-account=$APP_SA_EMAIL

# Generate deployment service account key
gcloud iam service-accounts keys create keys/deploy-service-account.json \
  --iam-account=$DEPLOY_SA_EMAIL

# Set environment variable for deployment
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/keys/deploy-service-account.json"
```

⚠️ **SECURITY WARNING**: Never commit service account keys to version control. Add `keys/` to `.gitignore`.

## Phase 3: Container Registry Setup

### Step 1: Configure Docker Authentication

```bash
# Configure Docker to authenticate with Google Container Registry
gcloud auth configure-docker

# Test authentication
docker pull gcr.io/google-containers/busybox
```

### Step 2: Build and Push Application Container

```bash
# Build the Docker image
docker build -t gcr.io/$PROJECT_ID/adcraft-ai:latest .

# Test the container locally (optional)
docker run -p 3000:3000 \
  -e GOOGLE_APPLICATION_CREDENTIALS=/app/keys/app-service-account.json \
  -e NODE_ENV=production \
  -v $(pwd)/keys:/app/keys \
  gcr.io/$PROJECT_ID/adcraft-ai:latest

# Push to Container Registry
docker push gcr.io/$PROJECT_ID/adcraft-ai:latest

# Verify image upload
gcloud container images list --repository=gcr.io/$PROJECT_ID
```

## Phase 4: Pulumi Infrastructure Deployment

### Step 1: Pulumi Setup

```bash
# Login to Pulumi (creates free account if needed)
pulumi login

# Initialize Pulumi stack
cd infrastructure/
pulumi stack init prod

# Set required configuration
pulumi config set gcp:project $PROJECT_ID
pulumi config set gcp:region asia-northeast1
pulumi config set gcp:zone asia-northeast1-a

# Set application configuration
pulumi config set adcraft:containerImage "gcr.io/$PROJECT_ID/adcraft-ai:latest"
pulumi config set adcraft:environment "production"
pulumi config set --secret adcraft:adminApiKey "your-secure-admin-api-key-here"

# Set budget configuration
pulumi config set adcraft:budgetLimit 300
pulumi config set adcraft:budgetAlertEmails "your-email@example.com"
```

### Step 2: Review Infrastructure Plan

```bash
# Preview infrastructure changes
pulumi preview

# Expected resources to be created:
# - Cloud Run service (main application)
# - Cloud Storage buckets (uploads, videos, temp)
# - Firestore database configuration
# - IAM bindings and service accounts
# - Cloud Monitoring dashboards
# - Budget alerts and notifications
# - Security policies and rate limiting
```

### Step 3: Deploy Infrastructure

```bash
# Deploy infrastructure (takes 5-10 minutes)
pulumi up

# Confirm deployment when prompted
# Monitor deployment progress in terminal
```

### Step 4: Verify Deployment

```bash
# Get service URL
export SERVICE_URL=$(pulumi stack output serviceUrl)

# Test health endpoint
curl "$SERVICE_URL/api/health"

# Should return:
# {
#   "status": "healthy",
#   "timestamp": "2025-08-28T10:30:00.000Z",
#   "uptime": 30,
#   "services": [...]
# }

# Test application in browser
open "$SERVICE_URL"
```

## Phase 5: Environment Configuration

### Step 1: Configure Environment Variables

```bash
# Set production environment variables in Cloud Run
gcloud run services update adcraft-service \
  --region=asia-northeast1 \
  --set-env-vars="NODE_ENV=production" \
  --set-env-vars="LOG_LEVEL=info" \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID" \
  --set-env-vars="BUDGET_LIMIT=300" \
  --set-env-vars="RATE_LIMIT_ENABLED=true"

# Set secret environment variables
echo "your-admin-api-key" | gcloud secrets create admin-api-key --data-file=-

gcloud run services update adcraft-service \
  --region=asia-northeast1 \
  --set-env-vars="ADMIN_API_KEY_SECRET=admin-api-key"
```

### Step 2: Configure Firestore

```bash
# Initialize Firestore in Native mode
gcloud firestore databases create \
  --region=asia-northeast1

# Create required collections with proper security rules
cat > firestore.rules << 'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write on jobs collection for authenticated services
    match /jobs/{jobId} {
      allow read, write: if request.auth != null;
    }
    
    // Allow read/write on sessions collection for authenticated services
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
EOF

# Deploy security rules
gcloud firestore rules deploy firestore.rules
```

### Step 3: Configure Cloud Storage

```bash
# Set up CORS for browser uploads (if needed)
cat > cors.json << 'EOF'
[
  {
    "origin": ["https://your-domain.com"],
    "method": ["GET", "POST", "PUT"],
    "responseHeader": ["Content-Type", "Authorization"],
    "maxAgeSeconds": 3600
  }
]
EOF

# Apply CORS configuration to upload bucket
gsutil cors set cors.json gs://adcraft-uploads-prod
```

## Phase 6: Monitoring and Alerting Setup

### Step 1: Configure Cloud Monitoring

```bash
# Create monitoring workspace (if not exists)
gcloud alpha monitoring channels create \
  --display-name="AdCraft AI Email Alerts" \
  --type=email \
  --channel-labels=email_address="your-email@example.com"

# Get notification channel ID
export CHANNEL_ID=$(gcloud alpha monitoring channels list \
  --filter="displayName:'AdCraft AI Email Alerts'" \
  --format="value(name)")
```

### Step 2: Set Up Budget Alerts

```bash
# Create budget alert for 50% threshold
gcloud alpha billing budgets create \
  --billing-account=$BILLING_ACCOUNT_ID \
  --display-name="AdCraft AI Budget Alert 50%" \
  --budget-amount=300USD \
  --threshold-rule="percent-of-budget=50,spend-basis=current-spend"

# Create budget alert for 90% threshold  
gcloud alpha billing budgets create \
  --billing-account=$BILLING_ACCOUNT_ID \
  --display-name="AdCraft AI Budget Alert 90%" \
  --budget-amount=300USD \
  --threshold-rule="percent-of-budget=90,spend-basis=current-spend"
```

### Step 3: Configure Application Monitoring

```bash
# Enable application monitoring through environment variables
gcloud run services update adcraft-service \
  --region=asia-northeast1 \
  --set-env-vars="MONITORING_ENABLED=true" \
  --set-env-vars="HEALTH_CHECK_INTERVAL=30000" \
  --set-env-vars="ALERT_CHECK_INTERVAL=60000"
```

## Phase 7: Security Configuration

### Step 1: Configure Security Headers

Security headers are automatically configured in the application. Verify they're working:

```bash
# Test security headers
curl -I "$SERVICE_URL/api/health"

# Should include headers like:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY  
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Step 2: Configure Rate Limiting

```bash
# Rate limiting is automatically configured through the application
# Verify it's working by testing limits:

# Test video generation rate limit (should allow 1 per hour)
curl -X POST "$SERVICE_URL/api/generate-video" \
  -H "Content-Type: application/json" \
  -d '{"productName": "Test", "targetAudience": "Test", "keyMessage": "Test"}'

# Making a second request should return 429 Too Many Requests
```

### Step 3: Configure Admin Access

```bash
# Test admin endpoint access
curl -H "Authorization: Bearer your-admin-api-key" \
  "$SERVICE_URL/api/admin/monitoring"

# Should return monitoring dashboard data
```

## Phase 8: SSL and Domain Configuration

### Step 1: Configure Custom Domain (Optional)

```bash
# If you have a custom domain, map it to Cloud Run
gcloud run domain-mappings create \
  --service=adcraft-service \
  --domain=your-domain.com \
  --region=asia-northeast1

# Follow the DNS configuration instructions provided
```

### Step 2: Verify SSL Certificate

```bash
# SSL certificates are automatically provisioned by Cloud Run
# Verify certificate is valid
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

## Phase 9: Backup and Disaster Recovery

### Step 1: Configure Automated Backups

```bash
# Enable Firestore backup
gcloud firestore operations list

# Cloud Storage automatically provides 30-day object versioning
# No additional configuration needed for basic backup
```

### Step 2: Export Infrastructure Configuration

```bash
# Export current Pulumi state
pulumi stack export > infrastructure-backup-$(date +%Y%m%d).json

# Store backup in secure location
```

## Phase 10: Performance Optimization

### Step 1: Configure Cloud Run Performance

```bash
# Optimize Cloud Run service configuration
gcloud run services replace service.yaml --region=asia-northeast1

# service.yaml should include:
# spec:
#   template:
#     spec:
#       containerConcurrency: 100
#       containers:
#       - image: gcr.io/PROJECT_ID/adcraft-ai:latest
#         resources:
#           limits:
#             cpu: "2"
#             memory: "2Gi"
#           requests:
#             cpu: "1"
#             memory: "1Gi"
```

### Step 2: Enable CDN (Optional)

```bash
# For static assets, configure Cloud CDN
gcloud compute backend-services create adcraft-backend \
  --global

gcloud compute url-maps create adcraft-map \
  --default-backend-service=adcraft-backend

gcloud compute target-https-proxies create adcraft-proxy \
  --url-map=adcraft-map
```

## Post-Deployment Verification

### Health Check Verification

```bash
# Comprehensive health check
curl "$SERVICE_URL/api/health" | jq '.'

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2025-08-28T10:30:00.000Z",
#   "uptime": 300,
#   "overallScore": 95,
#   "services": [
#     {"name": "Vertex AI", "status": "healthy", "responseTime": 245},
#     {"name": "Cloud Storage", "status": "healthy", "responseTime": 89},
#     {"name": "Firestore", "status": "healthy", "responseTime": 156}
#   ]
# }
```

### API Endpoint Testing

```bash
# Test main application endpoints
echo "Testing video generation endpoint..."
curl -X POST "$SERVICE_URL/api/generate-video" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Premium Wireless Headphones",
    "targetAudience": "Young professionals",
    "keyMessage": "Experience crystal-clear sound"
  }'

echo "Testing status endpoint..."
curl "$SERVICE_URL/api/status/test-job-id"

echo "Testing admin monitoring..."
curl -H "Authorization: Bearer $ADMIN_API_KEY" \
  "$SERVICE_URL/api/admin/monitoring?section=overview"
```

### Localization Testing

```bash
# Test English interface
curl "$SERVICE_URL/en" -I

# Test Japanese interface  
curl "$SERVICE_URL/ja" -I

# Both should return 200 OK
```

### Performance Benchmarking

```bash
# Install Apache Bench for load testing
# Test performance under load (adjust -n and -c as needed)
ab -n 100 -c 10 "$SERVICE_URL/api/health"

# Expected results:
# - Response time: <500ms for health checks
# - Success rate: 100%
# - No memory leaks or errors
```

## Troubleshooting Common Issues

### Issue 1: Container Registry Push Failed

```bash
# Ensure Docker is properly authenticated
gcloud auth configure-docker

# Verify project ID is correct
echo $PROJECT_ID

# Rebuild and push image
docker build -t gcr.io/$PROJECT_ID/adcraft-ai:latest .
docker push gcr.io/$PROJECT_ID/adcraft-ai:latest
```

### Issue 2: Service Account Permissions

```bash
# List current IAM bindings
gcloud projects get-iam-policy $PROJECT_ID

# Add missing permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$APP_SA_EMAIL" \
  --role="roles/MISSING_ROLE"
```

### Issue 3: Cloud Run Service Won't Start

```bash
# Check Cloud Run logs
gcloud run services logs read adcraft-service \
  --region=asia-northeast1 \
  --limit=50

# Common issues:
# - Missing environment variables
# - Service account key not found
# - Port not properly configured (should be 3000)
```

### Issue 4: Firestore Permission Denied

```bash
# Verify Firestore is properly initialized
gcloud firestore databases describe --database='(default)'

# Check security rules
gcloud firestore rules get

# Update service account permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$APP_SA_EMAIL" \
  --role="roles/datastore.user"
```

### Issue 5: Budget Alerts Not Working

```bash
# List existing budgets
gcloud beta billing budgets list --billing-account=$BILLING_ACCOUNT_ID

# Recreate budget with correct configuration
gcloud beta billing budgets create \
  --billing-account=$BILLING_ACCOUNT_ID \
  --display-name="AdCraft AI Production Budget" \
  --budget-amount=300USD \
  --threshold-rule="percent-of-budget=50,spend-basis=current-spend"
```

## Maintenance and Updates

### Regular Maintenance Tasks

```bash
# Weekly tasks
./scripts/weekly-maintenance.sh

# Tasks include:
# - Update service dependencies
# - Review error logs
# - Check budget usage
# - Verify backup integrity
# - Update security policies
```

### Application Updates

```bash
# Deploy new version
docker build -t gcr.io/$PROJECT_ID/adcraft-ai:v1.1.0 .
docker push gcr.io/$PROJECT_ID/adcraft-ai:v1.1.0

# Update Pulumi configuration
pulumi config set adcraft:containerImage "gcr.io/$PROJECT_ID/adcraft-ai:v1.1.0"

# Deploy update
pulumi up
```

### Monitoring and Alerting Reviews

```bash
# Review alert performance monthly
gcloud alpha monitoring policies list

# Update alert thresholds based on performance data
# Review and update security policies
# Check for new security vulnerabilities
```

## Cost Optimization

### Regular Cost Reviews

```bash
# Get current billing data
gcloud beta billing accounts describe $BILLING_ACCOUNT_ID

# Analyze cost by service
gcloud billing accounts get-billing-info $PROJECT_ID

# Common optimization strategies:
# - Review Cloud Run CPU allocation
# - Optimize storage bucket lifecycle policies
# - Review API call patterns
# - Implement more aggressive rate limiting
```

### Resource Cleanup

```bash
# Clean up old container images (keep latest 5)
gcloud container images list-tags gcr.io/$PROJECT_ID/adcraft-ai \
  --format="table(digest,timestamp.date())" \
  --sort-by=timestamp \
  --limit=999999 | tail -n +6 | \
  awk '{print $1}' | \
  xargs -I {} gcloud container images delete gcr.io/$PROJECT_ID/adcraft-ai@{}

# Clean up old Firestore data
# (implement in application based on retention policies)

# Clean up temporary Cloud Storage files
gsutil -m rm -r gs://adcraft-temp-prod/**
```

## Security Best Practices

### Regular Security Reviews

1. **Review IAM permissions monthly**
2. **Update service account keys quarterly** 
3. **Monitor security events daily**
4. **Update dependencies monthly**
5. **Review rate limiting effectiveness weekly**

### Security Monitoring

```bash
# Review security events
curl -H "Authorization: Bearer $ADMIN_API_KEY" \
  "$SERVICE_URL/api/admin/security"

# Check for unusual patterns
# - Multiple failed requests from same IP
# - Unusual geographic patterns
# - Suspicious request payloads
```

## Conclusion

This deployment guide provides a comprehensive foundation for running AdCraft AI in production on Google Cloud Platform. The infrastructure is designed for:

- **Scalability**: Handles traffic spikes automatically
- **Reliability**: Built-in health checks and monitoring  
- **Security**: Defense-in-depth approach with multiple layers
- **Cost Control**: Budget alerts and optimization recommendations
- **Maintainability**: Infrastructure-as-code for consistent deployments

For ongoing support and updates, refer to the troubleshooting section and maintain regular monitoring of the application and infrastructure health.