import base64
import cv2
import numpy as np
from PIL import Image
import io
from datetime import datetime, timedelta
import re
import os

def decode_base64_image(base64_string):
    """
    Decode base64 image string to OpenCV format
    
    Args:
        base64_string (str): Base64 encoded image string
        
    Returns:
        numpy.ndarray: OpenCV image array or None if failed
    """
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64 to bytes
        image_bytes = base64.b64decode(base64_string)
        
        # Convert to numpy array
        image_array = np.frombuffer(image_bytes, dtype=np.uint8)
        
        # Decode to OpenCV image
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        
        # Convert BGR to RGB
        if image is not None:
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        return image
        
    except Exception as e:
        print(f"Error decoding base64 image: {e}")
        return None

def encode_image_to_base64(image, format='JPEG'):
    """
    Encode image to base64 string
    
    Args:
        image: PIL Image or numpy array
        format (str): Image format (JPEG, PNG)
        
    Returns:
        str: Base64 encoded image string
    """
    try:
        if isinstance(image, np.ndarray):
            # Convert numpy array to PIL Image
            if image.dtype == np.uint8:
                pil_image = Image.fromarray(image)
            else:
                # Normalize to 0-255 range
                image = ((image - image.min()) / (image.max() - image.min()) * 255).astype(np.uint8)
                pil_image = Image.fromarray(image)
        else:
            pil_image = image
        
        # Save to bytes buffer
        buffer = io.BytesIO()
        pil_image.save(buffer, format=format)
        
        # Encode to base64
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/{format.lower()};base64,{img_str}"
        
    except Exception as e:
        print(f"Error encoding image to base64: {e}")
        return None

def validate_employee_data(data):
    """
    Validate employee registration data
    
    Args:
        data (dict): Employee data to validate
        
    Returns:
        tuple: (is_valid, error_message)
    """
    required_fields = ['employee_id', 'name', 'department', 'position', 'email']
    
    # Check required fields
    for field in required_fields:
        if field not in data or not data[field]:
            return False, f"Missing or empty required field: {field}"
    
    # Validate email format
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, data['email']):
        return False, "Invalid email format"
    
    # Validate employee ID format (alphanumeric, 3-20 characters)
    if not re.match(r'^[a-zA-Z0-9]{3,20}$', data['employee_id']):
        return False, "Employee ID must be 3-20 alphanumeric characters"
    
    # Validate name (letters, spaces, hyphens only)
    if not re.match(r'^[a-zA-Z\s\-]{2,50}$', data['name']):
        return False, "Name must be 2-50 characters, letters, spaces, and hyphens only"
    
    # Validate phone if provided
    if 'phone' in data and data['phone']:
        phone_pattern = r'^[\+]?[1-9][\d]{0,15}$'
        if not re.match(phone_pattern, data['phone']):
            return False, "Invalid phone number format"
    
    return True, None

def format_datetime(dt):
    """
    Format datetime for JSON serialization
    
    Args:
        dt (datetime): Datetime object
        
    Returns:
        str: ISO formatted datetime string
    """
    if dt is None:
        return None
    
    if isinstance(dt, datetime):
        return dt.isoformat()
    
    return str(dt)

def parse_datetime(dt_string):
    """
    Parse datetime string to datetime object
    
    Args:
        dt_string (str): ISO formatted datetime string
        
    Returns:
        datetime: Parsed datetime object
    """
    try:
        # Handle different formats
        if 'T' in dt_string:
            # ISO format with T
            if '+' in dt_string or 'Z' in dt_string:
                # With timezone
                dt_string = dt_string.replace('Z', '+00:00')
                return datetime.fromisoformat(dt_string)
            else:
                # Without timezone
                return datetime.fromisoformat(dt_string)
        else:
            # Simple date format
            return datetime.strptime(dt_string, '%Y-%m-%d')
    except Exception as e:
        print(f"Error parsing datetime: {e}")
        return None

