import express from "express";
import cors from "cors";
import crypto from "crypto";
import Surreal from "surrealdb";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import multer from "multer";
import { resolve, dirname, extname } from "path";
import { fileURLToPath } from "url";

// ── Load .env manually (no dotenv dependency) ─────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, ".env");
if (existsSync(envPath)) {
  readFileSync(envPath, "utf8").split("\n").forEach(line => {
    const [key, ...rest] = line.split("=");
    if (key && key.trim() && !key.trim().startsWith("#")) {
      process.env[key.trim()] = rest.join("=").trim();
    }
  });
}

// ── File-based session/user persistence ───────────────
const DATA_DIR = resolve(__dirname, "data");
mkdirSync(DATA_DIR, { recursive: true });
const USERS_FILE    = resolve(DATA_DIR, "users.json");
const SESSIONS_FILE = resolve(DATA_DIR, "sessions.json");
const SERVICES_FILE = resolve(DATA_DIR, "services.json");
const VENDORS_FILE  = resolve(DATA_DIR, "vendors.json");
const PROMO_FILE    = resolve(DATA_DIR, "promo.json");

function loadJSON(file, def) {
  try { return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : def; }
  catch { return def; }
}
function saveJSON(file, data) {
  try { writeFileSync(file, JSON.stringify(data, null, 2)); } catch {}
}

function persistUsers()    { saveJSON(USERS_FILE,    mem.users); }
function persistSessions() {
  // sessions Map → plain object for JSON
  const obj = {};
  for (const [k, v] of mem.sessions) obj[k] = v;
  saveJSON(SESSIONS_FILE, obj);
}

const app = express();
const PORT = 3001;

const MAIL_API_URL = process.env.MAIL_API_URL || "http://localhost:5050";
const MAIL_API_KEY = process.env.MAIL_API_KEY || "";

app.use(cors({ origin: "*" }));
app.use(express.json());
// Serve uploaded files
const UPLOAD_DIR = resolve(__dirname, "uploads");
mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

// Multer for uploads (simple disk storage)
const upload = multer({ dest: UPLOAD_DIR });

// ── SurrealDB ─────────────────────────────────────────
let db;
async function initDB() {
  try {
    db = new Surreal();
    await db.connect("http://127.0.0.1:8000/rpc");
    await db.signin({ username: "root", password: "root" });
    await db.use({ namespace: "servleash", database: "servleash" });
    console.log("✅ Connected to SurrealDB");
  } catch (err) {
    console.warn("⚠️  SurrealDB unavailable — in-memory mode");
    db = null;
  }
}

// ── Extra persistence files ────────────────────────────
const PETS_FILE       = resolve(DATA_DIR, "pets.json");
const PRODUCTS_FILE   = resolve(DATA_DIR, "products.json");
const BOOKINGS_FILE   = resolve(DATA_DIR, "bookings.json");
const SAVED_FILE      = resolve(DATA_DIR, "saved.json");
const POSTS_FILE      = resolve(DATA_DIR, "posts.json");
const RECOVERY_FILE   = resolve(DATA_DIR, "recovery.json");
const CART_FILE       = resolve(DATA_DIR, "cart.json");
const ORDERS_FILE     = resolve(DATA_DIR, "orders.json");
const COINS_FILE      = resolve(DATA_DIR, "coins.json");
const CHARITY_FILE    = resolve(DATA_DIR, "charity.json");
const BREEDERS_FILE   = resolve(DATA_DIR, "breeders.json");
const CELEBRATIONS_FILE = resolve(DATA_DIR, "celebrations.json");
const EMERGVETS_FILE  = resolve(DATA_DIR, "emergvets.json");

