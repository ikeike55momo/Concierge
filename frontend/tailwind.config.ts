import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // パチスロアプリ用カラーパレット
        pachislot: {
          red: {
            50: '#fef2f2',
            100: '#fee2e2', 
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444', // メインレッド
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d',
          },
          orange: {
            50: '#fff7ed',
            100: '#ffedd5',
            200: '#fed7aa',
            300: '#fdba74',
            400: '#fb923c',
            500: '#f97316', // メインオレンジ
            600: '#ea580c',
            700: '#c2410c',
            800: '#9a3412',
            900: '#7c2d12',
          },
          score: {
            excellent: '#16a34a', // 70点以上 - 緑
            good: '#eab308',      // 50-69点 - 黄
            poor: '#ef4444',      // 49点以下 - 赤
          }
        },
      },
    },
  },
  plugins: [],
};
export default config;
