#!/usr/bin/env python3
"""
Memory-optimized startup script for Workforce Monitoring System
This script reduces memory usage during startup and runtime.
"""

import os
import sys
import gc
import logging
from pathlib import Path

# Set memory optimization flags
os.environ['PYTHONOPTIMIZE'] = '1'
os.environ['PYTHONDONTWRITEBYTECODE'] = '1'

# Configure garbage collection for memory efficiency
gc.set_threshold(700, 10, 10)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def optimize_memory():
    """Apply memory optimizations"""
    # Force garbage collection
    gc.collect()
    logger.info("✅ Memory optimization applied")

def main():
    """Main entry point with memory optimization"""
    logger.info("Starting Workforce Monitoring System (Memory Optimized)")
    
    # Apply memory optimizations
    optimize_memory()
    
    # Import and run the main application
    try:
        # Add current directory to path for imports
        sys.path.insert(0, os.path.dirname(__file__))
        
        # Import directly since we're running from the backend directory
        from app_simple import app, socketio, config
        
        logger.info("✅ Application imported successfully")
        
        # Run the application
        logger.info(f"Starting server on {config.HOST}:{config.PORT}")
        
        # Use Gunicorn for production deployment
        if os.getenv('FLASK_ENV') == 'production':
            logger.info("🚀 Starting with Gunicorn for production")
            # For production, we'll use the Flask app directly with Gunicorn
            # The socketio.run() is only for development
            app.run(
                host=config.HOST,
                port=config.PORT,
                debug=False
            )
        else:
            # Development mode
            socketio.run(
                app,
                host=config.HOST,
                port=config.PORT,
                debug=config.DEBUG,
                use_reloader=False,  # Disable reloader to save memory
                allow_unsafe_werkzeug=True  # Allow Werkzeug in production for Render
            )
        
    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 