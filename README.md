# GymTaskManager

Internal task management application for gymnastics gyms. Manage daily tasks, End of Day (EOD) reports, and team communication with real-time notifications.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, React Router, Socket.IO Client
- **Backend:** Node.js, Express, Prisma ORM, PostgreSQL
- **Auth:** JWT with role-based access control
- **Real-time:** Socket.IO for instant notifications
- **Email:** Nodemailer with node-cron for scheduled EOD reminders

## Features

### Task Management
- Create, update, and delete tasks with category, dates, and notes
- Category dropdown: Cleaning, Equipment Maintenance, Front Desk, Classes, Safety, Other
- Start date & due date fields, completion checkbox
- Notes section for additional details
- Supervisors can view and edit their employees' task lists
- Overdue task highlighting

### EOD (End of Day) Reports
- Admin/Supervisor creates EOD templates with customizable questions
- Question types: Text, Checkbox, Number
- Employees complete daily EOD forms
- Submission history with filtering by date and employee

### Communication & Notifications
- Real-time in-app notifications via Socket.IO
- Notifications when tasks are assigned or completed
- Notifications when EOD reports are submitted
- Automated email reminders for incomplete EOD reports (configurable time, weekdays)

### Role-Based Access

| Feature | Admin | Supervisor | Employee |
|---------|-------|------------|----------|
| Tasks | View/edit all | View/edit team | View/complete own |
| Create tasks | Assign to anyone | Assign to team | — |
| EOD templates | Create/edit any | Create/edit own | — |
| EOD submissions | View all | View team | Submit/view own |
| User management | Full access | — | — |

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm

### 1. Clone the repository

```bash
git clone https://github.com/shaun-holden/gym-task-manager.git
cd gym-task-manager
```

### 2. Set up the database

Create a PostgreSQL database called `gym_task_manager`.

### 3. Configure environment variables

```bash
cp server/.env.example server/.env
# Edit server/.env with your database URL and other settings
```

**Server `.env` variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `JWT_SECRET` | Secret for signing JWT tokens | — |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `SMTP_HOST` | Email server host | `smtp.gmail.com` |
| `SMTP_PORT` | Email server port | `587` |
| `SMTP_USER` | Email username | — |
| `SMTP_PASS` | Email password/app password | — |
| `SMTP_FROM` | From address for emails | `GymTaskManager <noreply@gym.com>` |
| `EOD_REMINDER_TIME` | Time to send EOD reminders (HH:MM) | `17:00` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |

### 4. Install dependencies and set up database

```bash
cd server && npm install && npx prisma migrate dev --name init && npm run seed
cd ../client && npm install
```

### 5. Run development servers

```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev:client
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### Seed Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@gym.com | admin123 | ADMIN |
| supervisor@gym.com | supervisor123 | SUPERVISOR |
| employee@gym.com | employee123 | EMPLOYEE |

## API Routes

### Auth
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | — | Register new employee |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | Yes | Get current user |

### Tasks
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/tasks` | Yes | List tasks (role-filtered) |
| POST | `/api/tasks` | Admin/Supervisor | Create task |
| GET | `/api/tasks/:id` | Yes | Get task detail |
| PUT | `/api/tasks/:id` | Admin/Supervisor | Update task |
| PATCH | `/api/tasks/:id/complete` | Yes | Toggle completion |
| DELETE | `/api/tasks/:id` | Admin/Supervisor | Delete task |

**Query params:** `category`, `isCompleted`, `startDate`, `endDate`, `assignedToId`

### EOD
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/eod/templates` | Yes | List templates |
| POST | `/api/eod/templates` | Admin/Supervisor | Create template |
| GET | `/api/eod/templates/:id` | Yes | Get template |
| PUT | `/api/eod/templates/:id` | Admin/Supervisor | Update template |
| POST | `/api/eod/submissions` | Yes | Submit EOD |
| GET | `/api/eod/submissions` | Yes | List submissions (role-filtered) |
| GET | `/api/eod/submissions/:id` | Yes | Get submission detail |

### Users
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/users` | Yes | List users (role-filtered) |
| GET | `/api/users/:id` | Admin/Self | Get user detail |
| PATCH | `/api/users/:id` | Admin | Update user role/supervisor |

### Notifications
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/notifications` | Yes | List notifications |
| PATCH | `/api/notifications/:id/read` | Yes | Mark as read |
| PATCH | `/api/notifications/read-all` | Yes | Mark all as read |

## Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join:user` | Client → Server | Join personal notification room |
| `join:management` | Client → Server | Join management room (Admin/Supervisor) |
| `notification:new` | Server → Client | New notification pushed to user |

## Database Schema

```
User ─┬── assignedTasks (Task[])
      ├── createdTasks (Task[])
      ├── eodSubmissions (EodSubmission[])
      ├── createdTemplates (EodTemplate[])
      ├── notifications (Notification[])
      └── supervisor/subordinates (self-relation)

Task ── assignedTo (User), createdBy (User)

EodTemplate ─── items (EodTemplateItem[])
             └── submissions (EodSubmission[])

EodSubmission ── responses (EodResponse[])
              ├── template (EodTemplate)
              └── employee (User)

Notification ── user (User)
```

## Deployment (Railway)

### Environment variables to set:

```
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<strong-random-string>
JWT_EXPIRES_IN=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<email>
SMTP_PASS=<app-password>
SMTP_FROM=GymTaskManager <noreply@gym.com>
EOD_REMINDER_TIME=17:00
```

### Deploy:

```bash
git add . && git commit -m "deploy" && git push && railway up --detach
```

Railway auto-detects Node.js, runs `npm run build` (installs + builds client + generates Prisma), then `npm start` (runs migrations + starts server).

## Project Structure

```
GymTaskManager/
├── package.json              # Root monorepo scripts
├── client/                   # React + Vite frontend
│   ├── src/
│   │   ├── components/       # Shared UI components
│   │   ├── hooks/            # Auth, Socket, Notifications
│   │   ├── pages/            # Route pages
│   │   └── utils/            # API client, date helpers
│   └── ...
└── server/                   # Express + Prisma backend
    ├── prisma/               # Schema + seed
    └── src/
        ├── controllers/      # Route handlers
        ├── middleware/        # Auth, validation, errors
        ├── routes/           # Express route definitions
        ├── socket/           # Socket.IO handler
        ├── jobs/             # Cron jobs (EOD reminder)
        └── utils/            # Prisma, JWT, email, notify
```
