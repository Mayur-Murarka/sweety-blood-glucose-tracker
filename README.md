# Sweety – Blood Glucose Tracker 🩸

[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-19%20Backend%20%2B%204%20Frontend%20Passed-emerald.svg)]()

> Engineering Assignment Submission for **Junior Full Stack Developer – JavaScript & AI** at **Kenpath**.  
> Candidate: **Mayur Murarka**

Sweety is a full-stack web application designed for diabetes patients to record up to 4 blood glucose readings per day across designated time slots, prevent clinical duplicate entries, and generate daily, month-to-date, and previous-month summary reports and visual trends.

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

### 4. Implemented Bonus Features
- 🚀 **Pagination**: `GET /api/readings?page=1&limit=20` with responsive UI pagination controls.
- 📈 **Recharts Line Chart**: Continuous blood glucose trend over the month with target boundaries (70–140 mg/dl).
- 🐳 **Docker Compose**: Production-ready `docker-compose.yml` orchestrating PostgreSQL 16, Express API, and Nginx React frontend.
- 🧪 **Automated Testing**:
  - **19 Backend Integration Tests** with Jest & Supertest.
  - **4 Frontend Unit & Validation Tests** with React Testing Library & Vitest.
- 🌱 **Automated Database Seeding**: Pre-populates 190+ realistic readings across current and previous months.

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Recharts, Vitest, React Testing Library |
| **Backend** | Node.js, Express.js, PostgreSQL (`pg`), `pg-mem` (in-memory test adapter), JWT, `bcryptjs` |
| **Database** | PostgreSQL 16 (Relational tables, foreign keys, unique composite constraints, indexes) |
| **DevOps** | Docker, Docker Compose, Multi-stage Dockerfile, Nginx |

---

## 📂 Architecture & Project Structure

```
sweety/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js             # PostgreSQL connection pool & in-memory fallback
│   │   │   └── env.js            # Environment configuration
│   │   ├── controllers/
│   │   │   ├── authController.js    # Auth HTTP request handlers
│   │   │   ├── readingController.js # Reading CRUD request handlers
│   │   │   └── reportController.js  # Report generation handlers
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT Bearer token verification
│   │   │   └── errorHandler.js   # Centralized error handler
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── readingRoutes.js
│   │   │   └── reportRoutes.js
│   │   ├── services/
│   │   │   ├── authService.js    # Authentication business logic
│   │   │   ├── readingService.js # Validation & reading persistence
│   │   │   └── reportService.js  # Statistical aggregations (Daily/MTD/Monthly)
│   │   ├── utils/
│   │   │   └── validation.js     # Exact validation rules & error message formatters
│   │   ├── db/
│   │   │   ├── schema.sql        # PostgreSQL DDL
│   │   │   ├── migrate.js        # Migration runner
│   │   │   └── seed.js           # Realistic data seeder
│   │   ├── app.js                # Express app setup (exportable for tests)
│   │   └── server.js             # Server startup
│   ├── tests/
│   │   ├── auth.test.js          # Registration, login, password hashing tests
│   │   ├── readings.test.js      # All 5 validation rules & CRUD tests
│   │   └── reports.test.js       # Statistical math & empty states tests
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Alert.jsx
│   │   │   ├── GlucoseChart.jsx  # Recharts line trend
│   │   │   ├── Navbar.jsx
│   │   │   ├── ReadingForm.jsx   # Clinical entry form with instant validation
│   │   │   ├── ReadingList.jsx   # Paginated table with badge indicators
│   │   │   └── ReportCard.jsx    # Highest / Lowest / Average metrics
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Auth provider & persistent session
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx # Main tracking dashboard
│   │   │   ├── LoginPage.jsx     # Login with demo button
│   │   │   ├── RegisterPage.jsx  # New user registration
│   │   │   └── ReportsPage.jsx   # Daily, MTD, and Monthly reports
│   │   ├── services/
│   │   │   └── api.js            # Standardized fetch wrapper
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
├── docker-compose.yml            # Multi-container orchestration
├── package.json                  # Root monorepo scripts
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
To populate the database with a test user and 190+ historical glucose readings spread across the current and previous months:
```bash
npm run seed
# or: cd backend && npm run seed
```

**Seed Credentials:**
- **Email:** `demo@kenpath.com`
- **Password:** `Password123!`

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
Runs 19 integration tests covering user registration, password hashing verification, token authorization, all 5 clinical validation edge cases, multi-tenant isolation, pagination, and statistical calculations:
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

To run the entire stack (PostgreSQL 16 + Express API + Nginx React Frontend) in isolated Docker containers:

```bash
docker compose up --build
```

- **Frontend:** `http://localhost:3000`
- **Backend:** `http://localhost:5000`
- **PostgreSQL:** Port `5432`

To shut down:
```bash
docker compose down -v
```

---

## 📡 API Documentation

### Auth Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new patient account (`name`, `email`, `password`) | No |
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

### Reports Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/reports?date=YYYY-MM-DD` | Returns Daily, Month-to-date, and Monthly (previous month) stats | Yes (Bearer) |

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

### What I'd Improve With More Time
1. **Doctor / Clinician Portal (RBAC)**: Implement a `Doctor` role with patient invite codes so endocrinologists can review patient glycemic logs and add clinical notes.
2. **Automated Reminders & Background Queue (BullMQ + Redis)**: Schedule a cron reminder job at 20:00 every evening to notify patients who have logged fewer than 3 readings that day.
3. **Export Features**: One-click PDF / CSV export of monthly reports formatted for physician consultations.
4. **Offline PWA Support**: Implement service workers and IndexedDB sync so patients can log glucose readings even without an active internet connection.

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
- [x] Pagination on `GET /readings (?page=1&limit=20)`
- [x] Visual trend chart using Recharts
- [x] Docker `docker-compose.yml` (Postgres + Backend + Frontend)
- [x] Seed script with demo credentials (`demo@kenpath.com` / `Password123!`)
- [x] 19 Backend integration tests with Jest & Supertest
- [x] 4 Frontend tests with React Testing Library
- [x] Clean commit history
