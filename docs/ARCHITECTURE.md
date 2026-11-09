RentTogether — System Architecture
Brand: RentTogether
Tagline: Share Smart. Save More. Live Better.
Product: AI-Powered Campus Resource Sharing Platform.

Scope: Version 1 — Single-College Platform
RentTogether will initially be developed as a single-college resource-sharing platform:
- Registration restricted strictly to students belonging to the selected college.
- Mandatory college identity verification (institutional email domain & student ID).
- All resource listings, searches, bookings, and transactions remain strictly intra-campus.
- AI engines (price prediction, fraud detection, demand forecasting) analyze campus-specific rental patterns, semester schedules, and academic events.
- Platform administration and dispute resolution managed by college-specific administrators.

I recommend a modular monolithic architecture with an independent ML layer.

This gives you a clean, scalable architecture without introducing unnecessary microservices.
1. High-Level System Architecture
                 COLLEGE STUDENTS / CAMPUS ADMIN
                        |
                        v
              REACT + TYPESCRIPT
                  FRONTEND
                        |
                        v
                 DJANGO REST API
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
      AUTH &         MARKETPLACE    RENTAL &
     PROFILES        MANAGEMENT     BOOKINGS
          |             |             |
          +-------------+-------------+
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
       PAYMENTS      NOTIFICATIONS   REVIEWS
          |             |             |
          +-------------+-------------+
                        |
                        v
                 DJANGO SERVICES
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
      PostgreSQL     Redis          Celery
       (Neon)        Cache        Background Jobs
          |
          |
          v
                AI / ML ENGINE
          +-------------+-------------+
          |             |             |
          v             v             v
      FAIR PRICE      FRAUD         DEMAND
     PREDICTION     DETECTION     FORECASTING
          |             |             |
          +-------------+-------------+
                        |
                        v
                ML PREDICTION
                   SERVICES
                        |
                        v
                 DJANGO REST API
                        |
                        v
                 REACT FRONTEND

2. Frontend Architecture
Technology: React.js + TypeScript + Tailwind CSS.

Organize the frontend into these sections:
frontend/
│
├── src/
│   ├── assets/
│   │
│   ├── components/
│   │   ├── common/
│   │   ├── navbar/
│   │   ├── sidebar/
│   │   ├── cards/
│   │   └── charts/
│   │
│   ├── pages/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── marketplace/
│   │   ├── listings/
│   │   ├── bookings/
│   │   ├── payments/
│   │   ├── analytics/
│   │   └── admin/
│   │
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── marketplace.ts
│   │   ├── bookings.ts
│   │   └── payments.ts
│   │
│   ├── hooks/
│   ├── context/
│   ├── types/
│   ├── utils/
│   └── App.tsx
│
└── package.json

Important frontend behaviour
Every student gets one dashboard and one account.

The dashboard contains:
- My Rentals — resources borrowed.
- My Listings — resources shared.
- My Bookings — incoming and outgoing requests.
- My Earnings — rental income.
- My Spending — rental expenses.
- AI Recommendations.
- Sustainability Insights.
No separate owner or renter login.
3. Backend Architecture
Technology: Python + Django + Django REST Framework.

Use a modular Django application structure.
backend/
│
├── config/
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
│
├── apps/
│   │
│   ├── accounts/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── profiles/
│   ├── marketplace/
│   ├── listings/
│   ├── bookings/
│   ├── availability/
│   ├── payments/
│   ├── reviews/
│   ├── notifications/
│   ├── recommendations/
│   ├── sustainability/
│   ├── fraud_management/
│   └── administration/
│
├── ml_engine/
│   ├── pricing/
│   ├── fraud_detection/
│   ├── demand_prediction/
│   └── recommendations/
│
├── services/
├── permissions/
├── utils/
├── tests/
├── manage.py
└── requirements.txt

Backend responsibilities
Module	Responsibility
Accounts	Registration, login, JWT
Profiles	Student information
Marketplace	Search and discover resources
Listings	Item creation and management
Bookings	Rental lifecycle
Availability	Calendar and conflict detection
Payments	Transactions and refunds
Reviews	Ratings and feedback
Notifications	Email and in-app alerts
Recommendations	Personalized suggestions
Sustainability	Impact calculations
Fraud Management	Risk analysis and alerts
Administration	Platform management


4. AI/ML Architecture
This is one of the most important parts of RentTogether.

Use Python, Pandas, NumPy, Scikit-learn and XGBoost.

Build three independent ML engines.
A. Fair Price Prediction
Item Details
     |
     v
Feature Engineering
     |
     v
Trained ML Model
     |
     v
Predicted Rental Price
     |
     v
Django API
     |
     v
Owner Dashboard

Input:
- Category
- Original price
- Item age
- Condition
- Demand
- Historical rental prices
Output:
- Recommended rental price.
- Suggested price range.
B. Fraud Risk Detection
User + Listing + Booking Activity
                |
                v
         Feature Extraction
                |
                v
         Fraud Detection Model
                |
                v
           Risk Score
                |
                v
          Django Backend
                |
                v
          Admin Dashboard

Use Isolation Forest initially. Introduce supervised classification when labelled fraud data becomes available.
C. Demand Prediction
Historical Booking Data
          |
          v
    Data Processing
          |
          v
    Feature Engineering
          |
          v
      ML Model
          |
          v
   Future Demand Forecast
          |
          v
    Owner Dashboard

Output:
- Weekly demand.
- Monthly demand.
- High-demand categories.
- Upcoming demand trends.
Important: Train models separately from the live application. Save trained artifacts and load them through reusable prediction services.
5. Database Architecture
Database: Neon PostgreSQL
ORM: Django ORM

Recommended database tables:
Table	Purpose
College	Active college tenant entity (defines domain whitelist & campus rules)
User	Student account (strictly linked to the college)
StudentProfile	Student details, department, roll number, ID verification
Category	Resource categories
Item	Listed resources
ItemImage	Item images
Availability	Available rental periods
Booking	Rental transactions
Payment	Payment records
Deposit	Security deposits
Review	Ratings and reviews
Wishlist	Saved items
Notification	User notifications
Report	Reported listings/users
FraudAlert	AI-generated risk alerts
Dispute	Rental disputes
Transaction	Financial activity


Most important database relationship
One user can be an owner and renter.
                  USER
                   |
          +--------+--------+
          |                 |
          v                 v
       LISTINGS           BOOKINGS
          |                 |
          v                 v
        ITEM          OWNER_ID
                            |
                         RENTER_ID
                            |
                            v
                           USER

In the Booking table:
- owner_id references User.
- renter_id references User.
- item_id references Item.
Both users are normal student accounts. The roles are determined by their activity in a particular transaction.
6. Supporting Infrastructure
Component	Technology	Purpose
Database	Neon PostgreSQL	Persistent application data
Cache	Redis	Frequently accessed data
Background jobs	Celery	Reminders and scheduled tasks
Image storage	Cloudinary	Item and profile images
Authentication	SimpleJWT	Secure API authentication
Payments	Razorpay	Rental payments
ML	Scikit-learn/XGBoost	AI predictions
Deployment	Docker	Application containerization
Version control	GitHub	Source code management


7. Complete Request Flow
Example: A student wants to rent a scientific calculator within their campus.
1. Student logs in (verified institutional credentials)
2. Marketplace queries return items exclusively listed by students of the same college
       |
2. React sends request to Django API
       |
3. Django verifies JWT
       |
4. Marketplace returns calculator details
       |
