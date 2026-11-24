/// <reference types="jest" />
import { TextEncoder, TextDecoder } from 'util';

if (typeof globalThis.TextEncoder === 'undefined') {
  (globalThis as any).TextEncoder = TextEncoder;
  (globalThis as any).TextDecoder = TextDecoder;
}

import {
  CARD_ALLOWED_PAYLOAD_KEYS,
  buildClueDbPayload,
  serializePublicClueCard,
  BuildCluePayloadParams,
} from '../cluePayloadBuilder';
import { textToHex, enigmaEncodeHex } from '../hexEncoders';
import { defaultDisplayConfig } from '../../config/displayConfig';
import { defaultFieldVisibility } from '../../config/fieldVisibilityConfig';

const CARD_UPDATABLE_FIELDS_SET = new Set([
  'title',
  'description_public',
  'description_hidden',
  'image_url',
  'image_uv_url',
  'video_url',
  'audio_url',
  'audio_hidden_url',
  'audio_target_freq',
  'image_filter_layer',
  'is_locked',
  'lock_password',
  'is_hidden',
  'discovery_code',
  'x',
  'y',
  'z_index',
  'visibility',
  'tags',
  'insights',
  'metadata',
  'chat_data',
  'chat_contact_name',
  'type',
]);

const LOCKED_PLACEHOLDER_IMG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/xcAAwEB/aurbZkAAAAASUVORK5CYII=';

function makeBaseParams(overrides: Record<string, any> = {}): BuildCluePayloadParams {
  const base: any = {
    investigationId: 'inv-001',
    initialX: 120,
    initialY: 240,
    existingCard: null,
    uploadedUrls: {},
    coreState: {
      title: 'Evidência Central',
      descPublic: 'Descrição visível aos investigadores.',
      descHidden: '',
      tags: 'forense, prioritario',
      discoveryCode: '',
      evidenceType: 'document',
      isHidden: false,
    },
    securityState: {
      isLocked: false,
      lockPass: '',
      lockPasses: [],
      securityLayerEnabled: false,
      revealLogicMode: 'aligned_only',
      signalTargets: { visual: true, audio: false },
      hidePreviewOnBoard: false,
      audioStaticSync: false,
      narrativeLinks: { audioHintsVisual: false, visualHintsCode: false, hintNote: '' },
    },
    mediaState: {
      imgFile: null,
      videoFile: null,
      uvFile: null,
      filterFile: null,
      audioBase: null,
      audioHidden: null,
      megaImageFile: null,
      thermalFile: null,
      forensicFile: null,
      forensicPreviewUrl: null,
      forensicTargetChannel: null,
      previewUrl: null,
      videoPreviewUrl: null,
      uvPreviewUrl: null,
      filterPreviewUrl: null,
      audioBasePreview: null,
      audioHiddenPreview: null,
      megaImagePreview: null,
      thermalPreviewUrl: null,
      videoUrl: null,
      videoUrlInput: '',
      audioHiddenUploadedUrl: null,
      audioTargetFreq: 50,
    },
    cipherState: {
      isShredded: false,
      shredRows: 1,
      shredCols: 8,
      realText: '',
      cipherText: '',
      hexCode: '',
      hexEncodingMethod: 'plain',
      hexEncodingKey: '',
    },
    glitchState: {
      glitchCorrectFrequency: 17,
      glitchCorrectShift: 33,
      glitchCorrectChromatic: 12,
      glitchRewardCode: 'ALPHA-01',
      glitchKeyword: '',
      glitchRequireKeyword: false,
      glitchUnlockMode: 'code',
      glitchDifficulty: 'hard',
      glitchToleranceFreq: 1,
      glitchToleranceShift: 2,
      glitchToleranceChroma: 2,
      glitchFocusedImageFile: null,
      glitchFocusedImagePreview: null,
      showGlitchDesigner: false,
      glitchHiddenAudioUrl: '',
      glitchHiddenVideoUrl: '',
      glitchHint: '',
      glitchAccessInstructions: '',
      glitchStartFrequency: 12,
      glitchStartShift: 20,
      glitchStartChromatic: 8,
    },
    megaClueState: {
      megaFinalTruthText: '',
      megaImageFile: null,
      megaImagePreview: null,
      megaRequiredPuzzleIds: [],
    },
    filterConfig: {
      brightness: 100,
      contrast: 100,
      saturate: 100,
      transform: null,
    },
    thermalConfig: {
      enabled: false,
      secretText: '',
      keyword: '',
      fontSize: 24,
      positionY: 50,
    },
    phoneState: {
      hasKeypad: false,
      password: '',
      lockType: 'pin',
      contactName: 'Desconhecido',
      chatList: [],
    },
    personState: {
      isPerson: false,
      name: '',
      age: '',
      profession: '',
      status: 'UNKNOWN',
      details: '',
    },
    metadataState: {
      fakeDate: '',
      fakeLocation: '',
      technicalNote: '',
      fakeMetaCam: '',
      fakeMetaGps: '',
      fakeMetaOwner: '',
      stamp: '',
      externalLink: '',
    },
    fieldVisibilityConfig: defaultFieldVisibility,
    displayConfig: defaultDisplayConfig,
    mediaVisibility: {
      audioBase: 'always',
      audioHidden: 'post_solve',
      visual: 'glitch_active',
      uvLayer: 'post_keyword',
    },
    insights: [],
    cardStatus: null,
  };

  const merged: any = { ...base, ...overrides };
  for (const key of [
    'coreState',
    'securityState',
    'mediaState',
    'cipherState',
    'glitchState',
    'megaClueState',
    'filterConfig',
    'thermalConfig',
    'phoneState',
    'personState',
    'metadataState',
    'uploadedUrls',
  ]) {
    if (overrides[key]) {
      merged[key] = { ...base[key], ...overrides[key] };
    }
  }
  return merged as BuildCluePayloadParams;
}

