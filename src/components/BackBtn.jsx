import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function BackBtn() {
  const nav = useNavigate();
  return (
    <button
      onClick={() => nav(-1)}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft active:scale-95 transition-transform"
      aria-label="Go back"
    >
      <ChevronLeft size={20} className="text-brand-dark" />
    </button>
  );
}
