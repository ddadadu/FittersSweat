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
        hyrox: {
          yellow: '#FFD700',
          dark: '#121212',
          card: '#1E1E1E',
          accent: '#FF3366',
        }
      }
    },
  },
  plugins: [],
}
