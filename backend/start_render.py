#!/usr/bin/env python3
"""
Render-specific startup script for Workforce Monitoring System
Handles port binding and MongoDB connection issues
"""

import os
import sys
import logging
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """Main entry point for Render deployment"""
    logger.info("🚀 Starting Workforce Monitoring System for Render")
    
    # Show environment info
    logger.info(f"🌐 Environment: {os.getenv('FLASK_ENV', 'development')}")
    logger.info(f"🔧 PORT: {os.getenv('PORT', 'Not set')}")
    logger.info(f"📁 Working directory: {os.getcwd()}")
    
    try:
        # Add current directory to path
        sys.path.insert(0, os.path.dirname(__file__))
        
        # Import application
        from app_simple import app, socketio, config
        
        # Use PORT environment variable (Render requirement)
        port = int(os.getenv('PORT', config.PORT))
        host = '0.0.0.0'  # Bind to all interfaces for Render
        
        logger.info(f"✅ Application imported successfully")
        logger.info(f"🌐 Starting server on {host}:{port}")
        
        # Start the application
        socketio.run(
            app,
            host=host,
            port=port,
            debug=False,
            use_reloader=False,
            allow_unsafe_werkzeug=True
        )
        
    except Exception as e:
        logger.error(f"❌ Failed to start application: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 