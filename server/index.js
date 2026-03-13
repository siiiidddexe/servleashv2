import express from "express";
import cors from "cors";
import crypto from "crypto";
import { Surreal } from "surrealdb";
import { readFileSync, existsSync, mkdirSync } from "fs";
import multer from "multer";
import { resolve, dirname } from "path";
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

const app = express();
const PORT = 3001;

const MAIL_API_URL = process.env.MAIL_API_URL || "https://nexomail.logiclaunch.in";
const MAIL_API_KEY = process.env.MAIL_API_KEY || "";

app.use(cors({ origin: "*" }));
app.use(express.json());

// Serve uploaded files
const UPLOAD_DIR = resolve(__dirname, "uploads");
mkdirSync(UPLOAD_DIR, { recursive: true });
app.use("/uploads", express.static(UPLOAD_DIR));

// Multer for uploads (simple disk storage)
const upload = multer({ dest: UPLOAD_DIR });

// ── SurrealDB ─────────────────────────────────────────
let db;

// Convert SurrealDB RecordId objects to plain strings
function normalizeId(id) {
  if (!id) return id;
  if (typeof id === "string") return id;
  if (typeof id === "object" && id !== null && "id" in id) return String(id.id);
  return String(id);
}
function normalizeRecord(r) {
  if (!r) return null;
  return { ...r, id: normalizeId(r.id) };
}
function normalizeRecords(arr) {
  return (arr || []).map(normalizeRecord);
}

// Wrapper: SurrealDB v3 throws when a table doesn't exist yet.
// For SELECT/DELETE we treat that as "no data"; for writes we auto-create the table and retry.
async function dbQuery(query, vars) {
  try {
    return await db.query(query, vars);
  } catch (err) {
    const isNotFound = err?.kind === "NotFound"
      || /does not exist/i.test(err?.message)
      || /not defined/i.test(err?.message)
      || /table .* not found/i.test(err?.message)
      || /unknown table/i.test(err?.message);
    if (isNotFound && /^\s*(SELECT|DELETE)/i.test(query)) return [[]];
    // Auto-create missing table for any write operation and retry
    if (isNotFound) {
      const tableName = err?.details?.details?.name
        || (vars?.tb ? String(vars.tb) : null);
      if (tableName) {
        await db.query(`DEFINE TABLE IF NOT EXISTS ${tableName} SCHEMALESS`);
        return await db.query(query, vars);
      }
    }
    throw err;
  }
}

// Create a record with a custom string ID
async function dbCreate(table, id, data) {
  const clean = { ...data };
  delete clean.id;
  const [records] = await dbQuery(
    `CREATE type::record($tb, $id) CONTENT $data RETURN *`,
    { tb: table, id: String(id), data: clean }
  );
  return normalizeRecord(records?.[0] ?? null);
}

// Get a single record by its string ID
async function dbGetById(table, id) {
  const [records] = await dbQuery(
    `SELECT * FROM type::record($tb, $id)`,
    { tb: table, id: String(id) }
  );
  return normalizeRecord(records?.[0] ?? null);
}

// Get all records from a table
async function dbAll(table) {
  const [records] = await dbQuery(`SELECT * FROM ${table}`);
  return normalizeRecords(records);
}

// Merge (partial update) — also creates if record doesn't exist
async function dbMerge(table, id, data) {
  const clean = { ...data };
  delete clean.id;
  await dbQuery(
    `UPSERT type::record($tb, $id) MERGE $data`,
    { tb: table, id: String(id), data: clean }
  );
}

// Full content replace (upsert)
async function dbPut(table, id, data) {
  const clean = { ...data };
  delete clean.id;
  await dbQuery(
    `UPSERT type::record($tb, $id) CONTENT $data`,
    { tb: table, id: String(id), data: clean }
  );
}

// Delete a single record by ID
async function dbDelete(table, id) {
  await dbQuery(`DELETE type::record($tb, $id)`, { tb: table, id: String(id) });
}

// Delete records matching a condition
async function dbDeleteWhere(table, where, vars = {}) {
  await dbQuery(`DELETE FROM ${table} WHERE ${where}`, vars);
}

// ── Seed default data on first run ────────────────────
const DEFAULT_SERVICES = [
  { id: "svc_1", name: "Full Grooming", category: "Grooming", price: 799, homePrice: 999, duration: "60 min", rating: 4.8, reviews: 342, description: "Complete bath, haircut, nail trim, ear cleaning and blow dry for your pet.", image: null, serviceMode: "both" },
  { id: "svc_2", name: "Basic Bath & Dry", category: "Grooming", price: 449, homePrice: 599, duration: "30 min", rating: 4.6, reviews: 218, description: "Quick bath with premium shampoo and thorough blow dry.", image: null, serviceMode: "both" },
  { id: "svc_3", name: "Vet Consultation", category: "Vet Visit", price: 599, homePrice: 799, duration: "30 min", rating: 4.9, reviews: 567, description: "General health check-up with an experienced veterinarian.", image: null, serviceMode: "both" },
  { id: "svc_4", name: "Vaccination", category: "Vet Visit", price: 999, homePrice: 1199, duration: "20 min", rating: 4.7, reviews: 189, description: "Core vaccinations for dogs and cats as per schedule.", image: null, serviceMode: "both" },
  { id: "svc_5", name: "Overnight Boarding", category: "Boarding", price: 1299, homePrice: null, duration: "24 hrs", rating: 4.5, reviews: 156, description: "Safe overnight stay with meals, play time and webcam access.", image: null, serviceMode: "in_store" },
  { id: "svc_6", name: "Dog Walking", category: "Training", price: 299, homePrice: 299, duration: "45 min", rating: 4.4, reviews: 98, description: "Professional dog walking session in your neighbourhood.", image: null, serviceMode: "home_delivery" },
  { id: "svc_7", name: "Premium Meal Plan", category: "Meals", price: 1499, homePrice: 1499, duration: "Monthly", rating: 4.7, reviews: 75, description: "Customised fresh meal plan delivered daily for your pet.", image: null, serviceMode: "home_delivery" },
  { id: "svc_8", name: "Obedience Training", category: "Training", price: 1999, homePrice: 2499, duration: "5 sessions", rating: 4.8, reviews: 134, description: "Basic obedience commands, leash manners, and socialisation.", image: null, serviceMode: "both" },
  { id: "svc_9", name: "Video Vet Consultation", category: "Video Consult", price: 399, homePrice: null, duration: "20 min", rating: 4.8, reviews: 89, description: "Online vet consultation via Google Meet link.", image: null, serviceMode: "home_delivery" },
];

const DEFAULT_VENDORS = [
  { id: "ven_1", name: "Happy Paws Salon", category: "Grooming", rating: 4.8, reviews: 420, distance: "1.2 km", address: "123 Park Street, Koramangala", city: "Bangalore", phone: "+91 98765 43210", image: null, services: ["svc_1", "svc_2"], gallery: [], approved: true },
  { id: "ven_2", name: "PetCare Vet Clinic", category: "Vet Visit", rating: 4.9, reviews: 680, distance: "2.5 km", address: "45 MG Road", city: "Bangalore", phone: "+91 98765 43211", image: null, services: ["svc_3", "svc_4", "svc_9"], gallery: [], approved: true },
  { id: "ven_3", name: "Pawsome Stays", category: "Boarding", rating: 4.6, reviews: 210, distance: "3.8 km", address: "78 Indiranagar", city: "Bangalore", phone: "+91 98765 43212", image: null, services: ["svc_5"], gallery: [], approved: true },
  { id: "ven_4", name: "WoofWalkers", category: "Training", rating: 4.5, reviews: 145, distance: "0.8 km", address: "12 HSR Layout", city: "Bangalore", phone: "+91 98765 43213", image: null, services: ["svc_6", "svc_8"], gallery: [], approved: true },
  { id: "ven_5", name: "FreshBowl Pets", category: "Meals", rating: 4.7, reviews: 95, distance: "4.1 km", address: "56 Whitefield", city: "Bangalore", phone: "+91 98765 43214", image: null, services: ["svc_7"], gallery: [], approved: true },
];

