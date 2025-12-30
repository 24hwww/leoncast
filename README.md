# 🎬 LeonCast - Dynamic Streaming Platform

A scalable streaming platform built with **Clean Architecture** principles, featuring dynamic channel management, scenario-based streaming, and real-time interactions.

## 🏗️ Architecture

This project follows **Clean Architecture** with clear separation of concerns:

```
leoncast/
├── apps/
│   ├── server/                    # Backend Application
│   │   ├── domain/                # Business Logic (Pure)
│   │   │   ├── entities/          # Domain entities
│   │   │   └── repositories/      # Repository interfaces
│   │   ├── application/           # Use Cases & Services
│   │   │   ├── use-cases/         # Business use cases
│   │   │   └── services/          # Application services
│   │   ├── infrastructure/        # External Dependencies
│   │   │   ├── database/          # Prisma & repositories
│   │   │   ├── cache/             # Redis configuration
│   │   │   ├── streaming/         # FFmpeg service
│   │   │   └── config/            # Environment config
│   │   ├── presentation/          # HTTP Layer
│   │   │   ├── controllers/       # Request handlers
│   │   │   ├── routes/            # Route definitions
│   │   │   └── middlewares/       # Auth, validation, etc.
│   │   ├── prisma/                # Database schema
│   │   └── index.js               # Server entry point
│   │
│   ├── web/                       # Frontend (React + Vite)
│   │   ├── src/
│   │   │   ├── pages/             # Page components
│   │   │   ├── components/        # Reusable components
│   │   │   └── lib/               # Utilities
│   │   └── dist/                  # Build output
│   │
│   └── scenarios/                 # Mini-projects for streaming
│
├── docker-compose.yaml
├── Dockerfile
└── package.json
```

## 🎯 Key Principles

### 1. **Dependency Inversion**
- Domain layer has NO dependencies on infrastructure
- Interfaces defined in domain, implemented in infrastructure
- Dependencies flow inward (Presentation → Application → Domain)

### 2. **Single Responsibility**
- **Entities**: Pure business logic
- **Use Cases**: Orchestrate business flows
- **Controllers**: Handle HTTP concerns only
- **Services**: Infrastructure implementations

### 3. **Separation of Concerns**
- **Domain**: What the system does
- **Application**: How it does it
- **Infrastructure**: Technical details
- **Presentation**: User interface

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (via Docker)
- Redis (via Docker)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd leoncast

# Install dependencies
npm install

# Install frontend dependencies
cd apps/web && npm install && cd ../..

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma Client
npm run prisma:generate

# Start with Docker
npm run docker:up

# Or start locally
npm run dev
```

### Development

```bash
# Backend (with hot-reload)
npm run dev

# Frontend (separate terminal)
npm run dev:frontend

# Database management
npm run prisma:studio

# View logs
npm run docker:logs
```

## 📦 Technology Stack

### Backend
- **Fastify** - High-performance web framework
- **Prisma** - Type-safe ORM
- **Redis** - Pub/Sub & caching
- **FFmpeg** - Video streaming
- **JWT** - Authentication
- **Bcrypt** - Password hashing

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client
- **Lucide Icons** - Icon library

### Infrastructure
- **Docker** - Containerization
- **PostgreSQL** - Database
- **Redis** - Cache & messaging

## 🔐 Security

- **Client-side hashing**: Passwords hashed with SHA-256 before transmission
- **Server-side hashing**: Bcrypt for storage
- **JWT tokens**: Secure session management
- **HTTPOnly cookies**: XSS protection
- **Environment variables**: Sensitive data isolation

## 📡 API Endpoints

### Authentication
```
POST   /auth/login      # Login
POST   /auth/logout     # Logout
GET    /auth/me         # Get current user
```

### Channels
```
GET    /api/channels           # List all channels
POST   /api/channels           # Create channel
GET    /api/channels/:id       # Get channel
DELETE /api/channels/:id       # Delete channel
POST   /api/channels/:id/start # Start streaming
POST   /api/channels/:id/stop  # Stop streaming
```

### Scenarios
```
GET    /api/scenarios              # List all scenarios
POST   /api/scenarios              # Create scenario
GET    /api/scenarios/:id          # Get scenario
DELETE /api/scenarios/:id          # Delete scenario
POST   /api/scenarios/:id/activate # Activate scenario
PATCH  /api/scenarios/:id/config   # Update config
```

### WebSocket
```
WS     /ws?channelId=<id>  # Real-time channel updates
```

## 🧪 Testing

```bash
# Run tests (to be implemented)
npm test

# Run linter
npm run lint
```

## 📊 Monitoring

Health check endpoint:
```
GET /api/health
```

## 🔧 Configuration

Environment variables (`.env`):

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/leoncast

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=3000
NODE_ENV=development

# Auth
JWT_SECRET=your-secret-key
COOKIE_SECRET=your-cookie-secret
ADMIN_EMAIL=admin@leoncast.com
ADMIN_PASSW=admin

# Streaming
RESTREAMER_URL=rtmp://localhost/live
```

## 🐳 Docker

### Build
```bash
docker compose build
```

### Run
```bash
docker compose up -d
```

### Logs
```bash
docker compose logs -f backend
```

### Stop
```bash
docker compose down
```

## 📝 Development Guidelines

### Adding a New Feature

1. **Define Domain Entity** (`apps/server/domain/entities/`)
2. **Create Repository Interface** (`apps/server/domain/repositories/`)
3. **Implement Repository** (`apps/server/infrastructure/database/`)
4. **Create Use Case** (`apps/server/application/use-cases/`)
5. **Build Controller** (`apps/server/presentation/controllers/`)
6. **Define Routes** (`apps/server/presentation/routes/`)
7. **Wire Dependencies** (`apps/server/index.js`)

### Code Style
- Use **async/await** for asynchronous code
- Follow **SOLID principles**
- Keep functions **small and focused**
- Write **descriptive variable names**
- Add **JSDoc comments** for public APIs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## 📄 License

MIT

## 📚 Detailed Documentation

For more in-depth information about the project, check out the following documents in the `docs/` folder:

- **[Architecture Guide](docs/ARCHITECTURE.md)** - Detailed look at the Clean Architecture layers.
- **[File Structure](docs/STRUCTURE.md)** - Visual guide to the project organization.
- **[Command Reference](docs/COMMANDS.md)** - Useful commands for daily development and operations.
- **[Migration Guide](docs/MIGRATION.md)** - History and rationale behind the architectural refactoring.
- **[Executive Summary](docs/SUMMARY.md)** - High-level overview of the project refactor.
- **[Documentation Index](docs/INDEX.md)** - Master index for all project documentation.

## 🙏 Acknowledgments

Built with Clean Architecture principles inspired by Robert C. Martin's work.
