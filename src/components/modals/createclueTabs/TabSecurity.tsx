import React from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { Lock, ShieldAlert, Smartphone } from 'lucide-react';
import { Tooltip } from 'react-tooltip';

export default function TabSecurity() {
  const { securityState, setSecurityState } = useClueModal();

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
          <span className="cc-checkbox-label">Habilitar Firewall de Investigação (Requer Hack)</span>
        </label>
      </div>

      <hr className="cc-divider" />

      {/* Seção reservada para Telefone/OS Fake baseada no feedback do usuário */}
      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Smartphone size={18} />
          SISTEMA FAKE / TELEFONE
        </h3>
        <span data-tooltip-id="phone-tip" style={{ cursor: 'help', marginLeft: '10px' }}>
          [ ? ]
        </span>
        <Tooltip id="phone-tip" className="cyber-tooltip">
          Configurações de bloqueio para simulações de celulares ou sistemas falsos.
        </Tooltip>
      </div>

      <div className="cc-cyber-note" style={{ marginTop: '1rem' }}>
        Nota: As propriedades estendidas de Telefone (Chat, Keypad OS) devem ser integradas ao coreState futuramente. 
        Por enquanto, configure as senhas acima.
      </div>
    </div>
  );
}
