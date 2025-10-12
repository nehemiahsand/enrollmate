/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e6f4f0",
          100: "#cce9e1",
          200: "#99d3c3",
          300: "#66bda5",
          400: "#33a787",
          500: "#1E6B52", // UAB Green (main)
          600: "#185646",
          700: "#134039",
          800: "#0d2b2d",
          900: "#071520",
        },
        accent: {
          50: "#fff9e6",
          100: "#fff3cc",
          200: "#ffe799",
          300: "#ffdb66",
          400: "#ffcf33",
          500: "#FFB81C", // UAB Gold (main)
          600: "#cc9316",
          700: "#996e11",
          800: "#66490b",
          900: "#332506",
        },
      },
    },
  },
  plugins: [],
};
