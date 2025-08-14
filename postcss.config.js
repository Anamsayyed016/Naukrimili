// Fallback-friendly PostCSS config that doesn't break if tailwindcss isn't installed
// Switches to CommonJS to allow conditional require in environments without Tailwind
module.exports = {
  plugins: [
    (function tryTailwind() {
      try {
        return require('tailwindcss');
      } catch {
        return null;
      }
    })(),
    require('autoprefixer'),
  ].filter(Boolean),
};