import React from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';

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
        <h3 className="cc-section-title">[ VISIBILIDADE DE MÍDIA ]</h3>
      </div>
      
      <div className="cc-field">
        <label className="cc-label">Áudio Base</label>
        <select 
          className="cc-input" 
          value={mediaVisibility.audioBase} 
          onChange={(e) => handleMediaChange('audioBase', e.target.value)}
        >
          <option value="always">Sempre</option>
          <option value="glitch_only">Apenas no Glitch</option>
          <option value="post_solve">Após Resolver</option>
        </select>
      </div>

      <div className="cc-field">
        <label className="cc-label">Áudio Escondido</label>
        <select 
          className="cc-input" 
          value={mediaVisibility.audioHidden} 
          onChange={(e) => handleMediaChange('audioHidden', e.target.value)}
        >
          <option value="post_solve">Após Resolver</option>
          <option value="post_keyword">Após Keyword</option>
          <option value="always">Sempre</option>
        </select>
      </div>

      <div className="cc-field">
        <label className="cc-label">Camada UV</label>
        <select 
          className="cc-input" 
          value={mediaVisibility.uvLayer} 
          onChange={(e) => handleMediaChange('uvLayer', e.target.value)}
        >
          <option value="post_keyword">Após Keyword</option>
          <option value="always">Sempre</option>
          <option value="post_solve">Após Resolver</option>
        </select>
      </div>

      <div className="cc-section-header" style={{marginTop: '1.5rem'}}>
        <h3 className="cc-section-title">[ EXIBIÇÃO DA CARTA ]</h3>
      </div>
      
      <div className="cc-cyber-note" style={{marginBottom: '0.5rem'}}>Cifra & Hex</div>
      <div className="cc-checkbox-group">
        <label className="cc-checkbox">
          <input 
            type="checkbox" 
            checked={displayConfig.cipher.showShredded}
            onChange={() => handleCipherToggle('showShredded')}
          />
          <span className="cc-checkbox-label">Mostrar Shredder</span>
        </label>
        
        <label className="cc-checkbox">
          <input 
            type="checkbox" 
            checked={displayConfig.cipher.showCipherText}
            onChange={() => handleCipherToggle('showCipherText')}
          />
          <span className="cc-checkbox-label">Mostrar Texto Cifrado</span>
        </label>
        
        <label className="cc-checkbox">
          <input 
            type="checkbox" 
            checked={displayConfig.cipher.showRealText}
            onChange={() => handleCipherToggle('showRealText')}
          />
          <span className="cc-checkbox-label">Revelar Texto Real (pós-solução)</span>
        </label>
        
        <label className="cc-checkbox">
          <input 
            type="checkbox" 
            checked={displayConfig.cipher.showShredConfig}
            onChange={() => handleCipherToggle('showShredConfig')}
          />
          <span className="cc-checkbox-label">Configuração do Shredder</span>
        </label>
      </div>

      <div className="cc-cyber-note" style={{marginTop: '1rem', marginBottom: '0.5rem'}}>Mega Clue</div>
      <div className="cc-checkbox-group">
        <label className="cc-checkbox">
          <input 
            type="checkbox" 
            checked={displayConfig.megaClue.showHints}
            onChange={() => handleMegaClueToggle('showHints')}
          />
          <span className="cc-checkbox-label">Mostrar Dicas</span>
        </label>
        
        <label className="cc-checkbox">
          <input 
            type="checkbox" 
            checked={displayConfig.megaClue.showAnswer}
            onChange={() => handleMegaClueToggle('showAnswer')}
          />
          <span className="cc-checkbox-label">Mostrar Resposta Final</span>
        </label>
        
        <label className="cc-checkbox">
          <input 
            type="checkbox" 
            checked={displayConfig.megaClue.showProgress}
            onChange={() => handleMegaClueToggle('showProgress')}
          />
          <span className="cc-checkbox-label">Mostrar Progresso</span>
        </label>
      </div>
    </div>
  );
}
