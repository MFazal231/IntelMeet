/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        panel: '#0f172a',
        accent: '#8b5cf6',
        soft: '#e2e8f0',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(139, 92, 246, 0.2), 0 20px 40px rgba(15, 23, 42, 0.18)',
      },
    },
  },
  plugins: [],
};
