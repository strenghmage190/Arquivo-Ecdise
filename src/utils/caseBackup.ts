import { supabase } from '../supabaseClient';
import {
  createInvestigation,
  createInvestigationCard,
  fetchCardsForInvestigation,
  fetchInvestigationById,
  fetchInvestigationDetails,
  InvestigationCard,
  updateCard,
  updateInvestigation,
} from '../api/investigations';
import {
  createInvestigationConnection,
  fetchConnectionsForInvestigation,
} from '../api/connections';
import { sanitizeTemplateData } from '../api/templates';

export const UNAUTHORIZED_OWNER_ERROR =
  'Acesso negado: apenas o proprietário da investigação pode executar esta ação.';

export interface CaseBackupInvestigationMeta {
  title: string;
  description?: string | null;
  cover_url?: string | null;
  whiteboard_data?: any;
}

export interface CaseBackupPayload {
  version: 1;
  exported_at: string;
  investigation: CaseBackupInvestigationMeta;
  cards: Array<Record<string, any>>;
  connections: Array<Record<string, any>>;
}

export interface ImportCaseBackupOptions {
  targetInvestigationId?: string;
  newInvestigationTitle?: string;
  backup: CaseBackupPayload;
}

export interface ImportCaseBackupResult {
  investigationId: string;
  importedCards: number;
  importedConnections: number;
}

const PUZZLE_LOCAL_STORAGE_PREFIXES = [
  'shredder_solved_',
  'glitch_solved_',
  'puzzle_solved_',
  'mega_clue_',
];

/**
 * Garante que o usuário autenticado é o proprietário (`owner_id`) da investigação.
 */
export async function assertInvestigationOwner(
  investigationId: string
): Promise<{ userId: string; investigation: any }> {
  if (!investigationId) {
    throw new Error(UNAUTHORIZED_OWNER_ERROR);
  }

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    throw new Error(UNAUTHORIZED_OWNER_ERROR);
  }

  const user = userData?.user;
  if (!user?.id) {
    throw new Error(UNAUTHORIZED_OWNER_ERROR);
  }

  const investigation = (await fetchInvestigationDetails(
    investigationId
  )) as Record<string, any> | null;
  if (!investigation || investigation.owner_id !== user.id) {
    throw new Error(UNAUTHORIZED_OWNER_ERROR);
  }

  return { userId: user.id, investigation };
}

/**
 * Exporta todos os dados da investigação (metadados, pistas e conexões)
 * em um payload JSON versionado e sanitizado.
 */
export async function exportCaseBackup(
  investigationId: string
): Promise<CaseBackupPayload> {
  await assertInvestigationOwner(investigationId);

  const [investigation, cards, connections] = await Promise.all([
    fetchInvestigationById(investigationId),
    fetchCardsForInvestigation(investigationId),
    fetchConnectionsForInvestigation(investigationId),
  ]);

  const rawInvestigation: CaseBackupInvestigationMeta = {
    title: investigation?.title || 'Investigação Sem Título',
    description: investigation?.description ?? null,
    cover_url: investigation?.cover_url ?? null,
    whiteboard_data: investigation?.whiteboard_data ?? null,
  };

  return {
    version: 1,
    exported_at: new Date().toISOString(),
    investigation: sanitizeTemplateData(rawInvestigation),
    cards: sanitizeTemplateData(Array.isArray(cards) ? cards : []),
    connections: sanitizeTemplateData(Array.isArray(connections) ? connections : []),
  };
}

/**
 * Dispara o download de um arquivo `.json` no navegador com o backup do caso.
 */
export function downloadCaseBackupJson(
  backup: CaseBackupPayload,
  filename?: string
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const safeTitle = (backup.investigation?.title || 'caso')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/(^-|-$)/g, '');
  const datePart = new Date().toISOString().slice(0, 10);
  const finalName = filename || `arquivo-ecdise-${safeTitle || 'caso'}-${datePart}.json`;

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = finalName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Valida a estrutura mínima de um payload de backup de caso.
 */
