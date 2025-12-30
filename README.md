# LeonCast Video Streaming System

Sistema completo de transmisión de video con dashboard, gestor de FFmpeg, y soporte para Restreamer.

## Stack
- **Backend**: Node.js, Fastify, FFmpeg
- **Frontend**: React (Vite)
- **Database**: PostgreSQL
- **Queue/Cache**: Redis
- **Streaming**: FFmpeg, Restreamer

## Requisitos
- Docker & Docker Compose
- Node.js 18+ (para desarrollo local)

## Instalación y Uso (Docker)

1. Crear archivo `.env` (incluido por defecto).
2. Levantar los servicios:
   ```bash
   docker-compose up --build -d
   ```
3. Acceder al dashboard: http://localhost
4. API disponible en: http://localhost:3000
5. Restreamer disponible en: http://localhost:8080 (admin/admin)

## Desarrollo Local

### Backend
```bash
cd backend
npm install
npm run dev
# Servidor en http://localhost:3000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Dashboard en http://localhost:5173
```
(Nota: Para desarrollo local del frontend, asegúrate de que apunte al backend correctamente en `.env` o `vite.config.js`. Por defecto usa `http://localhost:3000/api`).

## Estructura
- `/backend`: API Rest y servicio de control de FFmpeg.
- `/frontend`: Dashboard React.
- `docker-compose.yaml`: Orquestación de contenedores.
