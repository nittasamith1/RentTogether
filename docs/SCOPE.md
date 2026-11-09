# RentTogether — Version 1 Scope Specification
**Brand:** RentTogether  
**Tagline:** *Share Smart. Save More. Live Better.*  
**Product Identity:** AI-Powered Campus Resource Sharing Platform  
**Target Milestone:** Version 1 (V1) — Single-College Closed Community Deployment  

---

## 1. Overview & Core Philosophy

**RentTogether Version 1** is designed and scoped as a **single-college, closed-community peer-to-peer resource sharing platform**. 

Instead of opening the platform to multiple universities or external users, Version 1 focuses on creating a high-trust, friction-free sharing ecosystem within **one designated college campus**.

### Key Realities of Version 1:
1. **Zero Shipping/Courier Complexity:** All physical resource exchanges and returns occur in person on campus (e.g., Library, Canteen, Academic Blocks, Hostel gates).
2. **High Mutual Trust:** Because borrowers and lenders share the same campus, peer accountability is naturally high, reducing theft and damage risks.
3. **Single Identity, Dual Role:** A student uses one unified account to both rent items (Renter) and lend items (Owner) without needing multiple logins.
4. **Campus-Specific AI Calibrations:** AI pricing, demand forecasting, and fraud detection are directly aligned with that specific college's academic calendar, exam schedules, and department needs.

---

## 2. Version 1 Core Boundaries & System Rules

| Rule Area | Version 1 Implementation (Single College) | Future Roadmap (V2+ Expansion) |
| :--- | :--- | :--- |
| **User Eligibility** | Restricted exclusively to students of the selected college | Multi-college registration across universities |
| **Email Verification** | Institutional domain check (e.g., `@college.edu`, `@campus.ac.in`) | Multi-domain college directory & auto-routing |
| **Identity Verification** | Roll Number + College ID card verification | National student identity / DigiLocker integration |
| **Marketplace Catalog** | 100% intra-college items (students only see peer listings) | Cross-campus browsing & inter-college search |
| **Handover Method** | In-person physical handover at designated campus meetup spots | On-campus lockers / inter-city courier delivery |
| **AI Demand Forecast** | Calibrated to the college's internal exam & project calendar | Regional/State-wide academic seasonal models |
| **Platform Admin** | College-specific administrators (faculty/student coordinators) | Super-admin dashboard + multi-tenant managers |

---

## 3. Module-by-Module Scope Breakdown for V1

### Module 1: Authentication & Institutional Verification
* **Restricted Signup:** The platform validates email addresses against the configured college domain. External domains (e.g., generic Gmail/Yahoo) are rejected unless whitelisted by the college admin.
* **Student Identity Verification:**
  * Student enters official Roll Number / Student ID.
  * Upload of institutional Student ID Card for initial verification.
  * College-specific admin reviews and approves student verification status.
* **Security:** JWT authentication with access and refresh tokens.

### Module 2: Unified Student Profile
* **Single Account Architecture:** Every verified student has one profile tracking both:
  * **Borrowing History:** Active rentals, return deadlines, total money saved.
  * **Lending History:** Listed items, incoming requests, rental earnings.
  * **Dual Reputation Score:** Separate ratings for "Trust as Renter" (returns on time, takes care of items) and "Trust as Owner" (accurate item condition, fair pricing).

### Module 3 & 4: Intra-Campus Marketplace & Item Management
* **Campus Catalog Isolation:** All queries filter items by the host college. Students only discover items owned by peers in their institution.
* **Department & Category Filtering:**
  * *Academic:* Textbooks, reference materials, Casio scientific calculators.
  * *Electronics:* Laptops, cameras, drawing tablets, audio equipment.
  * *Laboratory & Project:* Arduino boards, Raspberry Pi, sensor kits, breadboards, lab coats.
  * *Daily Campus Essentials:* Bicycles, gym gear, sports equipment, musical instruments.
* **Campus Pickup Points:** Listings specify convenient on-campus handover points (e.g., Central Library, North Canteen, Block A Lobby).

