#!/bin/bash

# Seed Database Script for EnrollMate
# This script populates the database with test users, professors, and courses

echo "🌱 Seeding EnrollMate Database..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if containers are running
echo "${BLUE}→ Checking if containers are running...${NC}"
if ! docker ps | grep -q enrollmate-backend; then
  echo "${RED}✗ Backend container is not running!${NC}"
  echo "Please start the containers first with: docker-compose up -d"
  exit 1
fi

echo "${GREEN}✓ Containers are running${NC}"
echo ""

# Wait for backend to be ready
echo "${BLUE}→ Waiting for backend to be ready...${NC}"
sleep 3

# Test backend connection
if ! curl -s http://localhost:4000 > /dev/null; then
  echo "${RED}✗ Cannot connect to backend on port 4000${NC}"
  echo "Please check if the backend is running: docker logs enrollmate-backend"
  exit 1
fi

echo "${GREEN}✓ Backend is ready${NC}"
echo ""

# ==================== CREATE USERS ====================
echo "${BLUE}→ Creating test users...${NC}"

# Admin User
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@enrollmate.com","password":"admin123"}')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.token')

if [ "$ADMIN_TOKEN" != "null" ] && [ -n "$ADMIN_TOKEN" ]; then
  echo "  ✓ Admin User created (admin@enrollmate.com / admin123)"
else
  # User might already exist, try to login
  ADMIN_TOKEN=$(curl -s -X POST http://localhost:4000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@enrollmate.com","password":"admin123"}' | jq -r '.token')
  
  if [ "$ADMIN_TOKEN" != "null" ] && [ -n "$ADMIN_TOKEN" ]; then
    echo "  ✓ Admin User already exists (admin@enrollmate.com / admin123)"
  else
    echo "${RED}  ✗ Failed to create or login admin user${NC}"
    exit 1
  fi
fi

# Update admin role
curl -s -X PUT http://localhost:4000/api/users/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}' > /dev/null

# Instructor User
INSTRUCTOR_RESPONSE=$(curl -s -X POST http://localhost:4000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Dr. Wagner","email":"wagner@enrollmate.com","password":"teacher123"}')

if echo $INSTRUCTOR_RESPONSE | jq -e '.user.id' > /dev/null 2>&1; then
  echo "  ✓ Dr. Wagner created (wagner@enrollmate.com / teacher123)"
  INSTRUCTOR_ID=$(echo $INSTRUCTOR_RESPONSE | jq -r '.user.id')
  # Update to instructor role
  curl -s -X PUT http://localhost:4000/api/users/$INSTRUCTOR_ID \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"role":"instructor"}' > /dev/null
else
  echo "  ✓ Dr. Wagner already exists (wagner@enrollmate.com / teacher123)"
fi

# Student User
STUDENT_RESPONSE=$(curl -s -X POST http://localhost:4000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Nehemiah Sanders","email":"nehemiah@enrollmate.com","password":"student123"}')

if echo $STUDENT_RESPONSE | jq -e '.user.id' > /dev/null 2>&1; then
  echo "  ✓ Nehemiah Sanders created (nehemiah@enrollmate.com / student123)"
else
  echo "  ✓ Nehemiah Sanders already exists (nehemiah@enrollmate.com / student123)"
fi

echo ""

# ==================== CREATE PROFESSORS ====================
echo "${BLUE}→ Creating professors...${NC}"

# Function to get or create professor
get_or_create_prof() {
  local name=$1
  local email=$2
  local password=$3
  
  # Try to register
  local response=$(curl -s -X POST http://localhost:4000/api/register \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$name\",\"email\":\"$email\",\"password\":\"$password\"}")
  
  local id=$(echo $response | jq -r '.user.id')
  
  # If registration failed (user exists), get ID from user list
  if [ "$id" == "null" ] || [ -z "$id" ]; then
    id=$(curl -s -X GET http://localhost:4000/api/users \
      -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r ".[] | select(.email==\"$email\") | .id")
  fi
  
  echo $id
}

# Professor 1: Dr. Smith (Computer Science)
PROF1=$(get_or_create_prof "Dr. Sarah Smith" "s.smith@uab.edu" "prof123")
echo "  ✓ Dr. Sarah Smith (Computer Science)"

# Professor 2: Dr. Johnson (Mathematics)
PROF2=$(get_or_create_prof "Dr. Michael Johnson" "m.johnson@uab.edu" "prof123")
echo "  ✓ Dr. Michael Johnson (Mathematics)"

# Professor 3: Dr. Williams (Physics)
PROF3=$(get_or_create_prof "Dr. Emily Williams" "e.williams@uab.edu" "prof123")
echo "  ✓ Dr. Emily Williams (Physics)"

# Professor 4: Dr. Brown (Chemistry)
PROF4=$(get_or_create_prof "Dr. James Brown" "j.brown@uab.edu" "prof123")
echo "  ✓ Dr. James Brown (Chemistry)"

# Professor 5: Dr. Davis (Biology)
PROF5=$(get_or_create_prof "Dr. Lisa Davis" "l.davis@uab.edu" "prof123")
echo "  ✓ Dr. Lisa Davis (Biology)"

echo ""

# ==================== UPDATE PROFESSOR ROLES ====================
echo "${BLUE}→ Updating professor roles to instructor...${NC}"

for prof_id in $PROF1 $PROF2 $PROF3 $PROF4 $PROF5; do
  curl -s -X PUT http://localhost:4000/api/users/$prof_id \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"role":"instructor"}' > /dev/null
done

echo "${GREEN}✓ All professors updated to instructor role${NC}"
echo ""

# ==================== CREATE COURSES ====================
echo "${BLUE}→ Creating courses...${NC}"
echo ""

# Computer Science Courses (Dr. Smith)
echo "  ${YELLOW}Computer Science${NC}"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"CS 101 - Introduction to Programming\",
    \"description\": \"Learn fundamental programming concepts using Python. Topics include variables, control structures, functions, and basic data structures.\",
    \"instructorId\": $PROF1,
    \"capacity\": 30,
    \"credits\": 3,
    \"day\": \"MWF\",
    \"time\": \"9:00-10:00 AM\"
  }" > /dev/null
echo "    ✓ CS 101 - Introduction to Programming"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"CS 203 - Data Structures\",
    \"description\": \"Study of fundamental data structures including arrays, linked lists, stacks, queues, trees, and graphs. Implementation and analysis of algorithms.\",
    \"instructorId\": $PROF1,
    \"capacity\": 25,
    \"credits\": 3,
    \"day\": \"TTh\",
    \"time\": \"10:30-12:00 PM\"
  }" > /dev/null
echo "    ✓ CS 203 - Data Structures"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"CS 468 - Software Engineering\",
    \"description\": \"Principles and practices of software engineering. Topics include requirements analysis, design patterns, testing, and project management.\",
    \"instructorId\": $PROF1,
    \"capacity\": 20,
    \"credits\": 3,
    \"day\": \"MW\",
    \"time\": \"2:00-3:30 PM\"
  }" > /dev/null
echo "    ✓ CS 468 - Software Engineering"

# Mathematics Courses (Dr. Johnson)
echo "  ${YELLOW}Mathematics${NC}"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"MATH 125 - Calculus I\",
    \"description\": \"Limits, continuity, derivatives, and applications. Introduction to integration.\",
    \"instructorId\": $PROF2,
    \"capacity\": 35,
    \"credits\": 4,
    \"day\": \"MWF\",
    \"time\": \"10:00-11:00 AM\"
  }" > /dev/null