const DEFAULT_PRODUCTS = [
  { id: "prod_1", name: "Royal Canin Adult", category: "Food", price: 1299, mrp: 1499, rating: 4.7, reviews: 234, description: "Premium dry food for adult dogs, 3kg pack.", image: null, stock: 50 },
  { id: "prod_2", name: "Squeaky Bone Toy", category: "Toys", price: 349, mrp: 499, rating: 4.5, reviews: 178, description: "Durable rubber squeaky bone toy for dogs.", image: null, stock: 30 },
  { id: "prod_3", name: "Chicken Jerky Treats", category: "Treats", price: 249, mrp: 299, rating: 4.8, reviews: 312, description: "Real chicken jerky strips, 200g pack.", image: null, stock: 100 },
  { id: "prod_4", name: "Anti-Tick Shampoo", category: "Hygiene", price: 399, mrp: 499, rating: 4.6, reviews: 145, description: "Medicated anti-tick and flea shampoo, 500ml.", image: null, stock: 45 },
  { id: "prod_5", name: "Leather Collar", category: "Accessories", price: 599, mrp: 799, rating: 4.4, reviews: 89, description: "Premium genuine leather collar with brass buckle.", image: null, stock: 20 },
  { id: "prod_6", name: "Pedigree Puppy", category: "Food", price: 899, mrp: 999, rating: 4.6, reviews: 198, description: "Complete nutrition for puppies, 1.5kg pack.", image: null, stock: 60 },
  { id: "prod_7", name: "Rope Tug Toy", category: "Toys", price: 199, mrp: 299, rating: 4.3, reviews: 156, description: "Cotton rope tug toy for interactive play.", image: null, stock: 80 },
  { id: "prod_8", name: "Dental Chew Sticks", category: "Treats", price: 329, mrp: 399, rating: 4.7, reviews: 267, description: "Cleans teeth and freshens breath, 10 sticks.", image: null, stock: 75 },
];

const DEFAULT_BREEDERS = [
  { id: "pet_1", name: "Kaiman Redfox", breed: "Welsh Corgi", species: "Dog", gender: "Male", weight: "16.2 kg", age: "4 years", color: "Tri-color", description: "Friendly and playful! Loves belly rubs and chasing squirrels in the park.", location: "Koramangala, Bangalore", owner: { name: "Rahul Sharma" }, available: true, breederPrice: 35000, image: null },
  { id: "pet_2", name: "Luna", breed: "Persian Cat", species: "Cat", gender: "Female", weight: "4.5 kg", age: "2 years", color: "White", description: "Calm and elegant. Loves napping in sunbeams.", location: "Indiranagar, Bangalore", owner: { name: "Priya Patel" }, available: true, breederPrice: 25000, image: null },
  { id: "pet_3", name: "Buddy", breed: "Golden Retriever", species: "Dog", gender: "Male", weight: "30 kg", age: "5 years", color: "Golden", description: "The ultimate good boy. Loves swimming and fetch.", location: "HSR Layout, Bangalore", owner: { name: "Arjun Reddy" }, available: true, breederPrice: 45000, image: null },
  { id: "pet_4", name: "Cleo", breed: "Beagle", species: "Dog", gender: "Female", weight: "11 kg", age: "3 years", color: "Tri-color", description: "Energetic explorer. Loves treats and car rides.", location: "Whitefield, Bangalore", owner: { name: "Sneha Iyer" }, available: false, breederPrice: 28000, image: null },
  { id: "pet_5", name: "Milo", breed: "Indie Cat", species: "Cat", gender: "Male", weight: "5.2 kg", age: "1 year", color: "Orange Tabby", description: "Rescued street cat turned cuddly housecat.", location: "JP Nagar, Bangalore", owner: { name: "Karthik N" }, available: true, breederPrice: 5000, image: null },
];

const DEFAULT_EMERGENCY_VETS = [
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
];

const DEFAULT_CELEBRATIONS = [
  { id: "cel_1", name: "Pawsome Birthday Bash", category: "Birthday", price: 4999, description: "Complete birthday party setup with cake, decorations, and a photoshoot for your pet!", image: null },
  { id: "cel_2", name: "Gotcha Day Special", category: "Gotcha Day", price: 2999, description: "Celebrate the day your pet joined your family with a special party.", image: null },
  { id: "cel_3", name: "Puppy Shower", category: "Special", price: 3499, description: "Welcome a new puppy home with a themed shower party.", image: null },
  { id: "cel_4", name: "Custom DIY Party", category: "DIY", price: 1999, description: "Tell us your vision and we'll bring it to life. Fully customizable.", image: null },
];

async function seedDefaults() {
  const tables = [
    { name: "services", data: DEFAULT_SERVICES },
    { name: "vendors", data: DEFAULT_VENDORS },
    { name: "products", data: DEFAULT_PRODUCTS },
    { name: "breeders", data: DEFAULT_BREEDERS },
    { name: "emergency_vets", data: DEFAULT_EMERGENCY_VETS },
    { name: "celebrations", data: DEFAULT_CELEBRATIONS },
  ];
  for (const { name, data } of tables) {
    let count = 0;
    try {
      const [existing] = await dbQuery(`SELECT count() AS c FROM ${name} GROUP ALL`);
      count = existing?.[0]?.c ?? 0;
    } catch { /* table doesn't exist yet */ }
    if (!count) {
      for (const item of data) await dbCreate(name, item.id, item);
      console.log(`  ✅ Seeded ${name} (${data.length} records)`);
    }
  }
}

async function initDB() {
  db = new Surreal();
  const surrealUrl = process.env.SURREALDB_URL || "ws://127.0.0.1:8000";
  const surrealUser = process.env.SURREALDB_USER || "root";
  const surrealPass = process.env.SURREALDB_PASS || "root";
  await db.connect(surrealUrl);
  await db.signin({ username: surrealUser, password: surrealPass });
  await db.use({ namespace: "servleash", database: "servleash" });
  console.log("✅ Connected to SurrealDB");
  await seedDefaults();
}

// ── Transient in-memory stores (not persisted) ────────
const otps = new Map();          // `${role}:${email}` -> { code, expires }
const resetTokens = new Map();   // token -> { email, role, expires }

// ── Vendor SSE (simple) ──────────────────────────────
const vendorStreams = new Map(); // vendorId -> Set<res>
function notifyVendor(vendorId, payload) {
  const set = vendorStreams.get(vendorId);
  if (!set) return;
  const data = JSON.stringify(payload);
  for (const res of set) {
    try { res.write(`event: message\ndata: ${data}\n\n`); } catch { /* ignore */ }
  }
}

// ── Customer SSE ────────────────────────────────
const customerStreams = new Map(); // userId → Set<res>
function notifyCustomer(userId, payload) {
  const set = customerStreams.get(userId);
  if (!set) return;
  const data = JSON.stringify(payload);
  for (const res of set) {
    try { res.write(`event: message\ndata: ${data}\n\n`); } catch { /* ignore */ }
  }
}

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

// ── Auth middleware ────────────────────────────────────
async function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "Not authenticated" });
  const token = auth.replace("Bearer ", "");
  try {
    const session = await dbGetById("sessions", token);
    if (!session) return res.status(401).json({ error: "Session expired" });
    const user = await dbGetById("users", session.userId);
    if (!user) return res.status(401).json({ error: "Session expired" });
    req.userId = session.userId;
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Session expired" });
  }
}

// ═══════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════

