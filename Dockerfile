# ==============================================================================
# RentTogether Backend — Google Cloud Run Production Multi-Stage Dockerfile
# (Repository Root Context)
# ==============================================================================

# Stage 1: Build & compile Python dependencies
FROM python:3.12-slim as builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /build/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Final Minimal Runtime Image
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    DJANGO_SETTINGS_MODULE=config.settings

WORKDIR /app

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 --shell /bin/bash appuser

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# Copy backend application source code
COPY backend/ /app/

# Pre-collect static files during container build
RUN SECRET_KEY="build-phase-dummy-key" python manage.py collectstatic --no-input || true

# Change ownership to non-root appuser
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

# Cloud Run Container Health Check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health/ || exit 1

# Start Gunicorn using memory-efficient threaded configuration
CMD ["gunicorn", "--config", "gunicorn.conf.py", "config.wsgi:application"]
