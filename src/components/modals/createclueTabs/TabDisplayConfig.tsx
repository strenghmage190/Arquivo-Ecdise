import React from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { Info, Volume2, ShieldAlert, Monitor, Eye } from 'lucide-react';
import { Tooltip } from 'react-tooltip';

export default function TabDisplayConfig() {
  const { displayConfig, setDisplayConfig, mediaVisibility, setMediaVisibility } = useClueModal();

  const handleMediaChange = (field: keyof typeof mediaVisibility, value: string) => {
    setMediaVisibility(prev => ({ ...prev, [field]: value }));
  };

  const handleCipherToggle = (field: keyof typeof displayConfig.cipher) => {
    setDisplayConfig(prev => ({
      ...prev,
      cipher: { ...prev.cipher, [field]: !prev.cipher[field] }
    }));
  };

  const handleMegaClueToggle = (field: keyof typeof displayConfig.megaClue) => {
    setDisplayConfig(prev => ({
      ...prev,
      megaClue: { ...prev.megaClue, [field]: !prev.megaClue[field] }
    }));
  };

  return (
    <div className="cc-tab-content">
      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Monitor size={18} /> COMPORTAMENTO DE MÍDIA
        </h3>
      </div>
      
      <div className="cc-field" style={{ marginTop: '1rem' }}>
        <label className="cc-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          Áudio Base
          <span data-tooltip-id="audio-base-tip" style={{ cursor: 'help' }}><Info size={14} color="#888" /></span>
        </label>
        <Tooltip id="audio-base-tip" className="cyber-tooltip">Quando o áudio principal (fundo) será tocado na lousa.</Tooltip>
        <select 
          className="cc-input" 
          value={mediaVisibility.audioBase} 
          onChange={(e) => handleMediaChange('audioBase', e.target.value)}
        >
          <option value="always">Tocar Sempre (Visível imediatamente)</option>
          <option value="glitch_only">Apenas durante o Quebra-Cabeça (Glitch)</option>
          <option value="post_solve">Apenas após Resolver a pista</option>
        </select>
      </div>

      <div className="cc-field">
        <label className="cc-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          Áudio Escondido (Oculto)
          <span data-tooltip-id="audio-hidden-tip" style={{ cursor: 'help' }}><Info size={14} color="#888" /></span>
        </label>
        <Tooltip id="audio-hidden-tip" className="cyber-tooltip">Quando a faixa de áudio secreta será liberada.</Tooltip>
        <select 
          className="cc-input" 
          value={mediaVisibility.audioHidden} 
          onChange={(e) => handleMediaChange('audioHidden', e.target.value)}
        >
          <option value="post_solve">Liberar após Resolver a pista</option>
          <option value="post_keyword">Liberar usando Palavra-Chave (Keyword)</option>
          <option value="always">Liberar Sempre</option>
        </select>
      </div>

      <div className="cc-field">
        <label className="cc-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          Camada UV (Luz Negra)
          <span data-tooltip-id="uv-layer-tip" style={{ cursor: 'help' }}><Info size={14} color="#888" /></span>
        </label>
        <Tooltip id="uv-layer-tip" className="cyber-tooltip">Quando a lanterna UV ficará disponível para raspar a imagem.</Tooltip>
        <select 
          className="cc-input" 
          value={mediaVisibility.uvLayer} 
          onChange={(e) => handleMediaChange('uvLayer', e.target.value)}
        >
          <option value="post_keyword">Após usar Palavra-Chave (Keyword)</option>
          <option value="always">Sempre Disponível</option>
          <option value="post_solve">Apenas após Resolver</option>
        </select>
      </div>

      <hr className="cc-divider" />

      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Eye size={18} /> EXIBIÇÃO DA CARTA NA LOUSA
        </h3>
      </div>
      
      <div className="cc-cyber-note" style={{marginTop: '1rem', marginBottom: '0.5rem'}}>Opções de Cifra & Hexadecimal</div>
      <div className="cc-checkbox-group">
        <label className="cc-checkbox">
          <input 
            type="checkbox" 
            checked={displayConfig.cipher.showShredded}
            onChange={() => handleCipherToggle('showShredded')}
          />
          <span className="cc-checkbox-label" title="Exibe os recortes de papel na lousa.">Mostrar Imagem Picotada (Shredder)</span>
        </label>
        
        <label className="cc-checkbox">
          <input 
            type="checkbox" 
            checked={displayConfig.cipher.showCipherText}
            onChange={() => handleCipherToggle('showCipherText')}
          />
          <span className="cc-checkbox-label" title="Mostra o texto criptografado antes da solução.">Mostrar Texto Criptografado</span>
        </label>
        
        <label className="cc-checkbox">
          <input 
            type="checkbox" 
            checked={displayConfig.cipher.showRealText}
            onChange={() => handleCipherToggle('showRealText')}
          />
          <span className="cc-checkbox-label" title="Substitui o texto cifrado pelo texto real após a cifra ser resolvida.">Revelar Texto Real (Pós-Solução)</span>
        </label>
        
        <label className="cc-checkbox">
          <input 
            type="checkbox" 
            checked={displayConfig.cipher.showShredConfig}
            onChange={() => handleCipherToggle('showShredConfig')}
          />
          <span className="cc-checkbox-label" title="Exibe quantas linhas e colunas tem a imagem picotada.">Mostrar Configuração do Shredder na interface</span>
        </label>
      </div>

      <div className="cc-cyber-note" style={{marginTop: '1.5rem', marginBottom: '0.5rem'}}>Mega-Pista Final (Mega Clue)</div>
      <div className="cc-checkbox-group">
        <label className="cc-checkbox">
          <input 
            type="checkbox" 
            checked={displayConfig.megaClue.showHints}
            onChange={() => handleMegaClueToggle('showHints')}
          />
          <span className="cc-checkbox-label" title="Mostra as dicas se o jogador agarrar.">Mostrar Dicas da Mega Clue</span>
        </label>
        
        <label className="cc-checkbox">
          <input 
            type="checkbox" 
            checked={displayConfig.megaClue.showAnswer}
            onChange={() => handleMegaClueToggle('showAnswer')}
          />
          <span className="cc-checkbox-label" title="Força mostrar a resposta (útil para testes).">Mostrar Resposta Final Imediatamente</span>
        </label>
        
        <label className="cc-checkbox">
          <input 
            type="checkbox" 
            checked={displayConfig.megaClue.showProgress}
            onChange={() => handleMegaClueToggle('showProgress')}
          />
          <span className="cc-checkbox-label" title="Exibe a barra de progresso (ex: 2/5 pistas coletadas).">Exibir Barra de Progresso (Checklist)</span>
        </label>
      </div>
    </div>
  );
}
