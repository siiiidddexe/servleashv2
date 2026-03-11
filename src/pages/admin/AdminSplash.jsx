import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function AdminSplash() {
  const nav = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-brand-bg flex flex-col">
      {/* Back */}
      <button
        onClick={() => nav("/")}
        className="absolute top-12 left-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft"
      >
        <ArrowLeft size={20} className="text-brand-dark" />
      </button>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <motion.div
          className="h-24 w-24 rounded-3xl bg-brand-orange/10 flex items-center justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <ShieldCheck size={48} className="text-brand-orange" />
        </motion.div>

        <motion.h1
          className="mt-6 text-[26px] font-extrabold text-brand-dark leading-tight"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          Admin Panel
        </motion.h1>
        <motion.p
          className="mt-3 text-[15px] text-brand-medium leading-relaxed max-w-[280px]"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          Manage users, vendors, services, and monitor platform health
        </motion.p>
      </div>

      {/* Actions */}
      <motion.div
        className="px-5 pb-10 space-y-3"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        <button onClick={() => nav("/admin/login")} className="btn-primary w-full">
          Sign In
        </button>
        <button onClick={() => nav("/admin/signup")} className="btn-outline w-full">
          Create Account
        </button>
      </motion.div>
    </div>
  );
}