// ── Register (email + password + name) → sends OTP ────
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name, phone, city, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password required" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
    const r = role || "customer";

    const [existingArr] = await dbQuery(
      `SELECT * FROM users WHERE email = $email AND role = $role LIMIT 1`,
      { email, role: r }
    );
    const existing = normalizeRecord(existingArr?.[0] ?? null);

    if (existing && existing.password) return res.status(409).json({ error: "Account already exists. Please login." });

    if (existing && !existing.password) {
      // User exists via old OTP-only flow — set password now
      await dbMerge("users", existing.id, {
        password: hashPassword(password),
        ...(name ? { name } : {}),
        ...(phone ? { phone } : {}),
        ...(city ? { city } : {}),
      });
    } else {
      const user = {
        id: genId("user"), email, role: r,
        name: name || "User", phone: phone || null, city: city || null,
        avatar: null, password: hashPassword(password), verified: false,
        created_at: new Date().toISOString(),
      };
      await dbCreate("users", user.id, user);
    }

    const code = genOtp();
    otps.set(`${r}:${email}`, { code, expires: new Date(Date.now() + 10 * 60 * 1000) });
    const sent = await sendOtpEmail(email, code);
    res.json({ success: true, message: "Account created. Verify your email.", emailSent: sent,
      ...((!sent && process.env.NODE_ENV !== "production") ? { devCode: code } : {}),
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// ── Login (email + password) → sends OTP ──────────────
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    const [arr] = await dbQuery(
      `SELECT * FROM users WHERE email = $email LIMIT 1`,
      { email }
    );
    const user = normalizeRecord(arr?.[0] ?? null);
    if (!user) return res.status(401).json({ error: "Account not found. Please register first." });

    if (!user.password) {
      await dbMerge("users", user.id, { password: hashPassword(password) });
    } else if (!verifyPassword(password, user.password)) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const code = genOtp();
    otps.set(`${user.role}:${email}`, { code, expires: new Date(Date.now() + 10 * 60 * 1000) });
    const sent = await sendOtpEmail(email, code);
    res.json({ success: true, message: "Password verified. OTP sent.", role: user.role, emailSent: sent,
      ...((!sent && process.env.NODE_ENV !== "production") ? { devCode: code } : {}),
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// ── Legacy: request-otp ────────────────────────────────
app.post("/api/auth/request-otp", async (req, res) => {
  const { email, role } = req.body;
  if (!email || !role) return res.status(400).json({ error: "email and role required" });

  const code = genOtp();
  otps.set(`${role}:${email}`, { code, expires: new Date(Date.now() + 10 * 60 * 1000) });

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

  const memOtp = otps.get(`${role}:${email}`);
  if (!memOtp || memOtp.code !== code || memOtp.expires < new Date()) {
    return res.status(401).json({ error: "Invalid or expired verification code" });
  }
  otps.delete(`${role}:${email}`);

  const [arr] = await dbQuery(
    `SELECT * FROM users WHERE email = $email AND role = $role LIMIT 1`,
    { email, role }
  );
  let user = normalizeRecord(arr?.[0] ?? null);

  if (!user) {
    const newUser = {
      id: genId("user"), email, role,
      name: name || (role === "admin" ? "Admin" : role === "vendor" ? "Vendor" : "User"),
      phone: phone || null, city: city || null,
      avatar: null, verified: true, created_at: new Date().toISOString(),
    };
    user = await dbCreate("users", newUser.id, newUser);
  } else {
    const updates = { verified: true };
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (city) updates.city = city;
    await dbMerge("users", user.id, updates);
    user = { ...user, ...updates };
  }

  const token = genToken();
  await dbCreate("sessions", token, { userId: String(user.id) });

  res.json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, city: user.city },
    token,
  });
});

app.post("/api/auth/logout", authenticate, async (req, res) => {
  const token = req.headers.authorization.replace("Bearer ", "");
  await dbDelete("sessions", token);
  res.json({ success: true });
});

// ── Resend OTP ───────────────────────────────────────
app.post("/api/auth/resend-otp", async (req, res) => {
  const { email, role } = req.body;
  if (!email || !role) return res.status(400).json({ error: "email and role required" });
  const code = genOtp();
  otps.set(`${role}:${email}`, { code, expires: new Date(Date.now() + 10 * 60 * 1000) });
  const sent = await sendOtpEmail(email, code);
  res.json({ success: true, emailSent: sent });
});

// ── Request password reset ────────────────────────────
app.post("/api/auth/request-password-reset", async (req, res) => {
  const { email, role = "customer", appUrl } = req.body;
  if (!email) return res.status(400).json({ error: "email required" });

  const [arr] = await dbQuery(
    `SELECT * FROM users WHERE email = $email AND role = $role LIMIT 1`,
    { email, role }
  );
  const user = normalizeRecord(arr?.[0] ?? null);
  if (!user) return res.json({ success: true, message: "If that email is registered, a reset link has been sent." });

  const token = "rst_" + crypto.randomBytes(32).toString("hex");
  resetTokens.set(token, { email, role, expires: new Date(Date.now() + 60 * 60 * 1000) });

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

// ── Verify reset token ────────────────────────────────
app.get("/api/auth/reset-password", (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: "token required" });
  const record = resetTokens.get(token);
  if (!record || record.expires < new Date()) {
    return res.status(400).json({ error: "Reset link has expired or is invalid. Please request a new one." });
  }
  res.json({ valid: true, email: record.email, role: record.role });
});

// ── Complete password reset ───────────────────────────
app.post("/api/auth/reset-password", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "token required" });
  const record = resetTokens.get(token);
  if (!record || record.expires < new Date()) {
    return res.status(400).json({ error: "Reset link has expired or is invalid. Please request a new one." });
  }
  resetTokens.delete(token);

  const [arr] = await dbQuery(
    `SELECT * FROM users WHERE email = $email AND role = $role LIMIT 1`,
    { email: record.email, role: record.role }
  );
  const user = normalizeRecord(arr?.[0] ?? null);

  if (user) {
    // Invalidate all sessions for this user
    await dbDeleteWhere("sessions", "userId = $uid", { uid: String(user.id) });
  }

  const code = genOtp();
  otps.set(`${record.role}:${record.email}`, { code, expires: new Date(Date.now() + 10 * 60 * 1000) });
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

app.get("/api/auth/me", authenticate, (req, res) => {
  const u = req.user;
  if (!u) return res.status(404).json({ error: "User not found" });
  res.json({ user: { id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, city: u.city } });
});

app.get("/api/user/profile", authenticate, async (req, res) => {
  const u = req.user;
  if (!u) return res.status(404).json({ error: "User not found" });

  const [bkArr] = await dbQuery(`SELECT count() AS c FROM bookings WHERE userId = $uid GROUP ALL`, { uid: u.id });
  const [svArr] = await dbQuery(`SELECT count() AS c FROM saved_items WHERE userId = $uid GROUP ALL`, { uid: u.id });
  const bookingCount = bkArr?.[0]?.c || 0;
  const savedCount = svArr?.[0]?.c || 0;

  const wallet = await dbGetById("coins", u.id);

  res.json({
    id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, city: u.city,
    stats: { bookings: bookingCount, saved: savedCount, coins: wallet?.balance || 0 },
  });
});

app.put("/api/user/profile", authenticate, async (req, res) => {
  const u = req.user;
  if (!u) return res.status(404).json({ error: "User not found" });
  const { name, phone, city } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (city !== undefined) updates.city = city;
  await dbMerge("users", u.id, updates);
  const updated = { ...u, ...updates };
  res.json({ success: true, user: { id: updated.id, name: updated.name, email: updated.email, phone: updated.phone, role: updated.role, city: updated.city } });
});

// ═══════════════════════════════════════════════════════
// SERVICES
// ═══════════════════════════════════════════════════════

app.get("/api/services", async (_req, res) => {
  const { category, q } = _req.query;
  let list = await dbAll("services");
  if (category && category !== "All") list = list.filter(s => s.category === category);
  if (q) list = list.filter(s => s.name.toLowerCase().includes(q.toLowerCase()));
  res.json(list);
});

app.get("/api/services/:id", async (req, res) => {
  const svc = await dbGetById("services", req.params.id);
  if (!svc) return res.status(404).json({ error: "Service not found" });
  const vendors = await dbAll("vendors");
  const vendor = vendors.find(v => (v.services || []).includes(svc.id));
  res.json({ ...svc, vendor: vendor || null });
});

// ═══════════════════════════════════════════════════════
// VENDORS
// ═══════════════════════════════════════════════════════

app.get("/api/vendors", async (_req, res) => {
  const { category, q } = _req.query;
  const allServices = await dbAll("services");
  const svcMap = Object.fromEntries(allServices.map(s => [s.id, s]));
  let list = (await dbAll("vendors")).map(v => ({
    ...v,
    serviceDetails: (v.services || []).map(sid => svcMap[sid]).filter(Boolean),
  }));
  if (category && category !== "All") list = list.filter(v => v.category === category);
  if (q) list = list.filter(v => v.name.toLowerCase().includes(q.toLowerCase()));
  res.json(list);
});

app.get("/api/vendors/:id", async (req, res) => {
  const v = await dbGetById("vendors", req.params.id);
  if (!v) return res.status(404).json({ error: "Vendor not found" });
  const allServices = await dbAll("services");
  const svcMap = Object.fromEntries(allServices.map(s => [s.id, s]));
  const serviceDetails = (v.services || []).map(sid => svcMap[sid]).filter(Boolean);
  res.json({ ...v, serviceDetails });
});

// ═══════════════════════════════════════════════════════
// PRODUCTS (SHOP)
// ═══════════════════════════════════════════════════════

app.get("/api/products", async (_req, res) => {
  const { category, q } = _req.query;
  let list = await dbAll("products");
  if (category && category !== "All") list = list.filter(p => p.category === category);
  if (q) list = list.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
  res.json(list);
});

app.get("/api/products/:id", async (req, res) => {
  const p = await dbGetById("products", req.params.id);
  if (!p) return res.status(404).json({ error: "Product not found" });
  res.json(p);
});

// ═══════════════════════════════════════════════════════
// PETS (Breeder gallery)
// ═══════════════════════════════════════════════════════

app.get("/api/pets", async (_req, res) => {
  const { species, q } = _req.query;
  let list = await dbAll("breeders");
  if (species) list = list.filter(p => p.species.toLowerCase() === species.toLowerCase());
  if (q) list = list.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
  res.json(list);
});

app.get("/api/pets/:id", async (req, res) => {
  const pet = await dbGetById("breeders", req.params.id);
  if (!pet) return res.status(404).json({ error: "Pet not found" });
  res.json(pet);
});

// ═══════════════════════════════════════════════════════
// USER PET MANAGEMENT (My Pets)
// ═══════════════════════════════════════════════════════

