# 🐾 PetCare Platform — Product Backlog

> Derived from founder discovery call transcript (21 Feb). Three deliverables: **Customer App** (mobile), **Vendor App** (mobile), **Admin Panel** (web).

---

## Legend
- **P0** — MVP / must-have for launch
- **P1** — High priority, ship shortly after MVP
- **P2** — Post-launch / future iteration

---

## EPIC 1: Authentication & Onboarding

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| AUTH-01 | Customer sign-up via phone number (OTP) | P0 | Phone number is primary identity |
| AUTH-02 | Customer login / session management | P0 | |
| AUTH-03 | Vendor sign-up & onboarding (via Admin approval) | P0 | Admin must approve before vendor goes live |
| AUTH-04 | Admin login (web panel) | P0 | Super admin role |
| AUTH-05 | Location & state capture at sign-up | P0 | Required for emergency vet access feature |
| AUTH-06 | Referral code entry at sign-up (grants 50 coins) | P1 | |

---

## EPIC 2: Pet Profile Management

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| PET-01 | Add multiple pets per user account | P0 | Name, species, breed, age, photo |
| PET-02 | Pet document vault — upload up to 10 files per pet | P0 | PDF: vaccination records, prescriptions, reports |
| PET-03 | Documents visible to admin (not downloadable by default) | P0 | Legal/dispute compliance |
| PET-04 | Document type tags (vaccination, prescription, report, other) | P1 | |

---

## EPIC 3: Service Booking (Core)

### 3a — Service Catalogue (Admin Managed)
| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| SVC-01 | Admin can add/edit/remove services with custom icon & name | P0 | Dynamic service catalogue like UrbanClap |
| SVC-02 | Each service configurable as "Rapido" (home) or "Multi-Vendor" (shop) or both | P0 | |
| SVC-03 | Services supported at launch: Grooming, Boarding, Training, Walking, Spa, Vaccination, Clinic Visit, Vet Visit, Home Visit | P0 | |

### 3b — Rapido Model (Home Service / On-demand)
| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| RAP-01 | Customer posts a service request (no specific vendor selected) | P0 | Broadcast to eligible vendors |
| RAP-02 | Vendor accepts request; slot is booked and locked | P0 | First-accept wins |
| RAP-03 | Customer sees booking confirmation with no vendor contact info | P0 | Phone number must NOT be shown |
| RAP-04 | Vendor sees customer name only (no phone number) | P0 | Anti-bypass protection |
| RAP-05 | Star rating & review after service completion | P1 | |

### 3c — Multi-Vendor Model (Shop / Swiggy-style)
| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| MUL-01 | Customer browses gallery of vendor photos/videos per service type | P0 | No vendor name/contact shown until booking paid |
| MUL-02 | Customer clicks photo → sees service details & pricing | P0 | |
| MUL-03 | Customer pays booking fee → vendor name + location unlocked | P0 | Booking fees non-refundable |
| MUL-04 | Cancellation locked 2 hours before appointment (physical) | P0 | |
| MUL-05 | Commission split per service type (configurable by admin) | P0 | e.g. 80% vendor / 20% platform |
| MUL-06 | Different pricing for home delivery vs. in-store visit | P0 | |

---

## EPIC 4: Video Consultation

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| VID-01 | Customer books video vet consultation (Rapido model) | P0 | |
| VID-02 | Vet/consultant accepts request at scheduled time | P0 | |
| VID-03 | Consultant pastes Google Meet link into app upon acceptance | P0 | App generates no video infra; link provided manually |
| VID-04 | Customer receives clickable Meet link in-app | P0 | |
| VID-05 | No customer contact info shared with consultant | P0 | |

---

## EPIC 5: Payments & Settlements

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| PAY-01 | Razorpay integration for customer payments | P0 | Evaluate lower-fee alternatives |
| PAY-02 | Platform records all transactions with commission split | P0 | |
| PAY-03 | Weekly settlement report generated for admin | P0 | Manual disbursement by backend team |
| PAY-04 | Refund processing via Razorpay (admin-initiated) | P0 | |
| PAY-05 | Charity micro-donation toggle at checkout (+₹1 or +₹2) | P1 | Optional, customer-controlled |
| PAY-06 | Automated payout API integration | P2 | When scale justifies it |

---

