# ServerGem - Enterprise Setup Guide

## 🚀 Complete End-to-End Setup

This guide provides step-by-step instructions for setting up ServerGem at enterprise-grade quality.

---

## Prerequisites

### 1. Google Cloud Platform Setup

1. **Create/Select GCP Project:**
   ```bash
   gcloud projects create servergem-prod --name="ServerGem Production"
   gcloud config set project servergem-prod
   ```

2. **Enable Billing:**
   - Go to [GCP Console Billing](https://console.cloud.google.com/billing)
   - Link billing account to your project

3. **Enable Required APIs:**
   ```bash
   gcloud services enable \
     cloudrun.googleapis.com \
     cloudbuild.googleapis.com \
     artifactregistry.googleapis.com \
     secretmanager.googleapis.com \
     compute.googleapis.com
   ```

4. **Verify APIs are Enabled:**
   ```bash
   gcloud services list --enabled
   ```

5. **Authenticate gcloud:**
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

### 2. GitHub Setup

1. **Create Personal Access Token:**
   - Go to GitHub Settings → Developer Settings → Personal Access Tokens
   - Generate new token (classic) with scopes:
     - `repo` (Full control of private repositories)
     - `read:user` (Read user profile data)
   - Save token securely

### 3. Gemini API Key

1. **Get Gemini API Key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create new API key
   - Save key securely

---

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=servergem-prod
GOOGLE_CLOUD_REGION=us-central1

# Gemini API Key
GEMINI_API_KEY=your-actual-gemini-api-key

# CORS Configuration (add your frontend URLs)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# GitHub Token (for repo access)
GITHUB_TOKEN=ghp_your_actual_github_token
```

### 3. Test Backend Services

```bash
# Test GCloud authentication
python -c "from services.gcloud_service import GCloudService; svc = GCloudService(); print(svc.validate_gcloud_auth())"

# Test GitHub connection
python -c "from services.github_service import GitHubService; svc = GitHubService('your_token'); print(svc.test_connection())"
```

### 4. Start Backend Server

```bash
python app.py
```

Expected output:
```
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## Frontend Setup

### 1. Install Dependencies

```bash
npm install
# or
bun install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# Backend Connection
VITE_WS_URL=ws://localhost:8000/ws/chat
VITE_API_URL=http://localhost:8000
```

### 3. Start Frontend

```bash
npm run dev
# or
bun dev
```

Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## Architecture Verification

### 1. WebSocket Connection Test

1. Open browser at `http://localhost:5173`
2. Navigate to `/deploy`
3. Check connection status indicator (should show "Backend Online" in green)
4. Open browser console and verify:
   ```
   [WebSocket] Initializing WebSocket client
   [WebSocket] Connected
   [WebSocket] Received message: connected
   ```

### 2. GitHub Integration Test

1. On `/deploy` page, enter GitHub token
2. Click "Connect GitHub"
3. Verify repositories are loaded
4. Should see list of your repositories

### 3. AI Agent Test

1. Select a repository
2. Click "Deploy"
3. Verify in backend logs:
   ```
   [Orchestrator] Processing message
   [Gemini ADK] Analyzing request
   [GitHub Service] Cloning repository
   [Code Analyzer] Analyzing codebase
   [Docker Expert] Generating Dockerfile
   ```

### 4. Deployment Test (Optional)

**Prerequisites:** Ensure billing is enabled and you have Cloud Run quota

1. Complete repository analysis
2. Wait for Gemini to call deploy function
3. Monitor backend logs for:
   ```
   [GCloud Service] Building image
   [GCloud Service] Deploying to Cloud Run
   [GCloud Service] Deployment complete
   ```

---

## Monitoring & Observability

### 1. Backend Health Check

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "ServerGem Backend",
  "timestamp": "2025-..."
}
```

### 2. Active Connections

```bash
curl http://localhost:8000/stats
```

### 3. GCP Monitoring

View Cloud Run services:
```bash
gcloud run services list
```

View Cloud Build history:
```bash
gcloud builds list --limit=10
```

View logs:
```bash
gcloud logging read "resource.type=cloud_run_revision" --limit=50
```

---

## Security Configuration

### 1. Secret Manager (Production)

Store sensitive data in Google Secret Manager:

```bash
# Store GitHub token
echo -n "your_github_token" | gcloud secrets create github-token --data-file=-

