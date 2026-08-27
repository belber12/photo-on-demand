/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#1c1917',
          soft: '#57534e',
          muted: '#8a857f',
        },
        paper: {
          DEFAULT: '#faf7f2',
          warm: '#f3eee6',
          card: '#ffffff',
        },
        brand: {
          DEFAULT: '#b3541e',
          dark: '#8f3f14',
          soft: '#f4e3d4',
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
