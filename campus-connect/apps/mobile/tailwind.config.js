/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Campus Connect brand colors (matching web app)
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#1a73e8', // Main brand blue
          600: '#1565c0',
          700: '#0d47a1',
          800: '#0a3d91',
          900: '#072f70',
        },
        secondary: {
          50: '#f5f5f5',
          100: '#eeeeee',
          200: '#e0e0e0',
          300: '#bdbdbd',
          400: '#9e9e9e',
          500: '#757575',
          600: '#616161',
          700: '#424242',
          800: '#303030',
          900: '#212121',
        },
        success: {
          500: '#4caf50',
          600: '#43a047',
        },
        warning: {
          500: '#ff9800',
          600: '#fb8c00',
        },
        error: {
          500: '#f44336',
          600: '#e53935',
        },
        background: {
          light: '#ffffff',
          dark: '#121212',
        },
        surface: {
          light: '#f8f9fa',
          dark: '#1e1e1e',
        },
      },
      fontFamily: {
        sans: ['System', 'sans-serif'],
        mono: ['SpaceMono', 'monospace'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};