// ── In-memory store ───────────────────────────────────
const mem = {
  users: loadJSON(USERS_FILE, []),
  otps: new Map(),
  sessions: new Map(Object.entries(loadJSON(SESSIONS_FILE, {}))),
  resetTokens: new Map(),
  services: [
    { id: "svc_1", name: "Full Grooming", category: "Grooming", price: 799, homePrice: 999, duration: "60 min", rating: 4.8, reviews: 342, description: "Complete bath, haircut, nail trim, ear cleaning and blow dry for your pet.", image: null, serviceMode: "both" },
    { id: "svc_2", name: "Basic Bath & Dry", category: "Grooming", price: 449, homePrice: 599, duration: "30 min", rating: 4.6, reviews: 218, description: "Quick bath with premium shampoo and thorough blow dry.", image: null, serviceMode: "both" },
    { id: "svc_3", name: "Vet Consultation", category: "Vet Visit", price: 599, homePrice: 799, duration: "30 min", rating: 4.9, reviews: 567, description: "General health check-up with an experienced veterinarian.", image: null, serviceMode: "both" },
    { id: "svc_4", name: "Vaccination", category: "Vet Visit", price: 999, homePrice: 1199, duration: "20 min", rating: 4.7, reviews: 189, description: "Core vaccinations for dogs and cats as per schedule.", image: null, serviceMode: "both" },
    { id: "svc_5", name: "Overnight Boarding", category: "Boarding", price: 1299, homePrice: null, duration: "24 hrs", rating: 4.5, reviews: 156, description: "Safe overnight stay with meals, play time and webcam access.", image: null, serviceMode: "in_store" },
    { id: "svc_6", name: "Dog Walking", category: "Training", price: 299, homePrice: 299, duration: "45 min", rating: 4.4, reviews: 98, description: "Professional dog walking session in your neighbourhood.", image: null, serviceMode: "home_delivery" },
    { id: "svc_7", name: "Premium Meal Plan", category: "Meals", price: 1499, homePrice: 1499, duration: "Monthly", rating: 4.7, reviews: 75, description: "Customised fresh meal plan delivered daily for your pet.", image: null, serviceMode: "home_delivery" },
    { id: "svc_8", name: "Obedience Training", category: "Training", price: 1999, homePrice: 2499, duration: "5 sessions", rating: 4.8, reviews: 134, description: "Basic obedience commands, leash manners, and socialisation.", image: null, serviceMode: "both" },
    { id: "svc_9", name: "Video Vet Consultation", category: "Video Consult", price: 399, homePrice: null, duration: "20 min", rating: 4.8, reviews: 89, description: "Online vet consultation via Google Meet link.", image: null, serviceMode: "home_delivery" },
  ],
  vendors: [
    { id: "ven_1", name: "Happy Paws Salon", category: "Grooming", rating: 4.8, reviews: 420, distance: "1.2 km", address: "123 Park Street, Koramangala", city: "Bangalore", phone: "+91 98765 43210", image: null, services: ["svc_1", "svc_2"], gallery: [], approved: true },
    { id: "ven_2", name: "PetCare Vet Clinic", category: "Vet Visit", rating: 4.9, reviews: 680, distance: "2.5 km", address: "45 MG Road", city: "Bangalore", phone: "+91 98765 43211", image: null, services: ["svc_3", "svc_4", "svc_9"], gallery: [], approved: true },
    { id: "ven_3", name: "Pawsome Stays", category: "Boarding", rating: 4.6, reviews: 210, distance: "3.8 km", address: "78 Indiranagar", city: "Bangalore", phone: "+91 98765 43212", image: null, services: ["svc_5"], gallery: [], approved: true },
    { id: "ven_4", name: "WoofWalkers", category: "Training", rating: 4.5, reviews: 145, distance: "0.8 km", address: "12 HSR Layout", city: "Bangalore", phone: "+91 98765 43213", image: null, services: ["svc_6", "svc_8"], gallery: [], approved: true },
    { id: "ven_5", name: "FreshBowl Pets", category: "Meals", rating: 4.7, reviews: 95, distance: "4.1 km", address: "56 Whitefield", city: "Bangalore", phone: "+91 98765 43214", image: null, services: ["svc_7"], gallery: [], approved: true },
  ],
  products: [
    { id: "prod_1", name: "Royal Canin Adult", category: "Food", price: 1299, mrp: 1499, rating: 4.7, reviews: 234, description: "Premium dry food for adult dogs, 3kg pack.", image: null, stock: 50 },
    { id: "prod_2", name: "Squeaky Bone Toy", category: "Toys", price: 349, mrp: 499, rating: 4.5, reviews: 178, description: "Durable rubber squeaky bone toy for dogs.", image: null, stock: 30 },
    { id: "prod_3", name: "Chicken Jerky Treats", category: "Treats", price: 249, mrp: 299, rating: 4.8, reviews: 312, description: "Real chicken jerky strips, 200g pack.", image: null, stock: 100 },
    { id: "prod_4", name: "Anti-Tick Shampoo", category: "Hygiene", price: 399, mrp: 499, rating: 4.6, reviews: 145, description: "Medicated anti-tick and flea shampoo, 500ml.", image: null, stock: 45 },
    { id: "prod_5", name: "Leather Collar", category: "Accessories", price: 599, mrp: 799, rating: 4.4, reviews: 89, description: "Premium genuine leather collar with brass buckle.", image: null, stock: 20 },
    { id: "prod_6", name: "Pedigree Puppy", category: "Food", price: 899, mrp: 999, rating: 4.6, reviews: 198, description: "Complete nutrition for puppies, 1.5kg pack.", image: null, stock: 60 },
    { id: "prod_7", name: "Rope Tug Toy", category: "Toys", price: 199, mrp: 299, rating: 4.3, reviews: 156, description: "Cotton rope tug toy for interactive play.", image: null, stock: 80 },
    { id: "prod_8", name: "Dental Chew Sticks", category: "Treats", price: 329, mrp: 399, rating: 4.7, reviews: 267, description: "Cleans teeth and freshens breath, 10 sticks.", image: null, stock: 75 },
  ],
  // User-owned pets (per-user)
  userPets: loadJSON(PETS_FILE, []),
  // Breeder pets (gallery style, public)
  pets: [
    { id: "pet_1", name: "Kaiman Redfox", breed: "Welsh Corgi", species: "Dog", gender: "Male", weight: "16.2 kg", age: "4 years", color: "Tri-color", description: "Friendly and playful! Loves belly rubs and chasing squirrels in the park.", location: "Koramangala, Bangalore", owner: { name: "Rahul Sharma" }, available: true, breederPrice: 35000, image: null },
    { id: "pet_2", name: "Luna", breed: "Persian Cat", species: "Cat", gender: "Female", weight: "4.5 kg", age: "2 years", color: "White", description: "Calm and elegant. Loves napping in sunbeams.", location: "Indiranagar, Bangalore", owner: { name: "Priya Patel" }, available: true, breederPrice: 25000, image: null },
    { id: "pet_3", name: "Buddy", breed: "Golden Retriever", species: "Dog", gender: "Male", weight: "30 kg", age: "5 years", color: "Golden", description: "The ultimate good boy. Loves swimming and fetch.", location: "HSR Layout, Bangalore", owner: { name: "Arjun Reddy" }, available: true, breederPrice: 45000, image: null },
    { id: "pet_4", name: "Cleo", breed: "Beagle", species: "Dog", gender: "Female", weight: "11 kg", age: "3 years", color: "Tri-color", description: "Energetic explorer. Loves treats and car rides.", location: "Whitefield, Bangalore", owner: { name: "Sneha Iyer" }, available: false, breederPrice: 28000, image: null },
    { id: "pet_5", name: "Milo", breed: "Indie Cat", species: "Cat", gender: "Male", weight: "5.2 kg", age: "1 year", color: "Orange Tabby", description: "Rescued street cat turned cuddly housecat.", location: "JP Nagar, Bangalore", owner: { name: "Karthik N" }, available: true, breederPrice: 5000, image: null },
  ],
  bookings: loadJSON(BOOKINGS_FILE, []),
  saved: loadJSON(SAVED_FILE, []),
  // Social feed (Pet-O-Gram)
  posts: loadJSON(POSTS_FILE, []),
  follows: [],          // { followerId, followingId }
  likes: [],            // { userId, postId }
  comments: [],         // { id, userId, postId, text, created_at }
  // Recovery network
  recoveryAlerts: loadJSON(RECOVERY_FILE, []),
  // Cart
  carts: loadJSON(CART_FILE, {}),  // userId -> [{productId, qty}]
  // Orders
  orders: loadJSON(ORDERS_FILE, []),
  // Coins
  coins: loadJSON(COINS_FILE, {}),  // userId -> { balance, transactions[], lastLogin }
  // Charity
  charityMedia: loadJSON(CHARITY_FILE, []),
  donations: [],
  // Emergency vets
  emergencyVets: loadJSON(EMERGVETS_FILE, [
    { id: "ev_1", state: "Karnataka", name: "BBMP Animal Helpline", phone: "1800-425-3939", type: "helpline" },
    { id: "ev_2", state: "Karnataka", name: "CUPA Bangalore", phone: "+91 80 2559 4932", type: "shelter" },
    { id: "ev_3", state: "Karnataka", name: "PFA Ambulance Bangalore", phone: "+91 98451 38989", type: "ambulance" },
    { id: "ev_4", state: "Maharashtra", name: "BSPCA Mumbai", phone: "+91 22 2410 1689", type: "shelter" },
    { id: "ev_5", state: "Maharashtra", name: "IDA Mumbai", phone: "+91 22 6439 9724", type: "shelter" },
    { id: "ev_6", state: "Delhi", name: "Friendicoes Delhi", phone: "+91 11 2431 8487", type: "shelter" },
    { id: "ev_7", state: "Delhi", name: "Sanjay Gandhi Animal Care", phone: "+91 11 2601 5027", type: "shelter" },
    { id: "ev_8", state: "Tamil Nadu", name: "Blue Cross Chennai", phone: "+91 44 2234 1399", type: "shelter" },
    { id: "ev_9", state: "Tamil Nadu", name: "PFA Chennai", phone: "+91 44 2538 1504", type: "shelter" },
    { id: "ev_10", state: "Telangana", name: "Blue Cross Hyderabad", phone: "+91 40 2354 4355", type: "shelter" },
  ]),
  // Celebrations
  celebrations: loadJSON(CELEBRATIONS_FILE, [
    { id: "cel_1", name: "Pawsome Birthday Bash", category: "Birthday", price: 4999, description: "Complete birthday party setup with cake, decorations, and a photoshoot for your pet!", image: null },
    { id: "cel_2", name: "Gotcha Day Special", category: "Gotcha Day", price: 2999, description: "Celebrate the day your pet joined your family with a special party.", image: null },
    { id: "cel_3", name: "Puppy Shower", category: "Special", price: 3499, description: "Welcome a new puppy home with a themed shower party.", image: null },
    { id: "cel_4", name: "Custom DIY Party", category: "DIY", price: 1999, description: "Tell us your vision and we'll bring it to life. Fully customizable.", image: null },
  ]),
};

// Persistence helpers for new stores
function persistUserPets()  { saveJSON(PETS_FILE, mem.userPets); }
function persistBookings()  { saveJSON(BOOKINGS_FILE, mem.bookings); }
function persistSavedItems(){ saveJSON(SAVED_FILE, mem.saved); }
function persistPosts()     { saveJSON(POSTS_FILE, mem.posts); }
function persistRecovery()  { saveJSON(RECOVERY_FILE, mem.recoveryAlerts); }
function persistCarts()     { saveJSON(CART_FILE, mem.carts); }
function persistOrders()    { saveJSON(ORDERS_FILE, mem.orders); }
function persistCoins()     { saveJSON(COINS_FILE, mem.coins); }
function persistCharity()   { saveJSON(CHARITY_FILE, mem.charityMedia); }
function persistProducts()  { saveJSON(PRODUCTS_FILE, mem.products); }
function persistEmergVets() { saveJSON(EMERGVETS_FILE, mem.emergencyVets); }
function persistCelebrations(){ saveJSON(CELEBRATIONS_FILE, mem.celebrations); }