5. Student selects rental dates
       |
6. Django checks availability
       |
7. Django calculates rental price
       |
8. Student sends booking request
       |
9. Owner receives notification
       |
10. Owner approves request
       |
11. Payment is processed
       |
12. Booking is confirmed
       |
13. Student collects calculator
       |
14. Rental is completed
       |
15. Return is verified
       |
16. Both students can submit reviews

All operations happen through the same student account system.
8. Deployment Architecture
For your initial deployment, keep it simple.
Component	Hosting
React frontend	Vercel
Django backend	Render or another suitable cloud host
PostgreSQL	Neon
Images	Cloudinary
Redis	Managed Redis provider
ML models	Packaged with Django initially
Source code	GitHub


You can later separate ML inference into its own service if workload justifies it.
9. Final Architecture Decisions
I recommend freezing these decisions:
Layer	Final Choice
Architecture	Modular Monolith (Single-College Scoped, Multi-Tenancy Ready)
Frontend	React + TypeScript
Backend	Django + DRF
Database	Neon PostgreSQL
ORM	Django ORM
Authentication	JWT
ML Framework	Scikit-learn + XGBoost
AI Integration	Django ML Services
Background Jobs	Celery + Redis
Storage	Cloudinary
Payment	Razorpay
Deployment	Docker + Cloud


Why Modular Monolith?
Because RentTogether is initially a student marketplace, not a massive enterprise platform.

A modular monolith gives you:
- Easier development.
- Simpler deployment.
- Centralized authentication.
- Consistent database transactions.
- Easier testing.
- Clear separation between modules.

RentTogether — Complete Modules & Functionalities
Brand: RentTogether
Tagline: Share Smart. Save More. Live Better.
Product Identity: AI-Powered Campus Resource Sharing Platform.

Scope: Version 1 — Single-College Platform
RentTogether will initially be developed as a single-college resource-sharing platform:
- Only students belonging to the selected college can register and access the platform.
- Students must verify their college identity (institutional college email verification and student ID validation).
- Students can list unused resources for rent within their college.
- Students can rent resources listed exclusively by other students from the same college.
- All rental activities, bookings, physical handovers, and transactions remain strictly within the college community.
- AI features (fair pricing, fraud risk detection, demand forecasting) will analyze rental activity and resource demand specific to that college.
- College-specific administrators can monitor campus users, listings, disputes, and platform activities.

Overview
RentTogether is an AI-powered campus resource-sharing platform designed to help college students save money by renting and sharing educational resources, electronics, project equipment, and daily-use items within their college community.

Students often purchase expensive resources such as calculators, books, laptops, cameras, and laboratory kits that they only need for a short period. Instead of purchasing these items individually, RentTogether provides a platform where students can rent available resources from other students at affordable prices.

Each student has one account that supports both renting and lending. A student can list their own resources for rent while simultaneously renting items from others.

The platform uses Artificial Intelligence and Machine Learning to recommend fair rental prices, identify suspicious activities, predict resource demand, and provide personalized recommendations.

RentTogether aims to create a trusted, affordable, and sustainable campus ecosystem where students save money, earn from unused resources, and reduce unnecessary purchases through resource sharing.
Core Vision
To make campus resource sharing simple, affordable, intelligent, and accessible to students.
Expected Impact
- Reduce students' educational expenses.
- Help students earn from unused resources.
- Improve resource accessibility.
- Encourage reuse instead of unnecessary purchases.
- Build a trusted student-sharing community.
- Use AI to make rental decisions smarter.
In one line: RentTogether connects students who have resources with students who need them, making campus life more affordable through intelligent resource sharing.

1. Core Platform Concept
One student account can perform two activities simultaneously:
- Owner: List personal resources and rent them to other students.
- Renter: Discover and rent resources from other students.
A student does not need separate accounts or separate registrations.
                  STUDENT ACCOUNT
                         |
             +-----------+-----------+
             |                       |
             v                       v
          OWNER                   RENTER
             |                       |
        List Items               Browse Items
        Manage Listings          Request Rentals
        Accept Bookings          Make Payments
        Track Earnings           Track Rentals
             |                       |
             +-----------+-----------+
                         |
                  SAME ACCOUNT

The platform also has a separate Admin role.
2. Main Modules and Functionalities
I recommend 13 main modules.
Module 1: Authentication & Student Verification
Purpose: Build a trusted single-college campus community.

Functionalities:
- Single-college restricted registration (validates institutional email domain, e.g., @college.edu).
- Student registration & login/logout.
- College identity verification (student roll number, institutional ID card upload & review).
- Student login/logout.
- College email verification.
- OTP verification.
- JWT authentication.
- Forgot/reset password.
- Student profile creation.
- Profile picture upload.
- College, department and year selection.
- Password change.
- Account management.
- Role-based access control.
- Admin authentication.
Module 2: Student Profile Management
Purpose: Manage student information and rental identity.

Functionalities:
- View/edit profile.
- Add student information.
- View rental history.
- View lending history.
- View ratings and reviews.
- View owner reputation.
- View renter reputation.
- Manage contact information.
- Manage notification preferences.
- View account activity.
Important: Each student has one profile but can have both owner and renter activities.
Module 3: Resource Marketplace
Purpose: Discover available resources across the designated college campus.

Functionalities:
- Browse all resources within the college (strictly intra-college catalog).
- Filter by department, block, and campus pickup locations.
- Search by item name.
- Filter by category.
- Filter by rental price.
- Filter by condition.
- Filter by availability.
- Sort by price.
- Sort by popularity.
- Sort by newest listings.
- View item details.
- View item images.
- View owner profile.
- View ratings.
- Add to wishlist.
- Recently viewed items.
- Report suspicious listings.
Categories:
Category	Examples
Academic	Books, calculators, notes
Electronics	Laptops, cameras, headphones
Laboratory	Lab kits, instruments
Project	Arduino, Raspberry Pi, sensors
Daily Use	Cycles, bags, sports equipment
Creative	Drawing tools, microphones


Module 4: Item Listing & Inventory Management
Purpose: Allow students to rent out their unused resources.

Functionalities:
- Create item listing.
- Upload multiple images.
- Add item name and description.
- Select category.
- Enter original purchase price.
- Enter item age.
- Select item condition.
- Set rental price.
- Set refundable deposit.
- Set minimum/maximum rental duration.
- Set availability.
- Edit listings.
- Delete listings.
- Pause/resume listings.
- View listing performance.
- Track rental count.
Module 5: Rental & Booking Management
Purpose: Handle the complete rental process.

Functionalities:
- Request item rental.
- Select start date.
- Select end date.
- Calculate rental charges.
- Calculate security deposit.
- Send booking request.
- Accept/reject booking requests.
- Confirm bookings.
- Cancel bookings.
- Request rental extensions.
- Track active rentals.
- Track upcoming returns.
- Manage overdue rentals.
- On-campus handover at designated safe campus spots (Library, Canteen, Hostels).
- Confirm item pickup.
- Confirm item return.
- View booking history.
Booking workflow:
Student selects item
        |
        v
Select rental dates
        |
        v
Check availability
        |
        v
Send rental request
        |
        v
Owner approval
        |
        v
Payment confirmation
        |
        v
Booking confirmed
        |
        v
Item pickup
        |
        v
Rental active
        |
        v
Return verification
        |
        v
Booking completed

Module 6: AI Fair Price Prediction
Purpose: Recommend fair rental prices using ML.

