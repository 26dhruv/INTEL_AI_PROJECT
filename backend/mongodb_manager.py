#!/usr/bin/env python3
"""
MongoDB Manager for Workforce Monitoring System
Handles all database operations including employees, attendance, safety events, users, and alerts.
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from pymongo import MongoClient, IndexModel, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, DuplicateKeyError, PyMongoError
from bson import ObjectId
import bcrypt

logger = logging.getLogger(__name__)

class MongoDBManager:
    """
    Comprehensive MongoDB manager for workforce monitoring system.
    Handles connections, CRUD operations, and database management.
    """
    
    def __init__(self, config):
        """
        Initialize MongoDB manager with configuration.
        
        Args:
            config: Configuration object containing database settings
        """
        self.config = config
        self.client = None
        self.db = None
        self.collections = {}
        
        # Initialize connection
        self.connect()
        
        # Set up collections
        self.setup_collections()
        
        # Create indexes
        self.create_indexes()
        
        # Setup default data
        self.setup_default_data()
    
    def connect(self):
        """Establish connection to MongoDB with enhanced error handling and retry logic"""
        max_retries = 3
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                # Enhanced connection options for Render deployment
                connection_options = {
                    'serverSelectionTimeoutMS': 30000,  # Increased timeout
                    'connectTimeoutMS': 30000,          # Increased timeout
                    'socketTimeoutMS': 30000,           # Socket timeout
                    'maxPoolSize': 10,                  # Reduced pool size for Render
                    'minPoolSize': 1,                   # Minimal pool size
                    'maxIdleTimeMS': 60000,             # Increased idle time
                    'waitQueueTimeoutMS': 10000,        # Queue timeout
                    'retryWrites': True,
                    'retryReads': True,
                    'directConnection': False,          # Allow connection pooling
                    'appName': 'WorkforceMonitoring',   # Application name for monitoring
                }
                
                # Add DNS resolution options for Render
                if os.getenv('FLASK_ENV') == 'production':
                    connection_options.update({
                        'serverSelectionTimeoutMS': 60000,  # Even longer timeout for production
                        'connectTimeoutMS': 60000,
                        'socketTimeoutMS': 60000,
                    })
                
                # Use enhanced URI for better connection reliability
                mongo_uri = getattr(self.config, 'get_enhanced_mongo_uri', lambda: self.config.MONGO_URI)()
                self.client = MongoClient(mongo_uri, **connection_options)
                
                # Test connection with longer timeout
                self.client.admin.command('ping', serverSelectionTimeoutMS=30000)
                
                # Get database
                self.db = self.client[self.config.DATABASE_NAME]
                
                logger.info(f"✅ Connected to MongoDB: {self.config.DATABASE_NAME}")
                return  # Success, exit retry loop
                
            except ConnectionFailure as e:
                logger.warning(f"⚠️ MongoDB connection attempt {attempt + 1}/{max_retries} failed: {e}")
                if attempt < max_retries - 1:
                    logger.info(f"🔄 Retrying in {retry_delay} seconds...")
                    import time
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    logger.error(f"❌ MongoDB connection failed after {max_retries} attempts")
                    raise
            except Exception as e:
                logger.error(f"❌ Database setup error: {e}")
                if attempt < max_retries - 1:
                    logger.info(f"🔄 Retrying in {retry_delay} seconds...")
                    import time
                    time.sleep(retry_delay)
                    retry_delay *= 2
                else:
                    raise
    
    def setup_collections(self):
        """Setup database collections"""
        collection_names = [
            'EMPLOYEES_COLLECTION',
            'ATTENDANCE_COLLECTION', 
            'SAFETY_EVENTS_COLLECTION',
            'USERS_COLLECTION',
            'ALERTS_COLLECTION'
        ]
        
        for collection_name in collection_names:
            collection_key = getattr(self.config, collection_name)
            self.collections[collection_key] = self.db[collection_key]
        
        # Create convenient property access
        self.employees = self.collections[self.config.EMPLOYEES_COLLECTION]
        self.attendance = self.collections[self.config.ATTENDANCE_COLLECTION]
        self.safety_events = self.collections[self.config.SAFETY_EVENTS_COLLECTION]
        self.users = self.collections[self.config.USERS_COLLECTION]
        self.alerts = self.collections[self.config.ALERTS_COLLECTION]
        
        logger.info(f"✅ Collections setup complete")
    
    def create_indexes(self):
        """Create necessary database indexes for optimal performance"""
        try:
            # Employee indexes
            self.employees.create_indexes([
                IndexModel([("employee_id", ASCENDING)], unique=True),
                IndexModel([("email", ASCENDING)], unique=True),
                IndexModel([("name", ASCENDING)]),
                IndexModel([("department", ASCENDING)]),
                IndexModel([("status", ASCENDING)]),
                IndexModel([("created_at", DESCENDING)])
            ])
            
            # Attendance indexes
            self.attendance.create_indexes([
                IndexModel([("employee_id", ASCENDING)]),
                IndexModel([("date", DESCENDING)]),
                IndexModel([("employee_id", ASCENDING), ("date", DESCENDING)]),
                IndexModel([("check_in_time", DESCENDING)]),
                IndexModel([("check_out_time", DESCENDING)])
            ])
            
            # Safety events indexes
            self.safety_events.create_indexes([
                IndexModel([("employee_id", ASCENDING)]),
                IndexModel([("timestamp", DESCENDING)]),
                IndexModel([("event_type", ASCENDING)]),
                IndexModel([("safety_status", ASCENDING)]),
                IndexModel([("employee_id", ASCENDING), ("timestamp", DESCENDING)])
            ])
            
            # User indexes
            self.users.create_indexes([
                IndexModel([("username", ASCENDING)], unique=True),
                IndexModel([("email", ASCENDING)], unique=True),
                IndexModel([("role", ASCENDING)]),
                IndexModel([("status", ASCENDING)]),
                IndexModel([("created_at", DESCENDING)])
            ])
            
            # Alert indexes
            self.alerts.create_indexes([
                IndexModel([("employee_id", ASCENDING)]),
                IndexModel([("created_at", DESCENDING)]),
                IndexModel([("status", ASCENDING)]),
                IndexModel([("type", ASCENDING)]),
                IndexModel([("priority", ASCENDING)])
            ])
            
            logger.info("✅ Database indexes created successfully")
            
        except Exception as e:
            logger.error(f"❌ Error creating indexes: {e}")
    
    def setup_default_data(self):
        """Setup default admin user and any required data"""
        try:
            # Check if admin user exists
            admin_user = self.users.find_one({
                'username': self.config.DEFAULT_ADMIN_USERNAME
            })
            
            if not admin_user:
                # Create default admin user
                admin_doc = {
                    'username': self.config.DEFAULT_ADMIN_USERNAME,
                    'email': self.config.DEFAULT_ADMIN_EMAIL,
                    'password_hash': bcrypt.hashpw(
                        self.config.DEFAULT_ADMIN_PASSWORD.encode('utf-8'),
                        bcrypt.gensalt()
                    ),
                    'role': 'admin',
                    'permissions': ['read', 'write', 'delete', 'admin'],
                    'created_at': datetime.now(),
                    'updated_at': datetime.now(),
                    'last_login': None,
                    'status': 'active'
                }
                
                self.users.insert_one(admin_doc)
                logger.info(f"✅ Default admin user created: {self.config.DEFAULT_ADMIN_USERNAME}")
            
        except Exception as e:
            logger.error(f"❌ Error setting up default data: {e}")
    
    def health_check(self) -> Dict[str, Any]:
        """Check database health and return status"""
        try:
            # Test connection
            self.client.admin.command('ping')
            
            # Get database stats
            stats = self.db.command('dbStats')
            
            # Count documents in main collections
            counts = {
                'employees': self.employees.count_documents({}),
                'attendance': self.attendance.count_documents({}),
                'safety_events': self.safety_events.count_documents({}),
                'users': self.users.count_documents({}),
                'alerts': self.alerts.count_documents({})
            }
            
            return {
                'status': 'healthy',
                'database': self.config.DATABASE_NAME,
                'collections': counts,
                'database_size': stats.get('dataSize', 0),
                'indexes': stats.get('indexes', 0),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    # =============================================================================
    # EMPLOYEE OPERATIONS
    # =============================================================================
    
    def get_all_employees(self, include_inactive: bool = False) -> List[Dict]:
        """Get all employees, optionally including inactive ones"""
        try:
            query = {} if include_inactive else {'status': 'active'}
            employees = list(self.employees.find(query, {'password_hash': 0}))
            for emp in employees:
                emp['_id'] = str(emp['_id'])
            return employees
        except Exception as e:
            logger.error(f"Error fetching employees: {e}")
            return []
    
    def get_all_employees_with_encodings(self) -> List[Dict]:
        """Get all employees including face encodings"""
        try:
            employees = list(self.employees.find({
                'face_encoding': {'$exists': True, '$ne': None}
            }))
            for emp in employees:
                emp['_id'] = str(emp['_id'])
            return employees
        except Exception as e:
            logger.error(f"Error fetching employees with encodings: {e}")
            return []
    
    def get_employee_by_id(self, employee_id: str) -> Optional[Dict]:
        """Get employee by ID"""
        try:
            employee = self.employees.find_one({'employee_id': employee_id})
            if employee:
                employee['_id'] = str(employee['_id'])
                employee.pop('password_hash', None)
            return employee
        except Exception as e:
            logger.error(f"Error fetching employee {employee_id}: {e}")
            return None
    
    def create_employee(self, employee_data: Dict) -> bool:
        """Create new employee"""
        try:
            # Add metadata
            employee_data['created_at'] = datetime.now()
            employee_data['updated_at'] = datetime.now()
            employee_data['status'] = employee_data.get('status', 'active')
            
            result = self.employees.insert_one(employee_data)
            logger.info(f"✅ Employee created: {employee_data.get('employee_id')}")
            return bool(result.inserted_id)
            
        except DuplicateKeyError:
            logger.error(f"Employee with ID {employee_data.get('employee_id')} already exists")
            return False
        except Exception as e:
            logger.error(f"Error creating employee: {e}")
            return False
    
    def update_employee(self, employee_id: str, update_data: Dict) -> bool:
        """Update employee information"""
        try:
            update_data['updated_at'] = datetime.now()
            
            result = self.employees.update_one(
                {'employee_id': employee_id},
                {'$set': update_data}
            )
            
            if result.modified_count > 0:
                logger.info(f"✅ Employee updated: {employee_id}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Error updating employee {employee_id}: {e}")
            return False
    
    def delete_employee(self, employee_id: str, hard_delete: bool = False) -> bool:
        """Delete employee - either hard delete (remove from DB) or soft delete (deactivate)"""
        try:
            if hard_delete:
                # Hard delete: Actually remove from database
                result = self.employees.delete_one({'employee_id': employee_id})
                
                if result.deleted_count > 0:
                    logger.info(f"✅ Employee permanently deleted: {employee_id}")
                    
                    # Also remove related data
                    self.attendance.delete_many({'employee_id': employee_id})
                    self.safety_events.delete_many({'employee_id': employee_id})
                    self.alerts.delete_many({'employee_id': employee_id})
                    
                    logger.info(f"✅ Related data deleted for employee: {employee_id}")
                    return True
                return False
            else:
                # Soft delete: Set status to inactive
                result = self.employees.update_one(
                    {'employee_id': employee_id},
                    {
                        '$set': {
                            'status': 'inactive',
                            'updated_at': datetime.now(),
                            'deactivated_at': datetime.now()
                        }
                    }
                )
                
                if result.modified_count > 0:
                    logger.info(f"✅ Employee deactivated: {employee_id}")
                    return True
                return False
            
        except Exception as e:
            action = "permanently deleting" if hard_delete else "deactivating"
            logger.error(f"Error {action} employee {employee_id}: {e}")
            return False
    
    def deactivate_employee(self, employee_id: str) -> bool:
        """Deactivate employee (soft delete by setting status to inactive)"""
        return self.delete_employee(employee_id, hard_delete=False)
    
    def reactivate_employee(self, employee_id: str) -> bool:
        """Reactivate a deactivated employee"""
        try:
            result = self.employees.update_one(
                {'employee_id': employee_id, 'status': 'inactive'},
                {
                    '$set': {
                        'status': 'active',
                        'updated_at': datetime.now()
                    },
                    '$unset': {
                        'deactivated_at': 1
                    }
                }
            )
            
            if result.modified_count > 0:
                logger.info(f"✅ Employee reactivated: {employee_id}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Error reactivating employee {employee_id}: {e}")
            return False
    
    def update_employee_face_encoding(self, employee_id: str, face_encoding: List[float]) -> bool:
        """Update employee face encoding"""
        try:
            result = self.employees.update_one(
                {'employee_id': employee_id},
                {
                    '$set': {
                        'face_encoding': face_encoding,
                        'face_encoding_updated_at': datetime.now(),
                        'updated_at': datetime.now()
                    }
                }
            )
            
            if result.modified_count > 0:
                logger.info(f"✅ Face encoding updated for employee: {employee_id}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Error updating face encoding for {employee_id}: {e}")
            return False
    
    def register_employee(self, employee_data: Dict, face_image=None) -> tuple[bool, str]:
        """Register a new employee with optional face image"""
        try:
            # Extract face encoding from image if provided
            face_encoding = None
            if face_image is not None:
                try:
                    # Lazy import to avoid memory issues
                    try:
                        import face_recognition
                        import cv2
                        import numpy as np
                    except ImportError:
                        logger.warning("face_recognition library not available, skipping face encoding")
                        return True, f"Employee {employee_data['employee_id']} registered successfully (without face recognition)"
                    
                    # Ensure image is in the correct format
                    if face_image.dtype != np.uint8:
                        face_image = face_image.astype(np.uint8)
                    
                    # Convert BGR to RGB for face_recognition library
                    rgb_image = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
                    
                    # Ensure the image is contiguous
                    if not rgb_image.flags.c_contiguous:
                        rgb_image = np.ascontiguousarray(rgb_image)
                    
                    # Find face locations using different model if needed
                    face_locations = None
                    for model in ['hog', 'cnn']:
                        try:
                            face_locations = face_recognition.face_locations(rgb_image, model=model)
                            if face_locations:
                                logger.info(f"Face detected using {model} model")
                                break
                        except Exception as model_error:
                            logger.warning(f"Failed to detect face with {model} model: {model_error}")
                            continue
                    
                    if not face_locations:
                        return False, "No face found in the provided image"
                    
                    if len(face_locations) > 1:
                        logger.warning("Multiple faces found, using the first one")
                    
                    # Get face encoding with reduced jitters to avoid compatibility issues
                    try:
                        face_encodings = face_recognition.face_encodings(
                            rgb_image, 
                            face_locations,
                            num_jitters=0  # Reduce jitters to avoid dlib compatibility issues
                        )
                        if face_encodings:
                            face_encoding = face_encodings[0].tolist()
                            logger.info(f"Face encoding extracted for {employee_data['employee_id']}")
                        else:
                            logger.warning(f"Could not extract face encoding for {employee_data['employee_id']}")
                    except Exception as encoding_error:
                        logger.error(f"Face encoding extraction failed: {encoding_error}")
                        # Try alternative approach with single face
                        try:
                            # Use the simpler face_encodings method without known_face_locations
                            face_encodings = face_recognition.face_encodings(rgb_image)
                            if face_encodings:
                                face_encoding = face_encodings[0].tolist()
                                logger.info(f"Face encoding extracted using fallback method for {employee_data['employee_id']}")
                            else:
                                logger.warning(f"Fallback face encoding also failed for {employee_data['employee_id']}")
                        except Exception as fallback_error:
                            logger.error(f"Fallback face encoding failed: {fallback_error}")
                            return False, f"Face encoding extraction failed: {str(fallback_error)}"
                        
                except Exception as e:
                    logger.error(f"Error processing face image: {e}")
                    return False, f"Face processing error: {str(e)}"
            
            # Prepare employee document
            employee_doc = {
                **employee_data,
                'face_encoding': face_encoding,
                'face_encoding_updated_at': datetime.now() if face_encoding else None,
                'created_at': datetime.now(),
                'updated_at': datetime.now(),
                'status': 'active'
            }
            
            # Create employee
            success = self.create_employee(employee_doc)
            
            if success:
                message = f"Employee {employee_data['employee_id']} registered successfully"
                if face_encoding:
                    message += " with face recognition"
                logger.info(f"✅ {message}")
                return True, message
            else:
                return False, "Failed to save employee to database"
                
        except Exception as e:
            error_msg = f"Employee registration failed: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
    
    # =============================================================================
    # ATTENDANCE OPERATIONS
    # =============================================================================
    
    def get_attendance_records(self, start_date: Optional[datetime] = None, 
                             end_date: Optional[datetime] = None,
                             employee_id: Optional[str] = None) -> List[Dict]:
        """Get attendance records with optional filtering"""
        try:
            query = {}
            
            if employee_id:
                query['employee_id'] = employee_id
            
            if start_date or end_date:
                date_query = {}
                if start_date:
                    date_query['$gte'] = start_date
                if end_date:
                    date_query['$lte'] = end_date
                query['date'] = date_query
            
            records = list(self.attendance.find(query).sort('date', -1))
            for record in records:
                record['_id'] = str(record['_id'])
            
            return records
            
        except Exception as e:
            logger.error(f"Error fetching attendance records: {e}")
            return []
    
    def save_attendance(self, employee_id: str, confidence: float = 0.8, 
                       is_face_recognition: bool = True) -> bool:
        """Save attendance record"""
        try:
            current_time = datetime.now()
            today_start = datetime.combine(current_time.date(), datetime.min.time())
            today_end = datetime.combine(current_time.date(), datetime.max.time())
            
            # Check if employee already has attendance for today
            existing = self.attendance.find_one({
                'employee_id': employee_id,
                'timestamp': {'$gte': today_start, '$lte': today_end}
            })
            
            if existing:
                # Update existing record with check-out time
                result = self.attendance.update_one(
                    {'employee_id': employee_id, 'timestamp': {'$gte': today_start, '$lte': today_end}},
                    {
                        '$set': {
                            'check_out_time': current_time,
                            'confidence': max(existing.get('confidence', 0), confidence),  # Keep highest confidence
                            'detection_method': 'face_recognition' if is_face_recognition else 'manual',
                            'updated_at': current_time
                        }
                    }
                )
                success = result.modified_count > 0
                action = "updated"
            else:
                # Create new record with check-in time
                attendance_doc = {
                    'employee_id': employee_id,
                    'check_in_time': current_time,
                    'check_out_time': None,
                    'confidence': confidence,
                    'detection_method': 'face_recognition' if is_face_recognition else 'manual',
                    'timestamp': current_time,  # Primary timestamp field for queries
                    'created_at': current_time,
                    'updated_at': current_time
                }
                
                result = self.attendance.insert_one(attendance_doc)
                success = result.inserted_id is not None
                action = "created"
            
            if success:
                logger.info(f"✅ Attendance {action} for employee: {employee_id} (confidence: {confidence:.2f})")
                return True
            else:
                logger.error(f"❌ Failed to save attendance for employee: {employee_id}")
                return False
            
        except Exception as e:
            logger.error(f"❌ Error saving attendance for {employee_id}: {e}")
            return False
    
    def get_attendance_stats(self, start_date: Optional[str] = None, end_date: Optional[str] = None, 
                            date: Optional[datetime] = None) -> Dict:
        """Get attendance statistics for a date range or specific date"""
        try:
            # Handle date range parameters
            if start_date or end_date:
                # Parse string dates if provided
                if start_date:
                    start_datetime = datetime.fromisoformat(start_date.replace('Z', '+00:00')) if 'T' in start_date else datetime.strptime(start_date, '%Y-%m-%d')
                else:
                    start_datetime = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                
                if end_date:
                    end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00')) if 'T' in end_date else datetime.strptime(end_date, '%Y-%m-%d')
                else:
                    end_datetime = datetime.now()
            else:
                # Use single date or default to today
                target_date = date.date() if date else datetime.now().date()
                start_datetime = datetime.combine(target_date, datetime.min.time())
                end_datetime = datetime.combine(target_date, datetime.max.time())
            
            # Total employees
            total_employees = self.employees.count_documents({'status': 'active'})
            
            # Present in date range
            present_count = self.attendance.count_documents({
                'timestamp': {'$gte': start_datetime, '$lte': end_datetime},
                'check_in_time': {'$exists': True}
            })
            
            # Get attendance records for the date range
            records = self.get_attendance_records(start_date=start_datetime, end_date=end_datetime)
            
            # Generate daily stats if date range is provided
            daily_stats = []
            if start_date or end_date:
                # Generate daily breakdown for the date range
                current_date = start_datetime.date()
                end_date_only = end_datetime.date()
                
                while current_date <= end_date_only:
                    day_start = datetime.combine(current_date, datetime.min.time())
                    day_end = datetime.combine(current_date, datetime.max.time())
                    
                    # Count attendance for this specific day
                    daily_count = self.attendance.count_documents({
                        'timestamp': {'$gte': day_start, '$lte': day_end},
                        'check_in_time': {'$exists': True}
                    })
                    
                    daily_stats.append({
                        'date': current_date.isoformat(),
                        'count': daily_count,
                        'present': daily_count,
                        'absent': max(0, total_employees - daily_count),
                        'attendance_rate': (daily_count / total_employees * 100) if total_employees > 0 else 0
                    })
                    
                    current_date += timedelta(days=1)
            
            result = {
                'total_employees': total_employees,
                'present_today': present_count,
                'absent_today': total_employees - present_count,
                'attendance_rate': (present_count / total_employees * 100) if total_employees > 0 else 0,
                'records': records
            }
            
            # Add daily stats if we have them
            if daily_stats:
                result['daily_stats'] = daily_stats
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting attendance stats: {e}")
            return {
                'total_employees': 0,
                'present_today': 0,
                'absent_today': 0,
                'attendance_rate': 0,
                'records': []
            }
    
    def check_attendance_today(self, employee_id: str, date: str = None) -> bool:
        """Check if employee has attendance marked for a specific date"""
        try:
            # Parse the date string
            if date:
                # Handle different date formats
                if 'T' in date:
                    # ISO format with time
                    target_date = datetime.fromisoformat(date.replace('Z', '+00:00')).date()
                else:
                    # Simple date format YYYY-MM-DD
                    target_date = datetime.strptime(date, '%Y-%m-%d').date()
            else:
                # Default to today
                target_date = datetime.now().date()
            
            # Check if attendance record exists for this employee on this date
            attendance_record = self.attendance.find_one({
                'employee_id': employee_id,
                'date': target_date
            })
            
            has_attendance = attendance_record is not None
            
            logger.info(f"Attendance check for {employee_id} on {target_date}: {has_attendance}")
            return has_attendance
            
        except Exception as e:
            logger.error(f"Error checking attendance for {employee_id} on {date}: {e}")
            return False
    
    # =============================================================================
    # SAFETY OPERATIONS
    # =============================================================================
    
    def save_safety_event(self, employee_id: str, safety_status: str, 
                         violations: List[str], additional_data: Dict = None) -> bool:
        """Save safety monitoring event"""
        try:
            event_doc = {
                'employee_id': employee_id,
                'safety_status': safety_status,
                'violations': violations,
                'violation_count': len(violations),
                'timestamp': datetime.now(),
                'event_type': 'safety_monitoring',
                'additional_data': additional_data or {}
            }
            
            result = self.safety_events.insert_one(event_doc)
            
            # Create alert for violations
            if violations:
                self.create_alert(
                    employee_id,
                    'safety_violation',
                    f"Safety violations detected: {', '.join(violations)}",
                    'high'
                )
            
            logger.info(f"✅ Safety event saved for employee: {employee_id}")
            return bool(result.inserted_id)
            
        except Exception as e:
            logger.error(f"Error saving safety event: {e}")
            return False
    
    def get_safety_events(self, start_date: Optional[datetime] = None,
                         end_date: Optional[datetime] = None,
                         employee_id: Optional[str] = None,
                         event_type: Optional[str] = None) -> List[Dict]:
        """Get safety events with optional filtering"""
        try:
            query = {}
            
            if employee_id:
                query['employee_id'] = employee_id
            
            if event_type:
                query['event_type'] = event_type
            
            if start_date or end_date:
                date_query = {}
                if start_date:
                    date_query['$gte'] = start_date
                if end_date:
                    date_query['$lte'] = end_date
                query['timestamp'] = date_query
            
            events = list(self.safety_events.find(query).sort('timestamp', -1))
            for event in events:
                event['_id'] = str(event['_id'])
            
            return events
            
        except Exception as e:
            logger.error(f"Error fetching safety events: {e}")
            return []
    
    def get_safety_stats(self, start_date: Optional[str] = None, end_date: Optional[str] = None, 
                        date: Optional[datetime] = None) -> Dict:
        """Get safety statistics for a date range or specific date"""
        try:
            # Handle date range parameters
            if start_date or end_date:
                # Parse string dates if provided
                if start_date:
                    start_datetime = datetime.fromisoformat(start_date.replace('Z', '+00:00')) if 'T' in start_date else datetime.strptime(start_date, '%Y-%m-%d')
                else:
                    start_datetime = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                
                if end_date:
                    end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00')) if 'T' in end_date else datetime.strptime(end_date, '%Y-%m-%d')
                else:
                    end_datetime = datetime.now()
            else:
                # Use single date or default to today
                target_date = date.date() if date else datetime.now().date()
                start_datetime = datetime.combine(target_date, datetime.min.time())
                end_datetime = datetime.combine(target_date, datetime.max.time())
            
            # Total events in range
            total_events = self.safety_events.count_documents({
                'timestamp': {'$gte': start_datetime, '$lte': end_datetime}
            })
            
            # Violations in range
            violations_today = self.safety_events.count_documents({
                'timestamp': {'$gte': start_datetime, '$lte': end_datetime},
                'violation_count': {'$gt': 0}
            })
            
            # Compliance rate
            compliance_rate = ((total_events - violations_today) / total_events * 100) if total_events > 0 else 100
            
            return {
                'total_events': total_events,
                'violations_today': violations_today,
                'compliance_rate': compliance_rate,
                'safe_events': total_events - violations_today,
                'date_range': {
                    'start': start_datetime.isoformat(),
                    'end': end_datetime.isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting safety stats: {e}")
            return {
                'total_events': 0,
                'violations_today': 0,
                'compliance_rate': 100,
                'safe_events': 0,
                'date_range': {
                    'start': datetime.now().isoformat(),
                    'end': datetime.now().isoformat()
                }
            }
    
    def get_dashboard_stats(self) -> Dict:
        """Get comprehensive dashboard statistics"""
        try:
            today = datetime.now().date()
            start_of_day = datetime.combine(today, datetime.min.time())
            end_of_day = datetime.combine(today, datetime.max.time())
            
            # Employee statistics
            total_employees = self.employees.count_documents({'status': 'active'})
            employees_present_today = self.attendance.count_documents({
                'date': today,
                'check_in_time': {'$exists': True}
            })
            
            # Safety statistics
            safety_stats = self.get_safety_stats()
            safety_compliance_rate = safety_stats.get('compliance_rate', 100)
            
            # Recent activity (last 7 days)
            week_ago = datetime.now() - timedelta(days=7)
            recent_attendance = self.attendance.count_documents({
                'date': {'$gte': week_ago.date()}
            })
            
            recent_violations = self.safety_events.count_documents({
                'timestamp': {'$gte': week_ago},
                'violation_count': {'$gt': 0}
            })
            
            # System health
            system_status = {
                'mongodb': True,  # If we're here, MongoDB is working
                'face_recognition': True,  # Assume working unless we can check
                'safety_monitoring': True,  # Assume working unless we can check
                'camera': False  # Camera is typically off by default
            }
            
            # Active monitoring status
            active_monitoring = recent_attendance > 0 or recent_violations > 0
            
            return {
                'total_employees': total_employees,
                'employees_present_today': employees_present_today,
                'safety_compliance_rate': safety_compliance_rate,
                'active_monitoring': active_monitoring,
                'recent_attendance': recent_attendance,
                'recent_violations': recent_violations,
                'system_status': system_status,
                'last_updated': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting dashboard stats: {e}")
            return {
                'total_employees': 0,
                'employees_present_today': 0,
                'safety_compliance_rate': 100,
                'active_monitoring': False,
                'recent_attendance': 0,
                'recent_violations': 0,
                'system_status': {
                    'mongodb': False,
                    'face_recognition': False,
                    'safety_monitoring': False,
                    'camera': False
                },
                'last_updated': datetime.now().isoformat()
            }
    
    # =============================================================================
    # ALERT OPERATIONS
    # =============================================================================
    
    def create_alert(self, employee_id: str, alert_type: str, 
                    message: str, priority: str = 'medium') -> bool:
        """Create new alert"""
        try:
            alert_doc = {
                'employee_id': employee_id,
                'type': alert_type,
                'message': message,
                'priority': priority,
                'status': 'active',
                'created_at': datetime.now(),
                'updated_at': datetime.now(),
                'acknowledged': False,
                'acknowledged_by': None,
                'acknowledged_at': None
            }
            
            result = self.alerts.insert_one(alert_doc)
            logger.info(f"✅ Alert created for employee: {employee_id}")
            return bool(result.inserted_id)
            
        except Exception as e:
            logger.error(f"Error creating alert: {e}")
            return False
    
    def get_recent_alerts(self, limit: int = 10) -> List[Dict]:
        """Get recent alerts"""
        try:
            alerts = list(self.alerts.find().sort('created_at', -1).limit(limit))
            for alert in alerts:
                alert['_id'] = str(alert['_id'])
            return alerts
            
        except Exception as e:
            logger.error(f"Error fetching recent alerts: {e}")
            return []
    
    def acknowledge_alert(self, alert_id: str, acknowledged_by: str) -> bool:
        """Acknowledge an alert"""
        try:
            result = self.alerts.update_one(
                {'_id': ObjectId(alert_id)},
                {
                    '$set': {
                        'acknowledged': True,
                        'acknowledged_by': acknowledged_by,
                        'acknowledged_at': datetime.now(),
                        'updated_at': datetime.now()
                    }
                }
            )
            
            if result.modified_count > 0:
                logger.info(f"✅ Alert acknowledged: {alert_id}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Error acknowledging alert {alert_id}: {e}")
            return False
    
    # =============================================================================
    # UTILITY METHODS
    # =============================================================================
    
    def close_connection(self):
        """Close database connection"""
        try:
            if self.client:
                self.client.close()
                logger.info("✅ Database connection closed")
        except Exception as e:
            logger.error(f"Error closing database connection: {e}")
    
    def __del__(self):
        """Cleanup on object destruction"""
        self.close_connection() 