/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#14171F",
        panel: "#1C2029",
        raised: "#242938",
        line: "#2B3040",
        paper: "#F2F1EA",
        muted: "#9CA3B5",
        amber: {
          DEFAULT: "#E8A33D",
          dim: "#8A6127",
        },
        teal: {
          DEFAULT: "#5FB8A8",
          dim: "#31554E",
        },
        rust: {
          DEFAULT: "#E0654F",
          dim: "#6B3229",
        },
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
}
