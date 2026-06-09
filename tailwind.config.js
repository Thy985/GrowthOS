/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#ffffff',
          subtle: '#f9fafb',
          muted: '#f3f4f6',
        },
        border: {
          DEFAULT: '#e5e7eb',
          subtle: '#f3f4f6',
          strong: '#d1d5db',
        },
        text: {
          primary: '#111827',
          secondary: '#6b7280',
          muted: '#9ca3af',
          disabled: '#d1d5db',
        },
        primary: {
          DEFAULT: '#4CAF50',
        },
        secondary: {
          DEFAULT: '#2196F3',
        },
        accent: {
          DEFAULT: '#FFC107',
        },
        purple: {
          DEFAULT: '#9C27B0',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