def calculate_age(birth_date):
    """
    Calculate age from birth date
    
    Args:
        birth_date (datetime): Birth date
        
    Returns:
        int: Age in years
    """
    if birth_date is None:
        return None
    
    today = datetime.now().date()
    if isinstance(birth_date, datetime):
        birth_date = birth_date.date()
    
    age = today.year - birth_date.year
    
    # Adjust if birthday hasn't occurred this year
    if today.month < birth_date.month or (today.month == birth_date.month and today.day < birth_date.day):
        age -= 1
    
    return age

def get_date_range(period):
    """
    Get date range for common periods
    
    Args:
        period (str): Period name ('today', 'week', 'month', 'year')
        
    Returns:
        tuple: (start_date, end_date)
    """
    end_date = datetime.now()
    
    if period == 'today':
        start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == 'week':
        start_date = end_date - timedelta(days=7)
    elif period == 'month':
        start_date = end_date - timedelta(days=30)
    elif period == 'year':
        start_date = end_date - timedelta(days=365)
    else:
        # Default to last 7 days
        start_date = end_date - timedelta(days=7)
    
    return start_date, end_date

def resize_image(image, max_width=800, max_height=600):
    """
    Resize image while maintaining aspect ratio
    
    Args:
        image (numpy.ndarray): Input image
        max_width (int): Maximum width
        max_height (int): Maximum height
        
    Returns:
        numpy.ndarray: Resized image
    """
    if image is None:
        return None
    
    height, width = image.shape[:2]
    
    # Calculate scaling factor
    scale_x = max_width / width
    scale_y = max_height / height
    scale = min(scale_x, scale_y, 1.0)  # Don't upscale
    
    if scale < 1.0:
        new_width = int(width * scale)
        new_height = int(height * scale)
        
        resized = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
        return resized
    
    return image

def create_response(data=None, message=None, error=None, status_code=200):
    """
    Create standardized API response
    
    Args:
        data: Response data
        message (str): Success message
        error (str): Error message
        status_code (int): HTTP status code
        
    Returns:
        tuple: (response_dict, status_code)
    """
    response = {
        'timestamp': datetime.now().isoformat(),
        'success': error is None
    }
    
    if data is not None:
        response['data'] = data
    
    if message:
        response['message'] = message
    
    if error:
        response['error'] = error
    
    return response, status_code

def sanitize_filename(filename):
    """
    Sanitize filename for safe storage
    
    Args:
        filename (str): Original filename
        
    Returns:
        str: Sanitized filename
    """
    # Remove or replace invalid characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    
    # Remove leading/trailing whitespace and dots
    filename = filename.strip(' .')
    
    # Limit length
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        filename = name[:255-len(ext)] + ext
    
    return filename

def log_error(error, context=None):
    """
    Log error with context
    
    Args:
        error (Exception): Error to log
        context (str): Additional context
    """
    timestamp = datetime.now().isoformat()
    error_msg = f"[{timestamp}] ERROR: {str(error)}"
    
    if context:
        error_msg += f" | Context: {context}"
    
    print(error_msg)
    
    # In production, you might want to write to a file or send to a logging service
    # with open('logs/error.log', 'a') as f:
    #     f.write(error_msg + '\n')

def calculate_confidence_score(distance, threshold=0.6):
    """
    Calculate confidence score from face recognition distance
    
    Args:
        distance (float): Face recognition distance
        threshold (float): Recognition threshold
        
    Returns:
        float: Confidence score (0-1)
    """
    if distance > threshold:
        return 0.0
    
    # Convert distance to confidence score
    confidence = 1 - (distance / threshold)
    return max(0.0, min(1.0, confidence))

def get_severity_level(violations):
    """
    Determine severity level based on violations
    
    Args:
        violations (list): List of safety violations
        
    Returns:
        str: Severity level ('low', 'medium', 'high', 'critical')
    """
    if not violations:
        return 'low'
    
    violation_count = len(violations)
    
    # Check for critical violations
    critical_items = ['helmet', 'safety_harness']
    if any(item in ' '.join(violations).lower() for item in critical_items):
        return 'critical'
    
    # Determine severity based on count
    if violation_count >= 3:
        return 'high'
    elif violation_count >= 2:
        return 'medium'
    else:
        return 'low' 