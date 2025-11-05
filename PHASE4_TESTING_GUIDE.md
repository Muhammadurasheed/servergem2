# 🧪 Phase 4 Testing Guide

## Complete End-to-End Testing

This guide will help you test the entire ServerGem deployment pipeline from GitHub connection to live Cloud Run service.

## Prerequisites Checklist

Before testing, ensure you have:

- ✅ Google Cloud Project with billing enabled
- ✅ Gemini API Key from https://aistudio.google.com/app/apikey
- ✅ GitHub Personal Access Token with `repo` scope
- ✅ gcloud CLI installed and authenticated
- ✅ Python 3.9+ and Node.js 18+ installed
- ✅ Backend and frontend running locally

## Test Scenarios

### Test 1: Backend Health Check

**Objective**: Verify backend is running and accessible

```bash
# Test HTTP health endpoint
curl http://localhost:8000/health

# Expected response:
{
  "status": "healthy",
  "service": "ServerGem Backend",
  "timestamp": "2025-11-05T..."
}

# Test WebSocket connection
wscat -c ws://localhost:8000/ws/chat

# Send init message:
{"type": "init", "session_id": "test_session"}

# Expected response:
{
  "type": "connected",
  "session_id": "test_session",
  "message": "Connected to ServerGem AI - Ready to deploy!"
}
```

**Pass Criteria**:
- ✅ HTTP endpoint returns 200 OK
- ✅ WebSocket connection established
- ✅ Connected message received

### Test 2: GitHub Integration

**Objective**: Connect GitHub and list repositories

**Steps**:
1. Navigate to http://localhost:5173/deploy
2. Click "Connect GitHub"
3. Enter your GitHub Personal Access Token
4. Click "Connect"
5. Verify repositories load

**Pass Criteria**:
- ✅ Connection status shows "Connected"
- ✅ Repository list loads within 5 seconds
- ✅ Repositories display correct metadata (language, stars, etc.)
- ✅ Search functionality works
- ✅ Refresh button updates list

**Common Issues**:
```bash
# If connection fails, test token manually:
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user/repos

# Verify token has correct scopes:
curl -H "Authorization: token YOUR_TOKEN" -I https://api.github.com/user | grep X-OAuth-Scopes
```

### Test 3: WebSocket Communication

**Objective**: Verify frontend ↔ backend communication

**Steps**:
1. Open browser DevTools → Network → WS tab
2. Select any repository
3. Observe WebSocket messages

**Expected Message Flow**:

```javascript
// 1. Client → Server: Init
{"type": "init", "session_id": "session_123"}

// 2. Server → Client: Connected
{"type": "connected", "session_id": "session_123", "message": "..."}

// 3. Client → Server: Deploy request
{
  "type": "message",
  "message": "I want to analyze and deploy...",
  "context": {
    "action": "deploy",
    "repoUrl": "https://github.com/...",
    "branch": "main"
  }
}

// 4. Server → Client: Typing indicator
{"type": "typing", "timestamp": "..."}

// 5. Server → Client: Analysis result
{"type": "message", "data": {"content": "🔍 **Analysis Complete**..."}}

// 6. Server → Client: Deployment updates (multiple)
{"type": "deployment_update", "data": {"stage": "...", "progress": 45}}

// 7. Server → Client: Deployment complete
{"type": "deployment_complete", "data": {"url": "https://..."}}
```

**Pass Criteria**:
- ✅ All message types sent/received correctly
- ✅ No WebSocket disconnections
- ✅ Progress updates arrive in real-time
- ✅ Final deployment URL displayed

### Test 4: Repository Analysis

**Objective**: Test Gemini ADK code analysis

**Steps**:
1. Select a simple repository (e.g., Node.js Express app)
2. Wait for analysis to complete
3. Review analysis results

**Expected Results**:
- ✅ Framework detected correctly
- ✅ Language identified
- ✅ Entry point found
- ✅ Dependencies listed
- ✅ Environment variables detected
- ✅ Recommendations provided

**Sample Analysis Output**:
```
🔍 **Analysis Complete**

**Framework:** Express.js (JavaScript)
**Entry Point:** `src/index.js`
**Dependencies:** 15 packages
**Database:** MongoDB
**Environment Variables:** 5 detected

**Recommendations:**
• Use Node 18+ for best performance
• Enable health checks
• Configure proper logging

**Warnings:**
• Missing Dockerfile - will generate one
• No .dockerignore found - will create one
```

