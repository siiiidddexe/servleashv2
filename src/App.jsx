import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "./context/AuthContext";

// Shared auth pages (unified — single login for all roles)
import Login from "./pages/shared/Login";
import OtpVerify from "./pages/shared/OtpVerify";
import Signup from "./pages/shared/Signup";
import ForgotPassword from "./pages/shared/ForgotPassword";
import ResetPassword from "./pages/shared/ResetPassword";
import Onboarding from "./pages/shared/Onboarding";

// Customer
import CustomerSplash from "./pages/customer/CustomerSplash";
import CustomerHome from "./pages/customer/CustomerHome";
import PetDetail from "./pages/customer/PetDetail";
import CustomerProfile from "./pages/customer/CustomerProfile";
import CustomerAppointments from "./pages/customer/CustomerAppointments";
import CustomerShop from "./pages/customer/CustomerShop";
import CustomerSaved from "./pages/customer/CustomerSaved";
import ServiceDetail from "./pages/customer/ServiceDetail";
import VendorDetail from "./pages/customer/VendorDetail";
import BookingFlow from "./pages/customer/BookingFlow";
import MyPets from "./pages/customer/MyPets";
import PetDocs from "./pages/customer/PetDocs";
import PetQR from "./pages/customer/PetQR";
import PetOGram from "./pages/customer/PetOGram";
import EmergencyVet from "./pages/customer/EmergencyVet";
import LostPetRecovery from "./pages/customer/LostPetRecovery";
import AIChat from "./pages/customer/AIChat";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import Orders from "./pages/customer/Orders";
import CoinsPage from "./pages/customer/CoinsPage";
import Celebrations from "./pages/customer/Celebrations";
import Charity from "./pages/customer/Charity";
import Breeders from "./pages/customer/Breeders";

// Admin
import AdminSplash from "./pages/admin/AdminSplash";
import AdminHome from "./pages/admin/AdminHome";
import AdminServices from "./pages/admin/AdminServices";
import AdminVendors from "./pages/admin/AdminVendors";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminPromo from "./pages/admin/AdminPromo";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCharity from "./pages/admin/AdminCharity";
import AdminRecovery from "./pages/admin/AdminRecovery";
import AdminCelebrations from "./pages/admin/AdminCelebrations";
import AdminEmergencyVets from "./pages/admin/AdminEmergencyVets";

// Vendor
import VendorSplash from "./pages/vendor/VendorSplash";
import VendorHome from "./pages/vendor/VendorHome";
import VendorBookings from "./pages/vendor/VendorBookings";
import VendorEarnings from "./pages/vendor/VendorEarnings";
import VendorProfile from "./pages/vendor/VendorProfile";

const ROLE_HOME = {
  customer: "/customer/home",
  vendor:   "/vendor/home",
  admin:    "/admin/home",
};

// Redirect unauthenticated users to /login; wrong-role users to their actual home
function ProtectedRoute({ role, children }) {
  const { user, token } = useAuth();
  if (!user || !token) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={ROLE_HOME[user.role] ?? "/login"} replace />;
  return children;
}

// Redirect already-authenticated users away from auth pages (login, signup, etc.)
function AuthRoute({ children }) {
  const { user, token } = useAuth();
  if (user && token) return <Navigate to={ROLE_HOME[user.role] ?? "/login"} replace />;
  return children;
}

