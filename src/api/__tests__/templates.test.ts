/// <reference types="jest" />
import {
  sanitizeTemplateData,
  createClueTemplate,
  fetchClueTemplates,
} from '../templates';
import { supabase } from '../../supabaseClient';

jest.mock('../../supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

const mockedSupabase = supabase as unknown as {
  auth: { getUser: jest.Mock };
  from: jest.Mock;
};

describe('templates API & sanitizeTemplateData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sanitizeTemplateData', () => {
    it('remove instâncias File e Blob aninhadas em objetos e arrays', () => {
      const imgFile = new File(['raw-img'], 'crime-scene.png', { type: 'image/png' });
      const rawBlob = new Blob(['audio-bytes'], { type: 'audio/wav' });

      const rawState = {
        title: 'Template Pericial',
        mediaState: {
          imgFile,
          audioBlob: rawBlob,
          nestedList: [imgFile, 'mantido', rawBlob],
        },
      };

      const sanitized = sanitizeTemplateData(rawState);
      expect(sanitized.title).toBe('Template Pericial');
      expect(sanitized.mediaState.imgFile).toBeUndefined();
      expect(sanitized.mediaState.audioBlob).toBeUndefined();
      expect(sanitized.mediaState.nestedList).toEqual(['mantido']);
    });

    it('remove URLs temporárias blob: em chaves específicas, strings soltas e arrays', () => {
      const rawState = {
        title: 'Template Chat',
        looseBlob: 'blob:http://localhost:5173/9f8e7d6c-1234',
        secureBlob: 'blob:https://ecdise.app/abcd-5678',
        attachments: [
          'blob:http://localhost:5173/temp-1',
          'https://cdn.ecdise.test/permanent.png',
        ],
        chatList: [
          {
            sender: 'them',
            type: 'image',
            text: 'Olhe esta foto',
            image_url: 'blob:http://localhost:5173/chat-temp',
          },
          {
            sender: 'me',
            type: 'image',
            text: 'Recebido',
            image_url: 'https://cdn.ecdise.test/chat-saved.png',
          },
        ],
      };

      const sanitized = sanitizeTemplateData(rawState);
      expect(sanitized.looseBlob).toBeUndefined();
      expect(sanitized.secureBlob).toBeUndefined();
      expect(sanitized.attachments).toEqual(['https://cdn.ecdise.test/permanent.png']);
      expect(sanitized.chatList[0].image_url).toBeUndefined();
      expect(sanitized.chatList[1].image_url).toBe('https://cdn.ecdise.test/chat-saved.png');
    });

    it('remove chaves transitórias de preview/arquivo MAS preserva URLs remotas https:// e flags booleanas com File no nome (showFileType / fileProperties)', () => {
      const rawState = {
        title: 'Dossiê Completo',
        previewUrl: 'https://cdn.ecdise.test/transient-preview.png',
        uvPreviewUrl: 'https://cdn.ecdise.test/transient-uv.png',
        audioBasePreview: 'https://cdn.ecdise.test/transient-audio.mp3',
        imgFile: null,
        uvFile: null,
        videoUrl: 'https://cdn.ecdise.test/briefing.mp4',
        externalLink: 'https://arquivos.ecdise.test/relatorio.pdf',
        glitchHiddenAudioUrl: 'https://cdn.ecdise.test/hidden-transmission.ogg',
        displayConfig: {
          fileProperties: {
            showFileType: true,
            showSize: false,
            showCameraModel: true,
          },
          cipher: {
            showRealText: false,
            showCipherText: true,
          },
        },
        fieldVisibilityConfig: {
          fileProperties: {
            visibleFields: ['fileType', 'cameraModel', 'gpsCoords'],
          },
        },
      };

      const sanitized = sanitizeTemplateData(rawState);

      // Chaves transitórias de preview/file removidas
      expect(sanitized.previewUrl).toBeUndefined();
      expect(sanitized.uvPreviewUrl).toBeUndefined();
      expect(sanitized.audioBasePreview).toBeUndefined();
      expect(sanitized.imgFile).toBeUndefined();
      expect(sanitized.uvFile).toBeUndefined();

      // URLs remotas legítimas preservadas
      expect(sanitized.videoUrl).toBe('https://cdn.ecdise.test/briefing.mp4');
      expect(sanitized.externalLink).toBe('https://arquivos.ecdise.test/relatorio.pdf');
      expect(sanitized.glitchHiddenAudioUrl).toBe(
        'https://cdn.ecdise.test/hidden-transmission.ogg'
      );

      // Regressão crítica corrigida: fileProperties e showFileType NÃO podem ser apagados!
      expect(sanitized.displayConfig).toBeDefined();
      expect(sanitized.displayConfig.fileProperties).toBeDefined();
      expect(sanitized.displayConfig.fileProperties.showFileType).toBe(true);
      expect(sanitized.displayConfig.fileProperties.showSize).toBe(false);
      expect(sanitized.displayConfig.fileProperties.showCameraModel).toBe(true);
      expect(sanitized.fieldVisibilityConfig.fileProperties.visibleFields).toEqual([
        'fileType',
        'cameraModel',
        'gpsCoords',
      ]);
    });

    it('lida com referências circulares sem lançar Maximum call stack size exceeded', () => {
      const circularRoot: Record<string, any> = {
        title: 'Nó Circular',
        nested: {
          label: 'Subnível',
        },
      };
      circularRoot.self = circularRoot;
      circularRoot.nested.parent = circularRoot;

      expect(() => sanitizeTemplateData(circularRoot)).not.toThrow();
      const sanitized = sanitizeTemplateData(circularRoot);
      expect(sanitized.title).toBe('Nó Circular');
      expect(sanitized.nested.label).toBe('Subnível');
    });

    it('remove todos os segredos de GM/solução quando stripSecrets === true', () => {
      const stateWithSecrets = {
        coreState: {
          title: 'Template Público Seguro',
          descPublic: 'Documento encontrado na mesa.',
          descHidden: 'GM_SECRET_NOTE_1',
          discoveryCode: 'DISC_SECRET_2',
          evidenceType: 'glitch_puzzle',
        },
        securityState: {
          isLocked: true,
          lockPass: 'PASS_SECRET_3',
          lockPasses: ['MULTI_PASS_4A', 'MULTI_PASS_4B'],
        },
        phoneState: {
          hasKeypad: true,
          phonePassword: 'PHONE_PIN_5',
          phone_password: 'PHONE_PIN_LEGACY_5',
          contactName: 'Operador',
        },
        glitchState: {
          glitchRequireKeyword: true,
          glitchKeyword: 'GLITCH_KW_6',
          correct_keyword: 'GLITCH_KW_LEGACY_6',
          glitchDifficulty: 'normal',
        },
        thermalConfig: {
          enabled: true,
          thermalSecretText: 'THERMAL_SECRET_7',
          thermal_secret_text: 'THERMAL_SECRET_LEGACY_7',
        },
        cipherState: {
          cipherText: 'KHOOR ZRUOG',
          realText: 'REAL_TEXT_8',
          real_text: 'REAL_TEXT_LEGACY_8',
          hexEncodingMethod: 'enigma',
          hexEncodingKey: 'HEX_KEY_9',
        },
        megaClueState: {
          megaFinalTruthText: 'MEGA_TRUTH_10',
          final_truth_text: 'MEGA_TRUTH_LEGACY_10',
        },
        description_hidden: 'TOP_DESC_HIDDEN',
        lock_password: 'TOP_LOCK_PASS',
        discovery_code: 'TOP_DISC_CODE',
      };

      const publicSanitized = sanitizeTemplateData(stateWithSecrets, { stripSecrets: true });
      const serialized = JSON.stringify(publicSanitized);

      // Nenhum segredo pode restar no JSON público
      const forbiddenLiterals = [
        'GM_SECRET_NOTE_1',
        'DISC_SECRET_2',
        'PASS_SECRET_3',
        'MULTI_PASS_4A',
        'MULTI_PASS_4B',
        'PHONE_PIN_5',
        'PHONE_PIN_LEGACY_5',
        'GLITCH_KW_6',
        'GLITCH_KW_LEGACY_6',
        'THERMAL_SECRET_7',
        'THERMAL_SECRET_LEGACY_7',
        'REAL_TEXT_8',
        'REAL_TEXT_LEGACY_8',
        'HEX_KEY_9',
        'MEGA_TRUTH_10',
        'MEGA_TRUTH_LEGACY_10',
        'TOP_DESC_HIDDEN',
        'TOP_LOCK_PASS',
        'TOP_DISC_CODE',
      ];
      for (const secret of forbiddenLiterals) {
        expect(serialized).not.toContain(secret);
      }

      // Dados públicos/estruturais permanecem intactos
      expect(publicSanitized.coreState.title).toBe('Template Público Seguro');
      expect(publicSanitized.coreState.descPublic).toBe('Documento encontrado na mesa.');
      expect(publicSanitized.glitchState.glitchDifficulty).toBe('normal');
      expect(publicSanitized.cipherState.cipherText).toBe('KHOOR ZRUOG');
    });
  });

  describe('createClueTemplate & fetchClueTemplates (Supabase isolado)', () => {
    it('aplica stripSecrets automaticamente quando createClueTemplate recebe is_public: true', async () => {
      mockedSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-gm-01' } },
      });

      const singleMock = jest.fn().mockResolvedValue({
        data: { id: 'tpl-1', name: 'Público', is_public: true, template_data: {} },
        error: null,
      });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectMock });
      mockedSupabase.from.mockReturnValue({ insert: insertMock });

      await createClueTemplate({
        name: 'Público',
        is_public: true,
        template_data: {
          title: 'Modelo Público',
          descHidden: 'SEGREDO_GM_VAZADO',
          lockPass: '9999',
          lockPasses: ['CODE-A'],
          discoveryCode: 'HIDDEN-X',
          phonePassword: '1234',
          glitchKeyword: 'PALAVRA-CHAVE',
          thermalSecretText: 'TINTA-SECRETA',
          realText: 'TEXTO-CLARO',
          megaFinalTruthText: 'VERDADE-FINAL',
          hexEncodingKey: 'CHAVE-HEX',
          previewUrl: 'blob:http://localhost:5173/temp',
          displayConfig: {
            fileProperties: { showFileType: true },
          },
        },
      });

      expect(mockedSupabase.from).toHaveBeenCalledWith('clue_templates');
      expect(insertMock).toHaveBeenCalledTimes(1);

      const insertedRow = insertMock.mock.calls[0][0];
      const insertedJson = JSON.stringify(insertedRow.template_data);

      expect(insertedRow.is_public).toBe(true);
      expect(insertedRow.template_data.title).toBe('Modelo Público');
      expect(insertedRow.template_data.displayConfig.fileProperties.showFileType).toBe(true);
      expect(insertedJson).not.toContain('SEGREDO_GM_VAZADO');
      expect(insertedJson).not.toContain('9999');
      expect(insertedJson).not.toContain('CODE-A');
      expect(insertedJson).not.toContain('HIDDEN-X');
      expect(insertedJson).not.toContain('1234');
      expect(insertedJson).not.toContain('PALAVRA-CHAVE');
      expect(insertedJson).not.toContain('TINTA-SECRETA');
      expect(insertedJson).not.toContain('TEXTO-CLARO');
      expect(insertedJson).not.toContain('VERDADE-FINAL');
      expect(insertedJson).not.toContain('CHAVE-HEX');
      expect(insertedJson).not.toContain('blob:');
    });

    it('busca lista de templates ordenada em fetchClueTemplates', async () => {
      const mockTemplates = [
        {
          id: 'tpl-1',
          name: 'Dossiê Base',
          template_data: { title: 'Base' },
          created_by: 'user-1',
          is_public: false,
          created_at: '2026-11-24T10:00:00Z',
          updated_at: '2026-11-24T10:00:00Z',
        },
      ];
      const orderMock = jest.fn().mockResolvedValue({ data: mockTemplates, error: null });
      const selectMock = jest.fn().mockReturnValue({ order: orderMock });
      mockedSupabase.from.mockReturnValue({ select: selectMock });

      const result = await fetchClueTemplates();
      expect(mockedSupabase.from).toHaveBeenCalledWith('clue_templates');
      expect(result).toEqual(mockTemplates);
    });
  });
});
