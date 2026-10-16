/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0B172A",     // Azul noche profundo
          navy: "#0F2137",     // Azul de Construlogica
          navyLight: "#1E293B",
          yellow: "#FBBF24",   // Amarillo electricista
          amber: "#F59E0B",
          gold: "#D4AF37",     // Oro institucional para marco de presupuestos
          goldLight: "#FAF3E0",
        },
      },
    },
  },
  plugins: [],
};
