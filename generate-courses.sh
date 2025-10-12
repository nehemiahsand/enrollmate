#!/bin/bash

# Generate Courses and Professors for EnrollMate
# This script creates realistic courses with professor assignments

echo "🎓 Creating Courses and Professors for EnrollMate..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get admin token
echo "${BLUE}→ Logging in as admin...${NC}"
ADMIN_TOKEN=$(curl -s -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@enrollmate.com","password":"admin123"}' | jq -r '.token')

if [ "$ADMIN_TOKEN" == "null" ] || [ -z "$ADMIN_TOKEN" ]; then
  echo "${YELLOW}⚠ Admin user not found. Creating admin user...${NC}"
  curl -s -X POST http://localhost:4000/api/register \
    -H "Content-Type: application/json" \
    -d '{"name":"Admin User","email":"admin@enrollmate.com","password":"admin123"}' > /dev/null
  
  ADMIN_TOKEN=$(curl -s -X POST http://localhost:4000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@enrollmate.com","password":"admin123"}' | jq -r '.token')
fi

echo "${GREEN}✓ Admin authenticated${NC}"
echo ""

# Create Professors
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

# Professor 2: Dr. Johnson (Mathematics)
PROF2=$(get_or_create_prof "Dr. Michael Johnson" "m.johnson@uab.edu" "prof123")

# Professor 3: Dr. Williams (Physics)
PROF3=$(get_or_create_prof "Dr. Emily Williams" "e.williams@uab.edu" "prof123")

# Professor 4: Dr. Brown (Chemistry)
PROF4=$(get_or_create_prof "Dr. James Brown" "j.brown@uab.edu" "prof123")

# Professor 5: Dr. Davis (Biology)
PROF5=$(get_or_create_prof "Dr. Lisa Davis" "l.davis@uab.edu" "prof123")

echo "${GREEN}✓ Created 5 professors (IDs: $PROF1, $PROF2, $PROF3, $PROF4, $PROF5)${NC}"
echo ""

# Update professors to instructor role using API
echo "${BLUE}→ Updating user roles to instructor...${NC}"

# Update each professor's role via API
curl -s -X PUT http://localhost:4000/api/users/$PROF1 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"instructor"}' > /dev/null

curl -s -X PUT http://localhost:4000/api/users/$PROF2 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"instructor"}' > /dev/null

curl -s -X PUT http://localhost:4000/api/users/$PROF3 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"instructor"}' > /dev/null

curl -s -X PUT http://localhost:4000/api/users/$PROF4 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"instructor"}' > /dev/null

curl -s -X PUT http://localhost:4000/api/users/$PROF5 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"instructor"}' > /dev/null

echo "${GREEN}✓ Professors updated to instructor role${NC}"
echo ""

# Verify professor IDs (we already have them from creation)
echo "${BLUE}→ Verifying instructor roles...${NC}"
INSTRUCTOR_COUNT=$(curl -s -X GET http://localhost:4000/api/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '[.[] | select(.role=="instructor")] | length')

echo "${GREEN}✓ Found $INSTRUCTOR_COUNT instructors total${NC}"
echo "${GREEN}  Professor IDs: $PROF1 (CS), $PROF2 (Math), $PROF3 (Physics), $PROF4 (Chem), $PROF5 (Bio)${NC}"
echo ""

# Create Courses
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
  }" | jq -r '.id' > /dev/null
echo "  ✓ CS 101 - Introduction to Programming"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"CS 203 - Data Structures\",
    \"description\": \"Study of abstract data types including stacks, queues, linked lists, trees, and graphs. Emphasis on algorithm analysis.\",
    \"instructorId\": $PROF1,
    \"capacity\": 25,
    \"credits\": 3,
    \"day\": \"TTh\",
    \"time\": \"10:30-12:00 PM\"
  }" | jq -r '.id' > /dev/null
echo "  ✓ CS 203 - Data Structures"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"CS 468 - Software Engineering\",
    \"description\": \"Comprehensive study of software development lifecycle, design patterns, testing strategies, and project management.\",
    \"instructorId\": $PROF1,
    \"capacity\": 20,
    \"credits\": 3,
    \"day\": \"MW\",
    \"time\": \"2:00-3:30 PM\"
  }" | jq -r '.id' > /dev/null
echo "  ✓ CS 468 - Software Engineering"

echo ""

# Mathematics Courses (Dr. Johnson)
echo "  ${YELLOW}Mathematics${NC}"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"MATH 125 - Calculus I\",
    \"description\": \"Limits, continuity, derivatives, and applications. Introduction to integration and the Fundamental Theorem of Calculus.\",
    \"instructorId\": $PROF2,
    \"capacity\": 35,
    \"credits\": 4,
    \"day\": \"MWF\",
    \"time\": \"10:00-11:00 AM\"
  }" | jq -r '.id' > /dev/null
echo "  ✓ MATH 125 - Calculus I"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"MATH 226 - Calculus II\",
    \"description\": \"Techniques of integration, applications of integration, sequences and series, parametric equations.\",
    \"instructorId\": $PROF2,
    \"capacity\": 30,
    \"credits\": 4,
    \"day\": \"MWF\",
    \"time\": \"11:00-12:00 PM\"
  }" | jq -r '.id' > /dev/null
echo "  ✓ MATH 226 - Calculus II"

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
  }" | jq -r '.id' > /dev/null
echo "  ✓ MATH 310 - Linear Algebra"

echo ""

