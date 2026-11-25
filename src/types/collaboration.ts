export type PinToolType = 'board' | 'acoustic' | 'document' | 'phone';

export type PinTag = 'suspect' | 'code' | 'look_here' | 'contradiction' | 'question';

export type FindingCategory = 'code' | 'person' | 'date' | 'location' | 'theory';

export type FindingSourceTool = PinToolType | 'manual';

export type TeamCardStatus = 'unexplored' | 'has_clue' | 'stuck' | 'exhausted';

export interface AcousticPinAnchor {
  timeSec: number;
  freqHz?: number;
  channel: 'mix' | 'left' | 'right' | 'diff';
  bandMinHz?: number;
  bandMaxHz?: number;
}

export interface DocumentPinAnchor {
  xPct: number;
  yPct: number;
  side: 'front' | 'back';
  tool: 'inspect' | 'uv' | 'heater' | 'lens_r' | 'lens_g' | 'lens_b';
  fragmentId?: number | string;
}

export interface PhonePinAnchor {
  app: 'messages' | 'gallery' | 'notes' | 'voicemails' | 'trash';
  threadId?: string;
  itemId: string;
  label?: string;
}

export interface BoardPinAnchor {
  x: number;
  y: number;
}

export type PinAnchorData =
  | AcousticPinAnchor
  | DocumentPinAnchor
  | PhonePinAnchor
  | BoardPinAnchor
  | Record<string, any>;

export interface CasePin {
  id: string;
  investigation_id: string;
  card_id: string | null;
  tool_type: PinToolType;
  anchor_data: PinAnchorData;
  tag: PinTag;
  note: string;
  is_resolved: boolean;
  resolved_by?: string | null;
  created_by?: string | null;
  author_name: string;
  created_at: string;
  updated_at: string;
}

export interface CaseFinding {
  id: string;
  investigation_id: string;
  category: FindingCategory;
  label: string;
  details?: string | null;
  source_card_id?: string | null;
  source_tool?: FindingSourceTool | null;
  source_anchor?: PinAnchorData | null;
  created_by?: string | null;
  author_name: string;
  created_at: string;
  updated_at?: string;
}

export interface CaseCardStatusRow {
  investigation_id: string;
  card_id: string;
  team_status: TeamCardStatus;
  updated_by?: string | null;
  updated_at: string;
}

export interface AnchorJumpRequest {
  cardId: string;
  toolType: PinToolType;
  anchorData: PinAnchorData;
  nonce: number;
}

export interface TacticalPingEvent {
  id: string;
  x: number;
  y: number;
  authorName: string;
  userId?: string;
  createdAt: number;
}

export const PIN_TAG_META: Record<PinTag, { label: string; color: string }> = {
  look_here: { label: 'Olhem isso', color: '#f59e0b' },
  code: { label: 'Possível código', color: '#10b981' },
  suspect: { label: 'Suspeito', color: '#ef4444' },
  contradiction: { label: 'Contradição', color: '#a855f7' },
  question: { label: 'Dúvida', color: '#38bdf8' },
};

export const FINDING_CATEGORY_META: Record<
  FindingCategory,
  { label: string; color: string }
> = {
  code: { label: 'Código / Senha', color: '#10b981' },
  person: { label: 'Nome / Pessoa', color: '#60a5fa' },
  date: { label: 'Data / Hora', color: '#f59e0b' },
  location: { label: 'Local / Coordenada', color: '#f43f5e' },
  theory: { label: 'Teoria / Dúvida', color: '#c084fc' },
};

export const TEAM_STATUS_META: Record<
  TeamCardStatus,
  { label: string; shortLabel: string; color: string }
> = {
  unexplored: { label: 'Inexplorado', shortLabel: 'Inexplorado', color: '#94a3b8' },
  has_clue: { label: 'Tem algo aqui!', shortLabel: 'Tem pista', color: '#f59e0b' },
  stuck: { label: 'Parcial / Travamos aqui', shortLabel: 'Travamos', color: '#ef4444' },
  exhausted: { label: 'Esgotado / Extraído', shortLabel: 'Esgotado', color: '#10b981' },
};
