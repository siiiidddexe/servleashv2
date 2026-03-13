# Servleash v2 — Completed Backlog Items

> Every item below has verified implementation in the codebase.

---

## EPIC 1: Authentication & Onboarding

| ID | Story | Evidence |
|----|-------|----------|
| AUTH-02 | Customer login / session management | `src/pages/shared/Login.jsx`, `POST /api/auth/login`, `POST /api/auth/verify-otp`, sessions table, `src/context/AuthContext.jsx` |
| AUTH-04 | Admin login (web panel) | Same login flow with `role: "admin"`, protected admin routes in `src/App.jsx`, `src/pages/admin/AdminHome.jsx` |
| AUTH-05 | Location & state capture at sign-up | `src/pages/shared/Signup.jsx` (city field), `POST /api/auth/register` stores `city` on user record |

---

## EPIC 2: Pet Profile Management

| ID | Story | Evidence |
|----|-------|----------|
| PET-01 | Add multiple pets per user account | `src/pages/customer/MyPets.jsx`, `GET/POST/PUT/DELETE /api/my-pets`, `user_pets` table |
| PET-02 | Pet document vault — upload up to 10 files per pet | `src/pages/customer/PetDocs.jsx`, `POST /api/my-pets/:id/documents` (10-doc limit enforced in `server/index.js:710`) |
| PET-04 | Document type tags | `PetDocs.jsx` `DOC_TYPES` array, `docType` field accepted by upload endpoint |

---

## EPIC 3: Service Booking (Core)

### 3a — Service Catalogue

| ID | Story | Evidence |
|----|-------|----------|
| SVC-01 | Admin can add/edit/remove services with custom icon & name | `src/pages/admin/AdminServices.jsx`, `POST/PUT/DELETE /api/admin/services` |
| SVC-02 | Service configurable as Rapido / Multi-Vendor / both | `serviceMode` field (`home_delivery`, `in_store`, `both`) on service records; seeded and editable via admin |
| SVC-03 | Services at launch (Grooming, Boarding, Training, Walking, Vaccination, Vet Visit, Video Consult, etc.) | `DEFAULT_SERVICES` array in `server/index.js:136–145` seeds all core categories |

### 3b — Rapido Model

| ID | Story | Evidence |
|----|-------|----------|
| RAP-01 | Customer posts a service request (no specific vendor selected) | `src/pages/customer/BookingFlow.jsx`, `POST /api/bookings` with no `vendorId` sets `status: "pending"` (`server/index.js:781`) |
| RAP-02 | Vendor accepts request; slot is booked and locked | `src/pages/vendor/VendorBookings.jsx`, `PUT /api/vendor/bookings/:id/accept` sets `status: "upcoming"`, assigns `vendorId` |
| RAP-03 | Customer sees booking confirmation with no vendor contact info | Booking confirmation in `BookingFlow.jsx` shows service/date/time only; vendor phone never included in booking response |
| RAP-04 | Vendor sees customer name only (no phone number) | `GET /api/vendor/bookings` returns `customerName` but omits `customerPhone`; `customerEmail` nulled until accepted (`server/index.js:1122`) |

### 3c — Multi-Vendor Model

| ID | Story | Evidence |
|----|-------|----------|
| MUL-02 | Customer clicks photo → sees service details & pricing | `src/pages/customer/ServiceDetail.jsx`, `GET /api/services/:id` returns price/description/mode |
| MUL-04 | Cancellation locked 2 hours before appointment | `PUT /api/bookings/:id/cancel`: `if (hoursUntil < 2)` check at `server/index.js:804` |
| MUL-06 | Different pricing for home delivery vs. in-store visit | `homePrice` field on services; booking selects price based on `mode` (`server/index.js:782`) |

---

## EPIC 4: Video Consultation

| ID | Story | Evidence |
|----|-------|----------|
| VID-01 | Customer books video vet consultation (Rapido model) | "Video Vet Consultation" service seeded (`svc_9`, `serviceMode: "home_delivery"`), bookable via `BookingFlow.jsx` |
| VID-02 | Vet/consultant accepts request at scheduled time | `VendorBookings.jsx` accept flow; `PUT /api/vendor/bookings/:id/accept` |
| VID-05 | No customer contact info shared with consultant | Vendor booking response includes `customerName` only; email/phone omitted (`server/index.js:1122`) |

---

## EPIC 5: Payments & Settlements

| ID | Story | Evidence |
|----|-------|----------|
| PAY-05 | Charity micro-donation toggle at checkout | `src/pages/customer/Checkout.jsx` charity section with ₹0/₹2/₹5/₹10 options; donation recorded in `donations` table via `POST /api/orders` |