# Store Gemini API key
echo -n "your_gemini_key" | gcloud secrets create gemini-api-key --data-file=-

# Grant access to Cloud Run
gcloud secrets add-iam-policy-binding github-token \
  --member=serviceAccount:YOUR_SERVICE_ACCOUNT \
  --role=roles/secretmanager.secretAccessor
```

### 2. IAM Permissions

```bash
# Create service account
gcloud iam service-accounts create servergem-sa \
  --display-name="ServerGem Service Account"

# Grant necessary roles
gcloud projects add-iam-policy-binding servergem-prod \
  --member="serviceAccount:servergem-sa@servergem-prod.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding servergem-prod \
  --member="serviceAccount:servergem-sa@servergem-prod.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.editor"
```

---

## Production Deployment

### Backend to Cloud Run

```bash
cd backend

# Build and deploy
gcloud run deploy servergem-backend \
  --source . \
  --region=us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=servergem-prod,GOOGLE_CLOUD_REGION=us-central1" \
  --set-secrets="GEMINI_API_KEY=gemini-api-key:latest,GITHUB_TOKEN=github-token:latest" \
  --memory=2Gi \
  --cpu=2 \
  --max-instances=10
```

### Frontend to Cloud Run

```bash
cd frontend

# Create Dockerfile for frontend
cat > Dockerfile <<EOF
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
EOF

# Create nginx.conf
cat > nginx.conf <<EOF
events {}
http {
  include /etc/nginx/mime.types;
  server {
    listen 8080;
    location / {
      root /usr/share/nginx/html;
      try_files \$uri \$uri/ /index.html;
    }
  }
}
EOF

# Deploy
gcloud run deploy servergem-frontend \
  --source . \
  --region=us-central1 \
  --allow-unauthenticated
```

---

## Troubleshooting

### Backend Issues

**Issue:** `gcloud` authentication fails
```bash
# Solution: Re-authenticate
gcloud auth login
gcloud auth application-default login
```

**Issue:** Missing API permissions
```bash
# Solution: Check enabled APIs
gcloud services list --enabled
```

**Issue:** WebSocket connection fails
```bash
# Solution: Check CORS settings in backend/.env
ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend Issues

**Issue:** WebSocket shows "Backend Offline"
- Verify backend is running on port 8000
- Check `VITE_WS_URL` in `.env`
- Check browser console for connection errors

**Issue:** GitHub integration fails
- Verify token has correct scopes
- Check token is not expired
- Verify backend has `GITHUB_TOKEN` set

### Deployment Issues

**Issue:** Cloud Run deployment fails
```bash
# Check build logs
gcloud builds list --limit=1
gcloud builds log [BUILD_ID]
```

**Issue:** Insufficient permissions
```bash
# Verify service account has required roles
gcloud projects get-iam-policy servergem-prod
```

---

## Performance Optimization

### 1. Cloud Run Configuration

```yaml
# Optimal settings for production
cpu: 2
memory: 2Gi
max-instances: 10
min-instances: 1  # Keep warm
concurrency: 80
timeout: 300s
```

### 2. Caching Strategies

- Enable Docker layer caching in Cloud Build
- Use Artifact Registry for image caching
- Implement repository caching for faster clones

### 3. Cost Optimization

```bash
# Monitor costs
gcloud billing accounts list
gcloud billing projects list

# Set budget alerts
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="ServerGem Budget" \
  --budget-amount=100USD
```

---

## Next Steps

1. **CI/CD Pipeline:** Set up GitHub Actions for automated deployments
2. **Custom Domain:** Configure Cloud Run with custom domain
3. **Monitoring:** Set up Cloud Monitoring dashboards
4. **Alerting:** Configure error alerting via Cloud Logging
5. **Load Testing:** Test with high concurrent users

---

## Support

- **Documentation:** See README.md and PHASE4_CLOUDRUN.md
- **GitHub Issues:** Report bugs and feature requests
- **GCP Support:** [Cloud Console Support](https://console.cloud.google.com/support)

---

**Version:** 1.0.0  
**Last Updated:** 2025-11-07
