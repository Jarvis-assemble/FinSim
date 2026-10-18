# FinSim Cloud Run Deployment Script
# Run this from the finsim/ directory
# Requires: gcloud CLI logged in, Docker (or Cloud Build)

param(
    [string]$PROJECT_ID = "finsim-512012",
    [string]$GEMINI_API_KEY = $env:GEMINI_API_KEY,
    [string]$REGION = "us-central1",
    [string]$SERVICE_NAME = "finsim"
)

# Load GEMINI_API_KEY from local .env if not already set
if (-not $GEMINI_API_KEY -and (Test-Path ".env")) {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^GEMINI_API_KEY=(.*)") {
            $GEMINI_API_KEY = $matches[1].Trim('"').Trim("'")
        }
    }
}

# Ensure gcloud is in PATH
$gcloudBin = "C:\Users\DELL\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin"
if ((Get-Command gcloud -ErrorAction SilentlyContinue) -eq $null) {
    if (Test-Path $gcloudBin) {
        $env:PATH = "$gcloudBin;$env:PATH"
    }
}

Write-Host "🚀 Deploying FinSim to Cloud Run..." -ForegroundColor Cyan
Write-Host "Project: $PROJECT_ID | Region: $REGION | Service: $SERVICE_NAME"

# Set project
gcloud config set project $PROJECT_ID

# Enable required APIs
Write-Host "Enabling APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# Build and deploy using Cloud Build (no local Docker needed!)
Write-Host "Building and deploying with Cloud Build..." -ForegroundColor Yellow

$deployArgs = @(
    "run", "deploy", $SERVICE_NAME,
    "--source", ".",
    "--platform", "managed",
    "--region", $REGION,
    "--allow-unauthenticated",
    "--port", "8080",
    "--memory", "512Mi",
    "--cpu", "1",
    "--max-instances", "10",
    "--quiet"
)

if ($GEMINI_API_KEY) {
    $deployArgs += "--set-env-vars"
    $deployArgs += "GEMINI_API_KEY=$GEMINI_API_KEY"
}

gcloud @deployArgs

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "Your app URL will be shown above. Look for 'Service URL:'" -ForegroundColor Cyan
