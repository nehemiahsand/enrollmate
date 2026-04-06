# EnrollMate 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Architecture Overview](#-architecture-overview)
- [Test Accounts](#-test-accounts)
- [Features](#-features-to-test)
- [Unit Tests](#-unit-tests)
- [Useful Commands](#-useful-commands)
- [Database Access](#-database-access)
- [Troubleshooting](#-troubleshooting)
- [Tech Stack](#-tech-stack)
- [Additional Documentation](#-additional-documentation)

A full-stack course enrollment management system with role-based access control for admins, instructors, and students. Built with React, Node.js/Express, and PostgreSQL, containerized with Docker for easy deployment.

---

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** installed ([Download here](https://www.docker.com/products/docker-desktop/))
- **jq** installed (for database seeding):
  - **macOS**: `brew install jq`
  - **Linux**: `sudo apt-get install jq`
  - **Windows**: Install via [chocolatey](https://community.chocolatey.org/packages/jq)

### ⚡ One-Command Setup

```bash
./start.sh
```

This script does everything: starts containers, waits for services, seeds database, and shows you the login credentials!

### Manual Setup (3 Steps)

```bash
# 1. Start the application (builds and starts all containers)
docker-compose up --build -d

# 2. Wait 15 seconds for services to start, then seed the database
./seed-database.sh

# 3. Open your browser
open http://localhost:5173
```

---

## 🏗️ Architecture Overview

### System Architecture

EnrollMate uses a modern three-tier architecture with containerized microservices:

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                        │
│  ┌────────────────────────────────────────────────────┐     │
│  │   React Frontend (Vite + Tailwind CSS)             │     │
│  │   - Component-based UI                             │     │
│  │   - Context API for state management               │     │
│  │   - React Router for navigation                    │     │
│  │   - Port: 5173                                     │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              │ JWT Authentication
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                      │
│  ┌────────────────────────────────────────────────────┐     │
│  │   Node.js/Express Backend                          │     │
│  │   - RESTful API endpoints                          │     │
│  │   - JWT token generation/validation                │     │
│  │   - Role-based access control                      │     │
│  │   - Business logic (enrollment, conflicts, etc.)   │     │
│  │   - Port: 4000                                     │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Sequelize ORM
                              │ PostgreSQL Protocol
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Data Layer                           │
│  ┌────────────────────────────────────────────────────┐     │
│  │   PostgreSQL Database                              │     │
│  │   - Users (students, instructors, admins)          │     │
│  │   - Courses (schedules, capacity, credits)         │     │
│  │   - Enrollments (with waitlist status)             │     │
│  │   - Port: 5432                                     │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Container Architecture

```
Docker Compose Orchestration
├── postgres (PostgreSQL 15 Alpine)
│   ├── Volume: postgres-data (persistent storage)
│   ├── Health Check: pg_isready
│   └── Internal Port: 5432 → External: 5432
│
├── backend (Node.js 18 Alpine)
│   ├── Depends on: postgres
│   ├── Wait for: postgres health check
│   ├── Environment: DATABASE_URL, JWT_SECRET
│   └── Internal Port: 4000 → External: 4000
│
└── frontend (Node.js 18 Alpine)
    ├── Depends on: backend
    ├── Vite dev server
    ├── Hot module replacement enabled
    └── Internal Port: 5173 → External: 5173
```

### Backend Architecture

```
enrollmate-backend/
├── server.js                    # Entry point
└── src/
    ├── app.js                   # Express app configuration
    ├── config/
    │   └── db.js               # Sequelize configuration
    ├── models/
    │   └── index.js            # User, Course, Enrollment models
    ├── controllers/
    │   ├── authController.js   # Login, register, token validation
    │   ├── userController.js   # User CRUD, role management
    │   ├── courseController.js # Course CRUD, instructor assignment
    │   └── enrollmentController.js # Enroll, drop, waitlist, conflicts
    ├── services/
    │   └── authService.js      # JWT generation, password hashing
    ├── middleware/
    │   └── authMiddleware.js   # Token verification, role checks
    └── routes/
        ├── authRoutes.js       # POST /api/auth/login, /register
        ├── userRoutes.js       # GET/PUT/DELETE /api/users
        ├── courseRoutes.js     # GET/POST/PUT/DELETE /api/courses
        └── enrollmentRoutes.js # POST /api/enrollments, DELETE /drop
```

### Frontend Architecture

```
enrollmate-frontend/
└── src/
    ├── main.jsx                 # React app entry
    ├── App.jsx                  # Router configuration
    ├── contexts/
    │   └── AuthContext.jsx     # Global auth state (JWT, user, role)
    ├── pages/
    │   ├── LoginPage.jsx       # Authentication
    │   ├── RegisterPage.jsx    # User registration
    │   ├── Dashboard.jsx       # Student dashboard
    │   ├── CoursesPage.jsx     # My courses view
    │   ├── BrowseCoursesPage.jsx # Course catalog
    │   ├── SchedulePreviewPage.jsx # Weekly timetable
    │   ├── ProfilePage.jsx     # User profile management
    │   ├── AdminDashboard.jsx  # Admin control panel
    │   └── InstructorDashboard.jsx # Instructor course view
    ├── components/
    │   ├── Layout.jsx          # Page wrapper with navigation
    │   ├── DashboardNav.jsx    # Role-based navigation
    │   ├── CourseCard.jsx      # Course display component
    │   ├── EnrollmentTable.jsx # Student enrollment table
    │   ├── WeeklyTimetable.jsx # Interactive schedule grid
    │   └── RoleBadge.jsx       # User role indicator
    ├── services/
    │   └── api.js              # Axios HTTP client (token injection)
    └── utils/
        └── scheduleUtils.js    # Time conflict detection logic
```

### Database Schema

```sql
Users
├── id (Primary Key)
├── name
├── email (Unique)
├── password (bcrypt hashed)
├── role (admin | instructor | student)
└── timestamps

Courses
├── id (Primary Key)
├── title
├── description
├── instructorId (Foreign Key → Users.id)
├── capacity (max students)
├── enrolled (current count)
├── credits
├── day (MW, MWF, TTh, etc.)
├── time (e.g., "9:00-10:00 AM")
└── timestamps

Enrollments
├── id (Primary Key)
├── studentId (Foreign Key → Users.id)
├── courseId (Foreign Key → Courses.id)
├── status (enrolled | waitlisted)
└── timestamps

Relationships:
- Users (instructor) → Courses (1:many)
- Users (student) → Enrollments (1:many)
- Courses → Enrollments (1:many)
```

### Authentication Flow

```
1. User Login
   └→ POST /api/auth/login { email, password }
      └→ authController validates credentials
         └→ authService generates JWT token
            └→ Response: { token, user: { id, name, email, role } }

2. Authenticated Request
   └→ Client includes: Authorization: Bearer <token>
      └→ authMiddleware.authenticate verifies JWT
         └→ Attaches req.user = { id, email, role }
            └→ Controller handles request

3. Role Authorization
   └→ authMiddleware.authorize(['admin', 'instructor'])
      └→ Checks req.user.role
         └→ 403 Forbidden if role not allowed
```

### Key Features Implementation

#### 1. **Schedule Conflict Detection**

- Frontend: `scheduleUtils.js` checks time overlaps before enrollment
- Parses time strings, checks day conflicts, validates against existing schedule
- Prevents backend requests for conflicting courses

#### 2. **Waitlist System**

- Backend checks `enrolled >= capacity` before enrollment
- If full: creates enrollment with `status: 'waitlisted'`
- If not full: creates enrollment with `status: 'enrolled'` and increments `course.enrolled`
- When student drops: automatically promotes first waitlisted student

#### 3. **Real-time Enrollment Updates**

- Backend increments/decrements `course.enrolled` count
- Frontend refetches course data after enrollment actions
- Displays live capacity: "15/30 enrolled"

#### 4. **Role-Based UI**

- `AuthContext` provides `user.role` globally
- `DashboardNav` renders different links per role
- Protected routes check role before rendering
- API calls include JWT token with role claim

#### 5. **Professor Assignment (Admin)**

- Dedicated "Assign Professors" tab in AdminDashboard
- Lists all courses with current instructor
- Modal with dropdown of users with `role: 'instructor'`
- PUT /api/courses/:id with `instructorId` updates assignment

---

## 🔑 Test Accounts

| Role           | Email                   | Password   |
| -------------- | ----------------------- | ---------- |
| **Admin**      | admin@enrollmate.com    | admin123   |
| **Instructor** | wagner@enrollmate.com   | teacher123 |
| **Student**    | nehemiah@enrollmate.com | student123 |

**Professors**: All use password `prof123` with emails like `s.smith@uab.edu`

### What's Included After Seeding

- **3 test users** (admin, instructor, student)
- **5 professors** across different departments (CS, Math, Physics, Chemistry, Biology)
- **16 courses** with realistic schedules and capacities
- All courses pre-assigned to professors

### Course Listing

#### Computer Science (Dr. Sarah Smith)

- **CS 101** - Introduction to Programming (MWF 9:00-10:00 AM) - 30 seats
- **CS 203** - Data Structures (TTh 10:30-12:00 PM) - 25 seats
- **CS 468** - Software Engineering (MW 2:00-3:30 PM) - 20 seats

#### Mathematics (Dr. Michael Johnson)

- **MATH 125** - Calculus I (MWF 10:00-11:00 AM) - 35 seats
- **MATH 226** - Calculus II (MWF 11:00-12:00 PM) - 30 seats
- **MATH 310** - Linear Algebra (TTh 1:00-2:30 PM) - 25 seats

#### Physics (Dr. Emily Williams)

- **PHY 113** - General Physics I (MWF 8:00-9:00 AM) - 30 seats
- **PHY 114** - General Physics II (MWF 1:00-2:00 PM) - 28 seats
- **PHY 301** - Modern Physics (TTh 3:00-4:30 PM) - 20 seats

#### Chemistry (Dr. James Brown)

- **CHEM 115** - General Chemistry I (MWF 9:00-10:00 AM) - 32 seats
- **CHEM 116** - General Chemistry II (MWF 11:00-12:00 PM) - 30 seats
- **CHEM 231** - Organic Chemistry I (TTh 9:00-10:30 AM) - 24 seats

#### Biology (Dr. Lisa Davis)

- **BIO 110** - Principles of Biology I (MWF 10:00-11:00 AM) - 35 seats
- **BIO 111** - Principles of Biology II (MWF 1:00-2:00 PM) - 32 seats
- **BIO 320** - Genetics (TTh 2:00-3:30 PM) - 25 seats
- **BIO 450** - Molecular Biology (MW 3:00-4:30 PM) - 18 seats

---

## 🎯 Features to Test

### As Admin (admin@enrollmate.com)

- ✅ Create, edit, and delete users
- ✅ Assign user roles (student, instructor, admin)
- ✅ Create, edit, and delete courses
- ✅ **Assign Professors Tab**: Dedicated interface for instructor assignment
- ✅ View all enrollments across the system
- ✅ System-wide statistics and monitoring

### As Instructor (wagner@enrollmate.com)

- ✅ View all assigned courses
- ✅ See enrolled students for each course
- ✅ Monitor course capacity and waitlist status
- ✅ View personal teaching schedule
- ✅ Access student enrollment details

### As Student (nehemiah@enrollmate.com)

- ✅ Browse complete course catalog
- ✅ Enroll in available courses (with capacity checking)
- ✅ View personalized weekly timetable
- ✅ Automatic schedule conflict detection
- ✅ Join waitlists for full courses
- ✅ Drop courses (auto-promotes waitlisted students)
- ✅ View enrollment status and credits

---

## 🧪 Unit Tests

EnrollMate includes **100+ comprehensive unit and integration tests** covering all key functionality.

### Quick Start

```bash
# Run all tests
./run-tests.sh

# Run with coverage report
./run-tests.sh coverage

# Run specific test suite
./run-tests.sh auth         # Authentication tests
./run-tests.sh course       # Course management tests
./run-tests.sh enrollment   # Enrollment tests
./run-tests.sh user         # User management tests

# Watch mode (auto-rerun on changes)
./run-tests.sh watch
```

### Test Coverage

| Suite                 | Tests | Coverage                        |
| --------------------- | ----- | ------------------------------- |
| **Authentication**    | 18    | Registration, login, JWT tokens |
| **Course Management** | 28    | CRUD operations, authorization  |
| **Enrollment System** | 29    | Enroll, waitlist, drop logic    |
| **User Management**   | 30    | Profile, roles, permissions     |

### Key Features Tested

- ✅ User authentication and JWT tokens
- ✅ Role-based access control (admin, instructor, student)
- ✅ Course CRUD operations and permissions
- ✅ Enrollment with capacity checking
- ✅ Waitlist system and auto-promotion
- ✅ User profile management
- ✅ Password hashing and security
- ✅ API error handling and validation

### View Coverage Report

```bash
# Generate and view coverage
./run-tests.sh coverage
open enrollmate-backend/coverage/index.html
```

**Expected Coverage:** 85%+ overall

For detailed test documentation, see [TESTING_QUICK_REFERENCE.md](TESTING_QUICK_REFERENCE.md)

---

## 🛠️ Useful Commands

### Basic Operations

```bash
# View running containers
docker ps

# View logs (helpful for debugging)
docker logs enrollmate-backend
docker logs enrollmate-frontend
docker logs enrollmate-postgres

# Follow logs in real-time
docker logs -f enrollmate-backend

# Stop application
docker-compose down

# Stop and remove volumes (complete reset)
docker-compose down -v
```

### Development Workflow

```bash
# Restart after code changes
docker-compose restart backend
docker-compose restart frontend

# Rebuild specific service
docker-compose up --build -d backend

# Complete rebuild (clean slate)
docker-compose down -v
docker-compose up --build -d
./seed-database.sh

# View container resource usage
docker stats
```

### Database Operations

```bash
# Access PostgreSQL CLI
docker exec -it enrollmate-postgres psql -U enrollmate -d enrollmate_db

# Backup database
docker exec enrollmate-postgres pg_dump -U enrollmate enrollmate_db > backup.sql

# Restore database
cat backup.sql | docker exec -i enrollmate-postgres psql -U enrollmate -d enrollmate_db

# Re-seed database
./seed-database.sh
```

---

## 🗄️ Database Access

### Connection Information

- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `enrollmate_db`
- **Username**: `enrollmate`
- **Password**: `enrollmate_password`

### Quick Access via psql

```bash
docker exec -it enrollmate-postgres psql -U enrollmate -d enrollmate_db
```

### Useful SQL Queries

```sql
-- View all users
SELECT id, name, email, role FROM "Users";

-- View all courses with instructors
SELECT c.id, c.title, c.day, c.time, c.enrolled, c.capacity, u.name as instructor
FROM "Courses" c
LEFT JOIN "Users" u ON c."instructorId" = u.id;

-- View enrollments
SELECT u.name, c.title, e.status
FROM "Enrollments" e
JOIN "Users" u ON e."studentId" = u.id
JOIN "Courses" c ON e."courseId" = c.id;

-- Check waitlisted students
SELECT u.name, c.title
FROM "Enrollments" e
JOIN "Users" u ON e."studentId" = u.id
JOIN "Courses" c ON e."courseId" = c.id
WHERE e.status = 'waitlisted';

-- Course enrollment statistics
SELECT c.title, c.enrolled, c.capacity,
       COUNT(CASE WHEN e.status = 'waitlisted' THEN 1 END) as waitlist_count
FROM "Courses" c
LEFT JOIN "Enrollments" e ON c.id = e."courseId"
GROUP BY c.id, c.title, c.enrolled, c.capacity;
```

### Using Database GUI Tools

You can connect with tools like:

- **DBeaver** (Free, cross-platform)
- **pgAdmin** (PostgreSQL official)
- **DataGrip** (JetBrains)
- **TablePlus** (macOS/Windows)

---

## 🔧 Troubleshooting

### Port Conflicts

**Problem**: Ports 4000, 5173, or 5432 already in use

**Solution**:

```bash
# Kill process on specific port (macOS/Linux)
lsof -ti:4000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
lsof -ti:5432 | xargs kill -9

# Or stop conflicting Docker containers
docker ps
docker stop <container_name>
```

### Database Not Seeding

**Problem**: Seed script fails or creates incomplete data

**Solution**:

```bash
# 1. Verify containers are running
docker ps
# Should show 3 containers: postgres, backend, frontend

# 2. Check backend is accessible
curl http://localhost:4000
# Should return: {"ok":true,"msg":"EnrollMate API"}

# 3. View backend logs for errors
docker logs enrollmate-backend

# 4. Try seeding again
./seed-database.sh

# 5. Complete reset if needed
docker-compose down -v
docker-compose up --build -d
sleep 15
./seed-database.sh
```

### Frontend Not Showing Changes

**Problem**: Code changes not reflected in browser

**Solution**:

```bash
# 1. Hard refresh browser
# macOS: Cmd+Shift+R
# Windows: Ctrl+Shift+R

# 2. Clear browser cache
# 3. Rebuild frontend container
docker-compose up --build -d frontend

# 4. Check frontend logs
docker logs enrollmate-frontend

# 5. Complete rebuild if needed
docker-compose down
docker-compose up --build -d
```

### "Cannot connect to Docker daemon"

**Problem**: Docker commands fail

**Solution**:

- Ensure Docker Desktop is running
- On Windows: Check WSL 2 integration is enabled
- Restart Docker Desktop
- Check Docker preferences/settings

### Backend Connection Errors

**Problem**: Frontend shows "Network Error" or API calls fail

**Solution**:

```bash
# 1. Check backend container is running
docker ps | grep backend

# 2. Test backend directly
curl http://localhost:4000/api/courses

# 3. Check backend logs
docker logs enrollmate-backend --tail 50

# 4. Verify database connection
docker logs enrollmate-postgres

# 5. Restart backend
docker-compose restart backend
```

### "jq: command not found"

**Problem**: Seed script can't parse JSON

**Solution**:

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Windows (with chocolatey)
choco install jq

# Verify installation
jq --version
```

### Permission Denied Errors

**Problem**: Can't execute scripts

**Solution**:

```bash
# Make scripts executable
chmod +x start.sh
chmod +x seed-database.sh
chmod +x generate-courses.sh
chmod +x create-test-users.sh
```

### Database Connection Timeout

**Problem**: Backend can't connect to PostgreSQL

**Solution**:

```bash
# 1. Check PostgreSQL health
docker ps
# Look for "healthy" status on postgres container

# 2. Wait longer for database to be ready
# PostgreSQL needs ~10-15 seconds to initialize

# 3. Check database logs
docker logs enrollmate-postgres

# 4. Restart with health check
docker-compose down
docker-compose up -d postgres
# Wait for "healthy" status
docker ps
docker-compose up -d backend frontend
```

---

## 🎨 Tech Stack

### Frontend

- **React 18.2** - Component-based UI framework
- **Vite 4.5** - Fast build tool and dev server
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **React Router v6** - Client-side routing
- **Axios** - HTTP client for API calls
- **Heroicons** - SVG icon library
- **Context API** - Global state management

### Backend

- **Node.js 18** (Alpine Linux) - JavaScript runtime
- **Express 4.18** - Web application framework
- **Sequelize 6.32** - ORM for database operations
- **PostgreSQL 15** - Relational database
- **JWT (jsonwebtoken)** - Token-based authentication
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### DevOps

- **Docker** - Containerization platform
- **Docker Compose** - Multi-container orchestration
- **Alpine Linux** - Lightweight container base images
- **Health Checks** - Container dependency management

### Development Tools

- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

---

## 🎓 Testing Guide

### Quick Test Scenarios

#### 1. Student Enrollment Flow

```
1. Login as student (nehemiah@enrollmate.com)
2. Browse courses → Click "Browse Courses"
3. Enroll in CS 101 → Click "Enroll"
4. View schedule → Check "Schedule Preview"
5. Try enrolling in conflicting course (should fail)
6. Drop course → Click "Drop" button
```

#### 2. Waitlist Testing

```
1. Login as admin
2. Reduce course capacity to 1
3. Login as student 1 → Enroll (should succeed)
4. Login as student 2 → Enroll (should waitlist)
5. Login as student 1 → Drop course
6. Check student 2 status (should auto-promote to enrolled)
```

#### 3. Admin Management

```
1. Login as admin (admin@enrollmate.com)
2. Create new user → Users tab → Add User
3. Assign instructor role → Edit user
4. Create new course → Courses tab → Add Course
5. Assign professor → "Assign Professors" tab
6. View system statistics → Dashboard
```

#### 4. Instructor View

```
1. Login as instructor (wagner@enrollmate.com)
2. View assigned courses
3. Check enrolled students per course
4. Review teaching schedule
5. Monitor course capacities
```

### Integration Testing

- ✅ User authentication and authorization
- ✅ Course CRUD operations
- ✅ Enrollment with capacity limits
- ✅ Waitlist promotion on drop
- ✅ Schedule conflict detection
- ✅ Role-based access control
- ✅ Real-time enrollment updates

---

## 📝 Development Team

CS 468 - Software Engineering

---

## 🚀 Key Features Implemented

- ✅ **Role-Based Access Control**: Three distinct user roles with appropriate permissions
- ✅ **Course Management**: Full CRUD operations for courses with instructor assignment
- ✅ **Enrollment System**: Students can enroll/drop courses with capacity enforcement
- ✅ **Waitlist System**: Automatic waitlist when courses are full, auto-promotion on drop
- ✅ **Schedule Visualization**: Interactive weekly timetable with color-coded courses
- ✅ **Conflict Detection**: Prevents enrolling in time-overlapping courses
- ✅ **Professor Assignment**: Dedicated admin interface for instructor management
- ✅ **Real-time Updates**: Enrollment counts and capacity update immediately
- ✅ **UAB Color Scheme**: University-themed UI with primary green (#1E6B52)
- ✅ **Responsive Design**: Mobile, tablet, and desktop optimized
- ✅ **PostgreSQL Migration**: Production-ready relational database
- ✅ **Docker Containerization**: Easy deployment and consistent environments
- ✅ **Authentication & Security**: JWT tokens, password hashing, protected routes

---

## 📄 License

This project is created for educational purposes as part of CS 468 - Software Engineering course.

---

**Made with ❤️ for CS 468 - Software Engineering**

**Need Help?** Check the [troubleshooting section](#-troubleshooting)
