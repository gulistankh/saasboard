# SaaSBoard

**A secure team workspace and analytics dashboard: the foundation every SaaS needs.**

SaaSBoard is a multi-tenant SaaS starter built with React, Node.js and PostgreSQL. It covers the parts founders most often get wrong: authentication, email verification, password reset, role-based access, team invites and strict workspace isolation, with a live dashboard on top.

- **Live demo:** coming soon
- **Video walkthrough:** coming soon

> The free-tier server may sleep when idle, so the first load can take up to a minute.

---

## Screenshots

| Dashboard (light) | Dashboard (dark) |
|---|---|
| ![Dashboard light](./docs/dashboard-light.png) | ![Dashboard dark](/docs/dashboard-dark.png) |

| Team management | Login |
|---|---|
| ![Team](docs/team.png) | ![Login](docs/login.png) |

| Invite page | Profile picture cropper |
|---|---|
| ![Invite](docs/invite.png) | ![Cropper](docs/cropper.png) |

---

## Features

**Authentication**
- Signup, login, logout
- Email verification (single-use, expiring links)
- Forgot and reset password (single-use links, all sessions revoked after a reset)
- Show/hide password toggle on every password field
- Sliding 7-day sessions with rotating refresh tokens

**Roles and teams**
- Admin and Member roles, enforced on the server (not just hidden in the UI)
- Protected routes on the frontend and protected API endpoints on the backend
- Team invites by email: send, resend, cancel, accept
- Invited people can sign up straight into the inviting workspace, or log in to accept
- Change roles and remove members, with last-admin and owner protection

**Workspace**
- Rename the workspace
- Owner-only deletion, confirmed by typing the workspace name, done in one transaction

**Dashboard (real data from PostgreSQL)**
- Stat cards, activity line chart (7/30/90 days), tasks-by-status bar chart
- Recent activity feed and projects table with calculated progress

**Profile and settings**
- Edit name, change password
- Profile picture: upload any image, crop and zoom, replace or remove
- Email notification preferences saved per user
- Light, dark and system themes

**Demo mode**
- "Try the demo" creates a temporary workspace with sample data, deleted after 24 hours
- Risky actions (invites, password and picture changes) are disabled for demo users

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, React Router, Axios, Recharts, lucide-react, react-easy-crop |
| Backend | Node.js, Express |
| Database | PostgreSQL (`pg`, parameterized queries only) |
| Validation | Zod |
| Email | Nodemailer (any SMTP provider) |
| Images | Multer, Sharp |

---

## Security highlights

- **Passwords** hashed with **Argon2id**; a dummy hash check keeps login timing the same for unknown emails
- **Access tokens** are short-lived JWTs (15 min) kept in memory only, never in localStorage
- **Refresh tokens** live in an **httpOnly cookie**, are stored **hashed**, and **rotate** on every use
- **One-time tokens** (verification, reset, invites) are random, expiring, single-use, and stored only as SHA-256 hashes
- **Roles are checked on the server** on every request, loaded fresh from the database, so a demoted admin loses access immediately
- **Workspace isolation:** every query is filtered by the workspace of the logged-in user, never by an id sent from the browser
- **Mass assignment protection:** Zod strips unknown fields (for example a `role` sent to the profile endpoint)
- **No account enumeration** on login, forgot-password and resend-verification
- **Rate limiting** on login, signup, email-sending and demo endpoints
- **Helmet** security headers, strict CORS with credentials, 10 KB body limit
- **Uploads:** images are re-encoded by Sharp (real-image check, metadata stripped), random filenames, 2 MB limit
- **Transactions** for signup, invite acceptance and workspace deletion, with row locks for the last-admin rule

---

## Project structure

