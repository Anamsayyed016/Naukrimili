/** @type {import('tailwindcss').Config} */

// Use dynamic import to avoid import errors during initial build
const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [],
};

export default config;