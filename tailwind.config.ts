// Tailwind CSS v4 Configuration
// Note: Most configuration is now in CSS using @theme directive
// This file is only needed for plugins and complex JavaScript configuration

import type { Config } from 'tailwindcss'

const config: Config = {
  // Content paths for file watching (v4 still respects this)
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  
  // Dark mode class strategy
  darkMode: 'class',
  
  // Plugins
  plugins: [
    require('tailwindcss-animate')
  ],
}

export default config

