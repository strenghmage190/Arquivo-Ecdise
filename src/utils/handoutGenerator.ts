export type HandoutTemplateId =
  | 'cris_report'
  | 'newspaper'
  | 'diary'
  | 'forensic_laudo'
  | 'polaroid';

export type HandoutSecretMode = 'none' | 'uv' | 'thermal';
export type HandoutSecretPosition = 'top' | 'center' | 'bottom' | 'diagonal';

export interface HandoutConfig {
  template: HandoutTemplateId;
  title: string;
  subtitle: string;
  dateLine: string;
  body: string;
  stamp: string;
  signature: string;
  aging: number; // 0..100
  secretMode: HandoutSecretMode;
  secretText: string;
  secretPosition: HandoutSecretPosition;
}

export interface HandoutTemplateMeta {
  id: HandoutTemplateId;
  label: string;
  description: string;
  width: number;
  height: number;
  defaultTitle: string;
  defaultSubtitle: string;
  defaultDate: string;
  defaultStamp: string;
}

export const HANDOUT_TEMPLATES: HandoutTemplateMeta[] = [
  {
    id: 'cris_report',
    label: 'Relatório C.R.I.S.',
    description: 'Dossiê oficial da Ordo com tarjas de censura ||texto|| e carimbo',
    width: 760,
    height: 1020,
    defaultTitle: 'RELATÓRIO DE INCIDENTE #409',
    defaultSubtitle: 'SETOR DE CONTENÇÃO — ARQUIVO ECDISE',
    defaultDate: 'PROTOCOLO: 24/11/2026 · CLASSIFICAÇÃO: NÍVEL 4',
    defaultStamp: 'CONFIDENCIAL',
  },
  {
    id: 'newspaper',
    label: 'Recorte de Jornal',
    description: 'Manchete em papel envelhecido com duas colunas jornalísticas',
    width: 760,
    height: 980,
    defaultTitle: 'DESAPARECIMENTO MISTERIOSO NO SETOR NORTE',
    defaultSubtitle: 'Testemunhas relatam interferência de rádio antes do blecaute',
    defaultDate: 'GAZETA METROPOLITANA · EDIÇÃO EXTRA · 14 DE OUTUBRO',
    defaultStamp: 'ARQUIVO',
  },
  {
    id: 'diary',
    label: 'Diário / Carta',
    description: 'Folha pautada amarelada com escrita manuscrita e assinatura',
    width: 760,
    height: 1000,
    defaultTitle: '19 de Outubro — 03:14',
    defaultSubtitle: 'Não consigo mais desligar o gravador.',
    defaultDate: 'Caderno encontrado na mesa',
    defaultStamp: '',
  },
  {
    id: 'forensic_laudo',
    label: 'Laudo Forense',
    description: 'Prontuário técnico de perícia / autópsia com tabela de dados',
    width: 760,
    height: 1020,
    defaultTitle: 'LAUDO PERICIAL Nº 088-B',
    defaultSubtitle: 'INSTITUTO DE ANÁLISE PARANORMAL & FORENSE',
    defaultDate: 'EXAME REALIZADO EM: 21/11/2026 · PERITO: DR. A. MENDES',
    defaultStamp: 'SIGILO TOTAL',
  },
  {
    id: 'polaroid',
    label: 'Foto Polaroid',
    description: 'Moldura instantânea clássica com legenda manuscrita',
    width: 720,
    height: 860,
    defaultTitle: 'Galpão 04 — Antes do Incêndio',
    defaultSubtitle: 'Verso contém resíduos químicos',
    defaultDate: '22:40 · CAM-02',
    defaultStamp: 'EVIDÊNCIA',
  },
];

export function getHandoutTemplateMeta(id: HandoutTemplateId): HandoutTemplateMeta {
  return HANDOUT_TEMPLATES.find((t) => t.id === id) || HANDOUT_TEMPLATES[0];
}