function OnboardingGate() {
  const { user, token } = useAuth();
  if (user && token) return <Navigate to={ROLE_HOME[user.role] ?? "/login"} replace />;
  const seen = localStorage.getItem("servleash_onboarded");
  return seen ? <Login /> : <Navigate to="/onboarding" replace />;
}

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* ── Root → Onboarding (first visit) or Login (returning) ── */}
        <Route path="/" element={<OnboardingGate />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* ── Unified auth (single login page for all roles) ── */}
        <Route path="/login"           element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/signup"          element={<AuthRoute><Signup /></AuthRoute>} />
        <Route path="/otp"             element={<AuthRoute><OtpVerify /></AuthRoute>} />
        <Route path="/forgot-password" element={<AuthRoute><ForgotPassword /></AuthRoute>} />
        <Route path="/reset-password"  element={<AuthRoute><ResetPassword /></AuthRoute>} />

        {/* ── Legacy role-prefixed auth routes (redirect compat) ── */}
        <Route path="/customer/login" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/admin/login"    element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/vendor/login"   element={<AuthRoute><Login /></AuthRoute>} />

        {/* ── Customer flow ── */}
        <Route path="/customer"                 element={<ProtectedRoute role="customer"><CustomerSplash /></ProtectedRoute>} />
        <Route path="/customer/home"            element={<ProtectedRoute role="customer"><CustomerHome /></ProtectedRoute>} />
        <Route path="/customer/pet/:id"         element={<ProtectedRoute role="customer"><PetDetail /></ProtectedRoute>} />
        <Route path="/customer/pets"            element={<ProtectedRoute role="customer"><CustomerHome /></ProtectedRoute>} />
        <Route path="/customer/profile"         element={<ProtectedRoute role="customer"><CustomerProfile /></ProtectedRoute>} />
        <Route path="/customer/appointments"    element={<ProtectedRoute role="customer"><CustomerAppointments /></ProtectedRoute>} />
        <Route path="/customer/shop"            element={<ProtectedRoute role="customer"><CustomerShop /></ProtectedRoute>} />
        <Route path="/customer/saved"           element={<ProtectedRoute role="customer"><CustomerSaved /></ProtectedRoute>} />
        <Route path="/customer/service/:id"     element={<ProtectedRoute role="customer"><ServiceDetail /></ProtectedRoute>} />
        <Route path="/customer/vendor/:id"      element={<ProtectedRoute role="customer"><VendorDetail /></ProtectedRoute>} />
        <Route path="/customer/book"            element={<ProtectedRoute role="customer"><BookingFlow /></ProtectedRoute>} />
        <Route path="/customer/my-pets"         element={<ProtectedRoute role="customer"><MyPets /></ProtectedRoute>} />
        <Route path="/customer/pet-docs/:petId" element={<ProtectedRoute role="customer"><PetDocs /></ProtectedRoute>} />
        <Route path="/customer/pet-qr/:petId"   element={<ProtectedRoute role="customer"><PetQR /></ProtectedRoute>} />
        <Route path="/customer/petogram"        element={<ProtectedRoute role="customer"><PetOGram /></ProtectedRoute>} />
        <Route path="/customer/emergency-vet"   element={<ProtectedRoute role="customer"><EmergencyVet /></ProtectedRoute>} />
        <Route path="/customer/lost-found"      element={<ProtectedRoute role="customer"><LostPetRecovery /></ProtectedRoute>} />
        <Route path="/customer/ai-chat"         element={<ProtectedRoute role="customer"><AIChat /></ProtectedRoute>} />
        <Route path="/customer/cart"            element={<ProtectedRoute role="customer"><Cart /></ProtectedRoute>} />
        <Route path="/customer/checkout"        element={<ProtectedRoute role="customer"><Checkout /></ProtectedRoute>} />
        <Route path="/customer/orders"          element={<ProtectedRoute role="customer"><Orders /></ProtectedRoute>} />
        <Route path="/customer/coins"           element={<ProtectedRoute role="customer"><CoinsPage /></ProtectedRoute>} />
        <Route path="/customer/celebrations"    element={<ProtectedRoute role="customer"><Celebrations /></ProtectedRoute>} />
        <Route path="/customer/charity"         element={<ProtectedRoute role="customer"><Charity /></ProtectedRoute>} />
        <Route path="/customer/breeders"        element={<ProtectedRoute role="customer"><Breeders /></ProtectedRoute>} />

        {/* ── Public QR pet profile ── */}
        <Route path="/pet-qr/:petId" element={<PetQR />} />

        {/* ── Admin flow ── */}
        <Route path="/admin"                element={<ProtectedRoute role="admin"><AdminSplash /></ProtectedRoute>} />
        <Route path="/admin/home"           element={<ProtectedRoute role="admin"><AdminHome /></ProtectedRoute>} />
        <Route path="/admin/services"       element={<ProtectedRoute role="admin"><AdminServices /></ProtectedRoute>} />
        <Route path="/admin/vendors"        element={<ProtectedRoute role="admin"><AdminVendors /></ProtectedRoute>} />
        <Route path="/admin/users"          element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/profile"        element={<ProtectedRoute role="admin"><AdminProfile /></ProtectedRoute>} />
        <Route path="/admin/bookings"       element={<ProtectedRoute role="admin"><AdminBookings /></ProtectedRoute>} />
        <Route path="/admin/promo"          element={<ProtectedRoute role="admin"><AdminPromo /></ProtectedRoute>} />
        <Route path="/admin/products"       element={<ProtectedRoute role="admin"><AdminProducts /></ProtectedRoute>} />
        <Route path="/admin/charity"        element={<ProtectedRoute role="admin"><AdminCharity /></ProtectedRoute>} />
        <Route path="/admin/recovery"       element={<ProtectedRoute role="admin"><AdminRecovery /></ProtectedRoute>} />
        <Route path="/admin/celebrations"   element={<ProtectedRoute role="admin"><AdminCelebrations /></ProtectedRoute>} />
        <Route path="/admin/emergency-vets" element={<ProtectedRoute role="admin"><AdminEmergencyVets /></ProtectedRoute>} />

        {/* ── Vendor flow ── */}
        <Route path="/vendor"              element={<ProtectedRoute role="vendor"><VendorSplash /></ProtectedRoute>} />
        <Route path="/vendor/home"         element={<ProtectedRoute role="vendor"><VendorHome /></ProtectedRoute>} />
        <Route path="/vendor/bookings"     element={<ProtectedRoute role="vendor"><VendorBookings /></ProtectedRoute>} />
        <Route path="/vendor/earnings"     element={<ProtectedRoute role="vendor"><VendorEarnings /></ProtectedRoute>} />
        <Route path="/vendor/profile"      element={<ProtectedRoute role="vendor"><VendorProfile /></ProtectedRoute>} />
        <Route path="/vendor/appointments" element={<ProtectedRoute role="vendor"><VendorBookings /></ProtectedRoute>} />
        <Route path="/vendor/pets"         element={<ProtectedRoute role="vendor"><VendorHome /></ProtectedRoute>} />
        <Route path="/vendor/reviews"      element={<ProtectedRoute role="vendor"><VendorHome /></ProtectedRoute>} />
      </Routes>
    </AnimatePresence>
  );
}