export function validateCaseBackupPayload(payload: unknown): CaseBackupPayload {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Arquivo de backup inválido: JSON deve ser um objeto.');
  }

  const candidate = payload as Record<string, any>;
  if (!Array.isArray(candidate.cards)) {
    throw new Error('Arquivo de backup inválido: lista de pistas (cards) ausente.');
  }

  if (
    candidate.connections !== undefined &&
    !Array.isArray(candidate.connections)
  ) {
    throw new Error('Arquivo de backup inválido: lista de conexões inválida.');
  }

  if (
    candidate.investigation !== undefined &&
    (typeof candidate.investigation !== 'object' || candidate.investigation === null)
  ) {
    throw new Error('Arquivo de backup inválido: metadados da investigação inválidos.');
  }

  return {
    version: 1,
    exported_at:
      typeof candidate.exported_at === 'string'
        ? candidate.exported_at
        : new Date().toISOString(),
    investigation: candidate.investigation || { title: 'Caso Importado' },
    cards: candidate.cards,
    connections: Array.isArray(candidate.connections) ? candidate.connections : [],
  };
}

function buildImportCardPayload(
  rawCard: Record<string, any>,
  investigationId: string
): InvestigationCard & Record<string, any> {
  return {
    investigation_id: investigationId,
    title: rawCard.title || 'Pista Importada',
    type: rawCard.type ?? null,
    description_public: rawCard.description_public ?? null,
    description_hidden: rawCard.description_hidden ?? null,
    image_url: rawCard.image_url ?? null,
    image_uv_url: rawCard.image_uv_url ?? null,
    video_url: rawCard.video_url ?? null,
    audio_url: rawCard.audio_url ?? null,
    audio_hidden_url: rawCard.audio_hidden_url ?? null,
    audio_target_freq: rawCard.audio_target_freq ?? null,
    image_filter_layer: rawCard.image_filter_layer ?? null,
    is_locked: Boolean(rawCard.is_locked),
    lock_password: rawCard.lock_password ?? null,
    is_hidden: Boolean(rawCard.is_hidden),
    discovery_code: rawCard.discovery_code ?? null,
    x: typeof rawCard.x === 'number' ? rawCard.x : 0,
    y: typeof rawCard.y === 'number' ? rawCard.y : 0,
    z_index: typeof rawCard.z_index === 'number' ? rawCard.z_index : 0,
    visibility: rawCard.visibility ?? null,
    tags: Array.isArray(rawCard.tags) ? rawCard.tags : [],
    insights: Array.isArray(rawCard.insights) ? rawCard.insights : [],
    metadata:
      rawCard.metadata && typeof rawCard.metadata === 'object'
        ? rawCard.metadata
        : {},
    chat_data: rawCard.chat_data ?? null,
    chat_contact_name: rawCard.chat_contact_name ?? null,
  };
}

/**
 * Importa um backup JSON para uma investigação existente (validando ownership)
 * ou criando uma nova investigação, remapeando IDs de pistas, mega_clue e conexões.
 */
