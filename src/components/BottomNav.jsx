import { useNavigate, useLocation } from "react-router-dom";
import { Home, CalendarDays, ShoppingBag, Heart, User, PawPrint, Camera, ShoppingCart, MessageCircle, Coins, DollarSign } from "lucide-react";

const TAB_SETS = {
  home_delivery: [
    { label: "Home", icon: Home, path: "/home" },
    { label: "Bookings", icon: CalendarDays, path: "/appointments" },
    { label: "Saved", icon: Heart, path: "/saved" },
    { label: "Profile", icon: User, path: "/profile" },
  ],
  in_store: [
    { label: "Home", icon: Home, path: "/home" },
    { label: "Bookings", icon: CalendarDays, path: "/appointments" },
    { label: "Saved", icon: Heart, path: "/saved" },
    { label: "Profile", icon: User, path: "/profile" },
  ],
  ecommerce: [
    { label: "Home", icon: Home, path: "/home" },
    { label: "Shop", icon: ShoppingBag, path: "/shop" },
    { label: "Cart", icon: ShoppingCart, path: "/cart" },
    { label: "Orders", icon: CalendarDays, path: "/orders" },
    { label: "Profile", icon: User, path: "/profile" },
  ],
  shop: [
    { label: "Home", icon: Home, path: "/home" },
    { label: "Shop", icon: ShoppingBag, path: "/shop" },
    { label: "Cart", icon: ShoppingCart, path: "/cart" },
    { label: "Orders", icon: CalendarDays, path: "/orders" },
    { label: "Profile", icon: User, path: "/profile" },
  ],
  my_pets: [
    { label: "Home", icon: Home, path: "/home" },
    { label: "My Pets", icon: PawPrint, path: "/my-pets" },
    { label: "Bookings", icon: CalendarDays, path: "/appointments" },
    { label: "Profile", icon: User, path: "/profile" },
  ],
  petogram: [
    { label: "Home", icon: Home, path: "/home" },
    { label: "Pet-O-Gram", icon: Camera, path: "/petogram" },
    { label: "AI Chat", icon: MessageCircle, path: "/ai-chat" },
    { label: "Profile", icon: User, path: "/profile" },
  ],
  emergency: [
    { label: "Home", icon: Home, path: "/home" },
    { label: "Emergency", icon: Home, path: "/emergency-vet" },
    { label: "Lost & Found", icon: Heart, path: "/lost-found" },
    { label: "Profile", icon: User, path: "/profile" },
  ],
  recovery: [
    { label: "Home", icon: Home, path: "/home" },
    { label: "Emergency", icon: Home, path: "/emergency-vet" },
    { label: "Lost & Found", icon: Heart, path: "/lost-found" },
    { label: "Profile", icon: User, path: "/profile" },
  ],
  ai_chat: [
    { label: "Home", icon: Home, path: "/home" },
    { label: "Pet-O-Gram", icon: Camera, path: "/petogram" },
    { label: "AI Chat", icon: MessageCircle, path: "/ai-chat" },
    { label: "Profile", icon: User, path: "/profile" },
  ],
  coins: [
    { label: "Home", icon: Home, path: "/home" },
    { label: "Coins", icon: Coins, path: "/coins" },
    { label: "Shop", icon: ShoppingBag, path: "/shop" },
    { label: "Profile", icon: User, path: "/profile" },
  ],
  celebrations: [
    { label: "Home", icon: Home, path: "/home" },
    { label: "Bookings", icon: CalendarDays, path: "/appointments" },
    { label: "Saved", icon: Heart, path: "/saved" },
    { label: "Profile", icon: User, path: "/profile" },
  ],
  charity: [
    { label: "Home", icon: Home, path: "/home" },
    { label: "Shop", icon: ShoppingBag, path: "/shop" },
    { label: "Charity", icon: Heart, path: "/charity" },
    { label: "Profile", icon: User, path: "/profile" },
  ],
  breeders: [
    { label: "Home", icon: Home, path: "/home" },
    { label: "Breeders", icon: PawPrint, path: "/breeders" },
    { label: "Saved", icon: Heart, path: "/saved" },
    { label: "Profile", icon: User, path: "/profile" },
  ],
  vendor_default: [
    { label: "Home", icon: Home, path: "/home" },
    { label: "Bookings", icon: CalendarDays, path: "/bookings" },
    { label: "Earnings", icon: DollarSign, path: "/earnings" },
    { label: "Profile", icon: User, path: "/profile" },
  ],
  default: [
    { label: "Home", icon: Home, path: "/home" },
    { label: "Bookings", icon: CalendarDays, path: "/appointments" },
    { label: "Shop", icon: ShoppingBag, path: "/shop" },
    { label: "Saved", icon: Heart, path: "/saved" },
    { label: "Profile", icon: User, path: "/profile" },
  ],
};

export default function BottomNav({ base = "/customer", activeTab = "default" }) {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const tabs = TAB_SETS[activeTab] || TAB_SETS.default;

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 bg-white border-t border-gray-100 shadow-bottom-bar">
      <div className="flex h-[60px] items-center justify-around px-2">
        {tabs.map((t) => {
          const full = base + t.path;
          const active = pathname === full || pathname.startsWith(full + "/");
          const Icon = t.icon;
          return (
            <button
              key={t.label}
              onClick={() => nav(full)}
              className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 transition-all"
            >
              {/* Active pill indicator */}
              {active && (
                <span className="absolute -top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-brand-orange" />
              )}
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.6}
                className={active ? "text-brand-orange" : "text-brand-light"}
              />
              <span className={`text-[10px] leading-tight ${
                active ? "font-extrabold text-brand-orange" : "font-medium text-brand-light"
              }`}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
