import { motion } from "framer-motion";

export default function PageWrap({ children, className = "" }) {
  return (
    <motion.div
      className={`min-h-[100dvh] ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}
