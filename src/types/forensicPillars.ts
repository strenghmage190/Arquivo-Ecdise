export type AudioStegoMode = 'ghost_zone' | 'stereo_lr' | 'noise_sculpt' | 'lsb';

export type DiscretionLevel = 'discreet' | 'texture' | 'audible';

export interface AudioAnomalyReport {
  hasHighFreqEnergy: boolean;
  highFreqPeakHz: number | null;
  hasStereoAsymmetry: boolean;
  stereoDiffRatio: number;
  hasLsbPayload: boolean;
}

export interface AudioStudioMetadata {
  version: 2;
  mode: AudioStegoMode;
  minFreqHz: number;
  maxFreqHz: number;
  startSec: number;
  endSec: number;
  sampleRate: number;
  discretion: DiscretionLevel;
  anomaly: AudioAnomalyReport;
  presetApplied?: string | null;
}

export type InkLayerType = 'normal' | 'uv' | 'thermal' | 'chromatic_r' | 'chromatic_g' | 'chromatic_b';

export interface DocumentLayer {
  id: string;
  side: 'front' | 'back';
  inkType: InkLayerType;
  kind: 'text' | 'image' | 'scribble_mask' | 'freehand';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  color?: string;
  fontSize?: number;
  points?: { x: number; y: number }[];
  strokeWidth?: number;
}

export interface FragmentationConfig {
  mode: 'intact' | 'shredder_strips' | 'torn_pieces';
  cols: number;
  rows: number;
  allowRotation: boolean;
  allowFlip: boolean;
}

export interface PhysicalDocumentMetadata {
  version: 2;
  frontBaseUrl?: string | null;
  backBaseUrl?: string | null;
  layers: DocumentLayer[];
  fragmentation: FragmentationConfig;
}

export interface DeviceExifMetadata {
  date?: string;
  time?: string;
  camera?: string;
  gps?: string;
  locationNote?: string;
}

export interface DeviceMessage {
  id: string;
  sender: 'me' | 'them' | 'system';
  type: 'text' | 'image' | 'audio';
  text: string;
  mediaUrl?: string;
  time?: string;
  isDeleted?: boolean;
  restorableText?: string;
}

export interface DeviceThread {
  id: string;
  contactName: string;
  contactStatus?: string;
  messages: DeviceMessage[];
}

export interface DeviceGalleryItem {
  id: string;
  url: string;
  caption?: string;
  exif?: DeviceExifMetadata;
}

export interface DeviceNoteItem {
  id: string;
  title: string;
  body: string;
  updatedAt?: string;
  isLocked?: boolean;
  password?: string;
  hint?: string;
  encryptedPayload?: {
    ciphertext: string;
    iv: string;
    salt: string;
  };
}

export interface DeviceVoicemailItem {
  id: string;
  caller: string;
  duration: string;
  date: string;
  audioUrl: string;
  transcriptHint?: string;
}

export interface DeviceTrashItem {
  id: string;
  kind: 'message' | 'photo' | 'note' | 'audio';
  label: string;
  preview: string;
  mediaUrl?: string;
  deletedAt?: string;
  recovered?: boolean;
}

export interface DeviceExtractionMetadata {
  version: 2;
  ownerName?: string;
  lockScreen: {
    enabled: boolean;
    type: 'pin' | 'pattern';
    code: string;
    smudgeHints?: string[];
  };
  enabledApps: {
    messages: boolean;
    gallery: boolean;
    notes: boolean;
    voicemails: boolean;
    trash: boolean;
  };
  trashUnlockCode?: string;
  threads: DeviceThread[];
  gallery: DeviceGalleryItem[];
  notes: DeviceNoteItem[];
  voicemails: DeviceVoicemailItem[];
  trash: DeviceTrashItem[];
}

export type ForensicTargetTool = 'acoustic_workbench' | 'document_table' | 'decoder';

export interface ForensicAssetPayload {
  sourceCardId?: string;
  sourceLabel: string;
  assetType: 'audio' | 'image' | 'text';
  url?: string;
  text?: string;
  metadata?: Record<string, any>;
}

export interface BoardSnippetRequest {
  title: string;
  description?: string;
  imageBlob?: Blob;
  imageUrl?: string;
  text?: string;
  sourceCardId?: string;
}