app.get("/api/my-pets", authenticate, async (req, res) => {
  const [records] = await dbQuery(`SELECT * FROM user_pets WHERE userId = $uid`, { uid: req.userId });
  res.json(normalizeRecords(records));
});

app.get("/api/my-pets/:id", authenticate, async (req, res) => {
  const pet = await dbGetById("user_pets", req.params.id);
  if (!pet || pet.userId !== req.userId) return res.status(404).json({ error: "Pet not found" });
  res.json(pet);
});

app.post("/api/my-pets", authenticate, async (req, res) => {
  const { name, species, breed, age, weight, color, gender, image } = req.body;
  if (!name || !species) return res.status(400).json({ error: "name and species required" });
  const pet = {
    id: genId("mypet"), userId: req.userId, name, species, breed: breed || "",
    age: age || "", weight: weight || "", color: color || "", gender: gender || "",
    image: image || null, documents: [], qrEnabled: false, lostMode: false,
    qrToggles: { name: true, photo: true, breed: true, age: true, medicalRecords: false, ownerPhone: false, ownerName: false },
    created_at: new Date().toISOString(),
  };
  const created = await dbCreate("user_pets", pet.id, pet);
  res.json({ success: true, pet: created });
});

app.put("/api/my-pets/:id", authenticate, async (req, res) => {
  const pet = await dbGetById("user_pets", req.params.id);
  if (!pet || pet.userId !== req.userId) return res.status(404).json({ error: "Pet not found" });
  const fields = ["name", "species", "breed", "age", "weight", "color", "gender", "image", "qrEnabled", "lostMode", "qrToggles"];
  const updates = {};
  fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  await dbMerge("user_pets", pet.id, updates);
  res.json({ success: true, pet: { ...pet, ...updates } });
});

app.delete("/api/my-pets/:id", authenticate, async (req, res) => {
  const pet = await dbGetById("user_pets", req.params.id);
  if (!pet || pet.userId !== req.userId) return res.status(404).json({ error: "Pet not found" });
  await dbDelete("user_pets", pet.id);
  res.json({ success: true });
});

// Pet documents
app.post("/api/my-pets/:id/documents", authenticate, upload.single("file"), async (req, res) => {
  const pet = await dbGetById("user_pets", req.params.id);
  if (!pet || pet.userId !== req.userId) return res.status(404).json({ error: "Pet not found" });
  if ((pet.documents || []).length >= 10) return res.status(400).json({ error: "Maximum 10 documents per pet" });
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const doc = {
    id: genId("doc"), name: req.body.docName || req.file.originalname,
    type: req.body.docType || "other", url: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname, uploaded_at: new Date().toISOString(),
  };
  const docs = [...(pet.documents || []), doc];
  await dbMerge("user_pets", pet.id, { documents: docs });
  res.json({ success: true, document: doc });
});

app.delete("/api/my-pets/:petId/documents/:docId", authenticate, async (req, res) => {
  const pet = await dbGetById("user_pets", req.params.petId);
  if (!pet || pet.userId !== req.userId) return res.status(404).json({ error: "Pet not found" });
  const docs = (pet.documents || []).filter(d => d.id !== req.params.docId);
  if (docs.length === (pet.documents || []).length) return res.status(404).json({ error: "Document not found" });
  await dbMerge("user_pets", pet.id, { documents: docs });
  res.json({ success: true });
});

// Public QR pet profile
app.get("/api/pet-qr/:id", async (req, res) => {
  const pet = await dbGetById("user_pets", req.params.id);
  if (!pet || !pet.qrEnabled) return res.status(404).json({ error: "QR profile not available" });
  const user = await dbGetById("users", pet.userId);
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

app.get("/api/bookings", authenticate, async (req, res) => {
  const { status } = req.query;
  const [records] = await dbQuery(`SELECT * FROM bookings WHERE userId = $uid ORDER BY created_at DESC`, { uid: req.userId });
  let list = normalizeRecords(records);
  if (status) list = list.filter(b => b.status === status);
  const allServices = await dbAll("services");
  const allVendors = await dbAll("vendors");
  const svcMap = Object.fromEntries(allServices.map(s => [s.id, s]));
  const venMap = Object.fromEntries(allVendors.map(v => [v.id, v]));
  list = list.map(b => ({ ...b, service: svcMap[b.serviceId] || null, vendor: venMap[b.vendorId] || null }));
  res.json(list);
});

app.post("/api/bookings", authenticate, async (req, res) => {
  const { serviceId, vendorId, date, time, petName, notes, mode, paymentMethod, paymentId } = req.body;
  if (!serviceId || !date || !time) {
    return res.status(400).json({ error: "serviceId, date, and time are required" });
  }
  const svc = await dbGetById("services", serviceId);
  if (!svc) return res.status(404).json({ error: "Service not found" });
  const ven = vendorId ? await dbGetById("vendors", vendorId) : null;

  // If vendorId provided → status is 'upcoming' (pre-assigned)
  // If no vendorId → status is 'pending' (Rapido model: any vendor can accept)
  const status = vendorId ? "upcoming" : "pending";
  const price = mode === "home_delivery" && svc.homePrice ? svc.homePrice : svc.price;

  const booking = {
    id: genId("bk"), userId: req.userId, serviceId, vendorId: vendorId || null,
    date, time, petName: petName || null, notes: notes || null,
    mode: mode || "in_store", paymentMethod: paymentMethod || null, paymentId: paymentId || null,
    status, amount: price, serviceName: svc.name, serviceCategory: svc.category,
    created_at: new Date().toISOString(),
  };
  await dbCreate("bookings", booking.id, booking);
  if (vendorId) {
    try { notifyVendor(vendorId, { type: "new_booking", booking }); } catch { /* ignore */ }
  }
  res.json({ success: true, booking: { ...booking, service: svc, vendor: ven } });
});

app.put("/api/bookings/:id/cancel", authenticate, async (req, res) => {
  const bk = await dbGetById("bookings", req.params.id);
  if (!bk || bk.userId !== req.userId) return res.status(404).json({ error: "Booking not found" });
  if (bk.status !== "upcoming" && bk.status !== "pending") return res.status(400).json({ error: "Only upcoming/pending bookings can be cancelled" });
  if (bk.date && bk.time) {
    const apptTime = new Date(`${bk.date}T${bk.time}`);
    const now = new Date();
    const hoursUntil = (apptTime - now) / (1000 * 60 * 60);
    if (hoursUntil < 2) return res.status(400).json({ error: "Cannot cancel within 2 hours of appointment" });
    const bookedAt = new Date(bk.created_at);
    const hoursBookedBefore = (apptTime - bookedAt) / (1000 * 60 * 60);
    if (hoursBookedBefore < 5) return res.status(400).json({ error: "Bookings made less than 5 hours before the appointment cannot be cancelled" });
  }
  await dbMerge("bookings", bk.id, { status: "cancelled" });
  res.json({ success: true, booking: { ...bk, status: "cancelled" } });
});

app.put("/api/bookings/:id/complete", authenticate, async (req, res) => {
  const bk = await dbGetById("bookings", req.params.id);
  if (!bk) return res.status(404).json({ error: "Booking not found" });
  await dbMerge("bookings", bk.id, { status: "completed" });
  res.json({ success: true, booking: { ...bk, status: "completed" } });
});

// ═══════════════════════════════════════════════════════
// SAVED / FAVOURITES
// ═══════════════════════════════════════════════════════

app.get("/api/saved", authenticate, async (req, res) => {
  const [records] = await dbQuery(`SELECT * FROM saved_items WHERE userId = $uid`, { uid: req.userId });
  const userSaved = normalizeRecords(records);
  const [allVendors, allServices, allPets, allProducts] = await Promise.all([
    dbAll("vendors"), dbAll("services"), dbAll("breeders"), dbAll("products"),
  ]);
  const maps = {
    vendor: Object.fromEntries(allVendors.map(v => [v.id, v])),
    service: Object.fromEntries(allServices.map(s => [s.id, s])),
    pet: Object.fromEntries(allPets.map(p => [p.id, p])),
    product: Object.fromEntries(allProducts.map(p => [p.id, p])),
  };
  const enriched = userSaved.map(s => ({ ...s, item: maps[s.type]?.[s.itemId] || null }));
  res.json(enriched);
});

app.post("/api/saved", authenticate, async (req, res) => {
  const { itemId, type } = req.body;
  if (!itemId || !type) return res.status(400).json({ error: "itemId and type required" });
  const [existing] = await dbQuery(
    `SELECT * FROM saved_items WHERE userId = $uid AND itemId = $iid AND type = $type LIMIT 1`,
    { uid: req.userId, iid: itemId, type }
  );
  if (existing?.[0]) return res.json({ success: true, saved: true, message: "Already saved" });
  await dbCreate("saved_items", genId("sv"), { userId: req.userId, itemId, type, created_at: new Date().toISOString() });
  res.json({ success: true, saved: true });
});

app.delete("/api/saved/:itemId", authenticate, async (req, res) => {
  const { type } = req.query;
  let where = `userId = $uid AND itemId = $iid`;
  const vars = { uid: req.userId, iid: req.params.itemId };
  if (type) { where += ` AND type = $type`; vars.type = type; }
  await dbQuery(`DELETE FROM saved_items WHERE ${where}`, vars);
  res.json({ success: true, saved: false });
});

app.get("/api/saved/check/:itemId", authenticate, async (req, res) => {
  const { type } = req.query;
  let sql = `SELECT count() AS c FROM saved_items WHERE userId = $uid AND itemId = $iid`;
  const vars = { uid: req.userId, iid: req.params.itemId };
  if (type) { sql += ` AND type = $type`; vars.type = type; }
  sql += ` GROUP ALL`;
  const [arr] = await dbQuery(sql, vars);
  res.json({ saved: (arr?.[0]?.c || 0) > 0 });
});

// ═══════════════════════════════════════════════════════
// ADMIN STATS
// ═══════════════════════════════════════════════════════

app.get("/api/admin/stats", authenticate, async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });

  const allUsers = await dbAll("users");
  const allBookings = await dbAll("bookings");
  const allVendors = await dbAll("vendors");
  const allServices = await dbAll("services");

  const customers = allUsers.filter(u => u.role === "customer").length;
  const vendors = allUsers.filter(u => u.role === "vendor").length;
  const totalBookings = allBookings.length;
  const revenue = allBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
  const recentUsers = allUsers.slice(-5).reverse().map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, created_at: u.created_at }));
  const recentBookings = allBookings.slice(-5).reverse().map(b => ({
    ...b,
    service: allServices.find(s => s.id === b.serviceId),
    userName: allUsers.find(u => u.id === b.userId)?.name || "Unknown",
  }));
  res.json({ customers, vendors, totalBookings, revenue, activeVendors: allVendors.length, recentUsers, recentBookings });
});

