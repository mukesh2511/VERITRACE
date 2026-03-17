/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,ts,md}',
    './components/**/*.{js,ts,jsx,tsx,ts,md}',
    './app/**/*.{js,ts,jsx,tsx,ts,md}',
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          bg: 'rgba(255, 255, 255, 0.1)',
          border: 'rgba(255, 255, 255, 0.2)',
          shadow: 'rgba(31, 38, 135, 0.37)',
        },
        primary: {
          gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
        success: {
          gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        },
        warning: {
          gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        }
      },
      backdropBlur: {
        xs: 'blur(4px)',
        sm: 'blur(8px)',
        md: 'blur(12px)',
        lg: 'blur(16px)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.5s ease-out',
      }
    },
  },
  plugins: [],
}
