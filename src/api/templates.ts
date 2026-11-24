/**
 * API functions for managing Clue Templates
 * Allows users to save and reuse complex clue configurations
 */

import { supabase } from '../supabaseClient';

export interface ClueTemplate {
  id: string;
  name: string;
  description?: string;
  template_data: any;
  created_by: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  template_data: any;
  is_public?: boolean;
}

export interface SanitizeTemplateOptions {
  stripSecrets?: boolean;
}

const TRANSIENT_FILE_AND_PREVIEW_KEYS = new Set([
  'imgFile',
  'uvFile',
  'videoFile',
  'filterFile',
  'thermalFile',
  'forensicFile',
  'megaImageFile',
  'glitchFocusedImageFile',
  'filterInitialImage',
  'previewUrl',
  'videoPreviewUrl',
  'uvPreviewUrl',
  'filterPreviewUrl',
  'audioBasePreview',
  'audioHiddenPreview',
  'megaImagePreview',
  'thermalPreviewUrl',
  'forensicPreviewUrl',
  'glitchFocusedImagePreview',
  'uvEditorBaseUrl',
]);

const SECRET_TEMPLATE_KEYS = new Set([
  'descHidden',
  'description_hidden',
  'lockPass',
  'lock_password',
  'lockPasses',
  'discoveryCode',
  'discovery_code',
  'phonePassword',
  'phone_password',
  'glitchKeyword',
  'correct_keyword',
  'thermalSecretText',
  'thermal_secret_text',
  'thermalKeyword',
  'thermal_keyword',
  'realText',
  'real_text',
  'megaFinalTruthText',
  'final_truth_text',
  'hexEncodingKey',
  'hex_raw_text',
  'required_codes',
]);

function isTransientFileOrPreviewKey(key: string): boolean {
  if (TRANSIENT_FILE_AND_PREVIEW_KEYS.has(key)) return true;
  return /(File|Preview|PreviewUrl)$/.test(key);
}

function isFileOrBlobInstance(val: unknown): boolean {
  if (!val || typeof val !== 'object') return false;
  if (typeof File !== 'undefined' && val instanceof File) return true;
  if (typeof Blob !== 'undefined' && val instanceof Blob) return true;
  const tag = Object.prototype.toString.call(val);
  return tag === '[object File]' || tag === '[object Blob]';
}

function isTemporaryMediaString(val: string): boolean {
  return val.startsWith('blob:') || val.startsWith('data:image/');
}

/**
 * Fetch all templates accessible to the current user
 * (their own templates + public templates)
 */
export async function fetchClueTemplates(): Promise<ClueTemplate[]> {
  const { data, error } = await supabase
    .from('clue_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clue templates:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch a single template by ID
 */
export async function fetchClueTemplate(id: string): Promise<ClueTemplate | null> {
  const { data, error } = await supabase
    .from('clue_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching clue template:', error);
    throw error;
  }

  return data;
}

/**
 * Create a new clue template
 */
export async function createClueTemplate(input: CreateTemplateInput): Promise<ClueTemplate> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to create templates');
  }

  const isPublic = Boolean(input.is_public);
  const safeTemplateData = sanitizeTemplateData(input.template_data, {
    stripSecrets: isPublic,
  });

  const { data, error } = await supabase
    .from('clue_templates')
    .insert({
      name: input.name,
      description: input.description || null,
      template_data: safeTemplateData,
      created_by: user.id,
      is_public: isPublic,
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating clue template:', error);
    throw error;
  }

  return data;
}

/**
 * Update an existing template
 */
export async function updateClueTemplate(
  id: string,
  updates: Partial<CreateTemplateInput>
): Promise<ClueTemplate> {
  const shouldStripSecrets = Boolean(updates.is_public);
  const updateData: any = {
    ...(updates.name && { name: updates.name }),
    ...(updates.description !== undefined && { description: updates.description }),
    ...(updates.template_data !== undefined && {
      template_data: sanitizeTemplateData(updates.template_data, {
        stripSecrets: shouldStripSecrets,
      }),
    }),
    ...(updates.is_public !== undefined && { is_public: updates.is_public }),
  };

  const { data, error } = await (supabase.from('clue_templates') as any)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating clue template:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a template
 */
export async function deleteClueTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('clue_templates').delete().eq('id', id);

  if (error) {
    console.error('Error deleting clue template:', error);
    throw error;
  }
}

/**
 * Helper: Sanitize form state to remove File objects, blob URLs, circular references,
 * and other non-serializable data so template_data can be safely stored as JSONB.
 * When options.stripSecrets is true, GM/solution secret keys are also removed.
 */
export function sanitizeTemplateData(
  formState: any,
  options?: SanitizeTemplateOptions
): any {
  const stripSecrets = Boolean(options?.stripSecrets);
  const ancestors = new WeakSet<object>();

  const sanitize = (val: any, depth = 0, parentKey?: string): any => {
    if (depth > 15) return undefined;

    if (val === null) return null;
    if (val === undefined || typeof val === 'function' || typeof val === 'symbol') {
      return undefined;
    }

    if (typeof val === 'string') {
      if (isTemporaryMediaString(val)) return undefined;
      return val;
    }

    if (typeof val === 'number' || typeof val === 'boolean') {
      return val;
    }

    if (isFileOrBlobInstance(val)) {
      return undefined;
    }

    if (val instanceof Date) {
      return val.toISOString();
    }

    if (Array.isArray(val)) {
      if (ancestors.has(val)) return undefined;
      ancestors.add(val);
      const arrResult = val
        .map((item) => sanitize(item, depth + 1))
        .filter((item) => item !== undefined && item !== null);
      ancestors.delete(val);
      return arrResult;
    }

    if (typeof val === 'object') {
      if (ancestors.has(val)) return undefined;
      ancestors.add(val);

      const result: Record<string, any> = {};
      for (const key of Object.keys(val)) {
        if (isTransientFileOrPreviewKey(key)) {
          continue;
        }

        if (stripSecrets) {
          if (SECRET_TEMPLATE_KEYS.has(key)) {
            continue;
          }
          // Handle nested context slices (phoneState.password, thermalConfig.secretText/keyword, security_layer.keyword)
          if (
            (parentKey === 'phoneState' && key === 'password') ||
            (parentKey === 'thermalConfig' && (key === 'secretText' || key === 'keyword')) ||
            (parentKey === 'security_layer' && key === 'keyword')
          ) {
            continue;
          }
        }

        const rawChild = val[key];
        if (rawChild === undefined || typeof rawChild === 'function') {
          continue;
        }
        if (isFileOrBlobInstance(rawChild)) {
          continue;
        }
        if (typeof rawChild === 'string' && isTemporaryMediaString(rawChild)) {
          continue;
        }

        const sanitizedChild = sanitize(rawChild, depth + 1, key);
        if (sanitizedChild !== undefined) {
          result[key] = sanitizedChild;
        }
      }

      ancestors.delete(val);
      return result;
    }

    return undefined;
  };

  const sanitizedRoot = sanitize(formState, 0);
  return sanitizedRoot === undefined ? null : sanitizedRoot;
}
