# Driver Operations App

## Functional and Technical Documentation

## 1. Project Summary

The Driver Operations App is a full-stack internal operations system built to support driver scheduling, live shift execution, vehicle inspection capture, and administrative oversight.

The application was designed as an internal workflow platform for logistics or transport operations where drivers need to:

- authenticate securely
- view and claim available shifts
- start and end assigned work
- submit daily vehicle inspection reports with a photo

The system also provides an admin workspace to:

- monitor driver activity
- review upcoming shift coverage
- create new shifts
- review and update inspection outcomes

This project is production-oriented rather than prototype-oriented. It uses a structured frontend, backend, database schema, authentication layer, seeded demo accounts, and a deployment-ready build flow.

## 2. Business Objective

The purpose of the system is to digitize common driver operations workflows that are often managed manually through spreadsheets, chat messages, or paper inspection forms.

The main business goals are:

- reduce scheduling friction by allowing drivers to claim shifts directly
- improve operational visibility through live shift status tracking
- enforce inspection compliance before shift completion
- provide admins with a centralized operational dashboard
- maintain a persistent audit trail of claims, inspections, and review decisions

## 3. User Roles

### 3.1 Driver

Drivers can:

- self-register for a driver account
- log in with role-based access
- view shifts available over the next 7 days
- claim open shifts
- start a claimed shift
- submit a vehicle inspection while the shift is active
- upload an inspection photo
- end a shift only after inspection submission
- view inspection review status and admin notes

### 3.2 Admin

Admins can:

- register for an admin account using an internal admin code
- log in with admin access
- view operational summary metrics
- monitor driver activity and inspection status
- create new shifts
- review recently submitted inspections
- approve, flag, or reset inspection review status
- add review notes to inspections

## 4. Functional Scope

### 4.1 Authentication

- Users can register as `DRIVER` directly through the registration page.
- Users can register as `ADMIN` only when they provide the required internal admin code.
- Users log in with email and password.
- Passwords are stored as hashed values using `bcryptjs`.
- On successful login, the backend issues a JWT valid for 7 days.
- The frontend stores the token in `localStorage`.
- Protected routes redirect users to the correct dashboard based on role.
- Browser tab titles are route-aware and update automatically for login, register, driver, and admin pages.

### 4.2 Driver Shift Management

- Drivers can see all shifts scheduled from today through the next 7-day window.
- Each shift shows title, date, time, location, notes, and remaining capacity.
- A driver can claim a shift only once.
- A shift cannot be claimed beyond its capacity.

### 4.3 Shift Lifecycle

The shift workflow is intentionally sequential:

1. Shift is claimed
2. Driver starts shift
3. Driver submits vehicle inspection
4. Driver ends shift

Business rules:

- only a `CLAIMED` shift can be started
- only a `STARTED` shift can receive an inspection
- only a `STARTED` shift with an inspection can be completed

### 4.4 Vehicle Inspection Workflow

Each inspection contains:

- vehicle number
- mileage
- fuel percentage
- cleanliness score from 1 to 5
- issue notes
- uploaded photo

Functional rules:

- photo upload is mandatory
- only one inspection is allowed per claimed shift
- inspection review status starts as `PENDING`

### 4.5 Admin Dashboard

The admin dashboard includes:

- total drivers
- open shift slots
- pending inspections
- active shifts

It also includes:

- driver roster summary
- upcoming shift coverage
- recent inspection review queue

### 4.6 Shift Creation

Admins can create shifts with:

- title
- date
- start time
- end time
- location
- capacity
- notes

The backend also supports shift updates through an API endpoint, although the current UI focuses on creation and inspection review rather than full shift editing.

### 4.7 Inspection Review

Admins can review inspections and mark them as:

- `PENDING`
- `APPROVED`
- `FLAGGED`

Admins can also attach review notes visible to drivers in the inspection summary.

## 5. Key User Journeys

### 5.1 Driver Journey

1. Driver logs in
2. Driver sees upcoming shifts
3. Driver claims a shift
4. Driver starts the shift
5. Driver fills in inspection details and uploads a photo
6. Driver ends the shift
7. Driver later sees inspection review result and admin notes

### 5.2 Admin Journey

1. Admin logs in
2. Admin reviews dashboard metrics
3. Admin creates new shifts if coverage is low
4. Admin checks recent inspection submissions
5. Admin approves or flags inspections
6. Admin monitors which drivers are active or completed

## 6. System Architecture

## 6.1 High-Level Architecture

The project follows a standard three-layer architecture:

- React frontend
- Express API backend
- PostgreSQL database

The frontend communicates with the backend over REST APIs.
The backend handles authentication, validation, business rules, and persistence.
The database stores users, shifts, claims, and inspections.

