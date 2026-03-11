import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, MapPin, LogOut, Shield, ChevronRight } from "lucide-react";
import AdminNav from "../../components/AdminNav";

export default function AdminProfile() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav("/admin/login");
  };

  const items = [
    { icon: User, label: "Name", value: user?.name || "Admin" },
    { icon: Mail, label: "Email", value: user?.email || "—" },
    { icon: MapPin, label: "City", value: user?.city || "—" },
    { icon: Shield, label: "Role", value: user?.role || "admin" },
  ];

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-6 flex flex-col items-center">
        <div className="h-20 w-20 rounded-full bg-brand-orange/10 flex items-center justify-center">
          <User size={36} className="text-brand-orange" />
        </div>
        <h1 className="text-[20px] font-bold text-brand-dark mt-3">{user?.name || "Admin"}</h1>
        <p className="text-[13px] text-brand-light">{user?.email}</p>
      </div>

      {/* Info cards */}
      <div className="px-5 mt-4 space-y-2">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-soft"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="h-9 w-9 rounded-xl bg-brand-bg flex items-center justify-center">
                <Icon size={16} className="text-brand-medium" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-brand-light font-medium">{item.label}</p>
                <p className="text-[14px] font-semibold text-brand-dark">{item.value}</p>
              </div>
              <ChevronRight size={16} className="text-brand-border" />
            </motion.div>
          );
        })}
      </div>

      {/* Logout */}
      <div className="px-5 mt-8">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-50 text-brand-red text-[14px] font-bold"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

      <AdminNav />
    </div>
  );
}
