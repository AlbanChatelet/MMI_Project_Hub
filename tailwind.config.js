/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      backgroundImage: {
    'gray-bg': "url('src/assets/bg_img_gray.png')",
  },
    }
  },
  plugins: []
}
