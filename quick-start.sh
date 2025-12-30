#!/bin/bash

echo "🚀 LeonCast Quick Start"
echo "======================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ .env created. Please update with your configuration."
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "📦 Installing frontend dependencies..."
cd apps/web && npm install && cd ../..

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npm run prisma:generate

# Start Docker services
echo "🐳 Starting Docker services..."
npm run docker:up

echo ""
echo "✅ Setup complete!"
echo ""
echo "📊 Services:"
echo "   - Backend: http://localhost:3000"
echo "   - Database: localhost:5432"
echo "   - Redis: localhost:6379"
echo ""
echo "🔍 View logs: npm run docker:logs"
echo "🛑 Stop services: npm run docker:down"
echo ""
echo "Happy streaming! 🎬"
