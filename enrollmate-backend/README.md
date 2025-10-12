# EnrollMate - Backend (minimal starter)

This is a minimal Node.js + Express backend scaffold for the **EnrollMate** course registration system,
designed for development and TDD. It uses **SQLite + Sequelize** so you can run it locally without extra DB setup.

## Quickstart

1. Install deps:
```bash
cd enrollmate-backend
npm install
```

2. Create `.env` from `.env.example` and set `JWT_SECRET`.

3. Run migrations (creates SQLite DB & tables):
```bash
npm run migrate
```

4. Start server:
```bash
npm start
```

5. Run tests:
```bash
npm test
```

## What’s included
- Basic models: User, Course, Enrollment (Sequelize)
- Auth: register & login (bcrypt + JWT)
- Protected routes (authMiddleware)
- Example controllers/routes for courses and enrollments
- Jest + Supertest tests (auth + course + enrollment)

This is intentionally minimal — extend services, validation, and error handling as needed.
