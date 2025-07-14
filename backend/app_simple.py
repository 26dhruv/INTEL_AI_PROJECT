#!/usr/bin/env python3
"""
Simplified Workforce Monitoring System Backend
A clean, organized Flask application with all core functionality maintained.
"""

import os
import sys
import gc
import psutil
import logging
import threading
from pathlib import Path

# Memory optimization: Set garbage collection thresholds
gc.set_threshold(700, 10, 10)

# Memory optimization: Import heavy libraries lazily
def import_cv2():
    """Lazy import of OpenCV to reduce startup memory usage"""
    import cv2
    return cv2

def import_numpy():
    """Lazy import of numpy to reduce startup memory usage"""
    import numpy as np
    return np

def import_face_recognition():
    """Lazy import of face_recognition to reduce startup memory usage"""
    try:
        import face_recognition
        return face_recognition
    except ImportError:
        return None

# Import lighter dependencies first
import jwt
import time
import json
import base64
import bcrypt
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
from flask_socketio import SocketIO, emit

# Add parent directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.mongodb_manager import MongoDBManager
from backend.config import Config, get_config

# =============================================================================
# CONFIGURATION & LOGGING
# =============================================================================

config = get_config()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Memory optimization: Log memory usage
def log_memory_usage():
    """Log current memory usage for monitoring"""
    process = psutil.Process(os.getpid())
    memory_info = process.memory_info()
    logger.info(f"Memory usage: {memory_info.rss / 1024 / 1024:.2f} MB")

log_memory_usage()

# =============================================================================
# FLASK APP SETUP
# =============================================================================

app = Flask(__name__, static_folder='static', static_url_path='')
app.config.update({
    'SECRET_KEY': config.SECRET_KEY,
    'MAX_CONTENT_LENGTH': config.MAX_CONTENT_LENGTH
})

CORS(app, origins=config.CORS_ORIGINS)
socketio = SocketIO(app, cors_allowed_origins=config.CORS_ORIGINS)

# =============================================================================
# SYSTEM COMPONENTS
# =============================================================================

# Initialize database
try:
    db_manager = MongoDBManager(config)
    logger.info("✅ MongoDB connected successfully")
except Exception as e:
    logger.error(f"❌ MongoDB connection failed: {e}")
    db_manager = None

# Global camera state
camera_state = {
    'camera': None,
    'thread': None,
    'is_running': False
}

# =============================================================================
# MOCK ML SYSTEMS
# =============================================================================

class RealFaceRecognitionSystem:
    """Real face recognition system using OpenCV and face_recognition library"""
    
    def __init__(self):
        self.known_face_encodings = []
        self.known_face_names = []
        self.known_employee_ids = []
        
        # Lazy load OpenCV
        cv2 = import_cv2()
        
        # Initialize OpenCV face detector
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Load any existing employee data from database
        self.load_employees_from_db()
        
        logger.info("✅ Real Face Recognition System initialized")
    
    def load_employees_from_db(self):
        """Load employee face data from database"""
        try:
            if db_manager:
                employees = db_manager.get_all_employees_with_encodings()
                self.known_face_encodings = []
                self.known_face_names = []
                self.known_employee_ids = []
                
                for emp in employees:
                    # Load real face encodings from database
                    if emp.get('employee_id') and emp.get('face_encoding'):
                        self.known_employee_ids.append(emp['employee_id'])
                        self.known_face_names.append(emp['name'])
                        # Convert list back to numpy array
                        np = import_numpy()
                        self.known_face_encodings.append(np.array(emp['face_encoding']))
                
                logger.info(f"Loaded {len(self.known_face_names)} employees with face encodings for recognition")
        except Exception as e:
            logger.error(f"Error loading employees: {e}")
    
    def register_employee(self, name: str, employee_id: str, face_image) -> bool:
        """Register a new employee for face recognition"""
        try:
            if employee_id not in self.known_employee_ids:
                self.known_employee_ids.append(employee_id)
                self.known_face_names.append(name)
                # In a real system, you'd extract face encodings from the image
                # For now, create a dummy encoding
                np = import_numpy()
                self.known_face_encodings.append(np.random.random(128))
                logger.info(f"Registered employee {name} ({employee_id}) for face recognition")
                return True
            else:
                logger.warning(f"Employee {employee_id} already registered for face recognition")
                return False
        except Exception as e:
            logger.error(f"Error registering employee for face recognition: {e}")
            return False
    
    def detect_faces(self, frame):
        """Detect faces in frame using OpenCV"""
        try:
            cv2 = import_cv2()
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30),
                flags=cv2.CASCADE_SCALE_IMAGE
            )
            
            return faces
        except Exception as e:
            logger.error(f"Error detecting faces: {e}")
            return []
    
    def recognize_faces(self, frame):
        """Recognize faces in frame and return results"""
        try:
            face_recognition = import_face_recognition()
            cv2 = import_cv2()
            
            if face_recognition is None:
                logger.error("face_recognition library not available, falling back to OpenCV detection")
                # Fallback to OpenCV detection without recognition
                faces = self.detect_faces(frame)
                results = []
                
                for (x, y, w, h) in faces:
                    results.append({
                        "employee_id": "UNKNOWN",
                        "name": "Unknown Person",
                        "confidence": 0.0,
                        "bbox": (x, y, w, h),
                        "timestamp": datetime.now().isoformat()
                    })
                
                return results
            
            # Convert BGR to RGB for face_recognition
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Find face locations and encodings
            face_locations = face_recognition.face_locations(rgb_frame)
            face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
            
            results = []
            
            for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
                # Compare with known faces
                if len(self.known_face_encodings) > 0:
                    matches = face_recognition.compare_faces(self.known_face_encodings, face_encoding, tolerance=0.6)
                    face_distances = face_recognition.face_distance(self.known_face_encodings, face_encoding)
                    
                    best_match_index = np.argmin(face_distances)
                    
                    if matches[best_match_index]:
                        name = self.known_face_names[best_match_index]
                        employee_id = self.known_employee_ids[best_match_index]
                        confidence = 1.0 - face_distances[best_match_index]  # Convert distance to confidence
                    else:
                        name = "Unknown Person"
                        employee_id = "UNKNOWN"
                        confidence = 0.0
                else:
                    name = "Unknown Person"
                    employee_id = "UNKNOWN"
                    confidence = 0.0
                
                # Convert face_recognition coordinates to OpenCV format
                x, y, w, h = left, top, right - left, bottom - top
                
                results.append({
                    "employee_id": employee_id,
                    "name": name,
                    "confidence": confidence,
                    "bbox": (x, y, w, h),
                    "timestamp": datetime.now().isoformat()
                })
            
            return results
        except Exception as e:
            logger.error(f"Error recognizing faces: {e}")
            return []

