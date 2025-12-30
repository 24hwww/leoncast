#!/bin/bash

echo "🚀 Iniciando LeonCast en modo desarrollo con Hot-Reload..."

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias de la raíz..."
    npm install
fi

if [ ! -d "apps/web/node_modules" ]; then
    echo "📦 Instalando dependencias del frontend..."
    cd apps/web && npm install && cd ../..
fi

# Iniciar Docker para base de datos y redis
echo "🐳 Iniciando servicios de infraestructura (Postgres, Redis)..."
docker compose up -d postgres redis

# Ejecutar backend y frontend en paralelo
echo "🔥 Iniciando servicios de aplicación..."
npx concurrently \
  -n "backend,frontend" \
  -c "blue,green" \
  "npm run dev" \
  "npm run dev:frontend"
