// Run from the repository root: npx --yes tailwindcss@3.4.19 --config scripts/kuku-card-tailwind.cjs --output css/kuku-card-master.css --minify
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'system-ui',
          '"Hiragino Maru Gothic ProN"',
          'Meiryo',
          'sans-serif'
        ]
      },
      animation: {
        'bounce-short': 'bounce 0.6s ease-in-out 1',
        shake: 'shake 0.4s ease-in-out 1',
        rainbow: 'rainbow 2s linear infinite',
        'spin-once': 'spinOnce 0.6s ease-out 1',
        pop: 'pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) 1'
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' }
        },
        rainbow: {
          '0%': { borderColor: '#ef4444' },
          '20%': { borderColor: '#f59e0b' },
          '40%': { borderColor: '#10b981' },
          '60%': { borderColor: '#3b82f6' },
          '80%': { borderColor: '#8b5cf6' },
          '100%': { borderColor: '#ef4444' }
        },
        spinOnce: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(360deg)' }
        },
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      }
    }
  },
  content: [ './kuku_card_master.html' ]
};