class RealSafetyMonitor:
    """Real-time PPE detection system using computer vision"""
    
    def __init__(self):
        self.helmet_cascade = None
        self.person_cascade = None
        self.initialize_detectors()
        logger.info("✅ Real Safety Monitor initialized with computer vision")
    
    def initialize_detectors(self):
        """Initialize OpenCV cascade classifiers for detection"""
        try:
            cv2 = import_cv2()
            # Load pre-trained cascade classifiers
            self.person_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_fullbody.xml')
            # For helmet detection, we'll use color-based detection since OpenCV doesn't have a pre-trained helmet cascade
            logger.info("Safety detection classifiers loaded successfully")
        except Exception as e:
            logger.error(f"Error loading safety classifiers: {e}")
    
    def detect_helmet(self, frame, person_bbox=None):
        """Detect helmet/hard hat using color-based detection"""
        try:
            cv2 = import_cv2()
            np = import_numpy()
            
            # Convert to HSV for better color detection
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            
            # Define more strict color ranges for common helmet colors
            helmet_color_ranges = [
                # Yellow helmet (more restrictive)
                (np.array([22, 150, 150]), np.array([28, 255, 255])),
                # White helmet (more restrictive)
                (np.array([0, 0, 220]), np.array([180, 25, 255])),
                # Orange helmet (more restrictive)
                (np.array([12, 150, 150]), np.array([18, 255, 255])),
                # Red helmet (more restrictive)
                (np.array([0, 150, 150]), np.array([8, 255, 255])),
            ]
            
            helmet_mask = np.zeros(hsv.shape[:2], dtype=np.uint8)
            
            # Combine all helmet color ranges
            for lower, upper in helmet_color_ranges:
                mask = cv2.inRange(hsv, lower, upper)
                helmet_mask = cv2.bitwise_or(helmet_mask, mask)
            
            # Focus on upper part of frame (where helmets would be)
            height, width = frame.shape[:2]
            if person_bbox:
                x, y, w, h = person_bbox
                # Look for helmet in upper 25% of person detection
                helmet_roi = helmet_mask[y:y+int(h*0.25), x:x+w]
            else:
                # Look for helmet in upper 30% of frame
                helmet_roi = helmet_mask[0:int(height*0.3), :]
            
            # Find contours for helmet detection
            contours, _ = cv2.findContours(helmet_roi, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Check if we found significant helmet-like contours
            helmet_detected = False
            for contour in contours:
                area = cv2.contourArea(contour)
                if area > 800:  # Increased minimum area threshold for helmet
                    # Additional shape check - helmet should be somewhat circular/oval
                    perimeter = cv2.arcLength(contour, True)
                    if perimeter > 0:
                        circularity = 4 * np.pi * area / (perimeter * perimeter)
                        if circularity > 0.3:  # Reasonable shape for helmet
                            helmet_detected = True
                            break
            
            return helmet_detected
            
        except Exception as e:
            logger.error(f"Error in helmet detection: {e}")
            return False
    
    def detect_safety_vest(self, frame, person_bbox=None):
        """Detect safety vest using color-based detection"""
        try:
            cv2 = import_cv2()
            np = import_numpy()
            
            # Convert to HSV for better color detection
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            
            # Define more strict color ranges for common safety vest colors
            vest_color_ranges = [
                # Orange safety vest (more restrictive)
                (np.array([12, 150, 150]), np.array([22, 255, 255])),
                # Yellow safety vest (more restrictive)
                (np.array([22, 150, 150]), np.array([32, 255, 255])),
                # Green safety vest (more restrictive)
                (np.array([45, 150, 150]), np.array([75, 255, 255])),
            ]
            
            vest_mask = np.zeros(hsv.shape[:2], dtype=np.uint8)
            
            # Combine all vest color ranges
            for lower, upper in vest_color_ranges:
                mask = cv2.inRange(hsv, lower, upper)
                vest_mask = cv2.bitwise_or(vest_mask, mask)
            
            # Focus on torso area (middle part of frame)
            height, width = frame.shape[:2]
            if person_bbox:
                x, y, w, h = person_bbox
                # Look for vest in middle 50% of person detection
                vest_roi = vest_mask[y+int(h*0.25):y+int(h*0.75), x:x+w]
            else:
                # Look for vest in middle 50% of frame
                vest_roi = vest_mask[int(height*0.25):int(height*0.75), :]
            
            # Find contours for vest detection
            contours, _ = cv2.findContours(vest_roi, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Check if we found significant vest-like contours
            vest_detected = False
            for contour in contours:
                area = cv2.contourArea(contour)
                if area > 1500:  # Increased minimum area threshold for safety vest
                    # Additional shape check - vest should be somewhat rectangular
                    x_c, y_c, w_c, h_c = cv2.boundingRect(contour)
                    aspect_ratio = float(w_c) / h_c
                    if 0.5 < aspect_ratio < 2.0:  # Reasonable aspect ratio for vest
                        vest_detected = True
                        break
            
            return vest_detected
            
        except Exception as e:
            logger.error(f"Error in safety vest detection: {e}")
            return False
    
    def detect_person(self, frame):
        """Detect person in frame"""
        try:
            cv2 = import_cv2()
            # First try cascade classifier
            if self.person_cascade is not None:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                persons = self.person_cascade.detectMultiScale(
                    gray,
                    scaleFactor=1.1,
                    minNeighbors=3,
                    minSize=(50, 100)
                )
                if len(persons) > 0:
                    return persons
            
            # Fallback: detect any significant motion/objects in frame
            # This is useful when cascade classifier fails
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Use edge detection to find objects
            edges = cv2.Canny(gray, 50, 150)
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Look for large contours that could be persons
            person_contours = []
            for contour in contours:
                area = cv2.contourArea(contour)
                if area > 5000:  # Minimum area for a person
                    x, y, w, h = cv2.boundingRect(contour)
                    # Check aspect ratio (height should be greater than width for a person)
                    if h > w * 0.8:  # Person-like aspect ratio
                        person_contours.append([x, y, w, h])
            
            return person_contours
            
        except Exception as e:
            logger.error(f"Error in person detection: {e}")
            return []
    
    def process_frame(self, frame, face_results=None):
        """Process frame for real-time safety monitoring"""
        try:
            violations = []
            
            # First, try to detect persons using our own detection
            persons = self.detect_person(frame)
            
            # If we have face detection results, use them as additional person detection
            if face_results and len(face_results) > 0:
                # Convert face detection bounding boxes to person bounding boxes
                for face in face_results:
                    if face.get('bbox'):
                        x, y, w, h = face['bbox']
                        # Expand face bbox to approximate person bbox
                        person_x = max(0, x - w // 2)
                        person_y = max(0, y - h // 4)
                        person_w = w * 2
                        person_h = h * 4
                        persons.append([person_x, person_y, person_w, person_h])
                
                logger.info(f"Face detection provided {len(face_results)} additional person detections")
            
            # Only perform safety checks if a person is detected
            if len(persons) > 0:
                person_bbox = persons[0]
                
                # Check for helmet
                has_helmet = self.detect_helmet(frame, person_bbox)
                if not has_helmet:
                    violations.append("Hard hat required")
                
                # Check for safety vest
                has_vest = self.detect_safety_vest(frame, person_bbox)
                if not has_vest:
                    violations.append("Safety vest required")
            else:
                # No person detected - cannot determine safety compliance
                has_helmet = False
                has_vest = False
                violations.append("No person detected for safety assessment")
            
            # Calculate safety score based on compliance
            if len(persons) == 0:
                # No person detected - neutral safety score
                safety_score = 0.5
                status = "no_person_detected"
            elif len(violations) == 0:
                safety_score = 1.0
                status = "compliant"
            elif len(violations) == 1:
                safety_score = 0.7
                status = "minor_violation"
            elif len(violations) == 2:
                safety_score = 0.4
                status = "major_violation"
            else:
                safety_score = 0.1
                status = "critical"
            
            logger.info(f"Safety check: {len(persons)} person(s), Helmet: {has_helmet}, Vest: {has_vest}, Violations: {violations}")
            
            return {
                "ppe_violations": violations,
                "safety_score": safety_score,
                "safety_status": status,
                "violations": violations,
                "hasHelmet": has_helmet,
                "hasVest": has_vest,
                "persons_detected": len(persons),
                "timestamp": datetime.now().isoformat()
            }
                
        except Exception as e:
            logger.error(f"Error processing safety: {e}")
            # Return actual error state instead of fake compliant data
            return {
                "ppe_violations": ["Safety system error"],
                "safety_score": 0.0,
                "safety_status": "system_error",
                "violations": ["Safety system error"],
                "hasHelmet": False,
                "hasVest": False,
                "persons_detected": 0,
                "timestamp": datetime.now().isoformat()
            }

# Initialize real systems
face_system = RealFaceRecognitionSystem()
safety_monitor = RealSafetyMonitor()

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def create_response(data=None, error=None, status=200):
    """Create standardized API response"""
    if error:
        return jsonify({'error': error}), status
    return jsonify(data), status

def hash_password(password):
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password, hashed):
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_token(user_id, username, role):
    """Generate JWT token for user"""
    payload = {
        'user_id': user_id,
        'username': username,
        'role': role,
        'exp': datetime.utcnow() + config.JWT_ACCESS_TOKEN_EXPIRES
    }
    return jwt.encode(payload, config.JWT_SECRET_KEY, algorithm='HS256')

def verify_token(token):
    """Verify JWT token"""
    try:
        return jwt.decode(token, config.JWT_SECRET_KEY, algorithms=['HS256'])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None

# =============================================================================
# DECORATORS
# =============================================================================

def require_db(f):
    """Decorator to check database availability"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not db_manager:
            return create_response(error='Database not available', status=503)
        return f(*args, **kwargs)
    return decorated_function

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return create_response(error='No token provided', status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_token(token)
        if not payload:
            return create_response(error='Invalid token', status=401)
        
        request.user = payload
        return f(*args, **kwargs)
    return decorated_function

def handle_exceptions(f):
    """Decorator to handle common exceptions"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"Error in {f.__name__}: {e}")
            return create_response(error=str(e), status=500)
    return decorated_function

# =============================================================================
# STATIC FILE SERVING
# =============================================================================

@app.route('/')
def serve_react_app():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_react_assets(path):
    try:
        # If it's an API route, let it be handled by the API
        if path.startswith('api/'):
            return "Not found", 404
        
        # Try to serve the static file
        return send_from_directory(app.static_folder, path)
    except:
        # If file not found, serve index.html (for React Router)
        return send_from_directory(app.static_folder, 'index.html')

# =============================================================================
# HEALTH CHECK
# =============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    return create_response({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'mongodb': db_manager is not None,
            'face_recognition': face_system is not None,
            'safety_monitoring': safety_monitor is not None,
            'camera': camera_state['is_running']
        }
    })

