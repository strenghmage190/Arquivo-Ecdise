import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Unlock, Lock, EyeOff, X } from 'lucide-react';
import InspectionModal from './InspectionModal';
import { useClueModal } from '../../contexts/ClueModalContext';
import {
  buildClueDbPayload,
  serializePublicClueCard,
  UploadedClueUrls,
} from '../../utils/cluePayloadBuilder';

export interface PlayerViewSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  investigationId: string;
  existingCard?: any;
  initialX?: number;
  initialY?: number;
}

export default function PlayerViewSimulatorModal({
  isOpen,
  onClose,
  investigationId,
  existingCard,
  initialX,
  initialY,
}: PlayerViewSimulatorModalProps) {
  const {
    coreState,
    securityState,
    mediaState,
    cipherState,
    glitchState,
    megaClueState,
    filterConfig,
    thermalConfig,
    phoneState,
    personState,
    metadataState,
    fieldVisibilityConfig,
    displayConfig,
    mediaVisibility,
    insights,
    cardStatus,
  } = useClueModal();

  const [ignorePassword, setIgnorePassword] = useState(false);

  const simulatedCard = useMemo(() => {
    if (!isOpen) return null;

    const previewUrls: UploadedClueUrls = {
      imgUrl: mediaState.previewUrl || undefined,
      uvUrl: mediaState.uvPreviewUrl || undefined,
      filterUrl: mediaState.filterPreviewUrl || undefined,
      thermalUrl: mediaState.thermalPreviewUrl || undefined,
      forensicUrl: mediaState.forensicPreviewUrl || undefined,
      videoUrl:
        mediaState.videoPreviewUrl ||
        mediaState.videoUrlInput?.trim() ||
        mediaState.videoUrl ||
        undefined,
      audUrl: mediaState.audioBasePreview || undefined,
      audHidUrl:
        mediaState.audioHiddenUploadedUrl || mediaState.audioHiddenPreview || undefined,
      glitchFocusedUrl: glitchState.glitchFocusedImagePreview || undefined,
      megaImageUrl:
        megaClueState.megaImagePreview || mediaState.megaImagePreview || undefined,
    };

    const rawPayload = buildClueDbPayload({
      investigationId,
      existingCard,
      initialX,
      initialY,
      uploadedUrls: previewUrls,
      coreState,
      securityState: ignorePassword
        ? { ...securityState, isLocked: false, lockPass: '' }
        : securityState,
      mediaState,
      cipherState,
      glitchState,
      megaClueState,
      filterConfig,
      thermalConfig,
      phoneState,
      personState,
      metadataState,
      fieldVisibilityConfig,
      displayConfig,
      mediaVisibility,
      insights,
      cardStatus,
    });

    const syntheticCard = {
      ...rawPayload,
      id: existingCard?.id || 'simulated-player-preview',
      investigation_id: investigationId,
    };

    return serializePublicClueCard(syntheticCard);
  }, [
    isOpen,
    ignorePassword,
    investigationId,
    existingCard,
    initialX,
    initialY,
    coreState,
    securityState,
    mediaState,
    cipherState,
    glitchState,
    megaClueState,
    filterConfig,
    thermalConfig,
    phoneState,
    personState,
    metadataState,
    fieldVisibilityConfig,
    displayConfig,
    mediaVisibility,
    insights,
    cardStatus,
  ]);

  if (!isOpen || !simulatedCard) return null;

  return (
    <>
      {createPortal(
        <div className="cc-sim-banner">
          <div className="cc-sim-banner-left">
            <span className="cc-sim-badge">
              <Eye size={14} /> SIMULAÇÃO: VISÃO DO JOGADOR
            </span>
            <span className="cc-sim-pill">
              {coreState.isHidden ? (
                <>
                  <EyeOff size={12} /> Pista Oculta (requer código)
                </>
              ) : (
                <>
                  <Eye size={12} /> Visível na lousa
                </>
              )}
            </span>
            {securityState.hidePreviewOnBoard && (
              <span className="cc-sim-pill cc-sim-pill-warn">
                Preview oculto na lousa
              </span>
            )}
            {securityState.isLocked && (
              <span className="cc-sim-pill cc-sim-pill-lock">
                <Lock size={12} /> Bloqueada por senha
              </span>
            )}
          </div>

          <div className="cc-sim-banner-right">
            {securityState.isLocked && (
              <label className="cc-sim-toggle">
                <input
                  type="checkbox"
                  checked={ignorePassword}
                  onChange={(e) => setIgnorePassword(e.target.checked)}
                />
                <Unlock size={13} />
                <span>Ignorar senha no teste</span>
              </label>
            )}
            <button type="button" className="cc-sim-close-btn" onClick={onClose}>
              <X size={14} /> Fechar Simulação
            </button>
          </div>
        </div>,
        document.body
      )}

      <InspectionModal
        isOpen={isOpen}
        onClose={onClose}
        card={simulatedCard}
        isGameMaster={false}
      />
    </>
  );
}
