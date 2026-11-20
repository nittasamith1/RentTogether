#!/usr/bin/env bash
# ==============================================================================
# RentTogether Backend — Google Cloud Run Deployment Script
# Region: asia-south1 (Mumbai) | 1 vCPU | 1 GiB RAM
# ==============================================================================
set -e

# Configuration
REGION="asia-south1"
SERVICE_NAME="renttogether-backend"
REPO_NAME="renttogether-repo"

echo "=========================================================="
echo " RentTogether — Google Cloud Run Automated Deployment"
echo " Target Region: $REGION (Mumbai, India)"
echo " Resource Sizing: 1 vCPU, 1 GiB RAM, 20 Concurrency"
echo "=========================================================="

# 1. Verify gcloud authentication
if ! command -v gcloud &> /dev/null; then
    echo "ERROR: 'gcloud' CLI is not installed or not in PATH."
    echo "Please install Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

PROJECT_ID=$(gcloud config get-value project 2> /dev/null)
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" == "(unset)" ]; then
    echo "ERROR: No active GCP project found."
    echo "Run: gcloud config set project <YOUR-PROJECT-ID>"
    exit 1
fi

echo "===> Active GCP Project: $PROJECT_ID"

# 2. Enable Required Google Cloud Services
echo "===> Enabling required APIs (Cloud Run, Artifact Registry, Cloud Build)..."
gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com

# 3. Create Artifact Registry Repository (if not already exists)
echo "===> Ensuring Artifact Registry repository exists..."
if ! gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" &> /dev/null; then
    echo "Creating Docker repository '$REPO_NAME' in $REGION..."
    gcloud artifacts repositories create "$REPO_NAME" \
        --repository-format=docker \
        --location="$REGION" \
        --description="RentTogether Docker Repository"
fi

IMAGE_TAG="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/backend:latest"

# 4. Build and Push Container using Google Cloud Build
echo "===> Building container image with Google Cloud Build..."
gcloud builds submit --tag "$IMAGE_TAG" -f Dockerfile .

# 5. Deploy to Google Cloud Run
echo "===> Deploying to Google Cloud Run ($REGION)..."
gcloud run deploy "$SERVICE_NAME" \
    --image "$IMAGE_TAG" \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --cpu 1 \
    --memory 1Gi \
    --min-instances 0 \
    --max-instances 3 \
    --concurrency 20 \
    --timeout 120 \
    --set-env-vars "DEBUG=False,DJANGO_SETTINGS_MODULE=config.settings"

# 6. Retrieve Deployed Service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format 'value(status.url)')

echo "=========================================================="
echo " SUCCESS! RentTogether Backend is live on Google Cloud Run!"
echo " Service URL: $SERVICE_URL"
echo " Health Probe: $SERVICE_URL/health/"
echo " API Docs:    $SERVICE_URL/api/v1/health/"
echo "=========================================================="
