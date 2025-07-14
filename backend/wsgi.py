#!/usr/bin/env python3
"""
WSGI entry point for production deployment
"""

import os
import sys
import logging

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    """Create and configure the Flask application"""
    try:
        from app_simple import app, socketio, config
        
        logger.info("✅ Application created successfully")
        logger.info(f"🌐 Server configured for {config.HOST}:{config.PORT}")
        
        return app
    except Exception as e:
        logger.error(f"❌ Failed to create application: {e}")
        raise

# Create the application instance
app = create_app()

if __name__ == "__main__":
    # For direct execution
    from app_simple import socketio, config
    
    logger.info(f"🚀 Starting server on {config.HOST}:{config.PORT}")
    socketio.run(
        app,
        host=config.HOST,
        port=config.PORT,
        debug=False,
        allow_unsafe_werkzeug=True
    ) 