app.get("/api/admin/users", authenticate, async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const { role } = req.query;
  let users = (await dbAll("users")).map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, city: u.city, created_at: u.created_at }));
  if (role) users = users.filter(u => u.role === role);
  res.json(users);
});

// ── Admin: upload icons/files ───────────────────────
app.post("/api/admin/upload", authenticate, upload.single("file"), (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const filePath = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: filePath, filename: req.file.originalname });
});

// ── Admin: Services CRUD ───────────────────────────
app.post("/api/admin/services", authenticate, async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const { name, category, price, duration, description, image, serviceMode } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });
  const svc = { id: genId("svc"), name, category: category || "General", price: price || 0, duration: duration || null, rating: 0, reviews: 0, description: description || "", image: image || null, serviceMode: serviceMode || "both" };
  const created = await dbCreate("services", svc.id, svc);
  res.json({ success: true, service: created });
});

app.put("/api/admin/services/:id", authenticate, async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const svc = await dbGetById("services", req.params.id);
  if (!svc) return res.status(404).json({ error: "Service not found" });
  const { name, category, price, duration, description, image, serviceMode } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (category !== undefined) updates.category = category;
  if (price !== undefined) updates.price = price;
  if (duration !== undefined) updates.duration = duration;
  if (description !== undefined) updates.description = description;
  if (image !== undefined) updates.image = image;
  if (serviceMode !== undefined) updates.serviceMode = serviceMode;
  await dbMerge("services", svc.id, updates);
  res.json({ success: true, service: { ...svc, ...updates } });
});

app.delete("/api/admin/services/:id", authenticate, async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const svc = await dbGetById("services", req.params.id);
  if (!svc) return res.status(404).json({ error: "Service not found" });
  await dbDelete("services", req.params.id);
  // Remove service references from vendors
  const allVendors = await dbAll("vendors");
  for (const v of allVendors) {
    if ((v.services || []).includes(req.params.id)) {
      await dbMerge("vendors", v.id, { services: v.services.filter(sid => sid !== req.params.id) });
    }
  }
  res.json({ success: true });
});

// ── Admin: Vendors CRUD ────────────────────────────
app.post("/api/admin/vendors", authenticate, async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const { name, category, address, city, phone, services: svcList, image } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });
  const v = { id: genId("ven"), name, category: category || "General", rating: 0, reviews: 0, distance: "0 km", address: address || "", city: city || "", phone: phone || "", image: image || null, services: Array.isArray(svcList) ? svcList : [] };
  const created = await dbCreate("vendors", v.id, v);
  res.json({ success: true, vendor: created });
});

app.put("/api/admin/vendors/:id", authenticate, async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const v = await dbGetById("vendors", req.params.id);
  if (!v) return res.status(404).json({ error: "Vendor not found" });
  const { name, category, address, city, phone, services: svcList, image } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (category !== undefined) updates.category = category;
  if (address !== undefined) updates.address = address;
  if (city !== undefined) updates.city = city;
  if (phone !== undefined) updates.phone = phone;
  if (svcList !== undefined) updates.services = Array.isArray(svcList) ? svcList : v.services;
  if (image !== undefined) updates.image = image;
  await dbMerge("vendors", v.id, updates);
  res.json({ success: true, vendor: { ...v, ...updates } });
});

app.delete("/api/admin/vendors/:id", authenticate, async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const v = await dbGetById("vendors", req.params.id);
  if (!v) return res.status(404).json({ error: "Vendor not found" });
  await dbDelete("vendors", req.params.id);
  res.json({ success: true });
});

// ── Admin: Promo Media ──────────────────────────────
app.get("/api/promo", async (_req, res) => {
  res.json(await dbAll("promo"));
});

app.post("/api/admin/promo", authenticate, async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const { url, type, title, subtitle, slot, link } = req.body;
  if (!url) return res.status(400).json({ error: "url required" });
  const item = {
    id: genId("promo"), url,
    type: type || "image",
    title: title || "",
    subtitle: subtitle || "",
    slot: slot || "banner",
    link: link || "",
    created_at: new Date().toISOString(),
  };
  const created = await dbCreate("promo", item.id, item);
  res.json({ success: true, promo: created });
});

app.delete("/api/admin/promo/:id", authenticate, async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const p = await dbGetById("promo", req.params.id);
  if (!p) return res.status(404).json({ error: "Promo not found" });
  await dbDelete("promo", req.params.id);
  res.json({ success: true });
});

// ── Admin: All Bookings Manager ────────────────────
app.get("/api/admin/bookings", authenticate, async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const { status } = req.query;
  const allBookings = await dbAll("bookings");
  const allServices = await dbAll("services");
  const allVendors = await dbAll("vendors");
  const allUsers = await dbAll("users");
  const svcMap = Object.fromEntries(allServices.map(s => [s.id, s]));
  const venMap = Object.fromEntries(allVendors.map(v => [v.id, v]));
  const userMap = Object.fromEntries(allUsers.map(u => [u.id, u]));

  let list = allBookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  if (status) list = list.filter(b => b.status === status);
  list = list.map(b => ({
    ...b,
    service: svcMap[b.serviceId] || null,
    vendor: venMap[b.vendorId] || null,
    customer: { name: userMap[b.userId]?.name || "Unknown" },
  }));
  res.json(list);
});

app.put("/api/admin/bookings/:id/status", authenticate, async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const { status } = req.body;
  const bk = await dbGetById("bookings", req.params.id);
  if (!bk) return res.status(404).json({ error: "Booking not found" });
  await dbMerge("bookings", bk.id, { status });
  res.json({ success: true, booking: { ...bk, status } });
});

// ═══════════════════════════════════════════════════════
// VENDOR DASHBOARD
// ═══════════════════════════════════════════════════════

app.get("/api/vendor/stream", authenticate, (req, res) => {
  if (req.user?.role !== "vendor") return res.status(403).json({ error: "Vendor only" });
  const vendorId = req.user.id;
  res.writeHead(200, { Connection: "keep-alive", "Content-Type": "text/event-stream", "Cache-Control": "no-cache" });
  res.write("\n");
  let set = vendorStreams.get(vendorId);
  if (!set) { set = new Set(); vendorStreams.set(vendorId, set); }
  set.add(res);
  req.on("close", () => { set.delete(res); });
});

// Customer SSE stream (for booking accepted notifications etc.)
app.get("/api/customer/stream", authenticate, (req, res) => {
  const userId = req.userId;
  res.writeHead(200, { Connection: "keep-alive", "Content-Type": "text/event-stream", "Cache-Control": "no-cache" });
  res.write("\n");
  let set = customerStreams.get(userId);
  if (!set) { set = new Set(); customerStreams.set(userId, set); }
  set.add(res);
  req.on("close", () => { set.delete(res); });
});

