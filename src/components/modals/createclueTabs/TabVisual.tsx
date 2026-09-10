import React, { useRef, useState } from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { Info, Image as ImageIcon, Sliders, Video } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import FakePhoneChatBuilder from './FakePhoneChatBuilder';

export default function TabVisual() {
  const { mediaState, setMediaState, setEditorState, filterConfig, setFilterConfig, thermalConfig, setThermalConfig } = useClueModal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMediaState(s => ({ ...s, imgFile: file, previewUrl: url }));
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMediaState(s => ({ ...s, videoFile: file, videoPreviewUrl: url }));
    }
  };

  return (
    <div className="cc-tab-content">
      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          IMAGEM BASE
          <span data-tooltip-id="base-image-tip" style={{ cursor: 'help' }}>
            <Info size={16} color="var(--nexus-text-muted, #666)" />
          </span>
        </h3>
        <Tooltip id="base-image-tip" className="cyber-tooltip">
          A imagem principal exibida ao clicar na pista. Ela será carregada no visualizador da Lousa.
        </Tooltip>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          type="file"
          accept="image/*"
          hidden
          ref={fileInputRef}
          onChange={handleImageSelect}
        />
        <button
          className="cc-btn cc-btn-save"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon size={16} /> Selecionar Imagem Base
        </button>
      </div>

      {mediaState.previewUrl && (
        <div className="cc-media-grid">
          <img src={mediaState.previewUrl} alt="Base" />
        </div>
      )}

      <hr className="cc-divider" style={{ margin: '30px 0' }} />

      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Video size={18} />
          VÍDEO (OPCIONAL)
        </h3>
        <span data-tooltip-id="video-tip" style={{ cursor: 'help', marginLeft: '10px' }}>
          [ ? ]
        </span>
        <Tooltip id="video-tip" className="cyber-tooltip">
          Se você adicionar um vídeo (ou URL de YouTube/Vimeo), ele terá prioridade sobre a imagem base.
        </Tooltip>
      </div>

      <div className="cc-field" style={{ marginTop: '1rem' }}>
        <label className="cc-label">URL do Vídeo (YouTube, Vimeo, mp4 externo)</label>
        <input
          type="text"
          className="cc-input"
          value={mediaState.videoUrlInput}
          onChange={(e) => setMediaState(s => ({ ...s, videoUrlInput: e.target.value }))}
          placeholder="Ex: https://youtube.com/watch?v=..."
        />
      </div>

      <div style={{ marginTop: '1rem', textAlign: 'center', color: '#888', fontSize: '12px' }}>
        -- OU --
      </div>

      <div style={{ marginTop: '1rem', marginBottom: 16 }}>
        <input
          type="file"
          accept="video/mp4,video/webm"
          hidden
          ref={videoInputRef}
          onChange={handleVideoSelect}
        />
        <button
          className="cc-btn cc-btn-save"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => videoInputRef.current?.click()}
        >
          <Video size={16} /> Selecionar Arquivo de Vídeo (Máx 50MB)
        </button>
      </div>

      {mediaState.videoPreviewUrl && (
        <div className="cc-media-grid">
          <video src={mediaState.videoPreviewUrl} controls style={{ maxWidth: '100%' }} />
        </div>
      )}

      <hr className="cc-divider" />

      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Modo Fake Phone
          <span data-tooltip-id="fake-phone-tip" style={{ display: 'flex', cursor: 'help' }}>
            <Info size={16} color="var(--nexus-neon, #00ffff)" />
          </span>
        </h3>
        <Tooltip id="fake-phone-tip" className="cyber-tooltip">
          <span className="cyber-tooltip-title">[ PROTOCOLO FAKE PHONE ]</span>
          Oculta a barra de status e o fundo da janela, exibindo o conteúdo da imagem como se fosse um aplicativo de celular nativo.
        </Tooltip>
      </div>
      <FakePhoneChatBuilder />

      <hr className="cc-divider" />

      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Camada UV / Luz Negra
          <span data-tooltip-id="uv-light-tip" style={{ display: 'flex', cursor: 'help' }}>
            <Info size={16} color="var(--nexus-neon, #00ffff)" />
          </span>
        </h3>
        <Tooltip id="uv-light-tip" className="cyber-tooltip">
          <span className="cyber-tooltip-title">[ LUZ NEGRA ]</span>
          Permite revelar uma camada oculta ao arrastar o mouse/dedo sobre a imagem, simulando uma lanterna de luz negra.
        </Tooltip>
      </div>
      <div style={{ marginBottom: 16 }}>
        <button
          className="cc-btn cc-btn-save"
          style={{ width: '100%', justifyContent: 'center', opacity: mediaState.previewUrl ? 1 : 0.5 }}
          disabled={!mediaState.previewUrl}
          onClick={() => setEditorState(s => ({ ...s, editorMode: 'uv' }))}
        >
          <ImageIcon size={16} /> 🖌️ Desenhar Efeito UV
        </button>
      </div>

      <hr className="cc-divider" />

      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Camada Térmica
          <span data-tooltip-id="thermal-tip" style={{ display: 'flex', cursor: 'help' }}>
            <Info size={16} color="var(--nexus-neon, #00ffff)" />
          </span>
        </h3>
        <Tooltip id="thermal-tip" className="cyber-tooltip">
          <span className="cyber-tooltip-title">[ TÉRMICA ]</span>
          Texto oculto que só é revelado ao usar a ferramenta de visão térmica, caso o jogador informe a senha correta.
        </Tooltip>
      </div>
      
      <div style={{ marginBottom: 16, display: 'flex', gap: '10px' }}>
        <button
          className="cc-btn cc-btn-save"
          style={{ 
             flex: 1, 
             justifyContent: 'center', 
             opacity: mediaState.previewUrl ? 1 : 0.5,
             background: thermalConfig?.enabled ? 'var(--nexus-neon, #00ffff)' : '',
             color: thermalConfig?.enabled ? '#000' : '',
             border: thermalConfig?.enabled ? 'none' : ''
          }}
          disabled={!mediaState.previewUrl}
          onClick={() => setThermalConfig((s: any) => ({ ...s, enabled: !s.enabled }))}
        >
          <Info size={16} /> {thermalConfig?.enabled ? 'Térmica: ON' : 'Ativar Térmica'}
        </button>

        {thermalConfig?.enabled && (
          <button
            className="cc-btn cc-btn-cancel"
            style={{ flex: 1, justifyContent: 'center' }}
            disabled={!mediaState.previewUrl}
            onClick={() => setEditorState(s => ({ ...s, showThermalEditor: true }))}
          >
            <ImageIcon size={16} /> 🌡️ Abrir Editor Térmico
          </button>
        )}
      </div>

      {thermalConfig?.enabled && (
        <div style={{ padding: 12, background: 'rgba(255, 100, 0, 0.05)', borderRadius: 6, border: '1px solid rgba(255, 100, 0, 0.2)', marginBottom: 16 }}>
          <div className="cc-field" style={{ marginBottom: 10 }}>
            <label className="cc-label">Texto Oculto</label>
            <textarea
              className="cc-input"
              rows={3}
              value={thermalConfig.secretText}
              onChange={(e) => setThermalConfig((s: any) => ({ ...s, secretText: e.target.value }))}
              placeholder="Ex: COORDENADAS: 45.123, -12.456"
            />
          </div>
          <div className="cc-field" style={{ marginBottom: 10 }}>
            <label className="cc-label">Senha / Keyword (Opcional)</label>
            <input
              type="text"
              className="cc-input"
              value={thermalConfig.keyword}
              onChange={(e) => setThermalConfig((s: any) => ({ ...s, keyword: e.target.value.toUpperCase() }))}
              placeholder="Deixe em branco para revelar automaticamente"
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="cc-field" style={{ flex: 1 }}>
              <label className="cc-label">Tamanho da Fonte</label>
              <input
                type="number"
                className="cc-input"
                value={thermalConfig.fontSize}
                onChange={(e) => setThermalConfig((s: any) => ({ ...s, fontSize: parseInt(e.target.value) || 24 }))}
              />
            </div>
            <div className="cc-field" style={{ flex: 1 }}>
              <label className="cc-label">Posição Y (%)</label>
              <input
                type="number"
                className="cc-input"
                value={thermalConfig.positionY}
                onChange={(e) => setThermalConfig((s: any) => ({ ...s, positionY: parseInt(e.target.value) || 50 }))}
              />
            </div>
          </div>
        </div>
      )}

      <hr className="cc-divider" />

      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Camada Forense e Filtros
        </h3>
      </div>
      
      <div style={{ marginBottom: 16, display: 'flex', gap: '10px' }}>
        <button
          className="cc-btn cc-btn-cancel"
          style={{ flex: 1, justifyContent: 'center', opacity: mediaState.previewUrl ? 1 : 0.5 }}
          disabled={!mediaState.previewUrl}
          onClick={() => setEditorState(s => ({ ...s, editorMode: 'filter' }))}
        >
          <ImageIcon size={16} /> 🖌️ Desenhar Camada Oculta (Filtro)
        </button>
        <button
          className="cc-btn cc-btn-cancel"
          style={{ flex: 1, justifyContent: 'center', opacity: mediaState.previewUrl ? 1 : 0.5 }}
          disabled={!mediaState.previewUrl}
          onClick={() => setEditorState(s => ({ ...s, showForensicEditor: true }))}
        >
          <ImageIcon size={16} /> 🧪 Abrir Editor (Forense RGB)
        </button>
      </div>

      <div style={{ padding: 12, background: 'rgba(52,152,219,0.05)', borderRadius: 6, border: '1px solid rgba(52,152,219,0.2)' }}>
         <button 
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            className="cc-btn cc-btn-cancel"
            style={{ width: '100%', fontSize: '11px', padding: '6px', justifyContent: 'center', background: showAdvancedFilter ? 'rgba(52,152,219,0.2)' : 'rgba(50,50,50,0.3)' }}
         >
            <Sliders size={14} /> {showAdvancedFilter ? 'Ocultar Ajustes de Filtro' : 'Ajustes de Revelação do Filtro'}
         </button>
         
         {showAdvancedFilter && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
               <div>
                  <label style={{ fontSize: 11, color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
                     Brilho <span style={{ color: '#3498db' }}>{filterConfig.brightness}%</span>
                  </label>
                  <input type="range" min="0" max="200" value={filterConfig.brightness} onChange={e => setFilterConfig(s => ({ ...s, brightness: parseInt(e.target.value) }))} style={{ width: '100%' }} />
               </div>
               <div>
                  <label style={{ fontSize: 11, color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
                     Contraste <span style={{ color: '#3498db' }}>{filterConfig.contrast}%</span>
                  </label>
                  <input type="range" min="0" max="200" value={filterConfig.contrast} onChange={e => setFilterConfig(s => ({ ...s, contrast: parseInt(e.target.value) }))} style={{ width: '100%' }} />
               </div>
               <div>
                  <label style={{ fontSize: 11, color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
                     Saturação <span style={{ color: '#3498db' }}>{filterConfig.saturate}%</span>
                  </label>
                  <input type="range" min="0" max="200" value={filterConfig.saturate} onChange={e => setFilterConfig(s => ({ ...s, saturate: parseInt(e.target.value) }))} style={{ width: '100%' }} />
               </div>
            </div>
         )}
      </div>

    </div>
  );
}
