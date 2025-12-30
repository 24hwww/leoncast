# 📂 Project Structure - Clean Architecture

## 🎯 Complete File Tree

```
leoncast/
│
├── 📄 Configuration Files
│   ├── .env.example              # Environment variables template
│   ├── .gitignore                # Git ignore rules
│   ├── docker-compose.yaml       # Services orchestration
│   ├── Dockerfile                # Multi-stage build
│   └── package.json              # Root dependencies & scripts
│
├── 📚 Documentation
│   ├── README.md                 # Getting started guide
│   ├── ARCHITECTURE.md           # Architecture diagrams
│   ├── MIGRATION.md              # Migration guide
│   ├── SUMMARY.md                # Executive summary
│   └── COMMANDS.md               # Command reference
│
├── 🛠️ Helper Scripts
│   ├── quick-start.sh            # One-command setup
│   └── migrate-structure.sh      # Clean old files
│
└── 📁 apps/
    │
    ├── 🖥️ server/                # BACKEND (Clean Architecture)
    │   │
    │   ├── 🎯 domain/            # LAYER 1: Business Logic (Pure)
    │   │   ├── entities/
    │   │   │   ├── Channel.js    # Channel entity with business rules
    │   │   │   └── Scenario.js   # Scenario entity with validation
    │   │   └── repositories/
    │   │       └── index.js      # Repository interfaces (contracts)
    │   │
    │   ├── 🔄 application/       # LAYER 2: Use Cases & Services
    │   │   ├── use-cases/
    │   │   │   ├── ChannelUseCases.js   # Channel business flows
    │   │   │   └── ScenarioUseCases.js  # Scenario business flows
    │   │   └── services/
    │   │       └── AuthService.js       # Authentication logic
    │   │
    │   ├── 🔌 infrastructure/    # LAYER 3: External Dependencies
    │   │   ├── database/
    │   │   │   ├── prisma.js              # Prisma client config
    │   │   │   ├── ChannelRepository.js   # Channel DB implementation
    │   │   │   └── ScenarioRepository.js  # Scenario DB implementation
    │   │   ├── cache/
    │   │   │   └── redis.js               # Redis pub/sub config
    │   │   ├── streaming/
    │   │   │   └── StreamingService.js    # FFmpeg service
    │   │   └── config/
    │   │       └── index.js               # Environment config
    │   │
    │   ├── 🌐 presentation/      # LAYER 4: HTTP Interface
    │   │   ├── controllers/
    │   │   │   ├── AuthController.js      # Auth HTTP handlers
    │   │   │   ├── ChannelController.js   # Channel HTTP handlers
    │   │   │   └── ScenarioController.js  # Scenario HTTP handlers
    │   │   ├── routes/
    │   │   │   ├── auth.js                # Auth endpoints
    │   │   │   ├── channels.js            # Channel endpoints
    │   │   │   └── scenarios.js           # Scenario endpoints
    │   │   └── middlewares/
    │   │       └── auth.js                # Authentication middleware
    │   │
    │   ├── 🗄️ prisma/            # Database Schema
    │   │   └── schema.prisma     # Prisma schema definition
    │   │
    │   └── 🚀 index.js           # Server Entry Point (DI Container)
    │
    ├── 🎨 web/                   # FRONTEND (React + Vite)
    │   ├── src/
    │   │   ├── pages/
    │   │   │   ├── Login.jsx     # Login page
    │   │   │   ├── Dashboard.jsx # Dashboard page
    │   │   │   └── Action.jsx    # Mobile controller
    │   │   ├── components/       # Reusable components
    │   │   ├── lib/              # Utilities
    │   │   ├── App.jsx           # Main app component
    │   │   ├── main.jsx          # Entry point
    │   │   └── index.css         # Global styles
    │   ├── public/               # Static assets
    │   ├── index.html            # HTML template
    │   ├── vite.config.js        # Vite configuration
    │   ├── tailwind.config.js    # Tailwind configuration
    │   └── package.json          # Frontend dependencies
    │
    └── 🎬 scenarios/             # STREAMING PROJECTS
        ├── .gitkeep              # Keep directory in git
        └── [dynamic]/            # User-created scenarios
            ├── index.html
            ├── script.js
            └── style.css
```

## 📊 File Count by Layer

| Layer | Files | Purpose |
|-------|-------|---------|
| **Domain** | 3 | Pure business logic |
| **Application** | 3 | Use cases & services |
| **Infrastructure** | 6 | External dependencies |
| **Presentation** | 7 | HTTP interface |
| **Total Backend** | **19** | Complete backend |
| **Frontend** | 10+ | React application |

## 🎯 Dependency Flow

```
Presentation → Application → Domain ← Infrastructure
     ↓              ↓           ↑           ↑
Controllers → Use Cases → Entities ← Repositories
     ↓              ↓                       ↑
  Routes      Services                 Database
                                       Cache
                                       Streaming
```

## 📝 Key Files Explained

### Backend Core
- **`apps/server/index.js`** - DI Container, wires everything together
- **`apps/server/domain/entities/`** - Pure business logic, no dependencies
- **`apps/server/application/use-cases/`** - Orchestrate business flows
- **`apps/server/infrastructure/`** - Concrete implementations
- **`apps/server/presentation/`** - HTTP layer

### Frontend Core
- **`apps/web/src/App.jsx`** - Main React app with routing
- **`apps/web/src/pages/`** - Page components
- **`apps/web/vite.config.js`** - Build configuration

### Configuration
- **`.env.example`** - Environment variables template
- **`docker-compose.yaml`** - Service orchestration
- **`Dockerfile`** - Multi-stage build

### Documentation
- **`README.md`** - Getting started
- **`ARCHITECTURE.md`** - Design details
- **`MIGRATION.md`** - Migration guide
- **`COMMANDS.md`** - Command reference

## 🔍 Finding Files

```bash
# Find all entities
find apps/server/domain/entities -name "*.js"

# Find all use cases
find apps/server/application/use-cases -name "*.js"

# Find all controllers
find apps/server/presentation/controllers -name "*.js"

# Find all routes
find apps/server/presentation/routes -name "*.js"

# Count total backend files
find apps/server -name "*.js" | wc -l
```

## 📦 Module Dependencies

```
Domain Layer
  ↓ (no dependencies)

Application Layer
  ↓ depends on: Domain

Infrastructure Layer
  ↓ depends on: Domain, Application
  ↓ uses: Prisma, Redis, FFmpeg

Presentation Layer
  ↓ depends on: Application
  ↓ uses: Fastify
```

## 🎨 Color Legend

- 🎯 **Domain** - Pure business logic (green zone)
- 🔄 **Application** - Use cases (blue zone)
- 🔌 **Infrastructure** - External deps (yellow zone)
- 🌐 **Presentation** - HTTP layer (purple zone)

---

**Note**: This structure follows **Clean Architecture** principles where dependencies flow inward, and the domain layer has zero external dependencies.
