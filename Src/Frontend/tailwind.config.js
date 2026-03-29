/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/main.tsx",
    "./src/App.tsx",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/pages/**/*.{js,jsx,ts,tsx}",
    "./src/styles/**/*.{js,jsx,ts,tsx}",
    "./src/utils/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: "#fdf8eb",
          100: "#f9edd0",
          200: "#f2d89a",
          300: "#e8bf5e",
          400: "#d4a843",
          500: "#c8a45e",
          600: "#a8883e",
          700: "#8a6d30",
          800: "#6d5525",
          900: "#5a461f",
        },
        dark: {
          900: "#0a0e14",
          800: "#0f1419",
          700: "#111827",
          600: "#1a2035",
          500: "#1f2937",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
    },
  },
  plugins: [],
};
