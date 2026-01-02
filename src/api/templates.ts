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
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to create templates');
  }

  const { data, error } = await supabase
    .from('clue_templates')
    .insert({
      name: input.name,
      description: input.description || null,
      template_data: input.template_data,
      created_by: user.id,
      is_public: input.is_public || false,
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
  const updateData: any = {
    ...(updates.name && { name: updates.name }),
    ...(updates.description !== undefined && { description: updates.description }),
    ...(updates.template_data && { template_data: updates.template_data }),
    ...(updates.is_public !== undefined && { is_public: updates.is_public }),
  };

  const { data, error } = await (supabase
    .from('clue_templates') as any)
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
  const { error } = await supabase
    .from('clue_templates')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting clue template:', error);
    throw error;
  }
}

/**
 * Helper: Sanitize form state to remove File objects, blob URLs, and other non-serializable data
 * This ensures the template_data can be safely stored as JSONB
 */
export function sanitizeTemplateData(formState: any): any {
  const seen = new WeakSet();
  
  const sanitize = (val: any, depth = 0): any => {
    // Prevent infinite recursion
    if (depth > 10) return null;
    
    // Handle primitives
    if (val === null || val === undefined) return null;
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      // Filter out blob URLs
      if (typeof val === 'string' && val.startsWith('blob:')) return null;
      return val;
    }
    
    // Skip File objects and Blobs
    if (val instanceof File || val instanceof Blob) return null;
    
    // Handle Dates
    if (val instanceof Date) return val.toISOString();
    
    // Handle Arrays
    if (Array.isArray(val)) {
      return val.map(v => sanitize(v, depth + 1)).filter(v => v !== null);
    }
    
    // Handle Objects
    if (typeof val === 'object') {
      // Prevent circular references
      if (seen.has(val)) return null;
      seen.add(val);
      
      const result: any = {};
      for (const key of Object.keys(val)) {
        // Skip preview URLs and file objects
        if (key.includes('Preview') || key.includes('File') || key.includes('Url') && val[key]?.startsWith?.('blob:')) {
          continue;
        }
        
        const sanitizedValue = sanitize(val[key], depth + 1);
        if (sanitizedValue !== null) {
          result[key] = sanitizedValue;
        }
      }
      return Object.keys(result).length > 0 ? result : null;
    }
    
    return null;
  };
  
  return sanitize(formState);
}
