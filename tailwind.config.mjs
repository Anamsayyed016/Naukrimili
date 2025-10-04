/** @type {import('tailwindcss').Config} */
export default {
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
	plugins: [
		// Note: tailwindcss-animate is loaded via dynamic import in Next.js
	],
}