# =============================================================================
# AUTHENTICATION API
# =============================================================================

@app.route('/api/auth/login', methods=['POST'])
@require_db
@handle_exceptions
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return create_response(error='Username and password required', status=400)
    
    # Find and verify user
    user = db_manager.users.find_one({'username': username, 'status': 'active'})
    if not user or not verify_password(password, user['password_hash']):
        return create_response(error='Invalid credentials', status=401)
    
    # Update last login
    db_manager.users.update_one({'_id': user['_id']}, {'$set': {'last_login': datetime.now()}})
    
    # Generate token and return user info
    token = generate_token(str(user['_id']), user['username'], user['role'])
    user_info = {
        'id': str(user['_id']),
        'username': user['username'],
        'email': user['email'],
        'role': user['role'],
        'permissions': user['permissions'],
        'created_at': user['created_at'].isoformat(),
        'last_login': user.get('last_login', datetime.now()).isoformat()
    }
    
    return create_response({
        'user': user_info,
        'token': token,
        'expires_at': (datetime.utcnow() + config.JWT_ACCESS_TOKEN_EXPIRES).isoformat()
    })

@app.route('/api/auth/register', methods=['POST'])
@require_db
@handle_exceptions
def register():
    data = request.get_json()
    username, email, password = data.get('username'), data.get('email'), data.get('password')
    role = data.get('role', 'user')
    
    if not all([username, email, password]):
        return create_response(error='Username, email, and password required', status=400)
    
    # Check if user exists
    if db_manager.users.find_one({'$or': [{'username': username}, {'email': email}]}):
        return create_response(error='User already exists', status=409)
    
    # Create user
    user_doc = {
        'username': username,
        'email': email,
        'password_hash': hash_password(password),
        'role': role,
        'permissions': ['read'] if role == 'user' else ['read', 'write', 'delete'],
        'created_at': datetime.now(),
        'updated_at': datetime.now(),
        'last_login': None,
        'status': 'active'
    }
    
    result = db_manager.users.insert_one(user_doc)
    if not result.inserted_id:
        return create_response(error='Registration failed', status=500)
    
    # Generate token and return user info
    token = generate_token(str(result.inserted_id), username, role)
    user_info = {
        'id': str(result.inserted_id),
        'username': username,
        'email': email,
        'role': role,
        'permissions': user_doc['permissions'],
        'created_at': user_doc['created_at'].isoformat(),
        'last_login': None
    }
    
    return create_response({
        'user': user_info,
        'token': token,
        'expires_at': (datetime.utcnow() + config.JWT_ACCESS_TOKEN_EXPIRES).isoformat()
    }, status=201)

