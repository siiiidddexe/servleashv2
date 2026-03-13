import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PawPrint, Heart, Shield, ArrowRight, Sparkles } from "lucide-react";

const PLACEHOLDER_IMG =
  "https://cdn.dribbble.com/userupload/3848536/file/original-4f623bccd6f252547abb165cb87a86ae.jpeg?resize=2048x1572&vertical=center";

const slides = [
  {
    id: 0,
    icon: PawPrint,
    badge: "Discover",
    title: "Find Your Perfect\nCompanion",
    subtitle:
      "Browse adorable pets nearby, connect with trusted breeders, and give a furry friend a loving home.",
    accent: "from-teal-400/20 to-teal-500/5",
    iconBg: "bg-teal-500",
    dotColor: "bg-teal-500",
  },
  {
    id: 1,
    icon: Heart,
    badge: "Care",
    title: "Expert Pet Care\nat Your Fingertips",
    subtitle:
      "Book grooming, vet visits, training sessions and more — all from one app. Your pet deserves the best.",
    accent: "from-emerald-400/20 to-teal-500/5",
    iconBg: "bg-emerald-500",
    dotColor: "bg-emerald-500",
  },
  {
    id: 2,
    icon: Sparkles,
    badge: "Community",
    title: "Join Our Pet-Loving\nCommunity",
    subtitle:
      "Share moments on Pet-O-Gram, earn loyalty coins, shop accessories, and celebrate your pet's milestones.",
    accent: "from-teal-500/20 to-cyan-400/5",
    iconBg: "bg-teal-600",
    dotColor: "bg-teal-600",
  },
];

const swipeThreshold = 50;

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0, scale: 0.92 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir) => ({ x: dir > 0 ? -300 : 300, opacity: 0, scale: 0.92 }),
};

export default function Onboarding() {
  const nav = useNavigate();
  const [[page, direction], setPage] = useState([0, 0]);

  const paginate = useCallback(
    (newDir) => {
      const next = page + newDir;
      if (next < 0 || next > 2) return;
      setPage([next, newDir]);
    },
    [page]
  );

  const handleGetStarted = () => {
    localStorage.setItem("servleash_onboarded", "1");
    nav("/login");
  };

  const slide = slides[page];
  const Icon = slide.icon;
  const isLast = page === 2;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white overflow-hidden relative">
      {/* Subtle background pattern */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-teal-50 opacity-60" />
        <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-teal-50 opacity-40" />
        {/* Paw prints decoration */}
        <div className="absolute top-20 right-8 opacity-[0.04]">
          <PawPrint size={80} className="text-teal-900 rotate-[-20deg]" />
        </div>
        <div className="absolute bottom-40 left-6 opacity-[0.03]">
          <PawPrint size={60} className="text-teal-900 rotate-[15deg]" />
        </div>
      </div>

      {/* Skip button */}
      {!isLast && (
        <motion.button
          className="absolute top-5 right-5 z-30 rounded-full px-4 py-1.5 text-[13px] font-semibold text-brand-light backdrop-blur-sm bg-white/60"
          onClick={handleGetStarted}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileTap={{ scale: 0.95 }}
        >
          Skip
        </motion.button>
      )}

      {/* Logo */}
      <motion.div
        className="relative z-10 flex items-center gap-2 px-6 pt-6"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-dark shadow-md">
          <PawPrint size={18} className="text-white" />
        </div>
        <span className="font-display text-lg font-bold text-brand-dark tracking-tight">
          servleash
        </span>
      </motion.div>

      {/* ── Swipeable content ── */}
      <div className="relative z-10 flex flex-1 flex-col">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={(_, { offset, velocity }) => {
              const swipe = Math.abs(offset.x) * velocity.x;
              if (offset.x < -swipeThreshold || swipe < -800) paginate(1);
              else if (offset.x > swipeThreshold || swipe > 800) paginate(-1);
            }}
            className="flex flex-1 flex-col px-6"
          >
            {/* ── Hero image area ── */}
            <div className="mt-4 flex items-center justify-center">
              <div className="relative">
                {/* Gradient glow behind image */}
                <div
                  className={`absolute inset-4 rounded-[2rem] bg-gradient-to-br ${slide.accent} blur-2xl`}
                />
                {/* Image container */}
                <div className="relative h-[300px] w-[300px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-teal-50 to-white shadow-lg ring-1 ring-black/[0.04]">
                  <img
                    src={PLACEHOLDER_IMG}
                    alt="Pet companion"
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                  {/* Gradient overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/80 to-transparent" />
                  {/* Floating badge */}
                  <motion.div
                    className={`absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full ${slide.iconBg} px-3 py-1.5 shadow-md`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Icon size={14} className="text-white" />
                    <span className="text-[11px] font-bold text-white tracking-wide uppercase">
                      {slide.badge}
                    </span>
                  </motion.div>
                </div>

                {/* Decorative floating elements */}
                <motion.div
                  className="absolute -top-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-card"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                >
                  <PawPrint size={18} className="text-teal-500" />
                </motion.div>
                <motion.div
                  className="absolute -bottom-1 -left-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-card"
                  animate={{ y: [0, 5, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 2.5,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                >
                  <Heart size={14} className="text-rose-400" />
                </motion.div>
              </div>
            </div>

            {/* ── Text content ── */}
            <div className="mt-8 flex flex-col items-center text-center">
              <motion.h1
                className="font-display text-[26px] font-extrabold leading-tight text-brand-dark whitespace-pre-line"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
              >
                {slide.title}
              </motion.h1>
              <motion.p
                className="mt-3 max-w-[280px] text-[14.5px] leading-relaxed text-brand-medium"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
              >
                {slide.subtitle}
              </motion.p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Pagination dots ── */}
        <div className="flex items-center justify-center gap-2 py-6">
          {slides.map((s, i) => (
            <motion.button
              key={s.id}
              onClick={() => setPage([i, i > page ? 1 : -1])}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === page
                  ? `w-7 ${slide.dotColor}`
                  : "w-2 bg-gray-200 hover:bg-gray-300"
              }`}
              whileTap={{ scale: 0.8 }}
              layout
            />
          ))}
        </div>

        {/* ── Bottom action area ── */}
        <div className="px-6 pb-10">
          {isLast ? (
            <motion.button
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-dark py-4 text-[15px] font-bold text-white shadow-elevated active:scale-[0.98] transition-transform"
              onClick={handleGetStarted}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileTap={{ scale: 0.97 }}
            >
              Get Started
              <ArrowRight size={18} />
            </motion.button>
          ) : (
            <motion.button
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-dark py-4 text-[15px] font-bold text-white shadow-elevated active:scale-[0.98] transition-transform"
              onClick={() => paginate(1)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileTap={{ scale: 0.97 }}
            >
              Continue
              <ArrowRight size={18} />
            </motion.button>
          )}

          {/* Already have an account */}
          <motion.p
            className="mt-4 text-center text-[13.5px] text-brand-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Already have an account?{" "}
            <button
              onClick={() => {
                localStorage.setItem("servleash_onboarded", "1");
                nav("/login");
              }}
              className="font-bold text-brand-orange"
            >
              Sign In
            </button>
          </motion.p>
        </div>
      </div>
    </div>
  );
}
