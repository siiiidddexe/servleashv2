# Servleash v2 — Unimplemented Backlog Items

> Items are sorted P0 → P1 → P2 within each Epic. No code was found implementing these features.

---

## EPIC 1: Authentication & Onboarding

| ID | Story | Priority | Implementation Note |
|----|-------|----------|---------------------|
| AUTH-03 | Vendor sign-up & onboarding (via Admin approval) | P0 | No approval queue exists. Need: pending vendor accounts, admin approval screen (AdminVendors), email notification to admin on new vendor sign-up, vendor blocked until approved. |
| AUTH-06 | Referral code entry at sign-up (grants 50 coins) | P1 | Referral redemption is in CoinsPage (post-sign-up). Add referral code field to `Signup.jsx` and call `/api/coins/referral` as part of the OTP verification flow. |

---

## EPIC 2: Pet Profile Management

| ID | Story | Priority | Implementation Note |
|----|-------|----------|---------------------|
| PET-03 | Documents visible to admin (not downloadable by default) | P0 | Admin panel has no pet document viewer. Add per-user pet/document drill-down in `AdminUsers.jsx`; restrict document URLs to admin-only download links. |

---

## EPIC 3: Service Booking (Core)

### 3c — Multi-Vendor Model

| ID | Story | Priority | Implementation Note |
|----|-------|----------|---------------------|
| MUL-01 | Customer browses vendor gallery (vendor identity hidden) | P0 | Vendor name, phone and address are currently returned in all API responses. Add a `locked` flag: hide identity fields until booking fee is paid; expose them only after `POST /api/bookings` succeeds. |
| MUL-03 | Customer pays booking fee → vendor name + location unlocked | P0 | Depends on MUL-01. After successful payment, a booking record should unlock the vendor object (name + address) returned to the customer. |
| MUL-05 | Commission split per service type (configurable by admin) | P0 | Currently hardcoded at 80/20 in `GET /api/vendor/earnings`. Add `commissionRate` field to services table; let admin set it in `AdminServices.jsx`; use it in booking creation and earnings calculation. |

---

## EPIC 4: Video Consultation

| ID | Story | Priority | Implementation Note |
|----|-------|----------|---------------------|
| VID-03 | Consultant pastes Google Meet link into app upon acceptance | P0 | `PUT /api/vendor/bookings/:id/accept` has no `meetLink` field. Add a `meetLink` field to the accept payload and store it on the booking record. |
| VID-04 | Customer receives clickable Meet link in-app | P0 | Booking detail in `CustomerAppointments.jsx` does not show a Meet link. Render `meetLink` as a clickable button when booking `serviceCategory === "Video Consult"`. |

---

## EPIC 5: Payments & Settlements

| ID | Story | Priority | Implementation Note |
|----|-------|----------|---------------------|
| PAY-01 | Razorpay integration for customer payments | P0 | `Checkout.jsx` simulates Razorpay with a mock modal. Integrate the real Razorpay JS SDK: create order server-side via Razorpay API, open Razorpay checkout, verify payment signature on the backend. |
| PAY-02 | Platform records all transactions with commission split | P0 | No `transactions` table. Create one to record each booking payment with `amount`, `vendorShare`, `platformShare`, `orderId`, `userId`, and `vendorId`. |
| PAY-03 | Weekly settlement report generated for admin | P0 | No settlement report in admin panel. Add `GET /api/admin/settlements` endpoint aggregating completed bookings by week; display in admin UI with CSV export. |
| PAY-04 | Refund processing via Razorpay (admin-initiated) | P0 | No refund route or UI. Add `POST /api/admin/refunds` calling Razorpay Refund API; add refund button in `AdminBookings.jsx`. |
| PAY-06 | Automated payout API integration | P2 | Out of scope for this phase. When scale justifies, integrate Razorpay X or RazorpayX Payouts for automated vendor disbursement. |

---

## EPIC 6: Dynamic QR Code & Pet ID

| ID | Story | Priority | Implementation Note |
|----|-------|----------|---------------------|
| QR-01 | Auto-generate unique QR code per pet | P0 | `PetQR.jsx` shows a Lucide icon placeholder. Add `qrcode` or `react-qr-code` library; generate a scannable QR image from the URL `/pet-qr/:petId`. |
| QR-02 | Pet profile page with "QR" tab showing downloadable QR file | P0 | Depends on QR-01. After generating the QR image, provide a download/save button (canvas `toDataURL()` → PNG download). |
| QR-03 | Public web page rendered when QR is scanned (no app required) | P0 | The React route `/pet-qr/:petId` uses `api.getMyPets()` (auth-required). Create a separate unauthenticated component that calls the public `GET /api/pet-qr/:id` endpoint instead. |
| QR-06 | Capture scanner's phone number + GPS location when QR scanned | P1 | No scanner capture flow. Build an OTP-verified phone capture form shown before the public QR profile page; save scanner record to a new `qr_scans` table with phone + GPS. |
| QR-07 | Owner notified (push/SMS) each time QR is scanned | P1 | Depends on QR-06 + NTF items. Trigger an SMS or push notification to pet owner on each scan event. |