In production, the Express server also serves the built React application from `client/dist`.

## 6.2 Monorepo Structure

```text
Shiva Project/
  client/        React + TypeScript frontend
  server/        Express + TypeScript API + Prisma
  docs/          Documentation
  package.json   Workspace scripts
```

## 6.3 Frontend Architecture

Frontend stack:

- React 19
- TypeScript
- Vite
- React Router

Main frontend responsibilities:

- login flow
- role-aware route protection
- dashboard rendering
- shift actions
- inspection form submission
- admin review actions

Important frontend design choices:

- JWT token is stored in `localStorage`
- API requests are centralized through `apiRequest`
- authentication state is managed through React context
- route access is enforced with `ProtectedRoute`
- document titles are updated per page for cleaner browser branding
- a custom SVG favicon is used to reinforce the app identity in the browser tab

Frontend pages:

- `LoginPage`
- `RegisterPage`
- `DriverDashboard`
- `AdminDashboard`

## 6.4 Backend Architecture

Backend stack:

- Node.js
- Express 5
- TypeScript
- Prisma 7
- PostgreSQL

Main backend responsibilities:

- authentication
- role enforcement
- request validation
- file handling for uploaded inspection photos
- business workflow enforcement
- database persistence

Middleware and support libraries:

- `helmet` for HTTP hardening
- `cors` for allowed frontend origin handling
- `morgan` for request logging
- `zod` for request validation
- `multer` for multipart file uploads

## 7. Database Design

The system uses PostgreSQL with Prisma ORM.

### 7.1 Core Entities

#### User

Stores account information for both admins and drivers.

Key fields:

- `id`
- `name`
- `email`
- `passwordHash`
- `role`
- `createdAt`

#### Shift

Represents an available work assignment.

Key fields:

- `id`
- `title`
- `date`
- `startTime`
- `endTime`
- `location`
- `capacity`
- `notes`

#### ShiftClaim

Represents a driver claiming a specific shift.

Key fields:

- `shiftId`
- `driverId`
- `status`
- `claimedAt`
- `startedAt`
- `endedAt`

Important rule:

- one driver can claim a given shift only once through the unique constraint on `shiftId + driverId`

#### VehicleInspection

Represents a daily inspection linked one-to-one with a shift claim.

Key fields:

- `claimId`
- `driverId`
- `vehicleNumber`
- `mileage`
- `fuelPercent`
- `cleanliness`
- `issues`
- `reviewStatus`
- `reviewNotes`
- `photoData`
- `photoMimeType`
- `submittedAt`

Important rule:

- one shift claim can have only one inspection through the unique constraint on `claimId`

### 7.2 Data Relationships

- one `User` can have many `ShiftClaim` records
- one `Shift` can have many `ShiftClaim` records
- one `ShiftClaim` belongs to one `User`
- one `ShiftClaim` belongs to one `Shift`
- one `ShiftClaim` can have one `VehicleInspection`
- one `VehicleInspection` belongs to one `User`

### 7.3 Why Photo Data Is Stored In The Database

Inspection photos are stored in PostgreSQL as binary data instead of being written to a local uploads folder.

This was chosen to:

- simplify deployment
- avoid local filesystem dependencies
- keep the demo self-contained
- make inspection records portable with the database

For a larger production system, this could be migrated to object storage such as S3 or Cloudinary.

## 8. Authentication and Authorization

### 8.1 Authentication Flow

1. User submits email and password to `/api/auth/login`
2. Backend validates credentials against stored hash
3. Backend signs JWT with user id, email, name, and role
4. Frontend stores the token in `localStorage`
5. Frontend calls `/api/auth/me` to restore session on reload

### 8.2 Authorization Model

Role-based access is enforced through middleware:

- `requireAuth`
- `requireRole("DRIVER")`
- `requireRole("ADMIN")`

This ensures:

- drivers cannot access admin routes
- admins cannot use driver-only action endpoints

## 9. API Design

All primary APIs are exposed under `/api`.

### 9.1 Health

- `GET /api/health`
  - Returns service health confirmation

### 9.2 Auth APIs

- `POST /api/auth/register`
  - Registers a new driver or admin account and returns JWT plus user profile

- `POST /api/auth/login`
  - Authenticates a user and returns JWT plus user profile

- `GET /api/auth/me`
  - Returns the authenticated user profile

### 9.3 Driver APIs

- `GET /api/driver/dashboard`
  - Returns available shifts, the driver's claims, and dashboard stats

- `POST /api/driver/shifts/:shiftId/claim`
  - Claims a shift if capacity is available

- `POST /api/driver/claims/:claimId/start`
  - Marks a claimed shift as started

- `POST /api/driver/claims/:claimId/inspection`
  - Submits a multipart inspection form with uploaded photo

