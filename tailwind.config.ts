import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090a10",
        surface: {
          50: "#131622",
          100: "#181c2c",
          200: "#22273e",
          300: "#2d3350",
          border: "#1f2538",
        },
        brand: {
          cyan: "#00f0ff",
          magenta: "#ff007f",
          purple: "#9d4edd",
          violet: "#7928ca",
          amber: "#f59e0b",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-orbitron)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      boxShadow: {
        neon: "0 0 20px -5px rgba(0, 240, 255, 0.4)",
        magenta: "0 0 20px -5px rgba(255, 0, 127, 0.4)",
        glow: "0 0 35px -8px rgba(157, 78, 221, 0.5)",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.02)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        pulseGlow: "pulseGlow 3s ease-in-out infinite",
        scanline: "scanline 8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