/**
 * Splits a paragraph into wrapped lines, preserving ||redacted|| markers as tokens.
 */
export function wrapHandoutText(text: string, maxCharsPerLine: number): string[] {
  const safeLimit = Math.max(12, maxCharsPerLine);
  const paragraphs = (text || '').split(/\r?\n/);
  const lines: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      lines.push('');
      continue;
    }
    const words = trimmed.split(/\s+/);
    let current = '';
    for (const word of words) {
      if (!current) {
        current = word;
      } else if (current.length + 1 + word.length <= safeLimit) {
        current += ' ' + word;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

function drawAgingTexture(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  aging: number
) {
  const intensity = Math.max(0, Math.min(100, aging)) / 100;
  if (intensity <= 0) return;

  // Vignette burn around edges
  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.28, w / 2, h / 2, Math.max(w, h) * 0.72);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(62, 41, 18, ${(0.38 * intensity).toFixed(3)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Deterministic paper specks
  let seed = 4219;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const specks = Math.floor(320 * intensity);
  for (let i = 0; i < specks; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 0.6 + rand() * 2.2;
    ctx.fillStyle = `rgba(74, 52, 28, ${(0.06 + rand() * 0.14 * intensity).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStamp(ctx: CanvasRenderingContext2D, text: string, w: number, yPos: number) {
  const clean = text.trim().toUpperCase();
  if (!clean) return;
  ctx.save();
  ctx.translate(w - 165, yPos);
  ctx.rotate(-0.22);
  ctx.strokeStyle = 'rgba(185, 28, 28, 0.82)';
  ctx.fillStyle = 'rgba(185, 28, 28, 0.82)';
  ctx.lineWidth = 4;
  ctx.font = 'bold 24px monospace';
  const metrics = ctx.measureText(clean);
  const bw = Math.max(150, metrics.width + 28);
  ctx.strokeRect(-bw / 2, -22, bw, 44);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(clean, 0, 1);
  ctx.restore();
}

/**
 * Draws a line supporting ||redacted|| blocks with black censor bars.
 */
function drawLineWithRedactions(
  ctx: CanvasRenderingContext2D,
  line: string,
  x: number,
  y: number,
  textColor: string
) {
  const parts = line.split(/(\|\|[^|]+\|\|)/g);
  let cursorX = x;
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('||') && part.endsWith('||')) {
      const hidden = part.slice(2, -2);
      const w = Math.max(36, ctx.measureText(hidden).width + 8);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cursorX - 2, y - 16, w, 21);
      cursorX += w + 2;
    } else {
      ctx.fillStyle = textColor;
      ctx.fillText(part, cursorX, y);
      cursorX += ctx.measureText(part).width;
    }
  }
}

/**
 * Renders the base public handout onto the given canvas.
 */
export function renderHandoutBaseToCanvas(
  canvas: HTMLCanvasElement,
  config: HandoutConfig,
  polaroidPhoto?: HTMLImageElement | null
) {
  const meta = getHandoutTemplateMeta(config.template);
  canvas.width = meta.width;
  canvas.height = meta.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = meta.width;
  const h = meta.height;

  // Background per template
  if (config.template === 'cris_report') {
    ctx.fillStyle = '#e9e4d5';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, w, 92);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('ORDO REALITAS // ARQUIVO C.R.I.S.', 44, 42);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px monospace';
    ctx.fillText(config.dateLine || meta.defaultDate, 44, 68);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(config.title || meta.defaultTitle, 44, 148);
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(config.subtitle || meta.defaultSubtitle, 44, 176);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(44, 196);
    ctx.lineTo(w - 44, 196);
    ctx.stroke();

    ctx.font = '16px monospace';
    const lines = wrapHandoutText(config.body, 58);
    let y = 236;
    for (const line of lines) {
      if (y > h - 100) break;
      drawLineWithRedactions(ctx, line, 44, y, '#1e293b');
      y += 28;
    }
    if (config.signature) {
      ctx.fillStyle = '#475569';
      ctx.font = 'italic 15px serif';
      ctx.fillText(`— ${config.signature}`, 44, h - 54);
    }
    drawStamp(ctx, config.stamp, w, 155);
  } else if (config.template === 'newspaper') {
    ctx.fillStyle = '#dfd6be';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 3;
    ctx.strokeRect(28, 28, w - 56, h - 56);

    ctx.fillStyle = '#1c1917';
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px serif';
    ctx.fillText(config.dateLine || meta.defaultDate, w / 2, 62);
    ctx.beginPath();
    ctx.moveTo(44, 76);
    ctx.lineTo(w - 44, 76);
    ctx.stroke();

    ctx.font = 'bold 34px Georgia, serif';
    const titleLines = wrapHandoutText(config.title || meta.defaultTitle, 28);
    let ty = 120;
    for (const tl of titleLines.slice(0, 3)) {
      ctx.fillText(tl, w / 2, ty);
      ty += 40;
    }
    ctx.font = 'italic 17px Georgia, serif';
    ctx.fillStyle = '#44403c';
    ctx.fillText(config.subtitle || meta.defaultSubtitle, w / 2, ty + 8);
    ctx.textAlign = 'left';

    // Two-column body
    ctx.font = '15px Georgia, serif';
    const colLines = wrapHandoutText(config.body, 32);
    const colStartY = ty + 46;
    const mid = Math.ceil(colLines.length / 2);
    let ly = colStartY;
    for (const line of colLines.slice(0, mid)) {
      if (ly > h - 70) break;
      drawLineWithRedactions(ctx, line, 48, ly, '#1c1917');
      ly += 24;
    }
    let ry = colStartY;
    for (const line of colLines.slice(mid)) {
      if (ry > h - 70) break;
      drawLineWithRedactions(ctx, line, w / 2 + 16, ry, '#1c1917');
      ry += 24;
    }
    drawStamp(ctx, config.stamp, w, 130);
  } else if (config.template === 'diary') {
    ctx.fillStyle = '#efe5c8';
    ctx.fillRect(0, 0, w, h);
    // Ruled lines
    ctx.strokeStyle = 'rgba(120, 140, 175, 0.35)';
    ctx.lineWidth = 1;
    for (let ry = 130; ry < h - 60; ry += 32) {
      ctx.beginPath();
      ctx.moveTo(44, ry);
      ctx.lineTo(w - 44, ry);
      ctx.stroke();
    }
    // Red margin
    ctx.strokeStyle = 'rgba(185, 60, 60, 0.35)';
    ctx.beginPath();
    ctx.moveTo(86, 40);
    ctx.lineTo(86, h - 40);
    ctx.stroke();

    ctx.fillStyle = '#3b2f2f';
    ctx.font = 'italic bold 26px Georgia, serif';
    ctx.fillText(config.title || meta.defaultTitle, 102, 90);
    ctx.font = 'italic 16px Georgia, serif';
    ctx.fillStyle = '#5c4b4b';
    ctx.fillText(config.subtitle || meta.defaultSubtitle, 102, 118);

    ctx.font = 'italic 18px Georgia, serif';
    const lines = wrapHandoutText(config.body, 52);
    let y = 160;
    for (const line of lines) {
      if (y > h - 90) break;
      drawLineWithRedactions(ctx, line, 102, y, '#2b2118');
      y += 32;
    }
    if (config.signature) {
      ctx.font = 'italic bold 20px Georgia, serif';
      ctx.fillStyle = '#2b2118';
      ctx.fillText(config.signature, w - 260, h - 66);
    }
  } else if (config.template === 'forensic_laudo') {
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.strokeRect(32, 32, w - 64, h - 64);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(config.title || meta.defaultTitle, 52, 82);
    ctx.font = '13px monospace';
    ctx.fillStyle = '#475569';
    ctx.fillText(config.subtitle || meta.defaultSubtitle, 52, 108);
    ctx.fillText(config.dateLine || meta.defaultDate, 52, 130);

    ctx.strokeRect(52, 150, w - 104, 62);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('STATUS: PERÍCIA CONCLUÍDA   |   CADEIA DE CUSTÓDIA: VERIFICADA', 66, 186);

    ctx.font = '15px monospace';
    const lines = wrapHandoutText(config.body, 58);
    let y = 250;
    for (const line of lines) {
      if (y > h - 100) break;
      drawLineWithRedactions(ctx, line, 52, y, '#0f172a');
      y += 26;
    }
    if (config.signature) {
      ctx.font = '14px monospace';
      ctx.fillStyle = '#334155';
      ctx.fillText(`ASSINATURA DO PERITO: ${config.signature}`, 52, h - 62);
    }
    drawStamp(ctx, config.stamp, w, 175);
  } else {
    // Polaroid
    ctx.fillStyle = '#f8f6f0';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#111827';
    ctx.fillRect(48, 48, w - 96, w - 96);

    if (polaroidPhoto) {
      ctx.drawImage(polaroidPhoto, 48, 48, w - 96, w - 96);
    } else {
      const grad = ctx.createLinearGradient(48, 48, w - 48, w - 48);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(48, 48, w - 96, w - 96);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
      ctx.textAlign = 'center';
      ctx.font = '16px monospace';
      ctx.fillText(config.dateLine || meta.defaultDate, w / 2, w / 2 - 12);
      ctx.font = '13px monospace';
      ctx.fillText('[REGISTRO FOTOGRÁFICO DA EVIDÊNCIA]', w / 2, w / 2 + 16);
      ctx.textAlign = 'left';
    }

    ctx.fillStyle = '#1e293b';
    ctx.font = 'italic bold 26px Georgia, serif';
    ctx.fillText(config.title || meta.defaultTitle, 52, w + 16);
    ctx.font = 'italic 16px Georgia, serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(config.body.slice(0, 68) || config.subtitle || meta.defaultSubtitle, 52, w + 52);
    drawStamp(ctx, config.stamp, w, 100);
  }

  drawAgingTexture(ctx, w, h, config.aging);
}

/**
 * Renders the baked UV or Thermal secret layer onto a transparent canvas (Anti-F12: baked image, not JSON text!).
 */
export function renderHandoutSecretToCanvas(
  canvas: HTMLCanvasElement,
  config: HandoutConfig
): boolean {
  const cleanSecret = (config.secretText || '').trim();
  if (config.secretMode === 'none' || !cleanSecret) return false;

  const meta = getHandoutTemplateMeta(config.template);
  canvas.width = meta.width;
  canvas.height = meta.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  ctx.clearRect(0, 0, meta.width, meta.height);
  const lines = wrapHandoutText(cleanSecret, 30);

  ctx.save();
  const isUv = config.secretMode === 'uv';
  ctx.font = isUv ? 'bold 34px monospace' : 'bold 32px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = isUv ? '#a855f7' : '#ff4500';
  ctx.shadowBlur = isUv ? 18 : 22;
  ctx.fillStyle = isUv ? '#e9d5ff' : '#ffedd5';

  let centerY = meta.height * 0.52;
  if (config.secretPosition === 'top') centerY = meta.height * 0.24;
  else if (config.secretPosition === 'bottom') centerY = meta.height * 0.78;

  if (config.secretPosition === 'diagonal') {
    ctx.translate(meta.width / 2, meta.height / 2);
    ctx.rotate(-0.35);
    let y = -((lines.length - 1) * 22);
    for (const line of lines) {
      ctx.fillText(line, 0, y);
      y += 44;
    }
  } else {
    let y = centerY - ((lines.length - 1) * 22);
    for (const line of lines) {
      ctx.fillText(line, meta.width / 2, y);
      y += 44;
    }
  }

  ctx.restore();
  return true;
}
