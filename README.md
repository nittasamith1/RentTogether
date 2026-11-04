# RentTogether — Campus Resource Sharing Platform
> **Share Smart. Save More. Live Better.**

RentTogether is an AI-powered campus resource sharing and rental platform designed for college students to share academic equipment, electronics, lab supplies, project components, and daily essentials within their verified campus community.

---

## 🚀 Version 1 Scope: Single-College High-Trust Network
- **Institutional Access:** Restricted to verified students with official college email domains (e.g., `@college.edu`).
- **Unified Identity (Dual-Role):** Single student account acting contextually as both **Owner** (lending) and **Renter** (borrowing).
- **Intra-Campus Exchange:** Physical handovers at designated on-campus meeting spots (Library, Canteen, Hostels).
- **AI Core:** Fair price prediction, campus academic-calendar demand forecasting, fraud risk anomaly detection, and recommendation engine.

---

## 🛠️ Tech Stack
- **Backend:** Django 5 + Django REST Framework + SimpleJWT
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Database:** Neon Serverless PostgreSQL + Django ORM
- **Background Tasks:** Celery + Redis
- **Media Storage:** Cloudinary
- **Payments:** Razorpay Test Mode Escrow

---

## 🏃 Quick Start Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- Remote Neon PostgreSQL database (or local SQLite fallback)

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
cp ../.env.example .env # edit with your DATABASE_URL

python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit frontend at `http://localhost:5173` and backend API health-check at `http://localhost:8000/api/v1/health/`.