describe('cluePayloadBuilder (buildClueDbPayload & serializePublicClueCard)', () => {
  describe('Allowlist estrita de colunas no topo', () => {
    it('gera apenas chaves pertencentes a CARD_ALLOWED_PAYLOAD_KEYS no modo criação e coloca cifras/shredder/stamp dentro de metadata', () => {
      const allowedSet = new Set<string>(CARD_ALLOWED_PAYLOAD_KEYS);

      const payload = buildClueDbPayload(
        makeBaseParams({
          uploadedUrls: {
            imgUrl: 'https://cdn.ecdise.test/doc.png',
          },
          cipherState: {
            isShredded: true,
            shredRows: 4,
            shredCols: 4,
            realText: 'TEXTO DECIFRADO SECRETO',
            cipherText: 'WHAWR GHFLIUDGR VHFUHWR',
          },
          metadataState: {
            stamp: 'CONFIDENCIAL',
          },
        })
      );

      for (const topKey of Object.keys(payload)) {
        expect(allowedSet.has(topKey)).toBe(true);
      }

      // Nunca enviar colunas órfãs no topo
      expect(payload).not.toHaveProperty('is_shredded');
      expect(payload).not.toHaveProperty('real_text');
      expect(payload).not.toHaveProperty('cipher_text');
      expect(payload).not.toHaveProperty('stamp_text');

      // Devem estar persistidos dentro de payload.metadata
      expect(payload.metadata.is_shredded).toBe(true);
      expect(payload.metadata.shred_rows).toBe(4);
      expect(payload.metadata.shred_cols).toBe(4);
      expect(payload.metadata.real_text).toBe('TEXTO DECIFRADO SECRETO');
      expect(payload.metadata.cipher_text).toBe('WHAWR GHFLIUDGR VHFUHWR');
      expect(
        payload.metadata.field_values?.stamp || payload.metadata.stamp
      ).toBe('CONFIDENCIAL');
      expect(payload.tags).toEqual(['forense', 'prioritario']);
    });

    it('omite investigation_id e respeita estritamente CARD_UPDATABLE_FIELDS no modo edição (existingCard.id presente)', () => {
      const payload = buildClueDbPayload(
        makeBaseParams({
          existingCard: {
            id: 'card-existing-99',
            investigation_id: 'inv-001',
            title: 'Antigo',
            x: 300,
            y: 450,
            metadata: {},
          },
          cipherState: {
            isShredded: true,
            shredRows: 1,
            shredCols: 8,
            realText: 'REAL',
            cipherText: 'CIPHER',
          },
          metadataState: {
            stamp: 'URGENTE',
          },
        })
      );

      expect(payload).not.toHaveProperty('investigation_id');
      for (const topKey of Object.keys(payload)) {
        expect(CARD_UPDATABLE_FIELDS_SET.has(topKey)).toBe(true);
      }
      expect(payload).not.toHaveProperty('is_shredded');
      expect(payload).not.toHaveProperty('real_text');
      expect(payload).not.toHaveProperty('cipher_text');
      expect(payload).not.toHaveProperty('stamp_text');
    });
  });

  describe('Round-Trip Completo de Edição', () => {
    it('preserva 100% das URLs, insights, chat_data e metadados de progresso ao editar apenas o title sem re-enviar arquivos', () => {
      const richExistingCard = {
        id: 'card-rich-01',
        investigation_id: 'inv-001',
        title: 'Título Original',
        type: 'glitch_puzzle',
        image_url: 'https://cdn.ecdise.test/original.png',
        image_uv_url: 'https://cdn.ecdise.test/uv.png',
        image_filter_layer: 'https://cdn.ecdise.test/filter.png',
        audio_url: 'https://cdn.ecdise.test/base-audio.mp3',
        audio_hidden_url: 'https://cdn.ecdise.test/hidden-audio.mp3',
        audio_target_freq: 74,
        video_url: 'https://cdn.ecdise.test/clip.mp4',
        x: 512,
        y: 640,
        z_index: 7,
        visibility: { group: true },
        insights: [
          {
            id: 'ins-01',
            skill: 'Ciências Forenses',
            cost: 2,
            text: 'Resíduo de césio identificado.',
          },
        ],
        chat_contact_name: 'Dr. Arnaldo',
        chat_data: [
          { sender: 'them', type: 'text', text: 'Não abra o laboratório 3.', time: '02:14' },
        ],
        metadata: {
          status: 'verified',
          excalidraw_url: 'https://cdn.ecdise.test/sketch.json',
          thermal_layer_url: 'https://cdn.ecdise.test/thermal-layer.png',
          forensic_layer_url: 'https://cdn.ecdise.test/forensic-rgb.png',
          audio_hidden_url: 'https://cdn.ecdise.test/hidden-audio.mp3',
          audio_target_freq: 74,
          glitch_puzzle: {
            original_image_url: 'https://cdn.ecdise.test/original.png',
            focused_image_url: 'https://cdn.ecdise.test/focused.png',
            solved: true,
            solved_at: '2026-11-24T08:00:00Z',
            reward_code: 'ALPHA-01',
          },
          mega_clue: {
            final_truth_text: 'Segredo preservado',
            final_image_url: 'https://cdn.ecdise.test/mega-truth.png',
            required_puzzle_ids: ['puz-1'],
            collected_codes: ['ALPHA-01'],
            solved_puzzle_ids: ['puz-1'],
            unlocked: false,
          },
        },
      };

      const updatedPayload = buildClueDbPayload(
        makeBaseParams({
          existingCard: richExistingCard,
          coreState: {
            title: 'Título Atualizado pelo Mestre',
            evidenceType: 'glitch_puzzle',
          },
          securityState: {
            securityLayerEnabled: true,
          },
          mediaState: {
            previewUrl: richExistingCard.image_url,
            uvPreviewUrl: richExistingCard.image_uv_url,
            filterPreviewUrl: richExistingCard.image_filter_layer,
            audioBasePreview: richExistingCard.audio_url,
            audioHiddenPreview: richExistingCard.audio_hidden_url,
            audioHiddenUploadedUrl: richExistingCard.audio_hidden_url,
            videoUrl: richExistingCard.video_url,
            videoUrlInput: richExistingCard.video_url,
            audioTargetFreq: 74,
          },
          phoneState: {
            contactName: 'Dr. Arnaldo',
            chatList: richExistingCard.chat_data,
          },
          insights: richExistingCard.insights,
          cardStatus: 'verified',
        })
      );

      expect(updatedPayload.title).toBe('Título Atualizado pelo Mestre');
      expect(updatedPayload.image_url).toBe('https://cdn.ecdise.test/original.png');
      expect(updatedPayload.image_uv_url).toBe('https://cdn.ecdise.test/uv.png');
      expect(updatedPayload.image_filter_layer).toBe('https://cdn.ecdise.test/filter.png');
      expect(updatedPayload.audio_url).toBe('https://cdn.ecdise.test/base-audio.mp3');
      expect(updatedPayload.audio_hidden_url).toBe('https://cdn.ecdise.test/hidden-audio.mp3');
      expect(updatedPayload.audio_target_freq).toBe(74);
      expect(updatedPayload.video_url).toBe('https://cdn.ecdise.test/clip.mp4');
      expect(updatedPayload.insights).toEqual(richExistingCard.insights);
      expect(updatedPayload.chat_data).toEqual(richExistingCard.chat_data);
      expect(updatedPayload.chat_contact_name).toBe('Dr. Arnaldo');
      expect(updatedPayload.z_index).toBe(7);
      expect(updatedPayload.metadata.status).toBe('verified');
      expect(updatedPayload.metadata.excalidraw_url).toBe('https://cdn.ecdise.test/sketch.json');
      expect(updatedPayload.metadata.glitch_puzzle.solved).toBe(true);
      expect(updatedPayload.metadata.glitch_puzzle.focused_image_url).toBe(
        'https://cdn.ecdise.test/focused.png'
      );
      expect(updatedPayload.metadata.mega_clue.collected_codes).toEqual(['ALPHA-01']);
    });

    it('recupera a imagem real de original_image_url / base_media_url quando existingCard.image_url era LOCKED_PLACEHOLDER_IMG', () => {
      const realImageUrl = 'https://cdn.ecdise.test/real-evidence-photo.png';
      const maskedExistingCard = {
        id: 'card-masked-02',
        investigation_id: 'inv-001',
        title: 'Evidência Mascarada',
        type: 'document',
        image_url: LOCKED_PLACEHOLDER_IMG,
        metadata: {
          masked_preview: true,
          unified_media: {
            base_media_type: 'image',
            base_media_url: realImageUrl,
          },
          glitch_puzzle: {
            original_image_url: realImageUrl,
          },
        },
      };

      // Ao reeditar desativando hidePreviewOnBoard (ou mantendo securityLayer), a URL real nunca deve ser substituída pelo placeholder 1x1
      const unmaskedPayload = buildClueDbPayload(
        makeBaseParams({
          existingCard: maskedExistingCard,
          coreState: {
            title: 'Evidência Revelada no Quadro',
            evidenceType: 'document',
          },
          securityState: {
            securityLayerEnabled: false,
            hidePreviewOnBoard: false,
          },
        })
      );

      expect(unmaskedPayload.image_url).toBe(realImageUrl);

      // E se continuar com camada de segurança ativa, original_image_url / base_media_url continuam apontando para a foto real!
      const stillMaskedPayload = buildClueDbPayload(
        makeBaseParams({
          existingCard: maskedExistingCard,
          coreState: {
            title: 'Evidência Ainda Mascarada',
            evidenceType: 'document',
          },
          securityState: {
            securityLayerEnabled: true,
            hidePreviewOnBoard: true,
          },
        })
      );

      expect(stillMaskedPayload.metadata.unified_media.base_media_url).toBe(realImageUrl);
      expect(stillMaskedPayload.metadata.glitch_puzzle.original_image_url).toBe(realImageUrl);
    });
  });

  describe('Encoding Hex / Enigma real sem dupla codificação', () => {
    it('aplica transformação Enigma real (diferente de utf8hex puro) e salva metadata.hex_raw_text', () => {
      const rawMessage = 'COFRE SUBSOLO SETOR SETE';
      const rotorKey = 'ECDISE';

      const payload = buildClueDbPayload(
        makeBaseParams({
          cipherState: {
            hexCode: rawMessage,
            hexEncodingMethod: 'enigma',
            hexEncodingKey: rotorKey,
          },
        })
      );

      const pureUtf8Hex = textToHex(rawMessage);
      const expectedEnigmaHex = enigmaEncodeHex(rawMessage, rotorKey);

      expect(expectedEnigmaHex).not.toBe(pureUtf8Hex);
      expect(payload.metadata.hex_code).toBe(expectedEnigmaHex);
      expect(payload.metadata.hex_raw_text).toBe(rawMessage);
      expect(payload.metadata.hexEncodingMethod).toBe('enigma');
      expect(payload.metadata.hexEncodingKey).toBe(rotorKey);
    });
  });

  describe('Não-vazamento de segredos na construção e na serialização pública', () => {
    const SECRETS = {
      descHidden: 'SECRET_GM_HIDDEN_NOTE_901',
      lockPass: 'SECRET_CARD_PASS_902',
      discoveryCode: 'SECRET_DISCOVERY_903',
      phonePassword: 'SECRET_PHONE_PIN_904',
      glitchKeyword: 'SECRET_GLITCH_KW_905',
      thermalSecretText: 'SECRET_THERMAL_906',
      realText: 'SECRET_DECIPHERED_REAL_907',
      megaFinalTruthText: 'SECRET_MEGA_TRUTH_908',
      hexEncodingKey: 'SECRET_ROTOR_KEY_909',
    };

    function buildSecretRichPayload(overrides: Record<string, any> = {}) {
      return buildClueDbPayload(
        makeBaseParams({
          uploadedUrls: {
            imgUrl: 'https://cdn.ecdise.test/cover.png',
            uvUrl: 'https://cdn.ecdise.test/uv-secret.png',
            audUrl: 'https://cdn.ecdise.test/voice.mp3',
            audHidUrl: 'https://cdn.ecdise.test/voice-hidden.mp3',
            videoUrl: 'https://cdn.ecdise.test/cam.mp4',
          },
          coreState: {
            title: 'Arquivo Classificado',
            descPublic: 'Apenas o cabeçalho está legível.',
            descHidden: SECRETS.descHidden,
            tags: 'classificado, nivel-5',
            isHidden: true,
            discoveryCode: SECRETS.discoveryCode,
            evidenceType: 'glitch_puzzle',
          },
          securityState: {
            isLocked: false,
            lockPass: SECRETS.lockPass,
            lockPasses: ['LOCK_MULTI_A', 'LOCK_MULTI_B'],
            securityLayerEnabled: true,
            revealLogicMode: 'aligned_keyword',
          },
          phoneState: {
            hasKeypad: true,
            password: SECRETS.phonePassword,
            lockType: 'pin',
            contactName: ' Fonte Oculta',
            chatList: [{ sender: 'them', type: 'text', text: 'Mensagem privada' }],
          },
          glitchState: {
            glitchCorrectFrequency: 42,
            glitchCorrectShift: 68,
            glitchCorrectChromatic: 19,
            glitchRequireKeyword: true,
            glitchKeyword: SECRETS.glitchKeyword,
          },
          thermalConfig: {
            enabled: true,
            secretText: SECRETS.thermalSecretText,
            keyword: 'CALOR-99',
          },
          cipherState: {
            realText: SECRETS.realText,
            cipherText: 'CIPHER_PUBLIC_VISIBLE',
            hexCode: 'RAW_HEX_SECRET_MSG',
            hexEncodingMethod: 'xor',
            hexEncodingKey: SECRETS.hexEncodingKey,
          },
          megaClueState: {
            megaFinalTruthText: SECRETS.megaFinalTruthText,
            megaRequiredPuzzleIds: ['puz-1'],
          },
          ...overrides,
        })
      );
    }

    it('nunca vaza segredos em description_public, title, tags ou metadata.field_values do buildClueDbPayload', () => {
      const payload = buildSecretRichPayload({
        securityState: {
          isLocked: true,
          lockPass: SECRETS.lockPass,
          securityLayerEnabled: true,
          revealLogicMode: 'aligned_keyword',
        },
      });

      const publicSurface = JSON.stringify({
        title: payload.title,
        description_public: payload.description_public,
        tags: payload.tags,
        field_values: payload.metadata?.field_values,
      });

      for (const secretValue of Object.values(SECRETS)) {
        expect(publicSurface).not.toContain(secretValue);
      }
    });

    it('remove todos os campos de solução/GM em serializePublicClueCard quando não resolvido/desbloqueado', () => {
      const payload = buildSecretRichPayload({
        securityState: {
          isLocked: true,
          lockPass: SECRETS.lockPass,
          lockPasses: ['LOCK_MULTI_A'],
          securityLayerEnabled: true,
          revealLogicMode: 'aligned_keyword',
        },
      });

      // Garante presença de mega_clue para validar ocultação simultânea
      payload.metadata.mega_clue = {
        final_truth_text: SECRETS.megaFinalTruthText,
        final_image_url: 'https://cdn.ecdise.test/mega-final.png',
        required_codes: ['LOCK_MULTI_A'],
        unlocked: false,
      };
      payload.metadata.thermal_unlocked = false;

      const publicCard = serializePublicClueCard(payload);
      const serialized = JSON.stringify(publicCard);

      // Segredos diretos removidos/zerados
      expect(publicCard.description_hidden).toBeFalsy();
      expect(publicCard.lock_password).toBeFalsy();
      expect(publicCard.discovery_code).toBeFalsy();
      expect(publicCard.metadata?.phone_password).toBeUndefined();
      expect(publicCard.metadata?.hex_raw_text).toBeUndefined();
      expect(publicCard.metadata?.hexEncodingKey).toBeUndefined();
      expect(publicCard.metadata?.security_layer?.keyword).toBeFalsy();
      expect(publicCard.metadata?.glitch_puzzle?.correct_keyword).toBeFalsy();
      expect(publicCard.metadata?.glitch_puzzle?.correct_frequency).toBeUndefined();
      expect(publicCard.metadata?.glitch_puzzle?.correct_shift).toBeUndefined();
      expect(publicCard.metadata?.glitch_puzzle?.correct_chromatic).toBeUndefined();
      expect(publicCard.metadata?.mega_clue?.required_codes).toBeUndefined();

      // Condicionais fechadas (showRealText=false, !thermal_unlocked, !mega_clue.unlocked && !showAnswer)
      expect(publicCard.metadata?.real_text).toBeUndefined();
      expect(publicCard.metadata?.thermal_secret_text).toBeUndefined();
      expect(publicCard.metadata?.mega_clue?.final_truth_text).toBeUndefined();

      for (const secretValue of Object.values(SECRETS)) {
        expect(serialized).not.toContain(secretValue);
      }
      expect(serialized).not.toContain('RAW_HEX_SECRET_MSG');
      expect(serialized).not.toContain('LOCK_MULTI_A');

      // E porque is_locked === true, mídias sensíveis, descrição pública e chat devem estar mascarados!
      expect(publicCard.description_public).toBeFalsy();
      expect(publicCard.chat_data).toBeFalsy();
      expect(publicCard.audio_url).toBeFalsy();
      expect(publicCard.audio_hidden_url).toBeFalsy();
      expect(publicCard.video_url).toBeFalsy();
      expect(publicCard.image_uv_url).toBeFalsy();
    });

    it('preserva descrições/mídias públicas quando is_locked === false e revela textos condicionais apenas quando autorizados', () => {
      const unlockedPayload = buildSecretRichPayload({
        securityState: {
          isLocked: false,
          lockPass: '',
          securityLayerEnabled: true,
          revealLogicMode: 'aligned_only',
        },
        displayConfig: {
          ...defaultDisplayConfig,
          cipher: {
            ...defaultDisplayConfig.cipher,
            showRealText: true,
          },
          megaClue: {
            ...defaultDisplayConfig.megaClue,
            showAnswer: true,
          },
        },
      });

      unlockedPayload.metadata.thermal_unlocked = true;
      unlockedPayload.metadata.mega_clue = {
        final_truth_text: SECRETS.megaFinalTruthText,
        unlocked: true,
      };

      const publicCard = serializePublicClueCard(unlockedPayload);

      expect(publicCard.description_public).toBe('Apenas o cabeçalho está legível.');
      expect(publicCard.audio_url).toBe('https://cdn.ecdise.test/voice.mp3');
      expect(publicCard.metadata?.real_text).toBe(SECRETS.realText);
      expect(publicCard.metadata?.thermal_secret_text).toBe(SECRETS.thermalSecretText);
      expect(publicCard.metadata?.mega_clue?.final_truth_text).toBe(SECRETS.megaFinalTruthText);

      // Mesmo desbloqueado, segredos exclusivos do GM continuam ocultos
      expect(publicCard.description_hidden).toBeFalsy();
      expect(publicCard.discovery_code).toBeFalsy();
      expect(publicCard.metadata?.phone_password).toBeUndefined();
    });
  });
});
