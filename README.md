# Refinishing Department Production Management System

Daily production targets, hourly achievement, employee attendance, HOD overview, revenue analytics and Excel/CSV export, for the refinishing department.

**Stack:** Next.js 16 (App Router, server components + server actions) · TypeScript · Drizzle ORM · PostgreSQL on [Neon](https://neon.tech). There is no separate backend: pages query the database directly and mutations are server actions.

## Roles

| Role | Access |
|---|---|
| `scanning_supervisor` | Scanning production and history |
| `batch_supervisor` | Batch production and history |
| `dispatch_supervisor` | Attendance |
| `hod` | Read-only view of everything, HOD overview, revenue |
| `admin` | Everything, plus user management |

## Setup

```bash
npm install
cp .env.example .env.local      # fill in DATABASE_URL and JWT_SECRET
npm run db:migrate              # create tables
npm run db:seed                 # demo users + 50-person roster (idempotent)
# production: SEED_RANDOM_PASSWORDS=1 npm run db:seed   (random passwords, printed once)
npm run dev                     # http://localhost:3000
```

Demo logins (change them from the Admin screen): `scan.supervisor / Scan@123`, `batch.supervisor / Batch@123`, `dispatch.supervisor / Dispatch@123`, `hod / HOD@123`, `admin / Admin@123`.

## Database

Schema lives in `src/db/schema.ts`. After changing it: `npm run db:generate` then `npm run db:migrate`.

- `production_days` (one row per module per date) and `hourly_entries`. Totals, pending and percentages are always derived, never stored.
- `employees` and `attendance` (a missing attendance row means "unmarked").
- `users` (bcrypt hashes; sessions are a signed httpOnly cookie, re-checked against the DB on every request).

## Deploy to Vercel

1. Create a Neon project and copy the **pooled** connection string.
2. Run `npm run db:migrate` and `SEED_RANDOM_PASSWORDS=1 npm run db:seed` once with that `DATABASE_URL` in `.env.local`; note the printed passwords.
3. Import the repo in Vercel and set `DATABASE_URL` and `JWT_SECRET` (`openssl rand -base64 48`).

"Today" and shift hours use the plant time zone `Asia/Kolkata` (`src/lib/constants.ts`, along with the shift schedule, unit price and output targets).
