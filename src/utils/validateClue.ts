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
  hidePreviewOnBoard?: boolean;
  mediaVisibilityAudioHidden?: string;
  mediaVisibilityUvLayer?: string;
  uvFile?: File | null;
  uvPreviewUrl?: string | null;
  glitchStartFrequency?: number;
  glitchStartShift?: number;
  glitchStartChromatic?: number;
  glitchCorrectFrequency?: number;
  glitchCorrectShift?: number;
  glitchCorrectChromatic?: number;
  glitchToleranceFreq?: number;
  glitchToleranceShift?: number;
  glitchToleranceChroma?: number;
  chatListLength?: number;
  displayConfig?: {
    puzzle?: { showCorrectAnswerWhenSolved?: boolean };
    cipher?: { showRealText?: boolean };
    megaClue?: { showAnswer?: boolean };
  };
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

  const hasPuzzleActive =
    Boolean(state.securityLayerEnabled) || state.evidenceType === 'glitch_puzzle';

  const hasHiddenAudio = Boolean(
    state.audioHidden || (state.audioHiddenPreview && state.audioHiddenPreview.trim())
  );
  const hasUvLayer = Boolean(
    state.uvFile || (state.uvPreviewUrl && state.uvPreviewUrl.trim())
  );

  if (
    !hasPuzzleActive &&
    ((hasHiddenAudio &&
      (state.mediaVisibilityAudioHidden === 'post_solve' ||
        state.mediaVisibilityAudioHidden === 'post_keyword')) ||
      (hasUvLayer &&
        (state.mediaVisibilityUvLayer === 'post_solve' ||
          state.mediaVisibilityUvLayer === 'post_keyword')))
  ) {
    issues.push({
      field: 'mediaVisibility',
      tab: 'campos',
      message:
        'Áudio oculto ou camada UV está configurado para liberar apenas após resolver puzzle, mas nenhum Glitch/Firewall está ativo.',
      severity: 'warning',
    });
  }

  if (state.securityLayerEnabled === true && state.hidePreviewOnBoard === false) {
    issues.push({
      field: 'hidePreviewOnBoard',
      tab: 'seguranca',
      message:
        'Firewall de sinal ativo sem "Ocultar Preview na Lousa": jogadores podem ver a mídia antes de resolver.',
      severity: 'warning',
    });
  }

  if (
    hasPuzzleActive &&
    typeof state.glitchStartFrequency === 'number' &&
    typeof state.glitchStartShift === 'number' &&
    typeof state.glitchStartChromatic === 'number' &&
    typeof state.glitchCorrectFrequency === 'number' &&
    typeof state.glitchCorrectShift === 'number' &&
    typeof state.glitchCorrectChromatic === 'number'
  ) {
    const tolFreq = state.glitchToleranceFreq ?? 5;
    const tolShift = state.glitchToleranceShift ?? 5;
    const tolChroma = state.glitchToleranceChroma ?? 5;
    const alreadyAligned =
      Math.abs(state.glitchStartFrequency - state.glitchCorrectFrequency) <= tolFreq &&
      Math.abs(state.glitchStartShift - state.glitchCorrectShift) <= tolShift &&
      Math.abs(state.glitchStartChromatic - state.glitchCorrectChromatic) <= tolChroma;

    if (alreadyAligned) {
      issues.push({
        field: 'glitchStart',
        tab: state.evidenceType === 'glitch_puzzle' ? 'glitch' : 'seguranca',
        message:
          'Glitch: os valores iniciais já estão dentro da tolerância da solução (o puzzle abrirá resolvido).',
        severity: 'warning',
      });
    }
  }

  const hasBaseAudio = Boolean(
    state.audioBase || (state.audioBasePreview && state.audioBasePreview.trim())
  );
  if (hasHiddenAudio && !hasBaseAudio) {
    issues.push({
      field: 'audioBase',
      tab: 'audio',
      message: 'Áudio oculto configurado sem áudio base: adicione um áudio base para mascarar o sinal.',
      severity: 'warning',
    });
  }

  if (
    state.phoneHasKeypad === true &&
    typeof state.chatListLength === 'number' &&
    state.chatListLength === 0
  ) {
    issues.push({
      field: 'phoneChat',
      tab: 'seguranca',
      message: 'Celular com bloqueio ativo, mas nenhuma mensagem de chat foi adicionada.',
      severity: 'warning',
    });
  }

  const spoilersEnabled: string[] = [];
  if (state.displayConfig?.puzzle?.showCorrectAnswerWhenSolved) {
    spoilersEnabled.push('Parâmetros corretos do puzzle');
  }
  if (state.displayConfig?.cipher?.showRealText) {
    spoilersEnabled.push('Texto real da cifra');
  }
  if (state.displayConfig?.megaClue?.showAnswer) {
    spoilersEnabled.push('Resposta final da Mega-Pista');
  }
  if (spoilersEnabled.length > 0) {
    issues.push({
      field: 'displayConfig',
      tab: 'display',
      message: `Spoilers ativos em Display Config: ${spoilersEnabled.join(', ')}.`,
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
