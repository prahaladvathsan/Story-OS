import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["'Space Grotesk'", "'Segoe UI'", "sans-serif"],
      },
      colors: {
        ink: {
          50: "#f7f5ef",
          100: "#ece7d6",
          200: "#d7ccb0",
          300: "#baa979",
          400: "#9a864c",
          500: "#7d6b34",
          600: "#66552a",
          700: "#4d4022",
          800: "#332b19",
          900: "#18120b",
        },
        ember: {
          50: "#fff5eb",
          100: "#ffe6cc",
          200: "#ffc88f",
          300: "#ffa14f",
          400: "#f47f23",
          500: "#d86511",
          600: "#aa4b0d",
          700: "#7c340d",
          800: "#522110",
          900: "#2e1009",
        },
        moss: {
          50: "#eef6eb",
          100: "#d8ead0",
          200: "#b3d3a2",
          300: "#85b56f",
          400: "#619449",
          500: "#477335",
          600: "#36582b",
          700: "#294122",
          800: "#1d2b19",
          900: "#10180f",
        },
        sea: {
          50: "#eef7f8",
          100: "#d4edf1",
          200: "#a7dbe4",
          300: "#71bfd2",
          400: "#4697b0",
          500: "#2d788f",
          600: "#245f72",
          700: "#1f4b5a",
          800: "#17323d",
          900: "#0c1a22",
        },
      },
      boxShadow: {
        card: "0 18px 60px rgba(18, 25, 32, 0.14)",
      },
      backgroundImage: {
        "paper-texture":
          "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.6), transparent 32%), radial-gradient(circle at 80% 0%, rgba(255,230,204,0.32), transparent 20%), linear-gradient(135deg, rgba(255,255,255,0.8), rgba(236,231,214,0.6))",
      },
    },
  },
  plugins: [],
} satisfies Config;

