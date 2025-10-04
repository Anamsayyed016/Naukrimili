/** @type {import('postcss').PostcssConfig} */

// Use dynamic imports to avoid import errors during initial build
const config = {
  plugins: [
    'tailwindcss',
    'autoprefixer',
  ],
};

export default config;