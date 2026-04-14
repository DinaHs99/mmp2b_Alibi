/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {

      colors: {
        'alibi-gold':  '#F9A856',   // logo, buttons, username
        'alibi-cream': '#EEE5D4',   // main text
        'alibi-red':   '#FF2B2B',   // alerts, danger, eliminated
        'alibi-black': '#000000',   // text
      },

      fontFamily: {
        'heading': ['Orbitron', 'sans-serif'],        // headings, buttons
        'body':    ['Libre Baskerville', 'serif'],    // text
        'mono':    ['Share Tech Mono', 'monospace'],  // chat
      },

      fontSize: {
        'logo': '130px',  
        'quote':   '32px',
        'subhead': '24px',
        'heading': '20px',
        'body':    '16px',
        'chat':    '14px',

      },
      spacing: {
        '13': '148px',
      }
    },
  },
  plugins: [],
}