/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        api:    { 50: '#E6F1FB', 100: '#B5D4F4', 400: '#378ADD', 600: '#185FA5', 800: '#0C447C' },
        type:   { 50: '#E1F5EE', 100: '#9FE1CB', 400: '#1D9E75', 600: '#0F6E56', 800: '#085041' },
        ui:     { 50: '#FBEAF0', 100: '#F4C0D1', 400: '#D4537E', 600: '#993556', 800: '#72243E' },
        logic:  { 50: '#FAEEDA', 100: '#FAC775', 400: '#BA7517', 600: '#854F0B', 800: '#633806' },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
