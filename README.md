# RentTogether — Campus Resource Sharing Platform
> **Share Smart. Save More. Live Better.**

RentTogether is an AI-powered intra-campus resource sharing and rental platform designed for college students to share academic equipment, electronics, textbooks, lab supplies, and daily campus essentials within their verified institutional community.

---

## 🚀 Version 1 Scope: Single-Campus High-Trust Network
- **Institutional Access:** Exclusively for verified students belonging to the active campus (**Aditya University**).
- **Institutional Email Validation:** Registration permitted only for permitted domains (`@adityauniversity.in`, `@aditya.ac.in`).
- **Unified Identity (Dual-Role):** Single student account acting contextually as both **Owner** (lending) and **Renter** (borrowing).
- **Identity Verification:** Dual-stage verification with 6-digit email OTP and student ID card administration approval.
- **Intra-Campus Exchange:** Physical handovers at designated on-campus meetup hubs (Library Counter, Central Canteen, Gate 1).
- **Campus Analytics:** Integrated financial metrics, personal savings tracker, and sustainability footprint (CO₂ avoided).

---

## 🛠️ Tech Stack
- **Backend:** Django 5.x + Django REST Framework + SimpleJWT
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + TanStack Query
- **Database:** SQLite (local development) / Neon Serverless PostgreSQL (production)
- **Media & CDN:** Cloudinary / Local Media fallback
- **Containerization:** Docker + Docker Compose + Nginx (multi-stage production builds)
- **Environment:** Node.js 20+, Python 3.12+

---

## 🏃 Quick Start Guide (How to Run)

The project consists of two servers: the **Django backend API** (port `8000`) and the **Vite React frontend** (port `5173`).

### 1. Start the Backend API

Open a terminal in the project root:

```powershell
# 1. Activate Python virtual environment
.venv\Scripts\activate

# 2. Navigate to backend directory
cd backend

# 3. Apply database migrations
python manage.py migrate

# 4. (Optional) Seed demo users, colleges, listings & campus data
python manage.py seed_phase01

# 5. Start the Django development server
python manage.py runserver
```

> The backend API will be live at: **`http://localhost:8000/`**  
> Health check endpoint: **`http://localhost:8000/api/v1/health/`**

---

### 2. Start the Frontend Application

Open a **second terminal** in the project root:

```powershell
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies (if not already installed)
npm install

# 3. Start the Vite development server
npm run dev
```

> The web application will be live at: **`http://localhost:5173/`**

---

### 3. Docker Deployment (Single Command)

To run the entire platform with production-grade Nginx and Gunicorn containers:

```bash
docker compose up --build
```

- Frontend SPA: **`http://localhost:5173/`** (served via Nginx with HTTP compression & asset caching)
- Backend API: **`http://localhost:8000/`**
- Health Check: **`http://localhost:8000/api/v1/health/`**

---

## 🔑 Demo Credentials (Aditya University)

You can log in manually or click the **1-Click Demo Login** buttons on the Login page:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Verified Student** | `sai.reddy@adityauniversity.in` | `StudentPassword123!` | Dashboard, Marketplace, Rentals, Bookings, Analytics |
| **Campus Admin** | `admin@adityauniversity.in` | `AdminPassword123!` | Student Verification Approval Portal |

---

## 🗺️ Key Application Pages

- **Campus Dashboard:** [`http://localhost:5173/`](http://localhost:5173/)
- **Marketplace & Filters:** [`http://localhost:5173/marketplace`](http://localhost:5173/marketplace)
- **My Rentals & Return Flow:** [`http://localhost:5173/rentals`](http://localhost:5173/rentals)
- **My Listed Items:** [`http://localhost:5173/listings`](http://localhost:5173/listings)
- **Bookings & Availability Calendar:** [`http://localhost:5173/bookings`](http://localhost:5173/bookings)
- **Offline Cash Payments:** [`http://localhost:5173/payments`](http://localhost:5173/payments)
- **Campus Analytics & CO₂ Impact:** [`http://localhost:5173/analytics`](http://localhost:5173/analytics)
- **Student Profile & Reviews:** [`http://localhost:5173/profile`](http://localhost:5173/profile)
- **Admin Verification Portal:** [`http://localhost:5173/admin/verifications`](http://localhost:5173/admin/verifications)
- **Django Admin Panel:** [`http://localhost:8000/admin/`](http://localhost:8000/admin/)

---

## 🧪 Comprehensive Automated Test Suite

Run full backend test coverage:

```powershell
# Run Availability & Calendar Tests
.venv\Scripts\python.exe backend/manage.py test apps.availability.tests

# Run Booking Lifecycle & Concurrency Tests
.venv\Scripts\python.exe backend/manage.py test apps.bookings.tests

# Run Marketplace & Search Tests
.venv\Scripts\python.exe backend/manage.py test apps.marketplace.tests

# Run Notifications & Wishlist Tests
.venv\Scripts\python.exe backend/manage.py test apps.notifications.tests

# Run Frontend Typecheck & Production Build
npm --prefix frontend run build
```
