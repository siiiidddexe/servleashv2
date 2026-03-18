// Use relative path so Vite proxy handles it in dev,
// and the same origin works in production builds.
const API_BASE = "/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("servleash_token");
  const headers = {
    "Content-Type": "application/json",
    ...((token && !options.skipAuth) ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function uploadRequest(path, formData) {
  const token = localStorage.getItem("servleash_token");
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data;
}

export const api = {
  // Auth (password + OTP)
  register: (email, password, role, extra = {}) => request("/auth/register", { method: "POST", body: JSON.stringify({ email, password, role, ...extra }), skipAuth: true }),
  login: (email, password) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }), skipAuth: true }),
  me: () => request("/auth/me"),
  // requestOtp is deprecated/removed in backend but kept here for now? No, I should use resendOtp.
  // actually requestOtp was removed from api object in previous turn? No, I see it in read_file.
  // Wait, I tried to replace requestOtp with resendOtp but it failed.
  // Let's fix requestOtp -> resendOtp here as well if needed.
  
  // Resend OTP (needs session, but session is cookie/server-side map, not Bearer token usually? 
  // Wait, the backend implementation of resend-otp CHECKS `otps` map using email+role. It does NOT use `authenticate` middleware.
  // So it does NOT need Bearer token.
  resendOtp: (email, role) => request("/auth/resend-otp", { method: "POST", body: JSON.stringify({ email, role }), skipAuth: true }),
  
  verifyOtp: (email, role, code, { name, phone, city } = {}) => request("/auth/verify-otp", { method: "POST", body: JSON.stringify({ email, role, code, name, phone, city }), skipAuth: true }),
  logout: () => request("/auth/logout", { method: "POST" }),

  // Password reset
  requestPasswordReset: (email, role, appUrl) => request("/auth/request-password-reset", { method: "POST", body: JSON.stringify({ email, role, appUrl }), skipAuth: true }),
  verifyResetToken: (token) => request(`/auth/reset-password?token=${encodeURIComponent(token)}`, { skipAuth: true }),
  resetPassword: (token) => request("/auth/reset-password", { method: "POST", body: JSON.stringify({ token }), skipAuth: true }),

  // Profile
  getProfile: () => request("/user/profile"),
  updateProfile: (data) => request("/user/profile", { method: "PUT", body: JSON.stringify(data) }),

  // Services
  getServices: (category) => request(`/services${category && category !== "All" ? `?category=${encodeURIComponent(category)}` : ""}`),
  getService: (id) => request(`/services/${id}`),

  // Vendors
  getVendors: (category) => request(`/vendors${category && category !== "All" ? `?category=${encodeURIComponent(category)}` : ""}`),
  getVendor: (id) => request(`/vendors/${id}`),
  getVendorSlots: (vendorId, date) => request(`/vendors/${vendorId}/slots?date=${date}`),

  // Products
  getProducts: (category) => request(`/products${category && category !== "All" ? `?category=${encodeURIComponent(category)}` : ""}`),
  getProduct: (id) => request(`/products/${id}`),
  getProductCategories: () => request("/products/categories"),

  // Pets (breeder gallery)
  getPets: () => request("/pets"),
  getPet: (id) => request(`/pets/${id}`),

  // My Pets (user-owned)
  getMyPets: () => request("/my-pets"),
  getMyPet: (id) => request(`/my-pets/${id}`),
  createMyPet: (data) => request("/my-pets", { method: "POST", body: JSON.stringify(data) }),
  updateMyPet: (id, data) => request(`/my-pets/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteMyPet: (id) => request(`/my-pets/${id}`, { method: "DELETE" }),
  uploadPetDocument: (petId, file, docType) => { const fd = new FormData(); fd.append("file", file); fd.append("type", docType || "Other"); return uploadRequest(`/my-pets/${petId}/documents`, fd); },
  deletePetDocument: (petId, docId) => request(`/my-pets/${petId}/documents/${docId}`, { method: "DELETE" }),
  getPetQR: (petId) => request(`/pet-qr/${petId}`),

  // Bookings
  getBookings: (status) => request(`/bookings${status ? `?status=${status}` : ""}`),
  createBooking: (data) => request("/bookings", { method: "POST", body: JSON.stringify(data) }),
  cancelBooking: (id) => request(`/bookings/${id}/cancel`, { method: "PUT" }),

  // Cart
  getCart: () => request("/cart"),
  addToCart: (productId, qty) => request("/cart", { method: "POST", body: JSON.stringify({ productId, qty }) }),
  updateCartItem: (productId, qty) => request(`/cart/${productId}`, { method: "PUT", body: JSON.stringify({ qty }) }),
  removeFromCart: (productId) => request(`/cart/${productId}`, { method: "DELETE" }),

  // Orders
  getOrders: () => request("/orders"),
  createOrder: (data) => request("/orders", { method: "POST", body: JSON.stringify(data) }),
  cancelOrder: (id) => request(`/orders/${id}/cancel`, { method: "PUT" }),
  getReviews: (type, id) => request(`/reviews/${type}/${id}`),
  submitReview: (data) => request("/reviews", { method: "POST", body: JSON.stringify(data) }),
  getSavedAddresses: () => request("/addresses"),
  saveAddress: (data) => request("/addresses", { method: "POST", body: JSON.stringify(data) }),
  deleteAddress: (id) => request(`/addresses/${id}`, { method: "DELETE" }),

  // Coins & Referral
  getCoins: () => request("/coins"),
  claimDailyCoins: () => request("/coins/daily", { method: "POST" }),
  useReferral: (code) => request("/coins/referral", { method: "POST", body: JSON.stringify({ code }) }),
  getReferralCode: () => request("/referral-code"),

  // Social Feed (Pet-O-Gram)
  getPosts: () => request("/posts"),
  createPost: (file, caption) => { const fd = new FormData(); fd.append("media", file); fd.append("caption", caption || ""); return uploadRequest("/posts", fd); },
  deletePost: (id) => request(`/posts/${id}`, { method: "DELETE" }),
  likePost: (id) => request(`/posts/${id}/like`, { method: "POST" }),
  getComments: (postId) => request(`/posts/${postId}/comments`),
  addComment: (postId, text) => request(`/posts/${postId}/comments`, { method: "POST", body: JSON.stringify({ text }) }),
  followUser: (userId) => request(`/follow/${userId}`, { method: "POST" }),

  // Recovery Network
  getRecoveryAlerts: () => request("/recovery"),
  createRecoveryAlert: (data) => request("/recovery", { method: "POST", body: JSON.stringify(data) }),
  resolveRecoveryAlert: (id) => request(`/recovery/${id}/resolve`, { method: "PUT" }),

  // Emergency Vets
  getEmergencyVets: (state) => request(`/emergency-vets${state ? `?state=${encodeURIComponent(state)}` : ""}`),
  getEmergencyVetStates: () => request("/emergency-vets/states"),

  // Charity
  getCharity: () => request("/charity"),

  // Celebrations
  getCelebrations: () => request("/celebrations"),
  bookCelebration: (data) => request("/celebrations/book", { method: "POST", body: JSON.stringify(data) }),

  // AI Chatbot
  getChatPresets: () => request("/chatbot/presets"),
  sendChatMessage: (message) => request("/chatbot/message", { method: "POST", body: JSON.stringify({ message }) }),

  // Saved
  getSaved: () => request("/saved"),
  saveItem: (itemId, type) => request("/saved", { method: "POST", body: JSON.stringify({ itemId, type }) }),
  unsaveItem: (itemId, type) => request(`/saved/${itemId}?type=${type}`, { method: "DELETE" }),
  checkSaved: (itemId, type) => request(`/saved/check/${itemId}?type=${type}`),

  // Admin
  getAdminStats: () => request("/admin/stats"),
  getAdminUsers: (role) => request(`/admin/users${role ? `?role=${role}` : ""}`),
  createService: (data) => request("/admin/services", { method: "POST", body: JSON.stringify(data) }),
  updateService: (id, data) => request(`/admin/services/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteService: (id) => request(`/admin/services/${id}`, { method: "DELETE" }),
  createVendor: (data) => request("/admin/vendors", { method: "POST", body: JSON.stringify(data) }),
  updateVendor: (id, data) => request(`/admin/vendors/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteVendor: (id) => request(`/admin/vendors/${id}`, { method: "DELETE" }),
  getPromo: () => request("/promo"),
  createPromo: (data) => request("/admin/promo", { method: "POST", body: JSON.stringify(data) }),
  deletePromo: (id) => request(`/admin/promo/${id}`, { method: "DELETE" }),
  getAdminBookings: (status) => request(`/admin/bookings${status ? `?status=${status}` : ""}`),
  updateBookingStatus: (id, status) => request(`/admin/bookings/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
  // Admin Products
  adminCreateProduct: (data) => request("/admin/products", { method: "POST", body: JSON.stringify(data) }),
  adminUpdateProduct: (id, data) => request(`/admin/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  adminDeleteProduct: (id) => request(`/admin/products/${id}`, { method: "DELETE" }),
  // Admin Charity
  adminAddCharityMedia: (file, caption) => { const fd = new FormData(); fd.append("file", file); fd.append("caption", caption || ""); return uploadRequest("/admin/charity", fd); },
  adminDeleteCharityMedia: (id) => request(`/admin/charity/${id}`, { method: "DELETE" }),
  // Admin Recovery
  adminApproveRecovery: (id) => request(`/admin/recovery/${id}`, { method: "PUT", body: JSON.stringify({ action: "approve" }) }),
  adminRejectRecovery: (id) => request(`/admin/recovery/${id}`, { method: "PUT", body: JSON.stringify({ action: "reject" }) }),
  // Admin Celebrations
  adminCreateCelebration: (data) => request("/admin/celebrations", { method: "POST", body: JSON.stringify(data) }),
  adminUpdateCelebration: (id, data) => request(`/admin/celebrations/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  adminDeleteCelebration: (id) => request(`/admin/celebrations/${id}`, { method: "DELETE" }),
  // Admin Emergency Vets
  adminCreateEmergencyVet: (data) => request("/admin/emergency-vets", { method: "POST", body: JSON.stringify(data) }),
  adminUpdateEmergencyVet: (id, data) => request(`/admin/emergency-vets/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  adminDeleteEmergencyVet: (id) => request(`/admin/emergency-vets/${id}`, { method: "DELETE" }),
  uploadFile: async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return uploadRequest("/admin/upload", fd);
  },

  // Vendor
  getVendorStats: () => request("/vendor/stats"),
  getVendorBookings: () => request("/vendor/bookings"),
  getVendorEarnings: () => request("/vendor/earnings"),
  getVendorProfile: () => request("/vendor/profile"),
  acceptBooking: (id) => request(`/vendor/bookings/${id}/accept`, { method: "PUT" }),
  declineBooking: (id) => request(`/vendor/bookings/${id}/decline`, { method: "PUT" }),
  completeBooking: (id) => request(`/vendor/bookings/${id}/complete`, { method: "PUT" }),

  // Search
  search: (q) => request(`/search?q=${encodeURIComponent(q)}`),
  health: () => request("/health"),
};
