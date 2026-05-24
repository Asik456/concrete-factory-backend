/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f8f9fa',
          100: '#e9ecef',
          500: '#6c757d',
          700: '#495057',
          800: '#343a40',
          900: '#212529',
        },
        accent: '#f59e0b',
      },
    },
  },
  plugins: [],
}