Input features:
- Item category.
- Original price.
- Item age.
- Item condition.
- Historical rental prices.
- Demand level.
- Availability.
- Rental duration.
Functionalities:
- Predict recommended rental price.
- Generate suggested price range.
- Compare owner price with predicted price.
- Display pricing factors.
- Detect unusual pricing.
ML models:
- Linear Regression.
- Random Forest Regressor.
- XGBoost Regressor.
Example:
AI PRICE RECOMMENDATION

Item: Scientific Calculator

Predicted Price: ₹25/day
Suggested Range: ₹20–₹30/day

Demand: High
Price Status: Fair

Module 7: AI Fraud Risk Detection
Purpose: Identify suspicious users, listings and rental activities.

Functionalities:
- Duplicate listing detection.
- Unusual price detection.
- Suspicious booking pattern detection.
- Repeated cancellation analysis.
- User report analysis.
- Anomaly detection.
- Risk score generation.
- Fraud alert generation.
- Admin review queue.
- Fraud investigation history.
ML techniques:
- Isolation Forest.
- Random Forest.
- XGBoost (when labelled data is available).
Example:
FRAUD RISK ANALYSIS

Risk Score: 82/100
Risk Level: High

Signals:
- Duplicate listing pattern
- Unusual rental pricing
- Multiple user reports

Action: Admin review

AI flags suspicious activity; admins make the final decision.
Module 8: AI Demand Prediction
Purpose: Predict future demand for campus resources.

Functionalities:
- Predict resource demand.
- Identify high-demand categories.
- Generate weekly forecasts.
- Generate monthly forecasts.
- Analyze historical rental patterns.
- Identify seasonal demand.
- College academic calendar integration (midterms, semester finals, lab evaluations).
- Analyze examination-period demand.
- Analyze project submission and campus tech fest demand.
- Display demand trends.
ML models:
- Random Forest.
- XGBoost.
- Time-series forecasting models.
Example:
Resource	Predicted Demand
Calculators	High
Lab Equipment	Very High
Project Kits	High
Cameras	Medium


Module 9: AI Recommendation Engine
Purpose: Recommend useful and relevant resources to students.

Functionalities:
- Personalized recommendations.
- Similar item recommendations.
- Category-based recommendations.
- Budget-based recommendations.
- Recently popular items.
- Frequently rented items.
- Complementary item recommendations.
- Search-history-based recommendations.
- Rental-history-based recommendations.
Example:

A student rents an Arduino kit.

Recommend:
- Sensors.
- Breadboards.
- Jumper wires.
- Electronic components.
Start with content-based filtering and expand later.
Module 10: Smart Calendar & Notifications
Purpose: Manage rental schedules and avoid booking conflicts.

Functionalities:
- Interactive rental calendar.
- Item availability calendar.
- Automatic conflict detection.
- Rental extension requests.
- Due-date reminders.
- Overdue notifications.
- Booking approval notifications.
- Payment notifications.
- Return reminders.
- Waiting list.
- Email notifications.
- In-app notifications.
Module 11: Payment & Transaction Management
Purpose: Manage rental payments and financial records.

Functionalities:
- Calculate rental charges.
- Security deposit collection.
- Payment gateway integration.
- Payment confirmation.
- Payment history.
- Transaction tracking.
- Refund management.
- Owner earnings tracking.
- Renter spending tracking.
- Platform commission.
- Payment receipts.
- Failed payment handling.
Use Razorpay test mode initially.
Module 12: Sustainability & Analytics
Purpose: Measure the economic and environmental impact of resource sharing.

Student analytics:
- Total money saved.
- Total items rented.
- Resources reused.
- Active rentals.
Owner analytics:
- Total earnings.
- Total bookings.
- Most popular items.
- Item utilization.
- Rental performance.
Platform analytics:
- Total registered students.
- Total listings.
- Total successful rentals.
- Total resources reused.
- Estimated money saved.
- Estimated waste avoided.
Module 13: Admin & Platform Management
Purpose: Manage the single-college RentTogether campus platform.

Functionalities:
- College-specific admin dashboard.
- Verify student college identities and department credentials.
- Manage student accounts.
- Verify student accounts.
- Manage item categories.
- Monitor listings.
- Review reported listings.
- Monitor fraud alerts.
- Review suspicious accounts.
- Manage disputes.
- Manage payment issues.
- Manage refunds.
- Suspend accounts when justified.
- View platform analytics.
- Monitor platform activity.
3. Three Dashboard Interfaces
Although students use one account, provide separate dashboard sections based on their activities.
A. Student Dashboard
The default landing dashboard.
Section	Functionalities
Overview	Personal activity summary
Explore	Browse resources
My Rentals	Items borrowed
My Listings	Items being rented out
My Bookings	Incoming and outgoing requests
Wishlist	Saved items
AI Recommendations	Suggested resources
Transactions	Spending and earnings
Notifications	Updates and reminders
Profile	Account management


B. Owner Dashboard
Accessible through the same student account.
Section	Functionalities
Overview	Owner statistics
My Listings	Manage resources
Rental Requests	Accept/reject requests
Active Rentals	Track rented items
Availability	Manage calendar
AI Pricing	Price recommendations
Demand Insights	Demand forecasts
Earnings	Rental income
Reviews	Owner ratings


C. Admin Dashboard
Section	Functionalities
Overview	Platform statistics
Students	Account management
Listings	Listing moderation
Bookings	Booking monitoring
Fraud Detection	AI risk alerts
Disputes	Complaint management
Payments	Transaction monitoring
Analytics	Platform performance
Settings	Platform configuration


4. Additional Premium Features
These can make RentTogether more distinctive.
Feature	Functionality
QR-Based Handover	Verify item pickup and return
Digital Rental Agreement	Generate agreements for bookings
Group Rentals	Allow students to share rental expenses
Smart Price Comparison	Compare similar listings
Owner Reputation	Build trust using rental history
Dispute Management	Handle damaged/missing items
Waiting List	Notify students when items become available
Intra-Campus Search	Discover resources across college departments & blocks (Multi-college search reserved for V2)


5. Final Technology Stack
Layer	Technology
Frontend	React.js + TypeScript
UI	Tailwind CSS
Backend	Django
REST API	Django REST Framework
Database	Neon PostgreSQL
ORM	Django ORM
Authentication	JWT + SimpleJWT
ML	Scikit-learn + XGBoost
Data Processing	Pandas + NumPy
Explainability	SHAP
Background Tasks	Celery
Cache	Redis
Image Storage	Cloudinary
Payments	Razorpay
Deployment	Docker + Cloud


6. Recommended Development Priority
Don't build all modules simultaneously.
Phase	Modules
1	Authentication + Student Profiles
2	Marketplace + Item Listings
3	Rental + Booking Management
4	Calendar + Notifications
5	Payment + Transactions
6	AI Fair Price Prediction
7	AI Fraud Detection
8	AI Demand Prediction
9	Recommendation Engine
10	Sustainability + Analytics
11	Admin Management
12	QR Handover + Digital Agreements
13	Testing + Security + Deployment


7. Final Project Scope (Version 1: Single-College Focus)
Your project should deliver for Version 1:
1. A complete single-college campus rental marketplace (100% intra-college).
2. Institutional email & ID verification ensuring only campus students participate.
2. One student account supporting both owner and renter activities.
3. Secure rental booking and payment management.
4. AI-powered fair price prediction.
5. AI-based fraud risk detection.
6. AI-based demand forecasting.
7. Personalized resource recommendations.
8. Smart scheduling and notifications.
9. Sustainability analytics.
10. Admin and platform management.

