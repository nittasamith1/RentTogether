# RentTogether — Version 1 Scope Specification
**Brand:** RentTogether  
**Tagline:** *Share Smart. Save More. Live Better.*  
**Product Identity:** AI-Powered Campus Resource Sharing Platform  
**Target Milestone:** Version 1 (V1) — Single-College Closed Community Deployment (Aditya University)  

---

## 1. Overview & Core Philosophy

**RentTogether Version 1** is designed and scoped as a **single-college, closed-community peer-to-peer resource sharing platform**. 

Instead of opening the platform to multiple universities or external users, Version 1 focuses on creating a high-trust, friction-free sharing ecosystem within **one designated college campus** (**Aditya University**).

### Key Realities of Version 1:
1. **Zero Shipping/Courier Complexity:** All physical resource exchanges and returns occur in person on campus (e.g., Central Library, North Canteen, Academic Blocks, Hostel gates).
2. **High Mutual Trust & Zero Deposit (₹0.00):** Because borrowers and lenders share the same verified campus identity, institutional accountability replaces predatory security deposits.
3. **Single Identity, Dual Role:** A student uses one unified account to both rent items (Renter) and lend items (Owner) without needing multiple logins.
4. **Campus-Specific AI Calibrations:** AI pricing, demand forecasting, and department recommendations are directly aligned with Aditya University's academic calendar, exam schedules, and department needs.
5. **Real Database Metrics:** All sustainability, savings, and contribution statistics are strictly derived from live database records without synthetic fallback defaults.

---

## 2. Version 1 Core Boundaries & System Rules

| Rule Area | Version 1 Implementation (Single College) | Future Roadmap (V2+ Expansion) |
| :--- | :--- | :--- |
| **User Eligibility** | Restricted exclusively to verified students of Aditya University | Multi-college registration across universities |
| **Email Verification** | Institutional domain check (`@adityauniversity.in`, `@aditya.ac.in`) | Multi-domain college directory & auto-routing |
| **Identity Verification** | Roll Number + Physical College ID card upload (Cloudinary CDN) + Admin review | National student identity / DigiLocker integration |
| **Marketplace Catalog** | 100% intra-college items (students only see peer listings) | Cross-campus browsing & inter-college search |
| **Handover Method** | In-person physical handover at designated campus meetup spots with OTP/QR | On-campus lockers / inter-city courier delivery |
| **Deposit Model** | ₹0.00 security deposit with peer cash exchange at physical handover | Optional automated digital escrow hold |
| **AI Demand Forecast** | Calibrated to the college's internal exam & project calendar | Regional/State-wide academic seasonal models |
| **Platform Admin** | College-specific administrators (faculty/student coordinators) | Super-admin dashboard + multi-tenant managers |

---

## 3. Module-by-Module Scope Breakdown for V1

### Module 1: Authentication & Institutional Verification
* **Restricted Signup:** The platform validates email addresses against the configured college domain. External domains (e.g., generic Gmail/Yahoo) are rejected.
* **Student Identity Verification:**
  * Student enters official Roll Number / Student ID.
  * Upload of institutional Student ID Card stored securely on Cloudinary CDN.
  * College-specific admin reviews and approves student verification status.
* **Security:** JWT authentication with access and refresh tokens.

### Module 2: Unified Student Profile
* **Single Account Architecture:** Every verified student has one profile tracking both:
  * **Borrowing History:** Active rentals, return deadlines, verified monetary savings vs retail.
  * **Lending History:** Listed items, incoming requests, rental earnings.
  * **Dual Reputation Score:** Separate ratings for "Trust as Renter" (returns on time, takes care of items) and "Trust as Owner" (accurate item condition, fair pricing).

### Module 3 & 4: Intra-Campus Marketplace & Item Management
* **Campus Catalog Isolation:** All queries filter items by the host college. Students only discover items owned by peers in their institution.
* **Department & Category Filtering:**
  * *Academic:* Textbooks, reference materials, Casio scientific calculators.
  * *Electronics:* Laptops, cameras, drawing tablets, audio equipment.
  * *Laboratory & Project:* Arduino boards, Raspberry Pi, sensor kits, breadboards, lab aprons.
  * *Daily Campus Essentials:* Bicycles, gym gear, sports equipment, musical instruments.
* **Campus Pickup Points:** Listings specify convenient on-campus handover points (e.g., Central Library, North Canteen, Gate 1).
* **Cloudinary Media Pipeline:** Direct authenticated image uploads with automatic WebP compression, aspect cropping, and CDN distribution.

