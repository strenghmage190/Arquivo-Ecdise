import { DisplayConfig, defaultDisplayConfig } from '../config/displayConfig';
import { FieldVisibilityConfig, defaultFieldVisibility } from '../config/fieldVisibilityConfig';
import { InvestigationCardInsight } from '../api/investigations';
import { clampImageFilterValue } from '../config/imageFilter';

export type PaceMode = 'in_session' | 'between_sessions';
export type LockType = 'keypad' | 'terminal' | 'pattern';

export function inferLockTypeFromSecret(secret: string | null | undefined): LockType {
  const clean = String(secret || '').trim();
  if (!clean) return 'terminal';
  if (/^\d{1,6}$/.test(clean)) return 'keypad';
  if (/^[1-9](-[1-9]){2,8}$/.test(clean)) return 'pattern';
  return 'terminal';
}
import {
  textToHex,
  hexToText,
  xorEncodeHex,
  xorDecodeHex,
  enigmaEncodeHex,
  enigmaDecodeHex,
} from './hexEncoders';

export const LOCKED_PLACEHOLDER_IMG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/xcAAwEB/aurbZkAAAAASUVORK5CYII=';

export const CARD_ALLOWED_PAYLOAD_KEYS = [
  'investigation_id',
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
  'lock_type',
  'pace_mode',
  'reward_card_ids',
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
] as const;

export type CardAllowedPayloadKey = (typeof CARD_ALLOWED_PAYLOAD_KEYS)[number];

export const CARD_UPDATABLE_PAYLOAD_KEYS = CARD_ALLOWED_PAYLOAD_KEYS.filter(
  (k) => k !== 'investigation_id'
) as readonly Exclude<CardAllowedPayloadKey, 'investigation_id'>[];

export type NormalizedPersonStatus = 'UNKNOWN' | 'ALIVE' | 'MIA' | 'DEAD';

export interface FilterTransformRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface UploadedClueUrls {
  imgUrl?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  uvUrl?: string | null;
  imageUvUrl?: string | null;
  image_uv_url?: string | null;
  filterUrl?: string | null;
  imageFilterLayer?: string | null;
  image_filter_layer?: string | null;
  thermalUrl?: string | null;
  thermal_layer_url?: string | null;
  forensicUrl?: string | null;
  forensic_layer_url?: string | null;
  videoUrl?: string | null;
  finalVideoUrl?: string | null;
  video_url?: string | null;
  audUrl?: string | null;
  audioUrl?: string | null;
  audio_url?: string | null;
  audHidUrl?: string | null;
  audioHiddenUrl?: string | null;
  audio_hidden_url?: string | null;
  glitchFocusedUrl?: string | null;
  focusedImageUrl?: string | null;
  focused_image_url?: string | null;
  megaImageUrl?: string | null;
  final_image_url?: string | null;
}

export interface BuildCluePayloadParams {
  investigationId?: string;
  existingCard?: Record<string, any> | null;
  initialX?: number;
  initialY?: number;
  isDuplicate?: boolean;
  uploadedUrls?: UploadedClueUrls;
  state?: Record<string, any>;
  deviceExtraction?: any;
  audioStudioMeta?: any;
  physicalDocument?: any;
  coreState?: Partial<{
    title: string;
    descPublic: string;
    descHidden: string;
    tags: string | string[];
    discoveryCode: string;
    evidenceType: 'document' | 'glitch_puzzle' | 'mega_clue' | string;
    isHidden: boolean;
  }>;
  securityState?: Partial<{
    isLocked: boolean;
    lockPass: string;
    lockPasses: string[];
    paceMode: PaceMode;
    rewardCardIds: string[];
    assistHint: string;
    useServerSecret: boolean;
    securityLayerEnabled: boolean;
    revealLogicMode: 'always_visible' | 'aligned_only' | 'aligned_keyword' | string;
    signalTargets: { visual: boolean; audio: boolean };
    hidePreviewOnBoard: boolean;
    audioStaticSync: boolean;
    narrativeLinks: { audioHintsVisual: boolean; visualHintsCode: boolean; hintNote: string };
  }>;
  mediaState?: Partial<{
    imgFile: File | null;
    videoFile: File | null;
    uvFile: File | null;
    filterFile: File | null;
    audioBase: File | null;
    audioHidden: File | null;
    megaImageFile: File | null;
    thermalFile: File | null;
    forensicFile: File | null;
    forensicPreviewUrl: string | null;
    forensicTargetChannel: 'R' | 'G' | 'B' | null;
    uvAuthoringState: any;
    previewUrl: string | null;
    videoPreviewUrl: string | null;
    uvPreviewUrl: string | null;
    filterPreviewUrl: string | null;
    audioBasePreview: string | null;
    audioHiddenPreview: string | null;
    megaImagePreview: string | null;
    thermalPreviewUrl: string | null;
    videoUrl: string | null;
    videoUrlInput: string;
    audioHiddenUploadedUrl: string | null;
    audioTargetFreq: number;
    removedImage: boolean;
    removedVideo: boolean;
    removedUv: boolean;
    removedFilter: boolean;
    removedThermal: boolean;
    removedForensic: boolean;
    removedAudioBase: boolean;
    removedAudioHidden: boolean;
    removedGlitchFocused: boolean;
    removedMegaImage: boolean;
  }>;
  cipherState?: Partial<{
    isShredded: boolean;
    shredRows: number;
    shredCols: number;
    realText: string;
    cipherText: string;
    hexCode: string;
    hexEncodingMethod: 'plain' | 'utf8hex' | 'xor' | 'enigma' | string;
    hexEncodingKey: string;
  }>;
  glitchState?: Partial<{
    glitchCorrectFrequency: number;
    glitchCorrectShift: number;
    glitchCorrectChromatic: number;
    glitchRewardCode: string;
    glitchKeyword: string;
    glitchRequireKeyword: boolean;
    glitchUnlockMode: 'code' | 'code_plus_keyword' | 'media' | 'media_and_code' | string;
    glitchDifficulty: 'easy' | 'normal' | 'hard' | 'custom' | string;
    glitchToleranceFreq: number;
    glitchToleranceShift: number;
    glitchToleranceChroma: number;
    glitchFocusedImageFile: File | null;
    glitchFocusedImagePreview: string | null;
    glitchHiddenAudioUrl: string;
    glitchHiddenVideoUrl: string;
    glitchHint: string;
    glitchAccessInstructions: string;
    glitchStartFrequency: number;
    glitchStartShift: number;
    glitchStartChromatic: number;
  }>;
  megaClueState?: Partial<{
    megaFinalTruthText: string;
    megaImageFile: File | null;
    megaImagePreview: string | null;
    megaRequiredPuzzleIds: string[];
  }>;
  filterConfig?: Partial<{
    brightness: number;
    contrast: number;
    saturate: number;
    transform: FilterTransformRect | null;
  }>;
  thermalConfig?: Partial<{
    enabled: boolean;
    secretText: string;
    keyword: string;
    fontSize: number;
    positionY: number;
    palette?: 'ironbow' | 'white_hot' | 'arctic';
    elements?: any[];
  }>;
  phoneState?: Partial<{
    hasKeypad: boolean;
    password: string;
    lockType: 'pin' | 'pattern' | string;
    contactName: string;
    chatList: any[];
  }>;
  personState?: Partial<{
    isPerson: boolean;
    name: string;
    age: string;
    profession: string;
    status: string;
    details: string;
  }>;
  metadataState?: Partial<{
    fakeDate: string;
    fakeLocation: string;
    technicalNote: string;
    fakeMetaCam: string;
    fakeMetaGps: string;
    fakeMetaOwner: string;
    stamp: string;
    externalLink: string;
  }>;
  fieldVisibilityConfig?: FieldVisibilityConfig;
  displayConfig?: DisplayConfig;
  mediaVisibility?: Partial<{
    audioBase: 'always' | 'glitch_only' | 'post_solve' | string;
    audioHidden: 'post_solve' | 'post_keyword' | 'always' | string;
    visual: 'glitch_active' | 'post_keyword' | 'always' | string;
    uvLayer: 'post_keyword' | 'always' | 'post_solve' | string;
  }>;
  insights?: InvestigationCardInsight[];
  cardStatus?: string | null;
}