### Test 5: Dockerfile Generation

**Objective**: Verify AI-generated Dockerfile is valid

**Steps**:
1. Continue from Test 4 (analysis complete)
2. Check backend logs for generated Dockerfile
3. Verify Dockerfile syntax

**Backend Log Check**:
```bash
tail -f backend/logs/app.log | grep Dockerfile
```

**Pass Criteria**:
- ✅ Dockerfile generated successfully
- ✅ Multi-stage build used
- ✅ Correct base image selected
- ✅ Dependencies installed properly
- ✅ Health check configured
- ✅ Non-root user created
- ✅ Port exposed correctly

### Test 6: Cloud Build Integration

**Objective**: Test Docker image build via Cloud Build

**Prerequisites**:
```bash
# Ensure Artifact Registry repo exists
gcloud artifacts repositories describe servergem \
  --location=us-central1

# If not, create it:
gcloud artifacts repositories create servergem \
  --repository-format=docker \
  --location=us-central1
```

**Monitoring**:
```bash
# Watch Cloud Build logs
gcloud builds list --limit=5 --format="table(id, status, startTime)"

# Follow specific build
gcloud builds log <BUILD_ID> --stream
```

**Pass Criteria**:
- ✅ Build submitted successfully
- ✅ Build completes without errors
- ✅ Image pushed to Artifact Registry
- ✅ Progress updates visible in UI
- ✅ Build logs streamed in real-time

**Expected Timeline**: 2-5 minutes

### Test 7: Cloud Run Deployment

**Objective**: Deploy built image to Cloud Run

**Monitoring**:
```bash
# List Cloud Run services
gcloud run services list --platform=managed --region=us-central1

# Check service details
gcloud run services describe <SERVICE_NAME> --region=us-central1
```

**Pass Criteria**:
- ✅ Service deployed successfully
- ✅ HTTPS URL generated
- ✅ Auto-scaling configured
- ✅ Health checks passing
- ✅ Service accessible publicly
- ✅ Deployment URL displayed in UI

**Expected Timeline**: 30-60 seconds

### Test 8: End-to-End Deployment

**Objective**: Complete deployment from start to finish

**Test Repositories** (Use these for testing):

1. **Simple Node.js**:
   ```
   https://github.com/vercel/next.js/tree/canary/examples/hello-world
   ```

2. **Python Flask**:
   ```
   https://github.com/GoogleCloudPlatform/python-docs-samples
   ```

3. **Go HTTP Server**:
   ```
   https://github.com/GoogleCloudPlatform/golang-samples
   ```

**Steps**:
1. Start backend: `cd backend && python app.py`
2. Start frontend: `npm run dev`
3. Navigate to http://localhost:5173/deploy
4. Connect GitHub
5. Select test repository
6. Monitor progress through all stages
7. Visit deployed service URL

**Expected Total Time**: 3-6 minutes

**Pass Criteria**:
- ✅ All stages complete without errors
- ✅ Progress bar reaches 100%
- ✅ Deployment URL is valid and accessible
- ✅ Service responds to HTTP requests
- ✅ HTTPS certificate is valid
- ✅ Auto-scaling is working

### Test 9: Error Handling

**Objective**: Verify graceful error handling

**Test Cases**:

1. **Invalid GitHub Token**:
   ```
   Expected: Clear error message, reconnect option
   ```

2. **Backend Offline**:
   ```
   Expected: "Backend Offline" warning, reconnect attempts
   ```

3. **Build Failure**:
   ```
   Expected: Build logs displayed, actionable error message
   ```

4. **Deployment Failure**:
   ```
   Expected: Clear error, rollback option, retry button
   ```

5. **Network Interruption**:
   ```
   Expected: Auto-reconnect, queue messages, resume operation
   ```

### Test 10: Performance Testing

**Objective**: Measure system performance

**Metrics to Measure**:

```bash
# Backend response time
time curl http://localhost:8000/health

# WebSocket latency
# (Use browser DevTools → Network → WS → Messages → Timestamp)

# Analysis time
# Start: Repository selected
# End: Analysis complete
# Target: <30 seconds

# Build time
# Start: Build submitted
# End: Image pushed
# Target: 2-5 minutes

# Deployment time
# Start: Deploy initiated
# End: Service live
# Target: 30-60 seconds

# Total time (E2E)
# Start: Repository selected
# End: Service accessible
# Target: 3-6 minutes
```

