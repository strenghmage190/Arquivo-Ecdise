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
        system: ['JetBrains Mono', 'Space Mono', 'monospace'],
        hud: ['Chakra Petch', 'Rajdhani', 'sans-serif'],
        case: ['Rajdhani', 'Chakra Petch', 'sans-serif'],
        terminal: ['Share Tech Mono', 'JetBrains Mono', 'monospace'],
        oculto: ['Cinzel', 'serif'],
        documento: ['Special Elite', 'cursive'],
        ameaca: ['Teko', 'sans-serif'],
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
      },
      zIndex: {
        board: 'var(--z-board)',
        connections: 'var(--z-connections)',
        cards: 'var(--z-cards)',
        marquee: 'var(--z-marquee)',
        uv: 'var(--z-uv)',
        hud: 'var(--z-hud)',
        'mobile-bars': 'var(--z-mobile-bars)',
        modals: 'var(--z-modals)',
        cris: 'var(--z-cris)',
        toasts: 'var(--z-toasts)',
        driver: 'var(--z-driver)',
      }
    },
  },
  plugins: [],
}