@app.route('/api/auth/me', methods=['GET'])
@require_db
@require_auth
@handle_exceptions
def get_current_user():
    from bson import ObjectId
    
    try:
        # Convert string user_id to ObjectId for MongoDB query
        user_object_id = ObjectId(request.user['user_id'])
        user = db_manager.users.find_one({'_id': user_object_id})
    except Exception as e:
        logger.error(f"Error converting user_id to ObjectId: {e}")
        return create_response(error='Invalid user ID format', status=400)
    
    if not user:
        return create_response(error='User not found', status=404)
    
    user_info = {
        'id': str(user['_id']),
        'username': user['username'],
        'email': user['email'],
        'role': user['role'],
        'permissions': user['permissions'],
        'created_at': user['created_at'].isoformat(),
        'last_login': user.get('last_login', datetime.now()).isoformat()
    }
    return create_response(user_info)

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    return create_response({'message': 'Logged out successfully'})

# =============================================================================
# EMPLOYEE MANAGEMENT API
# =============================================================================

@app.route('/api/employees', methods=['GET'])
@require_db
@handle_exceptions
def get_employees():
    # Check for include_inactive parameter
    include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
    
    employees = db_manager.get_all_employees(include_inactive=include_inactive)
    return create_response(employees)

@app.route('/api/employees/<employee_id>', methods=['GET'])
@require_db
@handle_exceptions
def get_employee(employee_id):
    employee = db_manager.get_employee_by_id(employee_id)
    if not employee:
        return create_response(error='Employee not found', status=404)
    return create_response(employee)

