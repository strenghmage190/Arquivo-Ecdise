import { z } from 'zod';

/**
 * Schema de validação para dados de Glitch Puzzle
 * Garante que os parâmetros numéricos estejam dentro de 0-100
 */
const GlitchPuzzleDataSchema = z.object({
  frequency: z.number().min(0).max(100, 'Frequência deve estar entre 0-100'),
  shift: z.number().min(0).max(100, 'Deslocamento deve estar entre 0-100'),
  chromatic_aberration: z.number().min(0).max(100, 'Aberração cromática deve estar entre 0-100'),
  initial_frequency: z.number().min(0).max(100).optional(),
  initial_shift: z.number().min(0).max(100).optional(),
  initial_chromatic_aberration: z.number().min(0).max(100).optional(),
  access_instructions: z.string().optional(),
  hint: z.string().optional(),
}).strict();

/**
 * Schema de validação para dados de Mega-Clue
 */
const MegaClueDataSchema = z.object({
  final_truth_text: z.string().max(2000, 'Texto da verdade não pode exceder 2000 caracteres'),
  final_image_url: z.string().url('URL de imagem inválida').optional().or(z.literal('')),
  required_puzzle_ids: z.array(z.string().uuid('ID deve ser um UUID válido')),
  // códigos/exigências de desbloqueio para mega-pista (ex: senhas por puzzle)
  required_codes: z.array(z.string()).optional(),
  collected_codes: z.array(z.string()).optional(),
}).strict();

/**
 * Schema de validação para metadados completos de uma pista
 */
const MetadataSchema = z.object({
  glitch_puzzle: GlitchPuzzleDataSchema.optional(),
  mega_clue: MegaClueDataSchema.optional(),
  status: z.enum(['verified', 'theory', 'false']).optional(),
  chat_data: z.array(z.any()).optional(),
  chat_contact_name: z.string().optional(),
}).passthrough(); // Permite campos adicionais não documentados

/**
 * Schema de validação para Insight (dica/perícia)
 */
const InsightSchema = z.object({
  id: z.string(),
  skill: z.string(),
  cost: z.number().min(1).max(100, 'Custo deve estar entre 1-100'),
  text: z.string().optional(),
  visibility: z.enum(['visible', 'hidden']).optional(),
  reveal_to: z.array(z.string()).optional(),
});

/**
 * Schema de validação para InvestigationCard
 */
const InvestigationCardSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título não pode exceder 200 caracteres'),
  description_public: z.string().max(2000).optional(),
  description_hidden: z.string().max(2000).optional(),
  image_url: z.string().url('URL de imagem inválida').optional().or(z.literal('')),
  insights: z.array(InsightSchema).optional(),
  metadata: MetadataSchema.optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Função para validar metadata de uma pista
 * @param data - Dados a validar
 * @returns { success: true } ou { success: false, errors: string[] }
 */
export function validateMetadata(data: any): { success: boolean; errors?: string[] } {
  try {
    MetadataSchema.parse(data);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(e => `${e.path.join('.')}: ${e.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Erro desconhecido na validação'] };
  }
}

/**
 * Função para validar dados de Glitch Puzzle
 * @param data - Dados a validar
 * @returns { success: true } ou { success: false, errors: string[] }
 */
export function validateGlitchPuzzleData(data: any): { success: boolean; errors?: string[] } {
  try {
    GlitchPuzzleDataSchema.parse(data);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(e => `${e.path.join('.')}: ${e.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Erro desconhecido na validação'] };
  }
}

/**
 * Função para validar dados de Mega-Clue
 * @param data - Dados a validar
 * @returns { success: true } ou { success: false, errors: string[] }
 */
export function validateMegaClueData(data: any): { success: boolean; errors?: string[] } {
  try {
    MegaClueDataSchema.parse(data);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(e => `${e.path.join('.')}: ${e.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Erro desconhecido na validação'] };
  }
}

/**
 * Função para validar um Investigation Card completo
 * @param data - Dados a validar
 * @returns { success: true } ou { success: false, errors: string[] }
 */
export function validateInvestigationCard(data: any): { success: boolean; errors?: string[] } {
  try {
    InvestigationCardSchema.parse(data);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(e => `${e.path.join('.')}: ${e.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Erro desconhecido na validação'] };
  }
}

// Exportar schemas para uso em outros arquivos
export { GlitchPuzzleDataSchema, MegaClueDataSchema, MetadataSchema, InsightSchema, InvestigationCardSchema };