---

## EPIC 6: Dynamic QR Code & Pet ID

| ID | Story | Evidence |
|----|-------|----------|
| QR-04 | Owner configures visibility toggles per field | `src/pages/customer/PetQR.jsx` toggle UI; `qrToggles` field stored on `user_pets`; `GET /api/pet-qr/:id` respects each toggle (`server/index.js:737–749`) |
| QR-05 | "Lost Mode" toggle — shows finder contact info | `PetQR.jsx` lostMode toggle; server returns `ownerName`, `ownerPhone`, `emergencyMessage` when `lostMode: true` |
| QR-08 | Medical record visibility toggle | `medicalRecords` key in `qrToggles`; server conditionally includes `documents` in public profile (`server/index.js:742`) |

---

## EPIC 7: Petrogram (Social Module)

| ID | Story | Evidence |
|----|-------|----------|
| SOC-01 | Upload 1 photo or 1 video per day (24-hour story format) | `src/pages/customer/PetOGram.jsx`, `POST /api/posts` (multer upload); `cleanExpiredPosts()` deletes posts older than 24 hrs (`server/index.js:1303`) |
| SOC-02 | Story feed — all active stories visible to all users | `GET /api/posts` (authenticated), feed rendered in `PetOGram.jsx` |
| SOC-03 | Follow system | `POST /api/follow/:userId` (toggle follow/unfollow), `follows` table; `api.followUser()` in `src/lib/api.js:104` |
| SOC-04 | Like on stories | `POST /api/posts/:id/like` (toggle), `likes` table; `api.likePost()` |
| SOC-06 | No share/forward feature | Intentionally absent throughout the social module — no share endpoint or UI component exists |

---

## EPIC 8: Emergency Features

| ID | Story | Evidence |
|----|-------|----------|
| EMG-01 | State-based emergency vet/clinic directory | `src/pages/customer/EmergencyVet.jsx`, `GET /api/emergency-vets?state=`, `GET /api/emergency-vets/states`; `emergency_vets` table with state filter |
| EMG-02 | One-tap call button to nearest emergency vet | `emergency_vets` records include `phone` field; `EmergencyVet.jsx` renders phone numbers |
| EMG-03 | Pet ambulance directory per state | `type: "ambulance"` entries in `DEFAULT_EMERGENCY_VETS` (e.g. `ev_3`); filterable via same API |
| LST-01 | Owner reports pet as lost (with photos, description) | `src/pages/customer/LostPetRecovery.jsx`, `POST /api/recovery` with petName, species, description, image, lastSeenLocation |
| LST-02 | Lost pets gallery visible to all app users | `GET /api/recovery` has no `authenticate` middleware; `LostPetRecovery.jsx` renders the feed |
| LST-03 | "I Found This Pet" flow | `/api/recovery` accepts `type: "found"` for finder submissions |
| LST-04 | Admin reviews claims; contacts owner with verified finder info | `src/pages/admin/AdminRecovery.jsx`; `GET /api/admin/recovery`, `PUT /api/admin/recovery/:id` (approve/reject) |

---

## EPIC 9: E-Commerce Store

| ID | Story | Evidence |
|----|-------|----------|
| ECO-01 | Product catalogue: pet clothing, gifts, accessories | `src/pages/customer/CustomerShop.jsx`, `GET /api/products`, `products` table with categories (Accessories, Toys, Treats, Hygiene, Food) |
| ECO-02 | Cart, checkout, order tracking | `src/pages/customer/Cart.jsx`, `Checkout.jsx`, `Orders.jsx`; full `/api/cart` and `/api/orders` CRUD |
| ECO-03 | Coin redemption at checkout (max 100 coins per purchase) | `Checkout.jsx` toggle; backend: `Math.min(coinsUsed, 100, wallet.balance)` at `server/index.js:1215` |
| ECO-04 | Admin product management | `src/pages/admin/AdminProducts.jsx`, `POST/PUT/DELETE /api/admin/products` |

---

## EPIC 11: Pet Breeder Module

| ID | Story | Evidence |
|----|-------|----------|
| BRD-01 | Breeder listings — photo grid per breed | `src/pages/customer/Breeders.jsx`, `GET /api/pets` (breeders table), `DEFAULT_BREEDERS` seeded with breed/species/price |

---

## EPIC 12: Pet Celebration & Lifestyle Experiences

| ID | Story | Evidence |
|----|-------|----------|
| CEL-01 | Birthday party / event booking | `src/pages/customer/Celebrations.jsx`, `POST /api/celebrations/book`, `celebrations` table |
| CEL-02 | Pre-set party packages + custom DIY option | `DEFAULT_CELEBRATIONS` includes "Custom DIY Party" entry; `bookCelebration` accepts `customDiy` free-text field |

