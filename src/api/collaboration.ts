import { supabase } from '../supabaseClient';
import {
  CaseCardStatusRow,
  CaseFinding,
  CasePin,
  FindingCategory,
  FindingSourceTool,
  PinAnchorData,
  PinTag,
  PinToolType,
  TeamCardStatus,
} from '../types/collaboration';

export async function fetchCasePins(investigationId: string): Promise<CasePin[]> {
  const { data, error } = await (supabase as any)
    .from('case_pins')
    .select('*')
    .eq('investigation_id', investigationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.warn('[collaboration] fetchCasePins error:', error.message || error);
    return [];
  }
  return (data || []) as CasePin[];
}

export async function createCasePin(input: {
  investigation_id: string;
  card_id?: string | null;
  tool_type: PinToolType;
  anchor_data: PinAnchorData;
  tag: PinTag;
  note: string;
  author_name: string;
  created_by?: string;
}): Promise<CasePin> {
  const payload: Record<string, any> = {
    investigation_id: input.investigation_id,
    card_id: input.card_id ?? null,
    tool_type: input.tool_type,
    anchor_data: input.anchor_data || {},
    tag: input.tag,
    note: input.note.trim(),
    author_name: input.author_name || 'Agente',
  };
  if (input.created_by) payload.created_by = input.created_by;

  const { data, error } = await (supabase as any)
    .from('case_pins')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as CasePin;
}

export async function toggleResolveCasePin(
  pinId: string,
  isResolved: boolean,
  resolvedBy?: string | null
): Promise<CasePin> {
  const { data, error } = await (supabase as any)
    .from('case_pins')
    .update({
      is_resolved: isResolved,
      resolved_by: isResolved ? resolvedBy ?? null : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pinId)
    .select()
    .single();

  if (error) throw error;
  return data as CasePin;
}

export async function deleteCasePin(pinId: string): Promise<void> {
  const { error } = await (supabase as any).from('case_pins').delete().eq('id', pinId);
  if (error) throw error;
}

export async function fetchCaseFindings(investigationId: string): Promise<CaseFinding[]> {
  const { data, error } = await (supabase as any)
    .from('case_findings')
    .select('*')
    .eq('investigation_id', investigationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[collaboration] fetchCaseFindings error:', error.message || error);
    return [];
  }
  return (data || []) as CaseFinding[];
}

export async function createCaseFinding(input: {
  investigation_id: string;
  category: FindingCategory;
  label: string;
  details?: string | null;
  source_card_id?: string | null;
  source_tool?: FindingSourceTool | null;
  source_anchor?: PinAnchorData | null;
  author_name: string;
  created_by?: string;
}): Promise<CaseFinding> {
  const payload: Record<string, any> = {
    investigation_id: input.investigation_id,
    category: input.category,
    label: input.label.trim(),
    details: input.details?.trim() || null,
    source_card_id: input.source_card_id ?? null,
    source_tool: input.source_tool ?? null,
    source_anchor: input.source_anchor || {},
    author_name: input.author_name || 'Agente',
  };
  if (input.created_by) payload.created_by = input.created_by;

  const { data, error } = await (supabase as any)
    .from('case_findings')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as CaseFinding;
}

export async function updateCaseFinding(
  findingId: string,
  updates: { label?: string; details?: string | null; category?: FindingCategory }
): Promise<CaseFinding> {
  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.label !== undefined) payload.label = updates.label.trim();
  if (updates.details !== undefined) payload.details = updates.details?.trim() || null;
  if (updates.category !== undefined) payload.category = updates.category;

  const { data, error } = await (supabase as any)
    .from('case_findings')
    .update(payload)
    .eq('id', findingId)
    .select()
    .single();

  if (error) throw error;
  return data as CaseFinding;
}

export async function deleteCaseFinding(findingId: string): Promise<void> {
  const { error } = await (supabase as any).from('case_findings').delete().eq('id', findingId);
  if (error) throw error;
}

export async function fetchCaseCardStatuses(investigationId: string): Promise<CaseCardStatusRow[]> {
  const { data, error } = await (supabase as any)
    .from('case_card_status')
    .select('*')
    .eq('investigation_id', investigationId);

  if (error) {
    console.warn('[collaboration] fetchCaseCardStatuses error:', error.message || error);
    return [];
  }
  return (data || []) as CaseCardStatusRow[];
}

export async function upsertCaseCardStatus(input: {
  investigation_id: string;
  card_id: string;
  team_status: TeamCardStatus;
  updated_by?: string;
}): Promise<CaseCardStatusRow> {
  const payload: Record<string, any> = {
    investigation_id: input.investigation_id,
    card_id: input.card_id,
    team_status: input.team_status,
    updated_at: new Date().toISOString(),
  };
  if (input.updated_by) payload.updated_by = input.updated_by;

  const { data, error } = await (supabase as any)
    .from('case_card_status')
    .upsert(payload, { onConflict: 'investigation_id,card_id' })
    .select()
    .single();

  if (error) throw error;
  return data as CaseCardStatusRow;
}
