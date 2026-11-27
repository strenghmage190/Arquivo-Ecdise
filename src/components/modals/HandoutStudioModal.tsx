import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Flashlight, Flame, Sparkles, Check, Upload } from 'lucide-react';
import {
  getHandoutTemplateMeta,
  HANDOUT_TEMPLATES,
  HandoutConfig,
  HandoutSecretMode,
  HandoutSecretPosition,
  HandoutTemplateId,
  renderHandoutBaseToCanvas,
  renderHandoutSecretToCanvas,
} from '../../utils/handoutGenerator';

export interface HandoutStudioResult {
  baseFile: File;
  secretFile: File | null;
  secretMode: HandoutSecretMode;
  suggestedTitle: string;
}

interface HandoutStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (result: HandoutStudioResult) => void;
}

export default function HandoutStudioModal({
  isOpen,
  onClose,
  onApply,
}: HandoutStudioModalProps) {
  const initialMeta = HANDOUT_TEMPLATES[0];
  const [config, setConfig] = useState<HandoutConfig>({
    template: 'cris_report',
    title: initialMeta.defaultTitle,
    subtitle: initialMeta.defaultSubtitle,
    dateLine: initialMeta.defaultDate,
    body: 'Durante a varredura no Setor C, a equipe recuperou o dossiê referente ao sujeito ||DR. HENRIQUE VALE||.\n\nOs registros de acesso indicam que a sala foi trancada às 03:14 usando a credencial padrão de emergência.',
    stamp: initialMeta.defaultStamp,
    signature: 'Agente Veríssimo',
    aging: 45,
    secretMode: 'uv',
    secretText: '',
    secretPosition: 'center',
  });
  const [previewSecret, setPreviewSecret] = useState(true);
  const [polaroidImg, setPolaroidImg] = useState<HTMLImageElement | null>(null);
  const [exporting, setExporting] = useState(false);

  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const secretCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (baseCanvasRef.current) {
      renderHandoutBaseToCanvas(baseCanvasRef.current, config, polaroidImg);
    }
    if (secretCanvasRef.current) {
      const hasSecret = renderHandoutSecretToCanvas(secretCanvasRef.current, config);
      if (!hasSecret) {
        const ctx = secretCanvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, secretCanvasRef.current.width, secretCanvasRef.current.height);
      }
    }
  }, [isOpen, config, polaroidImg]);

  if (!isOpen) return null;

  const handleTemplateSelect = (id: HandoutTemplateId) => {
    const meta = getHandoutTemplateMeta(id);
    setConfig((prev) => ({
      ...prev,
      template: id,
      title: meta.defaultTitle,
      subtitle: meta.defaultSubtitle,
      dateLine: meta.defaultDate,
      stamp: meta.defaultStamp,
    }));
  };

  const handlePolaroidUpload = (file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setPolaroidImg(img);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleApply = async () => {
    if (!baseCanvasRef.current) return;
    setExporting(true);
    try {
      const baseBlob = await new Promise<Blob | null>((resolve) =>
        baseCanvasRef.current?.toBlob((b) => resolve(b), 'image/png')
      );
      if (!baseBlob) return;

      const baseFile = new File([baseBlob], `handout_${config.template}_${Date.now()}.png`, {
        type: 'image/png',
      });

      let secretFile: File | null = null;
      if (config.secretMode !== 'none' && config.secretText.trim() && secretCanvasRef.current) {
        const secretBlob = await new Promise<Blob | null>((resolve) =>
          secretCanvasRef.current?.toBlob((b) => resolve(b), 'image/png')
        );
        if (secretBlob) {
          secretFile = new File(
            [secretBlob],
            `handout_${config.secretMode}_${Date.now()}.png`,
            { type: 'image/png' }
          );
        }
      }

      onApply({
        baseFile,
        secretFile,
        secretMode: secretFile ? config.secretMode : 'none',
        suggestedTitle: config.title.trim() || getHandoutTemplateMeta(config.template).label,
      });
      onClose();
    } finally {
      setExporting(false);
    }
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60000,
        background: 'rgba(2, 6, 23, 0.86)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: 'min(1120px, 100%)',
          maxHeight: '92vh',
          background: '#0b1120',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#e2e8f0',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.16)',
            background: 'rgba(15, 23, 42, 0.9)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color="#38bdf8" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>ESTÚDIO DE HANDOUTS (GERADOR DE DOCUMENTOS)</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                Use <code>||texto||</code> para criar tarjas pretas de censura · Camada UV/Termal queimada em PNG (Anti-F12)
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              color: '#cbd5e1',
              borderRadius: 6,
              padding: 6,
              cursor: 'pointer',
            }}
            aria-label="Fechar estúdio de handouts"
          >
            <X size={16} />
          </button>
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(290px, 1fr) minmax(300px, 1.05fr)',
            gap: 16,
            padding: 16,
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {/* Controles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, fontWeight: 700 }}>
                1. MODELO DE DOCUMENTO
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))', gap: 6 }}>
                {HANDOUT_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleTemplateSelect(tpl.id)}
                    className={`ccm-btn ccm-btn-sm ${config.template === tpl.id ? 'ccm-btn-primary' : ''}`}
                    style={{ justifyContent: 'flex-start', fontSize: 11 }}
                  >
                    <FileText size={12} /> {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {config.template === 'polaroid' && (
              <label
                className="ccm-btn ccm-btn-sm"
                style={{ cursor: 'pointer', justifyContent: 'center' }}
              >
                <Upload size={13} /> Carregar Foto para Polaroid (opcional)
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => handlePolaroidUpload(e.target.files?.[0])}
                />
              </label>
            )}

            <div className="ccm-field">
              <label className="ccm-label">Título / Manchete</label>
              <input
                type="text"
                className="ccm-input"
                value={config.title}
                onChange={(e) => setConfig((c) => ({ ...c, title: e.target.value }))}
              />
            </div>

            <div className="ccm-grid-2">
              <div className="ccm-field">
                <label className="ccm-label">Subtítulo / Setor</label>
                <input
                  type="text"
                  className="ccm-input"
                  value={config.subtitle}
                  onChange={(e) => setConfig((c) => ({ ...c, subtitle: e.target.value }))}
                />
              </div>
              <div className="ccm-field">
                <label className="ccm-label">Data / Protocolo</label>
                <input
                  type="text"
                  className="ccm-input"
                  value={config.dateLine}
                  onChange={(e) => setConfig((c) => ({ ...c, dateLine: e.target.value }))}
                />
              </div>
            </div>

            <div className="ccm-field">
              <label className="ccm-label">Corpo do Documento (suporta ||tarja preta||)</label>
              <textarea
                rows={4}
                className="ccm-input"
                value={config.body}
                onChange={(e) => setConfig((c) => ({ ...c, body: e.target.value }))}
              />
            </div>

            <div className="ccm-grid-2">
              <div className="ccm-field">
                <label className="ccm-label">Carimbo (Ex: CONFIDENCIAL)</label>
                <input
                  type="text"
                  className="ccm-input"
                  value={config.stamp}
                  onChange={(e) => setConfig((c) => ({ ...c, stamp: e.target.value }))}
                  placeholder="Deixe vazio para sem carimbo"
                />
              </div>
              <div className="ccm-field">
                <label className="ccm-label">Assinatura</label>
                <input
                  type="text"
                  className="ccm-input"
                  value={config.signature}
                  onChange={(e) => setConfig((c) => ({ ...c, signature: e.target.value }))}
                />
              </div>
            </div>

            <div className="ccm-field">
              <label className="ccm-label">Envelhecimento / Manchas do Papel: {config.aging}%</label>
              <input
                type="range"
                min={0}
                max={100}
                value={config.aging}
                onChange={(e) => setConfig((c) => ({ ...c, aging: Number(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </div>

            <div
              style={{
                padding: 10,
                borderRadius: 8,
                background: 'rgba(168, 85, 247, 0.08)',
                border: '1px solid rgba(168, 85, 247, 0.28)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#d8b4fe' }}>
                2. CAMADA OCULTA INTEGRADA (UV / TERMAL)
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(
                  [
                    { id: 'none', label: 'Sem segredo' },
                    { id: 'uv', label: 'Tinta UV' },
                    { id: 'thermal', label: 'Termal Residual' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`ccm-btn ccm-btn-sm ${config.secretMode === m.id ? 'ccm-btn-primary' : ''}`}
                    onClick={() => setConfig((c) => ({ ...c, secretMode: m.id }))}
                  >
                    {m.id === 'uv' && <Flashlight size={12} />}
                    {m.id === 'thermal' && <Flame size={12} />}
                    {m.label}
                  </button>
                ))}
              </div>

              {config.secretMode !== 'none' && (
                <>
                  <input
                    type="text"
                    className="ccm-input ccm-input-mono"
                    value={config.secretText}
                    onChange={(e) => setConfig((c) => ({ ...c, secretText: e.target.value }))}
                    placeholder="Ex: SENHA DO COFRE: 4812"
                  />
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(['top', 'center', 'bottom', 'diagonal'] as HandoutSecretPosition[]).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        className={`ccm-btn ccm-btn-sm ${config.secretPosition === pos ? 'ccm-btn-primary' : ''}`}
                        onClick={() => setConfig((c) => ({ ...c, secretPosition: pos }))}
                      >
                        {pos === 'top'
                          ? 'Topo'
                          : pos === 'center'
                          ? 'Centro'
                          : pos === 'bottom'
                          ? 'Rodapé'
                          : 'Diagonal'}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Preview ao Vivo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>PRÉ-VISUALIZAÇÃO EM TEMPO REAL</span>
              {config.secretMode !== 'none' && config.secretText.trim() && (
                <button
                  type="button"
                  className={`ccm-btn ccm-btn-sm ${previewSecret ? 'ccm-btn-primary' : ''}`}
                  onClick={() => setPreviewSecret((v) => !v)}
                >
                  {previewSecret ? 'Ocultar Preview Secreto' : 'Simular Luz UV/Termal'}
                </button>
              )}
            </div>

            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 440,
                borderRadius: 8,
                overflow: 'hidden',
                boxShadow: '0 14px 36px rgba(0,0,0,0.55)',
                border: '1px solid rgba(148,163,184,0.2)',
              }}
            >
              <canvas
                ref={baseCanvasRef}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  filter:
                    previewSecret && config.secretMode === 'uv' && config.secretText.trim()
                      ? 'brightness(0.45) contrast(1.25) hue-rotate(240deg)'
                      : undefined,
                }}
              />
              <canvas
                ref={secretCanvasRef}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  opacity: previewSecret && config.secretMode !== 'none' && config.secretText.trim() ? 0.95 : 0,
                  transition: 'opacity 0.2s ease',
                }}
              />
            </div>
          </div>
        </div>

        <footer
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            padding: '12px 16px',
            borderTop: '1px solid rgba(148, 163, 184, 0.16)',
            background: 'rgba(15, 23, 42, 0.9)',
          }}
        >
          <button type="button" className="ccm-btn" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="ccm-btn ccm-btn-primary"
            disabled={exporting}
            onClick={handleApply}
          >
            <Check size={14} /> {exporting ? 'Gerando PNGs...' : 'Aplicar Handout na Pista'}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
