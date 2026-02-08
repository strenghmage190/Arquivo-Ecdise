/**
 * ✅ clueValidation.ts
 * Schemas de validação para pistas usando Zod
 */

import { z } from 'zod';

export const ClueBaseSchema = z.object({
  title: z.string()
    .min(1, 'Título é obrigatório')
    .max(200, 'Título deve ter no máximo 200 caracteres'),
  
  descPublic: z.string()
    .max(5000, 'Descrição pública deve ter no máximo 5000 caracteres')
    .optional(),
  
  descHidden: z.string()
    .max(5000, 'Descrição oculta deve ter no máximo 5000 caracteres')
    .optional(),
  
  tags: z.string().optional(),
  
  evidenceType: z.enum(['document', 'glitch_puzzle', 'mega_clue']),
});

export const GlitchPuzzleSchema = ClueBaseSchema.extend({
  evidenceType: z.literal('glitch_puzzle'),
  
  glitchAccessInstructions: z.string()
    .min(1, 'Instruções de acesso são obrigatórias para Glitch Puzzle'),
  
  glitchCorrectFrequency: z.number()
    .min(0)
    .max(100),
  
  glitchCorrectShift: z.number()
    .min(0)
    .max(100),
  
  glitchCorrectChromatic: z.number()
    .min(0)
    .max(100),
  
  glitchRewardCode: z.string()
    .min(1, 'Código de recompensa é obrigatório'),
});

export const MegaClueSchema = ClueBaseSchema.extend({
  evidenceType: z.literal('mega_clue'),
  
  megaFinalTruthText: z.string()
    .min(1, 'Texto da verdade final é obrigatório para Mega-Pista'),
  
  megaRequiredPuzzleIds: z.array(z.string())
    .min(1, 'Pelo menos um puzzle obrigatório deve ser selecionado'),
});

export const DocumentSchema = ClueBaseSchema.extend({
  evidenceType: z.literal('document'),
});

// Union type for all clue types
export const ClueSchema = z.discriminatedUnion('evidenceType', [
  DocumentSchema,
  GlitchPuzzleSchema,
  MegaClueSchema,
]);

export type ClueFormData = z.infer<typeof ClueSchema>;

/**
 * Validate clue data and return structured errors
 */
export function validateClue(data: Partial<ClueFormData>): {
  success: boolean;
  errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }>;
} {
  const result = ClueSchema.safeParse(data);
  
  if (result.success) {
    // Additional warnings (not errors)
    const warnings: Array<{ field: string; message: string; severity: 'warning' }> = [];
    
    if (!data.descPublic || data.descPublic.length < 10) {
      warnings.push({
        field: 'descPublic',
        message: 'Descrição pública muito curta - recomendado pelo menos 10 caracteres',
        severity: 'warning',
      });
    }
    
    return { success: true, errors: warnings };
  }
  
  const errors = result.error.issues.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    severity: 'error' as const,
  }));
  
  return { success: false, errors };
}