echo "    ✓ MATH 125 - Calculus I"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"MATH 226 - Calculus II\",
    \"description\": \"Techniques of integration, applications of integration, sequences and series.\",
    \"instructorId\": $PROF2,
    \"capacity\": 30,
    \"credits\": 4,
    \"day\": \"MWF\",
    \"time\": \"11:00-12:00 PM\"
  }" > /dev/null
echo "    ✓ MATH 226 - Calculus II"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"MATH 310 - Linear Algebra\",
    \"description\": \"Vector spaces, linear transformations, matrices, determinants, eigenvalues and eigenvectors.\",
    \"instructorId\": $PROF2,
    \"capacity\": 25,
    \"credits\": 3,
    \"day\": \"TTh\",
    \"time\": \"1:00-2:30 PM\"
  }" > /dev/null
echo "    ✓ MATH 310 - Linear Algebra"

# Physics Courses (Dr. Williams)
echo "  ${YELLOW}Physics${NC}"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"PHY 113 - General Physics I\",
    \"description\": \"Mechanics, heat, and sound. Calculus-based introduction to physics.\",
    \"instructorId\": $PROF3,
    \"capacity\": 40,
    \"credits\": 4,
    \"day\": \"MWF\",
    \"time\": \"8:00-9:00 AM\"
  }" > /dev/null
