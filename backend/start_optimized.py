#!/usr/bin/env python3
"""
Memory-optimized startup script for Workforce Monitoring System
This script reduces memory usage during startup and runtime.
"""

import os
import sys
import gc
import psutil
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

def log_memory_usage(stage=""):
    """Log current memory usage"""
    try:
        process = psutil.Process(os.getpid())
        memory_info = process.memory_info()
        logger.info(f"Memory usage {stage}: {memory_info.rss / 1024 / 1024:.2f} MB")
    except Exception as e:
        logger.warning(f"Could not log memory usage: {e}")

def optimize_memory():
    """Apply memory optimizations"""
    # Force garbage collection
    gc.collect()
    
    # Set process priority (if possible)
    try:
        process = psutil.Process(os.getpid())
        process.nice(10)  # Lower priority to reduce resource usage
    except Exception:
        pass
    
    log_memory_usage("after optimization")

def main():
    """Main entry point with memory optimization"""
    logger.info("Starting Workforce Monitoring System (Memory Optimized)")
    log_memory_usage("at startup")
    
    # Apply memory optimizations
    optimize_memory()
    
    # Import and run the main application
    try:
        from app_simple import app, socketio, config
        
        log_memory_usage("after imports")
        
        # Run the application
        logger.info(f"Starting server on {config.HOST}:{config.PORT}")
        socketio.run(
            app,
            host=config.HOST,
            port=config.PORT,
            debug=config.DEBUG,
            use_reloader=False,  # Disable reloader to save memory
            threaded=True
        )
        
    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 