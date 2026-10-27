/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        indigo: {
          DEFAULT: "#4F46E5",
          50: "#EEF0FE", 100: "#E0E3FC", 200: "#C2C7FA", 300: "#9CA4F5",
          400: "#7A80F0", 500: "#4F46E5", 600: "#3F35CC", 700: "#332AA6",
          800: "#282180", 900: "#1E195F",
        },
        purple: {
          DEFAULT: "#7C3AED", 50: "#F5EEFE", 100: "#EBDCFD", 200: "#D6B8FB",
          300: "#BC8DF7", 400: "#A362F3", 500: "#7C3AED", 600: "#642FBD",
          700: "#4C2490", 800: "#341963", 900: "#1D0E38",
        },
        teal: {
          DEFAULT: "#14B8A6", 50: "#E9FBF9", 100: "#D3F7F2", 200: "#A1EEE4",
          300: "#69E1D2", 400: "#33CFBC", 500: "#14B8A6", 600: "#0F9385",
          700: "#0C6F64", 800: "#084A43", 900: "#042522",
        },
        ink: "#0F1024",
      },
      fontFamily: {
        display: ["\"Space Grotesk\"", "sans-serif"],
        body: ["\"Inter\"", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(79, 70, 229, 0.25)",
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #4F46E5 0%, #7C3AED 55%, #14B8A6 120%)",
      },
      keyframes: {
        "fade-up": { "0%": { opacity: 0, transform: "translateY(12px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};
