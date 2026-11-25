/// <reference types="jest" />
import validateCreateClue, {
  validateClueDetailed,
  CreateClueState,
  ValidationIssue,
} from '../validateClue';

function makeValidState(overrides: Partial<CreateClueState> = {}): CreateClueState {
  return {
    title: 'Relatório Forense #042',
    evidenceType: 'document',
    isHidden: false,
    isLocked: false,
    phoneHasKeypad: false,
    securityLayerEnabled: false,
    isShredded: false,
    ...overrides,
  };
}

describe('validateClue (validateCreateClue & validateClueDetailed)', () => {
  describe('Validação de Título', () => {
    it('rejeita título vazio ou composto apenas por espaços em branco', () => {
      const emptyErrors = validateCreateClue(makeValidState({ title: '' }));
      expect(emptyErrors.some((e) => /título/i.test(e))).toBe(true);

      const whitespaceErrors = validateCreateClue(makeValidState({ title: '    ' }));
      expect(whitespaceErrors.some((e) => /título/i.test(e))).toBe(true);

      const detailed = validateClueDetailed(makeValidState({ title: '  \t\n ' }));
      expect(
        detailed.some((issue) => issue.severity === 'error' && /título/i.test(issue.message))
      ).toBe(true);
    });

    it('aceita pista simples válida sem erros', () => {
      expect(validateCreateClue(makeValidState())).toEqual([]);
      const detailedErrors = validateClueDetailed(makeValidState()).filter(
        (i) => i.severity === 'error'
      );
      expect(detailedErrors).toEqual([]);
    });
  });

  describe('Pista Oculta (discoveryCode)', () => {
    it('exige discoveryCode quando isHidden === true', () => {
      const missingCodeErrors = validateCreateClue(
        makeValidState({ isHidden: true, discoveryCode: '' })
      );
      expect(missingCodeErrors.some((e) => /código de descoberta/i.test(e))).toBe(true);

      const spacesCodeErrors = validateCreateClue(
        makeValidState({ isHidden: true, discoveryCode: '   ' })
      );
      expect(spacesCodeErrors.some((e) => /código de descoberta/i.test(e))).toBe(true);
    });

    it('aceita isHidden === true com discoveryCode preenchido e ignora quando isHidden === false', () => {
      expect(
        validateCreateClue(makeValidState({ isHidden: true, discoveryCode: 'ECDISE-77' }))
      ).toEqual([]);

      expect(
        validateCreateClue(makeValidState({ isHidden: false, discoveryCode: '' }))
      ).toEqual([]);
    });
  });

  describe('Bloqueio por Senha (isLocked / lockPass)', () => {
    it('exige lockPass quando isLocked === true em pistas document ou glitch_puzzle', () => {
      const docErrors = validateCreateClue(
        makeValidState({ evidenceType: 'document', isLocked: true, lockPass: '' })
      );
      expect(docErrors.some((e) => /senha/i.test(e))).toBe(true);

      const glitchErrors = validateCreateClue(
        makeValidState({
          evidenceType: 'glitch_puzzle',
          previewUrl: 'https://cdn.ecdise.test/img.png',
          isLocked: true,
          lockPass: '   ',
        })
      );
      expect(glitchErrors.some((e) => /senha/i.test(e))).toBe(true);
    });

    it('aceita isLocked === true quando lockPass é informado', () => {
      expect(
        validateCreateClue(
          makeValidState({ evidenceType: 'document', isLocked: true, lockPass: '4815' })
        )
      ).toEqual([]);
    });

    it('não exige lockPass individual quando evidenceType === mega_clue', () => {
      const errors = validateCreateClue(
        makeValidState({
          evidenceType: 'mega_clue',
          isLocked: true,
          lockPass: '',
          megaFinalTruthText: 'A verdade oculta no subsolo.',
          megaRequiredPuzzleIds: ['puzzle-1'],
        })
      );
      expect(errors).toEqual([]);
    });
  });

  describe('Celular Falso com Keypad (phoneHasKeypad / phonePassword)', () => {
    it('exige phonePassword quando phoneHasKeypad === true', () => {
      const errors = validateCreateClue(
        makeValidState({ phoneHasKeypad: true, phonePassword: '' })
      );
      expect(errors.some((e) => /telefone/i.test(e) && /senha/i.test(e))).toBe(true);
    });

    it('aceita phoneHasKeypad === true com senha válida e ignora quando phoneHasKeypad === false', () => {
      expect(
        validateCreateClue(makeValidState({ phoneHasKeypad: true, phonePassword: '1987' }))
      ).toEqual([]);

      expect(
        validateCreateClue(makeValidState({ phoneHasKeypad: false, phonePassword: '' }))
      ).toEqual([]);
    });
  });

  describe('Camada de Segurança e Glitch Puzzle (exigência de mídia)', () => {
    it('rejeita quando securityLayerEnabled === true ou evidenceType === glitch_puzzle sem nenhuma mídia', () => {
      const secErrors = validateCreateClue(makeValidState({ securityLayerEnabled: true }));
      expect(secErrors.some((e) => /mídia/i.test(e))).toBe(true);

      const glitchErrors = validateCreateClue(makeValidState({ evidenceType: 'glitch_puzzle' }));
      expect(glitchErrors.some((e) => /mídia/i.test(e))).toBe(true);
    });

    it('aceita qualquer uma das fontes de mídia suportadas', () => {
      const dummyImg = new File(['img'], 'photo.png', { type: 'image/png' });
      const dummyVid = new File(['vid'], 'clip.mp4', { type: 'video/mp4' });
      const dummyAud = new File(['aud'], 'sound.mp3', { type: 'audio/mpeg' });

      const mediaVariants: Array<Partial<CreateClueState>> = [
        { imgFile: dummyImg },
        { previewUrl: 'https://cdn.ecdise.test/photo.png' },
        { videoFile: dummyVid },
        { videoUrlInput: 'https://cdn.ecdise.test/video.mp4' },
        { videoUrl: 'https://cdn.ecdise.test/stored-video.mp4' },
        { audioBase: dummyAud },
        { audioBasePreview: 'https://cdn.ecdise.test/audio.mp3' },
      ];

      for (const media of mediaVariants) {
        expect(
          validateCreateClue(
            makeValidState({
              evidenceType: 'glitch_puzzle',
              securityLayerEnabled: true,
              ...media,
            })
          )
        ).toEqual([]);
      }
    });
  });

  describe('Mega-Pista (mega_clue)', () => {
    it('exige megaFinalTruthText e megaRequiredPuzzleIds não-vazio quando evidenceType === mega_clue', () => {
      const errors = validateCreateClue(
        makeValidState({
          evidenceType: 'mega_clue',
          megaFinalTruthText: '   ',
          megaRequiredPuzzleIds: [],
        })
      );
      expect(errors.some((e) => /verdade final/i.test(e))).toBe(true);
      expect(errors.some((e) => /quebra-cabeça/i.test(e))).toBe(true);
    });

    it('aceita mega_clue completa', () => {
      expect(
        validateCreateClue(
          makeValidState({
            evidenceType: 'mega_clue',
            megaFinalTruthText: 'O diretor era o paciente zero.',
            megaRequiredPuzzleIds: ['puz-alpha', 'puz-beta'],
          })
        )
      ).toEqual([]);
    });
  });

  describe('Documento Fragmentado / Shredder (isShredded)', () => {
    it('exige imagem quando isShredded === true', () => {
      const errors = validateCreateClue(
        makeValidState({
          evidenceType: 'document',
          isShredded: true,
          imgFile: null,
          previewUrl: null,
        })
      );
      expect(errors.some((e) => /imagem/i.test(e))).toBe(true);
    });

    it('exige evidenceType === document quando isShredded === true', () => {
      const errors = validateCreateClue(
        makeValidState({
          evidenceType: 'glitch_puzzle',
          isShredded: true,
          previewUrl: 'https://cdn.ecdise.test/doc.png',
        })
      );
      expect(errors.some((e) => /document/i.test(e))).toBe(true);
    });

    it('aceita isShredded === true com evidenceType === document e imagem presente', () => {
      expect(
        validateCreateClue(
          makeValidState({
            evidenceType: 'document',
            isShredded: true,
            previewUrl: 'https://cdn.ecdise.test/shredded.png',
          })
        )
      ).toEqual([]);
    });
  });

  describe('Warnings em validateClueDetailed', () => {
    const getWarnings = (state: CreateClueState): ValidationIssue[] =>
      validateClueDetailed(state).filter((issue) => issue.severity === 'warning');

    it('emite warning para hexEncodingMethod xor ou enigma sem hexEncodingKey', () => {
      const xorWarnings = getWarnings(
        makeValidState({ hexEncodingMethod: 'xor', hexEncodingKey: '' })
      );
      expect(xorWarnings.length).toBeGreaterThan(0);

      const enigmaWarnings = getWarnings(
        makeValidState({ hexEncodingMethod: 'enigma', hexEncodingKey: '   ' })
      );
      expect(enigmaWarnings.length).toBeGreaterThan(0);

      // Com chave preenchida, não deve emitir warning de chave hex
      const validEnigmaWarnings = getWarnings(
        makeValidState({ hexEncodingMethod: 'enigma', hexEncodingKey: 'ROTORKEY' })
      );
      expect(validEnigmaWarnings).toEqual([]);
    });

    it('emite warning quando glitchRequireKeyword ou aligned_keyword está ativo sem glitchKeyword', () => {
      const kwWarnings = getWarnings(
        makeValidState({
          evidenceType: 'glitch_puzzle',
          previewUrl: 'https://cdn.ecdise.test/img.png',
          glitchRequireKeyword: true,
          glitchKeyword: '',
        })
      );
      expect(kwWarnings.length).toBeGreaterThan(0);

      const modeWarnings = getWarnings(
        makeValidState({
          securityLayerEnabled: true,
          previewUrl: 'https://cdn.ecdise.test/img.png',
          revealLogicMode: 'aligned_keyword',
          glitchKeyword: '   ',
        })
      );
      expect(modeWarnings.length).toBeGreaterThan(0);

      const resolvedWarnings = getWarnings(
        makeValidState({
          evidenceType: 'glitch_puzzle',
          previewUrl: 'https://cdn.ecdise.test/img.png',
          glitchRequireKeyword: true,
          revealLogicMode: 'aligned_keyword',
          glitchKeyword: 'PROTOCOLO-ZERO',
        })
      );
      expect(resolvedWarnings).toEqual([]);
    });

    it('emite warning quando thermalEnabled === true sem thermalSecretText e sem thermalPreviewUrl', () => {
      const thermalWarnings = getWarnings(
        makeValidState({
          thermalEnabled: true,
          thermalSecretText: '',
          thermalPreviewUrl: null,
        })
      );
      expect(thermalWarnings.length).toBeGreaterThan(0);

      // Warning não bloqueia validateCreateClue
      expect(
        validateCreateClue(
          makeValidState({
            thermalEnabled: true,
            thermalSecretText: '',
            thermalPreviewUrl: null,
          })
        )
      ).toEqual([]);

      // Com texto secreto térmico ou preview térmico, warning desaparece
      expect(
        getWarnings(
          makeValidState({
            thermalEnabled: true,
            thermalSecretText: '37.8°C ASSINATURA DETECTADA',
          })
        )
      ).toEqual([]);

      expect(
        getWarnings(
          makeValidState({
            thermalEnabled: true,
            thermalSecretText: '',
            thermalPreviewUrl: 'https://cdn.ecdise.test/thermal.png',
          })
        )
      ).toEqual([]);
    });
  });
});