@app.route('/api/employees', methods=['POST'])
@require_db
@handle_exceptions
def register_employee():
    try:
        data = request.get_json()
        
        if not data:
            return create_response(error='No data provided', status=400)
        
        # Validate required fields
        required_fields = ['employee_id', 'name', 'department', 'position', 'email']
        missing_fields = [field for field in required_fields if field not in data or not data[field]]
        
        if missing_fields:
            return create_response(error=f'Missing required fields: {", ".join(missing_fields)}', status=400)
        
        # Validate email format
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, data['email']):
            return create_response(error='Invalid email format', status=400)
        
        # Check if employee ID already exists
        existing_employee = db_manager.get_employee_by_id(data['employee_id'])
        if existing_employee:
            return create_response(error=f'Employee ID {data["employee_id"]} already exists', status=409)
        
        # Check if email already exists
        existing_email = db_manager.employees.find_one({'email': data['email'].lower()})
        if existing_email:
            return create_response(error=f'Email {data["email"]} already exists', status=409)
        
        # Process face image if provided
        face_image = None
        if 'face_image' in data and data['face_image']:
            try:
                # Handle both full data URLs and base64 data
                image_data_str = data['face_image']
                if ',' in image_data_str:
                    image_data_str = image_data_str.split(',')[1]  # Remove data URL prefix
                
                image_bytes = base64.b64decode(image_data_str)
                image_array = np.frombuffer(image_bytes, dtype=np.uint8)
                face_image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
                
                if face_image is None:
                    return create_response(error='Invalid image format', status=400)
                    
                # Keep image in BGR format for face encoding extraction
                # The extract_face_encoding function will handle the BGR to RGB conversion
                logger.info(f"Face image processed successfully for employee {data['employee_id']}: shape={face_image.shape}")
                
            except Exception as e:
                logger.error(f"Face image processing error: {e}")
                return create_response(error=f'Invalid face image: {str(e)}', status=400)
        
        # Clean and prepare employee data
        clean_data = {
            'employee_id': data['employee_id'].strip(),
            'name': data['name'].strip(),
            'department': data['department'].strip(),
            'position': data['position'].strip(),
            'email': data['email'].strip().lower(),
            'phone': data.get('phone', '').strip()
        }
        
        # Register employee in database
        success, message = db_manager.register_employee(clean_data, face_image)
        
        if not success:
            logger.error(f"Employee registration failed: {message}")
            return create_response(error=message, status=400)
        
        # Register with face recognition system if face image provided
        if face_image is not None and face_system:
            try:
                face_system.register_employee(clean_data['name'], clean_data['employee_id'], face_image)
                logger.info(f"Employee {clean_data['employee_id']} registered with face recognition system")
            except Exception as e:
                logger.warning(f"Face system registration failed: {e}")
                # Don't fail the whole registration if face system fails
        
        # Reload face encodings from database
        if face_system:
            try:
                face_system.load_employees_from_db()
                logger.info("Face recognition system reloaded with new employee data")
            except Exception as e:
                logger.warning(f"Failed to reload face recognition system: {e}")
        
        logger.info(f"Employee {clean_data['employee_id']} registered successfully")
        
        return create_response({
            'message': message, 
            'employee_id': clean_data['employee_id']
        }, status=201)
        
    except Exception as e:
        logger.error(f"Employee registration error: {e}")
        return create_response(error=f'Registration failed: {str(e)}', status=500)

@app.route('/api/employees/<employee_id>', methods=['PUT'])
@require_db
@handle_exceptions
def update_employee(employee_id):
    data = request.get_json()
    success = db_manager.update_employee(employee_id, data)
    
    if not success:
        return create_response(error='Employee not found or update failed', status=404)
    return create_response({'message': 'Employee updated successfully'})

@app.route('/api/employees/<employee_id>', methods=['DELETE'])
@require_db
@handle_exceptions
def delete_employee(employee_id):
    # Check for hard_delete parameter
    hard_delete = request.args.get('hard_delete', 'false').lower() == 'true'
    
    success = db_manager.delete_employee(employee_id, hard_delete=hard_delete)
    
    if not success:
        return create_response(error='Employee not found', status=404)
    
    action = "permanently deleted" if hard_delete else "deactivated"
    return create_response({'message': f'Employee {action} successfully', 'hard_delete': hard_delete})

@app.route('/api/employees/<employee_id>/reactivate', methods=['PUT'])
@require_db
@handle_exceptions
def reactivate_employee(employee_id):
    """Reactivate a deactivated employee"""
    success = db_manager.reactivate_employee(employee_id)
    
    if not success:
        return create_response(error='Employee not found or already active', status=404)
    
    return create_response({'message': 'Employee reactivated successfully'})

@app.route('/api/employees/face-encodings', methods=['GET'])
@require_db
@handle_exceptions
def get_face_encodings():
    """Get face encodings for all employees for frontend face recognition"""
    employees = db_manager.get_all_employees_with_encodings()
    
    # Filter only employees with face encodings
    face_data = []
    for emp in employees:
        if emp.get('face_encoding'):
            face_data.append({
                'employee_id': emp['employee_id'],
                'name': emp['name'],
                'face_encoding': emp['face_encoding']
            })
    
    logger.info(f"Returning {len(face_data)} employees with face encodings")
    return create_response(face_data)

@app.route('/api/debug/face-encodings', methods=['GET'])
@require_db
@handle_exceptions
def debug_face_encodings():
    """Debug endpoint to check face encodings in database"""
    employees = db_manager.get_all_employees_with_encodings()
    
    debug_info = []
    for emp in employees:
        debug_info.append({
            'employee_id': emp['employee_id'],
            'name': emp['name'],
            'has_face_encoding': 'face_encoding' in emp and emp['face_encoding'] is not None,
            'encoding_length': len(emp['face_encoding']) if emp.get('face_encoding') else 0,
            'has_face_image': 'face_image' in emp and emp['face_image'] is not None
        })
    
    return create_response(debug_info)

