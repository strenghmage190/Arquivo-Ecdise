export type LockType = 'keypad' | 'pattern' | 'terminal' | 'prompt' | 'mega_clue' | string;

export interface UnlockedCodeEntry {
  cardId: string;
  cardTitle: string;
  code: string;
  lockType: LockType;
  unlockedAt: string;
}

export interface PlayerContextOptions {
  isGameMaster?: boolean;
  playerView?: boolean;
}

export const PLAYER_TRACKING_EVENT = 'ecdise:player-tracking-updated';

const SEEN_STORAGE_PREFIX = 'ecdise_seen_cards_';
const CODES_STORAGE_PREFIX = 'ecdise_unlocked_codes_';

function isPlayerContext(options?: PlayerContextOptions): boolean {
  if (!options) return true;
  if (options.isGameMaster && !options.playerView) return false;
  return true;
}

function safeReadJson<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    return fallback;
  }
}

function safeWriteJson(key: string, value: unknown): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent(PLAYER_TRACKING_EVENT, { detail: { key } }));
    }
  } catch {
    // ignore storage quota / private mode errors
  }
}

export function getSeenCardIds(investigationId: string): string[] {
  if (!investigationId) return [];
  const data = safeReadJson<unknown>(`${SEEN_STORAGE_PREFIX}${investigationId}`, []);
  return Array.isArray(data) ? data.map(String) : [];
}

export function isCardSeen(investigationId: string, cardId: string): boolean {
  if (!investigationId || !cardId) return false;
  return getSeenCardIds(investigationId).includes(String(cardId));
}

/**
 * Marca uma pista como vista no localStorage por investigação.
 * Respeita isolamento Mestre vs Jogador: se isGameMaster === true e playerView === false,
 * não polui o rastreamento do jogador.
 */
export function markCardSeen(
  investigationId: string,
  cardId: string,
  options?: PlayerContextOptions
): boolean {
  if (!investigationId || !cardId) return false;
  if (!isPlayerContext(options)) return false;

  const idStr = String(cardId);
  const current = getSeenCardIds(investigationId);
  if (current.includes(idStr)) return false;

  safeWriteJson(`${SEEN_STORAGE_PREFIX}${investigationId}`, [...current, idStr]);
  return true;
}

/**
 * Determina se o badge "NOVA" deve ser exibido para o card.
 * Nunca exibe para pistas ocultas (is_hidden) ou na visão exclusiva do Mestre.
 */
export function shouldShowNewBadge(
  investigationId: string,
  card: { id?: string; is_hidden?: boolean | null } | null | undefined,
  options?: PlayerContextOptions
): boolean {
  if (!investigationId || !card?.id) return false;
  if (!isPlayerContext(options)) return false;
  if (card.is_hidden === true) return false;
  return !isCardSeen(investigationId, String(card.id));
}

export function getUnlockedCodes(investigationId: string): UnlockedCodeEntry[] {
  if (!investigationId) return [];
  const data = safeReadJson<unknown>(`${CODES_STORAGE_PREFIX}${investigationId}`, []);
  if (!Array.isArray(data)) return [];
  return data.filter(
    (item): item is UnlockedCodeEntry =>
      Boolean(item && typeof item === 'object' && 'cardId' in item && 'code' in item)
  );
}

/**
 * Registra um código/senha efetivamente desbloqueado pelo jogador.
 * Nunca deve ser chamado com senhas ainda bloqueadas ou no modo Mestre.
 */
export function recordUnlockedCode(
  investigationId: string,
  entry: Omit<UnlockedCodeEntry, 'unlockedAt'> & { unlockedAt?: string },
  options?: PlayerContextOptions
): UnlockedCodeEntry[] {
  if (!investigationId || !entry.cardId || !entry.code) {
    return getUnlockedCodes(investigationId);
  }
  if (!isPlayerContext(options)) {
    return getUnlockedCodes(investigationId);
  }

  const normalizedCode = String(entry.code).trim();
  if (!normalizedCode) return getUnlockedCodes(investigationId);

  const normalizedEntry: UnlockedCodeEntry = {
    cardId: String(entry.cardId),
    cardTitle: entry.cardTitle || 'Evidência Protegida',
    code: normalizedCode,
    lockType: entry.lockType || 'prompt',
    unlockedAt: entry.unlockedAt || new Date().toISOString(),
  };

  const existing = getUnlockedCodes(investigationId);
  const filtered = existing.filter(
    (item) =>
      !(
        item.cardId === normalizedEntry.cardId &&
        item.code === normalizedEntry.code &&
        item.lockType === normalizedEntry.lockType
      )
  );

  const next = [normalizedEntry, ...filtered].slice(0, 100);
  safeWriteJson(`${CODES_STORAGE_PREFIX}${investigationId}`, next);
  return next;
}

export function clearPlayerTracking(investigationId: string): void {
  if (!investigationId || typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(`${SEEN_STORAGE_PREFIX}${investigationId}`);
    localStorage.removeItem(`${CODES_STORAGE_PREFIX}${investigationId}`);
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent(PLAYER_TRACKING_EVENT, { detail: { investigationId } }));
    }
  } catch {
    // ignore
  }
}
