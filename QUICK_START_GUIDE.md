# 🚀 Quick Start Guide - Phase 4 Production System

## Get Up and Running in 10 Minutes

### Prerequisites ✅

Before you begin, ensure you have:

1. **Google Cloud Project**
   - Project ID ready
   - Billing enabled
   - gcloud CLI installed and authenticated

2. **API Keys**
   - Gemini API Key (get from [Google AI Studio](https://makersuite.google.com/app/apikey))
   - GitHub Personal Access Token (get from [GitHub Settings](https://github.com/settings/tokens))

3. **Local Tools**
   - Python 3.9+ installed
   - Node.js 18+ installed
   - Docker installed (optional, for local testing)

---

## Step 1: Configure Backend (3 minutes)

### 1.1 Set Up Environment Variables

```bash
cd backend

# Copy the example environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

Add your credentials to `.env`:

```bash
# Required
GEMINI_API_KEY=AIzaSy...your_key_here
GITHUB_TOKEN=ghp_...your_token_here
GOOGLE_CLOUD_PROJECT=your-project-id

# Optional
GOOGLE_CLOUD_REGION=us-central1
PORT=8000
```

### 1.2 Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt
```

Expected output:
```
✓ fastapi installed
✓ uvicorn installed
✓ websockets installed
✓ google-generativeai installed
... (more packages)
Successfully installed all dependencies!
```

---

## Step 2: Enable Google Cloud APIs (2 minutes)

```bash
# Authenticate with gcloud
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs (one command)
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    secretmanager.googleapis.com \
    logging.googleapis.com
```

Expected output:
```
✓ Cloud Build API enabled
✓ Cloud Run API enabled
✓ Artifact Registry API enabled
✓ Secret Manager API enabled
✓ Cloud Logging API enabled
```

### 2.1 Create Artifact Registry

```bash
gcloud artifacts repositories create servergem \
    --repository-format=docker \
    --location=us-central1 \
    --description="ServerGem deployment images"
```

Expected output:
```
✓ Repository servergem created
```

---

## Step 3: Start Backend Server (1 minute)

```bash
# From backend directory
cd backend
python app.py
```

Expected output:
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)

✓ ServerGem Backend is running!
✓ WebSocket endpoint: ws://localhost:8000/ws/chat
```

**Keep this terminal open!** The backend needs to stay running.

---

## Step 4: Start Frontend (1 minute)

Open a **new terminal** window:

```bash
# From project root
npm install
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in 423 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.x:5173/

✓ Frontend is running!
```

---

## Step 5: Test the System (3 minutes)

### 5.1 Open the Application

Navigate to: **http://localhost:5173**

You should see the ServerGem homepage.

### 5.2 Go to Deploy Page

Click **"Start Deploying"** or navigate to: **http://localhost:5173/deploy**

### 5.3 Check Backend Connection

Look at the top-right corner:
- 🟢 **Backend Online** = Good! ✅
- 🔴 **Backend Offline** = Check if backend is running ❌

### 5.4 Connect GitHub

1. Click **"Connect GitHub"**
2. Enter your Personal Access Token
3. Click **"Connect"**
4. You should see: **"Connected to GitHub ✓"**

### 5.5 Select a Repository

1. Browse your repositories
2. Click on one to test with
3. Select branch (usually `main`)
4. Click **"Select & Analyze"**

### 5.6 Watch the Magic! ✨

The system will now:

**Stage 1: Analysis (15-30s)**
```
🔍 Analyzing repository...
✓ Cloned repository
✓ Detected: FastAPI (Python 3.11)
✓ Generated Dockerfile
✓ Created .dockerignore
```

**Stage 2: Deployment (2-5 minutes)**
```
🚀 Deploying to Cloud Run...
📦 Build (0-60%): Submitting to Cloud Build...
🔨 Deploy (60-90%): Creating Cloud Run service...
✅ Complete (100%): Deployment successful!
```

**Expected Final Result:**
```
🎉 Deployment Successful!

Your service is now live at:
https://your-app-xyz123-uc.a.run.app

⚡ Performance:
• Build: 45.2s
• Deploy: 32.1s
• Total: 77.3s

🔧 Configuration:
• CPU: 1 vCPU
• Memory: 512Mi
• Concurrency: 100 requests

💰 Estimated Cost: $15.50/month
```

---

## 🎯 Verification Checklist

After completing the steps above, verify:

- [ ] Backend running (http://localhost:8000)
- [ ] Frontend running (http://localhost:5173)
- [ ] Backend status shows "Online" (green dot)
- [ ] GitHub connected successfully
- [ ] Repository analysis completed
- [ ] Deployment succeeded
- [ ] Service URL accessible

---

## 🧪 Test the Production Features

### Test 1: Security Validation

Try deploying with an invalid service name:

```
Service Name: "My_Service!"
Expected: ❌ Error - Invalid service name
```

Then fix it:
```
Service Name: "my-service"
Expected: ✅ Validation passed
```

### Test 2: Cost Optimization

Deploy a FastAPI app:
```
Expected Config:
• CPU: 1 vCPU
• Memory: 512Mi
• Concurrency: 100
• Est. Cost: ~$12-15/month
```

Deploy a Django app:
```
Expected Config:
• CPU: 2 vCPU
• Memory: 1Gi
• Concurrency: 40
• Est. Cost: ~$25-30/month
```

### Test 3: Monitoring

Check backend console for structured logs:
```
[deploy-a1b2c3d4] Started deployment for: my-app
[deploy-a1b2c3d4] Stage build: success (45.2s)
[deploy-a1b2c3d4] Stage deploy: success (32.1s)
[deploy-a1b2c3d4] Deployment completed: success (77.3s)
```

### Test 4: Real-Time Progress

Watch the frontend during deployment:
- Build progress bar updates smoothly
- Logs stream in real-time
- Progress percentage increases continuously
- Final metrics displayed accurately

---

## 🐛 Troubleshooting

### Backend Won't Start

**Issue**: `ModuleNotFoundError: No module named 'fastapi'`

**Solution**:
```bash
cd backend
pip install -r requirements.txt
```

---

### Backend Shows "Offline"

**Issue**: Frontend can't connect to backend

**Solutions**:
1. Check if backend is running:
   ```bash
   curl http://localhost:8000/health
   # Expected: {"status": "healthy"}
   ```

2. Check firewall/antivirus isn't blocking port 8000

3. Restart backend:
   ```bash
   cd backend
   python app.py
   ```

---

### "Cloud Build API not enabled"

**Issue**: APIs not enabled in Google Cloud

**Solution**:
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
```

---

### "Not authenticated with gcloud"

**Issue**: gcloud CLI not authenticated

**Solution**:
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

---

### GitHub Connection Fails

**Issue**: Invalid token or insufficient permissions

**Solution**:
1. Generate new token at: https://github.com/settings/tokens
2. Select scopes: `repo`, `read:user`, `user:email`
3. Use **Token (classic)**, not fine-grained
4. Copy token immediately
5. Try connecting again

---

### Build Fails: "No such file: Dockerfile"

**Issue**: Dockerfile generation failed

**Solution**:
1. Check analysis logs for errors
2. Ensure repository has detectable framework
3. Check project structure is standard
4. Try a different repository

---

### Deployment Times Out

**Issue**: Build or deploy taking too long

**Solution**:
1. Check [Cloud Build quotas](https://console.cloud.google.com/apis/api/cloudbuild.googleapis.com/quotas)
2. Verify billing is enabled
3. Check for large dependency installations
4. Try again (might be temporary GCP issue)

---

## 📊 Expected Performance

### Typical Deployment Times

| Project Type | Analysis | Build | Deploy | Total |
|--------------|----------|-------|--------|-------|
| FastAPI (small) | 15s | 60s | 30s | ~105s |
| Express (medium) | 20s | 90s | 35s | ~145s |
| Django (large) | 25s | 120s | 40s | ~185s |
| Next.js (large) | 30s | 180s | 45s | ~255s |

### First vs. Subsequent Deployments

- **First deployment**: Slower (pulling base images, installing deps)
- **Subsequent deployments**: ~30-50% faster (cached layers)

---

## 🎓 Next Steps

Once you've successfully deployed:

### 1. Test Your Deployed Service

```bash
# Get your service URL from deployment output
DEPLOY_URL="https://your-service-xyz.a.run.app"

# Test health endpoint
curl $DEPLOY_URL/health

# Test your API
curl $DEPLOY_URL/api/your-endpoint
```

### 2. View Logs

```bash
# View recent logs
gcloud run services logs read YOUR_SERVICE_NAME \
    --project=YOUR_PROJECT_ID \
    --region=us-central1 \
    --limit=50

# Follow logs in real-time
gcloud run services logs tail YOUR_SERVICE_NAME \
    --project=YOUR_PROJECT_ID \
    --region=us-central1
```

### 3. Monitor in Cloud Console

Visit: https://console.cloud.google.com/run

- View all deployed services
- Check metrics (requests, latency, errors)
- Configure custom domains
- Update service configuration

### 4. Explore Production Features

Try deploying different frameworks to see:
- Different resource configurations
- Cost estimates
- Security warnings
- Optimization suggestions

---

## 🎉 You're All Set!

You now have a **FAANG-level production deployment system** running locally!

### What You Can Do

✅ Deploy any web application to Cloud Run  
✅ Get real-time progress updates  
✅ See cost estimates before deploying  
✅ Monitor security issues automatically  
✅ Track performance metrics  
✅ Scale automatically  

### Key Features at Your Fingertips

- 🔒 **Security**: Input validation, Dockerfile scanning
- 📊 **Monitoring**: Structured logs, metrics collection
- 💰 **Cost Control**: Estimates, optimization, right-sizing
- ⚡ **Performance**: Fast builds, optimal configs
- 🚀 **Reliability**: Retry logic, error recovery

---

**Bismillah! Happy Deploying! 🚀**

For detailed documentation, see:
- `PHASE4_FAANG_FEATURES.md` - Feature documentation
- `PHASE4_COMPLETE.md` - Implementation details
- `DEPLOYMENT_PLAYBOOK.md` - Comprehensive guide