---

## EPIC 13: AI Chatbot

| ID | Story | Evidence |
|----|-------|----------|
| AI-01 | Pet-aware chatbot (basic implementation) | `src/pages/customer/AIChat.jsx`, `/api/chatbot/message` with keyword-based responses |
| AI-02 | Preset quick-reply options | `CHATBOT_PRESETS` array in `server/index.js:1514`; `GET /api/chatbot/presets`; preset buttons rendered in `AIChat.jsx` |

---

## EPIC 14: Gamification & Loyalty

| ID | Story | Evidence |
|----|-------|----------|
| GAM-01 | Daily login coin reward (every 24 hrs) | `src/pages/customer/CoinsPage.jsx` claim button; `POST /api/coins/daily` enforces once-per-day via `lastLogin` date check |
| GAM-02 | Coin balance & transaction history | `CoinsPage.jsx` balance card + history list; `GET /api/coins` returns `balance` and `transactions` array |
| GAM-03 | Referral code generation per user | `GET /api/referral-code` auto-generates and stores `referralCode` on user record; displayed in `CoinsPage.jsx` |
| GAM-04 | Referral sign-up credits 50 coins to referrer | `POST /api/coins/referral` credits 50 coins to both referrer and new user (`server/index.js:1275–1283`) |
| GAM-05 | Coin redemption in e-commerce (max 100/purchase) | Same as ECO-03 — `Checkout.jsx` + backend `Math.min` cap |

---

## EPIC 15: Charity Fund Module

| ID | Story | Evidence |
|----|-------|----------|
| CHR-01 | Micro-donation toggle at every checkout | `Checkout.jsx` charity section (₹0/₹2/₹5/₹10); `charityAmount` passed to `POST /api/orders` |
| CHR-02 | Admin uploads charity gallery | `src/pages/admin/AdminCharity.jsx`; `POST /api/admin/charity` (multer upload), `DELETE /api/admin/charity/:id` |
| CHR-03 | Charity fund total displayed in app | `src/pages/customer/Charity.jsx`; `GET /api/charity` returns `totalDonations`, `donorCount`, and media gallery |

---

## EPIC 16: Vendor Panel

| ID | Story | Evidence |
|----|-------|----------|
| VND-03 | Incoming booking request feed | `src/pages/vendor/VendorBookings.jsx`; `GET /api/vendor/bookings` returns pending/upcoming/completed/cancelled |
| VND-04 | Accept / reject booking request | `VendorBookings.jsx` Accept/Decline buttons; `PUT /api/vendor/bookings/:id/accept|decline` |
| VND-07 | Earnings dashboard (pending settlement) | `src/pages/vendor/VendorEarnings.jsx`; `GET /api/vendor/earnings` returns total, week earnings, completed bookings, history |
| VND-08 | Customer name visible; phone number hidden | `GET /api/vendor/bookings` returns `customerName` only; `customerEmail` null until accepted, `customerPhone` never exposed |

---

## EPIC 17: Admin Panel

| ID | Story | Evidence |
|----|-------|----------|
| ADM-03 | Platform-wide booking management | `src/pages/admin/AdminBookings.jsx`; `GET /api/admin/bookings`, `PUT /api/admin/bookings/:id/status` |
| ADM-07 | Service catalogue management | `src/pages/admin/AdminServices.jsx`; `POST/PUT/DELETE /api/admin/services` |
| ADM-10 | Lost & found claim review queue | `src/pages/admin/AdminRecovery.jsx`; `GET /api/admin/recovery`, `PUT /api/admin/recovery/:id` |
| ADM-11 | Charity fund gallery management | `src/pages/admin/AdminCharity.jsx`; `POST/DELETE /api/admin/charity` |
| ADM-12 | Emergency vet / ambulance directory management | `src/pages/admin/AdminEmergencyVets.jsx`; `POST/PUT/DELETE /api/admin/emergency-vets` |

---

## Non-Functional Requirements

| ID | Requirement | Evidence |
|----|-------------|----------|
| NFR-01 | Phone number never exposed between customer ↔ vendor | Vendor booking response never includes customer phone; customer booking never exposes vendor phone (`server/index.js:1117–1124`) |
| NFR-04 | All Petrogram media auto-deleted after 24 hours | `cleanExpiredPosts()` deletes posts where `created_at < now - 24h`; called on every `GET /api/posts` (`server/index.js:1302–1305`) |
| NFR-06 | Platform supports all animals (not pets only) | `species` field on `user_pets`, `breeders`, `recovery` tables — no hard-coded species constraint |
