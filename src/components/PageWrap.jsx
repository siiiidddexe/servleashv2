import { motion } from "framer-motion";

export default function PageWrap({ children, className = "" }) {
  return (
    <motion.div
      className={`min-h-[100dvh] ${className}`}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
