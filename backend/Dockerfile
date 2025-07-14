# Build stage for heavy dependencies
FROM python:3.11-slim as builder

# Set environment variables for build optimization
ENV PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libopencv-dev \
    python3-opencv \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy requirements and install in build stage
COPY requirements.txt .

# Install Python dependencies in build stage
RUN pip install --no-cache-dir --compile --prefer-binary \
    Flask==2.3.3 \
    Flask-CORS==4.0.0 \
    Flask-SocketIO==5.3.6 \
    python-socketio==5.8.0 \
    pymongo==4.5.0 \
    python-dateutil==2.8.2 \
    python-dotenv==1.0.0 \
    pillow==10.0.1 \
    pandas==2.0.3 \
    numpy==1.24.3 \
    opencv-python==4.8.1.78 \
    face-recognition==1.3.0 \
    dlib==19.24.2 \
    torch==2.0.1+cpu \
    torchvision==0.15.2+cpu \
    ultralytics==8.0.196 \
    bcrypt==4.0.1 \
    PyJWT==2.8.0 \
    psutil==5.9.5

# Runtime stage
FROM python:3.11-slim as runtime

# Set environment variables for runtime optimization
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONHASHSEED=random \
    PYTHONOPTIMIZE=1 \
    PYTHONMALLOC=malloc

WORKDIR /app

# Install only runtime system dependencies
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

# Copy Python packages from builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

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

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5001/api/health || exit 1

# Run the application with memory optimization
CMD ["python", "-O", "start_optimized.py"] 