```
saas-dashboard/
├── frontend/              React + Vite app
│   └── src/
│       ├── components/    layout, charts, ui
│       ├── context/       AuthContext
│       ├── hooks/         useAuth
│       ├── pages/         auth, dashboard, team, workspace, settings
│       ├── routes/        AppRoutes, ProtectedRoute, RoleRoute
│       ├── services/      API layer (axios)
│       └── utils/
└── backend/               Express API
    ├── db/                schema.sql, seeds/
    └── src/
        ├── config/        env, database pool
        ├── controllers/
        ├── middleware/    auth, roles, validation, rate limits, errors
        ├── models/        SQL queries
        ├── routes/
        ├── services/      tokens, email
        ├── utils/
        └── validators/    Zod schemas
```

---

## Getting started

**Requirements:** Node.js 18.11 or newer, PostgreSQL 13 or newer.

### 1. Clone and install

```bash
git clone YOUR_REPO_URL
cd saas-dashboard

cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Create the database

Create an empty database named `saas_dashboard` (pgAdmin or `createdb saas_dashboard`), then run `backend/db/schema.sql` against it.

### 3. Configure the backend

Copy `backend/.env.example` to `backend/.env` and fill it in:

```
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/saas_dashboard
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=SaaSBoard <no-reply@saasboard.local>
```

Generate each secret (run twice, use different values):

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

If `SMTP_HOST` is empty, emails are **printed in the backend terminal** instead of sent, so you can test the full flow without an email provider.

### 4. Configure the frontend

Create `frontend/.env`:

```
VITE_API_URL=http://localhost:5000/api
```

### 5. Run it

```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev
```

Open http://localhost:5173. Use **Try the demo**, or sign up and copy the verification link from the backend terminal.

### Optional: sample data for your own account

Edit the email at the top of `backend/db/seeds/seed.sql` and run it in your database tool.

---

## API overview

All routes are under `/api`. "Auth" means a valid access token is required.

| Method | Endpoint | Access |
|---|---|---|
| POST | `/auth/signup` | Public |
| POST | `/auth/login` | Public |
| POST | `/auth/logout` | Public |
| POST | `/auth/refresh` | Refresh cookie |
| GET | `/auth/me` | Auth |
| POST | `/auth/verify-email` | Public |
| POST | `/auth/resend-verification` | Public |
| POST | `/auth/forgot-password` | Public |
| POST | `/auth/reset-password` | Public |
| POST | `/auth/demo` | Public |
| PATCH | `/users/me` | Auth |
| PATCH | `/users/me/password` | Auth |
| GET / PATCH | `/users/me/settings` | Auth |
| POST / DELETE | `/users/me/avatar` | Auth |
| GET | `/team/members` | Auth |
| PATCH | `/team/members/:id/role` | Admin |
| DELETE | `/team/members/:id` | Admin |
| GET / POST | `/team/invites` | Admin |
| POST | `/team/invites/:id/resend` | Admin |
| DELETE | `/team/invites/:id` | Admin |
| GET | `/team/invites/details/:token` | Public |
| POST | `/team/invites/accept` | Auth |
| GET / PATCH / DELETE | `/workspace` | Admin (delete: owner only) |
| GET | `/dashboard/stats` | Auth |
| GET | `/dashboard/activity?range=30d` | Auth |
| GET | `/dashboard/tasks-by-status` | Auth |
| GET | `/dashboard/recent?limit=10` | Auth |
| GET | `/dashboard/projects` | Auth |

---

## Deployment notes

- Set `NODE_ENV=production`, strong unique JWT secrets, and a real `CLIENT_URL` (it builds the links in emails).
- Behind a proxy (Render, Railway, Nginx), enable `app.set("trust proxy", 1)` in `backend/src/app.js`.
- If the frontend and backend are on **different domains**, change the refresh cookie to `sameSite: "none"` with `secure: true` (HTTPS) in `token.service.js`.
- Uploaded avatars are stored on local disk. On hosts with ephemeral disks, switch to object storage (S3, R2, etc.).
- Use an email provider with a verified sending domain, and a database with automatic backups.

---

## Known limitations and roadmap

- Each user belongs to one workspace (no multi-workspace memberships yet)
- Projects and tasks are display data on the dashboard; there is no project and task management UI yet
- No billing or subscription plans yet
- Possible next steps: two-factor authentication, audit log page, member avatars in the Team list, automated tests

---

## License

MIT.