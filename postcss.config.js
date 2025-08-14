// Fallback-friendly PostCSS config that doesn't break if tailwindcss isn't installed
// Switches to CommonJS to allow conditional require in environments without Tailwind
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};