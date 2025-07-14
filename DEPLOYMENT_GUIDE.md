# 🚀 Deployment Guide: Backend Only on Render

## Overview
This guide will help you deploy only the backend of your workforce monitoring system to Render, while keeping both frontend and backend in the same repository.

## 📁 Repository Structure
```
INTEL_AI_PROJECT/
├── backend/           # ← This will be deployed to Render
│   ├── app_simple.py
│   ├── requirements.render.txt
│   ├── start_optimized.py
│   └── ...
├── frontend/          # ← This stays in repo but won't be deployed
│   ├── src/
│   ├── package.json
│   └── ...
├── render.yaml        # ← Configured to deploy only backend
└── ...
```

## 🎯 Step-by-Step Deployment

### Step 1: Commit Your Changes
```bash
git add .
git commit -m "Configure backend-only deployment for Render"
git push origin main
```

### Step 2: Set Up Render Account
1. Go to [Render.com](https://render.com)
2. Sign up/Login with your GitHub account
3. Connect your GitHub repository

### Step 3: Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select your repository: `INTEL_AI_PROJECT`

### Step 4: Configure Service Settings
**Basic Settings:**
- **Name**: `workforce-monitoring-backend`
- **Environment**: `Python`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `backend` ← **IMPORTANT: This tells Render to only use the backend folder**

**Build & Deploy:**
- **Build Command**: Leave empty (uses render.yaml)
- **Start Command**: Leave empty (uses render.yaml)

### Step 5: Set Environment Variables
Click "Environment" tab and add:

**Required:**
```
MONGO_URI = your_mongodb_connection_string
```

**Optional (will use defaults):**
```
DATABASE_NAME = workforce_monitoring
DEBUG = false
HOST = 0.0.0.0
PORT = 10000
CORS_ORIGINS = *
```

### Step 6: Deploy
1. Click "Create Web Service"
2. Wait for build (5-10 minutes)
3. Monitor build logs

## 🔧 Frontend Configuration

### Step 7: Update Frontend API URL
After successful deployment, update the production API URL:

**File**: `frontend/src/config/api.config.ts`

```typescript
production: {
  baseURL: 'https://your-actual-render-url.onrender.com/api', // UPDATE THIS
  timeout: 30000,
},
```

### Step 8: Build and Deploy Frontend (Separately)
You can deploy your frontend to:
- **Vercel**: Connect your GitHub repo, set root directory to `frontend`
- **Netlify**: Connect your GitHub repo, set root directory to `frontend`
- **GitHub Pages**: Build and deploy from `frontend` directory

## 🧪 Testing Your Deployment

### Test Backend API
```bash
# Health check
curl https://your-service-url.onrender.com/api/health

# Test login
curl -X POST https://your-service-url.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Test Frontend Connection
1. Update the API URL in `frontend/src/config/api.config.ts`
2. Build and deploy frontend
3. Test the full application

## 📊 Expected Results

### Successful Deployment
- ✅ Build completes without memory errors
- ✅ Service starts successfully
- ✅ Health endpoint returns 200 OK
- ✅ Memory usage stays under 1GB
- ✅ Fast startup time (~10 seconds)

### Service URL Format
Your backend will be available at:
```
https://workforce-monitoring-backend.onrender.com
```

## 🔄 Updating Your Deployment

### Automatic Updates
- Push changes to `main` branch
- Render automatically redeploys backend
- Frontend needs separate deployment

### Manual Updates
1. Push changes to GitHub
2. Render detects changes in `backend/` folder
3. Automatic redeployment starts

## 🚨 Troubleshooting

### Build Fails
1. Check that `rootDir: backend` is set in render.yaml
2. Verify `requirements.render.txt` exists
3. Check build logs for specific errors

### Service Crashes
1. Check Render logs
2. Verify MongoDB connection
3. Check environment variables

### Frontend Can't Connect
1. Update API URL in `frontend/src/config/api.config.ts`
2. Check CORS settings
3. Verify backend is running

## 📱 Development Workflow

### Local Development
```bash
# Backend
cd backend
python start_optimized.py

# Frontend (in another terminal)
cd frontend
npm run dev
```

### Production Deployment
1. **Backend**: Automatically deployed to Render
2. **Frontend**: Deploy separately to Vercel/Netlify/GitHub Pages

## 🎉 Success Checklist

- [ ] Backend deploys successfully to Render
- [ ] Health endpoint returns 200 OK
- [ ] Frontend API URL updated
- [ ] Frontend deployed separately
- [ ] Full application works end-to-end
- [ ] Memory usage stays low
- [ ] Fast response times

## 📞 Support

If you encounter issues:
1. Check Render logs first
2. Verify environment variables
3. Test locally with optimized setup
4. Review `backend/MEMORY_OPTIMIZATION.md`

Your backend should now deploy successfully to Render without memory issues! 🚀 