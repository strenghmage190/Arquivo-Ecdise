import React from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { Lock, ShieldAlert, Smartphone } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import PatternLock from '../../tools/PatternLock';
import NumericKeypad from '../../tools/NumericKeypad';
import FakePhoneChatBuilder from './FakePhoneChatBuilder';

export default function TabSecurity() {
  const { securityState, setSecurityState, phoneState, setPhoneState, editorState, setEditorState, thermalConfig, setThermalConfig } = useClueModal();

  return (
    <div className="cc-tab-content">
      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={18} />
          SEGURANÇA DA EVIDÊNCIA
        </h3>
      </div>
      
      <div className="cc-field" style={{ marginTop: '1rem' }}>
        <label className="cc-checkbox">
          <input 
            type="checkbox" 
            checked={securityState.isLocked}
            onChange={(e) => setSecurityState(s => ({ ...s, isLocked: e.target.checked }))}
          />
          <span className="cc-checkbox-label">Bloquear Pista com Senha</span>
        </label>
      </div>

      {securityState.isLocked && (
        <div className="cc-field" style={{ marginLeft: '2rem', marginTop: '1rem' }}>
          <label className="cc-label">Senha de Desbloqueio Principal</label>
          <input
            type="text"
            className="cc-input"
            value={securityState.lockPass}
            onChange={(e) => setSecurityState(s => ({ ...s, lockPass: e.target.value }))}
            placeholder="Ex: 1234, ALFA-99..."
          />
        </div>
      )}

      <hr className="cc-divider" />

      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={18} />
          CAMADAS ADICIONAIS
        </h3>
      </div>
      
      <div className="cc-field" style={{ marginTop: '1rem' }}>
        <label className="cc-checkbox">
          <input 
            type="checkbox" 
            checked={securityState.securityLayerEnabled}
            onChange={(e) => setSecurityState(s => ({ ...s, securityLayerEnabled: e.target.checked }))}
          />
          <span className="cc-checkbox-label" style={{ fontWeight: 700, color: '#c6a45f' }}>Habilitar Firewall de Investigação (Criptografia de Sinal)</span>
        </label>
      </div>

      <div className="cc-field" style={{ marginTop: '0.5rem', marginLeft: '2rem' }}>
        <label className="cc-checkbox">
          <input 
            type="checkbox" 
            checked={securityState.hidePreviewOnBoard}
            onChange={(e) => setSecurityState(s => ({ ...s, hidePreviewOnBoard: e.target.checked }))}
          />
          <span className="cc-checkbox-label" style={{ color: '#bbb' }}>Ocultar prévia no tabuleiro (mostrar apenas ícone bloqueado)</span>
        </label>
      </div>

      <div style={{ marginTop: '1rem', marginLeft: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
         <div className="cc-field">
            <label className="cc-label">Lógica de Revelação</label>
            <select className="cc-input" value={securityState.revealLogicMode} onChange={e => setSecurityState(s => ({ ...s, revealLogicMode: e.target.value as any }))}>
               <option value="always_visible">Sempre visível (pista de percepção)</option>
               <option value="aligned_only">Apenas ao alinhar sliders (Glitch)</option>
               <option value="aligned_keyword">Sliders + senha manual</option>
            </select>
         </div>

         <div className="cc-field">
            <label className="cc-label">Alvos do Sinal Glitch</label>
            <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
               <label className="cc-checkbox">
                  <input type="checkbox" checked={securityState.signalTargets.visual} onChange={e => setSecurityState(s => ({ ...s, signalTargets: { ...s.signalTargets, visual: e.target.checked } }))} />
                  <span className="cc-checkbox-label">Imagem/Vídeo</span>
               </label>
               <label className="cc-checkbox">
                  <input type="checkbox" checked={securityState.signalTargets.audio} onChange={e => setSecurityState(s => ({ ...s, signalTargets: { ...s.signalTargets, audio: e.target.checked } }))} />
                  <span className="cc-checkbox-label">Áudio</span>
               </label>
            </div>
         </div>
      </div>

      <hr className="cc-divider" />

      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={18} />
          CAMADA TÉRMICA (SENHA OCULTA)
        </h3>
        <span data-tooltip-id="thermal-tip" style={{ cursor: 'help', marginLeft: '10px' }}>
          [ ? ]
        </span>
        <Tooltip id="thermal-tip" className="cyber-tooltip">
          Configuração da tinta térmica. A senha só é revelada se o jogador aplicar 'calor' (no Thermal Editor) usando a Keyword correta.
        </Tooltip>
      </div>

      <div className="cc-field" style={{ marginTop: '1rem' }}>
        <label className="cc-checkbox">
          <input 
            type="checkbox" 
            checked={thermalConfig.enabled}
            onChange={(e) => setThermalConfig(s => ({ ...s, enabled: e.target.checked }))}
          />
          <span className="cc-checkbox-label">Habilitar Tinta Térmica (Revela no calor)</span>
        </label>
      </div>

      {thermalConfig.enabled && (
        <div style={{ marginLeft: '2rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '10px', borderLeft: '2px solid #ff4757', background: 'rgba(255, 71, 87, 0.05)' }}>
          <div className="cc-field">
            <label className="cc-label" style={{ color: '#ff4757' }}>Texto Secreto (O que será revelado)</label>
            <textarea
              className="cc-input"
              rows={3}
              style={{ border: '1px solid rgba(255, 71, 87, 0.5)' }}
              value={thermalConfig.secretText}
              onChange={(e) => setThermalConfig(s => ({ ...s, secretText: e.target.value }))}
              placeholder="Ex: A senha do cofre é 4092"
            />
          </div>
          
          <div className="cc-field">
            <label className="cc-label" style={{ color: '#ff4757' }}>Palavra-chave (Keyword para destravar o maçarico)</label>
            <input
              type="text"
              className="cc-input"
              style={{ border: '1px solid rgba(255, 71, 87, 0.5)' }}
              value={thermalConfig.keyword}
              onChange={(e) => setThermalConfig(s => ({ ...s, keyword: e.target.value }))}
              placeholder="Ex: FIRE"
            />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
             <div className="cc-field" style={{ flex: 1 }}>
               <label className="cc-label" style={{ color: '#ff4757' }}>Tamanho da Fonte: {thermalConfig.fontSize}px</label>
               <input
                 type="range"
                 min="12" max="72"
                 value={thermalConfig.fontSize}
                 onChange={(e) => setThermalConfig(s => ({ ...s, fontSize: parseInt(e.target.value) }))}
                 style={{ width: '100%' }}
               />
             </div>
             <div className="cc-field" style={{ flex: 1 }}>
               <label className="cc-label" style={{ color: '#ff4757' }}>Posição Y: {thermalConfig.positionY}%</label>
               <input
                 type="range"
                 min="0" max="100"
                 value={thermalConfig.positionY}
                 onChange={(e) => setThermalConfig(s => ({ ...s, positionY: parseInt(e.target.value) }))}
                 style={{ width: '100%' }}
               />
             </div>
          </div>
        </div>
      )}

      <hr className="cc-divider" />

      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Smartphone size={18} />
          SISTEMA FAKE / TELEFONE
        </h3>
        <span data-tooltip-id="phone-tip" style={{ cursor: 'help', marginLeft: '10px' }}>
          [ ? ]
        </span>
        <Tooltip id="phone-tip" className="cyber-tooltip">
          Configurações de bloqueio para simulações de celulares ou sistemas falsos. O editor visual do teclado é exibido no modo "Telefone".
        </Tooltip>
      </div>

      <div className="cc-field" style={{ marginTop: '1rem' }}>
        <label className="cc-checkbox">
          <input 
            type="checkbox" 
            checked={phoneState.hasKeypad}
            onChange={(e) => setPhoneState(s => ({ ...s, hasKeypad: e.target.checked }))}
          />
          <span className="cc-checkbox-label">Bloquear Telefone Fake (Keypad/Pattern)</span>
        </label>
      </div>

      {phoneState.hasKeypad && (
        <div style={{ marginLeft: '2rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="cc-field">
            <label className="cc-label">Senha do Telefone</label>
            <input
              type="text"
              className="cc-input"
              value={phoneState.password}
              onChange={(e) => setPhoneState(s => ({ ...s, password: e.target.value }))}
              maxLength={phoneState.lockType === 'pin' ? 6 : undefined}
              placeholder={phoneState.lockType === 'pin' ? "PIN Numérico" : "Padrão Numérico (ex: 1-2-3-6-9)"}
            />
          </div>
          
          <div className="cc-field">
            <label className="cc-label">Tipo de Bloqueio</label>
            <select
              className="cc-input"
              style={{ width: '100%', background: 'var(--nexus-bg)' }}
              value={phoneState.lockType}
              onChange={(e) => setPhoneState(s => ({ ...s, lockType: e.target.value as any }))}
            >
              <option value="pin">PIN (numérico)</option>
              <option value="pattern">Padrão (3x3)</option>
            </select>
          </div>
          
          <button
            className="cc-btn cc-btn-cancel"
            onClick={() => setEditorState(s => ({ ...s, showKeypadEditor: true }))}
          >
            Configurar Visuamente (Keypad Editor)
          </button>
          
          {editorState.showKeypadEditor && (
             <div style={{padding: 20, background: '#0a0a0a', borderRadius: 8, border: '1px solid var(--nexus-neon)'}}>
                <div style={{fontSize: 11, marginBottom: 10, color: '#888'}}>Preview e Edição do Keypad:</div>
                {phoneState.lockType === 'pattern' ? (
                   <div>
                      <div style={{fontSize:11, color:'#bbb', marginBottom:8}}>Modo editor de Padrão — clique nos pontos e pressione <strong>OK</strong></div>
                      <PatternLock
                         code={phoneState.password || null}
                         allowEdit={true}
                         onInput={(value) => setPhoneState(s => ({ ...s, password: String(value || '') }))}
                         onUnlock={() => setEditorState(s => ({ ...s, showKeypadEditor: false }))}
                      />
                      <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                         <button className="cc-btn cc-btn-cancel" onClick={() => setPhoneState(s => ({ ...s, password: '' }))}>Limpar Padrão</button>
                         <button className="cc-btn cc-btn-save" onClick={() => setEditorState(s => ({ ...s, showKeypadEditor: false }))}>Salvar</button>
                      </div>
                   </div>
                ) : (
                   <div>
                      <NumericKeypad 
                         code={phoneState.password} 
                         onInput={(value) => setPhoneState(s => ({ ...s, password: value }))}
                         onUnlock={() => setEditorState(s => ({ ...s, showKeypadEditor: false }))} 
                      />
                      <button className="cc-btn cc-btn-save" style={{marginTop: '10px', width: '100%', justifyContent: 'center'}} onClick={() => setEditorState(s => ({ ...s, showKeypadEditor: false }))}>Concluir</button>
                   </div>
                )}
             </div>
          )}
        </div>
      )}

      <hr className="cc-divider" style={{ margin: '30px 0' }} />
      <FakePhoneChatBuilder />
    </div>
  );
}
