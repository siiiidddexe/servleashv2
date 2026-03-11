import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { motion } from "framer-motion";
import { User, Mail, Shield, Store, Users as UsersIcon } from "lucide-react";
import AdminNav from "../../components/AdminNav";

const ROLE_COLORS = {
  customer: { bg: "bg-orange-50", text: "text-brand-orange" },
  vendor: { bg: "bg-green-50", text: "text-brand-green" },
  admin: { bg: "bg-blue-50", text: "text-blue-500" },
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    api.getAdminUsers(roleFilter || undefined)
      .then(u => { setUsers(u); setLoading(false); })
      .catch(() => setLoading(false));
  }, [roleFilter]);

  const counts = {
    all: users.length,
    customer: users.filter(u => u.role === "customer").length,
    vendor: users.filter(u => u.role === "vendor").length,
    admin: users.filter(u => u.role === "admin").length,
  };

  const filters = [
    { key: "", label: "All", icon: UsersIcon },
    { key: "customer", label: "Customers", icon: User },
    { key: "vendor", label: "Vendors", icon: Store },
    { key: "admin", label: "Admins", icon: Shield },
  ];

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4">
        <p className="text-[13px] text-brand-light font-medium">Admin Panel</p>
        <h1 className="text-[22px] font-bold text-brand-dark">Users</h1>
      </div>

      {/* Filters */}
      <div className="px-5 mt-4 flex gap-2 overflow-x-auto no-scrollbar">
        {filters.map(f => {
          const Icon = f.icon;
          const active = roleFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setRoleFilter(f.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors ${
                active ? "bg-brand-orange text-white" : "bg-white text-brand-medium border border-brand-border-light"
              }`}
            >
              <Icon size={14} />
              {f.label}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="px-5 mt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16"><span className="spinner" /></div>
        ) : users.length === 0 ? (
          <p className="text-center text-[13px] text-brand-light py-16">No users found</p>
        ) : (
          users.map((u, i) => {
            const rc = ROLE_COLORS[u.role] || ROLE_COLORS.customer;
            return (
              <motion.div
                key={u.id}
                className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-soft"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div className="h-10 w-10 shrink-0 rounded-full bg-brand-orange/10 flex items-center justify-center">
                  <User size={18} className="text-brand-orange" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-brand-dark truncate">{u.name}</p>
                  <p className="text-[12px] text-brand-light flex items-center gap-1">
                    <Mail size={10} /> {u.email}
                  </p>
                  {u.city && <p className="text-[11px] text-brand-light mt-0.5">{u.city}</p>}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rc.bg} ${rc.text}`}>
                  {u.role}
                </span>
              </motion.div>
            );
          })
        )}
      </div>

      <AdminNav />
    </div>
  );
}
