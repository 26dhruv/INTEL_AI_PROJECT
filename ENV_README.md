# Environment Configuration Guide

This project uses separate environment configurations for backend and frontend to ensure proper separation of concerns and deployment flexibility.

## Backend Environment (.env in backend/)

The backend uses environment variables to configure all backend-specific settings without any references to frontend URLs or configurations.

### Required Environment Variables

Copy the following to `backend/.env`:

```env
# Backend Environment Configuration
# Flask Application
FLASK_ENV=development
DEBUG=true
SECRET_KEY=your-secret-key-change-in-production
HOST=0.0.0.0
PORT=5001

# Database Configuration
MONGO_URI=mongodb+srv://dhruv:O87jTJsEnJhDwMWP@patrolmonitoring.drkoji9.mongodb.net/?retryWrites=true&w=majority&appName=PatrolMonitoring
DATABASE_NAME=workforce_monitoring

# JWT Configuration
JWT_SECRET_KEY=jwt-secret-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRES_HOURS=1
JWT_REFRESH_TOKEN_EXPIRES_DAYS=30

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

# API Configuration
API_TITLE=Workforce Monitoring API
API_VERSION=v1
API_PREFIX=/api

# CORS Configuration (backend should accept requests from specific origins)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173

# WebSocket Configuration
WEBSOCKET_ASYNC_MODE=threading

# Default Admin User
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123
DEFAULT_ADMIN_EMAIL=admin@workforce.com
```

### Production Configuration

For production, update these variables:

```env
# Production overrides
SECRET_KEY=your-production-secret-key
JWT_SECRET_KEY=your-production-jwt-secret
DEBUG=false
MONGO_URI=your-production-mongodb-uri
CORS_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
```

## Frontend Environment (.env in frontend/)

The frontend uses environment variables for all frontend-specific configurations including API URLs and UI settings.

### Required Environment Variables

Copy the following to `frontend/.env`:

```env
# Frontend Environment Configuration
# Development API URL
VITE_API_URL=http://localhost:5001/api

# Application Configuration
VITE_APP_NAME=Workforce Monitoring System
VITE_APP_VERSION=1.0.0

# Features Configuration
VITE_ENABLE_CAMERA=true
VITE_ENABLE_FACE_RECOGNITION=true
VITE_ENABLE_SAFETY_MONITORING=true

# UI Configuration
VITE_DEFAULT_THEME=light
VITE_ENABLE_DARK_MODE=true

# WebSocket Configuration
VITE_WEBSOCKET_URL=ws://localhost:5001

# API Configuration
VITE_API_TIMEOUT=30000
VITE_API_RETRY_ATTEMPTS=3

# Development Configuration
VITE_DEV_MODE=true
VITE_SHOW_DEBUG_INFO=true
```

### Production Configuration

For production, update these variables:

```env
# Production overrides
VITE_API_URL=https://your-production-api.com/api
VITE_WEBSOCKET_URL=wss://your-production-api.com
VITE_DEV_MODE=false
VITE_SHOW_DEBUG_INFO=false
```

## Development Setup

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create your `.env` file (copy from above)

4. Start the backend server:
   ```bash
   python app_simple.py
   # or
   python run.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` file (copy from above)

4. Start the frontend development server:
   ```bash
   npm run dev
   ```

## Key Benefits

### Backend Benefits
- **No Frontend Dependencies**: Backend doesn't reference any frontend URLs
- **Environment Isolation**: Complete separation between backend and frontend configs
- **Production Ready**: Easy to deploy backend independently
- **Security**: Sensitive keys can be managed separately

### Frontend Benefits
- **API Flexibility**: Easy to change API endpoints without code changes
- **Feature Flags**: Enable/disable features via environment variables
- **Build Optimization**: Different configurations for development and production
- **Deployment Ready**: Environment-specific builds

## Deployment

### Backend Deployment
- Set production environment variables on your hosting platform
- Use production MongoDB URI
- Set strong secret keys
- Configure CORS for your frontend domain

### Frontend Deployment
- Set production API URL
- Build with production configuration
- Deploy static files to CDN or hosting platform

## Security Notes

1. **Never commit .env files** to version control
2. **Use strong secret keys** in production
3. **Restrict CORS origins** in production
4. **Use HTTPS** in production
5. **Rotate keys regularly** in production

## Troubleshooting

### Common Issues

1. **API Connection Errors**: Check `VITE_API_URL` in frontend `.env`
2. **Database Connection**: Verify `MONGO_URI` in backend `.env`
3. **Port Conflicts**: Change `PORT` in backend `.env`
4. **CORS Errors**: Update `CORS_ORIGINS` in backend `.env`
5. **WebSocket Connection Errors**: 
   - Check `VITE_WEBSOCKET_URL` in frontend `.env`
   - Ensure backend is running on the correct port
   - Verify CORS configuration in backend `.env` includes your frontend URLs
   - For "xhr poll error": Update `CORS_ORIGINS` to include specific frontend URLs instead of '*'
   - Test connection manually using browser console: `websocketService.testConnection()`
   - Use `websocket_test.html` for standalone testing

### Environment Variable Loading

- Backend: Uses `python-dotenv` to load `.env` files
- Frontend: Uses Vite's built-in environment variable support
- Variables are loaded at startup time
- Restart servers after changing environment variables 