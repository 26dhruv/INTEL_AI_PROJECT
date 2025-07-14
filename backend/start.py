#!/usr/bin/env python3
"""
Simple startup script for local development
"""

import os
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """Main entry point for local development"""
    logger.info("Starting Workforce Monitoring System (Local Development)")
    
    try:
        # Add parent directory to path for imports
        sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
        
        from backend.app_simple import app, socketio, config
        
        logger.info("✅ Application imported successfully")
        
        # Run the application
        logger.info(f"Starting server on {config.HOST}:{config.PORT}")
        socketio.run(
            app,
            host=config.HOST,
            port=config.PORT,
            debug=config.DEBUG,
            use_reloader=True  # Enable reloader for development
        )
        
    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 