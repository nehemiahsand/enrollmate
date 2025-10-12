#!/bin/bash

# Quick Start Script for EnrollMate
# This script starts the application and seeds the database

echo "🚀 Starting EnrollMate..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop and try again."
  exit 1
fi

echo "✅ Docker is running"
echo ""

# Start containers
echo "📦 Starting containers..."
docker-compose up --build -d

if [ $? -ne 0 ]; then
  echo "❌ Failed to start containers"
  exit 1
fi

echo "✅ Containers started successfully"
echo ""

# Wait for services to be ready
echo "⏳ Waiting for services to be ready (15 seconds)..."
sleep 15

# Seed database
echo ""
echo "🌱 Seeding database..."
./seed-database.sh

if [ $? -ne 0 ]; then
  echo ""
  echo "⚠️  Seeding failed. You can try running it manually:"
  echo "   ./seed-database.sh"
  echo ""
  exit 1
fi

echo ""
echo "✨ EnrollMate is ready!"
echo ""
echo "🌐 Open your browser and go to: http://localhost:5173"
echo ""
echo "🔑 Login with:"
echo "   Admin:      admin@enrollmate.com / admin123"
echo "   Instructor: wagner@enrollmate.com / teacher123"
echo "   Student:    nehemiah@enrollmate.com / student123"
echo ""