// Product categories (dynamic)
app.get("/api/products/categories", async (req, res) => {
  const allProducts = await dbAll("products");
  const cats = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
  res.json(cats);
});

app.get("/api/vendor/stats", authenticate, async (req, res) => {
  if (req.user?.role !== "vendor") return res.status(403).json({ error: "Vendor only" });
  const allBookings = await dbAll("bookings");
  const allServices = await dbAll("services");
  const todayStr = new Date().toISOString().split("T")[0];
  const todayBookings = allBookings.filter(b => b.date === todayStr).length;
  const totalRevenue = allBookings.reduce((s, b) => s + (b.amount || 0), 0);
  res.json({ todayBookings, totalRevenue, rating: 4.7, totalServices: allServices.length });
});

app.get("/api/vendor/bookings", authenticate, async (req, res) => {
  if (req.user?.role !== "vendor") return res.status(403).json({ error: "Vendor only" });
  const allBookings = await dbAll("bookings");
  const allServices = await dbAll("services");
  const allUsers = await dbAll("users");
  const allVendors = await dbAll("vendors");
  const svcMap = Object.fromEntries(allServices.map(s => [s.id, s]));
  const userMap = Object.fromEntries(allUsers.map(u => [u.id, u]));

  // Find which vendor record belongs to this user (match by email)
  const myVendor = allVendors.find(v => v.email === req.user.email || v.userId === req.userId);
  const myServiceIds = new Set(myVendor?.services || []);

  // Show: bookings assigned to this vendor OR unassigned (pending) bookings matching the vendor's services
  let list = allBookings.filter(b => {
    if (b.vendorId && b.vendorId === myVendor?.id) return true; // assigned to me
    if (!b.vendorId && b.status === "pending" && myServiceIds.has(b.serviceId)) return true; // unassigned pool
    return false;
  });

  list = list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  list = list.map(b => ({
    ...b,
    serviceName: svcMap[b.serviceId]?.name || b.serviceName || "Service",
    service: svcMap[b.serviceId] || null,
    customerName: userMap[b.userId]?.name || "Customer",
    customerEmail: b.status !== "pending" ? userMap[b.userId]?.email : null, // hide contact until accepted
    price: b.amount || svcMap[b.serviceId]?.price || 0,
  }));
  res.json(list);
});

// ═══════════════════════════════════════════════════════
// SEARCH (unified)
// ═══════════════════════════════════════════════════════

app.get("/api/search", async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ services: [], vendors: [], products: [], pets: [] });
  const lq = q.toLowerCase();
  const [services, vendors, products, pets] = await Promise.all([
    dbAll("services"), dbAll("vendors"), dbAll("products"), dbAll("breeders"),
  ]);
  res.json({
    services: services.filter(s => s.name.toLowerCase().includes(lq) || s.category.toLowerCase().includes(lq)),
    vendors: vendors.filter(v => v.name.toLowerCase().includes(lq) || v.category.toLowerCase().includes(lq)),
    products: products.filter(p => p.name.toLowerCase().includes(lq) || p.category.toLowerCase().includes(lq)),
    pets: pets.filter(p => p.name.toLowerCase().includes(lq) || p.breed.toLowerCase().includes(lq)),
  });
});

// ═══════════════════════════════════════════════════════
// CART
// ═══════════════════════════════════════════════════════

app.get("/api/cart", authenticate, async (req, res) => {
  const cart = await dbGetById("carts", req.userId);
  const items = cart?.items || [];
  const allProducts = await dbAll("products");
  const prodMap = Object.fromEntries(allProducts.map(p => [p.id, p]));
  const enriched = items.map(ci => ({ ...ci, product: prodMap[ci.productId] || null }));
  const total = enriched.reduce((s, i) => s + ((i.product?.price || 0) * i.qty), 0);
  res.json({ items: enriched, total });
});

app.post("/api/cart", authenticate, async (req, res) => {
  const { productId, qty } = req.body;
  if (!productId) return res.status(400).json({ error: "productId required" });
  const cart = await dbGetById("carts", req.userId);
  let items = cart?.items || [];
  const existing = items.find(c => c.productId === productId);
  if (existing) { existing.qty = (existing.qty || 1) + (qty || 1); }
  else { items.push({ productId, qty: qty || 1 }); }
  await dbPut("carts", req.userId, { items });
  res.json({ success: true, cart: items });
});

app.put("/api/cart/:productId", authenticate, async (req, res) => {
  const { qty } = req.body;
  const cart = await dbGetById("carts", req.userId);
  let items = cart?.items || [];
  const item = items.find(c => c.productId === req.params.productId);
  if (!item) return res.status(404).json({ error: "Item not in cart" });
  if (qty <= 0) { items = items.filter(c => c.productId !== req.params.productId); }
  else { item.qty = qty; }
  await dbPut("carts", req.userId, { items });
  res.json({ success: true });
});

app.delete("/api/cart/:productId", authenticate, async (req, res) => {
  const cart = await dbGetById("carts", req.userId);
  let items = (cart?.items || []).filter(c => c.productId !== req.params.productId);
  await dbPut("carts", req.userId, { items });
  res.json({ success: true });
});

// ═══════════════════════════════════════════════════════
// ORDERS (E-Commerce)
// ═══════════════════════════════════════════════════════

app.get("/api/orders", authenticate, async (req, res) => {
  const [records] = await dbQuery(`SELECT * FROM orders WHERE userId = $uid ORDER BY created_at DESC`, { uid: req.userId });
  res.json(normalizeRecords(records));
});

app.post("/api/orders", authenticate, async (req, res) => {
  const { address, coinsUsed, charityAmount, paymentMethod } = req.body;
  const cart = await dbGetById("carts", req.userId);
  const cartItems = cart?.items || [];
  if (!cartItems.length) return res.status(400).json({ error: "Cart is empty" });

  const allProducts = await dbAll("products");
  const prodMap = Object.fromEntries(allProducts.map(p => [p.id, p]));
  const items = cartItems.map(ci => {
    const p = prodMap[ci.productId];
    return { productId: ci.productId, name: p?.name, price: p?.price || 0, qty: ci.qty };
  });
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const wallet = await dbGetById("coins", req.userId);
  const coinDiscount = Math.min(coinsUsed || 0, 100, wallet?.balance || 0);
  const charity = charityAmount || 0;
  const total = subtotal - coinDiscount + charity;

  const order = {
    id: genId("ord"), userId: req.userId, items, subtotal, coinDiscount, charityAmount: charity,
    total, address: address || "", paymentMethod: paymentMethod || "razorpay", status: "confirmed", created_at: new Date().toISOString(),
  };
  await dbCreate("orders", order.id, order);
  await dbPut("carts", req.userId, { items: [] });

  if (coinDiscount > 0 && wallet) {
    const txns = [...(wallet.transactions || []), { type: "redeem", amount: -coinDiscount, desc: `Order ${order.id}`, date: new Date().toISOString() }];
    await dbPut("coins", req.userId, { balance: wallet.balance - coinDiscount, transactions: txns, lastLogin: wallet.lastLogin });
  }
  if (charity > 0) {
    await dbCreate("donations", genId("don"), { orderId: order.id, userId: req.userId, amount: charity, date: new Date().toISOString() });
  }
  res.json({ success: true, order });
});

// ═══════════════════════════════════════════════════════
// COINS & REFERRAL
// ═══════════════════════════════════════════════════════

app.get("/api/coins", authenticate, async (req, res) => {
  const wallet = await dbGetById("coins", req.userId);
  res.json(wallet || { balance: 0, transactions: [], lastLogin: null });
});

app.post("/api/coins/daily", authenticate, async (req, res) => {
  let wallet = await dbGetById("coins", req.userId);
  if (!wallet) wallet = { balance: 0, transactions: [], lastLogin: null };
  const today = new Date().toISOString().split("T")[0];
  if (wallet.lastLogin === today) return res.json({ success: false, message: "Already claimed today", balance: wallet.balance });
  wallet.lastLogin = today;
  wallet.balance += 5;
  const txns = [...(wallet.transactions || []), { type: "daily", amount: 5, desc: "Daily login reward", date: new Date().toISOString() }];
  await dbPut("coins", req.userId, { balance: wallet.balance, transactions: txns, lastLogin: wallet.lastLogin });
  res.json({ success: true, message: "5 coins earned!", balance: wallet.balance, earned: 5 });
});

