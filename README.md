# Sweety – Blood Glucose Tracker 🩸

[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-red.svg)](https://redis.io/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-25%20Backend%20%2B%204%20Frontend%20Passed-emerald.svg)]()

> Engineering Assignment Submission for **Full Stack Developer – JavaScript & AI** at **Kenpath**.  
> Candidate: **Mayur Murarka**

Sweety is an enterprise-grade full-stack blood glucose tracking and clinical reporting web application built with Node.js, Express, PostgreSQL, Redis, and React. It empowers diabetes patients to track up to 4 daily glucose entries across clinical slots, prevents duplicate readings with strict clinical business rules, generates daily, month-to-date, and previous-month summary reports, and provides an end-to-end Doctor Portal for endocrinologists.

---

## 📑 Table of Contents
1. [Features](#-features)
2. [Tech Stack](#-tech-stack)
3. [Architecture & Project Structure](#-architecture--project-structure)
4. [Prerequisites](#-prerequisites)
5. [Getting Started & Installation](#-getting-started--installation)
6. [Database Setup & Seeding](#-database-setup--seeding)
7. [Running the Application](#-running-the-application)
8. [Running Tests](#-running-tests)
9. [Docker Setup](#-docker-setup-bonus)
10. [API Documentation](#-api-documentation)
11. [Clinical Validation Rules](#-clinical-validation-rules)
12. [Notes, Assumptions & Future Improvements](#-notes-assumptions--future-improvements)

---

## 🌟 Features

### 1. Authentication & Security
- **Registration & Login**: Secure account creation with name, email, and password.
- **Bcrypt Hashing**: Passwords are securely hashed with bcrypt (salt rounds: 10) before storage; plain text is never persisted.
- **Tenant Isolation**: Strict user-scoping on all database queries. Users can only access, modify, and delete their own readings.
- **JWT Authentication**: Signed Bearer token authentication with 7-day expiration.
- **One-Click Demo Login**: Pre-seeded demo evaluator access (`demo@kenpath.com` / `Password123!`).

### 2. Blood Glucose Tracking (CRUD)
- Log up to 4 readings per day corresponding to clinical slots:
  - `Morning (fasting)`
  - `After breakfast`
  - `After lunch`
  - `After dinner`
- **Full CRUD**: Add readings, view paginated table, edit existing entries without slot self-conflict, and delete with confirmation.
- **Color-Coded Status Tags**:
  - `Low`: < 70 mg/dl (Hypoglycemia alert)
  - `Normal`: 70 – 140 mg/dl (Target glycemic range)
  - `Elevated`: 141 – 180 mg/dl
  - `High`: > 180 mg/dl

### 3. Reports & Analytics
- **Daily Report**: Selected date's highest, lowest, average reading (rounded to 1 decimal place), count, and a slot-by-slot breakdown.
- **Month-to-Date Report**: From the 1st of the month to the selected date.
- **Monthly Report**: The complete previous month (e.g., if selecting 15 Oct 2026, calculates 1 Sep – 30 Sep 2026).
- **Friendly Empty States**: Helpful fallback messaging if no readings exist for any timeframe.
- **Date Selector**: Allows exploring any historical or current date.

### 4. Implemented Bonus Tasks (All 7 Completed to Senior Standard)
- 🚀 **1. Pagination on Readings**: `GET /api/readings?page=1&limit=20` with page controls, total entry counters, and limit parameters.
- 📈 **2. Recharts Glucose Trend Line Chart**: Visualizes month readings with clinical target zones (70–140 mg/dl normal boundary shading).
- 🐳 **3. Docker Compose Orchestration**: Multi-container `docker-compose.yml` spinning up PostgreSQL 16, Redis 7, Express API backend, and Vite/Nginx frontend.
- 🧪 **4. Frontend Tests with React Testing Library**: Component validation testing covering all 5 input boundary conditions, empty submission prevention, and submission handling.
- ⚡ **5. Redis Report Caching & Invalidation**: High-throughput Redis caching (`ioredis`) for heavy statistical report queries, automatically invalidated whenever readings are created, updated, or deleted. Visible with interactive `⚡ Redis Cached` badge in the UI.
- ⏰ **6. BullMQ Background Reminder Queue**: Queue and worker job evaluating patient daily compliance and logging alert reminders for patients with fewer than 4 readings.
- 🩺 **7. Doctor Role & RBAC Portal**: Role-based access control with `doctor` role, `/api/doctor/patients`, and dedicated Doctor Portal UI allowing physicians to review glucose charts, reports, and readings for assigned patients.

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Recharts, Vitest, React Testing Library |
| **Backend** | Node.js, Express.js, PostgreSQL (`pg`), Redis (`ioredis`), BullMQ, `pg-mem` (test emulator), JWT, `bcryptjs` |
| **Database & Cache** | PostgreSQL 16 (Relational tables, foreign keys, unique composite constraints, indexes), Redis 7 (In-memory cache & queue broker) |
| **DevOps** | Docker, Docker Compose, Multi-stage Dockerfile, Nginx |

---

## 📂 Architecture & Project Structure

```
sweety/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js             # PostgreSQL connection pool & in-memory fallback (pg-mem)
│   │   │   ├── env.js            # Environment configuration
│   │   │   └── redis.js          # Redis client, caching helpers & ioredis-mock fallback
│   │   ├── controllers/
│   │   │   ├── authController.js    # Auth HTTP request handlers
│   │   │   ├── doctorController.js  # Doctor portal & patient reporting handlers
│   │   │   ├── readingController.js # Reading CRUD request handlers
│   │   │   └── reportController.js  # Report generation handlers with Redis cache
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT Bearer token verification
│   │   │   ├── rbac.js           # Role-based access control (e.g. requireRole('doctor'))
│   │   │   └── errorHandler.js   # Centralized error handler
│   │   ├── queue/
│   │   │   └── reminderQueue.js  # BullMQ daily compliance reminder queue & worker
│   │   ├── routes/
│   │   │   ├── authRoutes.js     # /api/auth
│   │   │   ├── doctorRoutes.js   # /api/doctor
│   │   │   ├── readingRoutes.js  # /api/readings
│   │   │   ├── reminderRoutes.js # /api/reminders
│   │   │   └── reportRoutes.js   # /api/reports
│   │   ├── services/
│   │   │   ├── authService.js    # Authentication business logic
│   │   │   ├── readingService.js # Validation & reading persistence
│   │   │   └── reportService.js  # Statistical aggregations (Daily/MTD/Monthly)
│   │   ├── utils/
│   │   │   └── validation.js     # Exact validation rules & error message formatters
│   │   ├── db/
│   │   │   ├── schema.sql        # PostgreSQL DDL with users, readings, doctor_patients
│   │   │   ├── migrate.js        # Migration runner
│   │   │   └── seed.js           # Realistic data seeder (190+ readings + Doctor account)
│   │   ├── app.js                # Express app setup (exportable for tests)
│   │   └── server.js             # Server startup
│   ├── tests/
│   │   ├── auth.test.js          # Registration, login, password hashing tests
│   │   ├── readings.test.js      # All 5 validation rules & CRUD tests
│   │   ├── reports.test.js       # Statistical math & empty states tests
│   │   └── bonus.test.js         # Redis cache, BullMQ job, and Doctor RBAC tests
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Alert.jsx
│   │   │   ├── GlucoseChart.jsx     # Recharts continuous monthly line trend
│   │   │   ├── Navbar.jsx           # Role-aware navigation (Patient Dashboard / Doctor Portal)
│   │   │   ├── ReadingForm.jsx      # Clinical entry form with instant validation
│   │   │   ├── ReadingList.jsx      # Paginated table with badge indicators
│   │   │   └── ReportCard.jsx       # Highest / Lowest / Average metrics + Redis indicator
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Auth provider & persistent session with role
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx    # Patient glucose logging dashboard
│   │   │   ├── DoctorPortalPage.jsx # Doctor patient roster & clinical report view
│   │   │   ├── LoginPage.jsx        # Login with quick Demo Patient & Demo Doctor buttons
│   │   │   ├── RegisterPage.jsx     # Patient / Doctor account registration
│   │   │   └── ReportsPage.jsx      # Daily, MTD, and Monthly clinical reports
│   │   ├── services/
│   │   │   └── api.js               # Standardized Axios/Fetch client
│   │   ├── tests/
│   │   │   └── ReadingForm.test.jsx # React Testing Library form validation
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── docker-compose.yml               # Multi-container orchestration (Postgres + Redis + API + UI)
├── package.json                     # Root monorepo scripts
├── .gitignore
└── README.md
```

---

## ⚡ Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18.x or v20.x+)
- [npm](https://www.npmjs.com/) (v9.x+)
- *(Optional)* [Docker & Docker Compose](https://www.docker.com/) for containerized execution.

> **Zero-Friction Local Evaluation Note:**  
> The backend includes a smart database adapter. If you do not have a PostgreSQL server running locally, the backend automatically boots an in-memory PostgreSQL engine (`pg-mem`) so you can run and evaluate the application immediately without installing or configuring external services!

---

## 🚀 Getting Started & Installation

### Option A: Quick Monorepo Setup (Recommended)

1. **Clone the repository**:
   ```bash
   git clone <YOUR_GITHUB_REPO_URL>
   cd sweety
   ```

2. **Install all dependencies** (installs both backend & frontend packages):
   ```bash
   npm run install:all
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` in both folders:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

---

## 🗄 Database Setup & Seeding

### 1. Migrations
Run schema migrations to set up the `users` and `readings` tables:
```bash
npm run migrate
# or: cd backend && npm run migrate
```

### 2. Seed Demo Data
To populate the database with a test user, assigned doctor, and 190+ historical glucose readings spread across the current and previous months:
```bash
npm run seed
# or: cd backend && npm run seed
```

*(Note: In local memory mode, the backend automatically runs this seed on startup for instant zero-config testing!)*

**Pre-Configured Demo Accounts:**
- **Demo Patient:**
  - **Email:** `demo@kenpath.com`
  - **Password:** `Password123!`
  - *Loaded with 190+ readings across current & previous month to demonstrate reports, charts, and empty states.*
- **Demo Doctor:**
  - **Email:** `doctor@kenpath.com`
  - **Password:** `Password123!`
  - *Assigned to Demo Patient to immediately showcase the Doctor Portal & clinical report oversight.*

---

## 💻 Running the Application

Open two terminal windows:

### Terminal 1: Backend Server (Port 5000)
```bash
npm run start:backend
# or: cd backend && npm start
```
*Backend runs on `http://localhost:5000` (Health check at `http://localhost:5000/api/health`)*

### Terminal 2: Frontend Client (Port 3000)
```bash
npm run start:frontend
# or: cd frontend && npm run dev
```
*Frontend runs on `http://localhost:3000`*

---

## 🧪 Running Tests

### 1. Backend Tests (Jest & Supertest)
Runs **25 comprehensive integration tests** covering user registration, password hashing verification, token authorization, all 5 clinical validation edge cases, multi-tenant isolation, pagination, Redis caching & invalidation, BullMQ daily compliance checks, and Doctor role RBAC:
```bash
npm run test:backend
# or: cd backend && npm test
```

### 2. Frontend Tests (React Testing Library & Vitest)
Runs tests verifying reading form validation rules, required inputs, range constraints (40–600 mg/dl), future date rejection, and valid submission:
```bash
npm run test:frontend
# or: cd frontend && npm test
```

### 3. Run All Tests
```bash
npm test
```

---

## 🐳 Docker Setup (Bonus)

To run the entire stack (PostgreSQL 16 + Redis 7 + Express API + Nginx React Frontend) in isolated Docker containers:

```bash
docker compose up --build
```

- **Frontend:** `http://localhost:3000`
- **Backend:** `http://localhost:5000`
- **PostgreSQL:** Port `5432`
- **Redis:** Port `6379`

To shut down:
```bash
docker compose down -v
```

---

## 📡 API Documentation

### Auth Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new patient or doctor account (`name`, `email`, `password`, `role`) | No |
| `POST` | `/api/auth/login` | Sign in with email & password, returns JWT token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes (Bearer) |

### Readings Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/readings` | List user readings (supports `?page=1&limit=20`, `?date=YYYY-MM-DD`, `?month=YYYY-MM`) | Yes (Bearer) |
| `GET` | `/api/readings/:id` | Get single reading by ID | Yes (Bearer) |
| `POST` | `/api/readings` | Record new glucose reading (`date`, `slot`, `value`) | Yes (Bearer) |
| `PUT` | `/api/readings/:id` | Update reading (validates non-conflict) | Yes (Bearer) |
| `DELETE` | `/api/readings/:id` | Delete reading | Yes (Bearer) |

### Reports Endpoints (Redis Cached)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/reports?date=YYYY-MM-DD` | Returns Daily, Month-to-date, and Monthly (previous month) stats. Cached in Redis. | Yes (Bearer) |

### Doctor Portal Endpoints (Role-Based Access Control)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/doctor/patients` | List all assigned patients with recent reading date & entry count | Doctor Bearer |
| `GET` | `/api/doctor/patients/:patientId/reports` | View clinical glycemic reports for an assigned patient | Doctor Bearer |
| `POST` | `/api/doctor/assign` | Assign a patient to the authenticated doctor by patient ID | Doctor Bearer |

### Background Queue Endpoints (BullMQ)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/reminders/check` | Trigger BullMQ evaluation of daily compliance (<4 readings) | Bearer |

---

## 🛡 Clinical Validation Rules

The application strictly implements and validates the exact required rules on both frontend and backend:

| Rule | Trigger Condition | Exact Error Message |
|---|---|---|
| **Value is required** | `value` is null, undefined, or empty string | `"Please enter a glucose value."` |
| **Value range** | `value` < 40, > 600, or not a whole number | `"Value must be between 40 and 600 mg/dl."` |
| **Duplicate slot** | User already has an entry for that slot on that date | `"You already have an After lunch reading for this date."` *(dynamic per slot)* |
| **Maximum 4 per day** | Adding a reading on a date with 4 existing entries | `"You can add only 4 readings per day."` |
| **No future dates** | Selected `date` > today's date | `"Date cannot be in the future."` |

---

## 📝 Notes, Assumptions & Future Improvements

### Assumptions Made
1. **Definition of "Monthly Report"**: In accordance with the specification table (*"The whole previous month: Example (selected date 15 Oct 2026) -> 1 Sep – 30 Sep 2026"*), the monthly report dynamically calculates the entire calendar month preceding the selected date. This ensures clear comparison between current month-to-date and a closed historical month.
2. **Standard Glycemic Targets**: For UI visual badges, American Diabetes Association (ADA) standard reference levels were used:
   - Low (< 70 mg/dl)
   - Normal / In Target (70–140 mg/dl)
   - Elevated (141–180 mg/dl)
   - High (> 180 mg/dl)
3. **Database Portability**: To provide an evaluation experience that never crashes if a reviewer doesn't have a local PostgreSQL daemon running, the backend includes an automated fallback to `pg-mem` (an in-memory PostgreSQL engine). When PostgreSQL is available (via local service or Docker), it connects directly and runs full PostgreSQL DDL.
4. **Timezone Handling**: Dates are recorded and queried in `YYYY-MM-DD` ISO calendar format to avoid UTC midnight date-shifting across patient timezones.

### Senior Architectural Highlights & Decisions
1. **Multi-Tenant Data Isolation**: Every reading query enforces `WHERE user_id = $1` at the persistence repository layer, preventing IDOR (Insecure Direct Object Reference) vulnerabilities.
2. **Deterministic Redis Invalidation**: When any reading is inserted, updated, or removed, `invalidateUserReports(userId)` systematically purges all daily and monthly report keys for that patient, guaranteeing zero cache staleness.
3. **Role-Based Access Control (RBAC)**: Patients and Doctors are distinct security principles. Doctors can only view reports for patients explicitly linked to them via the `doctor_patients` relationship.
4. **Resilient Portability**: Evaluators can run the system anywhere—whether they have Postgres and Redis instances installed or just pure Node.js. Both `pg-mem` and `ioredis-mock` seamlessly emulate production services for frictionless local review.

### What I'd Improve With More Time (Production Roadmap)
1. **Healthcare Standards Integration (HL7 / FHIR)**: Export patient glycemic observations in standard FHIR `Observation` JSON schema for interoperability with hospital electronic health records (EHR).
2. **External Notification Dispatch**: Connect the BullMQ reminder worker to SendGrid (email) or Twilio (SMS/WhatsApp) to deliver actual compliance reminders to patients' phones.
3. **Continuous Glucose Monitor (CGM) Webhooks**: Ingest real-time glucose telemetry streams from Dexcom or Abbott FreeStyle Libre devices.
4. **Offline PWA Support**: Implement service workers and background sync so patients can log glucose readings without an active internet connection.

---

## 👨‍💻 Submission & Verification Checklist

- [x] Sign up and login with bcrypt hashed passwords
- [x] Multi-tenant isolation (patients only see their own readings)
- [x] CRUD operations for readings across 4 designated slots
- [x] Strict adherence to all 5 validation rules and exact error messages
- [x] Daily report (highest, lowest, average rounded to 1 decimal, count, slot breakdown)
- [x] Month-to-date report (1st of month to selected date)
- [x] Monthly report (whole previous month)
- [x] Friendly empty states when no readings exist
- [x] **Bonus 1:** Pagination on `GET /readings (?page=1&limit=20)` with UI page controls
- [x] **Bonus 2:** Visual trend chart using Recharts with target glycemic zones
- [x] **Bonus 3:** Docker `docker-compose.yml` (PostgreSQL 16 + Redis 7 + Express + Nginx React)
- [x] **Bonus 4:** 4 Frontend tests with React Testing Library & Vitest
- [x] **Bonus 5:** Redis report caching with automated invalidation on reading mutations
- [x] **Bonus 6:** Background queue worker with BullMQ for daily compliance reminders (<4 readings)
- [x] **Bonus 7:** Doctor Role & RBAC (`/api/doctor/patients`, Doctor Portal UI)
- [x] Seed script with demo credentials (`demo@kenpath.com` & `doctor@kenpath.com` / `Password123!`)
- [x] 25 Backend integration tests with Jest & Supertest
- [x] Clean, semantic, incremental Git commit history
- [x] Public GitHub repository: `https://github.com/Mayur-Murarka/sweety-blood-glucose-tracker`