================================================================================
                    RENTTOGETHER — MASTER DEVELOPMENT PHASES
           AI-Powered Campus Resource Sharing Platform (Version 1)
                  Share Smart. Save More. Live Better.
================================================================================

Target Scope: Version 1 (Single-College High-Trust Ecosystem)
Architecture: Modular Monolith (Django REST Framework) + React TypeScript + ML Layer
Database: Neon PostgreSQL | Background: Celery + Redis | Storage: Cloudinary

This document provides a 100% complete, step-by-step master roadmap to build, test,
and deploy RentTogether from zero to production without ambiguities or missing pieces.

--------------------------------------------------------------------------------
TABLE OF PHASES
--------------------------------------------------------------------------------
Phase 01: Project Foundation, Scaffolding & Database Setup
Phase 02: Institutional Authentication & Student Identity Verification
Phase 03: Unified Student Profile & Reputation Scoring Engine
Phase 04: Resource Marketplace & Multi-Category Catalog
Phase 05: Item Listing & Inventory Management (Owner Flow)
Phase 06: Availability Engine & Conflict-Free Smart Calendar
Phase 07: Rental & Booking Lifecycle State Machine
Phase 08: In-Person Campus Handover, Return Verification & QR Codes
Phase 09: Payment Gateway, Security Deposit Escrow & Financial Ledger
Phase 10: AI Fair Price Prediction Engine (Scikit-learn / XGBoost)
Phase 11: AI Campus Demand Forecasting Engine (Academic Calendar Aware)
Phase 12: AI Fraud & Anomaly Risk Detection Engine (Isolation Forest)
Phase 13: AI Content-Based & Complementary Recommendation Engine
Phase 14: Campus Sustainability Impact Analytics & KPI Dashboard
Phase 15: College-Specific Admin Portal & On-Ground Dispute Mediation
Phase 16: Background Workers, Scheduled Jobs & Real-Time Notifications
Phase 17: Frontend UI Polish (Pixel-Perfect to Dashboard Mockup)
Phase 18: Security Audits, Comprehensive Testing & Cloud Deployment

================================================================================
PHASE 01: PROJECT FOUNDATION, SCAFFOLDING & DATABASE SETUP
================================================================================
[Goal]: Establish repository structure, containerization, database connection, and baseline developer tooling.

1.1. Project Directory Structure
     RentTogether/
     |-- backend/
     |   |-- config/ (settings.py, urls.py, wsgi.py, asgi.py, celery.py)
     |   |-- apps/
     |   |   |-- accounts/
     |   |   |-- profiles/
     |   |   |-- marketplace/
     |   |   |-- listings/
     |   |   |-- bookings/
     |   |   |-- availability/
     |   |   |-- payments/
     |   |   |-- reviews/
     |   |   |-- notifications/
     |   |   |-- recommendations/
     |   |   |-- sustainability/
     |   |   |-- fraud_management/
     |   |   `-- administration/
     |   |-- ml_engine/
     |   |   |-- datasets/
     |   |   |-- training/
     |   |   |-- artifacts/
     |   |   `-- services/
     |   |-- requirements.txt
     |   |-- Dockerfile
     |   `-- manage.py
     |-- frontend/
     |   |-- src/
     |   |   |-- assets/
     |   |   |-- components/
     |   |   |-- pages/
     |   |   |-- services/
     |   |   |-- hooks/
     |   |   |-- context/
     |   |   |-- types/
     |   |   |-- utils/
     |   |   |-- App.tsx
     |   |   `-- main.tsx
     |   |-- tailwind.config.js
     |   |-- package.json
     |   `-- vite.config.ts
     |-- docker-compose.yml
     `-- .env.example

1.2. Tech Stack Dependencies Installation
     - Backend: Django 5+, djangorestframework, djangorestframework-simplejwt,
       django-cors-headers, psycopg2-binary, celery, redis, cloudinary, django-cloudinary-storage,
       scikit-learn, xgboost, pandas, numpy, joblib, razorpay.
     - Frontend: Vite + React 18, TypeScript, Tailwind CSS, Lucide React (icons),
       Axios, TanStack Query (React Query), React Router DOM (v6), React Hook Form, Zod.

1.3. Database Initialization (Neon PostgreSQL)
     - Setup remote Neon serverless PostgreSQL instance.
     - Configure DATABASE_URL in backend/.env with SSL mode required.
     - Verify connection using `python manage.py check --database default`.

[Definition of Done - Phase 01]:
[x] Backend starts cleanly via `python manage.py runserver` with 0 warnings.
[x] Frontend starts cleanly via `npm run dev` displaying Tailwind styles.
[x] Neon PostgreSQL connection verified and initial Django auth migrations applied.
[x] Git repository initialized with .gitignore ignoring .env, venv, node_modules.

================================================================================
PHASE 02: INSTITUTIONAL AUTHENTICATION & STUDENT IDENTITY VERIFICATION
================================================================================
[Goal]: Enforce single-college security boundaries so only verified campus students can participate.

2.1. Database Models (apps/accounts & apps/profiles)
     - Model: College
       * id (UUID, PK)
       * name (CharField) -> e.g., "VNR Vignana Jyothi Institute of Engineering & Tech"
       * code (CharField, unique) -> e.g., "VNRVJIET"
       * domain_whitelist (ArrayField/TextField) -> e.g., ["@vnrvjiet.in", "@vnrvjiet.ac.in"]
       * address (TextField)
       * is_active (BooleanField, default=True)
     - Model: User (Custom User extending AbstractUser)
       * email (EmailField, unique=True) -> Used as login username
       * college (ForeignKey -> College, on_delete=CASCADE)
       * is_college_verified (BooleanField, default=False)
       * date_joined (DateTimeField)
     - Model: StudentVerification
       * user (OneToOneField -> User)
       * roll_number (CharField, unique=True)
       * department (CharField) -> CSE, ECE, MECH, etc.
       * year_of_study (IntegerField) -> 1, 2, 3, 4
       * id_card_image_url (URLField) -> Stored in Cloudinary
       * verification_status (CharField: PENDING, VERIFIED, REJECTED)
       * rejection_reason (TextField, blank=True)
       * verified_at (DateTimeField, null=True)

2.2. API Endpoints
     - POST /api/auth/register/
       * Payload: { email, password, full_name, roll_number, department, year, id_card_image }
       * Validation: Email domain MUST match the active college's domain whitelist.
     - POST /api/auth/verify-otp/
       * Validates 6-digit email OTP sent to institutional mailbox.
     - POST /api/auth/login/
       * Returns: { access_token, refresh_token, user: { id, email, name, is_verified } }
     - POST /api/auth/refresh/
     - POST /api/auth/logout/ (Blacklists refresh token)

2.3. Frontend Implementation
     - Registration view with institutional domain auto-suggestion and validation.
     - ID card upload dropzone with client-side image compression and preview.
     - OTP verification dialog with countdown timer.
     - AuthContext providing token storage, auto-refresh, and route protection guards.

[Definition of Done - Phase 02]:
[x] Registration rejects non-college emails (e.g., student@gmail.com is rejected).
[x] Valid college email receives OTP and verifies successfully.
[x] Student ID image uploads to Cloudinary securely.
[x] JWT tokens issued, verified, and protected routes block unauthenticated users.

================================================================================
PHASE 03: UNIFIED STUDENT PROFILE & REPUTATION SCORING ENGINE
================================================================================
[Goal]: Implement the core "One Account — Dual Role" student profile system.