---

## EPIC 7: Petrogram (Social Module)

| ID | Story | Priority | Implementation Note |
|----|-------|----------|---------------------|
| SOC-05 | Comments — off by default, owner can enable | P1 | Comments are always enabled. Add `commentsEnabled` boolean to post records (default `false`); add toggle UI in `PetOGram.jsx`; guard `POST /api/posts/:id/comments` against disabled posts. |
| SOC-07 | Content moderation queue in admin panel | P1 | No Petrogram moderation admin page. Create `AdminPetrogram.jsx` listing all active posts with flag/delete actions; add `POST /api/admin/posts/:id/remove` route. |

---

## EPIC 8: Emergency Features

### 8b — Lost Pet Recovery Network

| ID | Story | Priority | Implementation Note |
|----|-------|----------|---------------------|
| LST-05 | Owner must submit proof of ownership to admin to claim | P0 | No proof-of-ownership submission flow. Add a file upload field on the recovery claim resolution screen; store submitted proof URLs on the recovery record for admin review. |

---

## EPIC 9: E-Commerce Store

| ID | Story | Priority | Implementation Note |
|----|-------|----------|---------------------|
| ECO-05 | Medicine sales | P2 | Out of scope — requires separate regulatory license. Implement as a separate catalogue category in a future phase. |

---

## EPIC 10: Pet Meal Planner (Subscription)

| ID | Story | Priority | Implementation Note |
|----|-------|----------|---------------------|
| MEAL-01 | Customer sets up meal schedule (name, time, frequency) | P1 | No meal planner exists. Create `meal_schedules` table, `MealPlanner.jsx` page with add/edit/delete schedule UI, and CRUD routes `/api/meals`. |
| MEAL-02 | Weekly subscription purchase for meal delivery service | P1 | Depends on MEAL-01. Add subscription product to products table; integrate payment flow; track subscription status on user record. |
| MEAL-03 | Push notification reminders per meal time | P1 | Depends on MEAL-01 + NTF system. Schedule cron or use a worker to fire push/SMS at each meal time. |
| MEAL-04 | Admin manages delivery backend | P1 | Add an admin meal subscriptions view showing active subscribers and delivery schedules. |

---

## EPIC 11: Pet Breeder Module

| ID | Story | Priority | Implementation Note |
|----|-------|----------|---------------------|
| BRD-02 | Vendor uploads listing; admin approves/rejects | P1 | Vendor has no breeder listing upload flow. Add vendor-side listing form; store listings with `status: "pending"`; add approval queue in admin panel. |
| BRD-03 | Customer pays booking fee → receives breeder location | P1 | Breeder location is currently visible freely. Apply the same vendor-identity-lock pattern as MUL-01/MUL-03 to breeder listings. |

---

## EPIC 12: Pet Celebration & Lifestyle Experiences

| ID | Story | Priority | Implementation Note |
|----|-------|----------|---------------------|
| CEL-03 | Admin manages event calendar and capacity | P1 | `AdminCelebrations.jsx` manages packages (name/price/description) only. Add `date`, `maxCapacity`, `bookedCount` fields; render a calendar or date-blocked list; enforce capacity in `POST /api/celebrations/book`. |

---

## EPIC 13: AI Chatbot

| ID | Story | Priority | Implementation Note |
|----|-------|----------|---------------------|
| AI-03 | Initial implementation via OpenAI API (with rate limiting) | P1 | `POST /api/chatbot/message` uses hardcoded keyword matching. Integrate OpenAI Chat API: fetch user's pet profiles as context, pass to `gpt-4o-mini`, add a simple per-user rate limiter (e.g. 10 req/hr). |
| AI-04 | Self-hosted Ollama on GPU cloud | P2 | Future migration path once OpenAI volume justifies cost. No action needed now. |

---

## EPIC 14: Gamification & Loyalty

*(All items completed — no P0/P1/P2 TODO items)*

---

## EPIC 15: Charity Fund Module

| ID | Story | Priority | Implementation Note |
|----|-------|----------|---------------------|
| CHR-04 | All platform revenue streams contribute to charity fund | P1 | Only e-commerce checkout currently donates. Add optional charity micro-donation to the booking flow (`BookingFlow.jsx` + `POST /api/bookings`) and to the celebrations booking flow. |

---

## EPIC 16: Vendor Panel

| ID | Story | Priority | Implementation Note |
|----|-------|----------|---------------------|
| VND-01 | Vendor onboarding form (submitted to admin for approval) | P0 | No vendor-side onboarding form. Create `VendorOnboarding.jsx` that submits business details; store with `approved: false`; add approval action in `AdminVendors.jsx`. |
| VND-02 | Service listing management (vendor adds services, sets prices, uploads photos/videos) | P0 | Vendors cannot manage their own listings. Add service management routes under `/api/vendor/services` and a management UI in the vendor panel. |
| VND-05 | Booking calendar / schedule view | P1 | `VendorBookings.jsx` shows a status-filtered list only. Add a weekly calendar view grouping bookings by date and time slot. |
| VND-06 | For video consultations: paste Google Meet link on acceptance | P0 | Accept endpoint (`PUT /api/vendor/bookings/:id/accept`) has no Meet link field. See VID-03. |

