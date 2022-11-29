/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      ringWidth: {
        3: '3px',
      },
      borderWidth: {
        3: '3px',
      },
    },
  },
  plugins: [],
  safelist: [
    {
      pattern:
        /(border|bg|text|decoration|ring)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|light-blue|blue|indigo|violet|purple|fuchsia|pink|rose)/,
      variants: ['lg', 'hover', 'focus', 'lg:hover'],
    },
  ],
};
