/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#FC8019",
          "orange-dark": "#e6740f",
          "orange-light": "#ffa64d",
          dark: "#3d4152",
          medium: "#686b78",
          light: "#93959f",
          border: "#d4d5d9",
          "border-light": "#e8e8e8",
          bg: "#f8f8f8",
          "bg-dark": "#f1f1f6",
          white: "#ffffff",
          green: "#48c78e",
          "green-dark": "#36b37e",
          red: "#e53e3e",
          "red-light": "#ff6b6b",
          warm: "#2b1e16",
        },
      },
      fontFamily: {
        sans: ["Nunito", "system-ui", "-apple-system", "sans-serif"],
        display: ["Quicksand", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 8px rgba(0,0,0,0.04)",
        card: "0 2px 12px rgba(0,0,0,0.06)",
        elevated: "0 4px 20px rgba(0,0,0,0.08)",
        "bottom-bar": "0 -2px 12px rgba(0,0,0,0.06)",
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
