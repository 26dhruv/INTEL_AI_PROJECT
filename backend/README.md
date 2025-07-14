# Workforce Monitoring System - Backend

A Flask-based backend for the Workforce Monitoring System with face recognition, safety monitoring, and real-time WebSocket communication.

## Features

- **Face Recognition**: Real-time employee identification using OpenCV and face_recognition
- **Safety Monitoring**: PPE detection (helmets, safety vests) using YOLO models
- **Attendance Tracking**: Automatic attendance marking based on face recognition
- **Real-time Communication**: WebSocket support for live updates
- **RESTful API**: Complete CRUD operations for employees and attendance
- **Authentication**: JWT-based authentication system
- **MongoDB Integration**: Persistent data storage

## Prerequisites

- Python 3.8 or higher
- MongoDB (local or cloud)
- Webcam (for camera functionality)

## Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd INTEL_AI_PROJECT
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Set up environment variables** (optional):
   Create a `.env` file in the backend directory:
   ```env
   FLASK_ENV=development
   DEBUG=true
   HOST=0.0.0.0
   PORT=5001
   MONGO_URI=your_mongodb_connection_string
   SECRET_KEY=your_secret_key
   JWT_SECRET_KEY=your_jwt_secret
   ```

## Running the Application

### Method 1: Using the startup script
```bash
cd backend
python start.py
```

### Method 2: Using Flask directly
```bash
cd backend
export FLASK_APP=app_simple.py
export FLASK_ENV=development
flask run --host=0.0.0.0 --port=5001
```

### Method 3: Using Python directly
```bash
cd backend
python run.py
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - User logout

### Employees
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Register new employee
- `GET /api/employees/<id>` - Get specific employee
- `PUT /api/employees/<id>` - Update employee
- `DELETE /api/employees/<id>` - Delete employee
- `PUT /api/employees/<id>/reactivate` - Reactivate employee

### Attendance
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/stats` - Get attendance statistics
- `POST /api/attendance/mark` - Mark attendance manually
- `GET /api/attendance/check-today` - Check today's attendance

### Safety
- `GET /api/safety/events` - Get safety events
- `GET /api/safety/stats` - Get safety statistics
- `POST /api/safety/analyze-frame` - Analyze frame for safety violations

### Camera
- `POST /api/camera/start` - Start camera monitoring
- `POST /api/camera/stop` - Stop camera monitoring
- `GET /api/camera/status` - Get camera status
- `GET /api/camera/feed` - Get video feed

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-alerts` - Get recent alerts

## WebSocket Events

- `face_detected` - Real-time face recognition events
- `safety_event` - Real-time safety violation events

## Default Admin Account

The system creates a default admin account on first run:
- Username: `admin`
- Password: `admin123`
- Email: `admin@workforce.com`

## Data Storage

The application stores data in:
- **MongoDB**: Employee records, attendance, safety events, users
- **Local files**: Face encodings, employee images, uploaded files

## Development

### Project Structure
```
backend/
├── app_simple.py          # Main Flask application
├── config.py              # Configuration settings
├── mongodb_manager.py     # Database operations
├── utils.py               # Utility functions
├── requirements.txt       # Python dependencies
├── start.py              # Startup script
└── run.py                # Alternative startup script
```

### Adding New Features

1. **New API Endpoints**: Add routes to `app_simple.py`
2. **Database Operations**: Add methods to `mongodb_manager.py`
3. **Configuration**: Update `config.py` for new settings
4. **Dependencies**: Update `requirements.txt` for new packages

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**:
   - Check your MongoDB URI in the configuration
   - Ensure MongoDB is running and accessible

2. **Camera Not Working**:
   - Check if webcam is connected and accessible
   - Try different camera indices (0, 1, 2, etc.)

3. **Face Recognition Issues**:
   - Ensure `dlib` and `face_recognition` are properly installed
   - Check if employee face encodings are loaded

4. **Port Already in Use**:
   - Change the port in configuration or kill the process using the port

### Logs

The application logs to:
- Console output (development)
- `backend.log` file (if configured)

## Production Deployment

For production deployment:

1. Set `FLASK_ENV=production`
2. Set `DEBUG=false`
3. Use a production WSGI server like Gunicorn
4. Configure proper MongoDB security
5. Set strong secret keys
6. Configure proper CORS origins

Example Gunicorn command:
```bash
gunicorn -w 4 -b 0.0.0.0:5001 backend.app_simple:app
``` 