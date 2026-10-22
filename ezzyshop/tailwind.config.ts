import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      textShadow: {
        glow: "0 0 5px #d0a348, 0 0 8px #d0a348, 0 0 8px #d0a348, 0 0 8px #d0a348, 0 0 8px #d0a348",
      },
      boxShadow: {
        blueGlow: "0 0 20px rgba(59, 130, 246, 0.18)",
        greenGlow: "0 0 20px rgba(16, 185, 129, 0.18)",
        orangeGlow: "0 0 20px rgba(245,158,11,0.20)",
        grayGlow: "0 0 20px rgba(156,163,175,0.15)",
      },
      gold: {
        DEFAULT: '#b98432',
        light:   '#e8c96d',
        muted:   '#8a7040',
        dim:     '#7a7060',
        darker:  '#5a5040',
        deep:    '#4a4030',
      },
      luxury: {
        black:  '#0a0a0a',
        dark:   '#111111',
        card:   '#1a1a14',
      },
    },
  },
  plugins: [require("tailwindcss-textshadow")],
  presets: [require("shadcn/tailwind")],
};

export default config;