@app.route('/api/employees/<employee_id>/face-photo', methods=['POST'])
@require_db
@handle_exceptions
def update_employee_face_photo(employee_id):
    """Update employee's face photo and extract face encoding"""
    try:
        data = request.get_json()
        
        if not data or 'face_image' not in data:
            return create_response(error='Face image is required', status=400)
        
        # Check if employee exists
        employee = db_manager.get_employee_by_id(employee_id)
        if not employee:
            return create_response(error='Employee not found', status=404)
        
        # Process face image
        face_image = None
        try:
            # Handle both full data URLs and base64 data
            image_data_str = data['face_image']
            if ',' in image_data_str:
                image_data_str = image_data_str.split(',')[1]  # Remove data URL prefix
            
            image_bytes = base64.b64decode(image_data_str)
            image_array = np.frombuffer(image_bytes, dtype=np.uint8)
            face_image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
            
            if face_image is None:
                return create_response(error='Invalid image format', status=400)
                
            # Keep image in BGR format for face encoding extraction
            logger.info(f"Face image processed successfully for employee {employee_id}: shape={face_image.shape}")
            
        except Exception as e:
            logger.error(f"Face image processing error: {e}")
            return create_response(error=f'Invalid face image: {str(e)}', status=400)
        
        # Extract face encoding
        logger.info(f"Attempting to extract face encoding for employee {employee_id}")
        face_encoding = db_manager.extract_face_encoding(face_image)
        
        if face_encoding is None:
            return create_response(error='No face detected in image. Please use a clear photo with a visible face.', status=400)
        
        # Update employee with face data
        face_image_base64 = db_manager.encode_image_to_base64(face_image)
        update_data = {
            'face_encoding': face_encoding.tolist(),
            'face_image': face_image_base64,
            'updated_at': datetime.now()
        }
        
        # Update in database
        from pymongo import UpdateOne
        result = db_manager.employees.update_one(
            {'employee_id': employee_id},
            {'$set': update_data}
        )
        
        if result.modified_count == 0:
            return create_response(error='Failed to update employee face photo', status=500)
        
        # Reload face recognition system
        if face_system:
            try:
                face_system.load_employees_from_db()
                logger.info("Face recognition system reloaded with updated employee data")
            except Exception as e:
                logger.warning(f"Failed to reload face recognition system: {e}")
        
        logger.info(f"Face photo updated successfully for employee {employee_id}")
        
        return create_response({
            'message': 'Face photo updated successfully',
            'employee_id': employee_id,
            'face_encoding_length': len(face_encoding)
        })
        
    except Exception as e:
        logger.error(f"Error updating employee face photo: {e}")
        return create_response(error=f'Failed to update face photo: {str(e)}', status=500)

# =============================================================================
# ATTENDANCE & SAFETY API
# =============================================================================

@app.route('/api/attendance', methods=['GET'])
@require_db
@handle_exceptions
def get_attendance():
    params = {k: request.args.get(k) for k in ['start_date', 'end_date', 'employee_id']}
    attendance = db_manager.get_attendance_records(**params)
    return create_response(attendance)

@app.route('/api/attendance/stats', methods=['GET'])
@require_db
@handle_exceptions
def get_attendance_stats():
    params = {k: request.args.get(k) for k in ['start_date', 'end_date']}
    stats = db_manager.get_attendance_stats(**params)
    return create_response(stats)

@app.route('/api/attendance/mark', methods=['POST'])
@require_db
@handle_exceptions
def mark_attendance():
    """Mark attendance for real-time face recognition"""
    data = request.get_json()
    
    if not data or 'employee_id' not in data:
        return create_response(error='Employee ID is required', status=400)
    
    employee_id = data['employee_id']
    confidence = data.get('confidence', 1.0)
    timestamp = data.get('timestamp', datetime.now().isoformat())
    
    # Check if employee exists
    employee = db_manager.get_employee_by_id(employee_id)
    if not employee:
        return create_response(error='Employee not found', status=404)
    
    # Parse timestamp
    try:
        if isinstance(timestamp, str):
            timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
    except ValueError:
        timestamp = datetime.now()
    
    # Save attendance record
    try:
        logger.info(f"Attempting to save attendance for employee {employee_id} with confidence {confidence:.2f}")
        success = db_manager.save_attendance(employee_id, confidence, True)
        
        if success:
            logger.info(f"✅ Attendance marked successfully for employee {employee_id} with {confidence:.2f} confidence")
            return create_response({
                'message': 'Attendance marked successfully',
                'employee_id': employee_id,
                'timestamp': timestamp.isoformat(),
                'confidence': confidence
            })
        else:
            logger.error(f"❌ Failed to mark attendance for employee {employee_id} - save_attendance returned False")
            return create_response(error='Failed to mark attendance', status=500)
    except Exception as e:
        logger.error(f"❌ Exception in mark_attendance endpoint: {e}")
        return create_response(error=f'Error marking attendance: {str(e)}', status=500)

@app.route('/api/attendance/check-today', methods=['GET'])
@require_db
@handle_exceptions
def check_today_attendance():
    """Check if employee has attendance marked for today"""
    employee_id = request.args.get('employee_id')
    date = request.args.get('date')
    
    if not employee_id:
        return create_response(error='Employee ID is required', status=400)
    
    if not date:
        date = datetime.now().strftime('%Y-%m-%d')
    
    # Check if attendance exists for this employee today
    has_attendance = db_manager.check_attendance_today(employee_id, date)
    
    return create_response({
        'employee_id': employee_id,
        'date': date,
        'hasAttendance': has_attendance
    })

