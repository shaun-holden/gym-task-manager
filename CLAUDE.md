# CLAUDE.md

## Project Overview

Internal task management app for TNT Gymnastics, deployed at **gymtaskmanager.com**. Multi-tenant with role-based access (ADMIN, SUPERVISOR, EMPLOYEE). Features task management, End-of-Day reports, real-time + push notifications, and automated email reminders. Installable as a PWA with offline support.

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, React Router v7, Socket.IO Client, Axios, vite-plugin-pwa
- **Backend:** Node.js, Express, Prisma ORM, PostgreSQL, JWT auth, Socket.IO, node-cron, Nodemailer, web-push, helmet, express-rate-limit
- **Testing:** Jest + Supertest (server only, 190 tests), mocked Prisma — no real DB needed
- **Deploy:** Railway (auto-deploys from `main` branch)
- **CI:** GitHub Actions runs tests on push/PR

## Project Structure

```
├── client/                       # React frontend (Vite + Tailwind, PWA)
│   ├── public/                   # PWA icons (svg), sw-push.js
│   └── src/
│       ├── pages/                # Route pages (Dashboard, tasks/, eod/, admin/, team/, Notifications, Resources)
│       ├── components/
│       │   ├── layout/Navbar.jsx
│       │   ├── common/           # LoadingSpinner, Modal, ErrorBoundary, etc.
│       │   ├── InstallPrompt.jsx # PWA install banner
│       │   └── UrgentNotificationPopup.jsx
│       ├── hooks/                # useAuth, useSocket, useNotifications, usePushNotifications
│       └── utils/                # api.js (Axios), formatDate.js
├── server/                       # Express backend
│   └── src/
│       ├── controllers/          # auth, task, eod, user, notification, resource, taskCategory
│       ├── routes/               # Express routers (auth, task, eod, user, notification, resource, organization, taskCategory, push)
│       ├── middleware/           # auth.js (JWT + role), validate.js, errorHandler.js
│       ├── socket/               # socketHandler.js
│       ├── jobs/                 # eodReminder.js (cron)
│       ├── utils/                # prisma, generateToken, notify (web-push + Socket.IO), sendEmail, pagination
│       └── __tests__/            # Jest tests + setup.js (Prisma mock)
├── .github/workflows/ci.yml      # Runs tests on push/PR
└── package.json                  # Root scripts (build, start, dev:server, dev:client, test)
```

## Commands

```bash
# Development (run in separate terminals)
npm run dev:server       # Express + nodemon on :3000
npm run dev:client       # Vite on :5173

# Testing (always run before commit)
npm test                 # Run all 190 tests
npm run test:coverage    # Tests + coverage report

# Production
npm run build            # Install deps, build client, generate Prisma
npm start                # Run migrations + start server
```

## Git Workflow

- Work on `features` branch
- After commit + push to `features`, merge into `main` and push so Railway redeploys
- One-liner: `git push && git checkout main && git merge features && git push && git checkout features`

## Testing Conventions

- Tests live in `server/src/__tests__/*.test.js`
- Prisma is fully mocked in `setup.js` — tests never hit a real database
- **Always use `jest.resetAllMocks()`** in beforeEach (NOT `clearAllMocks` — it doesn't clear the `mockResolvedValueOnce` queue, causes flaky tests with leaked mocks)
- When mocking `findUnique` for authenticated routes: first call is consumed by `authenticate` middleware, second by the controller
- Use `mockResolvedValueOnce` for sequential calls, `mockImplementation(({where}) => ...)` for arg-based routing
- Run `npm test` before every commit

## Database

- Schema: `server/prisma/schema.prisma`
- Migrations: `server/prisma/migrations/` (currently at 0010)
- Models: User, Organization, Task, EodTemplate, EodTemplateItem, EodSubmission, EodResponse, Notification, Resource, TaskCategoryCustom, PushSubscription
- EOD item types: TEXT, CHECKBOX, NUMBER, RATING, DATE, TIME, ATTACHMENT
- The seed endpoint (`POST /api/seed`) is disabled in production via `NODE_ENV !== 'production'` check

## Key Patterns

- **Auth:** JWT in Authorization header, `authenticate` middleware sets `req.user`
- **Roles:** `authorize('ADMIN', 'SUPERVISOR')` middleware gates routes
- **Rate limiting:** `authLimiter` (20 req/15min) on `/api/auth/login` and `/register`
- **Security headers:** `helmet({ contentSecurityPolicy: false })` — CSP disabled because client and API share origin
- **Pagination:** List endpoints (tasks, EOD submissions, notifications) accept `?page=1&limit=25`, return `{ data, page, limit, total, totalPages }`
- **Notifications:** `createNotification(io, { userId, type, message, relatedId })` writes to DB, emits via Socket.IO, AND sends web push to all subscribed devices
- **Push:** VAPID keys configured via env vars, subscriptions stored in `push_subscriptions` table, `sw-push.js` handles `push` and `notificationclick` events
- **Error handling:** Controllers call `next(err)`, global errorHandler maps Prisma codes (P2025→404, P2002→409)
- **Template updates:** When updating EOD template items, must delete `eodResponse` rows referencing those items first (foreign key constraint)

## PWA

- Service worker generated by vite-plugin-pwa using `registerType: 'prompt'` (NOT autoUpdate — caused reload loops)
- Custom `sw-push.js` registered separately for push notifications
- Manifest: `name: GymTaskManager`, `short_name: GymTasks`, indigo theme `#4f46e5`, standalone display
- Icons: SVG-based at 192x192, 512x512, apple-touch-icon, favicon
- iOS install: User must "Add to Home Screen" from Safari, then push works (iOS 16.4+)
- Install prompt component shows browser-supported banner

## Environment Variables

See `server/.env.example`. Key ones:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Token signing secret
- `CLIENT_URL` — `https://gymtaskmanager.com` in prod
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL` — Web push (generate with `npx web-push generate-vapid-keys`)
- `SMTP_*` — Email config (optional, emails skipped if not set)
- `EOD_REMINDER_TIME` — Cron time for EOD reminder job (default `17:00`, weekdays only)
