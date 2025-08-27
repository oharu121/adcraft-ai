# AdCraft AI Infrastructure

Pulumi Infrastructure as Code for the minimal video generator system.

## Prerequisites

- [Pulumi CLI](https://www.pulumi.com/docs/get-started/install/) installed
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed
- GCP project with billing enabled
- Required APIs enabled:
  - Vertex AI API
  - Cloud Run API
  - Cloud Storage API
  - Firestore API
  - Cloud Monitoring API
  - Cloud Logging API

## Quick Start

1. **Run the setup script:**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Preview the infrastructure:**
   ```bash
   pulumi preview
   ```

3. **Deploy the infrastructure:**
   ```bash
   pulumi up
   ```

## Infrastructure Components

### Core Services
- **Cloud Run**: Hosts the Next.js application with auto-scaling (0-10 instances)
- **Cloud Storage**: Temporary file storage with 12-hour lifecycle cleanup
- **Firestore**: Session and job status storage with optimized indexes
- **Service Account**: Secure access with minimal required permissions

### Monitoring & Cost Control
- **Budget Alerts**: Notifications at 50%, 75%, 90% of $300 budget
- **Monitoring Dashboard**: Request metrics, latency, and error rates
- **Structured Logging**: Application logs with correlation IDs

### Security
- **IAM Roles**: Principle of least privilege for all services
- **CORS Configuration**: Proper web upload security
- **Public Access**: Controlled public access to generated videos only

## Configuration

The infrastructure uses these Pulumi configuration values:

- `gcp:project`: Your GCP project ID (required)
- `gcp:region`: Deployment region (default: asia-northeast1)

Set configuration values:
```bash
pulumi config set gcp:project your-project-id
pulumi config set gcp:region asia-northeast1
```

## Outputs

After deployment, the following outputs are available for the application:

- `projectId`: GCP project ID
- `region`: Deployment region  
- `serviceAccountEmail`: Service account for authentication
- `bucketName`: Storage bucket name
- `databaseName`: Firestore database name
- `cloudRunUrl`: Application URL

Get outputs:
```bash
pulumi stack output
```

## Cost Optimization

The infrastructure is designed for cost efficiency:

- **Cloud Run**: Pay-per-request with 0-instance scaling
- **Storage**: Lifecycle policy deletes files after 12 hours
- **Firestore**: Native mode with minimal read/write operations
- **Monitoring**: Essential metrics only

Estimated costs per video generation: $1.81-2.01

## Development vs Production

For different environments, use separate Pulumi stacks:

```bash
pulumi stack init staging
pulumi stack init production
```

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```

⚠️ **Warning**: This will permanently delete all data and resources.

## Troubleshooting

### Authentication Issues
```bash
gcloud auth login
gcloud auth application-default login
```

### Missing APIs
Enable required APIs:
```bash
gcloud services enable aiplatform.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable storage-api.googleapis.com
gcloud services enable firestore.googleapis.com
```

### Permission Errors
Ensure your account has the following roles:
- Project Editor or Owner
- Cloud Run Admin
- Storage Admin
- Firestore Admin