// Placeholder tab components - to be imported by CreateClueModal_Refactored
// These will be properly implemented in separate files

import React, { useState, useEffect, useRef } from 'react';
import UVEditor from '../../tools/UVEditor';

export const ClueGeneralTab = (props: any) => {
  const {
    title, setTitle,
    descPublic, setDescPublic,
    descHidden, setDescHidden,
    tags, setTags,
    evidenceType, setEvidenceType,
    isHidden, setIsHidden,
    discoveryCode, setDiscoveryCode,
    templates, loadingTemplates, showTemplateDropdown, setShowTemplateDropdown
  } = props;

  return (
    <div className="clue-tab-content">
      <div className="form-group">
        <label>Título da Evidência *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Relatório de Autópsia"
        />
      </div>

      <div className="form-group">
        <label>Descrição Pública</label>
        <textarea
          value={descPublic}
          onChange={(e) => setDescPublic(e.target.value)}
          placeholder="Texto visível para jogadores..."
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>Descrição Oculta (GM Only)</label>
        <textarea
          value={descHidden}
          onChange={(e) => setDescHidden(e.target.value)}
          placeholder="Informações confidenciais..."
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>Tags (separadas por vírgula)</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Ex: suspeito, arma, local"
        />
      </div>

      <div className="form-group">
        <label>Tipo de Evidência</label>
        <select value={evidenceType} onChange={(e) => setEvidenceType(e.target.value as any)}>
          <option value="document">📄 Documento</option>
          <option value="glitch_puzzle">🎮 Puzzle Glitch</option>
          <option value="mega_clue">🔐 Mega Pista</option>
        </select>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={isHidden}
            onChange={(e) => setIsHidden(e.target.checked)}
          />
          🔒 Iniciar como Oculto
        </label>
        <small style={{ color: '#888', fontSize: '12px' }}>
          A pista será invisível até descoberta via busca por código
        </small>
      </div>

      {isHidden && (
        <div className="form-group">
          <label>Código de Descoberta *</label>
          <input
            type="text"
            value={discoveryCode}
            onChange={(e) => setDiscoveryCode(e.target.value.toUpperCase())}
            placeholder="Ex: PROJ-99"
            style={{ textTransform: 'uppercase' }}
          />
          <small style={{ color: '#888', fontSize: '12px' }}>
            Jogadores digitarão isso no terminal para revelar a pista
          </small>
        </div>
      )}
    </div>
  );
};
export const ClueVisualTab = (props: any) => <div>Visual Tab - TODO</div>;
export const ClueAudioTab = (props: any) => <div>Audio Tab - TODO</div>;
export const ClueCipherTab = (props: any) => <div>Cipher Tab - TODO</div>;
export const ClueForensicTab = (props: any) => {
  const {
    forensicBaseImage, setForensicBaseImage,
    forensicBasePreview, setForensicBasePreview,
    forensicHiddenImage, setForensicHiddenImage,
    forensicHiddenPreview, setForensicHiddenPreview,
    forensicTargetChannel, setForensicTargetChannel,
    forensicResultPreview, setForensicResultPreview,
    forensicProcessing, setForensicProcessing,
    showForensicEditor, setShowForensicEditor,
    forensicConfig, setForensicConfig,
    // optional: pass main visual preview from parent to use as base
    globalBasePreview,
  } = props;

  const baseImgRef = useRef<HTMLImageElement | null>(null);
  const hiddenImgRef = useRef<HTMLImageElement | null>(null);

  const handleFileToUrl = (file: File | null, setter: (v: any) => void) => {
    if (!file) {
      setter(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setter(String(reader.result));
    reader.readAsDataURL(file);
  };

  useEffect(() => { handleFileToUrl(forensicBaseImage, setForensicBasePreview); }, [forensicBaseImage]);
  useEffect(() => { handleFileToUrl(forensicHiddenImage, setForensicHiddenPreview); }, [forensicHiddenImage]);

  const [blendMode, setBlendMode] = useState<'replace'|'add'|'multiply'>('add');
  const [opacity, setOpacity] = useState<number>(1);
  const [forensicAlwaysOverlay, setForensicAlwaysOverlay] = useState<boolean>(true);

  const processMerge = async () => {
    const basePreviewToUse = globalBasePreview ?? forensicBasePreview;
    if (!basePreviewToUse || !forensicHiddenPreview) {
      alert('Forneça imagem base (na aba Visual) e imagem secreta');
      return;
    }
    setForensicProcessing(true);

    // Create image elements
    const baseImg = new Image();
    const hiddenImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    hiddenImg.crossOrigin = 'anonymous';
    baseImg.src = basePreviewToUse as string;
    hiddenImg.src = forensicHiddenPreview;

    await Promise.all([
      new Promise((res) => (baseImg.onload = res)),
      new Promise((res) => (hiddenImg.onload = res)),
    ]);

    const w = baseImg.naturalWidth;
    const h = baseImg.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setForensicProcessing(false);
      alert('Erro ao processar imagem');
      return;
    }

    // Draw base
    ctx.drawImage(baseImg, 0, 0, w, h);
    const baseData = ctx.getImageData(0, 0, w, h);

    // Draw hidden into temp canvas resized to base
    const tmp = document.createElement('canvas');
    tmp.width = w;
    tmp.height = h;
    const tctx = tmp.getContext('2d');
    if (!tctx) {
      setForensicProcessing(false);
      alert('Erro ao processar imagem secreta');
      return;
    }
    tctx.drawImage(hiddenImg, 0, 0, w, h);
    const hidData = tctx.getImageData(0, 0, w, h);

    if (forensicAlwaysOverlay) {
      // Draw hidden image as a visible RGB overlay using 'screen' blend
      const tmp2 = document.createElement('canvas');
      tmp2.width = w;
      tmp2.height = h;
      const t2 = tmp2.getContext('2d');
      if (!t2) { setForensicProcessing(false); alert('Erro ao compor overlay'); return; }
      t2.drawImage(hiddenImg, 0, 0, w, h);
      ctx.globalCompositeOperation = 'screen';
      ctx.drawImage(tmp2, 0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      const mergedUrl = canvas.toDataURL('image/png');
      setForensicResultPreview(mergedUrl);
    } else {
      // Merge: compute grayscale of hidden image and blend into selected channel
      const channelIndex = forensicTargetChannel === 'R' ? 0 : forensicTargetChannel === 'G' ? 1 : 2;
      for (let i = 0; i < baseData.data.length; i += 4) {
        const r = hidData.data[i];
        const g = hidData.data[i + 1];
        const b = hidData.data[i + 2];
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        const baseVal = baseData.data[i + channelIndex];
        let out = baseVal;
        if (blendMode === 'replace') {
          out = Math.round(gray * opacity + baseVal * (1 - opacity));
        } else if (blendMode === 'add') {
          out = Math.min(255, Math.round(baseVal + gray * opacity));
        } else if (blendMode === 'multiply') {
          out = Math.round((baseVal / 255) * (gray / 255) * 255 * opacity + baseVal * (1 - opacity));
        }
        baseData.data[i + channelIndex] = out;
      }
      ctx.putImageData(baseData, 0, 0);
      const mergedUrl = canvas.toDataURL('image/png');
      setForensicResultPreview(mergedUrl);
    }
    setForensicProcessing(false);
    // store config for saving
    setForensicConfig && setForensicConfig({ baseChannel: 'none', hiddenChannel: forensicTargetChannel, blendMode, opacity });
  };

  const onHiddenSelect = (f: File | null) => { setForensicHiddenImage(f); };

  return (
    <div className="clue-tab-content forensic-tab-root">
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label>Imagem Base (usará a imagem selecionada na aba Visual)</label>
          <div style={{ marginTop: 8 }}>
            {globalBasePreview ? (
              <div style={{ marginTop: 8 }}>
                <img src={globalBasePreview} alt="base" style={{ width: '100%', opacity: 0.95 }} />
              </div>
            ) : (
              <div style={{ color: '#888', fontSize: 13 }}>Selecione uma imagem na aba <strong>Visual</strong> antes de abrir o editor.</div>
            )}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <label>Camada (saída do Editor Interativo)</label>
          <div>
            <div style={{ marginTop: 8 }}>
              {forensicHiddenPreview ? (
                <img ref={hiddenImgRef as any} src={forensicHiddenPreview} alt="hidden" style={{ width: '100%', filter: 'grayscale(100%)' }} />
              ) : (
                <div style={{ color: '#888', fontSize: 13 }}>Nenhuma camada ainda — abra o editor para desenhar.</div>
              )}
            </div>
            <div style={{ marginTop: 8 }}>
              <button onClick={() => setShowForensicEditor(true)} style={{ padding: '8px 12px' }}>🎨 ABRIR EDITOR INTERATIVO (RECOMENDADO)</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ display: 'block', marginBottom: 6 }}>Modo de Saída</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label className="inline">
            <input type="checkbox" checked={forensicAlwaysOverlay} onChange={(e) => setForensicAlwaysOverlay(e.target.checked)} />&nbsp;Forçar sobreposição visível (gera imagem RGB)
          </label>
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <label>Canal:</label>
        <select value={forensicTargetChannel} onChange={(e) => setForensicTargetChannel(e.target.value)}>
          <option value="R">🔴 Vermelho (R)</option>
          <option value="G">🟢 Verde (G)</option>
          <option value="B">🔵 Azul (B)</option>
        </select>
        <label style={{ marginLeft: 8 }}>Blend:</label>
        <select value={blendMode} onChange={(e) => setBlendMode(e.target.value as any)}>
          <option value="replace">Substituir (lerp)</option>
          <option value="add">Adicionar</option>
          <option value="multiply">Multiplicar</option>
        </select>

        <label style={{ marginLeft: 8 }}>Opacidade:</label>
        <input type="range" min={0} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} />

        <button onClick={processMerge} disabled={forensicProcessing} style={{ marginLeft: 8 }}>
          {forensicProcessing ? '⏳ PROCESSANDO...' : 'PROCESSAR MERGE'}
        </button>
        <button onClick={() => { setForensicResultPreview(null); setForensicBaseImage(null); setForensicHiddenImage(null); }} style={{ marginLeft: 8 }}>
          LIMPAR
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <label>Preview Resultado</label>
        <div style={{ border: '1px solid #333', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
          {forensicResultPreview ? (
            <img src={forensicResultPreview} alt="merged" style={{ maxWidth: '100%' }} />
          ) : (
            <small style={{ color: '#888' }}>Nenhum resultado ainda — processe o merge</small>
          )}
        </div>
      </div>
      {/* Forensic editor is opened from parent modal via showForensicEditor state */}
    </div>
  );
};
export const ClueFieldsTab = (props: any) => <div>Fields Tab - TODO</div>;
export const ClueDisplayTab = (props: any) => <div>Display Tab - TODO</div>;
export const ClueGlitchTab = (props: any) => <div>Glitch Tab - TODO</div>;
export const ClueMegaTab = (props: any) => <div>Mega Tab - TODO</div>;
