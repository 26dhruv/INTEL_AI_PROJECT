# Workforce Monitoring System - Render Deployment Guide

This guide will help you deploy the Workforce Monitoring System to Render as a single integrated service.

## 🚀 Deployment Architecture

The system is configured to deploy as a **single web service** on Render that:
- Serves the React frontend from `/`
- Serves the API from `/api/*`
- Handles WebSocket connections from `/socket.io`
- Uses MongoDB Atlas for database
- Automatically builds and deploys on git push

## 📋 Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **MongoDB Atlas**: Set up a free cluster at [mongodb.com](https://www.mongodb.com/atlas)
3. **GitHub Repository**: Your code should be in a GitHub repository

## 🔧 Step 1: MongoDB Atlas Setup

### 1.1 Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new project or use existing
3. Create a free cluster (M0 Sandbox)
4. Wait for cluster to be created

### 1.2 Configure Database Access

1. Go to "Database Access" → "Add New Database User"
2. Create username/password authentication
3. Set database user privileges to "Read and write to any database"
4. Note down the username and password

### 1.3 Configure Network Access

1. Go to "Network Access" → "Add IP Address" 
2. Add `0.0.0.0/0` to allow access from anywhere (for Render)
3. Or add specific Render IP ranges if you prefer

### 1.4 Get Connection String

1. Go to "Database" → "Connect" → "Connect your application"
2. Copy the connection string (looks like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/workforce_monitoring?retryWrites=true&w=majority
   ```
3. Replace `<username>` and `<password>` with your actual credentials

## 🚀 Step 2: Render Deployment

### 2.1 Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Select the repository containing your workforce monitoring code

### 2.2 Configure Service Settings

**Basic Settings:**
- **Name**: `workforce-monitoring-system`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Build Command**: `./build.sh`
- **Start Command**: `cd backend && gunicorn --config gunicorn.render.conf.py app_simple:app`

**Advanced Settings:**
- **Health Check Path**: `/api/health`
- **Auto-Deploy**: Yes

### 2.3 Configure Environment Variables

Add the following environment variables in Render:

#### Required Variables:
```bash
FLASK_ENV=production
DEBUG=False
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/workforce_monitoring?retryWrites=true&w=majority
```

#### Auto-Generated Variables (let Render generate these):
```bash
SECRET_KEY=auto-generated-by-render
JWT_SECRET_KEY=auto-generated-by-render
```

#### Optional Variables:
```bash
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=your-secure-password
DEFAULT_ADMIN_EMAIL=admin@yourdomain.com
CORS_ORIGINS=*
FACE_RECOGNITION_TOLERANCE=0.6
SAFETY_CONFIDENCE_THRESHOLD=0.7
```

### 2.4 Deploy

1. Click "Create Web Service"
2. Render will automatically start building and deploying
3. Monitor the build logs for any errors
4. Once deployed, you'll get a URL like: `https://workforce-monitoring-system-abcd.onrender.com`

## 🔍 Step 3: Post-Deployment Verification

### 3.1 Check Health Status

Visit: `https://your-app-url.onrender.com/api/health`

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00",
  "services": {
    "mongodb": true,
    "face_recognition": true,
    "safety_monitoring": true,
    "camera": false
  }
}
```

### 3.2 Test Frontend Access

1. Visit: `https://your-app-url.onrender.com`
2. Should show the React frontend
3. Try logging in with default admin credentials

### 3.3 Test API Endpoints

Test key endpoints:
- `GET /api/employees` - Should return empty array initially
- `POST /api/auth/login` - Should accept admin credentials
- `GET /api/dashboard/stats` - Should return system stats

## 🛠️ Troubleshooting

### Common Issues:

#### 1. Build Failures
```bash
# If build fails, check:
- Node.js version compatibility
- Python dependencies
- File permissions
```

#### 2. MongoDB Connection Issues
```bash
# Check:
- Connection string format
- Username/password correctness
- Network access configuration
- Database name in connection string
```

#### 3. Frontend Not Loading
```bash
# Check:
- Build script completed successfully
- Static files copied to backend/static/
- Frontend routes configured correctly
```

#### 4. API Errors
```bash
# Check:
- Environment variables set correctly
- MongoDB connection working
- Import errors in Python code
```

### Debug Steps:

1. **Check Build Logs**: Look for errors in Render build logs
2. **Check Runtime Logs**: Monitor application logs in Render dashboard
3. **Test Health Endpoint**: Use `/api/health` to verify service status
4. **Test Database**: Check if MongoDB connection is working

## 📱 Step 4: Domain Configuration (Optional)

### 4.1 Custom Domain

1. Go to Render service settings
2. Add your custom domain
3. Configure DNS records as instructed
4. Enable SSL (automatic with Render)

### 4.2 Environment-Specific URLs

Update environment variables if using custom domain:
```bash
CORS_ORIGINS=https://yourdomain.com
```

## 🔐 Security Considerations

### 4.1 Environment Variables

- Never commit secrets to git
- Use Render's environment variable encryption
- Generate strong SECRET_KEY and JWT_SECRET_KEY
- Change default admin password

### 4.2 MongoDB Security

- Use strong database passwords
- Enable IP whitelisting if possible
- Regular security updates

### 4.3 Application Security

- HTTPS enabled by default on Render
- CORS properly configured
- Input validation on all API endpoints

## 🎯 Performance Optimization

### 4.1 Render Settings

- Choose appropriate instance size
- Enable auto-scaling if needed
- Monitor resource usage

### 4.2 Database Optimization

- Use MongoDB Atlas performance advisor
- Add indexes for frequently queried fields
- Monitor query performance

### 4.3 Frontend Optimization

- Static assets cached by Render CDN
- Code splitting configured in Vite
- Compressed assets

## 🔄 Continuous Deployment

### 4.1 Auto-Deploy

- Enabled by default on main branch
- Pushes to main trigger automatic builds
- Failed builds don't affect live service

### 4.2 Environment Branches

Create separate services for:
- Development: `dev` branch
- Staging: `staging` branch  
- Production: `main` branch

## 📊 Monitoring and Logs

### 4.1 Render Monitoring

- Built-in metrics dashboard
- Real-time logs
- Performance monitoring

### 4.2 Application Monitoring

- Health check endpoint
- Database connection monitoring
- Error tracking via logs

## 🆘 Support and Maintenance

### 4.1 Regular Updates

- Keep dependencies updated
- Monitor security advisories
- Update MongoDB connection strings if needed

### 4.2 Backup Strategy

- MongoDB Atlas automatic backups
- Export configuration settings
- Keep deployment documentation updated

## 📞 Getting Help

If you encounter issues:

1. Check Render documentation
2. Review build and runtime logs
3. Test individual components
4. Contact support if needed

---

## 🎉 Congratulations!

Your Workforce Monitoring System is now deployed on Render! 

- **Frontend**: Available at your Render URL
- **API**: Available at `your-url/api/*`
- **WebSocket**: Real-time updates enabled
- **Database**: MongoDB Atlas connected
- **SSL**: Automatic HTTPS
- **Scaling**: Auto-scaling enabled

The system is production-ready and will automatically deploy updates when you push to your main branch. 