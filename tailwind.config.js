/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          // Primary accent — Vibrant Teal
          orange: "#14B8A6",
          "orange-dark": "#0d9488",
          "orange-light": "#2dd4bf",
          // Text / Navy
          dark: "#0F172A",
          medium: "#334155",
          light: "#64748b",
          // Borders & surfaces
          border: "#cbd5e1",
          "border-light": "#e2e8f0",
          bg: "#ffffff",
          "bg-dark": "#f8fafc",
          white: "#ffffff",
          // Status
          green: "#10b981",
          "green-dark": "#059669",
          red: "#ef4444",
          "red-light": "#f87171",
          warm: "#0F172A",
        },
        // Semantic aliases for direct use
        teal: {
          50:  "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14B8A6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
        navy: {
          50:  "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0F172A",
        },
      },
      fontFamily: {
        sans: ["Nunito", "system-ui", "-apple-system", "sans-serif"],
        display: ["Quicksand", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 8px rgba(15,23,42,0.04)",
        card: "0 2px 12px rgba(15,23,42,0.07)",
        elevated: "0 4px 24px rgba(15,23,42,0.10)",
        "bottom-bar": "0 -2px 16px rgba(15,23,42,0.08)",
        teal: "0 4px 20px rgba(20,184,166,0.25)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.5s ease-out both",
        "slide-in-right": "slideInRight 0.4s ease-out both",
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          from: { opacity: "0", transform: "translateX(24px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
