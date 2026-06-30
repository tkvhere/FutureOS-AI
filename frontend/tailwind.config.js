/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.08), 0 20px 50px rgba(0,0,0,0.35)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        ink: {
          950: '#050816',
          900: '#0a1024',
          800: '#101935',
          700: '#1a2750',
        },
        aurora: {
          500: '#56e6c3',
          600: '#2dd4bf',
          700: '#0f766e',
        },
        ember: {
          400: '#ff9f6e',
          500: '#ff7a59',
          600: '#e2563d',
        },
        gold: {
          400: '#ffd56a',
          500: '#fbbf24',
        },
      },
      backgroundImage: {
        'grid-fade': 'radial-gradient(circle at top, rgba(86,230,195,0.22), transparent 30%), linear-gradient(135deg, rgba(8,12,28,0.96), rgba(6,8,18,1))',
      },
    },
  },
  plugins: [],
}
