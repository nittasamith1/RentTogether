# ==============================================================================
# RentTogether Backend — Google Cloud Run Deployment Script (PowerShell)
# Region: asia-south1 (Mumbai) | 1 vCPU | 1 GiB RAM
# ==============================================================================
$ErrorActionPreference = "Stop"

$Region = "asia-south1"
$ServiceName = "renttogether-backend"
$RepoName = "renttogether-repo"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " RentTogether — Google Cloud Run Automated Deployment" -ForegroundColor Cyan
Write-Host " Target Region: $Region (Mumbai, India)" -ForegroundColor Cyan
Write-Host " Resource Sizing: 1 vCPU, 1 GiB RAM, 20 Concurrency" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check if gcloud CLI is installed
if (-not (Get-Command "gcloud" -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: 'gcloud' CLI is not found in PATH." -ForegroundColor Red
    Write-Host "Install Google Cloud SDK from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# 2. Get active GCP project
$ProjectId = (gcloud config get-value project 2>$null).Trim()
if ([string]::IsNullOrWhiteSpace($ProjectId) -or $ProjectId -eq "(unset)") {
    Write-Host "ERROR: No active Google Cloud Project selected." -ForegroundColor Red
    Write-Host "Run: gcloud config set project <YOUR-PROJECT-ID>" -ForegroundColor Yellow
    exit 1
}

Write-Host "===> Active Project: $ProjectId" -ForegroundColor Green

# 3. Enable Required Google Cloud APIs
Write-Host "===> Enabling Cloud Run, Artifact Registry, and Cloud Build APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

# 4. Create Artifact Registry Docker repository if needed
Write-Host "===> Verifying Artifact Registry repository..." -ForegroundColor Yellow
$repoCheck = gcloud artifacts repositories describe $RepoName --location=$Region 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating Docker repository '$RepoName' in $Region..." -ForegroundColor Yellow
    gcloud artifacts repositories create $RepoName --repository-format=docker --location=$Region --description="RentTogether Backend Docker Repository"
}

$ImageTag = "$Region-docker.pkg.dev/$ProjectId/$RepoName/backend:latest"

# 5. Build and submit image via Google Cloud Build (does not require local Docker daemon)
Write-Host "===> Building and pushing container with Google Cloud Build..." -ForegroundColor Yellow
gcloud builds submit --tag $ImageTag -f Dockerfile .

# 6. Deploy to Google Cloud Run
Write-Host "===> Deploying container to Cloud Run ($Region)..." -ForegroundColor Yellow
gcloud run deploy $ServiceName `
    --image $ImageTag `
    --region $Region `
    --platform managed `
    --allow-unauthenticated `
    --cpu 1 `
    --memory 1Gi `
    --min-instances 0 `
    --max-instances 3 `
    --concurrency 20 `
    --timeout 120 `
    --set-env-vars "DEBUG=False,DJANGO_SETTINGS_MODULE=config.settings"

# 7. Print Deployed URL
$ServiceUrl = (gcloud run services describe $ServiceName --region $Region --format 'value(status.url)').Trim()

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " SUCCESS! RentTogether Backend is live on Google Cloud Run!" -ForegroundColor Green
Write-Host " Service URL: $ServiceUrl" -ForegroundColor Cyan
Write-Host " Health Probe: $ServiceUrl/health/" -ForegroundColor Cyan
Write-Host " API Docs:    $ServiceUrl/api/v1/health/" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
