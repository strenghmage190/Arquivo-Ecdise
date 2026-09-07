/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'institutional-red': 'var(--institutional-red)',
        'el-sangue': 'var(--el-sangue)',
        'el-morte': 'var(--el-morte)',
        'el-morte-border': 'var(--el-morte-border)',
        'el-energia': 'var(--el-energia)',
        'el-conhecimento': 'var(--el-conhecimento)',
      },
      fontFamily: {
        oculto: ['Cinzel', 'serif'],
        terminal: ['Share Tech Mono', 'monospace'],
        documento: ['Special Elite', 'cursive'],
        ameaca: ['Teko', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