3.1. Database Models (apps/profiles)
     - Model: StudentProfile
       * user (OneToOneField -> User)
       * avatar_url (URLField, blank=True)
       * bio (TextField, max_length=500)
       * phone_number (CharField)
       * reputation_as_owner (DecimalField, default=5.00, max_digits=3, decimal_places=2)
       * reputation_as_renter (DecimalField, default=5.00, max_digits=3, decimal_places=2)
       * total_items_lent (IntegerField, default=0)
       * total_items_borrowed (IntegerField, default=0)
       * total_savings_inr (DecimalField, default=0.00)
       * total_earnings_inr (DecimalField, default=0.00)
       * preferred_pickup_spots (JSONField) -> ["Central Library", "Main Canteen"]

3.2. Reputation Calculation Service
     - Algorithm: Weighted moving average of peer reviews:
       * Owner Score = 70% Item Condition Accuracy + 30% Communication & Punctuality.
       * Renter Score = 60% On-Time Return + 40% Item Care & Cleanliness.

3.3. API Endpoints
     - GET /api/profiles/me/ (Full student dashboard profile with dual stats)
     - PUT /api/profiles/me/ (Update bio, phone, avatar, preferred spots)
     - GET /api/profiles/<student_id>/ (Public peer profile with trust badge)

[Definition of Done - Phase 03]:
[x] Unified profile accurately aggregates both rental and lending statistics.
[x] Updating profile changes reflect immediately in the header avatar and student pill.
[x] Reputation scores recalculate dynamically after verified completed rentals.

================================================================================
PHASE 04: RESOURCE MARKETPLACE & MULTI-CATEGORY CATALOG
================================================================================
[Goal]: Provide an intuitive, lightning-fast intra-campus catalog of shared resources.

4.1. Database Models (apps/marketplace)
     - Model: Category
       * name (CharField) -> Academic, Electronics, Laboratory, Project, Daily Use, Creative
       * slug (SlugField, unique=True)
       * icon_name (CharField) -> Lucide icon identifier
       * is_active (BooleanField, default=True)
     - Model: Wishlist
       * user (ForeignKey -> User)
       * item (ForeignKey -> Item)
       * created_at (DateTimeField)

4.2. Marketplace Search & Filter Engine
     - Queryset is ALWAYS hard-filtered by `owner__college = request.user.college`.
     - Supports full-text search across item titles and descriptions.
     - Multi-faceted filters:
       * Category filter (e.g., "Calculators", "Books", "Project Kits")
       * Price range slider (Min ₹ - Max ₹ per day)
       * Item condition (Brand New, Like New, Good, Fair)
       * Availability status (Available Now vs. Available on Date)
     - Sorting options:
       * Most Popular (rental count)
       * Newest Listings
       * Price: Low to High / High to Low
       * Highest Rated Owner

4.3. API Endpoints
     - GET /api/marketplace/categories/
     - GET /api/marketplace/items/ (Paginated, filtered, searched)
     - GET /api/marketplace/items/<id>/ (Detailed view with availability calendar)
     - POST /api/marketplace/items/<id>/wishlist/ (Toggle wishlist)
     - GET /api/marketplace/popular/ (Top 8 items for dashboard carousel)

4.4. Frontend Implementation
     - Marketplace page with sticky sidebar filters and responsive card grid.
     - "Popular Resources" horizontal carousel matching dashboard mockup.
     - Item Card component showing:
       * Primary image with hover zoom
       * Category badge (e.g., "Calculator" pill)
       * Price badge (e.g., "₹30 / day")
       * Star rating (e.g., "★ 4.8")
       * Wishlist heart toggle icon

[Definition of Done - Phase 04]:
[x] Marketplace strictly displays items from the student's designated college.
[x] Filtering by category, search text, and price operates with sub-100ms response times.
[x] Wishlisting works seamlessly with optimistic UI updates.

================================================================================
PHASE 05: ITEM LISTING & INVENTORY MANAGEMENT (OWNER FLOW)
================================================================================
[Goal]: Enable students to list items easily with multi-image support and pricing guidance.

5.1. Database Models (apps/listings)
     - Model: Item
       * id (UUID, PK)
       * owner (ForeignKey -> User, on_delete=CASCADE)
       * category (ForeignKey -> Category)
       * title (CharField, max_length=150)
       * description (TextField)
       * original_price (DecimalField, max_digits=10, decimal_places=2)
       * item_age_months (IntegerField)
       * condition (CharField: BRAND_NEW, LIKE_NEW, GOOD, FAIR)
       * rental_price_per_day (DecimalField, max_digits=8, decimal_places=2)
       * security_deposit (DecimalField, max_digits=8, decimal_places=2)
       * min_rental_days (IntegerField, default=1)
       * max_rental_days (IntegerField, default=30)
       * pickup_location (CharField) -> e.g., "Central Library Ground Floor"
       * status (CharField: ACTIVE, RENTED, PAUSED, REMOVED)
       * rental_count (IntegerField, default=0)
       * created_at (DateTimeField, auto_now_add=True)
     - Model: ItemImage
       * item (ForeignKey -> Item, related_name='images')
       * image_url (URLField)
       * is_primary (BooleanField, default=False)
       * order (IntegerField, default=0)

5.2. API Endpoints
     - POST /api/listings/create/ (Multi-part form data with multiple photos)
     - GET /api/listings/my-listings/ (Listings belonging to authenticated student)
     - PUT /api/listings/<id>/ (Edit listing details)
     - PATCH /api/listings/<id>/status/ (Toggle pause/active)
     - DELETE /api/listings/<id>/ (Soft delete)

5.3. Frontend Implementation
     - Modern multi-step "+ List an Item" modal / page:
       * Step 1: Item Category & Title
       * Step 2: Item Condition & Original Purchase Details
       * Step 3: Photos Upload (Cloudinary direct widget or backend proxy)
       * Step 4: AI Price Recommendation & Setting Deposit
       * Step 5: Campus Pickup Point Selection
     - "My Listings" management tab with quick pause/resume switches and rental history.

[Definition of Done - Phase 05]:
[x] Student can upload 1 to 5 images to Cloudinary per item.
[x] Listing appears immediately in the campus marketplace and under "My Listings".
[x] Owner can pause and edit listings without breaking existing active bookings.

================================================================================
PHASE 06: AVAILABILITY ENGINE & CONFLICT-FREE SMART CALENDAR
================================================================================
[Goal]: Prevent overlapping bookings and provide real-time schedule transparency.

6.1. Database Models (apps/availability)
     - Model: ItemAvailabilityBlock
       * item (ForeignKey -> Item)
       * start_date (DateField)
       * end_date (DateField)
       * reason (CharField: BOOKED, OWNER_UNAVAILABLE, MAINTENANCE)
       * booking_reference (ForeignKey -> Booking, null=True, blank=True)

6.2. Calendar Conflict Detection Algorithm
     - PostgreSQL Exclusion Constraint or Django validation rule:
       * For any new booking requested between [start_date, end_date], verify:
         `ItemAvailabilityBlock.objects.filter(item=item, start_date__lte=req_end, end_date__gte=req_start).exists() == False`
     - Automatic lock creation when a booking is confirmed/paid.

6.3. API Endpoints
     - GET /api/availability/<item_id>/ (Returns array of blocked date ranges)
     - POST /api/availability/<item_id>/block/ (Owner manually blocks vacation/exam dates)
     - DELETE /api/availability/<block_id>/ (Owner unblocks dates)

