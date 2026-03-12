import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PawPrint, ShieldCheck, Store } from "lucide-react";
import PageWrap from "../components/PageWrap";

const roles = [
  {
    id: "customer",
    title: "Pet Parent",
    desc: "Book services, shop, and care for your pets",
    icon: PawPrint,
    color: "#14B8A6",
    bg: "bg-teal-50",
  },
  {
    id: "admin",
    title: "Admin",
    desc: "Manage platform, vendors, and operations",
    icon: ShieldCheck,
    color: "#48c78e",
    bg: "bg-green-50",
  },
  {
    id: "vendor",
    title: "Vendor",
    desc: "List services, manage bookings, and grow",
    icon: Store,
    color: "#686b78",
    bg: "bg-gray-50",
  },
];

export default function RoleSelect() {
  const nav = useNavigate();

  return (
    <PageWrap>
      <div className="flex min-h-[100dvh] flex-col px-6 pb-10">
        {/* Header */}
        <div className="pt-16 pb-2">
          <motion.div
            className="flex items-center gap-2 mb-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark">
              <PawPrint size={22} className="text-white" />
            </div>
            <span className="font-display text-xl font-bold text-brand-dark">servleash</span>
          </motion.div>
          
          <motion.h1
            className="mt-6 text-[32px] font-extrabold leading-tight text-brand-dark"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            Everything your{"\n"}pet needs.{" "}
            <span className="text-brand-orange">One app.</span>
          </motion.h1>
          
          <motion.p
            className="mt-3 text-[15px] leading-relaxed text-brand-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Grooming, vet visits, food delivery, boarding & more — all at your fingertips.
          </motion.p>
        </div>

        {/* Role cards */}
        <div className="mt-10 space-y-3">
          {roles.map((r, i) => {
            const Icon = r.icon;
            return (
              <motion.button
                key={r.id}
                onClick={() => nav(`/${r.id}`)}
                className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 shadow-soft text-left active:scale-[0.98] transition-transform"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.1, duration: 0.4 }}
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${r.bg}`}>
                  <Icon size={24} style={{ color: r.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-bold text-brand-dark">{r.title}</h3>
                  <p className="mt-0.5 text-[13px] text-brand-medium leading-snug">{r.desc}</p>
                </div>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0 text-brand-border">
                  <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.button>
            );
          })}
        </div>

        {/* Trust badges */}
        <motion.div
          className="mt-auto pt-10 flex items-center justify-center gap-6 text-brand-light"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-semibold">
            <ShieldCheck size={14} /> Verified Vendors
          </div>
          <div className="h-3 w-px bg-brand-border" />
          <div className="flex items-center gap-1.5 text-[11px] font-semibold">
            <PawPrint size={14} /> 10K+ Happy Pets
          </div>
        </motion.div>
      </div>
    </PageWrap>
  );
}
