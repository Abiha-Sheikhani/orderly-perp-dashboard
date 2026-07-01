/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#05060a",
        ink: "#0b0d16",
        panel: "rgba(255,255,255,0.04)",
        line: "rgba(255,255,255,0.08)",
        violet: {
          DEFAULT: "#7c5cff",
          50: "#f2effe",
          400: "#9c86ff",
          500: "#7c5cff",
          600: "#5f3ff0",
          700: "#4b2ed1",
        },
        cyan: {
          DEFAULT: "#22d3ee",
          400: "#4fe3f5",
          500: "#22d3ee",
          600: "#0ea5c4",
        },
        rose: {
          DEFAULT: "#fb4570",
          500: "#fb4570",
          600: "#e11d5c",
        },
        amber: {
          DEFAULT: "#f5a524",
          500: "#f5a524",
        },
        mist: "#8a92a6",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        sans: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        "grad-primary": "linear-gradient(135deg, #7c5cff 0%, #22d3ee 100%)",
        "grad-danger": "linear-gradient(135deg, #fb4570 0%, #f5a524 100%)",
        "grad-radial-violet":
          "radial-gradient(circle at 50% 50%, rgba(124,92,255,0.35), transparent 70%)",
        "grad-radial-cyan":
          "radial-gradient(circle at 50% 50%, rgba(34,211,238,0.28), transparent 70%)",
        noise:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0,0,0,0.45), inset 0 1px 0 0 rgba(255,255,255,0.06)",
        "glow-violet": "0 0 40px -8px rgba(124,92,255,0.55)",
        "glow-cyan": "0 0 40px -8px rgba(34,211,238,0.45)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(34,211,238,0.55)" },
          "70%": { boxShadow: "0 0 0 10px rgba(34,211,238,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(34,211,238,0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        drift: {
          "0%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(2%, -3%) scale(1.05)" },
          "100%": { transform: "translate(0,0) scale(1)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseRing: "pulseRing 2s cubic-bezier(0.4,0,0.6,1) infinite",
        shimmer: "shimmer 2.5s linear infinite",
        drift: "drift 18s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
