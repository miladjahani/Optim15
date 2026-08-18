/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        lime: '#00ff88',
        cyan: '#00f0ff',
        amber: '#ffb454',
        rose: '#ff4d6d'
      },
      fontFamily: {
        sans: ['Vazirmatn', 'Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  },
  plugins: []
};