**Pass Criteria**:
- ✅ Backend health check: <100ms
- ✅ WebSocket latency: <100ms
- ✅ Analysis time: <30s
- ✅ Build time: 2-5min
- ✅ Deployment time: 30-60s
- ✅ Total E2E: 3-6min

## Automated Testing Script

Create `test/e2e-test.sh`:

```bash
#!/bin/bash

echo "🧪 ServerGem E2E Testing"
echo "========================"

# Test 1: Backend Health
echo "1️⃣ Testing backend health..."
response=$(curl -s http://localhost:8000/health)
if [[ $response == *"healthy"* ]]; then
  echo "✅ Backend is healthy"
else
  echo "❌ Backend health check failed"
  exit 1
fi

# Test 2: WebSocket Connection
echo "2️⃣ Testing WebSocket..."
# (Use wscat or Node.js script)

# Test 3: Repository Analysis
echo "3️⃣ Testing repository analysis..."
# (Send test message via WebSocket)

# Test 4: Cloud Build
echo "4️⃣ Testing Cloud Build..."
gcloud builds list --limit=1 --filter="status=SUCCESS" > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ Cloud Build is working"
else
  echo "❌ Cloud Build check failed"
fi

# Test 5: Cloud Run
echo "5️⃣ Testing Cloud Run..."
gcloud run services list --region=us-central1 > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ Cloud Run is accessible"
else
  echo "❌ Cloud Run check failed"
fi

echo ""
echo "✅ All tests passed!"
```

## Manual Testing Checklist

Print this checklist and check off each item:

### Setup Phase
- [ ] Backend .env configured
- [ ] Frontend .env configured
- [ ] gcloud authenticated
- [ ] Required APIs enabled
- [ ] Artifact Registry created

### Connection Phase
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] WebSocket connects successfully
- [ ] Backend status shows "Online"

### GitHub Phase
- [ ] GitHub token validated
- [ ] Repositories load
- [ ] Search works
- [ ] Refresh works
- [ ] Repository details display

### Deployment Phase
- [ ] Repository selection works
- [ ] Analysis completes
- [ ] Dockerfile generated
- [ ] Build starts
- [ ] Build completes
- [ ] Image pushed
- [ ] Deployment starts
- [ ] Deployment completes
- [ ] Service URL accessible
- [ ] HTTPS works

### Error Handling Phase
- [ ] Invalid token handled
- [ ] Backend disconnect handled
- [ ] Build failure handled
- [ ] Deployment failure handled
- [ ] Network interruption handled

## Common Issues & Solutions

### Issue: WebSocket won't connect

**Solution**:
```bash
# Check backend logs
tail -f backend/logs/app.log

# Verify port is open
lsof -i :8000

# Check firewall
sudo ufw status
```

### Issue: Analysis takes too long

**Solution**:
```bash
# Check Gemini API quota
# Visit: https://aistudio.google.com/app/apikey

# Verify API key is valid
curl -H "Authorization: Bearer $GEMINI_API_KEY" \
  https://generativelanguage.googleapis.com/v1/models

# Check backend logs for rate limiting
grep "rate limit" backend/logs/app.log
```

### Issue: Build fails

**Solution**:
```bash
# Check Cloud Build logs
gcloud builds list --limit=5

# View specific build
gcloud builds log <BUILD_ID>

# Verify Artifact Registry permissions
gcloud artifacts repositories get-iam-policy servergem \
  --location=us-central1
```

### Issue: Deployment fails

**Solution**:
```bash
# Check Cloud Run logs
gcloud run services logs read <SERVICE_NAME> \
  --region=us-central1 \
  --limit=50

# Check service status
gcloud run services describe <SERVICE_NAME> \
  --region=us-central1 \
  --format="value(status.conditions)"
```

## Success Criteria

Phase 4 testing is **COMPLETE** when:

- ✅ All 10 test scenarios pass
- ✅ E2E deployment completes in <6 minutes
- ✅ Success rate is >95%
- ✅ Error messages are clear and actionable
- ✅ All components work together seamlessly
- ✅ Performance metrics meet targets
- ✅ Security best practices followed

---

**Testing Status**: Ready for validation

**Allahu Musta'an** - May Allah grant success in testing! 🚀
