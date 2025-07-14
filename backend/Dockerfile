# Minimal Dockerfile for Render deployment
# Uses simplified requirements to avoid memory issues

FROM python:3.11-slim

# Set environment variables for optimization
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONHASHSEED=random \
    PYTHONOPTIMIZE=1 \
    PYTHONMALLOC=malloc \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install only essential system dependencies
RUN apt-get update && apt-get install -y \
    libopencv-dev \
    python3-opencv \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy simplified requirements for Render
COPY requirements.render.txt .

# Install Python dependencies with memory optimization
RUN pip install --no-cache-dir --compile --prefer-binary -r requirements.render.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p data/uploads data/employee_images logs temp

# Pre-compile Python files to reduce startup memory usage
RUN python -m py_compile app_simple.py config.py mongodb_manager.py utils.py start_optimized.py

# Clean up any temporary files and reduce image size
RUN find . -type f -name "*.pyc" -delete && \
    find . -type d -name "__pycache__" -delete && \
    rm -rf /root/.cache/pip

# Expose port (Render uses PORT environment variable)
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/api/health || exit 1

# Run the application with memory optimization
CMD ["python", "-O", "start_optimized.py"] 