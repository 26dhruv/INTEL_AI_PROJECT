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
        # Use PORT environment variable if available (for Render)
        port = int(os.getenv('PORT', config.PORT))
        host = '0.0.0.0' if os.getenv('FLASK_ENV') == 'production' else config.HOST
        logger.info(f"Starting server on {host}:{port}")
        
        # Always use socketio.run for Render compatibility
        socketio.run(
            app,
            host=host,
            port=port,
            debug=False,
            use_reloader=False,  # Disable reloader to save memory
            allow_unsafe_werkzeug=True  # Allow Werkzeug in production for Render
        )
        
    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 