app.post("/api/coins/referral", authenticate, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Referral code required" });
  const [arr] = await dbQuery(
    `SELECT * FROM users WHERE referralCode = $code LIMIT 1`, { code }
  );
  const referrer = normalizeRecord(arr?.[0] ?? null);
  if (!referrer || referrer.id === req.userId) return res.status(404).json({ error: "Invalid referral code" });

  let wallet = await dbGetById("coins", req.userId);
  if (!wallet) wallet = { balance: 0, transactions: [], lastLogin: null };
  const already = (wallet.transactions || []).find(t => t.type === "referral_used");
  if (already) return res.status(400).json({ error: "You have already used a referral code" });

  // Credit current user
  wallet.balance += 50;
  const txns = [...(wallet.transactions || []), { type: "referral_used", amount: 50, desc: `Referral from ${referrer.name}`, date: new Date().toISOString() }];
  await dbPut("coins", req.userId, { balance: wallet.balance, transactions: txns, lastLogin: wallet.lastLogin });

  // Credit referrer
  let refWallet = await dbGetById("coins", referrer.id);
  if (!refWallet) refWallet = { balance: 0, transactions: [], lastLogin: null };
  refWallet.balance += 50;
  const refTxns = [...(refWallet.transactions || []), { type: "referral_given", amount: 50, desc: `Referred ${req.user?.name || "user"}`, date: new Date().toISOString() }];
  await dbPut("coins", referrer.id, { balance: refWallet.balance, transactions: refTxns, lastLogin: refWallet.lastLogin });

  res.json({ success: true, balance: wallet.balance });
});

// Generate referral code
app.get("/api/referral-code", authenticate, async (req, res) => {
  const user = req.user;
  if (!user.referralCode) {
    const referralCode = "SL" + crypto.randomBytes(4).toString("hex").toUpperCase();
    await dbMerge("users", user.id, { referralCode });
    return res.json({ code: referralCode });
  }
  res.json({ code: user.referralCode });
});

// ═══════════════════════════════════════════════════════
// PET-O-GRAM (Social Feed)
// ═══════════════════════════════════════════════════════

// Clean up expired posts (24hr stories)
async function cleanExpiredPosts() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await dbQuery(`DELETE FROM posts WHERE created_at < $cutoff`, { cutoff });
}

app.get("/api/posts", authenticate, async (req, res) => {
  await cleanExpiredPosts();
  const [postRecords] = await dbQuery(`SELECT * FROM posts ORDER BY created_at DESC`);
  const posts = normalizeRecords(postRecords);
  const allUsers = await dbAll("users");
  const userMap = Object.fromEntries(allUsers.map(u => [u.id, u]));
  const allLikes = await dbAll("likes");
  const allComments = await dbAll("comments");

  const enriched = posts.map(p => {
    const author = userMap[p.userId];
    return {
      ...p,
      author: author ? { name: author.name, avatar: author.avatar } : { name: "User" },
      likeCount: allLikes.filter(l => l.postId === p.id).length,
      liked: allLikes.some(l => l.postId === p.id && l.userId === req.userId),
      commentCount: allComments.filter(c => c.postId === p.id).length,
    };
  });
  res.json(enriched);
});

app.post("/api/posts", authenticate, upload.single("media"), async (req, res) => {
  const { caption, mediaUrl } = req.body;
  const media = req.file ? `/uploads/${req.file.filename}` : (mediaUrl || null);
  const post = {
    id: genId("post"), userId: req.userId, caption: caption || "", media,
    mediaType: req.file ? (req.file.mimetype.startsWith("video") ? "video" : "image") : "image",
    created_at: new Date().toISOString(),
  };
  const created = await dbCreate("posts", post.id, post);
  res.json({ success: true, post: created });
});

app.delete("/api/posts/:id", authenticate, async (req, res) => {
  const post = await dbGetById("posts", req.params.id);
  if (!post || (post.userId !== req.userId && req.user?.role !== "admin")) {
    return res.status(404).json({ error: "Post not found" });
  }
  await dbDelete("posts", post.id);
  res.json({ success: true });
});

app.post("/api/posts/:id/like", authenticate, async (req, res) => {
  const [existing] = await dbQuery(
    `SELECT * FROM likes WHERE postId = $pid AND userId = $uid LIMIT 1`,
    { pid: req.params.id, uid: req.userId }
  );
  if (existing?.[0]) {
    const likeId = normalizeId(existing[0].id);
    await dbDelete("likes", likeId);
    return res.json({ liked: false });
  }
  await dbCreate("likes", genId("lk"), { userId: req.userId, postId: req.params.id });
  res.json({ liked: true });
});

app.get("/api/posts/:id/comments", authenticate, async (req, res) => {
  const [records] = await dbQuery(
    `SELECT * FROM comments WHERE postId = $pid ORDER BY created_at ASC`,
    { pid: req.params.id }
  );
  const comments = normalizeRecords(records);
  const allUsers = await dbAll("users");
  const userMap = Object.fromEntries(allUsers.map(u => [u.id, u]));
  const enriched = comments.map(c => {
    const author = userMap[c.userId];
    return { ...c, author: author ? { name: author.name } : { name: "User" } };
  });
  res.json(enriched);
});

app.post("/api/posts/:id/comments", authenticate, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text required" });
  const comment = { id: genId("cmt"), userId: req.userId, postId: req.params.id, text, created_at: new Date().toISOString() };
  const created = await dbCreate("comments", comment.id, comment);
  res.json({ success: true, comment: created });
});

// Follow system
app.post("/api/follow/:userId", authenticate, async (req, res) => {
  const targetId = req.params.userId;
  if (targetId === req.userId) return res.status(400).json({ error: "Cannot follow yourself" });
  const [existing] = await dbQuery(
    `SELECT * FROM follows WHERE followerId = $fid AND followingId = $tid LIMIT 1`,
    { fid: req.userId, tid: targetId }
  );
  if (existing?.[0]) {
    const followId = normalizeId(existing[0].id);
    await dbDelete("follows", followId);
    return res.json({ following: false });
  }
  await dbCreate("follows", genId("fw"), { followerId: req.userId, followingId: targetId });
  res.json({ following: true });
});

// ═══════════════════════════════════════════════════════
// PET RECOVERY NETWORK (Lost & Found)
// ═══════════════════════════════════════════════════════

app.get("/api/recovery", async (_req, res) => {
  const [records] = await dbQuery(`SELECT * FROM recovery ORDER BY created_at DESC`);
  const alerts = normalizeRecords(records);
  const allUsers = await dbAll("users");
  const userMap = Object.fromEntries(allUsers.map(u => [u.id, u]));
  const enriched = alerts.map(a => ({ ...a, reporterName: userMap[a.userId]?.name || "Anonymous" }));
  res.json(enriched);
});

app.post("/api/recovery", authenticate, async (req, res) => {
  const { type, petName, species, breed, description, lastSeenLocation, image, contactMethod } = req.body;
  if (!type || !petName) return res.status(400).json({ error: "type and petName required" });
  const alert = {
    id: genId("rcv"), userId: req.userId, type: type || "lost",
    petName, species: species || "", breed: breed || "", description: description || "",
    lastSeenLocation: lastSeenLocation || "", image: image || null,
    contactMethod: contactMethod || "app", status: "active",
    created_at: new Date().toISOString(),
  };
  const created = await dbCreate("recovery", alert.id, alert);
  res.json({ success: true, alert: created });
});

app.put("/api/recovery/:id/resolve", authenticate, async (req, res) => {
  const alert = await dbGetById("recovery", req.params.id);
  if (!alert || (alert.userId !== req.userId && req.user?.role !== "admin")) {
    return res.status(404).json({ error: "Alert not found" });
  }
  await dbMerge("recovery", alert.id, { status: "resolved" });
  res.json({ success: true });
});

// ═══════════════════════════════════════════════════════
// EMERGENCY VET ACCESS
// ═══════════════════════════════════════════════════════

app.get("/api/emergency-vets", async (_req, res) => {
  const { state } = _req.query;
  let list = await dbAll("emergency_vets");
  if (state) list = list.filter(v => v.state.toLowerCase() === state.toLowerCase());
  res.json(list);
});

app.get("/api/emergency-vets/states", async (_req, res) => {
  const list = await dbAll("emergency_vets");
  const states = [...new Set(list.map(v => v.state))].sort();
  res.json(states);
});

// ═══════════════════════════════════════════════════════
// CHARITY FUND MODULE
// ═══════════════════════════════════════════════════════

app.get("/api/charity", async (_req, res) => {
  const allCharity = await dbAll("charity");
  const allDonations = await dbAll("donations");
  const totalDonations = allDonations.reduce((s, d) => s + d.amount, 0);
  res.json({ media: allCharity, totalDonations, donorCount: new Set(allDonations.map(d => d.userId)).size });
});

app.post("/api/admin/charity", authenticate, upload.single("media"), async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const { title, description, mediaUrl } = req.body;
  const media = req.file ? `/uploads/${req.file.filename}` : (mediaUrl || null);
  const item = {
    id: genId("char"), title: title || "", description: description || "",
    media, mediaType: req.file ? (req.file.mimetype.startsWith("video") ? "video" : "image") : "image",
    created_at: new Date().toISOString(),
  };
  const created = await dbCreate("charity", item.id, item);
  res.json({ success: true, item: created });
});

