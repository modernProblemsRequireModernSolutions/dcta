import type { Config } from "tailwindcss";

// DBS-like red/white styling, mobile-first (SPEC §9). No real DBS logo (prototype).
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // DBS-like red accent
        dbs: {
          DEFAULT: "#E2231A",
          dark: "#B11E16",
          light: "#FCE8E7",
        },
        ink: "#1A1A1A",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
