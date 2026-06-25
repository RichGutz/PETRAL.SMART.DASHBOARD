/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        petral: {
          blue: '#1E40AF', // Azul corporativo
          teal: '#0D9488', // Teal corporativo
          lightBlue: '#DBEAFE', // Row headers 
          lightGreen: '#D1FAE5' // Row headers
        }
      }
    },
  },
  plugins: [],
}
