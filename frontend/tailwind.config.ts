import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#FDF2F4",
          100: "#FAE5E8",
          200: "#F5CCD2",
          300: "#E8A5AE",
          400: "#D48B95",
          500: "#B76E79",
          600: "#A25A64",
          700: "#8A4C55",
          800: "#734049",
          900: "#5E3540",
          950: "#3D1F28",
        },
        secondary: {
          50: "#FCF3F4",
          100: "#F8E4E7",
          200: "#F2CDD2",
          300: "#E5A3AC",
          400: "#D17682",
          500: "#A8485A",
          600: "#8C3545",
          700: "#722F37",
          800: "#612A32",
          900: "#53272F",
          950: "#2E1116",
        },
        accent: {
          50: "#FBF8EB",
          100: "#F7EFCF",
          200: "#EFDE9F",
          300: "#E5C866",
          400: "#D4AF37",
          500: "#C89B2A",
          600: "#AC7A21",
          700: "#8A5B1E",
          800: "#734A20",
          900: "#633E22",
          950: "#3A2010",
        },
      },
      fontFamily: {
        heading: ['"Playfair Display"', "Georgia", "serif"],
        body: ['"Inter"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