// ── Helpers ───────────────────────────────────────────
function genOtp() { return Math.floor(100000 + Math.random() * 900000).toString(); }
function genToken() { return "stk_" + crypto.randomBytes(32).toString("hex"); }
function genId(prefix) { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`; }

// Password hashing (PBKDF2 — no extra deps)
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(pw, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}
function verifyPassword(pw, stored) {
  const [salt, hash] = stored.split(":");
  const test = crypto.pbkdf2Sync(pw, salt, 100000, 64, "sha512").toString("hex");
  return test === hash;
}

// Promo media store (persisted)
let promoMedia = loadJSON(PROMO_FILE, []);
function persistPromo() { try { writeFileSync(PROMO_FILE, JSON.stringify(promoMedia, null, 2)); } catch {} }

async function sendOtpEmail(email, code) {
  try {
    const headers = { "Content-Type": "application/json" };
    if (MAIL_API_KEY) headers["X-API-Key"] = MAIL_API_KEY;
    const res = await fetch(`${MAIL_API_URL}/api/send-otp`, {
      method: "POST", headers,
      body: JSON.stringify({ to: email, code, app_name: "Servleash" }),
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    if (!res.ok) { console.warn("Mail API error:", data.error || data); return false; }
    console.log(`📧 OTP sent to ${email}`);
    return true;
  } catch (err) { console.warn("📧 Mail API unreachable:", err.message); return false; }
}

async function sendResetEmail(email, resetLink) {
  try {
    const headers = { "Content-Type": "application/json" };
    if (MAIL_API_KEY) headers["X-API-Key"] = MAIL_API_KEY;
    const res = await fetch(`${MAIL_API_URL}/api/send-reset`, {
      method: "POST", headers,
      body: JSON.stringify({ to: email, reset_link: resetLink, app_name: "Servleash" }),
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    if (!res.ok) { console.warn("Mail API error:", data.error || data); return false; }
    console.log(`📧 Reset email sent to ${email}`);
    return true;
  } catch (err) { console.warn("📧 Mail API unreachable:", err.message); return false; }
}

// ── Persistence for services & vendors ─────────────────
function persistServices() { try { writeFileSync(SERVICES_FILE, JSON.stringify(mem.services, null, 2)); } catch {} }
function persistVendors()  { try { writeFileSync(VENDORS_FILE,  JSON.stringify(mem.vendors,  null, 2)); } catch {} }

// If persisted services/vendors exist, use them (so admin changes survive restarts)
try {
  const persistedServices = loadJSON(SERVICES_FILE, null);
  if (persistedServices && Array.isArray(persistedServices) && persistedServices.length) mem.services = persistedServices;
} catch {}
try {
  const persistedVendors = loadJSON(VENDORS_FILE, null);
  if (persistedVendors && Array.isArray(persistedVendors) && persistedVendors.length) mem.vendors = persistedVendors;
} catch {}

// ── Vendor SSE (simple) ──────────────────────────────
const vendorStreams = new Map(); // vendorId -> Set<res>
function notifyVendor(vendorId, payload) {
  const set = vendorStreams.get(vendorId);
  if (!set) return;
  const data = JSON.stringify(payload);
  for (const res of set) {
    try { res.write(`event: message\ndata: ${data}\n\n`); } catch (e) { /* ignore */ }
  }
}

// ── Auth middleware ────────────────────────────────────
async function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "Not authenticated" });
  const token = auth.replace("Bearer ", "");
  const userId = mem.sessions.get(token);
  if (!userId) return res.status(401).json({ error: "Session expired" });
  req.userId = userId;
  req.user = mem.users.find(u => String(u.id) === userId);
  next();
}

// ═══════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════

// ── Register (email + password + name) → sends OTP ────
app.post("/api/auth/register", async (req, res) => {
  const { email, password, name, phone, city, role } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email and password required" });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
  const r = role || "customer";
  const existing = mem.users.find(u => u.email === email && u.role === r);
  if (existing && existing.password) return res.status(409).json({ error: "Account already exists. Please login." });

  // If user exists (created via old OTP-only flow) but has no password, set it now
  if (existing && !existing.password) {
    existing.password = hashPassword(password);
    if (name) existing.name = name;
    if (phone) existing.phone = phone;
    if (city) existing.city = city;
    persistUsers();
  } else {
    // Create user with password (not yet verified)
    const user = {
      id: genId("user"), email, role: r,
      name: name || "User", phone: phone || null, city: city || null,
      avatar: null, password: hashPassword(password), verified: false,
      created_at: new Date().toISOString(),
    };
    mem.users.push(user);
    persistUsers();
  }

  // Send OTP for verification
  const code = genOtp();
  mem.otps.set(`${r}:${email}`, { code, expires: new Date(Date.now() + 10 * 60 * 1000) });
  const sent = await sendOtpEmail(email, code);
  res.json({ success: true, message: "Account created. Verify your email.", emailSent: sent,
    ...((!sent && process.env.NODE_ENV !== "production") ? { devCode: code } : {}),
  });
});

// ── Login (email + password) → sends OTP ──────────────
app.post("/api/auth/login", async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email and password required" });
  const r = role || "customer";
  const user = mem.users.find(u => u.email === email && u.role === r);
  if (!user) return res.status(401).json({ error: "Account not found. Please register first." });

  // If user has no password (old OTP-only account), let them set one
  if (!user.password) {
    user.password = hashPassword(password);
    persistUsers();
  } else if (!verifyPassword(password, user.password)) {
    return res.status(401).json({ error: "Invalid password" });
  }

  // Send OTP for 2FA
  const code = genOtp();
  mem.otps.set(`${r}:${email}`, { code, expires: new Date(Date.now() + 10 * 60 * 1000) });
  const sent = await sendOtpEmail(email, code);
  res.json({ success: true, message: "Password verified. OTP sent.", emailSent: sent,
    ...((!sent && process.env.NODE_ENV !== "production") ? { devCode: code } : {}),
  });
});

// ── Legacy: request-otp (still used for forgot-password etc) ─
app.post("/api/auth/request-otp", async (req, res) => {
  const { email, role } = req.body;
  if (!email || !role) return res.status(400).json({ error: "email and role required" });

  const code = genOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  mem.otps.set(`${role}:${email}`, { code, expires: expiresAt });

  const sent = await sendOtpEmail(email, code);
  res.json({
    success: true,
    message: sent ? "Verification code sent to your email" : "OTP generated (email service unavailable)",
    emailSent: sent,
    ...((!sent && process.env.NODE_ENV !== "production") ? { devCode: code } : {}),
  });
});

app.post("/api/auth/verify-otp", async (req, res) => {
  const { email, role, code, name, phone, city } = req.body;
  if (!email || !role || !code) return res.status(400).json({ error: "email, role, and code required" });

  const memOtp = mem.otps.get(`${role}:${email}`);
  if (!memOtp || memOtp.code !== code || memOtp.expires < new Date()) {
    return res.status(401).json({ error: "Invalid or expired verification code" });
  }
  mem.otps.delete(`${role}:${email}`);

  let user = mem.users.find(u => u.email === email && u.role === role);
  if (!user) {
    user = {
      id: genId("user"),
      email, role,
      name: name || (role === "admin" ? "Admin" : role === "vendor" ? "Vendor" : "User"),
      phone: phone || null,
      city: city || null,
      avatar: null,
      created_at: new Date().toISOString(),
    };
    mem.users.push(user);
  } else {
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (city) user.city = city;
  }
  user.verified = true;  // OTP verified

  const token = genToken();
  mem.sessions.set(token, String(user.id));
  persistUsers();
  persistSessions();

  res.json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, city: user.city },
    token,
  });
});

app.post("/api/auth/logout", authenticate, (req, res) => {
  const token = req.headers.authorization.replace("Bearer ", "");
  mem.sessions.delete(token);
  persistSessions();
  res.json({ success: true });
});

// ── Resend OTP ───────────────────────────────────────
app.post("/api/auth/resend-otp", async (req, res) => {
  const { email, role } = req.body;
  if (!email || !role) return res.status(400).json({ error: "email and role required" });
  const code = genOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  mem.otps.set(`${role}:${email}`, { code, expires: expiresAt });
  const sent = await sendOtpEmail(email, code);
  res.json({ success: true, emailSent: sent });
});

// ── Request password reset ────────────────────────────
app.post("/api/auth/request-password-reset", async (req, res) => {
  const { email, role = "customer", appUrl } = req.body;
  if (!email) return res.status(400).json({ error: "email required" });

  // Always respond with success to prevent email enumeration
  const user = mem.users.find(u => u.email === email && u.role === role);
  if (!user) return res.json({ success: true, message: "If that email is registered, a reset link has been sent." });

  const token = "rst_" + crypto.randomBytes(32).toString("hex");
  mem.resetTokens.set(token, { email, role, expires: new Date(Date.now() + 60 * 60 * 1000) });

  const base = appUrl || "http://localhost:5173";
  const resetLink = `${base}/${role}/reset-password?token=${token}`;
  const sent = await sendResetEmail(email, resetLink);

  res.json({
    success: true,
    message: "If that email is registered, a reset link has been sent.",
    emailSent: sent,
    ...(process.env.NODE_ENV !== "production" ? { devToken: token } : {}),
  });
});

// ── Verify reset token (check it's still valid) ───────
app.get("/api/auth/reset-password", (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: "token required" });
  const record = mem.resetTokens.get(token);
  if (!record || record.expires < new Date()) {
    return res.status(400).json({ error: "Reset link has expired or is invalid. Please request a new one." });
  }
  res.json({ valid: true, email: record.email, role: record.role });
});

// ── Complete password reset (OTP re-verification path) ─
// Since Servleash is OTP-based (no passwords), "password reset" means:
// invalidate all sessions for this user, send a fresh OTP to log back in.
app.post("/api/auth/reset-password", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "token required" });
  const record = mem.resetTokens.get(token);
  if (!record || record.expires < new Date()) {
    return res.status(400).json({ error: "Reset link has expired or is invalid. Please request a new one." });
  }
  mem.resetTokens.delete(token);

  // Invalidate all active sessions for this user
  const user = mem.users.find(u => u.email === record.email && u.role === record.role);
  if (user) {
    for (const [sessToken, userId] of mem.sessions.entries()) {
      if (userId === String(user.id)) mem.sessions.delete(sessToken);
    }
  }

  // Send a fresh OTP for re-login
  const code = genOtp();
  mem.otps.set(`${record.role}:${record.email}`, { code, expires: new Date(Date.now() + 10 * 60 * 1000) });
  const sent = await sendOtpEmail(record.email, code);

  res.json({
    success: true,
    email: record.email,
    role: record.role,
    emailSent: sent,
    message: "Sessions cleared. A new login code has been sent to your email.",
    ...(process.env.NODE_ENV !== "production" ? { devCode: code } : {}),
  });
});

// ═══════════════════════════════════════════════════════
// USER PROFILE
// ═══════════════════════════════════════════════════════

// ── /me — validate stored token and return user (used for auto-login) ──
app.get("/api/auth/me", authenticate, (req, res) => {
  const u = req.user;
  if (!u) return res.status(404).json({ error: "User not found" });
  res.json({ user: { id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, city: u.city } });
});

app.get("/api/user/profile", authenticate, (req, res) => {
  const u = req.user;
  if (!u) return res.status(404).json({ error: "User not found" });

  const bookingCount = mem.bookings.filter(b => b.userId === u.id).length;
  const savedCount = mem.saved.filter(s => s.userId === u.id).length;

  res.json({
    id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, city: u.city,
    stats: { bookings: bookingCount, saved: savedCount, coins: 0 },
  });
});

app.put("/api/user/profile", authenticate, (req, res) => {
  const u = req.user;
  if (!u) return res.status(404).json({ error: "User not found" });
  const { name, phone, city } = req.body;
  if (name !== undefined) u.name = name;
  if (phone !== undefined) u.phone = phone;
  if (city !== undefined) u.city = city;
  res.json({ success: true, user: { id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, city: u.city } });
});

// ═══════════════════════════════════════════════════════
// SERVICES
// ═══════════════════════════════════════════════════════

app.get("/api/services", (_req, res) => {
  const { category, q } = _req.query;
  let list = [...mem.services];
  if (category && category !== "All") list = list.filter(s => s.category === category);
  if (q) list = list.filter(s => s.name.toLowerCase().includes(q.toLowerCase()));
  res.json(list);
});

app.get("/api/services/:id", (req, res) => {
  const svc = mem.services.find(s => s.id === req.params.id);
  if (!svc) return res.status(404).json({ error: "Service not found" });
  const vendor = mem.vendors.find(v => v.services.includes(svc.id));
  res.json({ ...svc, vendor: vendor || null });
});

// ═══════════════════════════════════════════════════════
// VENDORS
// ═══════════════════════════════════════════════════════

app.get("/api/vendors", (_req, res) => {
  const { category, q } = _req.query;
  let list = mem.vendors.map(v => ({
    ...v,
    serviceDetails: v.services.map(sid => mem.services.find(s => s.id === sid)).filter(Boolean),
  }));
  if (category && category !== "All") list = list.filter(v => v.category === category);
  if (q) list = list.filter(v => v.name.toLowerCase().includes(q.toLowerCase()));
  res.json(list);
});

app.get("/api/vendors/:id", (req, res) => {
  const v = mem.vendors.find(v => v.id === req.params.id);
  if (!v) return res.status(404).json({ error: "Vendor not found" });
  const serviceDetails = v.services.map(sid => mem.services.find(s => s.id === sid)).filter(Boolean);
  res.json({ ...v, serviceDetails });
});

// ═══════════════════════════════════════════════════════
// PRODUCTS (SHOP)
// ═══════════════════════════════════════════════════════

app.get("/api/products", (_req, res) => {
  const { category, q } = _req.query;
  let list = [...mem.products];
  if (category && category !== "All") list = list.filter(p => p.category === category);
  if (q) list = list.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
  res.json(list);
});

app.get("/api/products/:id", (req, res) => {
  const p = mem.products.find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({ error: "Product not found" });
  res.json(p);
});

// ═══════════════════════════════════════════════════════
// PETS
// ═══════════════════════════════════════════════════════

app.get("/api/pets", (_req, res) => {
  const { species, q } = _req.query;
  let list = [...mem.pets];
  if (species) list = list.filter(p => p.species.toLowerCase() === species.toLowerCase());
  if (q) list = list.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
  res.json(list);
});

app.get("/api/pets/:id", (req, res) => {
  const pet = mem.pets.find(p => p.id === req.params.id);
  if (!pet) return res.status(404).json({ error: "Pet not found" });
  res.json(pet);
});

// ═══════════════════════════════════════════════════════
// USER PET MANAGEMENT (My Pets)
// ═══════════════════════════════════════════════════════

app.get("/api/my-pets", authenticate, (req, res) => {
  const pets = mem.userPets.filter(p => p.userId === req.userId);
  res.json(pets);
});

app.get("/api/my-pets/:id", authenticate, (req, res) => {
  const pet = mem.userPets.find(p => p.id === req.params.id && p.userId === req.userId);
  if (!pet) return res.status(404).json({ error: "Pet not found" });
  res.json(pet);
});

app.post("/api/my-pets", authenticate, (req, res) => {
  const { name, species, breed, age, weight, color, gender, image } = req.body;
  if (!name || !species) return res.status(400).json({ error: "name and species required" });
  const pet = {
    id: genId("mypet"), userId: req.userId, name, species, breed: breed || "",
    age: age || "", weight: weight || "", color: color || "", gender: gender || "",
    image: image || null, documents: [], qrEnabled: false, lostMode: false,
    qrToggles: { name: true, photo: true, breed: true, age: true, medicalRecords: false, ownerPhone: false, ownerName: false },
    created_at: new Date().toISOString(),
  };
  mem.userPets.push(pet);
  persistUserPets();
  res.json({ success: true, pet });
});

app.put("/api/my-pets/:id", authenticate, (req, res) => {
  const pet = mem.userPets.find(p => p.id === req.params.id && p.userId === req.userId);
  if (!pet) return res.status(404).json({ error: "Pet not found" });
  const fields = ["name", "species", "breed", "age", "weight", "color", "gender", "image", "qrEnabled", "lostMode", "qrToggles"];
  fields.forEach(f => { if (req.body[f] !== undefined) pet[f] = req.body[f]; });
  persistUserPets();
  res.json({ success: true, pet });
});

app.delete("/api/my-pets/:id", authenticate, (req, res) => {
  const idx = mem.userPets.findIndex(p => p.id === req.params.id && p.userId === req.userId);
  if (idx === -1) return res.status(404).json({ error: "Pet not found" });
  mem.userPets.splice(idx, 1);
  persistUserPets();
  res.json({ success: true });
});

// Pet documents
app.post("/api/my-pets/:id/documents", authenticate, upload.single("file"), (req, res) => {
  const pet = mem.userPets.find(p => p.id === req.params.id && p.userId === req.userId);
  if (!pet) return res.status(404).json({ error: "Pet not found" });
  if ((pet.documents || []).length >= 10) return res.status(400).json({ error: "Maximum 10 documents per pet" });
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const doc = {
    id: genId("doc"), name: req.body.docName || req.file.originalname,
    type: req.body.docType || "other", url: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname, uploaded_at: new Date().toISOString(),
  };
  if (!pet.documents) pet.documents = [];
  pet.documents.push(doc);
  persistUserPets();
  res.json({ success: true, document: doc });
});

app.delete("/api/my-pets/:petId/documents/:docId", authenticate, (req, res) => {
  const pet = mem.userPets.find(p => p.id === req.params.petId && p.userId === req.userId);
  if (!pet) return res.status(404).json({ error: "Pet not found" });
  const idx = (pet.documents || []).findIndex(d => d.id === req.params.docId);
  if (idx === -1) return res.status(404).json({ error: "Document not found" });
  pet.documents.splice(idx, 1);
  persistUserPets();
  res.json({ success: true });
});

// Public QR pet profile
app.get("/api/pet-qr/:id", (req, res) => {
  const pet = mem.userPets.find(p => p.id === req.params.id);
  if (!pet || !pet.qrEnabled) return res.status(404).json({ error: "QR profile not available" });
  const user = mem.users.find(u => String(u.id) === pet.userId);
  const toggles = pet.qrToggles || {};
  const profile = { id: pet.id, lostMode: pet.lostMode || false };
  if (toggles.name) profile.name = pet.name;
  if (toggles.photo) profile.image = pet.image;
  if (toggles.breed) { profile.breed = pet.breed; profile.species = pet.species; }
  if (toggles.age) profile.age = pet.age;
  if (toggles.medicalRecords) profile.documents = pet.documents || [];
  if (toggles.ownerName && user) profile.ownerName = user.name;
  if (toggles.ownerPhone && user) profile.ownerPhone = user.phone;
  if (pet.lostMode && user) {
    profile.ownerName = user.name;
    profile.ownerPhone = user.phone;
    profile.emergencyMessage = "This pet has been reported LOST. Please contact the owner!";
  }
  res.json(profile);
});

// ═══════════════════════════════════════════════════════
// BOOKINGS
// ═══════════════════════════════════════════════════════

app.get("/api/bookings", authenticate, (req, res) => {
  const { status } = req.query;
  let list = mem.bookings.filter(b => b.userId === req.userId);
  if (status) list = list.filter(b => b.status === status);
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  // Enrich with service & vendor info
  list = list.map(b => ({
    ...b,
    service: mem.services.find(s => s.id === b.serviceId) || null,
    vendor: mem.vendors.find(v => v.id === b.vendorId) || null,
  }));
  res.json(list);
});

app.post("/api/bookings", authenticate, (req, res) => {
  const { serviceId, vendorId, date, time, petName, notes } = req.body;
  if (!serviceId || !vendorId || !date || !time) {
    return res.status(400).json({ error: "serviceId, vendorId, date, and time are required" });
  }
  const svc = mem.services.find(s => s.id === serviceId);
  const ven = mem.vendors.find(v => v.id === vendorId);
  if (!svc || !ven) return res.status(404).json({ error: "Service or vendor not found" });

  const booking = {
    id: genId("bk"),
    userId: req.userId,
    serviceId, vendorId,
    date, time,
    petName: petName || null,
    notes: notes || null,
    status: "upcoming",
    amount: svc.price,
    created_at: new Date().toISOString(),
  };
  mem.bookings.push(booking);
  persistBookings();
  // Notify vendor(s) in real-time if connected
  try { notifyVendor(vendorId, { type: 'new_booking', booking }); } catch { /* ignore */ }
  // Persist bookings? In this simple demo bookings are in-memory only.
  res.json({ success: true, booking: { ...booking, service: svc, vendor: ven } });
});

app.put("/api/bookings/:id/cancel", authenticate, (req, res) => {
  const bk = mem.bookings.find(b => b.id === req.params.id && b.userId === req.userId);
  if (!bk) return res.status(404).json({ error: "Booking not found" });
  if (bk.status !== "upcoming") return res.status(400).json({ error: "Only upcoming bookings can be cancelled" });
  // Cancellation policy: no cancel within 2 hours of appointment
  if (bk.date && bk.time) {
    const apptTime = new Date(`${bk.date}T${bk.time}`);
    const now = new Date();
    const hoursUntil = (apptTime - now) / (1000 * 60 * 60);
    if (hoursUntil < 2) return res.status(400).json({ error: "Cannot cancel within 2 hours of appointment" });
    // If booked less than 5 hours before appointment, also non-cancellable
    const bookedAt = new Date(bk.created_at);
    const hoursBookedBefore = (apptTime - bookedAt) / (1000 * 60 * 60);
    if (hoursBookedBefore < 5) return res.status(400).json({ error: "Bookings made less than 5 hours before the appointment cannot be cancelled" });
  }
  bk.status = "cancelled";
  persistBookings();
  res.json({ success: true, booking: bk });
});

app.put("/api/bookings/:id/complete", authenticate, (req, res) => {
  const bk = mem.bookings.find(b => b.id === req.params.id);
  if (!bk) return res.status(404).json({ error: "Booking not found" });
  bk.status = "completed";
  res.json({ success: true, booking: bk });
});

// ═══════════════════════════════════════════════════════
// SAVED / FAVOURITES
// ═══════════════════════════════════════════════════════

app.get("/api/saved", authenticate, (req, res) => {
  const userSaved = mem.saved.filter(s => s.userId === req.userId);
  const enriched = userSaved.map(s => {
    if (s.type === "vendor") return { ...s, item: mem.vendors.find(v => v.id === s.itemId) };
    if (s.type === "service") return { ...s, item: mem.services.find(sv => sv.id === s.itemId) };
    if (s.type === "pet") return { ...s, item: mem.pets.find(p => p.id === s.itemId) };
    if (s.type === "product") return { ...s, item: mem.products.find(p => p.id === s.itemId) };
    return s;
  });
  res.json(enriched);
});

app.post("/api/saved", authenticate, (req, res) => {
  const { itemId, type } = req.body;
  if (!itemId || !type) return res.status(400).json({ error: "itemId and type required" });
  const existing = mem.saved.find(s => s.userId === req.userId && s.itemId === itemId && s.type === type);
  if (existing) return res.json({ success: true, saved: true, message: "Already saved" });
  mem.saved.push({ id: genId("sv"), userId: req.userId, itemId, type, created_at: new Date().toISOString() });
  res.json({ success: true, saved: true });
});

app.delete("/api/saved/:itemId", authenticate, (req, res) => {
  const { type } = req.query;
  const idx = mem.saved.findIndex(s => s.userId === req.userId && s.itemId === req.params.itemId && (!type || s.type === type));
  if (idx === -1) return res.json({ success: true, saved: false });
  mem.saved.splice(idx, 1);
  res.json({ success: true, saved: false });
});

app.get("/api/saved/check/:itemId", authenticate, (req, res) => {
  const { type } = req.query;
  const exists = mem.saved.some(s => s.userId === req.userId && s.itemId === req.params.itemId && (!type || s.type === type));
  res.json({ saved: exists });
});

// ═══════════════════════════════════════════════════════
// ADMIN STATS
// ═══════════════════════════════════════════════════════

app.get("/api/admin/stats", authenticate, (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const customers = mem.users.filter(u => u.role === "customer").length;
  const vendors = mem.users.filter(u => u.role === "vendor").length;
  const totalBookings = mem.bookings.length;
  const revenue = mem.bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
  const recentUsers = mem.users.slice(-5).reverse().map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, created_at: u.created_at }));
  const recentBookings = mem.bookings.slice(-5).reverse().map(b => ({
    ...b,
    service: mem.services.find(s => s.id === b.serviceId),
    userName: mem.users.find(u => String(u.id) === b.userId)?.name || "Unknown",
  }));
  res.json({ customers, vendors, totalBookings, revenue, activeVendors: mem.vendors.length, recentUsers, recentBookings });
});

app.get("/api/admin/users", authenticate, (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const { role } = req.query;
  let users = mem.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, city: u.city, created_at: u.created_at }));
  if (role) users = users.filter(u => u.role === role);
  res.json(users);
});

// ── Admin: upload icons/files ───────────────────────
app.post('/api/admin/upload', authenticate, upload.single('file'), (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  // Return a public URL relative to the server
  const filePath = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: filePath, filename: req.file.originalname });
});

// ── Admin: Services CRUD ───────────────────────────
app.post('/api/admin/services', authenticate, (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { name, category, price, duration, description, image, serviceMode } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const svc = { id: genId('svc'), name, category: category || 'General', price: price || 0, duration: duration || null, rating: 0, reviews: 0, description: description || '', image: image || null, serviceMode: serviceMode || 'both' };
  mem.services.push(svc);
  persistServices();
  res.json({ success: true, service: svc });
});

app.put('/api/admin/services/:id', authenticate, (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const svc = mem.services.find(s => s.id === req.params.id);
  if (!svc) return res.status(404).json({ error: 'Service not found' });
  const { name, category, price, duration, description, image, serviceMode } = req.body;
  if (name !== undefined) svc.name = name;
  if (category !== undefined) svc.category = category;
  if (price !== undefined) svc.price = price;
  if (duration !== undefined) svc.duration = duration;
  if (description !== undefined) svc.description = description;
  if (image !== undefined) svc.image = image;
  if (serviceMode !== undefined) svc.serviceMode = serviceMode;
  persistServices();
  res.json({ success: true, service: svc });
});

app.delete('/api/admin/services/:id', authenticate, (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const idx = mem.services.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Service not found' });
  mem.services.splice(idx, 1);
  // Also remove service references from vendors
  for (const v of mem.vendors) v.services = v.services.filter(sid => sid !== req.params.id);
  persistServices(); persistVendors();
  res.json({ success: true });
});

// ── Admin: Vendors CRUD ────────────────────────────
app.post('/api/admin/vendors', authenticate, (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { name, category, address, city, phone, services: svcList, image } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const v = { id: genId('ven'), name, category: category || 'General', rating: 0, reviews: 0, distance: '0 km', address: address || '', city: city || '', phone: phone || '', image: image || null, services: Array.isArray(svcList) ? svcList : [] };
  mem.vendors.push(v);
  persistVendors();
  res.json({ success: true, vendor: v });
});

app.put('/api/admin/vendors/:id', authenticate, (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const v = mem.vendors.find(vv => vv.id === req.params.id);
  if (!v) return res.status(404).json({ error: 'Vendor not found' });
  const { name, category, address, city, phone, services: svcList, image } = req.body;
  if (name !== undefined) v.name = name;
  if (category !== undefined) v.category = category;
  if (address !== undefined) v.address = address;
  if (city !== undefined) v.city = city;
  if (phone !== undefined) v.phone = phone;
  if (svcList !== undefined) v.services = Array.isArray(svcList) ? svcList : v.services;
  if (image !== undefined) v.image = image;
  persistVendors();
  res.json({ success: true, vendor: v });
});

app.delete('/api/admin/vendors/:id', authenticate, (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const idx = mem.vendors.findIndex(v => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Vendor not found' });
  mem.vendors.splice(idx, 1);
  persistVendors();
  res.json({ success: true });
});

// ── Admin: Promo Media (looping videos/photos for homepage) ─
app.get('/api/promo', (_req, res) => { res.json(promoMedia); });

app.post('/api/admin/promo', authenticate, (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { url, type, title, link } = req.body;  // type: 'image'|'video'
  if (!url) return res.status(400).json({ error: 'url required' });
  const item = { id: genId('promo'), url, type: type || 'image', title: title || '', link: link || '', created_at: new Date().toISOString() };
  promoMedia.push(item);
  persistPromo();
  res.json({ success: true, promo: item });
});

app.delete('/api/admin/promo/:id', authenticate, (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const idx = promoMedia.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Promo not found' });
  promoMedia.splice(idx, 1);
  persistPromo();
  res.json({ success: true });
});

// ── Admin: All Bookings Manager ────────────────────
app.get('/api/admin/bookings', authenticate, (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { status } = req.query;
  let list = [...mem.bookings].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  if (status) list = list.filter(b => b.status === status);
  list = list.map(b => ({
    ...b,
    service: mem.services.find(s => s.id === b.serviceId) || null,
    vendor: mem.vendors.find(v => v.id === b.vendorId) || null,
    customer: mem.users.find(u => String(u.id) === b.userId) ? { name: mem.users.find(u => String(u.id) === b.userId).name } : { name: "Unknown" },
  }));
  res.json(list);
});

app.put('/api/admin/bookings/:id/status', authenticate, (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { status } = req.body; // upcoming, completed, cancelled, checked_out
  const bk = mem.bookings.find(b => b.id === req.params.id);
  if (!bk) return res.status(404).json({ error: 'Booking not found' });
  bk.status = status;
  res.json({ success: true, booking: bk });
});

// ═══════════════════════════════════════════════════════
// VENDOR DASHBOARD
// ═══════════════════════════════════════════════════════

// ── Vendor SSE stream (vendors connect to receive realtime events) ─
app.get('/api/vendor/stream', authenticate, (req, res) => {
  if (req.user?.role !== 'vendor') return res.status(403).json({ error: 'Vendor only' });
  const vendorId = req.user.id;
  // set headers for SSE
  res.writeHead(200, {
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache'
  });
  res.write('\n');
  // add to map
  let set = vendorStreams.get(vendorId);
  if (!set) { set = new Set(); vendorStreams.set(vendorId, set); }
  set.add(res);
  // remove on close
  req.on('close', () => { set.delete(res); });
});

app.get("/api/vendor/stats", authenticate, (req, res) => {
  if (req.user?.role !== "vendor") return res.status(403).json({ error: "Vendor only" });
  const allBookings = mem.bookings;
  const todayStr = new Date().toISOString().split("T")[0];
  const todayBookings = allBookings.filter(b => b.date === todayStr).length;
  const totalRevenue = allBookings.reduce((s, b) => s + (b.amount || 0), 0);
  const totalServices = mem.services.length;
  res.json({ todayBookings, totalRevenue, rating: 4.7, totalServices });
});

app.get("/api/vendor/bookings", authenticate, (req, res) => {
  if (req.user?.role !== "vendor") return res.status(403).json({ error: "Vendor only" });
  let list = [...mem.bookings].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  list = list.map(b => ({
    ...b,
    service: mem.services.find(s => s.id === b.serviceId) || null,
    customerName: mem.users.find(u => String(u.id) === b.userId)?.name || "Customer",
  }));
  res.json(list);
});

// ═══════════════════════════════════════════════════════
// SEARCH (unified)
// ═══════════════════════════════════════════════════════

app.get("/api/search", (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ services: [], vendors: [], products: [], pets: [] });
  const lq = q.toLowerCase();
  res.json({
    services: mem.services.filter(s => s.name.toLowerCase().includes(lq) || s.category.toLowerCase().includes(lq)),
    vendors: mem.vendors.filter(v => v.name.toLowerCase().includes(lq) || v.category.toLowerCase().includes(lq)),
    products: mem.products.filter(p => p.name.toLowerCase().includes(lq) || p.category.toLowerCase().includes(lq)),
    pets: mem.pets.filter(p => p.name.toLowerCase().includes(lq) || p.breed.toLowerCase().includes(lq)),
  });
});

// ═══════════════════════════════════════════════════════
// CART
// ═══════════════════════════════════════════════════════

app.get("/api/cart", authenticate, (req, res) => {
  const items = mem.carts[req.userId] || [];
  const enriched = items.map(ci => ({
    ...ci,
    product: mem.products.find(p => p.id === ci.productId) || null,
  }));
  const total = enriched.reduce((s, i) => s + ((i.product?.price || 0) * i.qty), 0);
  res.json({ items: enriched, total });
});

app.post("/api/cart", authenticate, (req, res) => {
  const { productId, qty } = req.body;
  if (!productId) return res.status(400).json({ error: "productId required" });
  if (!mem.carts[req.userId]) mem.carts[req.userId] = [];
  const existing = mem.carts[req.userId].find(c => c.productId === productId);
  if (existing) { existing.qty = (existing.qty || 1) + (qty || 1); }
  else { mem.carts[req.userId].push({ productId, qty: qty || 1 }); }
  persistCarts();
  res.json({ success: true, cart: mem.carts[req.userId] });
});

app.put("/api/cart/:productId", authenticate, (req, res) => {
  const { qty } = req.body;
  if (!mem.carts[req.userId]) return res.json({ success: true });
  const item = mem.carts[req.userId].find(c => c.productId === req.params.productId);
  if (!item) return res.status(404).json({ error: "Item not in cart" });
  if (qty <= 0) { mem.carts[req.userId] = mem.carts[req.userId].filter(c => c.productId !== req.params.productId); }
  else { item.qty = qty; }
  persistCarts();
  res.json({ success: true });
});

app.delete("/api/cart/:productId", authenticate, (req, res) => {
  if (!mem.carts[req.userId]) return res.json({ success: true });
  mem.carts[req.userId] = mem.carts[req.userId].filter(c => c.productId !== req.params.productId);
  persistCarts();
  res.json({ success: true });
});

// ═══════════════════════════════════════════════════════
// ORDERS (E-Commerce)
// ═══════════════════════════════════════════════════════

app.get("/api/orders", authenticate, (req, res) => {
  const orders = mem.orders.filter(o => o.userId === req.userId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(orders);
});

app.post("/api/orders", authenticate, (req, res) => {
  const { address, coinsUsed, charityAmount } = req.body;
  const cartItems = mem.carts[req.userId] || [];
  if (!cartItems.length) return res.status(400).json({ error: "Cart is empty" });

  const items = cartItems.map(ci => {
    const p = mem.products.find(pp => pp.id === ci.productId);
    return { productId: ci.productId, name: p?.name, price: p?.price || 0, qty: ci.qty };
  });
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const coinDiscount = Math.min(coinsUsed || 0, 100, (mem.coins[req.userId]?.balance || 0));
  const charity = charityAmount || 0;
  const total = subtotal - coinDiscount + charity;

  const order = {
    id: genId("ord"), userId: req.userId, items, subtotal, coinDiscount, charityAmount: charity,
    total, address: address || "", status: "confirmed", created_at: new Date().toISOString(),
  };
  mem.orders.push(order);
  mem.carts[req.userId] = [];
  if (coinDiscount > 0 && mem.coins[req.userId]) {
    mem.coins[req.userId].balance -= coinDiscount;
    mem.coins[req.userId].transactions.push({ type: "redeem", amount: -coinDiscount, desc: `Order ${order.id}`, date: new Date().toISOString() });
    persistCoins();
  }
  if (charity > 0) {
    mem.donations.push({ orderId: order.id, userId: req.userId, amount: charity, date: new Date().toISOString() });
  }
  persistOrders();
  persistCarts();
  res.json({ success: true, order });
});

// ═══════════════════════════════════════════════════════
// COINS & REFERRAL
// ═══════════════════════════════════════════════════════

app.get("/api/coins", authenticate, (req, res) => {
  const wallet = mem.coins[req.userId] || { balance: 0, transactions: [], lastLogin: null };
  res.json(wallet);
});

app.post("/api/coins/daily", authenticate, (req, res) => {
  if (!mem.coins[req.userId]) mem.coins[req.userId] = { balance: 0, transactions: [], lastLogin: null };
  const wallet = mem.coins[req.userId];
  const today = new Date().toISOString().split("T")[0];
  if (wallet.lastLogin === today) return res.json({ success: false, message: "Already claimed today", balance: wallet.balance });
  wallet.lastLogin = today;
  wallet.balance += 5;
  wallet.transactions.push({ type: "daily", amount: 5, desc: "Daily login reward", date: new Date().toISOString() });
  persistCoins();
  res.json({ success: true, message: "5 coins earned!", balance: wallet.balance, earned: 5 });
});

app.post("/api/coins/referral", authenticate, (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Referral code required" });
  // Find user with matching referral code
  const referrer = mem.users.find(u => u.referralCode === code && String(u.id) !== req.userId);
  if (!referrer) return res.status(404).json({ error: "Invalid referral code" });
  if (!mem.coins[req.userId]) mem.coins[req.userId] = { balance: 0, transactions: [], lastLogin: null };
  // Check if already used a referral
  const already = mem.coins[req.userId].transactions.find(t => t.type === "referral_used");
  if (already) return res.status(400).json({ error: "You have already used a referral code" });
  // Credit both
  mem.coins[req.userId].balance += 50;
  mem.coins[req.userId].transactions.push({ type: "referral_used", amount: 50, desc: `Referral from ${referrer.name}`, date: new Date().toISOString() });
  const refId = String(referrer.id);
  if (!mem.coins[refId]) mem.coins[refId] = { balance: 0, transactions: [], lastLogin: null };
  mem.coins[refId].balance += 50;
  mem.coins[refId].transactions.push({ type: "referral_given", amount: 50, desc: `Referred ${req.user?.name || "user"}`, date: new Date().toISOString() });
  persistCoins();
  res.json({ success: true, balance: mem.coins[req.userId].balance });
});

// Generate referral code
app.get("/api/referral-code", authenticate, (req, res) => {
  const user = req.user;
  if (!user.referralCode) {
    user.referralCode = "SL" + crypto.randomBytes(4).toString("hex").toUpperCase();
    persistUsers();
  }
  res.json({ code: user.referralCode });
});

// ═══════════════════════════════════════════════════════
// PET-O-GRAM (Social Feed)
// ═══════════════════════════════════════════════════════

// Clean up expired posts (24hr stories)
function cleanExpiredPosts() {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const before = mem.posts.length;
  mem.posts = mem.posts.filter(p => new Date(p.created_at).getTime() > cutoff);
  if (mem.posts.length !== before) persistPosts();
}

app.get("/api/posts", authenticate, (req, res) => {
  cleanExpiredPosts();
  const posts = [...mem.posts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const enriched = posts.map(p => {
    const author = mem.users.find(u => String(u.id) === p.userId);
    return {
      ...p,
      author: author ? { name: author.name, avatar: author.avatar } : { name: "User" },
      likeCount: mem.likes.filter(l => l.postId === p.id).length,
      liked: mem.likes.some(l => l.postId === p.id && l.userId === req.userId),
      commentCount: mem.comments.filter(c => c.postId === p.id).length,
    };
  });
  res.json(enriched);
});

app.post("/api/posts", authenticate, upload.single("media"), (req, res) => {
  const { caption, mediaUrl } = req.body;
  const media = req.file ? `/uploads/${req.file.filename}` : (mediaUrl || null);
  const post = {
    id: genId("post"), userId: req.userId, caption: caption || "", media,
    mediaType: req.file ? (req.file.mimetype.startsWith("video") ? "video" : "image") : "image",
    created_at: new Date().toISOString(),
  };
  mem.posts.push(post);
  persistPosts();
  res.json({ success: true, post });
});

app.delete("/api/posts/:id", authenticate, (req, res) => {
  const idx = mem.posts.findIndex(p => p.id === req.params.id && (p.userId === req.userId || req.user?.role === "admin"));
  if (idx === -1) return res.status(404).json({ error: "Post not found" });
  mem.posts.splice(idx, 1);
  persistPosts();
  res.json({ success: true });
});

app.post("/api/posts/:id/like", authenticate, (req, res) => {
  const existing = mem.likes.findIndex(l => l.postId === req.params.id && l.userId === req.userId);
  if (existing >= 0) { mem.likes.splice(existing, 1); return res.json({ liked: false }); }
  mem.likes.push({ userId: req.userId, postId: req.params.id });
  res.json({ liked: true });
});

app.get("/api/posts/:id/comments", authenticate, (req, res) => {
  const comments = mem.comments.filter(c => c.postId === req.params.id).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const enriched = comments.map(c => {
    const author = mem.users.find(u => String(u.id) === c.userId);
    return { ...c, author: author ? { name: author.name } : { name: "User" } };
  });
  res.json(enriched);
});

app.post("/api/posts/:id/comments", authenticate, (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text required" });
  const comment = { id: genId("cmt"), userId: req.userId, postId: req.params.id, text, created_at: new Date().toISOString() };
  mem.comments.push(comment);
  res.json({ success: true, comment });
});

// Follow system
app.post("/api/follow/:userId", authenticate, (req, res) => {
  const targetId = req.params.userId;
  if (targetId === req.userId) return res.status(400).json({ error: "Cannot follow yourself" });
  const existing = mem.follows.findIndex(f => f.followerId === req.userId && f.followingId === targetId);
  if (existing >= 0) { mem.follows.splice(existing, 1); return res.json({ following: false }); }
  mem.follows.push({ followerId: req.userId, followingId: targetId });
  res.json({ following: true });
});

// ═══════════════════════════════════════════════════════
// PET RECOVERY NETWORK (Lost & Found)
// ═══════════════════════════════════════════════════════

app.get("/api/recovery", (_req, res) => {
  const alerts = [...mem.recoveryAlerts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const enriched = alerts.map(a => {
    const user = mem.users.find(u => String(u.id) === a.userId);
    return { ...a, reporterName: user?.name || "Anonymous" };
  });
  res.json(enriched);
});

app.post("/api/recovery", authenticate, (req, res) => {
  const { type, petName, species, breed, description, lastSeenLocation, image, contactMethod } = req.body;
  if (!type || !petName) return res.status(400).json({ error: "type and petName required" });
  const alert = {
    id: genId("rcv"), userId: req.userId, type: type || "lost",
    petName, species: species || "", breed: breed || "", description: description || "",
    lastSeenLocation: lastSeenLocation || "", image: image || null,
    contactMethod: contactMethod || "app", status: "active",
    created_at: new Date().toISOString(),
  };
  mem.recoveryAlerts.push(alert);
  persistRecovery();
  res.json({ success: true, alert });
});

app.put("/api/recovery/:id/resolve", authenticate, (req, res) => {
  const alert = mem.recoveryAlerts.find(a => a.id === req.params.id && (a.userId === req.userId || req.user?.role === "admin"));
  if (!alert) return res.status(404).json({ error: "Alert not found" });
  alert.status = "resolved";
  persistRecovery();
  res.json({ success: true });
});

// ═══════════════════════════════════════════════════════
// EMERGENCY VET ACCESS
// ═══════════════════════════════════════════════════════

app.get("/api/emergency-vets", (_req, res) => {
  const { state } = _req.query;
  let list = [...mem.emergencyVets];
  if (state) list = list.filter(v => v.state.toLowerCase() === state.toLowerCase());
  res.json(list);
});

app.get("/api/emergency-vets/states", (_req, res) => {
  const states = [...new Set(mem.emergencyVets.map(v => v.state))].sort();
  res.json(states);
});

// ═══════════════════════════════════════════════════════
// CHARITY FUND MODULE
// ═══════════════════════════════════════════════════════

app.get("/api/charity", (_req, res) => {
  const totalDonations = mem.donations.reduce((s, d) => s + d.amount, 0);
  res.json({ media: mem.charityMedia, totalDonations, donorCount: new Set(mem.donations.map(d => d.userId)).size });
});

app.post("/api/admin/charity", authenticate, upload.single("media"), (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const { title, description, mediaUrl } = req.body;
  const media = req.file ? `/uploads/${req.file.filename}` : (mediaUrl || null);
  const item = {
    id: genId("char"), title: title || "", description: description || "",
    media, mediaType: req.file ? (req.file.mimetype.startsWith("video") ? "video" : "image") : "image",
    created_at: new Date().toISOString(),
  };
  mem.charityMedia.push(item);
  persistCharity();
  res.json({ success: true, item });
});

app.delete("/api/admin/charity/:id", authenticate, (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const idx = mem.charityMedia.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  mem.charityMedia.splice(idx, 1);
  persistCharity();
  res.json({ success: true });
});

// ═══════════════════════════════════════════════════════
// CELEBRATIONS & LIFESTYLE
// ═══════════════════════════════════════════════════════

app.get("/api/celebrations", (_req, res) => res.json(mem.celebrations));

app.post("/api/celebrations/book", authenticate, (req, res) => {
  const { celebrationId, date, time, petName, notes, customDiy } = req.body;
  if (!celebrationId) return res.status(400).json({ error: "celebrationId required" });
  const cel = mem.celebrations.find(c => c.id === celebrationId);
  if (!cel) return res.status(404).json({ error: "Package not found" });
  const booking = {
    id: genId("celbk"), userId: req.userId, celebrationId, celebrationName: cel.name,
    date: date || "", time: time || "", petName: petName || "", notes: notes || "",
    customDiy: customDiy || null, amount: cel.price, status: "upcoming",
    created_at: new Date().toISOString(),
  };
  mem.bookings.push(booking);
  persistBookings();
  res.json({ success: true, booking });
});

// ═══════════════════════════════════════════════════════
// AI CHATBOT (Simple preset + basic responses)
// ═══════════════════════════════════════════════════════

const CHATBOT_PRESETS = [
  { id: "p1", label: "🐕 Diet tips for my pet", response: "A balanced diet is key! Dogs need protein-rich food, while cats are obligate carnivores. Avoid chocolate, grapes, onions, and garlic. Consult your vet for a personalised meal plan. You can also check our Meal Planner feature!" },
  { id: "p2", label: "💉 Vaccination schedule", response: "Puppies: 6-8 weeks (Distemper, Parvo), 10-12 weeks (DHPP), 14-16 weeks (Rabies). Dogs: Annual boosters. Cats: FVRCP at 6-8 weeks, Rabies at 12 weeks. Always consult your vet! Book a vaccination through our app." },
  { id: "p3", label: "🚿 Grooming frequency", response: "Dogs: Bath every 4-6 weeks (more for active/outdoor dogs). Brush 2-3x/week. Cats: Usually self-grooming, but long-haired breeds need weekly brushing. Nail trims every 2-3 weeks for both!" },
  { id: "p4", label: "🏥 Signs of illness", response: "Watch for: loss of appetite, lethargy, vomiting/diarrhea, excessive thirst, difficulty breathing, limping, or behavioral changes. If symptoms persist >24hrs, book an emergency vet consultation immediately." },
  { id: "p5", label: "🎓 Basic training tips", response: "Start with sit, stay, come. Use positive reinforcement (treats + praise). Keep sessions short (5-10 min). Be consistent with commands. Socialise early. Patience is key! Our Training services can help too." },
  { id: "p6", label: "✈️ Travelling with pets", response: "Get a health certificate from your vet. Use proper carriers. Keep them hydrated. Bring familiar toys/blankets. Check airline/hotel pet policies. Never leave pets in parked cars!" },
];

app.get("/api/chatbot/presets", (_req, res) => res.json(CHATBOT_PRESETS));

app.post("/api/chatbot/message", authenticate, (req, res) => {
  const { presetId, message } = req.body;
  if (presetId) {
    const preset = CHATBOT_PRESETS.find(p => p.id === presetId);
    if (preset) return res.json({ response: preset.response });
  }
  // Simple keyword-based responses for now
  const lm = (message || "").toLowerCase();
  let response = "I'm your pet assistant! 🐾 I can help with diet tips, vaccination schedules, grooming advice, and more. Try tapping one of the quick options above!";
  if (lm.includes("food") || lm.includes("diet") || lm.includes("eat")) response = CHATBOT_PRESETS[0].response;
  else if (lm.includes("vaccin") || lm.includes("injection") || lm.includes("shot")) response = CHATBOT_PRESETS[1].response;
  else if (lm.includes("groom") || lm.includes("bath") || lm.includes("brush")) response = CHATBOT_PRESETS[2].response;
  else if (lm.includes("sick") || lm.includes("ill") || lm.includes("symptom")) response = CHATBOT_PRESETS[3].response;
  else if (lm.includes("train") || lm.includes("command") || lm.includes("behav")) response = CHATBOT_PRESETS[4].response;
  else if (lm.includes("travel") || lm.includes("flight") || lm.includes("trip")) response = CHATBOT_PRESETS[5].response;
  else if (lm.includes("hello") || lm.includes("hi") || lm.includes("hey")) response = `Hi ${req.user?.name || "there"}! 🐾 How can I help you with your pet today?`;
  res.json({ response });
});

// ═══════════════════════════════════════════════════════
// VENDOR EXTENDED ENDPOINTS
// ═══════════════════════════════════════════════════════

app.put("/api/vendor/bookings/:id/accept", authenticate, (req, res) => {
  if (req.user?.role !== "vendor") return res.status(403).json({ error: "Vendor only" });
  const bk = mem.bookings.find(b => b.id === req.params.id);
  if (!bk) return res.status(404).json({ error: "Booking not found" });
  bk.status = "confirmed";
  bk.vendorAccepted = true;
  persistBookings();
  res.json({ success: true, booking: bk });
});

app.put("/api/vendor/bookings/:id/decline", authenticate, (req, res) => {
  if (req.user?.role !== "vendor") return res.status(403).json({ error: "Vendor only" });
  const bk = mem.bookings.find(b => b.id === req.params.id);
  if (!bk) return res.status(404).json({ error: "Booking not found" });
  bk.status = "declined";
  persistBookings();
  res.json({ success: true, booking: bk });
});

app.put("/api/vendor/bookings/:id/complete", authenticate, (req, res) => {
  if (req.user?.role !== "vendor") return res.status(403).json({ error: "Vendor only" });
  const bk = mem.bookings.find(b => b.id === req.params.id);
  if (!bk) return res.status(404).json({ error: "Booking not found" });
  bk.status = "completed";
  persistBookings();
  res.json({ success: true, booking: bk });
});

app.get("/api/vendor/earnings", authenticate, (req, res) => {
  if (req.user?.role !== "vendor") return res.status(403).json({ error: "Vendor only" });
  const completed = mem.bookings.filter(b => b.status === "completed");
  const totalEarnings = completed.reduce((s, b) => s + (b.amount || 0) * 0.8, 0); // 80% to vendor
  const thisWeek = completed.filter(b => {
    const d = new Date(b.created_at);
    const now = new Date();
    return (now - d) < 7 * 24 * 60 * 60 * 1000;
  });
  const weekEarnings = thisWeek.reduce((s, b) => s + (b.amount || 0) * 0.8, 0);
  res.json({
    totalEarnings: Math.round(totalEarnings),
    weekEarnings: Math.round(weekEarnings),
    completedBookings: completed.length,
    pendingSettlement: Math.round(weekEarnings),
    history: completed.slice(-20).reverse().map(b => ({
      id: b.id, amount: Math.round((b.amount || 0) * 0.8), date: b.created_at,
      service: mem.services.find(s => s.id === b.serviceId)?.name || "Service",
    })),
  });
});

app.get("/api/vendor/profile", authenticate, (req, res) => {
  if (req.user?.role !== "vendor") return res.status(403).json({ error: "Vendor only" });
  // Find associated vendor record
  const vendorRecord = mem.vendors.find(v => v.userId === req.userId) || null;
  res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, phone: req.user.phone, city: req.user.city }, vendor: vendorRecord });
});

// ═══════════════════════════════════════════════════════
// ADMIN EXTENDED ENDPOINTS
// ═══════════════════════════════════════════════════════

// Admin: Recovery moderation
app.get("/api/admin/recovery", authenticate, (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const alerts = [...mem.recoveryAlerts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(alerts);
});

app.put("/api/admin/recovery/:id", authenticate, (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const alert = mem.recoveryAlerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: "Alert not found" });
  if (req.body.status) alert.status = req.body.status;
  if (req.body.featured !== undefined) alert.featured = req.body.featured;
  persistRecovery();
  res.json({ success: true, alert });
});

// Admin: Products CRUD
app.post("/api/admin/products", authenticate, (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const { name, category, price, mrp, description, image, stock } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });
  const prod = { id: genId("prod"), name, category: category || "General", price: price || 0, mrp: mrp || price || 0, rating: 0, reviews: 0, description: description || "", image: image || null, stock: stock || 0 };
  mem.products.push(prod);
  persistProducts();
  res.json({ success: true, product: prod });
});

app.put("/api/admin/products/:id", authenticate, (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const prod = mem.products.find(p => p.id === req.params.id);
  if (!prod) return res.status(404).json({ error: "Product not found" });
  const fields = ["name", "category", "price", "mrp", "description", "image", "stock"];
  fields.forEach(f => { if (req.body[f] !== undefined) prod[f] = req.body[f]; });
  persistProducts();
  res.json({ success: true, product: prod });
});

app.delete("/api/admin/products/:id", authenticate, (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const idx = mem.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Product not found" });
  mem.products.splice(idx, 1);
  persistProducts();
  res.json({ success: true });
});

// Admin: Celebrations CRUD
app.post("/api/admin/celebrations", authenticate, (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const { name, category, price, description, image } = req.body;
  const cel = { id: genId("cel"), name: name || "", category: category || "Special", price: price || 0, description: description || "", image: image || null };
  mem.celebrations.push(cel);
  persistCelebrations();
  res.json({ success: true, celebration: cel });
});

app.delete("/api/admin/celebrations/:id", authenticate, (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const idx = mem.celebrations.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  mem.celebrations.splice(idx, 1);
  persistCelebrations();
  res.json({ success: true });
});

// Admin: Emergency Vets CRUD
app.post("/api/admin/emergency-vets", authenticate, (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const { state, name, phone, type } = req.body;
  const vet = { id: genId("ev"), state: state || "", name: name || "", phone: phone || "", type: type || "shelter" };
  mem.emergencyVets.push(vet);
  persistEmergVets();
  res.json({ success: true, vet });
});

app.delete("/api/admin/emergency-vets/:id", authenticate, (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const idx = mem.emergencyVets.findIndex(v => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  mem.emergencyVets.splice(idx, 1);
  persistEmergVets();
  res.json({ success: true });
});

// ═══════════════════════════════════════════════════════
// HEALTH
// ═══════════════════════════════════════════════════════

app.get("/api/health", (_req, res) => {
  // Don't ping external mail API — just return local status instantly
  res.json({ status: "ok", db: db ? "connected" : "demo-mode", mail: MAIL_API_KEY ? "configured" : "not-configured" });
});

// ── Start ─────────────────────────────────────────────
await initDB();
app.listen(PORT, () => {
  console.log(`🚀 Servleash API on http://localhost:${PORT}`);
  console.log(`📧 Mail API: ${MAIL_API_URL}`);
});
