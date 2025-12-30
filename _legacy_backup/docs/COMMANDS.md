# 🛠️ Useful Commands Reference

## 📦 Installation & Setup

```bash
# Quick start (recommended)
./quick-start.sh

# Manual installation
npm install
cd apps/web && npm install && cd ../..

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma Client
npm run prisma:generate
```

## 🐳 Docker Commands

```bash
# Build images
npm run docker:build
# or
docker compose build

# Start all services
npm run docker:up
# or
docker compose up -d

# Stop all services
npm run docker:down
# or
docker compose down

# View logs
npm run docker:logs
# or
docker compose logs -f backend

# Restart specific service
docker compose restart backend

# Remove everything (including volumes)
docker compose down -v
```

## 💻 Development

```bash
# Backend development (hot-reload)
npm run dev

# Frontend development
npm run dev:frontend
# or
cd apps/web && npm run dev

# Build frontend
npm run build
# or
cd apps/web && npm run build
```

## 🗄️ Database (Prisma)

```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to database (development)
npm run prisma:push

# Create migration (production)
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Reset database (⚠️ deletes all data)
npx prisma migrate reset --schema=./apps/server/prisma/schema.prisma
```

## 🧪 Testing

```bash
# Run all tests (to be implemented)
npm test

# Run specific test file
npm test -- path/to/test.js

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## 🔍 Debugging

```bash
# View backend logs
docker compose logs -f backend

# View database logs
docker compose logs -f postgres

# View Redis logs
docker compose logs -f redis

# Execute command in container
docker compose exec backend sh

# Check container status
docker compose ps

# View resource usage
docker stats
```

## 🧹 Cleanup

```bash
# Clean old structure (after verifying new one works)
./migrate-structure.sh

# Remove node_modules
rm -rf node_modules apps/*/node_modules

# Clean Docker
docker system prune -a
docker volume prune
```

## 📊 Monitoring

```bash
# Check health endpoint
curl http://localhost:3000/api/health

# Test authentication
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@leoncast.com","password":"<hashed>"}'

# List channels
curl http://localhost:3000/api/channels \
  -H "Cookie: token=<your-token>"
```

## 🔧 Troubleshooting

```bash
# Port already in use
lsof -ti:3000 | xargs kill -9

# Reset Docker completely
docker compose down -v
docker system prune -a -f
npm run docker:build
npm run docker:up

# Fix Prisma Client issues
rm -rf node_modules/.prisma
npm run prisma:generate

# Rebuild everything
npm run docker:down
npm run docker:build --no-cache
npm run docker:up
```

## 📝 Git Commands

```bash
# Initial commit with new structure
git add .
git commit -m "refactor: implement Clean Architecture"

# Create feature branch
git checkout -b feature/your-feature

# View changed files
git status

# View diff
git diff
```

## 🚀 Deployment

```bash
# Build production image
docker build -t leoncast:latest .

# Run production container
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name leoncast \
  leoncast:latest

# Push to registry
docker tag leoncast:latest registry.example.com/leoncast:latest
docker push registry.example.com/leoncast:latest
```

## 📈 Performance

```bash
# Check bundle size
cd apps/web
npm run build
du -sh dist/

# Analyze dependencies
npm ls --depth=0

# Check for outdated packages
npm outdated

# Update packages
npm update
```

## 🔐 Security

```bash
# Audit dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Check for security issues
npm audit --audit-level=moderate
```

## 💡 Useful Aliases

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# LeonCast aliases
alias lc-start='cd /path/to/leoncast && npm run docker:up'
alias lc-stop='cd /path/to/leoncast && npm run docker:down'
alias lc-logs='cd /path/to/leoncast && npm run docker:logs'
alias lc-dev='cd /path/to/leoncast && npm run dev'
alias lc-studio='cd /path/to/leoncast && npm run prisma:studio'
```

## 📚 Quick Reference

| Task | Command |
|------|---------|
| Start everything | `./quick-start.sh` |
| Development | `npm run dev` |
| Build frontend | `npm run build` |
| Database GUI | `npm run prisma:studio` |
| View logs | `npm run docker:logs` |
| Stop services | `npm run docker:down` |
| Clean up | `./migrate-structure.sh` |

---

**Pro Tip**: Keep this file open in a separate terminal window for quick reference during development! 📌
