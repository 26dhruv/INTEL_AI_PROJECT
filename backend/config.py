import os
from datetime import timedelta
from pathlib import Path

class Config:
    # MongoDB Configuration
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb+srv://dhruv:O87jTJsEnJhDwMWP@patrolmonitoring.drkoji9.mongodb.net/?retryWrites=true&w=majority&appName=PatrolMonitoring')
    DATABASE_NAME = 'workforce_monitoring'
    
    # Collections
    EMPLOYEES_COLLECTION = 'employees'
    ATTENDANCE_COLLECTION = 'attendance'
    SAFETY_EVENTS_COLLECTION = 'safety_events'
    USERS_COLLECTION = 'users'
    ALERTS_COLLECTION = 'alerts'
    
    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # File Storage
    UPLOAD_FOLDER = Path('data/uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    
    # Face Recognition
    FACE_ENCODINGS_PATH = Path("data/face_encodings.pkl")
    EMPLOYEE_IMAGES_DIR = Path("data/employee_images")
    FACE_RECOGNITION_MODEL = "hog"
    FACE_RECOGNITION_TOLERANCE = 0.6
    
    # Safety Monitoring
    PPE_MODEL_PATH = Path("data/ppe_model.pt")
    SAFETY_CONFIDENCE_THRESHOLD = 0.7
    
    # Camera Configuration
    CAMERA_INDEX = 0
    CAMERA_WIDTH = 640
    CAMERA_HEIGHT = 480
    CAMERA_FPS = 30
    
    # API Configuration
    API_TITLE = "Workforce Monitoring API"
    API_VERSION = "v1"
    API_PREFIX = "/api"
    
    # CORS Configuration
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]
    
    # WebSocket Configuration
    WEBSOCKET_ASYNC_MODE = 'threading'
    
    # Default Admin User
    DEFAULT_ADMIN_USERNAME = 'admin'
    DEFAULT_ADMIN_PASSWORD = 'admin123'
    DEFAULT_ADMIN_EMAIL = 'admin@workforce.com'
    
    def __init__(self):
        """Initialize configuration and create necessary directories"""
        self.create_directories()
    
    def create_directories(self):
        """Create necessary directories if they don't exist"""
        directories = [
            Path("data"),
            self.UPLOAD_FOLDER,
            self.EMPLOYEE_IMAGES_DIR,
            Path("logs"),
            Path("temp")
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
    
    @classmethod
    def get_database_config(cls):
        """Get database configuration dictionary"""
        return {
            'uri': cls.MONGO_URI,
            'database': cls.DATABASE_NAME,
            'collections': {
                'employees': cls.EMPLOYEES_COLLECTION,
                'attendance': cls.ATTENDANCE_COLLECTION,
                'safety_events': cls.SAFETY_EVENTS_COLLECTION,
                'users': cls.USERS_COLLECTION,
                'alerts': cls.ALERTS_COLLECTION
            }
        }

# Development Configuration
class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False

# Production Configuration
class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    
    # Override with stronger security settings
    SECRET_KEY = os.getenv('SECRET_KEY', os.urandom(32))
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', os.urandom(32))

# Testing Configuration
class TestingConfig(Config):
    TESTING = True
    DATABASE_NAME = 'workforce_monitoring_test'
    MONGO_URI = os.getenv('TEST_MONGO_URI', 'mongodb://localhost:27017/workforce_monitoring_test')

# Configuration mapping
config_mapping = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config(config_name=None):
    """Get configuration class based on environment"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'default')
    
    return config_mapping.get(config_name, DevelopmentConfig) 