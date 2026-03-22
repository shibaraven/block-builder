#!/bin/bash
set -e

echo "🧱 Block Builder — Setup"
echo "========================"

# Check Node version
NODE_VER=$(node -v | cut -d. -f1 | tr -d 'v')
if [ "$NODE_VER" -lt 20 ]; then
  echo "❌ Node.js >= 20 required (current: $(node -v))"
  exit 1
fi

# Check / install pnpm
if ! command -v pnpm &> /dev/null; then
  echo "📦 Installing pnpm..."
  npm install -g pnpm
fi

echo "📦 Installing dependencies..."
pnpm install

echo "📋 Copying .env..."
if [ ! -f .env ]; then
  cp .env.example .env
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Start development:"
echo "  pnpm dev"
echo ""
echo "  Frontend → http://localhost:3000"
echo "  Backend  → http://localhost:3001"
