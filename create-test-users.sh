#!/bin/bash

# Create Test Users for EnrollMate
echo "Creating test users..."

# Admin User
echo "Creating admin user..."
curl -X POST http://localhost:4000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@enrollmate.com",
    "password": "admin123",
    "role": "admin"
  }'
echo ""

# Instructor User
echo "Creating instructor user..."
curl -X POST http://localhost:4000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Wagner",
    "email": "wagner@enrollmate.com",
    "password": "teacher123",
    "role": "instructor"
  }'
echo ""

# Student User
echo "Creating student user..."
curl -X POST http://localhost:4000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nehemiah Sanders",
    "email": "nehemiah@enrollmate.com",
    "password": "student123",
    "role": "student"
  }'
echo ""

echo "✅ All test users created!"
echo ""
echo "You can now log in with:"
echo "  Admin:      admin@enrollmate.com / admin123"
echo "  Instructor: wagner@enrollmate.com / teacher123"
echo "  Student:    nehemiah@enrollmate.com / student123"