## EPIC 6: Dynamic QR Code & Pet ID

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| QR-01 | Auto-generate unique QR code per pet | P0 | |
| QR-02 | Pet profile page with "QR" tab showing downloadable QR file | P0 | Admin processes physical tag production |
| QR-03 | Public web page rendered when QR is scanned (no app required) | P0 | Link-tree style layout |
| QR-04 | Owner configures visibility toggles per field (name, photo, age, medical records, contact) | P0 | Granular on/off per data field |
| QR-05 | "Lost Mode" toggle — shows finder a contact button + WhatsApp link | P0 | |
| QR-06 | When QR is scanned: capture scanner's phone number + GPS location | P1 | Scanner must verify via phone OTP |
| QR-07 | Owner notified (push/SMS) each time QR is scanned | P1 | |
| QR-08 | Medical record visibility toggle (show/hide records on scan) | P0 | |

---

## EPIC 7: Petrogram (Social Module)

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| SOC-01 | Upload 1 photo or 1 video per day (24-hour story format) | P1 | Auto-deleted after 24 hrs to control storage costs |
| SOC-02 | Story feed — all active stories visible to all users | P1 | Chronological / random; no algorithmic feed |
| SOC-03 | Follow system (follow other users/pets) | P1 | |
| SOC-04 | Like on stories | P1 | |
| SOC-05 | Comments — off by default, owner can enable | P1 | |
| SOC-06 | No share/forward feature | P1 | Intentional design constraint |
| SOC-07 | Content moderation queue in admin panel | P1 | |

---

## EPIC 8: Emergency Features

### 8a — Emergency Vet Access
| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| EMG-01 | State-based emergency vet/clinic directory (29 states) | P0 | Seeded from scraped public data |
| EMG-02 | One-tap call button to nearest emergency vet | P0 | Opens native phone dialler |
| EMG-03 | Pet ambulance directory per state | P0 | Same DB, separate category |

### 8b — Lost Pet Recovery Network
| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| LST-01 | Owner reports pet as lost (with photos, description) | P0 | |
| LST-02 | Lost pets gallery visible to all app users | P0 | |
| LST-03 | "I Found This Pet" flow — finder submits claim with proof | P0 | Goes to admin review queue |
| LST-04 | Admin reviews claims; contacts owner with verified finder info | P0 | No auto-reunification; admin handles dispute |
| LST-05 | Owner must submit proof of ownership to admin to claim | P0 | Medical records or photo evidence |

---

## EPIC 9: E-Commerce Store

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| ECO-01 | Product catalogue: pet clothing, gifts, accessories | P1 | Standard e-commerce stack |
| ECO-02 | Cart, checkout, order tracking | P1 | |
| ECO-03 | Coin redemption at checkout (max 100 coins per purchase) | P1 | |
| ECO-04 | Admin product management (add/edit/remove listings) | P1 | |
| ECO-05 | Medicine sales | P2 | Requires separate license; future phase |

---

## EPIC 10: Pet Meal Planner (Subscription)

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| MEAL-01 | Customer sets up meal schedule (meal name, time, frequency) | P1 | |
| MEAL-02 | Weekly subscription purchase for meal delivery service | P1 | ₹ amount configurable by admin |
| MEAL-03 | Push notification reminders per meal time | P1 | |
| MEAL-04 | Admin manages delivery backend (out of app scope) | P1 | App only handles scheduling & payment |

---

## EPIC 11: Pet Breeder Module

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| BRD-01 | Breeder listings — photo grid per breed | P1 | Multi-vendor model |
| BRD-02 | Vendor uploads listing; admin approves/rejects | P1 | Rejected = purged from system immediately |
| BRD-03 | Customer pays booking fee → receives breeder location | P1 | Name/location hidden until payment |
| BRD-04 | Booking fees non-refundable; cancellation cutoff 5 hours prior | P1 | |

---

## EPIC 12: Pet Celebration & Lifestyle Experiences

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| CEL-01 | Birthday party / event booking (admin is sole vendor) | P1 | |
| CEL-02 | Pre-set party packages + custom DIY option (free-text message) | P1 | DIY triggers manual fulfilment by admin team |
| CEL-03 | Admin manages event calendar and capacity | P1 | |

---

## EPIC 13: AI Chatbot

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| AI-01 | Pet-aware chatbot using pet profile data as context | P1 | |
| AI-02 | Preset quick-reply options to minimise API token spend | P1 | Button-first UX, free text as fallback |
| AI-03 | Initial implementation via OpenAI API (with rate limiting / delay) | P1 | 10–15s response time acceptable at launch |
| AI-04 | Self-hosted Ollama instance on GPU cloud | P2 | Migrate when volume justifies cost |

