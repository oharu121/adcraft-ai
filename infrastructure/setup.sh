#!/bin/bash

# AdCraft AI Infrastructure Setup Script
# This script initializes the Pulumi stack and sets required configuration

set -e

echo "🚀 Setting up AdCraft AI Infrastructure..."

# Check if Pulumi is installed
if ! command -v pulumi &> /dev/null; then
    echo "❌ Pulumi CLI is not installed. Please install it first."
    exit 1
fi

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud SDK is not installed. Please install it first."
    exit 1
fi

# Initialize Pulumi stack if it doesn't exist
if ! pulumi stack ls | grep -q "dev"; then
    echo "📦 Initializing Pulumi dev stack..."
    pulumi stack init dev
else
    echo "✅ Pulumi dev stack already exists"
    pulumi stack select dev
fi

# Set GCP project configuration
echo "🔧 Please enter your GCP project ID:"
read -p "Project ID: " GCP_PROJECT_ID

if [ -z "$GCP_PROJECT_ID" ]; then
    echo "❌ Project ID is required"
    exit 1
fi

echo "🔧 Setting Pulumi configuration..."
pulumi config set gcp:project $GCP_PROJECT_ID
pulumi config set gcp:region asia-northeast1

# Check if user is authenticated with gcloud
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q '@'; then
    echo "🔐 Please authenticate with Google Cloud:"
    gcloud auth login
    gcloud auth application-default login
fi

# Set the project for gcloud
gcloud config set project $GCP_PROJECT_ID

echo "✅ Infrastructure setup complete!"
echo ""
echo "Next steps:"
echo "1. Run 'pulumi preview' to see what will be created"
echo "2. Run 'pulumi up' to deploy the infrastructure"
echo "3. The deployment will create:"
echo "   - Service Account with required permissions"
echo "   - Cloud Storage bucket with lifecycle policy"
echo "   - Firestore database with indexes"
echo "   - Cloud Run service (ready for container deployment)"
echo "   - Monitoring dashboard and budget alerts"