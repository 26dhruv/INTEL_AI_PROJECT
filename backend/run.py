#!/usr/bin/env python3
"""
Workforce Monitoring System - Backend Server
Entry point for running the Flask application
"""

import os
import sys
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Set environment variables if not already set
if not os.getenv('FLASK_ENV'):
    os.environ['FLASK_ENV'] = 'development'

if not os.getenv('FLASK_DEBUG'):
    os.environ['FLASK_DEBUG'] = 'True'

def main():
    """Main entry point for the application"""
    try:
        # Import after setting up the path
        from backend.app_simple import app, socketio
        from backend.config import get_config
        
        # Get configuration based on environment
        config = get_config()
        
        print("🚀 Starting Workforce Monitoring System Backend")
        print(f"📊 Environment: {os.getenv('FLASK_ENV', 'development')}")
        print(f"🔧 Debug Mode: {config.DEBUG}")
        print(f"🌐 Host: {config.HOST}")
        print(f"🚪 Port: {config.PORT}")
        print(f"🗄️  MongoDB URI: {config.MONGO_URI}")
        print(f"📁 Data Directory: data/")
        print("="*60)
        print("🌐 API Endpoints Available:")
        print("   • Health Check: GET /api/health")
        print("   • Employees: GET|POST /api/employees")
        print("   • Employee: GET|PUT|DELETE /api/employees/<id>")
        print("   • Attendance: GET /api/attendance")
        print("   • Attendance Stats: GET /api/attendance/stats")
        print("   • Safety Events: GET /api/safety/events")
        print("   • Safety Stats: GET /api/safety/stats")
        print("   • Camera Control: POST /api/camera/start|stop")
        print("   • Dashboard Stats: GET /api/dashboard/stats")
        print("   • Recent Alerts: GET /api/dashboard/recent-alerts")
        print("="*60)
        print("🔄 WebSocket Events:")
        print("   • face_detected - Real-time face recognition")
        print("   • safety_event - Real-time safety violations")
        print("="*60)
        print("📱 Frontend Integration:")
        print(f"   • React App: Served from /")
        print(f"   • CORS Origins: {config.CORS_ORIGINS}")
        print("="*60)
        
        # Start the application
        socketio.run(
            app,
            host=config.HOST,
            port=config.PORT,
            debug=config.DEBUG,
            use_reloader=config.DEBUG
        )
        
    except KeyboardInterrupt:
        print("\n🛑 Shutting down server...")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main() 