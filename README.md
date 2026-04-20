# Driver Operations App

Production-style full-stack demo built with React, Express, Prisma, and PostgreSQL.

Full project documentation is available in [docs/Driver-Operations-App-Documentation.md](docs/Driver-Operations-App-Documentation.md).

## Features

- Driver authentication and role-based access
- Weekly shift claiming plus shift start and end tracking
- Daily vehicle inspections with photo upload
- Admin dashboard for shift management and inspection review
- PostgreSQL persistence with Prisma models and seed data
- Single deployable backend that serves the React build in production

## Stack

- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL, Prisma
- Auth: JWT + bcrypt

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Start PostgreSQL. If you have Docker:

```bash
docker compose up -d
```

3. Create `server/.env` from `server/.env.example`.

4. Sync schema and seed demo data:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

5. Start the app:

```bash
npm run dev
```

Client runs on `http://localhost:5173` and API runs on `http://localhost:4000`.

## Demo accounts

- Admin: `admin@driverops.dev` / `Admin@123`
- Driver: `driver1@driverops.dev` / `Driver@123`
- Driver: `driver2@driverops.dev` / `Driver@123`

## Production build

```bash
npm run build
npm start
```

The Express server serves the built frontend from `client/dist`.

## Deployment notes

- Provision a PostgreSQL database.
- Set `DATABASE_URL` and `JWT_SECRET` in `server/.env`.
- Run:

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run build
npm start
```
