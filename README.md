# Ethara — Team Task Manager

A full-stack web application for managing projects, assigning tasks, and tracking team progress with role-based access control.

## Live Demo

> **Frontend:** https://frontend-five-beige-n6dsnigtxc.vercel.app
> **Backend API:** https://backend-iota-inky-38.vercel.app/health

---

## Features

- **Authentication** — JWT-based signup & login
- **Projects** — Create, view, and delete projects
- **Team Management** — Invite members by email; Admin / Member roles per project
- **Tasks** — Create, assign, update status & priority, set due dates
- **Kanban Board** — Drag-through-status board view per project
- **Dashboard** — Stats, overdue tasks, recent activity
- **My Tasks** — All tasks assigned to you across every project

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| Deployment | Railway |

---

## Project Structure

```
Ethara/
├── backend/
│   ├── src/
│   │   ├── app.js              # Express entry point
│   │   ├── config/database.js  # PostgreSQL pool
│   │   ├── controllers/        # Business logic
│   │   ├── middleware/auth.js  # JWT + RBAC middleware
│   │   ├── routes/             # API route definitions
│   │   └── db/schema.sql       # Database schema
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── pages/              # Dashboard, Projects, ProjectDetail, MyTasks
    │   ├── components/         # Layout, TaskCard, Modal
    │   ├── context/AuthContext.jsx
    │   └── api/axios.js
    └── package.json
```

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List my projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project + members |
| PUT | `/api/projects/:id` | Update project *(admin)* |
| DELETE | `/api/projects/:id` | Delete project *(owner)* |
| POST | `/api/projects/:id/members` | Add member by email *(admin)* |
| DELETE | `/api/projects/:id/members/:userId` | Remove member *(admin)* |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/my` | My assigned tasks |
| GET | `/api/tasks/project/:projectId` | Tasks in a project |
| POST | `/api/tasks/project/:projectId` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Stats + overdue + recent activity |

---

## Role-Based Access Control

| Action | Member | Admin |
|--------|--------|-------|
| View project & tasks | ✅ | ✅ |
| Create tasks | ✅ | ✅ |
| Edit own tasks | ✅ | ✅ |
| Edit any task | ❌ | ✅ |
| Add/remove members | ❌ | ✅ |
| Delete project | ❌ | ✅ (owner only) |

---

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET
npm install
npm run db:migrate
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env — set VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
```

---

## Deployment on Vercel

### 1. Set up Free PostgreSQL (Neon)

1. Go to [neon.tech](https://neon.tech) → Sign up free
2. Click **New Project** → name it `ethara`
3. Copy the **Connection string** (looks like `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`)

### 2. Add DATABASE_URL to Backend

In your terminal:
```bash
cd backend
echo "YOUR_NEON_CONNECTION_STRING" | npx vercel env add DATABASE_URL production
npx vercel --yes   # redeploy to pick up the new var
```

### 3. Run Database Migration

```bash
# Set DATABASE_URL locally and migrate
DATABASE_URL="your_neon_url" npm run db:migrate
```

### 4. Backend & Frontend are already on Vercel

- Backend: https://backend-iota-inky-38.vercel.app
- Frontend: https://frontend-five-beige-n6dsnigtxc.vercel.app

---

## Environment Variables

### Backend `.env`
```
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend.railway.app
```

### Frontend `.env`
```
VITE_API_URL=https://your-backend.railway.app/api
```
