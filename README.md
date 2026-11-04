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
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion
- **Database:** SQLite (local development) / Neon PostgreSQL (production)
- **Image Storage:** Cloudinary
- **Environment:** Node.js 18+, Python 3.11+

---

## 🏃 Quick Start Guide (How to Run)

The project consists of two servers: the **Django backend API** (port `8000`) and the **Vite React frontend** (port `5173`).

### 1. Start the Backend API

Open a terminal in the project root:

```powershell
# 1. Activate the Python virtual environment
.venv\Scripts\activate

# 2. Navigate to backend directory
cd backend

# 3. Apply database migrations
python manage.py migrate

# 4. (Optional) Seed demo users and Aditya University configuration
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

## 🔑 Demo Credentials (Aditya University)

You can log in manually or click the **1-Click Demo Login** buttons on the Login page:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Verified Student** | `sai.reddy@adityauniversity.in` | `StudentPassword123!` | Dashboard, Marketplace, Rentals, Analytics |
| **Campus Admin** | `admin@adityauniversity.in` | `AdminPassword123!` | Student Verification Approval Portal |

---

## 🗺️ Key Application Pages

- **Campus Dashboard:** [`http://localhost:5173/`](http://localhost:5173/)
- **Campus Analytics & CO₂ Impact:** [`http://localhost:5173/insights`](http://localhost:5173/insights)
- **Student Login:** [`http://localhost:5173/login`](http://localhost:5173/login)
- **Student Registration:** [`http://localhost:5173/register`](http://localhost:5173/register)
- **Admin Verification Portal:** [`http://localhost:5173/admin/verifications`](http://localhost:5173/admin/verifications)
- **Django Admin Panel:** [`http://localhost:8000/admin/`](http://localhost:8000/admin/)

---

## 🧪 Automated Test Suite

To verify backend authentication and permission rules:

```powershell
.venv\Scripts\python.exe backend/manage.py test apps.accounts
```
