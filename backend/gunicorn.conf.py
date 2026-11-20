"""
RentTogether Production Gunicorn Configuration for Google Cloud Run
Optimized for 1 vCPU, 1 GiB RAM container instances.
"""
import os

# Port injected by Google Cloud Run (defaults to 8080)
port = os.getenv("PORT", "8080")
bind = f"0.0.0.0:{port}"

# Worker processes & concurrency:
# Using threaded workers (gthread) instead of sync forks allows handling
# 8 concurrent requests with only 2 processes, drastically cutting RAM usage.
workers = int(os.getenv("GUNICORN_WORKERS", "2"))
threads = int(os.getenv("GUNICORN_THREADS", "4"))
worker_class = "gthread"

# Memory leak prevention:
# Automatically restart workers after serving 1000 requests (with random jitter)
# to return memory back to the OS and prevent gradual memory bloat.
max_requests = 1000
max_requests_jitter = 100

# Preload application in master process before forking workers:
# Takes advantage of OS Copy-on-Write (COW) memory sharing for Django and ML libraries.
preload_app = True

# Request and lifecycle timeouts:
# 120s timeout allows longer database queries and cold-start requests to complete safely.
timeout = int(os.getenv("GUNICORN_TIMEOUT", "120"))
graceful_timeout = int(os.getenv("GUNICORN_GRACEFUL_TIMEOUT", "30"))
keepalive = 5

# Logging: stdout/stderr streaming for Google Cloud Logging
accesslog = "-"
errorlog = "-"
loglevel = os.getenv("GUNICORN_LOG_LEVEL", "info")
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" (%(D)s µs)'