export async function importCaseBackup(
  options: ImportCaseBackupOptions
): Promise<ImportCaseBackupResult> {
  const validated = validateCaseBackupPayload(options.backup);
  const sanitizedBackup: CaseBackupPayload = sanitizeTemplateData(validated);

  let investigationId: string;

  if (options.targetInvestigationId) {
    await assertInvestigationOwner(options.targetInvestigationId);
    investigationId = options.targetInvestigationId;
  } else if (options.newInvestigationTitle && options.newInvestigationTitle.trim()) {
    const createdInv = await createInvestigation(
      options.newInvestigationTitle.trim(),
      sanitizedBackup.investigation?.description ?? undefined,
      sanitizedBackup.investigation?.cover_url ?? undefined
    );
    if (!createdInv?.id) {
      throw new Error('Falha ao criar nova investigação para importação.');
    }
    investigationId = createdInv.id;

    if (
      sanitizedBackup.investigation?.whiteboard_data &&
      typeof updateInvestigation === 'function'
    ) {
      await updateInvestigation(investigationId, {
        whiteboard_data: sanitizedBackup.investigation.whiteboard_data,
      });
    }
  } else {
    throw new Error(
      'Informe uma investigação de destino ou um título para criar um novo caso.'
    );
  }

  const idMap = new Map<string, string>();
  const megaCluesToRemap: Array<{
    newCardId: string;
    requiredPuzzleIds: string[];
    metadata: Record<string, any>;
  }> = [];

  let importedCards = 0;

  for (const rawCard of sanitizedBackup.cards) {
    if (!rawCard || typeof rawCard !== 'object') continue;

    const oldCardId = rawCard.id ? String(rawCard.id) : null;
    const cardPayload = buildImportCardPayload(rawCard, investigationId);
    const createdCard = (await createInvestigationCard(
      cardPayload
    )) as Record<string, any> | null;

    if (createdCard?.id) {
      importedCards += 1;
      const newCardId = String(createdCard.id);
      if (oldCardId) {
        idMap.set(oldCardId, newCardId);
      }

      const rawMeta =
        (createdCard.metadata && typeof createdCard.metadata === 'object'
          ? createdCard.metadata
          : cardPayload.metadata) || {};

      const reqIds = rawMeta?.mega_clue?.required_puzzle_ids;
      if (
        (rawCard.type === 'mega_clue' || rawMeta?.mega_clue) &&
        Array.isArray(reqIds) &&
        reqIds.length > 0
      ) {
        megaCluesToRemap.push({
          newCardId,
          requiredPuzzleIds: reqIds.map((id: any) => String(id)),
          metadata: rawMeta,
        });
      }
    }
  }

  for (const mega of megaCluesToRemap) {
    const remappedIds = mega.requiredPuzzleIds
      .map((oldId) => idMap.get(oldId))
      .filter((newId): newId is string => Boolean(newId));

    await updateCard(mega.newCardId, {
      metadata: {
        ...mega.metadata,
        mega_clue: {
          ...mega.metadata.mega_clue,
          required_puzzle_ids: remappedIds,
        },
      },
    });
  }

  let importedConnections = 0;
  for (const conn of sanitizedBackup.connections || []) {
    if (!conn || typeof conn !== 'object') continue;
    const oldFrom = conn.from_card_id ? String(conn.from_card_id) : '';
    const oldTo = conn.to_card_id ? String(conn.to_card_id) : '';
    const newFrom = idMap.get(oldFrom);
    const newTo = idMap.get(oldTo);

    if (!newFrom || !newTo) {
      continue;
    }

    await createInvestigationConnection({
      investigation_id: investigationId,
      from_card_id: newFrom,
      to_card_id: newTo,
      metadata:
        conn.metadata && typeof conn.metadata === 'object' ? conn.metadata : {},
    });
    importedConnections += 1;
  }

  return {
    investigationId,
    importedCards,
    importedConnections,
  };
}

/**
 * Atualiza `is_hidden` em lote para as pistas selecionadas após validar ownership.
 */
export async function batchSetCardsVisibility(
  investigationId: string,
  cardIds: string[],
  isHidden: boolean
): Promise<number> {
  await assertInvestigationOwner(investigationId);

  if (!Array.isArray(cardIds) || cardIds.length === 0) {
    return 0;
  }

  const { error } = await (supabase as any)
    .from('investigation_cards')
    .update({ is_hidden: isHidden })
    .eq('investigation_id', investigationId)
    .in('id', cardIds);

  if (error) {
    throw error;
  }

  return cardIds.length;
}

/**
 * Remove com segurança as chaves de progresso local de puzzles no `localStorage`
 * pertencentes apenas à investigação informada (e opcionalmente filtradas por `cardIds`).
 */
export function resetLocalPuzzleProgress(
  investigationId: string,
  cardIds?: string[]
): number {
  if (!investigationId || typeof localStorage === 'undefined') {
    return 0;
  }

  const targetCardIds =
    Array.isArray(cardIds) && cardIds.length > 0 ? cardIds : null;

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;

    const hasPuzzlePrefix = PUZZLE_LOCAL_STORAGE_PREFIXES.some((prefix) =>
      key.includes(prefix)
    );
    if (!hasPuzzlePrefix) continue;

    if (!key.includes(investigationId)) continue;

    if (targetCardIds && !targetCardIds.some((cardId) => key.includes(cardId))) {
      continue;
    }

    keysToRemove.push(key);
  }

  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }

  return keysToRemove.length;
}
