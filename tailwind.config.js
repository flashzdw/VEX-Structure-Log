/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    // Tailwind v3 content scanner 偶发漏掉 table-* 工具类（含 table-fixed），
    // 显式 safelist 兜底，强制进 dist CSS。
    "table-auto",
    "table-fixed",
    "border-collapse",
    "border-separate",
  ],
  theme: {
    container: {
      center: true,
    },
    extend: {},
  },
  plugins: [],
};