@app.route('/api/safety/events', methods=['GET'])
@require_db
@handle_exceptions
def get_safety_events():
    params = {k: request.args.get(k) for k in ['start_date', 'end_date', 'employee_id', 'event_type']}
    
    # Parse date parameters if provided
    if params.get('start_date'):
        try:
            params['start_date'] = datetime.fromisoformat(params['start_date'].replace('Z', '+00:00'))
        except ValueError:
            pass
    
    if params.get('end_date'):
        try:
            params['end_date'] = datetime.fromisoformat(params['end_date'].replace('Z', '+00:00'))
        except ValueError:
            pass
    
    # Remove None values
    params = {k: v for k, v in params.items() if v is not None}
    
    events = db_manager.get_safety_events(**params)
    return create_response(events)

@app.route('/api/safety/stats', methods=['GET'])
@require_db
@handle_exceptions
def get_safety_stats():
    params = {k: request.args.get(k) for k in ['start_date', 'end_date']}
    stats = db_manager.get_safety_stats(**params)
    return create_response(stats)

@app.route('/api/safety/analyze-frame', methods=['POST'])
@handle_exceptions
def analyze_safety_frame():
    """Analyze a frame for safety compliance using computer vision"""
    try:
        data = request.get_json()
        
        if not data or 'frame_data' not in data:
            return create_response(error='Frame data is required', status=400)
        
        # Extract frame data (base64 encoded image)
        frame_data_str = data['frame_data']
        if ',' in frame_data_str:
            frame_data_str = frame_data_str.split(',')[1]  # Remove data URL prefix
        
        # Decode image
        image_bytes = base64.b64decode(frame_data_str)
        image_array = np.frombuffer(image_bytes, dtype=np.uint8)
        frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        
        if frame is None:
            return create_response(error='Invalid image format', status=400)
        
        # Process frame with both face detection and safety monitoring
        if safety_monitor and face_system:
            # Get face detection results first
            face_results = face_system.recognize_faces(frame)
            
            # Pass face results to safety monitoring for coordinated detection
            safety_result = safety_monitor.process_frame(frame, face_results)
            
            # Add face detection info to the response
            safety_result['faces_detected'] = len(face_results)
            safety_result['recognized_employees'] = [f['name'] for f in face_results if f['employee_id'] != 'UNKNOWN']
            
            return create_response(safety_result)
        elif safety_monitor:
            # Fallback to safety monitoring only
            safety_result = safety_monitor.process_frame(frame)
            return create_response(safety_result)
        else:
            return create_response(error='Safety monitor not available', status=503)
            
    except Exception as e:
        logger.error(f"Error analyzing safety frame: {e}")
        return create_response(error=f'Safety analysis failed: {str(e)}', status=500)

# =============================================================================
# CAMERA CONTROL API
# =============================================================================

@app.route('/api/camera/start', methods=['POST'])
@handle_exceptions
def start_camera():
    if camera_state['is_running']:
        return create_response({'message': 'Camera already running'})
    
    camera = cv2.VideoCapture(0)
    if not camera.isOpened():
        return create_response(error='Cannot open camera', status=500)
    
    camera_state.update({
        'camera': camera,
        'is_running': True,
        'thread': threading.Thread(target=camera_monitoring_loop, daemon=True)
    })
    camera_state['thread'].start()
    
    logger.info("Camera started successfully")
    return create_response({'message': 'Camera started successfully'})

@app.route('/api/camera/stop', methods=['POST'])
@handle_exceptions
def stop_camera():
    if not camera_state['is_running']:
        return create_response({'message': 'Camera already stopped'})
    
    camera_state['is_running'] = False
    if camera_state['camera']:
        camera_state['camera'].release()
    
    logger.info("Camera stopped successfully")
    return create_response({'message': 'Camera stopped successfully'})

