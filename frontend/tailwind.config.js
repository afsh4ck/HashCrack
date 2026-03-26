/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          50: '#e0fffe',
          100: '#b3fffe',
          200: '#66fffd',
          300: '#00f3ff',
          400: '#00d4e0',
          500: '#00b5bf',
          600: '#00909a',
          700: '#006b74',
          800: '#00464e',
          900: '#002128',
        },
        neon: {
          purple: '#7c3aed',
          green: '#10b981',
          red: '#ef4444',
          yellow: '#f59e0b',
        },
        surface: {
          900: '#06060b',
          800: '#0a0a12',
          700: '#0d0d16',
          600: '#12121e',
          500: '#1a1a2e',
          400: '#22223a',
        },
      },
      animation: {
        'pulse-fast': 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.25s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'glow': 'glow-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        slideIn: { from: { transform: 'translateY(-6px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 15px rgba(0,243,255,0.15), 0 0 40px rgba(0,243,255,0.08)' },
          '50%': { boxShadow: '0 0 25px rgba(0,243,255,0.25), 0 0 60px rgba(0,243,255,0.12)' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
