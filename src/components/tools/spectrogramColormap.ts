export function generateHighContrastColorMap() {
  const colors: Array<[number, number, number, number]> = [];
  for (let i = 0; i < 256; i++) {
    const val = i / 255;
    if (val < 0.15) {
      colors.push([0, 0, 0, 1]);
    } else {
      const r = Math.min(1, val * 2);
      const g = val > 0.6 ? 1 : 0;
      const b = Math.min(1, val * 3);
      colors.push([r, g, b, 1]);
    }
  }
  return colors;
}
