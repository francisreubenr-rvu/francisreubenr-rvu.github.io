/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cormorant', 'Georgia', 'serif'],
        body:    ['Hanken Grotesk', 'system-ui', 'sans-serif'],
        mono:    ['DM Mono', 'monospace'],
      },
      colors: {
        cream:  '#F5EFEB',
        char:   '#F5EFEB',
        salmon: { DEFAULT: '#F1B497', hover: '#DEA083' },
        stone:  '#9a9997',
        tan:    'rgba(255,255,255,0.18)',
      },
      letterSpacing: {
        widest2: '0.2em',
      },
      fontWeight: {
        '300': '300',
      },
    },
  },
  plugins: [],
}
