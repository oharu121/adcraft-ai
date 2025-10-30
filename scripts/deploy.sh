#!/bin/bash
# AdCraft AI - Automated Deployment Script
# Builds Docker image, pushes to Artifact Registry, and updates Cloud Run

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="adcraft-dev-2025"
REGION="asia-northeast1"
REPOSITORY="adcraft-ai"
IMAGE_NAME="adcraft-ai"
SERVICE_NAME="adcraft-service"
IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:latest"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}AdCraft AI Deployment Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Pre-deployment checks
echo -e "${YELLOW}[1/6] Running pre-deployment checks...${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}ERROR: gcloud CLI is not installed${NC}"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERROR: Docker is not installed${NC}"
    echo "Install it from: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if logged into gcloud
CURRENT_ACCOUNT=$(gcloud config get-value account 2>/dev/null)
if [ -z "$CURRENT_ACCOUNT" ]; then
    echo -e "${RED}ERROR: Not logged into gcloud${NC}"
    echo "Run: gcloud auth login"
    exit 1
fi
echo -e "${GREEN}✓ Logged in as: ${CURRENT_ACCOUNT}${NC}"

# Check if correct project is set
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
    echo -e "${YELLOW}⚠ Current project: ${CURRENT_PROJECT}${NC}"
    echo -e "${YELLOW}⚠ Expected project: ${PROJECT_ID}${NC}"
    read -p "Switch to ${PROJECT_ID}? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        gcloud config set project "$PROJECT_ID"
        echo -e "${GREEN}✓ Switched to project: ${PROJECT_ID}${NC}"
    else
        echo -e "${RED}Deployment cancelled${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓ Using project: ${PROJECT_ID}${NC}"

# Check Docker daemon
if ! docker info &> /dev/null; then
    echo -e "${RED}ERROR: Docker daemon is not running${NC}"
    echo "Start Docker Desktop or Docker daemon"
    exit 1
fi
echo -e "${GREEN}✓ Docker daemon is running${NC}"

# Configure Docker for Artifact Registry
echo -e "${YELLOW}Configuring Docker authentication...${NC}"
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet
echo -e "${GREEN}✓ Docker authentication configured${NC}"

echo ""

# Step 2: Build Docker image
echo -e "${YELLOW}[2/6] Building Docker image...${NC}"
echo -e "${BLUE}Image: ${IMAGE_NAME}${NC}"
docker build -t ${IMAGE_NAME} .
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker image built successfully${NC}"
else
    echo -e "${RED}ERROR: Docker build failed${NC}"
    exit 1
fi
echo ""

# Step 3: Tag image for Artifact Registry
echo -e "${YELLOW}[3/6] Tagging image for Artifact Registry...${NC}"
echo -e "${BLUE}Tag: ${IMAGE_URL}${NC}"
docker tag ${IMAGE_NAME} ${IMAGE_URL}
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Image tagged successfully${NC}"
else
    echo -e "${RED}ERROR: Image tagging failed${NC}"
    exit 1
fi
echo ""

# Step 4: Push image to Artifact Registry
echo -e "${YELLOW}[4/6] Pushing image to Artifact Registry...${NC}"
echo -e "${BLUE}Destination: ${IMAGE_URL}${NC}"
docker push ${IMAGE_URL}
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Image pushed successfully${NC}"
else
    echo -e "${RED}ERROR: Image push failed${NC}"
    exit 1
fi
echo ""

# Step 5: Update Cloud Run service
echo -e "${YELLOW}[5/6] Updating Cloud Run service...${NC}"
echo -e "${BLUE}Service: ${SERVICE_NAME}${NC}"
echo -e "${BLUE}Region: ${REGION}${NC}"

# Check if we should use Pulumi or gcloud
if [ -d "infrastructure" ] && [ -f "infrastructure/Pulumi.yaml" ]; then
    echo -e "${BLUE}Using Pulumi to update infrastructure...${NC}"
    cd infrastructure

    # Check if pulumi is installed
    if ! command -v pulumi &> /dev/null; then
        echo -e "${RED}ERROR: Pulumi is not installed${NC}"
        echo "Install it from: https://www.pulumi.com/docs/get-started/install/"
        echo ""
        echo -e "${YELLOW}Alternative: Deploy with gcloud directly${NC}"
        read -p "Use gcloud instead? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cd ..
            USE_GCLOUD=true
        else
            exit 1
        fi
    else
        pulumi up --yes
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Cloud Run service updated via Pulumi${NC}"
            cd ..
        else
            echo -e "${RED}ERROR: Pulumi update failed${NC}"
            cd ..
            exit 1
        fi
    fi
fi

# Use gcloud if Pulumi not available or user chose gcloud
if [ "$USE_GCLOUD" = true ]; then
    echo -e "${BLUE}Using gcloud to update Cloud Run...${NC}"
    gcloud run deploy ${SERVICE_NAME} \
        --image ${IMAGE_URL} \
        --region ${REGION} \
        --platform managed \
        --allow-unauthenticated \
        --quiet

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Cloud Run service updated via gcloud${NC}"
    else
        echo -e "${RED}ERROR: Cloud Run deployment failed${NC}"
        exit 1
    fi
fi
echo ""

# Step 6: Get service URL
echo -e "${YELLOW}[6/6] Getting service URL...${NC}"
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
    --region=${REGION} \
    --project=${PROJECT_ID} \
    --format="value(status.url)")

if [ -n "$SERVICE_URL" ]; then
    echo -e "${GREEN}✓ Service deployed successfully!${NC}"
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}Deployment Complete!${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "${BLUE}Service URL: ${GREEN}${SERVICE_URL}${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Test the deployment: ${SERVICE_URL}"
    echo "2. Check logs: gcloud run logs read ${SERVICE_NAME} --region=${REGION}"
    echo "3. Monitor costs: https://console.cloud.google.com/billing"
    echo ""
else
    echo -e "${RED}ERROR: Could not retrieve service URL${NC}"
    exit 1
fi