echo "    ✓ PHY 113 - General Physics I"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"PHY 114 - General Physics II\",
    \"description\": \"Electricity, magnetism, light, and modern physics.\",
    \"instructorId\": $PROF3,
    \"capacity\": 35,
    \"credits\": 4,
    \"day\": \"MWF\",
    \"time\": \"1:00-2:00 PM\"
  }" > /dev/null
echo "    ✓ PHY 114 - General Physics II"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"PHY 301 - Modern Physics\",
    \"description\": \"Special relativity, quantum mechanics, atomic and nuclear physics.\",
    \"instructorId\": $PROF3,
    \"capacity\": 20,
    \"credits\": 3,
    \"day\": \"TTh\",
    \"time\": \"3:00-4:30 PM\"
  }" > /dev/null
echo "    ✓ PHY 301 - Modern Physics"

# Chemistry Courses (Dr. Brown)
echo "  ${YELLOW}Chemistry${NC}"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"CHEM 115 - General Chemistry I\",
    \"description\": \"Fundamental principles of chemistry including atomic structure, bonding, stoichiometry, and thermodynamics.\",
    \"instructorId\": $PROF4,
    \"capacity\": 40,
    \"credits\": 4,
    \"day\": \"MWF\",
    \"time\": \"9:00-10:00 AM\"
  }" > /dev/null
echo "    ✓ CHEM 115 - General Chemistry I"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"CHEM 116 - General Chemistry II\",
    \"description\": \"Continuation of General Chemistry I. Kinetics, equilibrium, acids and bases, electrochemistry.\",
    \"instructorId\": $PROF4,
    \"capacity\": 35,
    \"credits\": 4,
    \"day\": \"MWF\",
    \"time\": \"11:00-12:00 PM\"
  }" > /dev/null
echo "    ✓ CHEM 116 - General Chemistry II"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"CHEM 231 - Organic Chemistry I\",
    \"description\": \"Structure, nomenclature, properties, and reactions of organic compounds.\",
    \"instructorId\": $PROF4,
    \"capacity\": 30,
    \"credits\": 3,
    \"day\": \"TTh\",
    \"time\": \"9:00-10:30 AM\"
  }" > /dev/null
echo "    ✓ CHEM 231 - Organic Chemistry I"

# Biology Courses (Dr. Davis)
echo "  ${YELLOW}Biology${NC}"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"BIO 110 - Principles of Biology I\",
    \"description\": \"Cell structure and function, metabolism, genetics, and molecular biology.\",
    \"instructorId\": $PROF5,
    \"capacity\": 45,
    \"credits\": 4,
    \"day\": \"MWF\",
    \"time\": \"10:00-11:00 AM\"
  }" > /dev/null
echo "    ✓ BIO 110 - Principles of Biology I"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"BIO 111 - Principles of Biology II\",
    \"description\": \"Evolution, ecology, diversity of life, and organismal biology.\",
    \"instructorId\": $PROF5,
    \"capacity\": 40,
    \"credits\": 4,
    \"day\": \"MWF\",
    \"time\": \"1:00-2:00 PM\"
  }" > /dev/null
echo "    ✓ BIO 111 - Principles of Biology II"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"BIO 320 - Genetics\",
    \"description\": \"Principles of heredity, gene expression, genetic variation, and population genetics.\",
    \"instructorId\": $PROF5,
    \"capacity\": 25,
    \"credits\": 3,
    \"day\": \"TTh\",
    \"time\": \"2:00-3:30 PM\"
  }" > /dev/null
echo "    ✓ BIO 320 - Genetics"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"BIO 450 - Molecular Biology\",
    \"description\": \"Advanced study of DNA replication, transcription, translation, and gene expression.\",
    \"instructorId\": $PROF5,
    \"capacity\": 20,
    \"credits\": 3,
    \"day\": \"MW\",
    \"time\": \"3:00-4:30 PM\"
  }" > /dev/null
echo "    ✓ BIO 450 - Molecular Biology"

echo ""
echo "${GREEN}✅ Database Seeding Complete!${NC}"
echo ""
echo "📊 Summary:"
echo "  • 3 Test Users (Admin, Instructor, Student)"
echo "  • 5 Professors (Computer Science, Mathematics, Physics, Chemistry, Biology)"
echo "  • 16 Courses across 5 departments"
echo ""
echo "🔑 Login Credentials:"
echo "  Admin:      admin@enrollmate.com / admin123"
echo "  Instructor: wagner@enrollmate.com / teacher123"
echo "  Student:    nehemiah@enrollmate.com / student123"
echo "  Professors: All use password 'prof123'"
echo ""
echo "🌐 Access the application at: http://localhost:5173"
echo ""
