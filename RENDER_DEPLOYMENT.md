# Render Deployment Guide

This guide will help you deploy your Flask backend to Render using Docker, optimized for memory efficiency.

## 🐳 Docker Configuration

### Files Overview

- `backend/Dockerfile.render` - Production-optimized Dockerfile for Render
- `backend/requirements.docker.txt` - Lightweight dependencies
- `backend/gunicorn.conf.py` - Production server configuration
- `backend/.dockerignore` - Excludes unnecessary files

### Memory Optimization

The Docker setup is optimized for Render's memory constraints:

- **Multi-stage build** reduces final image size
- **Lightweight dependencies** (removed heavy packages like torch/torchvision)
- **Single worker process** to minimize memory usage
- **opencv-python-headless** instead of full OpenCV
- **Minimal system packages**

## 🚀 Render Deployment Steps

### 1. Prepare Your Repository

1. **Push to GitHub** (or GitLab/Bitbucket):
   ```bash
   git add .
   git commit -m "Add Docker configuration for Render deployment"
   git push origin main
   ```

### 2. Create Web Service on Render

1. **Go to [Render Dashboard](https://dashboard.render.com/)**

2. **Click "New +" → "Web Service"**

3. **Connect your repository**

4. **Configure the service:**
   - **Name**: `workforce-monitoring-backend`
   - **Environment**: `Docker`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Dockerfile Path**: `backend/Dockerfile.render`
   - **Docker Build Context Directory**: `backend`

### 3. Environment Variables

Set these environment variables in Render:

#### Required Variables
```bash
# Flask Configuration
FLASK_ENV=production
DEBUG=false
SECRET_KEY=your-super-secret-production-key-here
HOST=0.0.0.0

# Database
MONGO_URI=your-mongodb-atlas-connection-string
DATABASE_NAME=workforce_monitoring

# JWT
JWT_SECRET_KEY=your-jwt-secret-production-key-here

# CORS (update with your frontend domain)
CORS_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com

# API Configuration
API_TITLE=Workforce Monitoring API
API_VERSION=v1
API_PREFIX=/api

# Face Recognition
FACE_RECOGNITION_MODEL=hog
FACE_RECOGNITION_TOLERANCE=0.6

# Safety Monitoring
SAFETY_CONFIDENCE_THRESHOLD=0.7

# Camera Configuration
CAMERA_INDEX=0
CAMERA_WIDTH=640
CAMERA_HEIGHT=480
CAMERA_FPS=30

# File Upload
MAX_CONTENT_LENGTH=16777216

# WebSocket
WEBSOCKET_ASYNC_MODE=threading

# Admin User
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=change-this-in-production
DEFAULT_ADMIN_EMAIL=admin@yourcompany.com
```

#### Auto-provided by Render
- `PORT` - Render automatically sets this

### 4. Advanced Settings

#### Build & Deploy
- **Build Command**: *(Leave empty - uses Dockerfile)*
- **Start Command**: *(Leave empty - uses Dockerfile CMD)*

#### Resources
- **Plan**: Start with "Starter" plan ($7/month)
- **Auto-Deploy**: Enable for automatic deployments

#### Health Check
- **Health Check Path**: `/api/health`

### 5. Database Setup (MongoDB Atlas)

1. **Create MongoDB Atlas cluster** (if not already done)
2. **Get connection string** and add to `MONGO_URI`
3. **Whitelist Render IPs** (or use 0.0.0.0/0 for simplicity)

## 📱 Frontend Configuration

Update your frontend environment variables to use the Render URL:

```bash
# frontend/.env.production
VITE_API_URL=https://your-service-name.onrender.com/api
VITE_WEBSOCKET_URL=https://your-service-name.onrender.com
```

## 🔧 Local Testing with Docker

### Build and run locally:

```bash
# Build the Docker image
cd backend
docker build -f Dockerfile.render -t workforce-backend .

# Run the container
docker run -p 5001:5001 \
  -e MONGO_URI="your-mongo-uri" \
  -e SECRET_KEY="test-key" \
  -e JWT_SECRET_KEY="test-jwt-key" \
  workforce-backend
```

### Using Docker Compose:

```bash
# Create .env file with your variables
cp backend/.env .env

# Run with docker-compose
docker-compose up --build
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Memory Errors
- **Solution**: Use `requirements.docker.txt` instead of full requirements
- **Alternative**: Remove heavy packages like `torch`, `torchvision`, `ultralytics`

#### 2. Build Timeout
- **Solution**: Use multi-stage Dockerfile (`Dockerfile.render`)
- **Alternative**: Pre-build image and push to Docker Hub

#### 3. Database Connection
- **Check**: MongoDB Atlas connection string
- **Check**: IP whitelist includes Render IPs
- **Check**: Database name matches `DATABASE_NAME`

#### 4. CORS Issues
- **Update**: `CORS_ORIGINS` with your frontend domain
- **Format**: `https://yourapp.com,https://www.yourapp.com`

#### 5. WebSocket Connection
- **Use**: `wss://` instead of `ws://` for HTTPS
- **Check**: CORS origins include WebSocket domains

### Memory Optimization Tips

1. **Remove unused packages** from requirements
2. **Use lighter alternatives**:
   - `opencv-python-headless` instead of `opencv-python`
   - Skip `torch`/`torchvision` if not essential
3. **Reduce worker processes** (set to 1 in gunicorn config)
4. **Enable memory limits** in Docker

### Logs and Debugging

```bash
# View Render logs
# Go to Render Dashboard → Your Service → Logs

# Local debugging
docker logs <container-id>

# Health check
curl https://your-service.onrender.com/api/health
```

## 🔒 Security Checklist

- [ ] Strong `SECRET_KEY` and `JWT_SECRET_KEY`
- [ ] Specific CORS origins (not `*`)
- [ ] MongoDB Atlas with IP restrictions
- [ ] Change default admin password
- [ ] Enable HTTPS on frontend
- [ ] Use environment variables for secrets

## 💰 Cost Optimization

### Render Pricing (as of 2024)
- **Starter**: $7/month, 512MB RAM, 0.1 CPU
- **Standard**: $25/month, 2GB RAM, 1 CPU
- **Pro**: $85/month, 4GB RAM, 2 CPU

### Tips
1. **Start with Starter plan** - should be sufficient for development
2. **Monitor memory usage** in Render dashboard
3. **Scale up only if needed**
4. **Use sleep prevention** to avoid cold starts

## 🚀 Production Checklist

- [ ] Environment variables set correctly
- [ ] Database properly configured
- [ ] CORS origins updated
- [ ] Health check working
- [ ] Frontend pointing to Render URL
- [ ] SSL/HTTPS enabled
- [ ] Monitoring set up
- [ ] Backup strategy in place

## 📊 Monitoring

1. **Render Dashboard**: Monitor CPU, memory, and response times
2. **Application Logs**: Check for errors and performance issues
3. **Health Checks**: Ensure `/api/health` returns 200
4. **Database Monitoring**: MongoDB Atlas metrics

## 🔄 Updates and Deployments

### Automatic Deployment
- Push to main branch → Render auto-deploys

### Manual Deployment
- Go to Render Dashboard → Deploy latest commit

### Rollback
- Go to Render Dashboard → Deploys → Rollback

---

## 🆘 Support

If you encounter issues:

1. **Check Render logs** first
2. **Verify environment variables**
3. **Test locally with Docker**
4. **Check database connectivity**
5. **Review CORS configuration**

Your Flask backend should now be running efficiently on Render! 🎉 