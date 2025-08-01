#!/bin/bash

echo "🔄 Restarting development server..."

# Kill any existing processes
echo "📴 Stopping existing processes..."
pkill -f "vite\|npm\|yarn" 2>/dev/null || true

# Clear node modules cache (optional)
echo "🧹 Clearing cache..."
rm -rf node_modules/.vite 2>/dev/null || true

# Wait a moment
sleep 2

# Start the development server
echo "🚀 Starting development server..."
npm run dev 