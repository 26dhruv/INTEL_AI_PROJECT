#!/usr/bin/env python3
"""
Gunicorn configuration for Render deployment
Optimized for the workforce monitoring system
"""

import os
import multiprocessing

# Server socket
bind = f"0.0.0.0:{os.environ.get('PORT', '10000')}"
backlog = 2048

# Worker processes
workers = 2
worker_class = "eventlet"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 120
keepalive = 2

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Process naming
proc_name = "workforce-monitoring"

# Server mechanics
preload_app = True
daemon = False
user = None
group = None
tmp_upload_dir = "/tmp"

# SSL (handled by Render)
keyfile = None
certfile = None

# Process management
pidfile = None
umask = 0
worker_tmp_dir = "/tmp"

# Logging
enable_stdio_inheritance = True
statsd_host = None
statsd_prefix = ""

# Application
pythonpath = "/opt/render/project/src"
chdir = "/opt/render/project/src/backend"

# Hooks
def on_starting(server):
    """Called just before the master process is initialized."""
    server.log.info("Workforce Monitoring System starting up...")

def on_reload(server):
    """Called to recycle workers during a reload via SIGHUP."""
    server.log.info("Workforce Monitoring System reloading...")

def when_ready(server):
    """Called just after the server is started."""
    server.log.info("Workforce Monitoring System ready to serve requests")

def worker_int(worker):
    """Called just after a worker exited on SIGINT or SIGQUIT."""
    worker.log.info("Worker received INT or QUIT signal")

def pre_fork(server, worker):
    """Called just before a worker is forked."""
    server.log.info("Worker %s about to be forked", worker.pid)

def post_fork(server, worker):
    """Called just after a worker has been forked."""
    server.log.info("Worker %s spawned", worker.pid)

def worker_exit(server, worker):
    """Called just after a worker has been exited."""
    server.log.info("Worker %s exited", worker.pid) 