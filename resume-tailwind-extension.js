/**
 * Resume Professional Theme - Tailwind Extension
 * 
 * This file provides the tailwind configuration extension for the professional
 * resume color scheme. Import and merge this with your existing tailwind config.
 */

const resumeThemeColors = {
  // Primary Colors
  'resume-primary': '#2c3e50',      // Navy Blue - for headings, borders, and primary elements
  'resume-secondary': '#f0f4f8',    // Slate Gray - for backgrounds and secondary elements
  'resume-accent': '#e2e8f0',       // Light Gray - for skill tags and tertiary elements
  
  // Text Colors
  'resume-text-primary': '#2c3e50', // Navy Blue - for headings and important text
  'resume-text-secondary': '#4a5568', // Dark Gray - for body text
  'resume-text-muted': '#718096',   // Medium Gray - for less important text
  
  // Background Colors
  'resume-bg-primary': '#ffffff',   // White - main background
  'resume-bg-secondary': '#f0f4f8', // Slate Gray - secondary background
  'resume-bg-accent': '#e2e8f0',    // Light Gray - accent background
  
  // Status Colors (preserved for functionality)
  'resume-success': '#047857',      // Green - for success states
  'resume-warning': '#b45309',      // Amber - for warning states
  'resume-error': '#b91c1c',        // Red - for error states
};

/**
 * How to use this extension:
 * 
 * 1. Import this file in your tailwind.config.js or tailwind.config.ts
 * 
 * 2. Merge the colors with your existing theme:
 * 
 * // tailwind.config.js example
 * const resumeColors = require('./resume-tailwind-extension');
 * 
 * module.exports = {
 *   theme: {
 *     extend: {
 *       colors: {
 *         ...resumeColors,
 *         // Your other custom colors
 *       },
 *     },
 *   },
 * };
 * 
 * // tailwind.config.ts example
 * import type { Config } from "tailwindcss";
 * import resumeColors from "./resume-tailwind-extension";
 * 
 * const config: Config = {
 *   theme: {
 *     extend: {
 *       colors: {
 *         ...resumeColors,
 *         // Your other custom colors
 *       },
 *     },
 *   },
 * };
 * 
 * export default config;
 */

/**
 * Usage in your components:
 * 
 * Replace yellow backgrounds with professional theme colors:
 * 
 * Before:
 * <div className="bg-yellow-300">ATS Score</div>
 * 
 * After:
 * <div className="bg-resume-secondary text-resume-text-primary">ATS Score</div>
 * 
 * For skill tags:
 * <span className="bg-resume-accent text-resume-text-primary rounded-full px-3 py-1">JavaScript</span>
 * 
 * For section headers:
 * <h3 className="text-resume-primary font-semibold text-lg">Work Experience</h3>
 */

module.exports = resumeThemeColors;