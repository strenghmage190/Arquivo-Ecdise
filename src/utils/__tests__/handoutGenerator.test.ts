import {
  getHandoutTemplateMeta,
  HANDOUT_TEMPLATES,
  wrapHandoutText,
} from '../handoutGenerator';

describe('handoutGenerator (Cthulhu Architect-style Handouts)', () => {
  test('provides 5 distinct handout templates with valid dimensions', () => {
    expect(HANDOUT_TEMPLATES).toHaveLength(5);
    for (const tpl of HANDOUT_TEMPLATES) {
      expect(tpl.width).toBeGreaterThanOrEqual(700);
      expect(tpl.height).toBeGreaterThanOrEqual(800);
      expect(getHandoutTemplateMeta(tpl.id).id).toBe(tpl.id);
    }
  });

  test('wrapHandoutText wraps long lines and preserves blank paragraphs and ||redactions||', () => {
    const input = 'O agente encontrou ||SENHA 4812|| no porão.\n\nSegunda linha curta.';
    const lines = wrapHandoutText(input, 24);
    expect(lines.length).toBeGreaterThanOrEqual(4);
    expect(lines).toContain('');
    expect(lines.join(' ')).toContain('||SENHA 4812||');
  });
});
