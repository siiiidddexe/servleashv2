import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Scissors, Stethoscope, Truck, Dog } from "lucide-react";
import PageWrap from "../../components/PageWrap";

const highlights = [
  { icon: Scissors, label: "Grooming" },
  { icon: Stethoscope, label: "Vet Care" },
  { icon: Truck, label: "Delivery" },
  { icon: Dog, label: "Boarding" },
];

export default function CustomerSplash() {
  const nav = useNavigate();
  return (
    <PageWrap>
      <div className="flex min-h-[100dvh] flex-col bg-white">
        {/* Hero image area */}
        <div className="relative h-[55vh] overflow-hidden bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center">
          <div className="text-center px-8">
            <motion.div
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-orange/10"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            >
              <Dog size={40} className="text-brand-orange" />
            </motion.div>
            <motion.p
              className="text-sm font-semibold text-brand-orange tracking-wide uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              IMG-SPLASH-HERO
            </motion.p>
            <motion.p
              className="mt-1 text-xs text-brand-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Replace with hero illustration
            </motion.p>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col px-6 pt-8 pb-10 -mt-6 bg-white rounded-t-3xl relative z-10">
          <motion.h1
            className="text-[28px] font-extrabold leading-tight text-brand-dark"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Your pet deserves{"\n"}the <span className="text-brand-orange">best care</span>
          </motion.h1>

          <motion.p
            className="mt-3 text-[15px] text-brand-medium leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Book grooming, vet visits, meals & more from verified vendors near you.
          </motion.p>

          {/* Service chips */}
          <motion.div
            className="mt-6 flex gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {highlights.map((h) => {
              const Icon = h.icon;
              return (
                <div key={h.label} className="flex flex-col items-center gap-1.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-bg">
                    <Icon size={20} className="text-brand-medium" />
                  </div>
                  <span className="text-[11px] font-semibold text-brand-medium">{h.label}</span>
                </div>
              );
            })}
          </motion.div>

          {/* CTA */}
          <div className="mt-auto pt-8 space-y-3">
            <motion.button
              className="btn-primary flex items-center justify-center gap-2"
              onClick={() => nav("/customer/login")}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileTap={{ scale: 0.98 }}
            >
              Get Started <ArrowRight size={18} />
            </motion.button>
            <motion.button
              className="btn-outline"
              onClick={() => nav("/customer/signup")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Create an account
            </motion.button>
          </div>
        </div>
      </div>
    </PageWrap>
  );
}
