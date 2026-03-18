import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Briefcase, Store, CalendarDays, Image, User, Package, Heart, AlertTriangle, PartyPopper, Siren } from "lucide-react";

const tabs = [
  { icon: LayoutDashboard, label: "Home", path: "/admin/home" },
  { icon: Briefcase, label: "Services", path: "/admin/services" },
  { icon: Store, label: "Vendors", path: "/admin/vendors" },
  { icon: CalendarDays, label: "Bookings", path: "/admin/bookings" },
  { icon: Package, label: "Products", path: "/admin/products" },
  { icon: Image, label: "Promo", path: "/admin/promo" },
  { icon: PartyPopper, label: "Events", path: "/admin/celebrations" },
  { icon: Heart, label: "Charity", path: "/admin/charity" },
  { icon: AlertTriangle, label: "Recovery", path: "/admin/recovery" },
  { icon: Siren, label: "Vets", path: "/admin/emergency-vets" },
  { icon: User, label: "Profile", path: "/admin/profile" },
];

export default function AdminNav() {
  const loc = useLocation();
  const nav = useNavigate();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-brand-border-light shadow-bottom-bar z-30">
      <div className="flex items-center overflow-x-auto no-scrollbar py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = loc.pathname === t.path;
          return (
            <button
              key={t.path}
              onClick={() => nav(t.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                active ? "text-brand-orange" : "text-brand-light"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.6} />
              <span className="text-[10px] font-semibold">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