@app.route('/api/camera/status', methods=['GET'])
def camera_status():
    return create_response({
        'is_running': camera_state['is_running'],
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/camera/feed')
def video_feed():
    """Stream video feed with face detection overlays"""
    def generate_frames():
        while camera_state['is_running'] and camera_state['camera']:
            try:
                ret, frame = camera_state['camera'].read()
                if not ret:
                    break
                
                # Process frame for face detection and safety monitoring
                processed_frame = process_frame_with_overlays(frame)
                
                # Encode frame as JPEG
                ret, buffer = cv2.imencode('.jpg', processed_frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                if ret:
                    frame_bytes = buffer.tobytes()
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                
                time.sleep(0.033)  # ~30 FPS
                
            except Exception as e:
                logger.error(f"Error generating video frame: {e}")
                break
    
    return Response(generate_frames(), 
                   mimetype='multipart/x-mixed-replace; boundary=frame')

def process_frame_with_overlays(frame):
    """Process frame and add real face detection overlays"""
    try:
        # Make a copy of the frame
        display_frame = frame.copy()
        height, width = frame.shape[:2]
        
        # Get real face detection results
        face_results = face_system.recognize_faces(frame) if face_system else []
        safety_results = safety_monitor.process_frame(frame, face_results) if safety_monitor else {}
        
        # Draw face detection boxes and labels
        for result in face_results:
            x, y, w, h = result['bbox']
            confidence = result['confidence']
            name = result['name']
            
            # Choose color based on recognition confidence
            if confidence > 0.8:
                color = (0, 255, 0)  # Green for high confidence
            elif confidence > 0.5:
                color = (0, 255, 255)  # Yellow for medium confidence  
            else:
                color = (0, 0, 255)  # Red for low confidence/unknown
            
            # Draw bounding box
            cv2.rectangle(display_frame, (x, y), (x + w, y + h), color, 2)
            
            # Add name and confidence label
            label = f"{name} ({int(confidence * 100)}%)" if confidence > 0 else name
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
            
            # Draw label background
            cv2.rectangle(display_frame, (x, y - label_size[1] - 10), 
                         (x + label_size[0], y), color, -1)
            
            # Draw label text
            cv2.putText(display_frame, label, (x, y - 5), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            # Add attendance status if recognized
            if confidence > 0.5 and result['employee_id'] != "UNKNOWN":
                status_text = "Attendance: Checking..."
                cv2.putText(display_frame, status_text, (x, y + h + 20), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
        
        # Add safety status overlay
        safety_status = safety_results.get('safety_status', 'unknown')
        safety_color = (0, 255, 0) if safety_status == 'compliant' else (0, 0, 255)
        safety_text = f"Safety: {safety_status.title()}"
        cv2.putText(display_frame, safety_text, (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, safety_color, 2)
        
        # Add violations if any
        violations = safety_results.get('violations', [])
        if violations:
            for i, violation in enumerate(violations):
                cv2.putText(display_frame, f"• {violation}", (10, 60 + i * 25), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
        
        # Add face count
        face_count_text = f"Faces Detected: {len(face_results)}"
        cv2.putText(display_frame, face_count_text, (width - 200, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        # Add timestamp
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(display_frame, timestamp, (10, height - 20), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        # Add system status
        status_text = f"Recognition: {'Active' if face_system else 'Inactive'}"
        cv2.putText(display_frame, status_text, (width - 200, height - 20), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        
        return display_frame
        
    except Exception as e:
        logger.error(f"Error processing frame with overlays: {e}")
        return frame

# =============================================================================
# DASHBOARD API
# =============================================================================

@app.route('/api/dashboard/stats', methods=['GET'])
@require_db
@handle_exceptions
def get_dashboard_stats():
    stats = db_manager.get_dashboard_stats()
    return create_response(stats)

@app.route('/api/dashboard/recent-alerts', methods=['GET'])
@require_db
@handle_exceptions
def get_recent_alerts():
    alerts = db_manager.get_recent_alerts(limit=10)
    return create_response(alerts)

# =============================================================================
# CAMERA MONITORING
# =============================================================================

def camera_monitoring_loop():
    """Main camera monitoring loop with error handling"""
    while camera_state['is_running']:
        try:
            camera = camera_state['camera']
            if not camera:
                break
                
            ret, frame = camera.read()
            if not ret:
                break
            
            # Process frame
            results = process_frame_for_monitoring(frame)
            if results:
                # Emit via WebSocket
                socketio.emit('face_detection', results)
                
                # Save to database
                save_monitoring_results(results)
            
            time.sleep(0.1)  # 10 FPS
            
        except Exception as e:
            logger.error(f"Camera monitoring error: {e}")
            break
    
    # Cleanup
    cleanup_camera()

def process_frame_for_monitoring(frame):
    """Process frame for face recognition and safety monitoring"""
    try:
        # Get face detection results first
        faces = face_system.recognize_faces(frame) if face_system else []
        
        # Pass face results to safety monitoring for coordinated detection
        safety = safety_monitor.process_frame(frame, faces) if safety_monitor else {}
        
        results = {
            'timestamp': datetime.now().isoformat(),
            'faces': faces,
            'safety': safety
        }
        return results
    except Exception as e:
        logger.error(f"Frame processing error: {e}")
        return None

def save_monitoring_results(results):
    """Save monitoring results to database"""
    if not db_manager:
        return
    
    try:
        # Save attendance records
        if results.get('faces'):
            for face in results['faces']:
                if face['employee_id'] != 'UNKNOWN':
                    db_manager.save_attendance(
                        face['employee_id'],
                        face.get('confidence', 0.8),
                        True
                    )
        
        # Save safety events - improved to save all events, not just violations
        if results.get('safety'):
            safety_data = results['safety']
            employee_id = 'SYSTEM'  # Default for system-wide safety monitoring
            
            # If we have face detection, use the first recognized employee
            if results.get('faces'):
                recognized_faces = [f for f in results['faces'] if f['employee_id'] != 'UNKNOWN']
                if recognized_faces:
                    employee_id = recognized_faces[0]['employee_id']
            
            # Save safety event to database
            db_manager.save_safety_event(
                employee_id,
                safety_data.get('safety_status', 'unknown'),
                safety_data.get('violations', [])
            )
            
            logger.info(f"Saved safety event: {employee_id} - {safety_data.get('safety_status')} - {safety_data.get('violations', [])}")
            
    except Exception as e:
        logger.error(f"Database save error: {e}")

def cleanup_camera():
    """Clean up camera resources"""
    if camera_state['camera']:
        camera_state['camera'].release()
    camera_state.update({'camera': None, 'is_running': False, 'thread': None})
    logger.info("Camera monitoring stopped")

# =============================================================================
# WEBSOCKET EVENTS
# =============================================================================

@socketio.on('connect')
def handle_connect():
    logger.info('Client connected')
    emit('connected', {'data': 'Connected to monitoring system'})

@socketio.on('disconnect')
def handle_disconnect():
    logger.info('Client disconnected')

# =============================================================================
# APPLICATION STARTUP
# =============================================================================

if __name__ == '__main__':
    logger.info("🚀 Starting Workforce Monitoring System...")
    logger.info("📊 Dashboard: http://localhost:5001")
    logger.info("🔧 API: http://localhost:5001/api")
    logger.info("🔐 Default admin credentials: admin/admin123")
    
    try:
        # Use configured host and port from environment variables
        socketio.run(app, host=config.HOST, port=config.PORT, debug=config.DEBUG)
    except KeyboardInterrupt:
        logger.info("\n👋 Shutting down gracefully...")
        cleanup_camera()
        if db_manager:
            db_manager.close_connection()
        sys.exit(0) 