# AdCraft AI - Automated Deployment Script (PowerShell)
# Builds Docker image, pushes to Artifact Registry, and updates Cloud Run

# Configuration
$PROJECT_ID = "adcraft-dev-2025"
$REGION = "asia-northeast1"
$REPOSITORY = "adcraft-ai"
$IMAGE_NAME = "adcraft-ai"
$SERVICE_NAME = "adcraft-service"
$IMAGE_URL = "$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/${IMAGE_NAME}:latest"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AdCraft AI Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Pre-deployment checks
Write-Host "[1/6] Running pre-deployment checks..." -ForegroundColor Yellow

# Check gcloud
Write-Host "Checking gcloud..." -ForegroundColor Gray
$gcl = Get-Command gcloud -ErrorAction SilentlyContinue
if ($null -eq $gcl) {
    Write-Host "ERROR: gcloud CLI is not installed" -ForegroundColor Red
    Write-Host "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
}

# Check docker
Write-Host "Checking Docker..." -ForegroundColor Gray
$dock = Get-Command docker -ErrorAction SilentlyContinue
if ($null -eq $dock) {
    Write-Host "ERROR: Docker is not installed" -ForegroundColor Red
    Write-Host "Install from: https://docs.docker.com/get-docker/"
    exit 1
}

# Check authentication
Write-Host "Checking gcloud authentication..." -ForegroundColor Gray
$currentAccount = gcloud config get-value account 2>$null
if ([string]::IsNullOrWhiteSpace($currentAccount)) {
    Write-Host "ERROR: Not logged into gcloud" -ForegroundColor Red
    Write-Host "Run: gcloud auth login" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Logged in as: $currentAccount" -ForegroundColor Green

# Check project
Write-Host "Checking GCP project..." -ForegroundColor Gray
$currentProject = gcloud config get-value project 2>$null
if ($currentProject -ne $PROJECT_ID) {
    Write-Host "⚠ Current project: $currentProject" -ForegroundColor Yellow
    Write-Host "⚠ Expected project: $PROJECT_ID" -ForegroundColor Yellow
    $response = Read-Host "Switch to $PROJECT_ID? (y/n)"
    if ($response -match '^[Yy]$') {
        gcloud config set project $PROJECT_ID | Out-Null
        Write-Host "✓ Switched to project: $PROJECT_ID" -ForegroundColor Green
    }
    else {
        Write-Host "Deployment cancelled" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✓ Using project: $PROJECT_ID" -ForegroundColor Green

# Check Docker daemon
Write-Host "Checking Docker daemon..." -ForegroundColor Gray
docker info >$null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker daemon is not running" -ForegroundColor Red
    Write-Host "Please start Docker Desktop" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Docker daemon is running" -ForegroundColor Green

# Configure Docker auth
Write-Host "Configuring Docker authentication..." -ForegroundColor Gray
gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet | Out-Null
Write-Host "✓ Docker authentication configured" -ForegroundColor Green
Write-Host ""

# Step 2: Build
Write-Host "[2/6] Building Docker image..." -ForegroundColor Yellow
Write-Host "Image: $IMAGE_NAME" -ForegroundColor Cyan
docker build -t $IMAGE_NAME .
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker image built successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Tag
Write-Host "[3/6] Tagging image for Artifact Registry..." -ForegroundColor Yellow
Write-Host "Tag: $IMAGE_URL" -ForegroundColor Cyan
docker tag $IMAGE_NAME $IMAGE_URL
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Image tagging failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Image tagged successfully" -ForegroundColor Green
Write-Host ""

# Step 4: Push
Write-Host "[4/6] Pushing image to Artifact Registry..." -ForegroundColor Yellow
Write-Host "Destination: $IMAGE_URL" -ForegroundColor Cyan
docker push $IMAGE_URL
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Image push failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Image pushed successfully" -ForegroundColor Green
Write-Host ""

# Step 5: Deploy
Write-Host "[5/6] Updating Cloud Run service..." -ForegroundColor Yellow
Write-Host "Service: $SERVICE_NAME" -ForegroundColor Cyan
Write-Host "Region: $REGION" -ForegroundColor Cyan

$USE_GCLOUD = $false

if ((Test-Path "infrastructure") -and (Test-Path "infrastructure\Pulumi.yaml")) {
    Write-Host "Found Pulumi configuration..." -ForegroundColor Cyan
    $pulumiCmd = Get-Command pulumi -ErrorAction SilentlyContinue

    if ($null -ne $pulumiCmd) {
        Write-Host "Using Pulumi to update infrastructure..." -ForegroundColor Cyan
        Push-Location infrastructure
        pulumi up --yes
        $pulumiResult = $LASTEXITCODE
        Pop-Location

        if ($pulumiResult -ne 0) {
            Write-Host "ERROR: Pulumi update failed" -ForegroundColor Red
            exit 1
        }
        Write-Host "✓ Cloud Run service updated via Pulumi" -ForegroundColor Green
    }
    else {
        Write-Host "Pulumi not installed" -ForegroundColor Yellow
        Write-Host "Install from: https://www.pulumi.com/docs/get-started/install/" -ForegroundColor Gray
        $response = Read-Host "Use gcloud instead? (y/n)"
        if ($response -match '^[Yy]$') {
            $USE_GCLOUD = $true
        }
        else {
            Write-Host "Deployment cancelled" -ForegroundColor Red
            exit 1
        }
    }
}
else {
    $USE_GCLOUD = $true
}

if ($USE_GCLOUD) {
    Write-Host "Using gcloud to update Cloud Run..." -ForegroundColor Cyan
    gcloud run deploy $SERVICE_NAME --image $IMAGE_URL --region $REGION --platform managed --allow-unauthenticated --quiet

    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Cloud Run deployment failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Cloud Run service updated via gcloud" -ForegroundColor Green
}
Write-Host ""

# Step 6: Get URL
Write-Host "[6/6] Getting service URL..." -ForegroundColor Yellow
$SERVICE_URL = gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format="value(status.url)"

if (-not [string]::IsNullOrWhiteSpace($SERVICE_URL)) {
    Write-Host "✓ Service deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Deployment Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Service URL: " -NoNewline -ForegroundColor Cyan
    Write-Host $SERVICE_URL -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Test the deployment: $SERVICE_URL"
    Write-Host "2. Check logs: gcloud run logs read $SERVICE_NAME --region=$REGION"
    Write-Host "3. Monitor costs: https://console.cloud.google.com/billing"
    Write-Host ""
}
else {
    Write-Host "ERROR: Could not retrieve service URL"
    exit 1
}
