/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: false,
  theme: {
    extend: {
      colors: {
        primary:    '#0F172A',
        'primary-hover': '#1E293B',
        accent:     '#E85D3A',
        'accent-hover': '#D04D2A',
        background: '#F8FAFC',
        surface:    '#FFFFFF',
        'col-border': '#E2E8F0',
        'text-title':    '#0F172A',
        'text-sub':      '#64748B',
        'text-label':    '#94A3B8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '1rem',
        btn:  '0.5rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.10)',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease',
        'fade-in':  'fadeIn 0.2s ease',
      },
      keyframes: {
        slideIn: {
          from: { transform: 'translateX(20px)', opacity: 0 },
          to:   { transform: 'translateX(0)',    opacity: 1 },
        },
        fadeIn: {
          from: { opacity: 0, transform: 'translateY(-4px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
