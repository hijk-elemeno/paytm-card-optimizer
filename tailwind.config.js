/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#002970',
        cyan: { DEFAULT: '#00BAF2', tint: '#EBF8FF' },
        canvas: '#F4F7FA',
        ok: '#0D9488',
        warn: '#D97706',
        alert: '#DC2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
