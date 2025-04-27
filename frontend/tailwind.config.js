/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'music-primary': '#3b82f6',
        'music-secondary': '#8b5cf6',
        'music-tertiary': '#2dd4bf',
        'music-dark': '#0f172a',
        'music-light': '#f8fafc',
        'glass': 'rgba(15, 23, 42, 0.6)',
        'glass-dark': 'rgba(15, 23, 42, 0.8)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      backgroundColor: {
        'glass': 'rgba(255, 255, 255, 0.15)',
        'glass-dark': 'rgba(17, 24, 39, 0.75)'
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
        'glass-border': 'inset 0 0 0 1px rgba(255, 255, 255, 0.15)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      gradientColorStops: theme => ({
        ...theme('colors'),
        'music-gradient-start': '#8B5CF6',
        'music-gradient-end': '#EC4899'
      }),
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
} 