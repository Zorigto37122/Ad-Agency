/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          bg:     '#141414',
          card:   '#1e1e1e',
          border: '#2a2a2a',
          hover:  '#252525',
          input:  '#252525',
        },
        accent: {
          green:  '#7DC832',
          orange: '#FF9300',
        },
      },
    },
  },
  plugins: [],
}
