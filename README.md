# RentTogether — Campus Resource Sharing Platform

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Django](https://img.shields.io/badge/Django-5.1-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/DRF-3.15-A30000?logo=django&logoColor=white)](https://www.django-rest-framework.org/)
[![PostgreSQL](https://img.shields.io/badge/Neon%20Postgres-18-00E599?logo=postgresql&logoColor=white)](https://neon.tech/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-CDN-3448C5?logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel&logoColor=white)](https://renttogether.vercel.app/)
[![Render](https://img.shields.io/badge/Render-Deployed-46E3B7?logo=render&logoColor=black)](https://renttogether.onrender.com/)

**Share Smart. Save More. Live Better.**  
*An AI-powered, hyper-local peer-to-peer sharing economy and rental platform exclusively engineered for verified college campuses.*

[Explore Live Demo](https://renttogether.vercel.app/) · [Backend API Docs](https://renttogether.onrender.com/api/v1/health/) · [Report Bug](https://github.com/nittasamith1/RentTogether/issues)

</div>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Live Production Deployments](#-live-production-deployments)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Technology Stack](#-technology-stack)
- [Local Development Setup](#-local-development-setup)
  - [Prerequisites](#prerequisites)
  - [Backend Setup (Django API)](#1-backend-setup-django-api)
  - [Frontend Setup (React + Vite)](#2-frontend-setup-react--vite)
  - [Single-Command Docker Deployment](#3-single-command-docker-deployment)
- [Demo Credentials](#-demo-credentials-aditya-university)
- [Key Application Routes](#-key-application-routes)
- [Automated Testing Suite](#-automated-testing-suite)
- [Security & Performance Engineering](#-security--performance-engineering)
- [License](#-license)
- [Author & Acknowledgments](#-author--acknowledgments)

---

## 🎯 Overview

College students regularly spend substantial amounts of money purchasing items needed only temporarily—such as semester-specific textbooks, scientific calculators (e.g., Casio fx-991CW), drafters, lab aprons, high-end DSLR cameras for college fests, electronics testing kits, and camping gear. Concurrently, seniors and fellow peers have these exact items sitting idle in their hostel rooms.

**RentTogether** bridges this divide by providing a high-trust, intra-campus rental exchange. Designed strictly for closed institutional communities (**Aditya University** in Version 1), RentTogether enables students to monetize their underutilized gear while offering peers affordable access without predatory security deposits or friction.

### Version 1 Scope: Single-Campus High-Trust Network
- **Institutional Access:** Strict boundary access limited exclusively to active campus students.
- **Campus Email Enforced:** Registration restricted to institution-authorized domains (`@adityauniversity.in`, `@aditya.ac.in`).
- **Contextual Dual-Role Identity:** A single student account acts fluidly as an **Owner** (lending gear) and a **Renter** (borrowing gear) with unified dashboards.
- **Dual-Stage Identity Verification:** 6-digit email OTP followed by student ID card submission and manual Campus Administrator verification.
- **Physical Campus Meetup Hubs:** In-person handovers scheduled at verified campus landmarks (Central Library, Canteen, Gate 1).
- **In-Person Offline Cash (Zero-Deposit):** Direct student-to-student cash settlements with ₹0 platform fees and ₹0 security deposit.

---

## 🌐 Live Production Deployments

| Component | Platform | URL / Endpoint | Status |
|---|---|---|---|
| **Frontend Web App** | Vercel | [https://renttogether.vercel.app/](https://renttogether.vercel.app/) | ![Active](https://img.shields.io/badge/Status-Live-brightgreen) |
| **Backend REST API** | Render | [https://renttogether.onrender.com/](https://renttogether.onrender.com/) | ![Active](https://img.shields.io/badge/Status-Live-brightgreen) |
| **API Health Check** | Render | [https://renttogether.onrender.com/api/v1/health/](https://renttogether.onrender.com/api/v1/health/) | ![Healthy](https://img.shields.io/badge/Health-200%20OK-brightgreen) |
| **Database** | Neon Serverless | `PostgreSQL 18.6 (ap-southeast-1)` | ![Encrypted](https://img.shields.io/badge/Postgres-Neon%20SSL-blue) |
| **Media & Asset CDN** | Cloudinary | Global Multi-Region CDN | ![Optimized](https://img.shields.io/badge/CDN-Cloudinary-blueviolet) |

---

## ✨ Key Features

### 🎓 1. Institutional Identity & Verification Guardrails
- **Domain-Restricted Authentication:** Only institutional email addresses are permitted to create accounts.
- **Two-Tier Verification:** Email verification via time-limited 6-digit OTP combined with student physical ID card card upload and administrator review.
- **Trust Badges:** Verified students display institutional verification badges across all listings and public profiles.

### 📅 2. Real-Time Availability Calendar & Anti-Collision Engine
- **Visual Month/Week Calendar:** Color-coded availability calendar displaying booked dates, pending approvals, and instant open slots.
- **Zero Double-Bookings:** Concurrency-safe backend validation powered by PostgreSQL pessimistic row-level locking (`select_for_update(of=('self',))`) inside atomic transactions.
- **Dynamic Date Filtering:** Past dates and conflicting date ranges are automatically disabled in real time.

### 💵 3. In-Person Offline Cash & Zero-Deposit Model
- **No Escrow or Processing Fees:** Pure peer-to-peer cash exchange upon physical item receipt.
- **Zero Security Deposit (₹0.00):** Trust is enforced by institutional student ID verification rather than monetary collateral, keeping rentals accessible to all students.
- **Clear Financial Breakdowns:** Transparent rental rate summaries (`₹/day` and `₹/hour`) with zero hidden platform cuts.

### 🔐 4. Cryptographic Handover & Return Verification
- **Dual OTP / QR Code Protocol:** Handover and return transitions require cross-verification using 6-digit one-time passcodes or scannable QR tokens.
- **Photo Evidence Capture:** Students upload timestamped condition photos during pickup and return to ensure dispute-free handovers.

### ⭐ 5. Mutual Review & Trust Scoring System
- **Bidirectional Feedback:** Both Owner and Renter can rate and review each other following a completed return.
- **Transparent Reputation:** Public profile metrics display verified rental history, completed handovers, and average star ratings.

### 🔔 6. Notifications & Clean Storage Management
- **Instant System Alerts:** Timely in-app updates for booking requests, approvals, cancellations, and return deadlines.
- **Database Storage Cleanup:** Integrated option to clear read notifications and history logs to avoid database bloat.

### 📊 7. Campus Sustainability & Savings Analytics
- **Personal & University Metrics:** Real-time dashboards calculating total financial savings versus retail purchase cost.
- **Environmental Impact:** Tracks carbon footprint reduction through estimated $CO_2$ emissions avoided by renting instead of manufacturing new units.

### 🤖 8. AI-Assisted Fair Rental Price Engine
- Smart pricing suggestions based on item category, condition, retail price, and campus demand to prevent gouging and ensure fair rates.

---

## 🏗️ System Architecture

```mermaid
graph TD
    User["Student Browser (SPA)"] -->|HTTPS / REST API| Vercel["Vercel Edge CDN (React 18 + Vite)"]
    Vercel -->|JSON / JWT / CORS| Render["Render Web Service (Django 5 + Gunicorn)"]
    
    subgraph Backend Services
        Render --> Auth["SimpleJWT & Custom Auth"]
        Render --> Services["Availability & Booking Service Layer"]
        Render --> Pricing["AI Fair Price Engine"]
        Render --> Handover["QR / OTP Handover Service"]
    end

    Services -->|Pessimistic Locking / SSL| Neon["Neon Serverless PostgreSQL (v18)"]
    Render -->|Image Storage & Transformations| Cloudinary["Cloudinary CDN"]
```

---

## 📁 Project Structure

```text
RentTogether/
├── .github/                       # CI/CD Workflows & GitHub issue templates
├── backend/                       # Django 5 REST Framework Backend
│   ├── apps/
│   │   ├── accounts/              # Custom User, Institutional Verification, Student Profiles
│   │   ├── availability/          # Availability Rules, Blocks & Real-time Slots
│   │   ├── bookings/              # State Machine, Concurrency Locking, Handover & Returns
│   │   ├── listings/              # Item Listings, Categories, Image Uploads
│   │   ├── marketplace/           # Public Marketplace, Search & Advanced Filtering
│   │   ├── notifications/         # Notification System & History Cleanup
│   │   └── reviews/               # Bidirectional Ratings & Written Feedback
│   ├── config/                    # Django Settings, URLs, WSGI/ASGI configurations
│   ├── media/                     # Fallback local media storage
│   ├── Dockerfile                 # Multi-stage production container
│   ├── manage.py                  # Django CLI management entry point
│   └── requirements.txt           # Python dependencies (Django, DRF, psycopg2, gunicorn, etc.)
├── frontend/                      # React 18 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── components/            # Reusable UI Components (Cards, Modals, Forms, Calendar)
│   │   │   ├── bookings/          # Availability Calendar, Handover Modal, OTP inputs
│   │   │   ├── common/            # Navbar, Footer, Badge, Loading spinners
│   │   │   ├── marketplace/       # ItemCard, FilterBar, SearchBar, CategoryPill
│   │   │   └── reviews/           # RatingModal, StarRating, ReviewList
│   │   ├── context/               # AuthContext, NotificationContext, Theme
│   │   ├── hooks/                 # Custom React hooks (useBookings, useAvailability, etc.)
│   │   ├── pages/                 # Full Page Views (Dashboard, Marketplace, Rentals, Admin)
│   │   ├── services/              # Axios HTTP client, API service endpoints
│   │   └── types/                 # TypeScript interfaces and schema types
│   ├── index.html                 # Single Page Application HTML root
│   ├── package.json               # Node.js dependencies and scripts
│   ├── tailwind.config.js         # Custom Tailwind theme and design tokens
│   ├── tsconfig.json              # TypeScript compilation rules
│   └── vite.config.ts             # Vite build and proxy configuration
├── docker-compose.yml             # Full-stack local Docker container orchestrator
├── render.yaml                    # Render Cloud deployment blueprint
├── vercel.json                    # Vercel SPA routing and header configuration
├── LICENSE                        # MIT License
└── README.md                      # Comprehensive project documentation
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend UI / SPA** | React 18.3, TypeScript 5.5, Vite 5.4, Tailwind CSS 3.4, Lucide Icons, Headless UI |
| **State & Data Fetching** | TanStack Query (React Query v5), React Router DOM v6, Axios |
| **Backend Framework** | Python 3.12, Django 5.1, Django REST Framework 3.15, Django Filter |
| **Authentication & Tokens** | SimpleJWT (HMAC-SHA256, auto-refresh rotation), Django Crypto |
| **Database & Concurrency** | Neon Serverless PostgreSQL 18.6, Connection Pooling, `SELECT FOR UPDATE` Locking |
| **Image & Media Storage** | Cloudinary REST API / Python SDK with automatic image compression and WebP conversion |
| **Production Server** | Gunicorn 21.2 (WSGI HTTP Server), Nginx (Reverse Proxy & Static Asset Compression) |
| **Cloud Hosting** | Vercel (Frontend Global CDN), Render (Backend Python 3 Web Service) |

---

## 💻 Local Development Setup

### Prerequisites
- **Python:** `3.12` or higher
- **Node.js:** `20.x` or higher (`npm 10+`)
- **Git**

---

### 1. Backend Setup (Django API)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nittasamith1/RentTogether.git
   cd RentTogether
   ```

2. **Create and activate a virtual environment:**
   ```powershell
   # Windows PowerShell:
   python -m venv .venv
   .venv\Scripts\activate

   # macOS / Linux:
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**  
   Create a `.env` file in the `backend/` directory (or use default development SQLite):
   ```ini
   SECRET_KEY=django-insecure-local-dev-key
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   # Optional: Add DATABASE_URL to connect to Neon PostgreSQL:
   # DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
   ```

5. **Run database migrations & seed demo campus data:**
   ```bash
   python manage.py migrate
   python manage.py seed_phase01
   ```

6. **Start the development server:**
   ```bash
   python manage.py runserver
   ```
   *The backend API will be live at `http://localhost:8000/`*  
   *Health Check endpoint: `http://localhost:8000/api/v1/health/`*

---

### 2. Frontend Setup (React + Vite)

1. **Open a second terminal and navigate to `frontend/`:**
   ```bash
   cd frontend
   ```

2. **Install Node packages:**
   ```bash
   npm install
   ```

3. **Configure local environment:**  
   Create `frontend/.env.development`:
   ```ini
   VITE_API_BASE_URL=http://localhost:8000
   ```

4. **Start the Vite development server:**
   ```bash
   npm run dev
   ```
   *The client web application will be live at `http://localhost:5173/`*

---

### 3. Single-Command Docker Deployment

You can run the entire production-grade stack locally using Docker Compose:

```bash
docker compose up --build
```

- **Frontend SPA:** `http://localhost:5173/` (served via Nginx with HTTP compression & asset caching)
- **Backend API:** `http://localhost:8000/`
- **Health Check:** `http://localhost:8000/api/v1/health/`

---

## 🔑 Demo Credentials (Aditya University)

You can log in manually or use the **1-Click Demo Login** buttons on the Login page:

| Role | Email | Password | Access / Permissions |
|---|---|---|---|
| **Verified Student** | `sai.reddy@adityauniversity.in` | `StudentPassword123!` | Dashboard, Marketplace, Rentals, Bookings, Analytics |
| **Campus Admin** | `admin@adityauniversity.in` | `AdminPassword123!` | Student ID Verification & Approval Portal |

---

## 🗺️ Key Application Routes

| Path | Purpose |
|---|---|
| `/` | **Campus Dashboard:** Summary of active rentals, lending earnings, and campus sustainability |
| `/marketplace` | **Marketplace:** Search, category filters, hourly/daily pricing, real-time availability |
| `/listings` | **My Listed Gear:** Item management, toggle availability, edit prices, view rental history |
| `/rentals` | **Active Rentals:** Pickup OTP, return checklist, QR codes, and photo evidence upload |
| `/bookings` | **Booking Calendar:** Interactive booking schedule and conflict resolution |
| `/payments` | **In-Person Cash:** Receipts and transaction history for offline cash exchanges |
| `/analytics` | **Impact Tracker:** Total rupees saved and kilograms of CO₂ emissions prevented |
| `/profile` | **Student Profile:** Verification status, department, semester, and peer reviews |
| `/admin/verifications`| **Admin Verification Portal:** Student ID card review and approvals |

---

## 🧪 Automated Testing Suite

The repository includes a comprehensive unit and integration test suite covering availability calculations, concurrency race conditions, booking state machine transitions, and notifications.

Run the test suite:

```powershell
# Run Availability & Calendar Collision Tests
.venv\Scripts\python.exe backend/manage.py test apps.availability.tests

# Run Booking Lifecycle & Concurrency Race Condition Tests
.venv\Scripts\python.exe backend/manage.py test apps.bookings.tests

# Run Marketplace Search & Filter Tests
.venv\Scripts\python.exe backend/manage.py test apps.marketplace.tests

# Run Notification & History Cleanup Tests
.venv\Scripts\python.exe backend/manage.py test apps.notifications.tests

# Run Full Frontend TypeScript & Lint Checks
npm --prefix frontend run build
```

---

## 🔒 Security & Performance Engineering

- **Anti-Race Condition Concurrency:** Critical state updates use database-level `select_for_update(of=('self',))` locks to eliminate double-booking even under concurrent load.
- **Instant Client-Side Navigation:** Eager loading of core routes and TanStack Query data caching deliver 0ms transitions without jarring full-page browser reloads.
- **Zero-Deposit Trust Framework:** Financial barriers are eliminated by anchoring student accountability to verified university student credentials.
- **Cross-Site Security:** Strict CORS whitelist matching, CSRF protection, and JWT rotation with secure refresh tokens.
- **Media Optimization:** Direct-to-Cloudinary authenticated uploads with WebP image formatting and lazy image loading.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author & Acknowledgments

**Samith Nitta**  
- **GitHub:** [@nittasamith1](https://github.com/nittasamith1)  
- **Email:** `samithnitta88@gmail.com`

*Developed with passion for university students to share smart, save money, and build a more sustainable campus.*