# Physics Courses (Dr. Williams)
echo "  ${YELLOW}Physics${NC}"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"PHY 113 - General Physics I\",
    \"description\": \"Mechanics, heat, and sound. Calculus-based introduction to physics for science and engineering majors.\",
    \"instructorId\": $PROF3,
    \"capacity\": 40,
    \"credits\": 4,
    \"day\": \"MWF\",
    \"time\": \"8:00-9:00 AM\"
  }" | jq -r '.id' > /dev/null
echo "  ✓ PHY 113 - General Physics I"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"PHY 114 - General Physics II\",
    \"description\": \"Electricity, magnetism, light, and modern physics. Continuation of PHY 113.\",
    \"instructorId\": $PROF3,
    \"capacity\": 35,
    \"credits\": 4,
    \"day\": \"MWF\",
    \"time\": \"1:00-2:00 PM\"
  }" | jq -r '.id' > /dev/null
echo "  ✓ PHY 114 - General Physics II"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"PHY 301 - Modern Physics\",
    \"description\": \"Special relativity, quantum mechanics, atomic and nuclear physics. Introduction to contemporary physics.\",
    \"instructorId\": $PROF3,
    \"capacity\": 20,
    \"credits\": 3,
    \"day\": \"TTh\",
    \"time\": \"3:00-4:30 PM\"
  }" | jq -r '.id' > /dev/null
echo "  ✓ PHY 301 - Modern Physics"

echo ""

# Chemistry Courses (Dr. Brown)
echo "  ${YELLOW}Chemistry${NC}"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"CHEM 115 - General Chemistry I\",
    \"description\": \"Atomic structure, chemical bonding, stoichiometry, and thermodynamics. Laboratory included.\",
    \"instructorId\": $PROF4,
    \"capacity\": 40,
    \"credits\": 4,
    \"day\": \"MWF\",
    \"time\": \"9:00-10:00 AM\"
  }" | jq -r '.id' > /dev/null
echo "  ✓ CHEM 115 - General Chemistry I"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"CHEM 116 - General Chemistry II\",
    \"description\": \"Chemical kinetics, equilibrium, acids and bases, electrochemistry. Laboratory included.\",
    \"instructorId\": $PROF4,
    \"capacity\": 35,
    \"credits\": 4,
    \"day\": \"MWF\",
    \"time\": \"11:00-12:00 PM\"
  }" | jq -r '.id' > /dev/null
echo "  ✓ CHEM 116 - General Chemistry II"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"CHEM 231 - Organic Chemistry I\",
    \"description\": \"Structure, properties, and reactions of organic compounds. Emphasis on reaction mechanisms.\",
    \"instructorId\": $PROF4,
    \"capacity\": 30,
    \"credits\": 3,
    \"day\": \"TTh\",
    \"time\": \"9:00-10:30 AM\"
  }" | jq -r '.id' > /dev/null
echo "  ✓ CHEM 231 - Organic Chemistry I"

echo ""

# Biology Courses (Dr. Davis)
echo "  ${YELLOW}Biology${NC}"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"BIO 110 - Principles of Biology I\",
    \"description\": \"Cell structure and function, genetics, evolution, and ecology. Laboratory included.\",
    \"instructorId\": $PROF5,
    \"capacity\": 45,
    \"credits\": 4,
    \"day\": \"MWF\",
    \"time\": \"10:00-11:00 AM\"
  }" | jq -r '.id' > /dev/null
echo "  ✓ BIO 110 - Principles of Biology I"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"BIO 111 - Principles of Biology II\",
    \"description\": \"Plant and animal systems, physiology, development, and behavior. Laboratory included.\",
    \"instructorId\": $PROF5,
    \"capacity\": 40,
    \"credits\": 4,
    \"day\": \"MWF\",
    \"time\": \"1:00-2:00 PM\"
  }" | jq -r '.id' > /dev/null
echo "  ✓ BIO 111 - Principles of Biology II"

curl -s -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"BIO 320 - Genetics\",
    \"description\": \"Principles of heredity, molecular genetics, gene regulation, and genomics.\",
    \"instructorId\": $PROF5,
    \"capacity\": 25,
    \"credits\": 3,
    \"day\": \"TTh\",
    \"time\": \"2:00-3:30 PM\"
  }" | jq -r '.id' > /dev/null
echo "  ✓ BIO 320 - Genetics"

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
  }" | jq -r '.id' > /dev/null
echo "  ✓ BIO 450 - Molecular Biology"

echo ""
echo ""
echo "${GREEN}✅ Course Generation Complete!${NC}"
echo ""
echo "📊 Summary:"
echo "  • 5 Professors created"
echo "  • 16 Courses created across 5 departments"
echo ""
echo "👨‍🏫 Professors:"
echo "  • Dr. Sarah Smith (Computer Science) - s.smith@uab.edu"
echo "  • Dr. Michael Johnson (Mathematics) - m.johnson@uab.edu"
echo "  • Dr. Emily Williams (Physics) - e.williams@uab.edu"
echo "  • Dr. James Brown (Chemistry) - j.brown@uab.edu"
echo "  • Dr. Lisa Davis (Biology) - l.davis@uab.edu"
echo ""
echo "📚 Departments:"
echo "  • Computer Science: 3 courses"
echo "  • Mathematics: 3 courses"
echo "  • Physics: 3 courses"
echo "  • Chemistry: 3 courses"
echo "  • Biology: 4 courses"
echo ""
echo "🔑 All professors have password: prof123"
echo ""
