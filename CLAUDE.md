# Servleash v2

Multi-role pet services platform (React + Express + SurrealDB).

## Tech Stack

- **Frontend:** React 19 + Vite + Tailwind CSS 3 + Framer Motion + Lucide icons
- **Backend:** Node.js + Express (single file: `server/index.js`)
- **Database:** SurrealDB (all data stored exclusively in SurrealDB — no JSON file fallback)
- **Uploads:** Multer (disk storage in `server/uploads/`)

## Architecture

Three user roles: **Customer**, **Vendor**, **Admin** — all served from a single React app with role-based routing.

### Key Files

- `src/App.jsx` — All routes (role-based)
- `src/lib/api.js` — Centralized API client (~80 endpoints)
- `src/context/AuthContext.jsx` — Global auth state (token in localStorage)
- `server/index.js` — Entire backend: DB helpers, auth, 50+ REST routes

### Frontend Structure

```
src/
  components/   — Shared UI (AdminNav, BottomNav, BackBtn, PageWrap, etc.)
  pages/
    shared/     — Login, Signup, OtpVerify, ForgotPassword, ResetPassword
    customer/   — 26 pages (home, services, bookings, pets, shop, social feed, etc.)
    vendor/     — 5 pages (home, bookings, earnings, profile)
    admin/      — 13 pages (dashboard, users, services, vendors, products, etc.)
```

## Dev Commands

```bash
# Frontend (port 5173)
npm run dev

# Backend (port 3001)
cd server && node index.js
# or with auto-reload:
cd server && node --watch index.js

# SurrealDB (persistent storage — run from server/ directory):
cd server && surreal start --bind 0.0.0.0:8000 --user root --pass root surrealkv://data/db
# For in-memory (data lost on restart):
# surreal start --bind 0.0.0.0:8000 --user root --pass root memory
```

## SurrealDB Connection

- Endpoint: `http://127.0.0.1:8000/rpc`
- Namespace: `servleash`
- Database: `servleash`
- Credentials: `root` / `root`

### Tables

| Table | Description |
|---|---|
| `users` | User accounts (all roles) |
| `sessions` | Auth sessions (token as record ID) |
| `services` | Pet service catalog (seeded on first run) |
| `vendors` | Vendor profiles (seeded) |
| `products` | Shop products (seeded) |
| `breeders` | Breeder pet gallery (seeded) |
| `emergency_vets` | Emergency vet directory (seeded) |
| `celebrations` | Celebration packages (seeded) |
| `user_pets` | User's personal pet profiles |
| `bookings` | Service bookings |
| `saved_items` | User favorites |
| `posts` | Pet-O-Gram social feed (24h expiry) |
| `likes` | Post likes |
| `comments` | Post comments |
| `follows` | User follow relationships |
| `recovery` | Lost pet recovery alerts |
| `carts` | Shopping carts (userId as record ID) |
| `orders` | Product orders |
| `coins` | Loyalty coin wallets (userId as record ID) |
| `donations` | Charity donations |
| `promo` | Promo media items |
| `charity` | Charity content |

Default data (services, vendors, products, breeders, emergency vets, celebrations) is seeded automatically on first startup if tables are empty.

## Environment Variables

Optional `.env` in `server/`:
```
MAIL_API_URL=http://localhost:5050
MAIL_API_KEY=your-key
```

## Conventions

- IDs are generated with `genId(prefix)` → e.g. `user_1710000000000_ab3f`
- Auth uses Bearer tokens stored in `sessions` table
- OTPs and reset tokens are transient (in-memory only, not persisted)
- Frontend proxies `/api` requests to backend via Vite config
- All SurrealDB queries use `type::record($tb, $id)` for record ID lookups
