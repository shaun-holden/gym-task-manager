# CLAUDE.md

## Project Overview

Internal task management app for TNT Gymnastics. Multi-tenant with role-based access (ADMIN, SUPERVISOR, EMPLOYEE). Features task management, End-of-Day reports, real-time notifications, and automated email reminders.

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, React Router v7, Socket.IO Client, Axios
- **Backend:** Node.js, Express, Prisma ORM, PostgreSQL, JWT auth, Socket.IO, node-cron, Nodemailer
- **Testing:** Jest + Supertest (server only), mocked Prisma — no real DB needed
- **Deploy:** Railway (auto-deploys on push to features branch)

## Project Structure

```
├── client/              # React frontend (Vite + Tailwind)
│   └── src/
│       ├── pages/       # Route pages (Dashboard, tasks/, eod/, admin/, team/)
│       ├── components/  # Shared UI (layout/, common/, UrgentNotificationPopup)
│       ├── hooks/       # useAuth, useSocket, useNotifications
│       └── utils/       # api.js (Axios), formatDate.js
├── server/              # Express backend
│   └── src/
│       ├── controllers/ # Route handlers (auth, task, eod, user, notification, resource, taskCategory)
│       ├── routes/      # Express routers with validation
│       ├── middleware/   # auth.js (JWT + role), validate.js, errorHandler.js
│       ├── socket/      # socketHandler.js
│       ├── jobs/        # eodReminder.js (cron)
│       ├── utils/       # prisma.js, generateToken.js, notify.js, sendEmail.js, pagination.js
│       └── __tests__/   # Jest test files + setup.js (Prisma mock)
├── .github/workflows/   # CI (runs tests on push/PR)
└── package.json         # Root scripts (build, start, dev:server, dev:client, test)
```

## Commands

```bash
# Development (run in separate terminals)
npm run dev:server       # Express + nodemon on :3000
npm run dev:client       # Vite on :5173

# Testing
npm test                 # Run all 190 tests
npm run test:coverage    # Tests + coverage report

# Production
npm run build            # Install deps, build client, generate Prisma
npm start                # Run migrations + start server
```

## Testing Conventions

- Tests live in `server/src/__tests__/*.test.js`
- Prisma is fully mocked in `setup.js` — tests never hit a real database
- Always use `jest.resetAllMocks()` in beforeEach (NOT `clearAllMocks` — it doesn't clear the mockResolvedValueOnce queue)
- When mocking `findUnique` for authenticated routes, the first call is consumed by the `authenticate` middleware, second by the controller
- Use `mockResolvedValueOnce` for sequential calls, `mockImplementation` when you need arg-based routing
- Run `npm test` before every commit

## Database

- Schema: `server/prisma/schema.prisma`
- Migrations: `server/prisma/migrations/`
- Models: User, Organization, Task, EodTemplate, EodTemplateItem, EodSubmission, EodResponse, Notification, Resource, TaskCategoryCustom
- The seed endpoint (`POST /api/seed`) is disabled in production

## Key Patterns

- **Auth:** JWT in Authorization header, `authenticate` middleware sets `req.user`
- **Roles:** `authorize('ADMIN', 'SUPERVISOR')` middleware gates routes
- **Pagination:** List endpoints accept `?page=1&limit=25`, return `{ data, page, limit, total, totalPages }`
- **Notifications:** Created via `createNotification(io, { userId, type, message })` — writes to DB + emits via Socket.IO
- **Error handling:** Controllers call `next(err)`, global errorHandler maps Prisma codes (P2025→404, P2002→409)

## Environment Variables

See `server/.env.example` for all required variables. Key ones:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Token signing secret
- `CLIENT_URL` — Frontend URL for CORS
- `SMTP_*` — Email config (optional, emails skipped if not set)