app.delete("/api/admin/charity/:id", authenticate, async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const item = await dbGetById("charity", req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  await dbDelete("charity", req.params.id);
  res.json({ success: true });
});

// ═══════════════════════════════════════════════════════
// CELEBRATIONS & LIFESTYLE
// ═══════════════════════════════════════════════════════

app.get("/api/celebrations", async (_req, res) => res.json(await dbAll("celebrations")));

app.post("/api/celebrations/book", authenticate, async (req, res) => {
  const { celebrationId, date, time, petName, notes, customDiy } = req.body;
  if (!celebrationId) return res.status(400).json({ error: "celebrationId required" });
  const cel = await dbGetById("celebrations", celebrationId);
  if (!cel) return res.status(404).json({ error: "Package not found" });
  const booking = {
    id: genId("celbk"), userId: req.userId, celebrationId, celebrationName: cel.name,
    date: date || "", time: time || "", petName: petName || "", notes: notes || "",
    customDiy: customDiy || null, amount: cel.price, status: "upcoming",
    created_at: new Date().toISOString(),
  };
  await dbCreate("bookings", booking.id, booking);
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

app.put("/api/vendor/bookings/:id/accept", authenticate, async (req, res) => {
  if (req.user?.role !== "vendor") return res.status(403).json({ error: "Vendor only" });
  const bk = await dbGetById("bookings", req.params.id);
  if (!bk) return res.status(404).json({ error: "Booking not found" });
  if (bk.status !== "pending" && bk.status !== "upcoming") return res.status(400).json({ error: "Booking cannot be accepted" });

  // Find the vendor record for this user
  const allVendors = await dbAll("vendors");
  const myVendor = allVendors.find(v => v.email === req.user.email || v.userId === req.userId);
  const vendorId = myVendor?.id || null;

  await dbMerge("bookings", bk.id, { status: "upcoming", vendorId, vendorAccepted: true });
  // Notify the customer that a vendor accepted their booking
  const svc = await dbGetById("services", bk.serviceId);
  notifyCustomer(bk.userId, {
    type: "booking_accepted",
    booking: { ...bk, status: "upcoming", vendorId, vendorAccepted: true },
    vendorName: myVendor?.name || "A provider",
    serviceName: svc?.name || bk.serviceName || "Service",
    message: `${myVendor?.name || "A provider"} accepted your ${svc?.name || "service"} booking for ${bk.date} at ${bk.time}`,
  });
  res.json({ success: true, booking: { ...bk, status: "upcoming", vendorId, vendorAccepted: true } });
});

app.put("/api/vendor/bookings/:id/decline", authenticate, async (req, res) => {
  if (req.user?.role !== "vendor") return res.status(403).json({ error: "Vendor only" });
  const bk = await dbGetById("bookings", req.params.id);
  if (!bk) return res.status(404).json({ error: "Booking not found" });
  await dbMerge("bookings", bk.id, { status: "declined" });
  res.json({ success: true, booking: { ...bk, status: "declined" } });
});

app.put("/api/vendor/bookings/:id/complete", authenticate, async (req, res) => {
  if (req.user?.role !== "vendor") return res.status(403).json({ error: "Vendor only" });
  const bk = await dbGetById("bookings", req.params.id);
  if (!bk) return res.status(404).json({ error: "Booking not found" });
  await dbMerge("bookings", bk.id, { status: "completed" });
  res.json({ success: true, booking: { ...bk, status: "completed" } });
});

app.get("/api/vendor/earnings", authenticate, async (req, res) => {
  if (req.user?.role !== "vendor") return res.status(403).json({ error: "Vendor only" });
  const allBookings = await dbAll("bookings");
  const allServices = await dbAll("services");
  const svcMap = Object.fromEntries(allServices.map(s => [s.id, s]));
  const completed = allBookings.filter(b => b.status === "completed");
  const totalEarnings = completed.reduce((s, b) => s + (b.amount || 0) * 0.8, 0);
  const thisWeek = completed.filter(b => {
    const d = new Date(b.created_at);
    return (Date.now() - d) < 7 * 24 * 60 * 60 * 1000;
  });
  const weekEarnings = thisWeek.reduce((s, b) => s + (b.amount || 0) * 0.8, 0);
  res.json({
    totalEarnings: Math.round(totalEarnings),
    weekEarnings: Math.round(weekEarnings),
    completedBookings: completed.length,
    pendingSettlement: Math.round(weekEarnings),
    history: completed.slice(-20).reverse().map(b => ({
      id: b.id, amount: Math.round((b.amount || 0) * 0.8), date: b.created_at,
      service: svcMap[b.serviceId]?.name || "Service",
    })),
  });
});

app.get("/api/vendor/profile", authenticate, async (req, res) => {
  if (req.user?.role !== "vendor") return res.status(403).json({ error: "Vendor only" });
  const allVendors = await dbAll("vendors");
  const vendorRecord = allVendors.find(v => v.userId === req.userId) || null;
  res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, phone: req.user.phone, city: req.user.city }, vendor: vendorRecord });
});

// ═══════════════════════════════════════════════════════
// ADMIN EXTENDED ENDPOINTS
// ═══════════════════════════════════════════════════════

// Admin: Recovery moderation
app.get("/api/admin/recovery", authenticate, async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const [records] = await dbQuery(`SELECT * FROM recovery ORDER BY created_at DESC`);
  res.json(normalizeRecords(records));
});

app.put("/api/admin/recovery/:id", authenticate, async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const alert = await dbGetById("recovery", req.params.id);
  if (!alert) return res.status(404).json({ error: "Alert not found" });
  const updates = {};
  if (req.body.status) updates.status = req.body.status;
  if (req.body.featured !== undefined) updates.featured = req.body.featured;
  await dbMerge("recovery", alert.id, updates);
  res.json({ success: true, alert: { ...alert, ...updates } });
});

// Admin: Products CRUD
app.post("/api/admin/products", authenticate, async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const { name, category, price, mrp, description, image, stock } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });
  const prod = { id: genId("prod"), name, category: category || "General", price: price || 0, mrp: mrp || price || 0, rating: 0, reviews: 0, description: description || "", image: image || null, stock: stock || 0 };
  const created = await dbCreate("products", prod.id, prod);
  res.json({ success: true, product: created });
});

app.put("/api/admin/products/:id", authenticate, async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const prod = await dbGetById("products", req.params.id);
  if (!prod) return res.status(404).json({ error: "Product not found" });
  const fields = ["name", "category", "price", "mrp", "description", "image", "stock"];
  const updates = {};
  fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  await dbMerge("products", prod.id, updates);
  res.json({ success: true, product: { ...prod, ...updates } });
});

app.delete("/api/admin/products/:id", authenticate, async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const prod = await dbGetById("products", req.params.id);
  if (!prod) return res.status(404).json({ error: "Product not found" });
  await dbDelete("products", req.params.id);
  res.json({ success: true });
});

// Admin: Celebrations CRUD
app.post("/api/admin/celebrations", authenticate, async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const { name, category, price, description, image } = req.body;
  const cel = { id: genId("cel"), name: name || "", category: category || "Special", price: price || 0, description: description || "", image: image || null };
  const created = await dbCreate("celebrations", cel.id, cel);
  res.json({ success: true, celebration: created });
});

app.delete("/api/admin/celebrations/:id", authenticate, async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const cel = await dbGetById("celebrations", req.params.id);
  if (!cel) return res.status(404).json({ error: "Not found" });
  await dbDelete("celebrations", req.params.id);
  res.json({ success: true });
});

// Admin: Emergency Vets CRUD
app.post("/api/admin/emergency-vets", authenticate, async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const { state, name, phone, type } = req.body;
  const vet = { id: genId("ev"), state: state || "", name: name || "", phone: phone || "", type: type || "shelter" };
  const created = await dbCreate("emergency_vets", vet.id, vet);
  res.json({ success: true, vet: created });
});

app.delete("/api/admin/emergency-vets/:id", authenticate, async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const vet = await dbGetById("emergency_vets", req.params.id);
  if (!vet) return res.status(404).json({ error: "Not found" });
  await dbDelete("emergency_vets", req.params.id);
  res.json({ success: true });
});

// ═══════════════════════════════════════════════════════
// HEALTH
// ═══════════════════════════════════════════════════════

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", db: db ? "connected" : "disconnected", mail: MAIL_API_KEY ? "configured" : "not-configured" });
});

// ── Global error handler (prevents crash on unhandled route errors) ──
app.use((err, _req, res, _next) => {
  console.error("Unhandled route error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start ─────────────────────────────────────────────
await initDB();
app.listen(PORT, () => {
  console.log(`🚀 Servleash API on http://localhost:${PORT}`);
  console.log(`📧 Mail API: ${MAIL_API_URL}`);
});
