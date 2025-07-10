/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: { // Ensure your keyframes are defined if you plan to use dynamic names or extend default ones
        // If you define keyframes here, you don't need them in App.css, but for custom animations, App.css is fine.
      },
      animation: {
        // If you define custom animations using these keyframes, ensure they are here.
      }
    },
  },
  plugins: [],
}