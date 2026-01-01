/**
 * Sistema de rastreamento de códigos de glitch puzzles
 * Gerencia códigos coletados por investigação usando localStorage
 */

export interface CollectedCode {
  code: string;
  puzzleId: string;
  timestamp: number;
}

/**
 * Obtém todos os códigos coletados para uma investigação
 */
export function getCollectedCodes(investigationId: string): CollectedCode[] {
  const key = `investigation_${investigationId}_codes`;
  const data = localStorage.getItem(key);
  
  if (!data) return [];
  
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Erro ao parsear códigos coletados:', e);
    return [];
  }
}

/**
 * Adiciona um código à coleção (se ainda não existir)
 */
export function addCollectedCode(
  investigationId: string, 
  code: string, 
  puzzleId: string
): boolean {
  const codes = getCollectedCodes(investigationId);
  
  // Verifica se já existe
  const exists = codes.some(c => c.code === code || c.puzzleId === puzzleId);
  if (exists) {
    console.log('Código já coletado:', code);
    return false;
  }
  
  // Adiciona novo código
  const newCode: CollectedCode = {
    code,
    puzzleId,
    timestamp: Date.now(),
  };
  
  codes.push(newCode);
  
  const key = `investigation_${investigationId}_codes`;
  localStorage.setItem(key, JSON.stringify(codes));
  
  console.log(`✓ Código coletado: ${code} (Total: ${codes.length})`);
  return true;
}

/**
 * Verifica se um puzzle específico já foi resolvido
 */
export function isPuzzleSolved(investigationId: string, puzzleId: string): boolean {
  const codes = getCollectedCodes(investigationId);
  return codes.some(c => c.puzzleId === puzzleId);
}

/**
 * Conta quantos códigos foram coletados
 */
export function getCodeCount(investigationId: string): number {
  return getCollectedCodes(investigationId).length;
}

/**
 * Verifica se todos os códigos necessários foram coletados
 */
export function hasAllCodes(investigationId: string, requiredCount: number): boolean {
  return getCodeCount(investigationId) >= requiredCount;
}

/**
 * Limpa todos os códigos de uma investigação (reset)
 */
export function clearCodes(investigationId: string): void {
  const key = `investigation_${investigationId}_codes`;
  localStorage.removeItem(key);
  console.log('✓ Códigos resetados para investigação:', investigationId);
}

/**
 * Obtém apenas os códigos (strings) sem metadata
 */
export function getCodeStrings(investigationId: string): string[] {
  return getCollectedCodes(investigationId).map(c => c.code);
}
