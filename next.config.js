/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable CSS modules and CSS-in-JS
  compiler: {
    // Enable SWC minification for better performance
    styledComponents: true,
  },
}

module.exports = nextConfig
