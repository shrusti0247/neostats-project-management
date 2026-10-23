
# NeoStats — Collaborative Project Management Platform

A full-stack project management application built for the NeoStats Full Stack Engineering Hackathon.

## Features

- JWT-based authentication
- Four roles: Admin, Project Manager, Team Member, Viewer
- Role-aware dashboards
- Project creation and management
- Task creation, assignment and status tracking
- Project team membership and role management
- Task comments and discussions
- PostgreSQL database with Prisma ORM
- Optimistic concurrency support through task versioning

## Tech Stack

- Frontend: Next.js, React, Tailwind CSS
- Backend: Node.js, Express.js
- Database: PostgreSQL
- ORM: Prisma
- Authentication: JSON Web Tokens (JWT) and bcrypt

## Project Structure

```text
frontend/
  app/
    page.js
    dashboard/page.js
    projects/page.js
    team/page.js
    comments/page.js

backend/
  middleware/auth.js
  routes/auth.js
  routes/projects.js
  routes/tasks.js
  routes/team.js
  routes/comments.js
  prisma/schema.prisma
  seed.js
  server.js
```

## Prerequisites

- Node.js and npm
- PostgreSQL
- Git

## Setup

### 1. Configure the database

Create a PostgreSQL database named `hackathon_db`.

### 2. Configure the backend environment

Create `backend/.env` with your local database connection and JWT secret:

```env
DATABASE_URL="postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@localhost:5432/hackathon_db"
JWT_SECRET="replace_with_a_long_random_secret"
```

Replace the placeholders with your local values. Do not commit `.env`.

### 3. Install backend dependencies

```bash
cd backend
npm install
```

### 4. Apply database migrations and seed demo users

```bash
npx prisma migrate deploy
npx prisma generate
node seed.js
```

### 5. Start the backend

```bash
node server.js
```

The API runs at `http://localhost:5002`.

### 6. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Demo Accounts

All accounts use the demo password `Password123!`.

| Role | Email |
|---|---|
| Admin | admin@neostats.com |
| Project Manager | manager@neostats.com |
| Team Member | member@neostats.com |
| Viewer | viewer@neostats.com |

Use these accounts only for local demonstration.

## API Routes

| Endpoint | Purpose |
|---|---|
| `POST /api/auth/login` | Authenticate a user |
| `GET /api/users` | List users (Admin-only) |
| `/api/projects` | Project operations |
| `/api/tasks` | Task operations |
| `/api/team` | Project membership operations |
| `/api/comments` | Task comment operations |

## Architecture

The Next.js frontend sends HTTP requests to the Express API. Express middleware validates JWTs and checks permissions. Prisma Client accesses PostgreSQL, where relational constraints maintain data integrity.

Task versioning supports optimistic concurrency: updates based on stale versions should be rejected with HTTP 409 Conflict.

## Security Notes

- Passwords are stored as bcrypt hashes.
- JWT secrets and database credentials belong in environment variables.
- The backend, not the frontend, must enforce authorization.
- Demo credentials are intended for local evaluation only.

## Limitations

This is a hackathon prototype. Verify all endpoints, role restrictions, concurrency behavior, and error cases before claiming they are fully tested.
