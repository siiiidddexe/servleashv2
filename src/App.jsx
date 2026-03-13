import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

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

function OnboardingGate() {
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
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/otp" element={<OtpVerify />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ── Legacy role-prefixed auth routes (redirect compat) ── */}
        <Route path="/customer/login" element={<Login />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/vendor/login" element={<Login />} />

        {/* ── Customer flow ── */}
        <Route path="/customer" element={<CustomerSplash />} />
        <Route path="/customer/home" element={<CustomerHome />} />
        <Route path="/customer/pet/:id" element={<PetDetail />} />
        <Route path="/customer/pets" element={<CustomerHome />} />
        <Route path="/customer/profile" element={<CustomerProfile />} />
        <Route path="/customer/appointments" element={<CustomerAppointments />} />
        <Route path="/customer/shop" element={<CustomerShop />} />
        <Route path="/customer/saved" element={<CustomerSaved />} />
        <Route path="/customer/service/:id" element={<ServiceDetail />} />
        <Route path="/customer/vendor/:id" element={<VendorDetail />} />
        <Route path="/customer/book" element={<BookingFlow />} />
        <Route path="/customer/my-pets" element={<MyPets />} />
        <Route path="/customer/pet-docs/:petId" element={<PetDocs />} />
        <Route path="/customer/pet-qr/:petId" element={<PetQR />} />
        <Route path="/customer/petogram" element={<PetOGram />} />
        <Route path="/customer/emergency-vet" element={<EmergencyVet />} />
        <Route path="/customer/lost-found" element={<LostPetRecovery />} />
        <Route path="/customer/ai-chat" element={<AIChat />} />
        <Route path="/customer/cart" element={<Cart />} />
        <Route path="/customer/checkout" element={<Checkout />} />
        <Route path="/customer/orders" element={<Orders />} />
        <Route path="/customer/coins" element={<CoinsPage />} />
        <Route path="/customer/celebrations" element={<Celebrations />} />
        <Route path="/customer/charity" element={<Charity />} />
        <Route path="/customer/breeders" element={<Breeders />} />

        {/* ── Public QR pet profile ── */}
        <Route path="/pet-qr/:petId" element={<PetQR />} />

        {/* ── Admin flow ── */}
        <Route path="/admin" element={<AdminSplash />} />
        <Route path="/admin/home" element={<AdminHome />} />
        <Route path="/admin/services" element={<AdminServices />} />
        <Route path="/admin/vendors" element={<AdminVendors />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/profile" element={<AdminProfile />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
        <Route path="/admin/promo" element={<AdminPromo />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/charity" element={<AdminCharity />} />
        <Route path="/admin/recovery" element={<AdminRecovery />} />
        <Route path="/admin/celebrations" element={<AdminCelebrations />} />
        <Route path="/admin/emergency-vets" element={<AdminEmergencyVets />} />

        {/* ── Vendor flow ── */}
        <Route path="/vendor" element={<VendorSplash />} />
        <Route path="/vendor/home" element={<VendorHome />} />
        <Route path="/vendor/bookings" element={<VendorBookings />} />
        <Route path="/vendor/earnings" element={<VendorEarnings />} />
        <Route path="/vendor/profile" element={<VendorProfile />} />
        <Route path="/vendor/appointments" element={<VendorBookings />} />
        <Route path="/vendor/pets" element={<VendorHome />} />
        <Route path="/vendor/reviews" element={<VendorHome />} />
      </Routes>
    </AnimatePresence>
  );
}