6.4. Frontend Implementation
     - Interactive date-range picker on Item Detail page:
       * Blocked dates highlighted in muted grey/red (non-clickable).
       * Available dates selectable with dynamic duration and fee calculation.

[Definition of Done - Phase 06]:
[x] Double booking is mathematically impossible at the database level.
[x] Calendar dynamically disables dates currently occupied by active rentals.
[x] Owner can manually block personal study or exam dates.

================================================================================
PHASE 07: RENTAL & BOOKING LIFECYCLE STATE MACHINE
================================================================================
[Goal]: Manage the complete rental lifecycle with rigorous state transitions.

7.1. Database Models (apps/bookings)
     - Model: Booking
       * id (UUID, PK)
       * booking_code (CharField, unique) -> e.g., "RT-2026-9812"
       * item (ForeignKey -> Item)
       * renter (ForeignKey -> User, related_name='rentals')
       * owner (ForeignKey -> User, related_name='lendings')
       * start_date (DateField)
       * end_date (DateField)
       * total_days (IntegerField)
       * daily_rate (DecimalField)
       * total_rental_fee (DecimalField)
       * security_deposit (DecimalField)
       * platform_fee (DecimalField, default=0.00)
       * total_amount (DecimalField)
       * status (CharField with choices):
         - PENDING_APPROVAL: Renter submitted, waiting for owner.
         - APPROVED_PENDING_PAYMENT: Owner approved, renter must pay.
         - REJECTED: Owner declined request.
         - PAID_CONFIRMED: Payment successful, awaiting campus handover.
         - ACTIVE: Item collected and currently in use.
         - RETURNED_PENDING_INSPECTION: Item returned, owner inspecting.
         - COMPLETED: Inspection passed, deposit released, mutual reviews open.
         - CANCELLED: Cancelled before handover.
         - DISPUTED: Issue raised regarding damage or missing item.
       * created_at (DateTimeField, auto_now_add=True)

7.2. State Transition Rules
     - Renter cannot book their own item (`renter != owner`).
     - Owner has 24 hours to accept/reject a `PENDING_APPROVAL` request.
     - Renter has 12 hours after approval to complete payment before request auto-cancels.

