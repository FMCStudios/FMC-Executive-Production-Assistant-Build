import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        fmc: {
          firestarter: '#E03413',
          copper: '#B45F34',
          carbon: '#0D0D0D',
          steel: '#3E3E3E',
          teal: '#49797B',
          offwhite: '#F0EBE1',
        },
        tourbus: {
          red: '#D42B2B',
          dark: '#1A1A1A',
          cream: '#F5F0E8',
          sky: '#A8D8EA',
          grey: '#4A4A4A',
          maple: '#C41E3A',
        },
        oak: {
          aged: '#8B6914',
          amber: '#C4842D',
          linen: '#FAF6F0',
          charcoal: '#2A2A2A',
          sage: '#7A8B6F',
          warm: '#F5F1EA',
        },
      },
      fontFamily: {
        sans: ['"Avenir Next"', 'Avenir', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        bungee: ['var(--font-bungee-shade)', 'cursive'],
        barlow: ['var(--font-barlow)', 'sans-serif'],
        'barlow-condensed': ['var(--font-barlow-condensed)', 'sans-serif'],
        playfair: ['var(--font-playfair)', 'serif'],
        lora: ['var(--font-lora)', 'serif'],
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        modalIn: {
          '0%': { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        slideUp: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        modalIn: 'modalIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
    },
  },
  plugins: [],
}
export default config