- `POST /api/driver/claims/:claimId/end`
  - Completes a shift after inspection exists

### 9.4 Admin APIs

- `GET /api/admin/dashboard`
  - Returns admin overview, drivers, shifts, inspections, and recent claims

- `POST /api/admin/shifts`
  - Creates a new shift

- `PATCH /api/admin/shifts/:shiftId`
  - Updates an existing shift

- `PATCH /api/admin/inspections/:inspectionId/review`
  - Updates inspection review status and notes

### 9.5 Inspection Photo API

- `GET /api/inspections/:inspectionId/photo`
  - Streams the inspection image directly from database storage

## 10. Validation and Business Rule Enforcement

Validation is implemented with `zod` and backend business logic.

Examples:

- login requires a valid email and non-empty password
- shift capacity must be between 1 and 10 when created through admin APIs
- mileage must be a non-negative integer
- fuel percentage must be between 0 and 100
- cleanliness must be between 1 and 5
- inspection notes are limited in length
- uploaded image size is limited to 5 MB

Workflow enforcement is handled on the backend, not just in the UI.
This is important because it keeps rules reliable even if the frontend is bypassed.

## 11. UI and UX Notes

The interface is intentionally split into two workspaces:

- driver workspace
- admin operations dashboard

UI characteristics:

- role-aware login redirect
- self-registration for drivers and protected registration for admins
- actionable status badges
- clear operational panels
- success and error state messaging
- mobile-friendly responsive layout
- custom favicon and browser title branding

The visual direction uses:

- minimalist typography
- soft neutral surfaces
- restrained operational dashboard layout
- responsive grid sections

## 12. Seed Data and Demo Readiness

The application includes seeded demo data so it can be shown immediately in interviews or demos.

Seeded accounts:

- Admin: `admin@driverops.dev` / `Admin@123`
- Driver: `driver1@driverops.dev` / `Driver@123`
- Driver: `driver2@driverops.dev` / `Driver@123`

Seeded content:

- multiple upcoming shifts over the next several days
- realistic locations and notes
- role-separated user accounts

This makes the project demo-ready without manual data entry.

## 13. Deployment Model

### 13.1 Local Development

Commands:

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Default ports:

- frontend: `5173`
- backend: `4000`
- PostgreSQL: `5432`

### 13.2 Production Build

Commands:

```bash
npm run build
npm start
```

Production behavior:

- React app is built into `client/dist`
- Express serves static frontend assets
- API and frontend can be hosted together behind the same backend process

### 13.3 Environment Variables

Required backend environment variables:

- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `CLIENT_ORIGIN`

## 14. Security Considerations

Implemented:

- password hashing with bcrypt
- JWT-based authentication
- protected routes and role-based authorization
- backend-side validation with Zod
- file size limit on photo uploads
- secure middleware with Helmet

Current demo-oriented tradeoffs:

- JWT is stored in `localStorage`
- no refresh token rotation
- no rate limiting on login
- no audit log table

For a larger production deployment, recommended enhancements would include:

- HTTP-only cookie auth or token rotation
- rate limiting
- centralized audit logging
- object storage for images
- stronger monitoring and alerting

## 15. Known Limitations

This version is intentionally scoped as a focused internal operations demo.

Current limitations:

- no password reset flow
- no admin UI for editing existing shifts, even though the API supports updates
- no historical reporting screen beyond dashboard summaries
- no pagination for inspections and claims
- no external notification system
- inspection images are stored in the database, which is fine for demo scale but not ideal for high-volume production

## 16. Future Enhancements

Recommended next improvements:

- admin UI for editing and deleting shifts
- filtering and pagination for dashboards
- driver availability management
- notifications by email or WhatsApp
- recurring shift templates
- CSV or PDF report export
- object storage for photos
- activity/audit logs
- multi-location fleet management

## 17. Interview Talking Points

This project is strong to present because it demonstrates:

- full-stack ownership
- real workflow modeling instead of static CRUD only
- role-based access control
- API design and validation
- relational schema design
- production build and deployment readiness
- practical business-rule enforcement

If you explain it in an interview, a strong summary is:

> I built an internal driver operations platform where drivers can authenticate, claim shifts, track work status, submit vehicle inspections with photo evidence, and admins can monitor live operations and review compliance from a dashboard. The system uses React on the frontend, Express and TypeScript on the backend, Prisma as the data layer, and PostgreSQL for persistence.

## 18. Conclusion

The Driver Operations App is a complete internal operations workflow system that connects authentication, scheduling, shift execution, inspection compliance, and admin oversight in one deployable full-stack application.

It is technically credible, functionally demonstrable, and suitable for interview presentation as a real-world AI-assisted delivery project rather than a basic prototype.