export function isLockedPlaceholderImage(url: unknown): boolean {
  return (
    typeof url === 'string' &&
    (url === LOCKED_PLACEHOLDER_IMG ||
      url.startsWith('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB'))
  );
}

/**
 * Recursively strips any transient `blob:` URLs from metadata objects/arrays
 * so ephemeral browser object URLs are never persisted to Supabase.
 */
export function stripBlobUrlsDeep<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    return (value.startsWith('blob:') ? undefined : value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => stripBlobUrlsDeep(item))
      .filter((item) => item !== undefined) as unknown as T;
  }
  if (typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
      if (typeof v === 'string' && v.startsWith('blob:')) continue;
      const cleaned = stripBlobUrlsDeep(v);
      if (cleaned !== undefined) {
        out[k] = cleaned;
      }
    }
    return out as T;
  }
  return value;
}

function isRemoteOrDataUrl(url: unknown): url is string {
  return typeof url === 'string' && url.length > 0 && !url.startsWith('blob:');
}

export function parseCardMetadataSafe(card: any): Record<string, any> {
  if (!card || !card.metadata) return {};
  if (typeof card.metadata === 'object' && !Array.isArray(card.metadata)) {
    return { ...card.metadata };
  }
  if (typeof card.metadata === 'string') {
    try {
      const parsed = JSON.parse(card.metadata);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

export function resolveExistingRealImageUrl(
  card: Record<string, any> | null | undefined,
  meta?: Record<string, any>
): string | null {
  if (!card) return null;
  const m = meta || parseCardMetadataSafe(card);

  if (card.image_url && !isLockedPlaceholderImage(card.image_url)) {
    return card.image_url;
  }

  const um = m.unified_media || {};
  if (
    um.base_media_url &&
    !isLockedPlaceholderImage(um.base_media_url) &&
    um.base_media_type !== 'video' &&
    um.base_media_type !== 'audio'
  ) {
    return um.base_media_url;
  }

  const gp = m.glitch_puzzle || {};
  if (gp.original_image_url && !isLockedPlaceholderImage(gp.original_image_url)) {
    return gp.original_image_url;
  }
  if (gp.corrupted_image_url && !isLockedPlaceholderImage(gp.corrupted_image_url)) {
    return gp.corrupted_image_url;
  }
  if (m.original_image_url && !isLockedPlaceholderImage(m.original_image_url)) {
    return m.original_image_url;
  }
  if (m.base_media_url && !isLockedPlaceholderImage(m.base_media_url)) {
    return m.base_media_url;
  }

  return null;
}

export function normalizePersonStatus(status?: string | null): NormalizedPersonStatus {
  if (!status) return 'UNKNOWN';
  const normalized = status.trim().toUpperCase();
  if (normalized === 'ALIVE' || normalized === 'VIVO' || normalized === 'VIVA') {
    return 'ALIVE';
  }
  if (
    normalized === 'DEAD' ||
    normalized === 'MORTO' ||
    normalized === 'MORTA' ||
    normalized === 'FALECIDO' ||
    normalized === 'FALECIDA'
  ) {
    return 'DEAD';
  }
  if (
    normalized === 'MIA' ||
    normalized === 'DESAPARECIDO' ||
    normalized === 'DESAPARECIDA'
  ) {
    return 'MIA';
  }
  return 'UNKNOWN';
}

export function encodeClueHex(text: string, method: string, key: string): string {
  if (!text) return '';
  if (method === 'plain') return text;
  if (method === 'utf8hex') return textToHex(text);
  if (method === 'xor') return xorEncodeHex(text, key || '');
  if (method === 'enigma') return enigmaEncodeHex(text, key || '');
  return text;
}

export function decodeClueHex(encoded: string, method?: string, key?: string): string {
  if (!encoded) return '';
  if (!method || method === 'plain') return encoded;
  try {
    if (method === 'utf8hex') return hexToText(encoded);
    if (method === 'xor') return xorDecodeHex(encoded, key || '');
    if (method === 'enigma') return enigmaDecodeHex(encoded, key || '');
  } catch {
    return encoded;
  }
  return encoded;
}

function sanitizeChatList(chatList: any[]): any[] {
  if (!Array.isArray(chatList)) return [];
  return chatList
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const cleanEntry: Record<string, any> = {
        sender: item.sender === 'me' || item.sender === 'system' ? item.sender : 'them',
        type: item.type === 'image' ? 'image' : 'text',
        text: typeof item.text === 'string' ? item.text : String(item.message || item.body || ''),
      };
      if (item.id && typeof item.id === 'string') {
        cleanEntry.id = item.id;
      }
      if (item.time && typeof item.time === 'string') {
        cleanEntry.time = item.time;
      }
      if (typeof item.image_url === 'string' && !item.image_url.startsWith('blob:')) {
        cleanEntry.image_url = item.image_url;
      }
      return cleanEntry;
    });
}

function normalizeTagsArray(tagsInput: string | string[] | undefined | null): string[] {
  if (Array.isArray(tagsInput)) {
    return tagsInput
      .map((t) => (typeof t === 'string' ? t.trim() : ''))
      .filter(Boolean);
  }
  if (typeof tagsInput === 'string') {
    return tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

function stripUndefined<T extends Record<string, any>>(obj?: T): Partial<T> {
  if (!obj || typeof obj !== 'object') return {};
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

export function mergeDisplayConfig(partial?: Partial<DisplayConfig> | null): DisplayConfig {
  if (!partial || typeof partial !== 'object') {
    return {
      puzzle: { ...defaultDisplayConfig.puzzle },
      fileProperties: { ...defaultDisplayConfig.fileProperties },
      media: { ...defaultDisplayConfig.media },
      cipher: { ...defaultDisplayConfig.cipher },
      megaClue: { ...defaultDisplayConfig.megaClue },
    };
  }
  return {
    puzzle: { ...defaultDisplayConfig.puzzle, ...(partial.puzzle || {}) },
    fileProperties: {
      ...defaultDisplayConfig.fileProperties,
      ...(partial.fileProperties || {}),
    },
    media: { ...defaultDisplayConfig.media, ...(partial.media || {}) },
    cipher: { ...defaultDisplayConfig.cipher, ...(partial.cipher || {}) },
    megaClue: { ...defaultDisplayConfig.megaClue, ...(partial.megaClue || {}) },
  };
}

export function mergeFieldVisibilityConfig(
  partial?: Partial<FieldVisibilityConfig> | null
): FieldVisibilityConfig {
  if (!partial || typeof partial !== 'object') {
    return {
      fileProperties: { visibleFields: [...defaultFieldVisibility.fileProperties.visibleFields] },
      glitchPuzzle: { visibleSections: [...defaultFieldVisibility.glitchPuzzle.visibleSections] },
      megaClue: { visibleSections: [...defaultFieldVisibility.megaClue.visibleSections] },
      customMetadata: {
        enableCustomFields: defaultFieldVisibility.customMetadata.enableCustomFields,
        defaultVisibleCustomFields: [
          ...defaultFieldVisibility.customMetadata.defaultVisibleCustomFields,
        ],
        hiddenByDefault: [...defaultFieldVisibility.customMetadata.hiddenByDefault],
      },
    };
  }
  return {
    fileProperties: {
      ...defaultFieldVisibility.fileProperties,
      ...(partial.fileProperties || {}),
      visibleFields: Array.isArray(partial.fileProperties?.visibleFields)
        ? [...partial.fileProperties.visibleFields]
        : [...defaultFieldVisibility.fileProperties.visibleFields],
    },
    glitchPuzzle: {
      ...defaultFieldVisibility.glitchPuzzle,
      ...(partial.glitchPuzzle || {}),
      visibleSections: Array.isArray(partial.glitchPuzzle?.visibleSections)
        ? [...partial.glitchPuzzle.visibleSections]
        : [...defaultFieldVisibility.glitchPuzzle.visibleSections],
    },
    megaClue: {
      ...defaultFieldVisibility.megaClue,
      ...(partial.megaClue || {}),
      visibleSections: Array.isArray(partial.megaClue?.visibleSections)
        ? [...partial.megaClue.visibleSections]
        : [...defaultFieldVisibility.megaClue.visibleSections],
    },
    customMetadata: {
      ...defaultFieldVisibility.customMetadata,
      ...(partial.customMetadata || {}),
      defaultVisibleCustomFields: Array.isArray(
        partial.customMetadata?.defaultVisibleCustomFields
      )
        ? [...partial.customMetadata.defaultVisibleCustomFields]
        : [...defaultFieldVisibility.customMetadata.defaultVisibleCustomFields],
      hiddenByDefault: Array.isArray(partial.customMetadata?.hiddenByDefault)
        ? [...partial.customMetadata.hiddenByDefault]
        : [...defaultFieldVisibility.customMetadata.hiddenByDefault],
    },
  };
}

/**
 * Hydrates structured modal state slices from an existing DB card.
 * Used both by ClueModalContext.loadExistingCard and as fallback in buildClueDbPayload.
 */
export function hydrateClueStateFromCard(card?: Record<string, any> | null) {
  const m = parseCardMetadataSafe(card);
  const sl = m.security_layer || {};
  const gp = m.glitch_puzzle || {};
  const um = m.unified_media || {};
  const mc = m.mega_clue || m.megaClue || {};
  const fv = m.field_values || {};
  const p = m.person || m.person_info || m.person_meta || {};
  const mv = m.media_visibility || {};

  const rawCardType = card?.type || m.type || m.card_type || 'document';
  const normalizedEvidenceType: 'document' | 'glitch_puzzle' | 'mega_clue' =
    rawCardType === 'mega_clue'
      ? 'mega_clue'
      : rawCardType === 'glitch_puzzle'
      ? 'glitch_puzzle'
      : 'document';

  const realImgUrl = resolveExistingRealImageUrl(card, m);
  const vidUrl = card?.video_url || um.video_url || m.video_url || m.videoUrl || null;
  const audUrl = card?.audio_url || um.audio_base_url || m.audio_url || null;
  const audHidUrl =
    card?.audio_hidden_url || m.audio_hidden_url || um.audio_hidden_url || null;
  const uvUrl = card?.image_uv_url || m.uv_layer_url || m.hidden_uv_url || um.uv_layer_url || null;
  const filterUrl =
    card?.image_filter_layer || m.image_filter_layer || um.filter_layer_url || null;
  const thermalUrl = m.thermal_layer_url || um.thermal_layer_url || null;
  const forensicUrl = m.forensic_layer_url || um.forensic_layer_url || null;
  const focusedUrl = gp.focused_image_url || um.hidden_layer_url || null;
  const megaImgUrl = mc.final_image_url || mc.image_url || null;

  const hexMethod = m.hexEncodingMethod || 'plain';
  const hexKey = m.hexEncodingKey || '';
  const rawHex =
    m.hex_raw_text !== undefined && m.hex_raw_text !== null
      ? String(m.hex_raw_text)
      : decodeClueHex(m.hex_code || m.hexCode || '', hexMethod, hexKey);

  const chatList = Array.isArray(card?.chat_data)
    ? card.chat_data
    : Array.isArray(m.chat_data)
    ? m.chat_data
    : [];
  const contactName =
    card?.chat_contact_name || m.chat_contact_name || fv.chat_contact_name || 'Desconhecido';

  return {
    coreState: {
      title: card?.title || '',
      descPublic: card?.description_public || '',
      descHidden: card?.description_hidden || '',
      tags: Array.isArray(card?.tags) ? card.tags.join(', ') : card?.tags || '',
      discoveryCode: card?.discovery_code || '',
      evidenceType: normalizedEvidenceType,
      isHidden: Boolean(card?.is_hidden),
    },
    securityState: {
      isLocked: Boolean(card?.is_locked),
      lockPass: card?.lock_password || '',
      lockPasses: Array.isArray(mc.required_codes) ? [...mc.required_codes] : [],
      paceMode: (card?.pace_mode === 'between_sessions' ? 'between_sessions' : 'in_session') as PaceMode,
      rewardCardIds: Array.isArray(card?.reward_card_ids) ? [...card.reward_card_ids] : [],
      assistHint: typeof m.cris_assist_hint === 'string' ? m.cris_assist_hint : '',
      securityLayerEnabled:
        Boolean(m.security_layer?.enabled ?? m.security_layer) ||
        Boolean(m.glitch_puzzle) ||
        rawCardType === 'encrypted_video' ||
        rawCardType === 'locked_audio',
      revealLogicMode: (sl.reveal_logic || 'aligned_only') as
        | 'always_visible'
        | 'aligned_only'
        | 'aligned_keyword',
      signalTargets: sl.signal_targets || { visual: true, audio: false },
      hidePreviewOnBoard: Boolean(m.masked_preview || um.hide_preview_on_board),
      audioStaticSync: Boolean(m.audio_static_sync || gp.audio_static_sync),
      narrativeLinks: {
        audioHintsVisual: Boolean(
          m.narrative_hints?.audio_guides_visual ?? gp.narrative_hints?.audio_guides_visual
        ),
        visualHintsCode: Boolean(
          m.narrative_hints?.visual_guides_code ?? gp.narrative_hints?.visual_guides_code
        ),
        hintNote: m.narrative_hints?.hint_note || gp.narrative_hints?.hint_note || '',
      },
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
      forensicPreviewUrl: forensicUrl,
      forensicTargetChannel: (m.forensic_channel || um.forensic_channel || null) as
        | 'R'
        | 'G'
        | 'B'
        | null,
      previewUrl: realImgUrl,
      videoPreviewUrl: vidUrl,
      uvPreviewUrl: uvUrl,
      filterPreviewUrl: filterUrl,
      audioBasePreview: audUrl,
      audioHiddenPreview: audHidUrl,
      megaImagePreview: megaImgUrl,
      thermalPreviewUrl: thermalUrl,
      videoUrl: vidUrl,
      videoUrlInput: vidUrl || '',
      audioHiddenUploadedUrl: audHidUrl,
      audioTargetFreq:
        typeof card?.audio_target_freq === 'number'
          ? card.audio_target_freq
          : typeof m.audio_target_freq === 'number'
          ? m.audio_target_freq
          : 50,
      removedImage: false,
      removedVideo: false,
      removedUv: false,
      removedFilter: false,
      removedThermal: false,
      removedForensic: false,
      removedAudioBase: false,
      removedAudioHidden: false,
      removedGlitchFocused: false,
      removedMegaImage: false,
      uvAuthoringState: m.uv_authoring_state || null,
    },
    cipherState: {
      isShredded: Boolean(
        card?.is_shredded || m.is_shredded || (m.shred_rows && m.shred_cols && m.is_shredded !== false && card?.is_shredded !== false && (m.is_shredded === true || card?.is_shredded === true))
      ),
      shredRows: m.shred_rows || 1,
      shredCols: m.shred_cols || 8,
      realText: card?.real_text || m.real_text || '',
      cipherText: card?.cipher_text || m.cipher_text || '',
      hexCode: rawHex,
      hexEncodingMethod: hexMethod as 'plain' | 'utf8hex' | 'xor' | 'enigma',
      hexEncodingKey: hexKey,
    },
    glitchState: {
      glitchCorrectFrequency:
        gp.correct_frequency ?? sl.slider_config?.target_frequency ?? 17,
      glitchCorrectShift: gp.correct_shift ?? sl.slider_config?.target_shift ?? 33,
      glitchCorrectChromatic:
        gp.correct_chromatic ?? sl.slider_config?.target_chromatic ?? 12,
      glitchRewardCode: gp.reward_code ?? sl.reward_code ?? 'ALPHA-01',
      glitchKeyword: gp.correct_keyword || sl.keyword || '',
      glitchRequireKeyword: Boolean(
        gp.require_keyword_validation || sl.require_keyword
      ),
      glitchUnlockMode: (gp.unlock_mode || 'code') as
        | 'code'
        | 'code_plus_keyword'
        | 'media'
        | 'media_and_code',
      glitchDifficulty: (gp.difficulty || 'hard') as
        | 'easy'
        | 'normal'
        | 'hard'
        | 'custom',
      glitchToleranceFreq:
        gp.tolerance_frequency ?? sl.slider_config?.tolerance_frequency ?? 1,
      glitchToleranceShift:
        gp.tolerance_shift ?? sl.slider_config?.tolerance_shift ?? 2,
      glitchToleranceChroma:
        gp.tolerance_chromatic ?? sl.slider_config?.tolerance_chromatic ?? 2,
      glitchFocusedImageFile: null,
      glitchFocusedImagePreview: focusedUrl,
      showGlitchDesigner: false,
      glitchHiddenAudioUrl: gp.hidden_audio_url || '',
      glitchHiddenVideoUrl: gp.hidden_video_url || '',
      glitchHint: gp.hint || '',
      glitchAccessInstructions: gp.access_instructions || '',
      glitchStartFrequency: gp.start_frequency ?? sl.start_values?.frequency ?? 12,
      glitchStartShift: gp.start_shift ?? sl.start_values?.shift ?? 20,
      glitchStartChromatic: gp.start_chromatic ?? sl.start_values?.chromatic ?? 8,
    },
    megaClueState: {
      megaFinalTruthText: mc.final_truth_text || '',
      megaImageFile: null,
      megaImagePreview: megaImgUrl,
      megaRequiredPuzzleIds: Array.isArray(mc.required_puzzle_ids)
        ? [...mc.required_puzzle_ids]
        : [],
    },
    filterConfig: {
      brightness: clampImageFilterValue('brightness', m.image_filter_reveal?.brightness ?? 100),
      contrast: clampImageFilterValue('contrast', m.image_filter_reveal?.contrast ?? 100),
      saturate: clampImageFilterValue('saturate', m.image_filter_reveal?.saturate ?? 100),
      transform: null,
    },
    thermalConfig: {
      enabled: Boolean(m.thermal || thermalUrl),
      secretText: m.thermal_secret_text || '',
      keyword: m.thermal_keyword || '',
      fontSize: m.thermal_font_size || 24,
      positionY: m.thermal_position_y || 50,
      palette: m.thermal_authoring_state?.palette || m.thermal_palette || 'ironbow',
      elements: Array.isArray(m.thermal_authoring_state?.elements)
        ? m.thermal_authoring_state.elements
        : Array.isArray(m.thermal_elements)
        ? m.thermal_elements
        : undefined,
    },
    phoneState: {
      hasKeypad: Boolean(m.phone_locked || m.phone_has_keypad),
      password: m.phone_password || '',
      lockType: (m.phone_lock_type || 'pin') as 'pin' | 'pattern',
      contactName,
      chatList,
    },
    personState: {
      isPerson: Boolean(m.is_person || m.person || m.person_info || m.type === 'person'),
      name: p.name || '',
      age: p.dob || p.age || '',
      profession: p.occupation || p.profession || '',
      status: p.status ? normalizePersonStatus(p.status) : 'UNKNOWN',
      details: p.details || '',
    },
    metadataState: {
      fakeDate: fv.date_created || m.fakeDate || '',
      fakeLocation: fv.gps_coords || m.fakeLocation || '',
      technicalNote: fv.technical_note || m.technicalNote || '',
      fakeMetaCam: fv.camera_model || '',
      fakeMetaGps: fv.gps_coords || '',
      fakeMetaOwner: fv.device_owner || '',
      stamp: fv.stamp || m.stamp || card?.stamp_text || '',
      externalLink: fv.external_link || m.external_link || m.externalLink || '',
    },
    displayConfig: mergeDisplayConfig(m.display_config),
    fieldVisibilityConfig: mergeFieldVisibilityConfig(m.field_visibility),
    mediaVisibility: {
      audioBase: (mv.audio_base || 'always') as 'always' | 'glitch_only' | 'post_solve',
      audioHidden: (mv.audio_hidden || 'post_solve') as
        | 'post_solve'
        | 'post_keyword'
        | 'always',
      visual: (mv.visual || 'glitch_active') as
        | 'glitch_active'
        | 'post_keyword'
        | 'always',
      uvLayer: (mv.uv_layer || 'post_keyword') as
        | 'post_keyword'
        | 'always'
        | 'post_solve',
    },
    insights: Array.isArray(card?.insights) ? [...card.insights] : [],
    cardStatus: typeof m.status === 'string' ? m.status : null,
    deviceExtraction: m.device_extraction || null,
    audioStudioMeta: m.audio_studio || null,
    physicalDocument: m.physical_document || null,
  };
}

/**
 * Pure function that builds the canonical Supabase payload for `investigation_cards`.
 * Guarantees strict compliance with CARD_ALLOWED_PAYLOAD_KEYS / CARD_UPDATABLE_FIELDS,
 * lossless round-trip editing, proper Hex/XOR/Enigma encoding, and zero secret leakage.
 */
export function buildClueDbPayload(params: BuildCluePayloadParams): Record<string, any> {
  const existingCard = params.existingCard || null;
  const isDuplicate = Boolean(params.isDuplicate);
  const isUpdate = Boolean(existingCard?.id && !isDuplicate);
  const existingMeta = parseCardMetadataSafe(existingCard);
  const hydrated = hydrateClueStateFromCard(existingCard);
  const stateBag = params.state || {};
  const urls = params.uploadedUrls || {};

  const core = {
    ...hydrated.coreState,
    ...stripUndefined(stateBag.coreState),
    ...stripUndefined(params.coreState),
  };
  const security = {
    ...hydrated.securityState,
    ...stripUndefined(stateBag.securityState),
    ...stripUndefined(params.securityState),
  };
  const media = {
    ...hydrated.mediaState,
    ...stripUndefined(stateBag.mediaState),
    ...stripUndefined(params.mediaState),
  };
  const cipher = {
    ...hydrated.cipherState,
    ...stripUndefined(stateBag.cipherState),
    ...stripUndefined(params.cipherState),
  };
  const glitch = {
    ...hydrated.glitchState,
    ...stripUndefined(stateBag.glitchState),
    ...stripUndefined(params.glitchState),
  };
  const mega = {
    ...hydrated.megaClueState,
    ...stripUndefined(stateBag.megaClueState),
    ...stripUndefined(params.megaClueState),
  };
  const filter = {
    ...hydrated.filterConfig,
    ...stripUndefined(stateBag.filterConfig),
    ...stripUndefined(params.filterConfig),
  };
  const thermal = {
    ...hydrated.thermalConfig,
    ...stripUndefined(stateBag.thermalConfig),
    ...stripUndefined(params.thermalConfig),
  };
  const phone = {
    ...hydrated.phoneState,
    ...stripUndefined(stateBag.phoneState),
    ...stripUndefined(params.phoneState),
  };
  const person = {
    ...hydrated.personState,
    ...stripUndefined(stateBag.personState),
    ...stripUndefined(params.personState),
  };
  const metaFields = {
    ...hydrated.metadataState,
    ...stripUndefined(stateBag.metadataState),
    ...stripUndefined(params.metadataState),
  };

  const displayCfg = mergeDisplayConfig(
    params.displayConfig ?? stateBag.displayConfig ?? hydrated.displayConfig
  );
  const fieldVisCfg = mergeFieldVisibilityConfig(
    params.fieldVisibilityConfig ??
      stateBag.fieldVisibilityConfig ??
      hydrated.fieldVisibilityConfig
  );
  const mediaVis = {
    ...hydrated.mediaVisibility,
    ...stripUndefined(stateBag.mediaVisibility),
    ...stripUndefined(params.mediaVisibility),
  };

  const insights: InvestigationCardInsight[] =
    params.insights !== undefined
      ? params.insights
      : stateBag.insights !== undefined
      ? stateBag.insights
      : hydrated.insights;

  const cardStatus: string | null =
    params.cardStatus !== undefined
      ? params.cardStatus
      : stateBag.cardStatus !== undefined
      ? stateBag.cardStatus
      : hydrated.cardStatus;

  // ====== RESOLVE ALL MEDIA URLS WITH LOSSLESS ROUND-TRIP ======
  const uploadedImg = urls.imgUrl ?? urls.imageUrl ?? urls.image_url;
  const uploadedUv = urls.uvUrl ?? urls.imageUvUrl ?? urls.image_uv_url;
  const uploadedFilter =
    urls.filterUrl ?? urls.imageFilterLayer ?? urls.image_filter_layer;
  const uploadedThermal = urls.thermalUrl ?? urls.thermal_layer_url;
  const uploadedForensic = urls.forensicUrl ?? urls.forensic_layer_url;
  const uploadedVideo = urls.videoUrl ?? urls.finalVideoUrl ?? urls.video_url;
  const uploadedAud = urls.audUrl ?? urls.audioUrl ?? urls.audio_url;
  const uploadedAudHid =
    urls.audHidUrl ?? urls.audioHiddenUrl ?? urls.audio_hidden_url;
  const uploadedFocused =
    urls.glitchFocusedUrl ?? urls.focusedImageUrl ?? urls.focused_image_url;
  const uploadedMegaImg = urls.megaImageUrl ?? urls.final_image_url;

  const realImgUrl: string | null = (() => {
    if (uploadedImg !== undefined && uploadedImg !== null) return uploadedImg;
    if (media.removedImage) return null;
    if (
      isRemoteOrDataUrl(media.previewUrl) &&
      !isLockedPlaceholderImage(media.previewUrl)
    ) {
      return media.previewUrl;
    }
    return resolveExistingRealImageUrl(existingCard, existingMeta);
  })();

  const uvUrl: string | null = (() => {
    if (uploadedUv !== undefined && uploadedUv !== null) return uploadedUv;
    if (media.removedUv) return null;
    if (isRemoteOrDataUrl(media.uvPreviewUrl)) return media.uvPreviewUrl;
    return (
      existingCard?.image_uv_url ||
      existingMeta.uv_layer_url ||
      existingMeta.hidden_uv_url ||
      existingMeta.unified_media?.uv_layer_url ||
      null
    );
  })();

  const filterUrl: string | null = (() => {
    if (uploadedFilter !== undefined && uploadedFilter !== null) return uploadedFilter;
    if (media.removedFilter) return null;
    if (isRemoteOrDataUrl(media.filterPreviewUrl)) return media.filterPreviewUrl;
    return (
      existingCard?.image_filter_layer ||
      existingMeta.image_filter_layer ||
      existingMeta.unified_media?.filter_layer_url ||
      null
    );
  })();

  const thermalUrl: string | null = (() => {
    if (uploadedThermal !== undefined && uploadedThermal !== null) return uploadedThermal;
    if (media.removedThermal) return null;
    if (isRemoteOrDataUrl(media.thermalPreviewUrl)) return media.thermalPreviewUrl;
    return (
      existingMeta.thermal_layer_url ||
      existingMeta.unified_media?.thermal_layer_url ||
      null
    );
  })();

  const forensicUrl: string | null = (() => {
    if (uploadedForensic !== undefined && uploadedForensic !== null)
      return uploadedForensic;
    if (media.removedForensic) return null;
    if (isRemoteOrDataUrl(media.forensicPreviewUrl)) return media.forensicPreviewUrl;
    return (
      existingMeta.forensic_layer_url ||
      existingMeta.unified_media?.forensic_layer_url ||
      null
    );
  })();

  const finalVideoUrl: string | null = (() => {
    if (uploadedVideo !== undefined && uploadedVideo !== null) return uploadedVideo;
    if (media.removedVideo) return null;
    const manualInput = typeof media.videoUrlInput === 'string' ? media.videoUrlInput.trim() : '';
    if (manualInput && !manualInput.startsWith('blob:')) return manualInput;
    if (isRemoteOrDataUrl(media.videoUrl)) return media.videoUrl;
    return (
      existingCard?.video_url ||
      existingMeta.unified_media?.video_url ||
      existingMeta.video_url ||
      existingMeta.videoUrl ||
      null
    );
  })();

  const audUrl: string | null = (() => {
    if (uploadedAud !== undefined && uploadedAud !== null) return uploadedAud;
    if (media.removedAudioBase) return null;
    if (isRemoteOrDataUrl(media.audioBasePreview)) return media.audioBasePreview;
    return (
      existingCard?.audio_url ||
      existingMeta.unified_media?.audio_base_url ||
      existingMeta.audio_url ||
      null
    );
  })();

  const audHidUrl: string | null = (() => {
    if (uploadedAudHid !== undefined && uploadedAudHid !== null) return uploadedAudHid;
    if (media.removedAudioHidden) return null;
    if (isRemoteOrDataUrl(media.audioHiddenUploadedUrl))
      return media.audioHiddenUploadedUrl;
    if (isRemoteOrDataUrl(media.audioHiddenPreview)) return media.audioHiddenPreview;
    return (
      existingCard?.audio_hidden_url ||
      existingMeta.audio_hidden_url ||
      existingMeta.unified_media?.audio_hidden_url ||
      null
    );
  })();

  const glitchFocusedUrl: string | null = (() => {
    if (uploadedFocused !== undefined && uploadedFocused !== null) return uploadedFocused;
    if (media.removedGlitchFocused) return null;
    if (isRemoteOrDataUrl(glitch.glitchFocusedImagePreview)) {
      return glitch.glitchFocusedImagePreview;
    }
    return (
      existingMeta.glitch_puzzle?.focused_image_url ||
      existingMeta.unified_media?.hidden_layer_url ||
      null
    );
  })();

  const megaImageUrl: string | null = (() => {
    if (uploadedMegaImg !== undefined && uploadedMegaImg !== null) return uploadedMegaImg;
    if (media.removedMegaImage) return null;
    if (isRemoteOrDataUrl(mega.megaImagePreview)) return mega.megaImagePreview;
    if (isRemoteOrDataUrl(media.megaImagePreview)) return media.megaImagePreview;
    return (
      existingMeta.mega_clue?.final_image_url ||
      existingMeta.mega_clue?.image_url ||
      null
    );
  })();

  const audioTargetFreq: number | null = (() => {
    if (typeof media.audioTargetFreq === 'number' && !Number.isNaN(media.audioTargetFreq)) {
      return media.audioTargetFreq;
    }
    if (typeof existingCard?.audio_target_freq === 'number') {
      return existingCard.audio_target_freq;
    }
    if (typeof existingMeta.audio_target_freq === 'number') {
      return existingMeta.audio_target_freq;
    }
    return 50;
  })();

  // ====== MERGE METADATA PRESERVING RUNTIME KEYS ======
  const metadata: Record<string, any> = {
    ...existingMeta,
    display_config: displayCfg,
    media_visibility: {
      audio_base: mediaVis.audioBase,
      audio_hidden: mediaVis.audioHidden,
      uv_layer: mediaVis.uvLayer,
      visual: mediaVis.visual,
    },
    field_visibility: fieldVisCfg,
    image_filter_reveal: {
      brightness: clampImageFilterValue('brightness', filter.brightness ?? 100),
      contrast: clampImageFilterValue('contrast', filter.contrast ?? 100),
      saturate: clampImageFilterValue('saturate', filter.saturate ?? 100),
    },
    audio_target_freq: audioTargetFreq,
  };

  if (stateBag.physicalDocument !== undefined || (params as any).physicalDocument !== undefined) {
    const doc = stateBag.physicalDocument ?? (params as any).physicalDocument;
    if (doc) {
      metadata.physical_document = stripBlobUrlsDeep(doc);
    } else {
      delete metadata.physical_document;
    }
  } else if (typeof window !== 'undefined' && (window as any).__ecdiseDocStudioDraft) {
    metadata.physical_document = stripBlobUrlsDeep((window as any).__ecdiseDocStudioDraft);
  }
  if (stateBag.deviceExtraction !== undefined || (params as any).deviceExtraction !== undefined) {
    const dev = stateBag.deviceExtraction ?? (params as any).deviceExtraction;
    if (dev) {
      metadata.device_extraction = stripBlobUrlsDeep(dev);
    } else {
      delete metadata.device_extraction;
    }
  }
  if (stateBag.audioStudioMeta || (params as any).audioStudioMeta) {
    metadata.audio_studio = stateBag.audioStudioMeta || (params as any).audioStudioMeta;
  }

  if (cardStatus) {
    metadata.status = cardStatus;
  } else if (params.cardStatus === null || stateBag.cardStatus === null) {
    delete metadata.status;
  }

  // Layer URLs in metadata
  if (thermalUrl) {
    metadata.thermal_layer_url = thermalUrl;
  } else if (media.removedThermal) {
    delete metadata.thermal_layer_url;
  }

  if (forensicUrl) {
    metadata.forensic_layer_url = forensicUrl;
    metadata.forensic_channel = media.forensicTargetChannel || existingMeta.forensic_channel || null;
  } else if (media.removedForensic) {
    delete metadata.forensic_layer_url;
    delete metadata.forensic_channel;
  }

  if (uvUrl) {
    metadata.uv_layer_url = uvUrl;
    if (media.uvAuthoringState) {
      metadata.uv_authoring_state = media.uvAuthoringState;
    }
  } else if (media.removedUv) {
    delete metadata.uv_layer_url;
    delete metadata.hidden_uv_url;
    delete metadata.uv_authoring_state;
  }

  if (audHidUrl) {
    metadata.audio_hidden_url = audHidUrl;
  } else if (media.removedAudioHidden) {
    delete metadata.audio_hidden_url;
  }

  if (filterUrl) {
    metadata.image_filter_layer = filterUrl;
  } else if (media.removedFilter) {
    delete metadata.image_filter_layer;
  }
  // Camada de tratamento é sempre 100% alinhada à base; transform legado é ignorado.
  delete metadata.image_filter_layer_transform;

  // Shredder & Cipher inside metadata (NEVER as stray top-level columns)
  if (cipher.isShredded) {
    metadata.is_shredded = true;
    metadata.shred_rows = cipher.shredRows || 1;
    metadata.shred_cols = cipher.shredCols || 8;
  } else {
    metadata.is_shredded = false;
  }

  if (cipher.realText) {
    metadata.real_text = cipher.realText;
  } else if (params.cipherState?.realText === '' || stateBag.cipherState?.realText === '') {
    delete metadata.real_text;
  }

  if (cipher.cipherText) {
    metadata.cipher_text = cipher.cipherText;
  } else if (params.cipherState?.cipherText === '' || stateBag.cipherState?.cipherText === '') {
    delete metadata.cipher_text;
  }

  // Hex encoding (with real Enigma/XOR/UTF-8 and raw text saved to avoid double-encoding)
  if (cipher.hexCode) {
    const method = cipher.hexEncodingMethod || 'plain';
    const key = cipher.hexEncodingKey || '';
    metadata.hex_raw_text = cipher.hexCode;
    metadata.hexEncodingMethod = method;
    metadata.hexEncodingKey = key;
    metadata.hex_code = encodeClueHex(cipher.hexCode, method, key);
  } else if (params.cipherState?.hexCode === '' || stateBag.cipherState?.hexCode === '') {
    delete metadata.hex_code;
    delete metadata.hex_raw_text;
    delete metadata.hexEncodingMethod;
    delete metadata.hexEncodingKey;
  }

  // Thermal
  if (thermal.enabled || thermalUrl) {
    metadata.thermal = true;
    if (thermal.secretText) {
      metadata.thermal_secret_text = thermal.secretText;
    } else {
      delete metadata.thermal_secret_text;
    }
    if (thermal.keyword) {
      metadata.thermal_keyword = thermal.keyword;
    } else {
      delete metadata.thermal_keyword;
    }
    metadata.thermal_font_size = thermal.fontSize || 24;
    metadata.thermal_position_y = thermal.positionY ?? 50;
    if (thermal.elements && Array.isArray(thermal.elements)) {
      metadata.thermal_authoring_state = {
        version: 1,
        palette: thermal.palette || 'ironbow',
        elements: thermal.elements,
      };
    } else if (thermal.palette) {
      metadata.thermal_authoring_state = {
        ...(existingMeta.thermal_authoring_state || { version: 1, elements: [] }),
        palette: thermal.palette,
      };
    }
    if (isDuplicate) {
      metadata.thermal_unlocked = false;
    }
  } else {
    metadata.thermal = false;
    delete metadata.thermal_secret_text;
    delete metadata.thermal_keyword;
    delete metadata.thermal_authoring_state;
  }

  // Chat / Fake Phone (sanitized, stored both top-level and in metadata)
  const cleanChatList = sanitizeChatList(phone.chatList || []);
  const cleanContactName =
    cleanChatList.length > 0 || phone.hasKeypad
      ? phone.contactName || 'Desconhecido'
      : null;

  if (cleanChatList.length > 0) {
    metadata.chat_data = cleanChatList;
    metadata.chat_contact_name = cleanContactName;
  } else {
    delete metadata.chat_data;
    if (!phone.hasKeypad) {
      delete metadata.chat_contact_name;
    }
  }

  if (phone.hasKeypad) {
    metadata.phone_locked = true;
    metadata.phone_has_keypad = true;
    metadata.phone_password = phone.password || '';
    metadata.phone_lock_type = phone.lockType || 'pin';
  } else {
    metadata.phone_locked = false;
    metadata.phone_has_keypad = false;
    delete metadata.phone_password;
  }

  // Person Dossier
  if (person.isPerson) {
    const normalizedStatus = normalizePersonStatus(person.status);
    metadata.is_person = true;
    metadata.person = {
      ...(existingMeta.person || {}),
      name: person.name || core.title,
      dob: person.age || null,
      age: person.age || null,
      status: normalizedStatus,
      occupation: person.profession || null,
      details: person.details || null,
    };
  } else {
    metadata.is_person = false;
    delete metadata.person;
  }

  // Stamp & External Link & Field Values (strictly public/EXIF fields — NO secrets!)
  if (metaFields.stamp) {
    metadata.stamp = metaFields.stamp;
    metadata.stamp_text = metaFields.stamp;
  } else {
    delete metadata.stamp;
    delete metadata.stamp_text;
  }

  if (metaFields.externalLink) {
    metadata.external_link = metaFields.externalLink;
  } else {
    delete metadata.external_link;
  }

  metadata.field_values = {
    date_created: metaFields.fakeDate || null,
    gps_coords: metaFields.fakeLocation || metaFields.fakeMetaGps || null,
    device_owner: metaFields.fakeMetaOwner || null,
    camera_model: metaFields.fakeMetaCam || null,
    technical_note: metaFields.technicalNote || null,
    chat_contact_name: cleanContactName || null,
    stamp: metaFields.stamp || null,
    external_link: metaFields.externalLink || null,
  };

  // Security Layer & Glitch Puzzle
  const wantsSecurityLayer =
    Boolean(security.securityLayerEnabled) || core.evidenceType === 'glitch_puzzle';
  const revealRequiresKeyword =
    security.revealLogicMode === 'aligned_keyword' ||
    Boolean(glitch.glitchRequireKeyword) ||
    glitch.glitchUnlockMode === 'code_plus_keyword';

  const baseMediaType = finalVideoUrl
    ? 'video'
    : audUrl
    ? 'audio'
    : realImgUrl
    ? 'image'
    : 'unknown';
  const baseMediaUrl = finalVideoUrl || audUrl || realImgUrl || null;

  if (wantsSecurityLayer) {
    const securityLayer = {
      ...(existingMeta.security_layer || {}),
      enabled: true,
      reveal_logic: security.revealLogicMode || 'aligned_only',
      require_keyword: revealRequiresKeyword,
      keyword: revealRequiresKeyword ? glitch.glitchKeyword || null : null,
      reward_code: glitch.glitchRewardCode || null,
      signal_targets: security.signalTargets || { visual: true, audio: false },
      slider_config: {
        target_frequency: glitch.glitchCorrectFrequency ?? 17,
        target_shift: glitch.glitchCorrectShift ?? 33,
        target_chromatic: glitch.glitchCorrectChromatic ?? 12,
        tolerance_frequency: glitch.glitchToleranceFreq ?? 1,
        tolerance_shift: glitch.glitchToleranceShift ?? 2,
        tolerance_chromatic: glitch.glitchToleranceChroma ?? 2,
      },
      start_values: {
        frequency: glitch.glitchStartFrequency ?? 12,
        shift: glitch.glitchStartShift ?? 20,
        chromatic: glitch.glitchStartChromatic ?? 8,
      },
    };

    const existingGp = existingMeta.glitch_puzzle || {};
    const glitchPuzzleMeta: Record<string, any> = {
      ...existingGp,
      original_image_url: realImgUrl || baseMediaUrl || null,
      corrupted_image_url: realImgUrl || null,
      correct_frequency: glitch.glitchCorrectFrequency ?? 17,
      correct_shift: glitch.glitchCorrectShift ?? 33,
      correct_chromatic: glitch.glitchCorrectChromatic ?? 12,
      difficulty: glitch.glitchDifficulty || 'hard',
      tolerance_frequency: glitch.glitchToleranceFreq ?? 1,
      tolerance_shift: glitch.glitchToleranceShift ?? 2,
      tolerance_chromatic: glitch.glitchToleranceChroma ?? 2,
      start_frequency: glitch.glitchStartFrequency ?? 12,
      start_shift: glitch.glitchStartShift ?? 20,
      start_chromatic: glitch.glitchStartChromatic ?? 8,
      access_instructions: glitch.glitchAccessInstructions || undefined,
      hint: glitch.glitchHint || undefined,
      reward_code: glitch.glitchRewardCode || 'ALPHA-01',
      correct_keyword: revealRequiresKeyword ? glitch.glitchKeyword || null : null,
      require_keyword_validation: revealRequiresKeyword,
      unlock_mode: glitch.glitchUnlockMode || 'code',
      hidden_uv_url: uvUrl || null,
      hidden_audio_url: glitch.glitchHiddenAudioUrl || null,
      hidden_video_url: glitch.glitchHiddenVideoUrl || null,
      focused_image_url: glitchFocusedUrl || null,
      image_uv_url: uvUrl || null,
      media_visibility: metadata.media_visibility,
      audio_static_sync: Boolean(security.audioStaticSync),
      narrative_hints: {
        audio_guides_visual: Boolean(security.narrativeLinks?.audioHintsVisual),
        visual_guides_code: Boolean(security.narrativeLinks?.visualHintsCode),
        hint_note: security.narrativeLinks?.hintNote || null,
      },
      security_layer: securityLayer,
      solved: isDuplicate ? false : Boolean(existingGp.solved),
    };
    if (isDuplicate) {
      delete glitchPuzzleMeta.solved_at;
    }

    metadata.unified_media = {
      ...(existingMeta.unified_media || {}),
      base_media_type: baseMediaType,
      base_media_url: baseMediaUrl,
      uv_layer_url: uvUrl || null,
      filter_layer_url: filterUrl || null,
      thermal_layer_url: thermalUrl || null,
      forensic_layer_url: forensicUrl || null,
      forensic_channel: media.forensicTargetChannel || existingMeta.forensic_channel || null,
      hidden_layer_url: glitchFocusedUrl || null,
      video_url: finalVideoUrl || null,
      audio_base_url: audUrl || null,
      audio_hidden_url: audHidUrl || null,
      hide_preview_on_board: Boolean(security.hidePreviewOnBoard),
    };

    metadata.masked_preview = Boolean(security.hidePreviewOnBoard);
    metadata.security_layer = securityLayer;
    metadata.glitch_puzzle = glitchPuzzleMeta;
    metadata.audio_static_sync = Boolean(security.audioStaticSync);
    metadata.narrative_hints = {
      audio_guides_visual: Boolean(security.narrativeLinks?.audioHintsVisual),
      visual_guides_code: Boolean(security.narrativeLinks?.visualHintsCode),
      hint_note: security.narrativeLinks?.hintNote || null,
    };
  } else {
    const explicitlyDisabledSecurity =
      params.securityState?.securityLayerEnabled === false ||
      stateBag.securityState?.securityLayerEnabled === false;
    if (explicitlyDisabledSecurity) {
      metadata.glitch_puzzle = null;
      metadata.security_layer = null;
    }
    if (realImgUrl || uvUrl || filterUrl || thermalUrl || forensicUrl || audUrl || audHidUrl || finalVideoUrl) {
      metadata.unified_media = {
        ...(existingMeta.unified_media || {}),
        base_media_type: baseMediaType,
        base_media_url: baseMediaUrl,
        uv_layer_url: uvUrl || null,
        filter_layer_url: filterUrl || null,
        thermal_layer_url: thermalUrl || null,
        forensic_layer_url: forensicUrl || null,
        forensic_channel: media.forensicTargetChannel || existingMeta.forensic_channel || null,
        hidden_layer_url: glitchFocusedUrl || null,
        video_url: finalVideoUrl || null,
        audio_base_url: audUrl || null,
        audio_hidden_url: audHidUrl || null,
        hide_preview_on_board: Boolean(security.hidePreviewOnBoard),
      };
    }
  }

  // Mega Clue (and preservation if existingMeta.mega_clue was already present)
  if (core.evidenceType === 'mega_clue') {
    const existingMc = existingMeta.mega_clue || {};
    const requiredIds = Array.isArray(mega.megaRequiredPuzzleIds)
      ? [...mega.megaRequiredPuzzleIds]
      : [];
    metadata.mega_clue = {
      ...existingMc,
      final_truth_text: mega.megaFinalTruthText || '',
      final_image_url: megaImageUrl || null,
      ...(megaImageUrl ? { image_url: megaImageUrl } : {}),
      required_puzzle_ids: requiredIds,
      required_code_count: requiredIds.length,
      solved_puzzle_ids: isDuplicate
        ? []
        : Array.isArray(existingMc.solved_puzzle_ids)
        ? [...existingMc.solved_puzzle_ids]
        : [],
      collected_codes: isDuplicate
        ? []
        : Array.isArray(existingMc.collected_codes)
        ? [...existingMc.collected_codes]
        : [],
      unlocked: isDuplicate ? false : Boolean(existingMc.unlocked),
      ...(security.isLocked
        ? {
            required_codes:
              Array.isArray(security.lockPasses) && security.lockPasses.length > 0
                ? [...security.lockPasses]
                : existingMc.required_codes || [],
          }
        : {}),
    };
  } else if (existingMeta.mega_clue && isDuplicate) {
    metadata.mega_clue = {
      ...existingMeta.mega_clue,
      solved_puzzle_ids: [],
      collected_codes: [],
      unlocked: false,
    };
  }

  if (realImgUrl) {
    metadata.original_image_url = realImgUrl;
  } else if (media.removedImage) {
    delete metadata.original_image_url;
  }

  // ====== RESOLVE CARD TYPE & BOARD IMAGE ======
  const resolvedCardType = (() => {
    if (core.evidenceType === 'mega_clue') return 'mega_clue';
    if (core.evidenceType === 'glitch_puzzle') return 'glitch_puzzle';
    if (wantsSecurityLayer) {
      if (finalVideoUrl) return 'encrypted_video';
      if (audUrl || media.audioBase) return 'locked_audio';
      if (realImgUrl) return 'glitch_puzzle';
    }
    return core.evidenceType === 'document' ? null : core.evidenceType || null;
  })();

  const shouldMaskBoardImage =
    Boolean(security.hidePreviewOnBoard) && core.evidenceType !== 'glitch_puzzle';

  const boardImageUrl: string | null = shouldMaskBoardImage
    ? LOCKED_PLACEHOLDER_IMG
    : realImgUrl || (core.evidenceType === 'mega_clue' ? megaImageUrl : null) || null;

  const baseX =
    existingCard && typeof existingCard.x === 'number'
      ? existingCard.x + (isDuplicate ? 40 : 0)
      : params.initialX ?? 100;
  const baseY =
    existingCard && typeof existingCard.y === 'number'
      ? existingCard.y + (isDuplicate ? 40 : 0)
      : params.initialY ?? 100;

  const rawPayload: Record<string, any> = {
    ...(isUpdate
      ? {}
      : {
          investigation_id:
            params.investigationId || existingCard?.investigation_id || '',
        }),
    title: (core.title || '').trim(),
    type: resolvedCardType,
    description_public: core.descPublic ? core.descPublic : null,
    description_hidden: core.descHidden ? core.descHidden : null,
    image_url: boardImageUrl,
    image_uv_url: uvUrl,
    video_url: finalVideoUrl,
    audio_url: audUrl,
    audio_hidden_url: audHidUrl,
    audio_target_freq: audioTargetFreq,
    image_filter_layer: filterUrl,
    is_locked: Boolean(security.isLocked),
    lock_password:
      security.isLocked && core.evidenceType !== 'mega_clue' && !security.useServerSecret
        ? security.lockPass || null
        : null,
    lock_type:
      security.isLocked && core.evidenceType !== 'mega_clue'
        ? ((security.lockPass ? inferLockTypeFromSecret(security.lockPass) : existingCard?.lock_type || 'terminal') as LockType)
        : null,
    pace_mode: (security.paceMode === 'between_sessions' ? 'between_sessions' : 'in_session') as PaceMode,
    reward_card_ids: Array.isArray(security.rewardCardIds)
      ? security.rewardCardIds.filter((id) => typeof id === 'string' && id.trim().length > 0)
      : [],
    is_hidden: Boolean(core.isHidden),
    discovery_code: core.isHidden
      ? (core.discoveryCode || '').trim().toUpperCase() || null
      : null,
    x: baseX,
    y: baseY,
    z_index: existingCard?.z_index ?? 0,
    visibility: existingCard?.visibility ?? null,
    tags: normalizeTagsArray(core.tags),
    insights: Array.isArray(insights) ? insights : [],
    metadata,
    chat_data: cleanChatList.length > 0 ? cleanChatList : null,
    chat_contact_name: cleanContactName,
  };

  // Enforce strict allowlist on top-level keys
  const allowedSet = new Set<string>(
    isUpdate ? CARD_UPDATABLE_PAYLOAD_KEYS : CARD_ALLOWED_PAYLOAD_KEYS
  );
  const safePayload: Record<string, any> = {};
  for (const [key, value] of Object.entries(rawPayload)) {
    if (allowedSet.has(key)) {
      safePayload[key] = value;
    }
  }

  return safePayload;
}

function sanitizeSecurityLayerForPublic(sl: any): Record<string, any> {
  const copy = { ...sl };
  delete copy.keyword;
  if (copy.slider_config && typeof copy.slider_config === 'object') {
    const sliderCopy = { ...copy.slider_config };
    for (const k of Object.keys(sliderCopy)) {
      if (k.startsWith('target_')) {
        delete sliderCopy[k];
      }
    }
    copy.slider_config = sliderCopy;
  }
  return copy;
}

/**
 * Returns a deep-cloned public player view of a card with all GM/solution secrets stripped
 * and locked content masked when `card.is_locked === true`.
 */
export function serializePublicClueCard(card: Record<string, any>): Record<string, any> {
  if (!card || typeof card !== 'object') return {};

  const publicCard: Record<string, any> = {
    ...card,
    description_hidden: null,
    lock_password: null,
    discovery_code: null,
  };
  delete publicCard.real_text;

  const meta = parseCardMetadataSafe(card);
  const publicMeta: Record<string, any> = { ...meta };

  delete publicMeta.description_hidden;
  delete publicMeta.lock_password;
  delete publicMeta.discovery_code;
  delete publicMeta.phone_password;
  delete publicMeta.hex_raw_text;
  delete publicMeta.hexEncodingKey;

  if (publicMeta.security_layer && typeof publicMeta.security_layer === 'object') {
    publicMeta.security_layer = sanitizeSecurityLayerForPublic(publicMeta.security_layer);
  }

  if (publicMeta.glitch_puzzle && typeof publicMeta.glitch_puzzle === 'object') {
    const gpCopy: Record<string, any> = { ...publicMeta.glitch_puzzle };
    delete gpCopy.correct_keyword;
    delete gpCopy.correct_frequency;
    delete gpCopy.correct_shift;
    delete gpCopy.correct_chromatic;
    if (gpCopy.security_layer && typeof gpCopy.security_layer === 'object') {
      gpCopy.security_layer = sanitizeSecurityLayerForPublic(gpCopy.security_layer);
    }
    publicMeta.glitch_puzzle = gpCopy;
  }

  const showMegaAnswer = Boolean(
    publicMeta.mega_clue?.unlocked || publicMeta.display_config?.megaClue?.showAnswer
  );
  if (publicMeta.mega_clue && typeof publicMeta.mega_clue === 'object') {
    const mcCopy: Record<string, any> = { ...publicMeta.mega_clue };
    delete mcCopy.required_codes;
    if (!showMegaAnswer) {
      delete mcCopy.final_truth_text;
      delete mcCopy.final_image_url;
      delete mcCopy.image_url;
    }
    publicMeta.mega_clue = mcCopy;
  }

  if (!publicMeta.thermal_unlocked) {
    delete publicMeta.thermal_secret_text;
    delete publicMeta.thermal_keyword;
  }
  delete publicMeta.uv_authoring_state;
  delete publicMeta.thermal_authoring_state;

  const showRealText = Boolean(publicMeta.display_config?.cipher?.showRealText);
  if (!showRealText) {
    delete publicMeta.real_text;
  }

  if (card.is_locked === true) {
    publicCard.description_public = null;
    publicCard.chat_data = null;
    publicCard.audio_url = null;
    publicCard.audio_hidden_url = null;
    publicCard.video_url = null;
    publicCard.image_uv_url = null;

    delete publicMeta.chat_data;
    delete publicMeta.audio_url;
    delete publicMeta.audio_hidden_url;
    delete publicMeta.video_url;
    delete publicMeta.uv_layer_url;
    delete publicMeta.hidden_uv_url;

    if (publicMeta.unified_media && typeof publicMeta.unified_media === 'object') {
      publicMeta.unified_media = {
        ...publicMeta.unified_media,
        audio_base_url: null,
        audio_hidden_url: null,
        video_url: null,
        uv_layer_url: null,
      };
    }
    if (publicMeta.glitch_puzzle && typeof publicMeta.glitch_puzzle === 'object') {
      publicMeta.glitch_puzzle = {
        ...publicMeta.glitch_puzzle,
        hidden_uv_url: null,
        image_uv_url: null,
        hidden_audio_url: null,
        hidden_video_url: null,
        focused_image_url: null,
      };
    }
  }

  publicCard.metadata = publicMeta;
  return publicCard;
}