### Module 5: Rental & Booking Lifecycle (In-Person Handover)
1. **Search & Availability:** Renter views real-time calendar availability of the item.
2. **Booking Request:** Renter selects rental dates and sends request to the owner.
3. **Owner Approval:** Owner accepts or declines within a set time window (e.g., 24 hours).
4. **Deposit & Escrow Payment:** Renter pays the rental fee plus refundable security deposit via payment gateway (Razorpay Test Mode in V1).
5. **Campus Meetup & Handover:** Both students meet on campus; renter inspects item and pickup is confirmed.
6. **Return & Verification:** Item is returned at the end of the duration; owner verifies condition and confirms return.
7. **Deposit Release:** Security deposit is instantly refunded to renter; rental earnings (minus small platform fee) credit to owner.
8. **Mutual Reviews:** Both students rate each other.

### Module 6 to 9: Single-College AI / ML Suite
* **AI Fair Price Prediction:**
  * Analyzes historical campus rental rates, item age, condition, and original price.
  * Suggests competitive, student-affordable daily and weekly rates (e.g., ₹25/day for Casio 991-EX).
* **AI Fraud & Anomaly Detection:**
  * Flags non-institutional activity, duplicate item listings, abnormal price spikes, and serial cancellation patterns.
  * Assigns a Risk Score (0–100); high-risk accounts are automatically queued for college admin review.
* **AI Demand Prediction (Campus Academic Calendar Aware):**
  * Models peak demand surges tied directly to the college's semester milestones:
    * *Midterm / End-term Exams:* Spikes demand for scientific calculators and core textbooks.
    * *Capstone / Mini-Project Weeks:* Spikes demand for Arduino kits, sensors, and development boards.
    * *College Fests & Cultural Weeks:* Spikes demand for DSLR cameras, microphones, and traditional wear.
* **AI Recommendation Engine:**
  * Content-based recommendations suggesting complementary tools (e.g., renting an *Arduino Uno* suggests *jumper wires, ultrasonic sensors, and breadboards*).

### Module 10 & 11: Campus Scheduling, Notifications & Transactions
* **Conflict-Free Smart Calendar:** Automatically prevents overlapping bookings for the same resource.
* **Notification System:** In-app and email alerts for booking requests, approvals, return due-date reminders, and payment receipts.
* **Financial Ledger:** Transparent records of rental payments, security deposit escrow holds, refunds, and owner payout balances.

### Module 12: Campus Sustainability Analytics
* Quantifies the campus-wide environmental and financial impact:
  * **Total Money Saved by Students:** Calculated vs. purchasing new items.
  * **Resources Reused Count:** Number of peer-to-peer rental cycles.
  * **Estimated Waste Reduced (kg):** Avoided e-waste and manufacturing footprint.
  * **Student Contribution Metric:** Visual donut chart on the student dashboard showing personal savings and sustainability score.

### Module 13: College-Specific Administration
* **Dedicated Campus Admin Portal:**
  * Student verification queue (approving student IDs and enrollment).
  * Listing moderation (removing inappropriate or prohibited items).
  * Risk & fraud monitoring (inspecting AI-generated fraud alerts).
  * On-campus dispute mediation (handling lost, late, or damaged item disputes).
  * Platform analytics (campus adoption rate, top active categories, total transactions).

---

## 4. Architectural Readiness for Future Scaling

While Version 1 is strictly single-college in business logic, the **database architecture is built multi-tenant ready**:
* The `College` table serves as the primary root entity.
* `User`, `StudentProfile`, `Item`, and `Booking` models all maintain foreign-key links to `College`.
* In V1, the application is pinned to the single host college.
* When scaling to V2 (multi-college), no destructive database migrations will be needed — only loosening the query filters and adding college-selection routing.

---

## 5. Summary of Version 1 Scope

> **In Version 1, RentTogether is a self-contained, high-trust campus sharing network.** Only verified students of the designated college can register, list, browse, rent, and interact. All payments, physical handovers, dispute resolutions, and AI predictions are tailored strictly to this single campus community.