---

## EPIC 14: Gamification & Loyalty

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| GAM-01 | Daily login coin reward (pop-up every 24 hrs) | P1 | |
| GAM-02 | Coin balance & transaction history in user profile | P1 | |
| GAM-03 | Referral code generation per user | P1 | |
| GAM-04 | Referral sign-up credits 50 coins to referrer | P1 | |
| GAM-05 | Coin redemption in e-commerce (max 100/purchase) | P1 | |

---

## EPIC 15: Charity Fund Module

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| CHR-01 | Micro-donation toggle at every checkout (₹1 or ₹2) | P1 | |
| CHR-02 | Admin uploads charity gallery (photos, videos, impact stories) | P1 | |
| CHR-03 | Charity fund total displayed in app | P1 | |
| CHR-04 | All platform revenue streams (bookings, subscriptions, e-commerce) contribute | P1 | |

---

## EPIC 16: Vendor Panel (Mobile / Web App)

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| VND-01 | Vendor onboarding form (submitted to admin for approval) | P0 | |
| VND-02 | Service listing management (add services, set prices, upload photos/videos) | P0 | |
| VND-03 | Incoming booking request feed | P0 | |
| VND-04 | Accept / reject booking request | P0 | |
| VND-05 | Booking calendar / schedule view | P0 | |
| VND-06 | For video consultations: paste Google Meet link on acceptance | P0 | |
| VND-07 | Earnings dashboard (pending settlement) | P1 | |
| VND-08 | Customer name visible; phone number hidden | P0 | Anti-bypass enforcement |

---

## EPIC 17: Admin Panel (Web)

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| ADM-01 | Vendor onboarding approval / rejection workflow | P0 | |
| ADM-02 | Customer profile viewer (orders, bookings, pet records) | P0 | |
| ADM-03 | Platform-wide booking management | P0 | |
| ADM-04 | Financial dashboard — all transactions, commission splits | P0 | |
| ADM-05 | Weekly settlement report generation | P0 | |
| ADM-06 | Refund processing | P0 | |
| ADM-07 | Service catalogue management (add/edit/remove services & icons) | P0 | |
| ADM-08 | Content moderation queue (Petrogram, breeder listings) | P1 | |
| ADM-09 | Ban / suspend user or vendor | P0 | |
| ADM-10 | Lost & found claim review queue | P0 | |
| ADM-11 | Charity fund gallery management | P1 | |
| ADM-12 | Emergency vet / ambulance directory management | P0 | |
| ADM-13 | Commission split configuration per service | P0 | |
| ADM-14 | QR code tag order fulfilment (download QR file per pet) | P1 | |
| ADM-15 | Vendor photo/media approval for multi-vendor listings | P0 | |

---

## EPIC 18: Notifications

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| NTF-01 | Push notification: booking confirmed | P0 | |
| NTF-02 | Push notification: booking accepted by vendor | P0 | |
| NTF-03 | Push notification: cancellation window closing soon | P0 | |
| NTF-04 | Push notification: video consultation link ready | P0 | |
| NTF-05 | Push notification: QR code scanned (with location) | P1 | |
| NTF-06 | Push notification: daily login coin reminder | P1 | |
| NTF-07 | Push notification: meal reminder | P1 | |
| NTF-08 | SMS fallback for critical notifications | P1 | |

---

## Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-01 | Phone number never exposed between customer ↔ vendor | P0 |
| NFR-02 | Vendor location / name hidden until booking fee paid | P0 |
| NFR-03 | Pet documents accessible by admin; not downloadable externally by default | P0 |
| NFR-04 | All media (Petrogram stories) auto-deleted after 24 hours | P1 |
| NFR-05 | Vendor-uploaded media compressed before storage | P1 |
| NFR-06 | Platform designed to support all animals, not pets only | P0 |
| NFR-07 | All features must be configurable/scalable for future business model changes | P0 |
| NFR-08 | App must gracefully handle up to 10,000 concurrent users before infra renegotiation | P1 |

---

## Out of Scope (This Phase)

- Medicine / pharmacy sales (requires regulatory license)
- Automated vendor payout (awaiting bank API partnership)
- Pet insurance integration (requires insurer tie-ups)
- Google Maps API / location-based vendor search
- In-app video calling infra (Google Meet links used instead)
- Native reel/video algorithm (no algorithmic feed)
