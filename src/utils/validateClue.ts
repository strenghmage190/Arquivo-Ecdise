export interface CreateClueState {
  title: string;
  isHidden?: boolean;
  discoveryCode?: string;
  securityLayerEnabled?: boolean;
  evidenceType?: string;
  megaFinalTruthText?: string;
  megaRequiredPuzzleIds?: string[];
  imgFile?: File | null;
  videoFile?: File | null;
  videoUrlInput?: string | null;
  audioBase?: File | null;
}

export function validateCreateClue(state: CreateClueState): string[] {
  const errors: string[] = [];

  if (!state.title || !state.title.trim()) {
    errors.push('Título: informe um título identificável para a pista.');
  }

  if (state.isHidden) {
    if (!state.discoveryCode || !state.discoveryCode.trim()) {
      errors.push('Pista oculta: o código de descoberta é obrigatório para pistas ocultas.');
    }
  }

  const wantsSecurityLayer = Boolean(state.securityLayerEnabled) || state.evidenceType === 'glitch_puzzle';
  if (wantsSecurityLayer) {
    const hasAnyMedia = Boolean(state.imgFile || state.videoFile || state.videoUrlInput || state.audioBase);
    if (!hasAnyMedia) {
      errors.push('Camada de segurança ativa: envie ao menos uma mídia (imagem, vídeo ou áudio) na aba Visual/Áudio.');
    }
  }

  if (state.evidenceType === 'mega_clue') {
    if (!state.megaFinalTruthText || !state.megaFinalTruthText.trim()) {
      errors.push('Mega-Pista: defina o texto da verdade final.');
    }
    if (!state.megaRequiredPuzzleIds || state.megaRequiredPuzzleIds.length === 0) {
      errors.push('Mega-Pista: selecione pelo menos um quebra-cabeça necessário para desbloquear esta mega-pista.');
    }
  }

  return errors;
}

export default validateCreateClue;
