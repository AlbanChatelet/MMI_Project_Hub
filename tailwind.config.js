// tailwind.config.js

/** @type {import('tailwindcss').Config} */
import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      backgroundImage: {
        'gray-bg': "url('src/assets/bg_img_gray.png')",
      },

      fontFamily: {
        // Instrument Sans sera la police par défaut pour tout le texte.
        'sans': ['Instrument Sans', ...defaultTheme.fontFamily.sans],
      },
    }
  },
  plugins: []
}
