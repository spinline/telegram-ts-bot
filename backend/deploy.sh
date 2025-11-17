#!/bin/bash

echo "=== Telegram Bot Deployment Script ==="
echo ""

# Backend dizinine git
cd "$(dirname "$0")"

echo "1. Pulling latest code..."
git pull

echo ""
echo "2. Installing dependencies..."
npm ci

echo ""
echo "3. Building TypeScript..."
npm run build

echo ""
echo "4. Stopping old processes..."
pkill -f "node dist/index.js" || echo "No old process found"
pkill -f "ts-node src/index.js" || echo "No ts-node process found"
sleep 2

echo ""
echo "5. Starting bot..."
echo "Logs will appear below. Press Ctrl+C to stop."
echo "========================================"
echo ""

NODE_ENV=production node dist/index.js
