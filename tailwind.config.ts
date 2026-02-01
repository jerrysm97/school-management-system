import type { Config } from "tailwindcss";
const { fontFamily } = require("tailwindcss/defaultTheme");

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // 1. Precise Geometric Radius (Golden Ratio inspired)
      borderRadius: {
        xl: "1rem",
        lg: "var(--radius)", // Controlled by CSS variable (e.g., 0.75rem)
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      // 2. High-Fidelity Color Palette
      colors: {
        border: "hsl(var(--border) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",

        // Standard Utility Colors (Restored)
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",

        // "Surface" logic: deeper layers than just 'card'
        surface: {
          low: "hsl(var(--surface-low) / <alpha-value>)",    // Sunken elements
          base: "hsl(var(--surface-base) / <alpha-value>)",  // Main background
          high: "hsl(var(--surface-high) / <alpha-value>)",  // Cards/Popups
        },

        // Brand & Interaction
        brand: {
          DEFAULT: "hsl(var(--brand))",
          muted: "hsl(var(--brand-muted))",
          glow: "hsl(var(--brand-glow) / 0.15)", // For soft glows
        },

        // Semantic states with HSL for better blending
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        critical: "hsl(var(--critical))",
      },

      // 3. Custom Depth System
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'inner-glow': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)',
        'soft-ring': '0 0 0 4px hsl(var(--brand) / 0.1)',
      },

      // 4. Kinetic Animations (Fluidity)
      keyframes: {
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "reveal": {
          from: { opacity: "0", transform: "translateY(10px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "border-beam": {
          "100%": { "offset-distance": "100%" },
        },
      },
      animation: {
        "float": "float 3s ease-in-out infinite",
        "reveal": "reveal 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "border-beam": "border-beam calc(var(--duration)*1s) infinite linear",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    // Custom plugin for "glass" utility
    function ({ addUtilities }: any) {
      addUtilities({
        '.glass': {
          'background': 'rgba(255, 255, 255, 0.03)',
          'backdrop-filter': 'blur(12px)',
          'border': '1px solid rgba(255, 255, 255, 0.08)',
        },
      })
    }
  ],
} satisfies Config;