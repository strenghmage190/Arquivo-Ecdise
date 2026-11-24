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
  videoUrl?: string | null;
  videoPreviewUrl?: string | null;
  audioBase?: File | null;
  audioBasePreview?: string | null;
  audioHidden?: File | null;
  audioHiddenPreview?: string | null;
  previewUrl?: string | null;
  isLocked?: boolean;
  lockPass?: string;
  lockPasses?: string[];
  phoneHasKeypad?: boolean;
  phonePassword?: string;
  isShredded?: boolean;
  hexEncodingMethod?: string;
  hexEncodingKey?: string;
  thermalEnabled?: boolean;
  thermalSecretText?: string;
  thermalPreviewUrl?: string | null;
  thermalFile?: File | null;
  glitchRequireKeyword?: boolean;
  revealLogicMode?: string;
  glitchKeyword?: string;
  glitchRewardCode?: string;
}

export interface ValidationIssue {
  field: string;
  tab: string;
  message: string;
  severity: 'error' | 'warning';
}

export function validateClueDetailed(state: CreateClueState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!state.title || !state.title.trim()) {
    issues.push({
      field: 'title',
      tab: 'geral',
      message: 'Título: informe um título identificável para a pista.',
      severity: 'error',
    });
  }

  if (state.isHidden === true) {
    if (!state.discoveryCode || !state.discoveryCode.trim()) {
      issues.push({
        field: 'discoveryCode',
        tab: 'geral',
        message: 'Pista oculta: o código de descoberta é obrigatório para pistas ocultas.',
        severity: 'error',
      });
    }
  }

  if (state.isLocked === true && state.evidenceType !== 'mega_clue') {
    if (!state.lockPass || !state.lockPass.trim()) {
      issues.push({
        field: 'lockPass',
        tab: 'seguranca',
        message: 'Bloqueio ativo: defina uma senha de desbloqueio para a pista.',
        severity: 'error',
      });
    }
  }

  if (state.phoneHasKeypad === true) {
    if (!state.phonePassword || !state.phonePassword.trim()) {
      issues.push({
        field: 'phonePassword',
        tab: 'seguranca',
        message: 'Sistema de telefone: informe uma senha para o bloqueio do telefone.',
        severity: 'error',
      });
    }
  }

  const wantsSecurityLayer =
    Boolean(state.securityLayerEnabled) || state.evidenceType === 'glitch_puzzle';
  if (wantsSecurityLayer) {
    const hasAnyMedia = Boolean(
      state.imgFile ||
        (state.previewUrl && state.previewUrl.trim()) ||
        state.videoFile ||
        (state.videoUrlInput && state.videoUrlInput.trim()) ||
        (state.videoUrl && state.videoUrl.trim()) ||
        state.audioBase ||
        (state.audioBasePreview && state.audioBasePreview.trim())
    );
    if (!hasAnyMedia) {
      issues.push({
        field: 'media',
        tab: 'visual',
        message:
          'Camada de segurança ativa: envie ao menos uma mídia (imagem, vídeo ou áudio) na aba Visual/Áudio.',
        severity: 'error',
      });
    }
  }

  if (state.evidenceType === 'mega_clue') {
    if (!state.megaFinalTruthText || !state.megaFinalTruthText.trim()) {
      issues.push({
        field: 'megaFinalTruthText',
        tab: 'mega',
        message: 'Mega-Pista: defina o texto da verdade final.',
        severity: 'error',
      });
    }
    if (!state.megaRequiredPuzzleIds || state.megaRequiredPuzzleIds.length === 0) {
      issues.push({
        field: 'megaRequiredPuzzleIds',
        tab: 'mega',
        message:
          'Mega-Pista: selecione pelo menos um quebra-cabeça necessário para desbloquear esta mega-pista.',
        severity: 'error',
      });
    }
  }

  if (state.isShredded === true) {
    const hasImage = Boolean(state.imgFile || (state.previewUrl && state.previewUrl.trim()));
    if (!hasImage) {
      issues.push({
        field: 'isShredded',
        tab: 'cifra',
        message: 'Shredder ativo: selecione uma imagem base para fragmentar.',
        severity: 'error',
      });
    }
    if (state.evidenceType && state.evidenceType !== 'document') {
      issues.push({
        field: 'evidenceType',
        tab: 'cifra',
        message: 'Shredder ativo: o subtipo da evidência deve ser document.',
        severity: 'error',
      });
    }
  }

  // Warnings
  if (
    (state.hexEncodingMethod === 'xor' || state.hexEncodingMethod === 'enigma') &&
    (!state.hexEncodingKey || !state.hexEncodingKey.trim())
  ) {
    issues.push({
      field: 'hexEncodingKey',
      tab: 'cifra',
      message: `Codificação Hex (${state.hexEncodingMethod.toUpperCase()}): informe uma chave de codificação para evitar saída previsível.`,
      severity: 'warning',
    });
  }

  if (
    (state.glitchRequireKeyword === true || state.revealLogicMode === 'aligned_keyword') &&
    (!state.glitchKeyword || !state.glitchKeyword.trim())
  ) {
    issues.push({
      field: 'glitchKeyword',
      tab: 'glitch',
      message: 'Glitch / Firewall: palavra-chave obrigatória está ativa, mas nenhuma keyword foi definida.',
      severity: 'warning',
    });
  }

  if (
    state.thermalEnabled === true &&
    (!state.thermalSecretText || !state.thermalSecretText.trim()) &&
    !state.thermalPreviewUrl &&
    !state.thermalFile
  ) {
    issues.push({
      field: 'thermalSecretText',
      tab: 'visual',
      message: 'Camada térmica ativa: defina um texto secreto ou desenhe uma camada térmica.',
      severity: 'warning',
    });
  }

  return issues;
}

export function validateCreateClue(state: CreateClueState): string[] {
  return validateClueDetailed(state)
    .filter((issue) => issue.severity === 'error')
    .map((issue) => issue.message);
}

export default validateCreateClue;
