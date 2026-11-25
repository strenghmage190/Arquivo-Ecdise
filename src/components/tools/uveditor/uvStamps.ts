export type UVStampCategory = 'elementos' | 'ordem' | 'forense' | 'selos';

export interface UVStampDef {
  id: string;
  name: string;
  category: UVStampCategory;
  defaultColor: string;
  viewBox: string;
  width: number;
  height: number;
  /** SVG inner markup using `currentColor` for tintable strokes/fills */
  svgBody: string;
}

export const UV_STAMP_CATEGORIES: Array<{ id: UVStampCategory; label: string }> = [
  { id: 'elementos', label: 'Elementos' },
  { id: 'ordem', label: 'Ordem' },
  { id: 'forense', label: 'Forense' },
  { id: 'selos', label: 'Selos' },
];

export const UV_STAMPS: UVStampDef[] = [
  // === 5 ELEMENTOS DA ORDEM ===
  {
    id: 'sangue',
    name: 'Sangue',
    category: 'elementos',
    defaultColor: '#ff1744',
    viewBox: '0 0 256 256',
    width: 320,
    height: 320,
    svgBody: `
      <g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="128" cy="128" r="102" stroke-dasharray="14 6" opacity="0.85"/>
        <circle cx="128" cy="128" r="88" stroke-width="4"/>
        <path d="M128 38 C164 92 188 124 188 158 A60 60 0 1 1 68 158 C68 124 92 92 128 38 Z" fill="currentColor" fill-opacity="0.16" stroke-width="7"/>
        <path d="M128 74 L128 192 M96 146 L160 146 M108 118 L148 172 M148 118 L108 172" stroke-width="5"/>
        <circle cx="128" cy="146" r="12" fill="currentColor"/>
      </g>
    `,
  },
  {
    id: 'conhecimento',
    name: 'Conhecimento',
    category: 'elementos',
    defaultColor: '#ffd600',
    viewBox: '0 0 256 256',
    width: 320,
    height: 320,
    svgBody: `
      <g fill="none" stroke="currentColor" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="128,22 224,128 128,234 32,128" fill="currentColor" fill-opacity="0.08"/>
        <polygon points="128,46 202,128 128,210 54,128" stroke-width="3.5"/>
        <path d="M56 128 Q128 64 200 128 Q128 192 56 128 Z" fill="currentColor" fill-opacity="0.14" stroke-width="6"/>
        <circle cx="128" cy="128" r="26" stroke-width="5"/>
        <circle cx="128" cy="128" r="10" fill="currentColor"/>
        <path d="M128 22 L128 76 M128 180 L128 234 M32 128 L56 128 M200 128 L224 128" stroke-width="3.5"/>
      </g>
    `,
  },
  {
    id: 'energia',
    name: 'Energia',
    category: 'elementos',
    defaultColor: '#c084fc',
    viewBox: '0 0 256 256',
    width: 320,
    height: 320,
    svgBody: `
      <g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="128" cy="128" r="98" stroke-dasharray="22 10 6 10"/>
        <polygon points="146,32 76,136 124,136 106,224 184,114 134,114" fill="currentColor" fill-opacity="0.2" stroke-width="6.5"/>
        <path d="M48 78 L80 94 M176 164 L208 180 M204 72 L174 92 M52 178 L84 160" stroke-width="4"/>
      </g>
    `,
  },
  {
    id: 'morte',
    name: 'Morte',
    category: 'elementos',
    defaultColor: '#e2e8f0',
    viewBox: '0 0 256 256',
    width: 320,
    height: 320,
    svgBody: `
      <g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="128" cy="128" r="100" stroke-width="5"/>
        <path d="M128 128
                 C128 112 146 112 146 128
                 C146 150 112 156 106 132
                 C98 100 138 82 164 102
                 C194 124 176 176 132 184
                 C80 194 52 140 72 92
                 C94 42 162 34 200 76" stroke-width="7"/>
        <circle cx="128" cy="128" r="6" fill="currentColor"/>
      </g>
    `,
  },
  {
    id: 'medo',
    name: 'Medo',
    category: 'elementos',
    defaultColor: '#00ffff',
    viewBox: '0 0 256 256',
    width: 320,
    height: 320,
    svgBody: `
      <g fill="none" stroke="currentColor" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="128" cy="128" r="96" stroke-width="4" stroke-dasharray="4 8"/>
        <polygon points="128,28 152,98 224,104 166,148 186,218 128,176 70,218 90,148 32,104 104,98" fill="currentColor" fill-opacity="0.1" stroke-width="5.5"/>
        <circle cx="128" cy="128" r="32" stroke-width="5"/>
        <path d="M128 102 L128 154 M102 128 L154 128" stroke-width="4"/>
      </g>
    `,
  },

  // === SIGILO DA ORDEM ===
  {
    id: 'ordo_realitas',
    name: 'Ordo Realitas',
    category: 'ordem',
    defaultColor: '#b366ff',
    viewBox: '0 0 256 256',
    width: 360,
    height: 360,
    svgBody: `
      <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="128" cy="128" r="110" stroke-width="6"/>
        <circle cx="128" cy="128" r="96" stroke-width="2.5" stroke-dasharray="6 5"/>
        <path d="M128 34 L196 66 L196 134 C196 182 164 210 128 224 C92 210 60 182 60 134 L60 66 Z" fill="currentColor" fill-opacity="0.12" stroke-width="6"/>
        <path d="M84 122 Q128 84 172 122 Q128 160 84 122 Z" stroke-width="5" fill="currentColor" fill-opacity="0.18"/>
        <circle cx="128" cy="122" r="15" stroke-width="4.5"/>
        <circle cx="128" cy="122" r="5" fill="currentColor"/>
        <path d="M128 46 L128 80 M128 164 L128 206 M74 122 L84 122 M172 122 L182 122" stroke-width="3.5"/>
        <text x="128" y="246" text-anchor="middle" fill="currentColor" font-family="monospace" font-weight="700" font-size="18" letter-spacing="4">ORDO REALITAS</text>
      </g>
    `,
  },

  // === FORENSES ===
  {
    id: 'pegadas',
    name: 'Pegadas',
    category: 'forense',
    defaultColor: '#39ff14',
    viewBox: '0 0 256 256',
    width: 300,
    height: 300,
    svgBody: `
      <g fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
        <!-- Left shoe print -->
        <g transform="translate(-14, -8) rotate(-10 88 128)">
          <path d="M68 48 C84 36 106 44 108 72 C110 98 102 126 96 142 L68 142 C60 116 56 64 68 48 Z"/>
          <rect x="66" y="154" width="32" height="36" rx="10"/>
          <path d="M68 72 L106 72 M66 92 L105 92 M66 112 L102 112" stroke-width="3"/>
        </g>
        <!-- Right shoe print -->
        <g transform="translate(18, 22) rotate(8 168 128)">
          <path d="M188 48 C172 36 150 44 148 72 C146 98 154 126 160 142 L188 142 C196 116 200 64 188 48 Z"/>
          <rect x="158" y="154" width="32" height="36" rx="10"/>
          <path d="M150 72 L188 72 M151 92 L190 92 M154 112 L190 112" stroke-width="3"/>
        </g>
      </g>
    `,
  },
  {
    id: 'digitais',
    name: 'Digitais',
    category: 'forense',
    defaultColor: '#00ffff',
    viewBox: '0 0 256 256',
    width: 300,
    height: 300,
    svgBody: `
      <g fill="none" stroke="currentColor" stroke-width="5.5" stroke-linecap="round">
        <path d="M128 32 C76 32 48 72 48 126 C48 176 74 214 128 224 C182 214 208 176 208 126 C208 72 180 32 128 32" stroke-dasharray="90 18 120 16"/>
        <path d="M128 52 C88 52 66 84 66 126 C66 168 88 196 128 204 C168 196 190 168 190 126 C190 84 168 52 128 52" stroke-dasharray="70 16 110 18"/>
        <path d="M128 72 C100 72 84 96 84 128 C84 158 100 180 128 184 C156 180 172 158 172 128 C172 96 156 72 128 72" stroke-dasharray="58 14 96 14"/>
        <path d="M128 92 C112 92 102 108 102 128 C102 148 112 162 128 164 C144 162 154 148 154 128 C154 108 144 92 128 92" stroke-dasharray="44 12 64 12"/>
        <path d="M128 110 C120 110 116 118 116 128 C116 140 122 146 130 146 C138 146 140 138 140 128"/>
        <path d="M128 126 L128 168" stroke-width="4.5"/>
      </g>
    `,
  },
  {
    id: 'marca_mao',
    name: 'Marca de Mão',
    category: 'forense',
    defaultColor: '#ff0033',
    viewBox: '0 0 256 256',
    width: 320,
    height: 320,
    svgBody: `
      <g fill="currentColor" fill-opacity="0.28" stroke="currentColor" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">
        <!-- Palm -->
        <path d="M84 132 C76 156 80 206 116 220 C152 232 184 202 188 164 C190 142 186 122 178 116 L84 132 Z"/>
        <!-- Thumb -->
        <path d="M84 162 C64 152 46 132 42 114 C38 98 54 90 64 104 L88 134"/>
        <!-- Index -->
        <path d="M88 128 L76 58 C74 44 92 40 96 54 L108 122"/>
        <!-- Middle -->
        <path d="M114 120 L114 38 C114 24 134 24 134 38 L134 118"/>
        <!-- Ring -->
        <path d="M140 120 L152 46 C154 32 172 36 170 50 L158 124"/>
        <!-- Pinky -->
        <path d="M164 128 L186 74 C192 62 208 68 202 82 L180 138"/>
      </g>
    `,
  },
  {
    id: 'seta_indicativa',
    name: 'Seta Indicativa',
    category: 'forense',
    defaultColor: '#ffff00',
    viewBox: '0 0 256 256',
    width: 320,
    height: 220,
    svgBody: `
      <g fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M24 112 L152 112 L152 68 L234 128 L152 188 L152 144 L24 144 Z"/>
        <line x1="44" y1="128" x2="178" y2="128" stroke-width="4" stroke-dasharray="10 8"/>
      </g>
    `,
  },
  {
    id: 'alvo_x',
    name: 'Alvo [X]',
    category: 'forense',
    defaultColor: '#ff10f0',
    viewBox: '0 0 256 256',
    width: 300,
    height: 300,
    svgBody: `
      <g fill="none" stroke="currentColor" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="128" cy="128" r="78" stroke-dasharray="28 12"/>
        <circle cx="128" cy="128" r="44" stroke-width="4"/>
        <!-- Brackets -->
        <path d="M44 60 L26 60 L26 196 L44 196 M212 60 L230 60 L230 196 L212 196" stroke-width="7"/>
        <!-- X mark -->
        <path d="M84 84 L172 172 M172 84 L84 172" stroke-width="8"/>
      </g>
    `,
  },

  // === SELOS CARIMBADOS ===
  {
    id: 'selo_confidencial',
    name: 'CONFIDENCIAL',
    category: 'selos',
    defaultColor: '#ff0033',
    viewBox: '0 0 360 120',
    width: 420,
    height: 140,
    svgBody: `
      <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
        <rect x="8" y="10" width="344" height="100" rx="6" stroke-width="7" fill="currentColor" fill-opacity="0.1"/>
        <rect x="18" y="20" width="324" height="80" rx="3" stroke-width="2.5" stroke-dasharray="14 6"/>
        <text x="180" y="73" text-anchor="middle" fill="currentColor" font-family="monospace" font-weight="900" font-size="36" letter-spacing="4">CONFIDENCIAL</text>
      </g>
    `,
  },
  {
    id: 'selo_mentira',
    name: 'MENTIRA',
    category: 'selos',
    defaultColor: '#ff6600',
    viewBox: '0 0 320 120',
    width: 380,
    height: 140,
    svgBody: `
      <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
        <rect x="10" y="12" width="300" height="96" rx="4" stroke-width="8" fill="currentColor" fill-opacity="0.12"/>
        <line x1="22" y1="24" x2="298" y2="24" stroke-width="3"/>
        <line x1="22" y1="96" x2="298" y2="96" stroke-width="3"/>
        <text x="160" y="75" text-anchor="middle" fill="currentColor" font-family="monospace" font-weight="900" font-size="46" letter-spacing="8">MENTIRA</text>
      </g>
    `,
  },
  {
    id: 'selo_olhe_atras',
    name: 'OLHE ATRÁS',
    category: 'selos',
    defaultColor: '#b366ff',
    viewBox: '0 0 360 120',
    width: 420,
    height: 140,
    svgBody: `
      <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
        <rect x="8" y="10" width="344" height="100" rx="6" stroke-width="6.5" stroke-dasharray="24 8" fill="currentColor" fill-opacity="0.1"/>
        <text x="180" y="73" text-anchor="middle" fill="currentColor" font-family="monospace" font-weight="900" font-size="38" letter-spacing="5">OLHE ATRÁS</text>
      </g>
    `,
  },
];

export function buildStampSvg(stamp: UVStampDef, color: string): string {
  const safeColor = color || stamp.defaultColor || '#b366ff';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${stamp.viewBox}" width="${stamp.width}" height="${stamp.height}" style="color:${safeColor}">${stamp.svgBody.replace(/currentColor/g, safeColor)}</svg>`;
}

export function buildStampDataUrl(stamp: UVStampDef, color: string): string {
  const svg = buildStampSvg(stamp, color);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function loadStampImage(stamp: UVStampDef, color: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = buildStampDataUrl(stamp, color);
  });
}
