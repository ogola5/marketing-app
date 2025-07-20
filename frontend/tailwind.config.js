/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      // Add your custom color palette here
      colors: {
        'primary-dark': '#0A1128',       // Deep Navy Blue - Trust, Authority, Depth
        'secondary-accent': '#001F54',   // Darker Blue - Stability, Professionalism
        'tertiary-highlight': '#034078', // Medium Blue - Clarity, Intelligence
        'action-light': '#1282A2',       // Vibrant Teal - Innovation, Energy, Growth
        'action-dark': '#03254C',        // Dark Teal - Subtlety, Elegance
        'text-light': '#F8F8F8',         // Off-white for readability on dark backgrounds
        'text-muted': '#B0B0B0',         // Lighter grey for secondary text
      },
    },
  },
  plugins: [],
};