7.3. API Endpoints
     - POST /api/bookings/create/ (Renter submits booking request)
     - GET /api/bookings/my-rentals/ (Renter's outgoing bookings)
     - GET /api/bookings/my-requests/ (Owner's incoming rental requests)
     - POST /api/bookings/<id>/accept/ (Owner accepts)
     - POST /api/bookings/<id>/reject/ (Owner rejects with optional reason)
     - POST /api/bookings/<id>/cancel/ (Renter cancels)

7.4. Frontend Implementation
     - "My Rentals" and "Bookings" dashboards with status badge pills:
       * Yellow: Pending Approval
       * Blue: Approved / Ready to Pay
       * Green: Active Rental
       * Purple: Completed
     - Action buttons: "Pay Now", "Cancel Request", "View Handover Pass".

[Definition of Done - Phase 07]:
[x] Full state machine functions correctly with invalid state jumps rejected.
[x] Owners receive instant notifications for new booking requests.
[x] Booking records link cleanly to both renter and owner student accounts.

================================================================================
PHASE 08: IN-PERSON CAMPUS HANDOVER, RETURN VERIFICATION & QR CODES
================================================================================
[Goal]: Provide verified on-campus physical exchange using dynamic QR codes and OTPs.

8.1. Handover Verification Mechanism
     - Model: HandoverVerification
       * booking (OneToOneField -> Booking)
       * pickup_otp (CharField, 4-digit secret)
       * pickup_qr_token (UUID/JWT string)
       * pickup_confirmed_at (DateTimeField, null=True)
       * pickup_notes (TextField, blank=True)
       * return_otp (CharField, 4-digit secret)
       * return_qr_token (UUID/JWT string)
       * return_confirmed_at (DateTimeField, null=True)
       * return_item_condition (CharField: SAME, MINOR_WEAR, DAMAGED)

8.2. Handover Workflow
     - Step 1 (Pickup):
       * Both students meet at chosen campus spot (e.g., Central Library).
       * Renter inspects item.
       * Owner displays Pickup QR or shares 4-digit OTP.
       * Renter scans QR or enters OTP in app -> Status immediately updates to `ACTIVE`.
     - Step 2 (Return):
       * Students meet at end of rental.
       * Owner inspects item.
       * Renter displays Return QR or shares 4-digit OTP.
       * Owner verifies condition and confirms return -> Status updates to `RETURNED_PENDING_INSPECTION`.

8.3. API Endpoints
     - GET /api/bookings/<id>/handover-pass/ (Returns QR code and OTP for authorized user)
     - POST /api/bookings/<id>/verify-pickup/ (Validates OTP/QR and activates rental)
     - POST /api/bookings/<id>/verify-return/ (Validates OTP/QR and initiates deposit refund)

[Definition of Done - Phase 08]:
[x] QR codes render cleanly on mobile viewports.
[x] Entering OTP or scanning QR transitions booking state in real-time.
[x] Handover timestamps and verification proof stored with audit trail.

================================================================================
PHASE 09: PAYMENT GATEWAY, SECURITY DEPOSIT ESCROW & FINANCIAL LEDGER
================================================================================
[Goal]: Secure financial transactions via Razorpay (Test Mode) with automated deposit escrow.

9.1. Database Models (apps/payments)
     - Model: PaymentTransaction
       * id (UUID, PK)
       * booking (ForeignKey -> Booking)
       * user (ForeignKey -> User)
       * razorpay_order_id (CharField)
       * razorpay_payment_id (CharField, blank=True)
       * razorpay_signature (CharField, blank=True)
       * amount (DecimalField)
       * type (CharField: RENTAL_CHARGE, SECURITY_DEPOSIT, DEPOSIT_REFUND, OWNER_PAYOUT)
       * status (CharField: CREATED, SUCCESS, FAILED, REFUNDED)
       * created_at (DateTimeField, auto_now_add=True)
     - Model: WalletLedger
       * user (ForeignKey -> User)
       * current_balance (DecimalField, default=0.00)
       * total_spent (DecimalField, default=0.00)
       * total_earned (DecimalField, default=0.00)

9.2. Escrow Architecture
     - Total paid by Renter = Rental Fee + Refundable Security Deposit + Platform Fee.
     - Security Deposit is kept held in custody by the platform.
     - Upon successful return verification:
       * Deposit is automatically refunded to renter's source account via Razorpay Refund API.
       * Rental earnings (Rental Fee - Platform Commission) are credited to Owner's ledger.

9.3. API Endpoints
     - POST /api/payments/create-order/ (Creates Razorpay order ID)
     - POST /api/payments/verify-payment/ (Validates Razorpay HMAC signature)
     - GET /api/payments/my-ledger/ (Complete transaction history)
     - POST /api/payments/webhook/ (Handles async payment notifications)

[Definition of Done - Phase 09]:
[x] Razorpay Checkout opens in modal and processes test card/UPI payments.
[x] HMAC signature verification secures backend against spoofed payment confirmations.
[x] Security deposit refund triggers automatically upon verified return.

================================================================================
PHASE 10: AI FAIR PRICE PREDICTION ENGINE (SCIKIT-LEARN / XGBOOST)
================================================================================
[Goal]: Train and deploy an intelligent price recommendation service for campus items.

10.1. Dataset Engineering (backend/ml_engine/datasets/)
     - Generate synthetic/historical campus rental dataset:
       * Features: category, original_retail_price, age_in_months, condition,
         item_brand_tier, campus_demand_score, rental_duration_days.
       * Target: fair_rental_price_per_day.
     - Clean, normalize, and one-hot encode categorical features.

10.2. Model Training Pipeline (backend/ml_engine/training/train_pricing.py)
     - Models trained & compared:
       * Baseline: Linear Regression
       * Ensemble: Random Forest Regressor
       * Gradient Boosting: XGBoost Regressor
     - Cross-validation evaluation (Target: RMSE < 5.0, R² > 0.92).
     - Export winning model pipeline to `backend/ml_engine/artifacts/pricing_model.joblib`.

10.3. Prediction Service (backend/ml_engine/services/pricing_service.py)
     - Function: `predict_fair_price(category, original_price, age_months, condition)`
     - Outputs:
       * recommended_price_per_day (e.g., ₹25.00)
       * min_suggested_price (e.g., ₹20.00)
       * max_suggested_price (e.g., ₹30.00)
       * confidence_score (e.g., 0.94)
       * pricing_status (e.g., "Fair", "Underpriced", "Overpriced")

10.4. API Endpoint & Frontend Integration
     - POST /api/ai/predict-price/
     - Integration in "+ List an Item" form:
       * As student types original price and selects condition, AI box shows live suggestion:
         "AI Recommended: ₹25 / day (Fair Range: ₹20 - ₹30)".
       * "Apply AI Price" one-click button.

[Definition of Done - Phase 10]:
[x] ML model achieves R² > 0.90 on test dataset.
[x] Prediction API responds in < 50ms with valid price range.
[x] Frontend pricing slider highlights the AI-recommended zone.

================================================================================
PHASE 11: AI CAMPUS DEMAND FORECASTING ENGINE (ACADEMIC CALENDAR AWARE)
================================================================================
[Goal]: Forecast category demand spikes aligned with midterms, exams, and project submission weeks.

11.1. Data & Calendar Modeling
     - Integrate college academic events into the training vector:
       * `is_midterm_week` (Boolean)
       * `is_final_exam_week` (Boolean)
       * `is_project_submission_week` (Boolean)
       * `is_tech_fest_week` (Boolean)
       * `month_of_semester` (1 to 6)

11.2. Training Demand Regressor (backend/ml_engine/training/train_demand.py)
     - Target: `predicted_rental_requests_next_7_days` per category.
     - Model: XGBoost Regressor with calendar-lag features.
     - Export to `backend/ml_engine/artifacts/demand_model.joblib`.

11.3. API Endpoint & Dashboard Insights
     - GET /api/ai/demand-insights/
     - Returns:
       * High-demand categories (e.g., "Scientific Calculators: +180% surge expected due to Midterms")
       * Suggestion for owners: "Have a Casio fx-991EX? List it now to earn ~₹200 this week."

[Definition of Done - Phase 11]:
[x] Demand forecasting accounts for college academic milestones.
[x] Owner dashboard displays clear, actionable demand alert cards.

================================================================================
PHASE 12: AI FRAUD & ANOMALY RISK DETECTION ENGINE (ISOLATION FOREST)
================================================================================
[Goal]: Protect the campus community by flagging suspicious behavior, price gouging, and duplicate listings.

12.1. Feature Extraction & Risk Signals
     - Feature vector per listing/activity:
       * `price_deviation_ratio` = |listed_price - ai_predicted_price| / ai_predicted_price
       * `creation_velocity` = number of items listed in the last 2 hours
       * `cancellation_ratio` = past cancelled bookings / total bookings
       * `account_age_days`
       * `user_report_count`
       * `duplicate_image_hash_distance` (Image perceptual hashing)

12.2. Model Training & Scoring (backend/ml_engine/training/train_fraud.py)
     - Technique: Unsupervised Isolation Forest.
     - Output: Anomaly Score normalized from 0 to 100.
       * 0 - 39: Low Risk (Safe / Auto-approved)
       * 40 - 74: Medium Risk (Flagged for monitoring)
       * 75 - 100: High Risk (Hidden & pushed to Admin Review Queue)

12.3. Automated Safety Triggers
     - Model: FraudAlert (apps/fraud_management)
       * listing (ForeignKey -> Item, null=True)
       * user (ForeignKey -> User)
       * risk_score (IntegerField)
       * trigger_signals (JSONField)
       * status (PENDING_REVIEW, DISMISSED, ACTION_TAKEN)
     - Triggered automatically on listing creation or rapid cancellations.

[Definition of Done - Phase 12]:
[x] High-risk anomaly items are automatically quarantined until admin approval.
[x] Isolation Forest flags abnormal pricing (e.g. ₹5,000/day for a calculator).
[x] College admin receives instant alert in Admin Console.

================================================================================
PHASE 13: AI CONTENT-BASED & COMPLEMENTARY RECOMMENDATION ENGINE
================================================================================
[Goal]: Boost resource utilization by recommending relevant and complementary equipment.

13.1. Recommendation Algorithms
     - Algorithm 1: Similar Items (TF-IDF + Cosine Similarity on title, category, description).
     - Algorithm 2: Complementary Item Association:
       * If renting "Arduino Uno Kit" -> Recommend "Breadboard", "Ultrasonic Sensor", "Jumper Wires".
       * If renting "DSLR Camera" -> Recommend "Tripod", "SD Card", "Camera Bag".

13.2. API Endpoints
     - GET /api/ai/recommendations/personalized/ (Based on user browsing and rental history)
     - GET /api/ai/recommendations/complementary/<item_id>/ (For Item Detail view)

[Definition of Done - Phase 13]:
[x] Complementary accessories appear under "Students also rent these together".
[x] Cold-start fallback serves top-rated items from the student's department.

================================================================================
PHASE 14: CAMPUS SUSTAINABILITY IMPACT ANALYTICS & KPI DASHBOARD
================================================================================
[Goal]: Measure and visualize environmental savings and financial benefits for students.

14.1. Impact Calculation Logic
     - Formula:
       * Total Money Saved = Sum of (Item Original Price - Total Rental Price Paid).
       * Resources Reused Count = Total completed rental bookings.
       * Waste Avoided (kg) = Sum of category-specific embodied waste weights:
         - Textbook / Academic: 0.8 kg waste avoided
         - Calculator / Electronics: 1.2 kg waste avoided
         - Laptop / Computer: 8.5 kg waste avoided
         - Lab Kit / Hardware: 2.4 kg waste avoided
         - Bicycle / Daily Use: 14.0 kg waste avoided

14.2. API Endpoints
     - GET /api/sustainability/my-impact/ (Individual student contribution)
     - GET /api/sustainability/campus-impact/ (Aggregate campus-wide metrics)

14.3. Frontend Dashboard Implementation (Matching Mockup)
     - 4 KPI Stat Cards across top:
       1. [3] Active Rentals
       2. [8] Completed Rentals
       3. [₹2,450] Money Saved
       4. [12.4 kg] Waste Avoided
     - Sustainability Impact Widget:
       * Donut Chart showing "78% Your Contribution" (custom SVG / Recharts)
       * Summary list: Total Money Saved, Resources Reused, Estimated Waste Reduced.

[Definition of Done - Phase 14]:
[x] KPI numbers update dynamically after every completed rental.
[x] Donut chart and sustainability stats match the design mockup aesthetics.

================================================================================
PHASE 15: COLLEGE-SPECIFIC ADMIN PORTAL & ON-GROUND DISPUTE MEDIATION
================================================================================
[Goal]: Provide college administrators with complete visibility and tools to resolve disputes.

15.1. Database Models (apps/administration)
     - Model: Dispute
       * booking (ForeignKey -> Booking)
       * raised_by (ForeignKey -> User)
       * against_user (ForeignKey -> User)
       * issue_type (DAMAGED_ITEM, LATE_RETURN, WRONG_ITEM, NOT_RETURNED)
       * description (TextField)
       * evidence_image_urls (JSONField)
       * claimed_compensation (DecimalField)
       * status (OPEN, UNDER_INVESTIGATION, RESOLVED, DISMISSED)
       * resolution_decision (CharField: FULL_REFUND_RENTER, FORFEIT_DEPOSIT_TO_OWNER, SPLIT)
       * admin_notes (TextField)
       * resolved_at (DateTimeField, null=True)

15.2. Admin Features & API Endpoints
     - GET /api/admin/pending-verifications/ (Review student IDs)
     - POST /api/admin/verify-student/<id>/ (Approve/Reject student)
     - GET /api/admin/fraud-alerts/ (Inspect AI-flagged items)
     - GET /api/admin/disputes/ & POST /api/admin/resolve-dispute/<id>/
     - GET /api/admin/platform-analytics/ (Active users, volume, transaction revenue)

15.3. Frontend Admin Dashboard
     - Accessible only to users with `is_staff = True`.
     - Fast moderation queue with one-click verification approvals and dispute arbitration.

[Definition of Done - Phase 15]:
[x] Campus admin can approve or reject pending student registrations.
[x] Disputes can be adjudicated with automated deposit deduction or refund.
[x] Platform statistics show live campus health.

================================================================================
PHASE 16: BACKGROUND WORKERS, SCHEDULED JOBS & REAL-TIME NOTIFICATIONS
================================================================================
[Goal]: Automate booking expirations, return reminders, and deliver real-time alerts.

16.1. Celery + Redis Task Scheduler (backend/config/celery.py)
     - Task 1: `check_unanswered_booking_requests` (Runs every 30 mins)
       * Auto-cancels requests older than 24 hours without owner response.
     - Task 2: `send_return_due_reminders` (Runs hourly)
       * Alerts renter 24 hours and 2 hours before scheduled return.
     - Task 3: `mark_overdue_bookings` (Runs every 2 hours)
       * Flags rentals past their end date as OVERDUE and alerts both parties.

16.2. In-App Notification System (apps/notifications)
     - Model: Notification
       * user (ForeignKey -> User)
       * title (CharField)
       * message (TextField)
       * link_url (CharField)
       * is_read (BooleanField, default=False)
       * created_at (DateTimeField, auto_now_add=True)
     - Endpoints:
       * GET /api/notifications/ (Unread count + list)
       * PATCH /api/notifications/<id>/read/
       * POST /api/notifications/mark-all-read/

[Definition of Done - Phase 16]:
[x] Celery worker and Celery beat scheduler execute tasks without memory leaks.
[x] Return reminders notify students in-app and via email.
[x] Notification bell in header displays badge counter and updates smoothly.

================================================================================
PHASE 17: FRONTEND UI POLISH (PIXEL-PERFECT TO DASHBOARD MOCKUP)
================================================================================
[Goal]: Deliver a gorgeous, responsive, accessible interface matching the reference mockup.

17.1. Design System Tokens (Tailwind Configuration)
     - Colors:
       * Background Canvas: `#FBF9F5` (Warm Cream)
       * Sidebar Midnight: `#0A1128` / `#0F172A`
       * Primary Amber/Yellow: `#FBBF24` / `#F59E0B`
       * Text Primary: `#1E293B`
       * Text Muted: `#64748B`
     - Typography: Inter / Plus Jakarta Sans font family.
     - Elevation: Subtle, soft card shadows (`shadow-sm`, `shadow-md` with warm tints).

17.2. Screen Deliverables
     - [1] Student Dashboard (`/dashboard`) -> Exact match to image mockup.
     - [2] Explore / Marketplace (`/explore`) -> Search, filter sidebar, card grid.
     - [3] Item Detail (`/items/:id`) -> Gallery, calendar, pricing breakdown, owner trust card.
     - [4] List Item Wizard (`/list-item`) -> Clean multi-step flow with AI pricing box.
     - [5] My Rentals & Bookings (`/rentals`) -> Timeline view with QR handover button.
     - [6] My Listings (`/listings`) -> Inventory table with toggle switches.
     - [7] AI Insights (`/ai-insights`) -> Demand trends, suggested items to list.
     - [8] Sustainability (`/sustainability`) -> Full campus impact charts and badges.
     - [9] Admin Portal (`/admin-portal`) -> Moderation, verification, disputes.

[Definition of Done - Phase 17]:
[x] Pixel-perfect visual alignment with `RentTogether Campus Rental Dashboard.png`.
[x] Fully responsive across mobile (375px+), tablet, and desktop viewports.
[x] Zero broken links, console errors, or layout shifts.

================================================================================
PHASE 18: SECURITY AUDITS, COMPREHENSIVE TESTING & CLOUD DEPLOYMENT
================================================================================
[Goal]: Execute end-to-end testing, harden security, and launch the platform on cloud infrastructure.

18.1. Automated Test Suites
     - Backend Tests:
       * `pytest` covering authentication, permission gates, single-college isolation.
       * Booking state machine tests verifying zero invalid state transitions.
       * ML inference unit tests verifying outputs within expected boundary limits.
     - Frontend Tests:
       * Component unit tests using Vitest and React Testing Library.
       * End-to-end booking flow test with Cypress or Playwright.

18.2. Security Hardening Checklist
     - [x] CORS whitelist locked to production frontend URL.
     - [x] SQL injection prevented via Django ORM parameterized queries.
     - [x] Rate limiting configured on `/api/auth/*` and search endpoints.
     - [x] Cloudinary upload signatures strictly validated server-side.
     - [x] Secret keys and Razorpay secrets stored exclusively in environment variables.

18.3. Production Cloud Deployment
     - Frontend: Deployed on Vercel with automatic CI/CD from main branch.
     - Backend API: Dockerized and deployed on Render / Railway / GCP Cloud Run.
     - Database: Neon Serverless PostgreSQL with connection pooling.
     - Cache & Celery: Managed Redis (Upstash / Redis Cloud).
     - Storage: Cloudinary CDN.

[Definition of Done - Phase 18]:
[x] All automated tests pass with > 85% code coverage.
[x] Live HTTPS production URLs for both Frontend and Backend API functioning seamlessly.
[x] Complete end-to-end smoke test executed: Student registers -> lists item -> peer rents -> payment -> QR handover -> return -> deposit refund.

================================================================================
                       100% COMPLETION SUMMARY MATRIX
================================================================================
Phase 01 to 03: Strong Identity, Domain Gating & User Trust
Phase 04 to 06: Fast Marketplace, Clear Listings & Zero-Conflict Calendar
Phase 07 to 09: Bulletproof Rental State Machine, QR Handover & Safe Escrow
Phase 10 to 13: 4 Distinct AI Engines (Pricing, Demand, Fraud, Recommendations)
Phase 14 to 16: Sustainability Analytics, Campus Moderation & Background Jobs
Phase 17 to 18: Pixel-Perfect Frontend & Robust Cloud Production Deployment

Follow each phase sequentially to build RentTogether with 100% precision.
================================================================================

