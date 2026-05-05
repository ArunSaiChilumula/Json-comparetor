export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        glow: "0 0 40px rgba(56, 189, 248, 0.18)",
      },
      backgroundImage: {
        "hero-glow": "radial-gradient(circle at top, rgba(56, 189, 248, 0.18), transparent 35%)",
      },
    },
  },
  plugins: [],
};