---

## EPIC 17: Admin Panel

| ID | Story | Priority | Implementation Note |
|----|-------|----------|---------------------|
| ADM-01 | Vendor onboarding approval / rejection workflow | P0 | `AdminVendors.jsx` provides only create/edit/delete. Need a pending-vendor queue with Approve/Reject actions that flip `approved` flag and notify the vendor. |
| ADM-02 | Customer profile viewer (orders, bookings, pet records) | P0 | `AdminUsers.jsx` shows user list only. Add a drill-down page per user showing their bookings, orders, pets, and documents. |
| ADM-04 | Financial dashboard — all transactions, commission splits | P0 | `AdminHome.jsx` shows only a total revenue counter. Build a proper transaction ledger UI with per-booking breakdown of vendor share vs. platform share. |
| ADM-05 | Weekly settlement report generation | P0 | No settlement report feature. See PAY-03. |
| ADM-06 | Refund processing | P0 | No refund action in admin bookings. See PAY-04. |
| ADM-08 | Content moderation queue (Petrogram, breeder listings) | P1 | No moderation queue. See SOC-07 + BRD-02. |
| ADM-09 | Ban / suspend user or vendor | P0 | No ban/suspend endpoint or UI. Add `status` field to users (`active`/`suspended`); add ban button in `AdminUsers.jsx`; enforce status check in `authenticate` middleware. |
| ADM-13 | Commission split configuration per service | P0 | Commission is hardcoded at 80/20. See MUL-05. |
| ADM-14 | QR code tag order fulfilment (download QR file per pet) | P1 | Admin has no per-pet QR download. Add a user→pet drill-down in AdminUsers with a "Download QR" button that generates the QR PNG server-side (e.g. `qrcode` npm package). |
| ADM-15 | Vendor photo/media approval for multi-vendor listings | P0 | No vendor media approval queue. When vendors upload gallery items (VND-02), store with `approved: false`; admin reviews in a new media approval tab. |

---

## EPIC 18: Notifications

| ID | Story | Priority | Implementation Note |
|----|-------|----------|---------------------|
| NTF-01 | Push notification: booking confirmed | P0 | No push notification system. Integrate FCM (Firebase Cloud Messaging) or OneSignal; store device tokens on users; trigger on `POST /api/bookings`. |
| NTF-02 | Push notification: booking accepted by vendor | P0 | SSE `notifyCustomer()` exists for in-app only. Wire the same event to FCM for real push delivery. |
| NTF-03 | Push notification: cancellation window closing soon | P0 | No scheduled notification. Add a cron job 2.5 hours before each upcoming booking to send push alert. |
| NTF-04 | Push notification: video consultation link ready | P0 | Triggered when vendor pastes Meet link (VID-03). Add FCM push on booking accept for `Video Consult` category. |
| NTF-05 | Push notification: QR code scanned (with location) | P1 | Depends on QR-06. Trigger push to pet owner whenever a QR scan is logged. |
| NTF-06 | Push notification: daily login coin reminder | P1 | No reminder. Send a daily push at a configured time to users who haven't claimed their daily coins. |
| NTF-07 | Push notification: meal reminder | P1 | Depends on MEAL-01. Fire push at each meal schedule time. |
| NTF-08 | SMS fallback for critical notifications | P1 | No SMS integration. Add Twilio/MSG91 fallback for P0 notifications (booking confirmed, video link ready) when push is unavailable or undelivered. |

---

## Non-Functional Requirements

| ID | Requirement | Priority | Implementation Note |
|----|-------------|----------|---------------------|
| NFR-02 | Vendor location / name hidden until booking fee paid | P0 | Vendor name, address, and phone are currently returned freely by `GET /api/vendors` and `GET /api/vendors/:id`. Apply identity-lock pattern (see MUL-01/MUL-03). |
| NFR-03 | Pet documents accessible by admin; not downloadable externally by default | P0 | Documents are served from `/uploads/` as public static files — anyone with the URL can download. Move to authenticated download (`GET /api/admin/documents/:file` behind `authenticate` + admin role check). |
| NFR-05 | Vendor-uploaded media compressed before storage | P1 | Multer stores raw files with no compression. Add `sharp` (images) and `fluent-ffmpeg` (video) processing before saving to disk; or delegate to Cloudinary/S3 with compression transforms. |
| NFR-07 | All features configurable/scalable for future business model changes | P0 | Commission rates, cancellation windows (2h/5h), and coin amounts are hardcoded in `server/index.js`. Extract these to a `config` table managed via admin panel. |
| NFR-08 | App must gracefully handle up to 10,000 concurrent users | P1 | No connection pooling, caching, or load-balancing configuration. Add Redis caching for hot reads (services, vendors), horizontal scaling with PM2/Docker, and SurrealDB connection pool tuning. |
