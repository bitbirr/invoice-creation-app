import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0f172a",
          700: "#334155",
          500: "#64748b",
          100: "#f1f5f9",
        },
        brand: {
          700: "#1d4ed8",
          600: "#2563eb",
        },
      },
    },
  },
  plugins: [],
};

export default config;