### Module 5: Rental & Booking Lifecycle (In-Person Handover)
1. **Search & Availability:** Renter views real-time calendar availability of the item.
2. **Booking Request:** Renter selects rental dates and sends request to the owner.
3. **Owner Approval:** Owner accepts or declines within a set time window (e.g., 24 hours).
4. **In-Person Offline Cash Settlement:** Direct student-to-student cash payment upon item handover with ₹0 deposit and 0% platform deductions.
5. **Campus Meetup & Cryptographic Handover:** Both students meet on campus; verification completed via 6-digit one-time passcode or scannable QR token.
6. **Return & Verification:** Item is returned at the end of the duration; owner verifies condition and confirms return via OTP/QR.
7. **Mutual Reviews:** Both students rate and review each other to build on-campus reputation.

### Module 6 to 9: Single-College AI / ML Suite
* **AI Fair Price Prediction:**
  * Analyzes historical campus rental rates, item age, condition, and original price.
  * Suggests competitive, student-affordable daily and weekly rates (e.g., ₹25/day for Casio fx-991CW).
* **AI Fraud & Anomaly Detection:**
  * Flags non-institutional activity, duplicate item listings, abnormal price spikes, and serial cancellation patterns.
  * Assigns a Risk Score (0–100); high-risk accounts are automatically queued for college admin review.
* **AI Demand Prediction (Campus Academic Calendar Aware):**
  * Models peak demand surges tied directly to the college's semester milestones:
    * *Midterm / End-term Exams:* Spikes demand for scientific calculators and core textbooks.
    * *Capstone / Mini-Project Weeks:* Spikes demand for Arduino kits, sensors, and development boards.
    * *College Fests & Cultural Weeks:* Spikes demand for DSLR cameras, microphones, and traditional wear.
* **AI Department Recommendation Engine (Phase 13):**
  * Serves curriculum-aware suggestions (e.g., AIML, CSE, ECE) with contextual badge highlights (*"AIML Core Math & Exam Gear"*, *"IoT & Embedded Systems Lab"*).

### Module 10 & 11: Campus Scheduling, Notifications & Transactions
* **Conflict-Free Smart Calendar:** Automatically prevents overlapping bookings for the same resource using PostgreSQL pessimistic row-level locking (`select_for_update`).
* **Notification System:** In-app updates for booking requests, approvals, return due-date reminders, and completed handovers.
* **Notification Storage Cleanup:** Allows students to clear read notifications to prevent clutter and database storage bloat.

### Module 12: Verified Campus Sustainability Analytics (Phase 14)
* Quantifies individual and campus-wide environmental and financial impact strictly from verified database records:
  * **Individual Money Saved:** Calculated exclusively for borrowed items:
    $$\text{Money Saved} = \text{Item Retail Price} - \text{Total Rental Fee Paid}$$
  * **Embodied Waste Reduced (kg):** Category-specific electronic/material waste avoided.
  * **CO₂ Emissions Avoided & Trees Equivalent:** Standard lifecycle formulas ($2.1 \times \text{waste avoided}$).
  * **Dynamic Campus Contribution Percentile:** Visual donut gauge accurately reflecting:
    $$\text{Contribution} = \left(\frac{\text{Student Completed Rentals}}{\text{Campus Total Completed Rentals}}\right) \times 100$$
  * **Zero Synthetic Fallbacks:** Eliminates arbitrary default benchmarks (`DEFAULT_CATEGORY_RETAIL_PRICE`) to guarantee 100% database fidelity.

### Module 13: College-Specific Administration
* **Dedicated Campus Admin Portal:**
  * Student verification queue (approving student IDs and enrollment).
  * Listing moderation (removing inappropriate or prohibited items).
  * Risk & fraud monitoring (inspecting AI-generated fraud alerts).
  * On-campus dispute mediation (handling lost, late, or damaged item disputes).
  * Platform analytics (campus adoption rate, top active categories, total transactions).

---

## 4. UI/UX & Responsive Layout Architecture
* **Zero-Layout-Shift Navigation:** Persistent application shell (`AppLayout`) ensures sidebar, navbar, and background prefetching stay mounted during route transitions.
* **Mobile-Optimized KPI Cards:** 2x2 grid alignment on mobile screens with touch-friendly targets.
* **Top Progress Feedback:** Slim YouTube/GitHub-style top progress bar without disruptive full-screen spinners.

---

## 5. Architectural Readiness for Future Scaling

While Version 1 is strictly single-college in business logic, the **database architecture is built multi-tenant ready**:
* The `College` table serves as the primary root entity.
* `User`, `StudentProfile`, `Item`, and `Booking` models all maintain foreign-key links to `College`.
* In V1, the application is pinned to the single host college (Aditya University).
* When scaling to V2 (multi-college), no destructive database migrations will be needed — only loosening the query filters and adding college-selection routing.

---

## 6. Summary of Version 1 Scope

> **In Version 1, RentTogether is a self-contained, high-trust campus sharing network.** Only verified students of Aditya University can register, list, browse, rent, and interact. All physical handovers, dispute resolutions, zero-deposit cash settlements, and sustainability calculations are tailored strictly to this single campus community.
