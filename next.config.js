/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable CSS modules and CSS-in-JS
  compiler: {
    // Enable SWC minification for better performance
    styledComponents: true,
  },
  swcMinify: true,
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
  },
  typescript: {
    ignoreBuildErrors: true, // We'll handle these separately
  },
  eslint: {
    ignoreDuringBuilds: true, // We'll handle these separately
  },
}

module.exports = nextConfig
