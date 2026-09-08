# ==============================================================================
# DOCKERFILE - BACKEND FASTAPI (GEEKSOFT ENGINE / DELFOS)
# Optimizado para Coolify & Contabo VPS (169.58.168.107)
# ==============================================================================

FROM python:3.12-slim

# Evitar bytecode y forzar stdout unbuffered
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PORT 8000

# Directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema requeridas por WeasyPrint, psycopg2 y herramientas de red
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz0b \
    libpango1.0-dev \
    libcairo2 \
    libcairo2-dev \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente del backend
COPY . /app

# Exponer el puerto oficial de Coolify / Traefik
EXPOSE 8000

# Comando de arranque con Uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
