/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}', './lib/hosts.ts'],
  theme: {
    extend: {
      ringWidth: {
        3: '3px',
      },
      borderWidth: {
        3: '3px',
      },
      colors: {
        'ocf-brand': '#0C5559',
      },
    },
  },
  plugins: [],
  safelist: [
    {
      pattern:
        /(border|bg|text|decoration)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|500|600)/,
      variants: ['hover', 'focus'],
    },
  ],
};
