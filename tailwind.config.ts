import type { Config } from 'tailwindcss'

export default {
  content: [],
  theme: {
    extend: {
      borderRadius: {
        base: '0.5rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
      },
    },
  },
} satisfies Config
