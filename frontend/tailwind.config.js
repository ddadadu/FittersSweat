/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#0A0A0A',
        surface: '#141414',
        elevated: '#1F1F1F',
        subtle: '#262626',
        hyrox: {
          gold: '#FFD700',
          lime: '#CCFF00',
          yellow: '#FFD700',
          dark: '#0A0A0A',
          card: '#141414',
          accent: '#FF3366',
        },
      },
    },
  },
  plugins: [],
};
