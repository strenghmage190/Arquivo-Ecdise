import React from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { Lock, ShieldAlert, Smartphone, Flame, Info } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import PatternLock from '../../tools/PatternLock';
import NumericKeypad from '../../tools/NumericKeypad';
import FakePhoneChatBuilder from './FakePhoneChatBuilder';

export default function TabSecurity() {
  const {
    coreState,
    megaClueState,
    securityState,
    setSecurityState,
    phoneState,
    setPhoneState,
    editorState,
    setEditorState,
    setActiveTab,
  } = useClueModal();

  const isMegaLocked = securityState.isLocked && coreState.evidenceType === 'mega_clue';

  return (
    <div className="ccm-tab-stack">
      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            <Lock size={17} /> SEGURANÇA DA EVIDÊNCIA
          </h3>
        </div>

        <label className="ccm-toggle-row">
          <span className="ccm-toggle-text">
            <span className="ccm-toggle-title">Bloquear Pista com Senha</span>
          </span>
          <input
            type="checkbox"
            className="ccm-checkbox-input"
            checked={securityState.isLocked}
            onChange={(e) => setSecurityState((s) => ({ ...s, isLocked: e.target.checked }))}
          />
        </label>

        {securityState.isLocked && !isMegaLocked && (
          <div className="ccm-field">
            <label className="ccm-label">Senha de Desbloqueio Principal *</label>
            <input
              type="text"
              className="ccm-input ccm-input-mono"
              value={securityState.lockPass}
              onChange={(e) => setSecurityState((s) => ({ ...s, lockPass: e.target.value }))}
              placeholder="Ex: 1234, ALFA-99..."
            />
          </div>
        )}

        {isMegaLocked && (
          <div className="ccm-list-stack">
            <label className="ccm-label">Senhas da Mega-Pista (Múltiplos Códigos)</label>
            {megaClueState.megaRequiredPuzzleIds.length === 0 ? (
              <div className="ccm-callout ccm-callout-warn">
                Selecione os quebra-cabeças necessários na aba "Tipos Especiais" para definir quantas senhas serão solicitadas.
              </div>
            ) : (
              <div className="ccm-grid-2">
                {megaClueState.megaRequiredPuzzleIds.map((id, idx) => (
                  <input
                    key={id || idx}
                    type="text"
                    className="ccm-input ccm-input-mono"
                    placeholder={`Senha ${idx + 1} (Ex: ALPHA-0${idx + 1})`}
                    value={securityState.lockPasses[idx] || ''}
                    onChange={(e) => {
                      const next = [...(securityState.lockPasses || [])];
                      next[idx] = e.target.value;
                      setSecurityState((s) => ({ ...s, lockPasses: next }));
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            <ShieldAlert size={17} /> CAMADAS ADICIONAIS (FIREWALL DE SINAL)
          </h3>
        </div>

        <div className="ccm-list-stack">
          <label className="ccm-toggle-row">
            <span className="ccm-toggle-text">
              <span className="ccm-toggle-title is-warn">
                Habilitar Firewall de Investigação (Criptografia de Sinal)
              </span>
            </span>
            <input
              type="checkbox"
              className="ccm-checkbox-input"
              checked={securityState.securityLayerEnabled}
              onChange={(e) => setSecurityState((s) => ({ ...s, securityLayerEnabled: e.target.checked }))}
            />
          </label>

          <label className="ccm-toggle-row">
            <span className="ccm-toggle-text">
              <span className="ccm-toggle-title">
                Ocultar prévia no tabuleiro (mostrar apenas ícone bloqueado)
              </span>
            </span>
            <input
              type="checkbox"
              className="ccm-checkbox-input"
              checked={securityState.hidePreviewOnBoard}
              onChange={(e) => setSecurityState((s) => ({ ...s, hidePreviewOnBoard: e.target.checked }))}
            />
          </label>
        </div>

        <div className="ccm-grid-2">
          <div className="ccm-field">
            <label className="ccm-label">Lógica de Revelação</label>
            <select
              className="ccm-input"
              value={securityState.revealLogicMode}
              onChange={(e) => setSecurityState((s) => ({ ...s, revealLogicMode: e.target.value as any }))}
            >
              <option value="always_visible">Sempre visível (pista de percepção)</option>
              <option value="aligned_only">Apenas ao alinhar sliders (Glitch)</option>
              <option value="aligned_keyword">Sliders + senha manual</option>
            </select>
          </div>

          <div className="ccm-field">
            <label className="ccm-label">Alvos do Sinal Glitch</label>
            <div className="ccm-grid-2">
              <label className="ccm-toggle-row">
                <span className="ccm-toggle-title">Imagem/Vídeo</span>
                <input
                  type="checkbox"
                  className="ccm-checkbox-input"
                  checked={securityState.signalTargets.visual}
                  onChange={(e) =>
                    setSecurityState((s) => ({
                      ...s,
                      signalTargets: { ...s.signalTargets, visual: e.target.checked },
                    }))
                  }
                />
              </label>
              <label className="ccm-toggle-row">
                <span className="ccm-toggle-title">Áudio</span>
                <input
                  type="checkbox"
                  className="ccm-checkbox-input"
                  checked={securityState.signalTargets.audio}
                  onChange={(e) =>
                    setSecurityState((s) => ({
                      ...s,
                      signalTargets: { ...s.signalTargets, audio: e.target.checked },
                    }))
                  }
                />
              </label>
            </div>
          </div>
        </div>
      </section>

      <div className="ccm-callout ccm-callout-warn">
        <div className="ccm-callout-left">
          <Flame size={16} />
          <span>
            A configuração de Tinta Térmica fica centralizada na aba <strong>Visual</strong>.
          </span>
        </div>
        <button type="button" className="ccm-btn ccm-btn-sm" onClick={() => setActiveTab('visual')}>
          Ir para Aba Visual
        </button>
      </div>

      <section className="ccm-section ccm-section-accent">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            <Smartphone size={17} /> SISTEMA FAKE / TELEFONE
            <span data-tooltip-id="phone-tip" className="ccm-help-icon">
              <Info size={15} />
            </span>
          </h3>
          <Tooltip id="phone-tip" className="cyber-tooltip ccm-tooltip">
            Configurações de bloqueio e mensagens simuladas para celulares falsos.
          </Tooltip>
        </div>

        <label className="ccm-toggle-row">
          <span className="ccm-toggle-text">
            <span className="ccm-toggle-title">Bloquear Telefone Fake (Keypad/Pattern)</span>
          </span>
          <input
            type="checkbox"
            className="ccm-checkbox-input"
            checked={phoneState.hasKeypad}
            onChange={(e) => setPhoneState((s) => ({ ...s, hasKeypad: e.target.checked }))}
          />
        </label>

        {phoneState.hasKeypad && (
          <div className="ccm-list-stack">
            <div className="ccm-grid-2">
              <div className="ccm-field">
                <label className="ccm-label">Senha do Telefone *</label>
                <input
                  type="text"
                  className="ccm-input ccm-input-mono"
                  value={phoneState.password}
                  onChange={(e) => setPhoneState((s) => ({ ...s, password: e.target.value }))}
                  maxLength={phoneState.lockType === 'pin' ? 6 : undefined}
                  placeholder={phoneState.lockType === 'pin' ? 'PIN Numérico' : 'Padrão Numérico (ex: 1-2-3-6-9)'}
                />
              </div>

              <div className="ccm-field">
                <label className="ccm-label">Tipo de Bloqueio</label>
                <select
                  className="ccm-input"
                  value={phoneState.lockType}
                  onChange={(e) => setPhoneState((s) => ({ ...s, lockType: e.target.value as any }))}
                >
                  <option value="pin">PIN (numérico)</option>
                  <option value="pattern">Padrão (3x3)</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              className="ccm-btn"
              onClick={() => setEditorState((s) => ({ ...s, showKeypadEditor: !s.showKeypadEditor }))}
            >
              Configurar Visuamente (Keypad Editor)
            </button>

            {editorState.showKeypadEditor && (
              <div className="ccm-preview-box">
                <div className="ccm-note">Preview e Edição do Keypad:</div>
                {phoneState.lockType === 'pattern' ? (
                  <div className="ccm-list-stack">
                    <div className="ccm-note">
                      Modo editor de Padrão — clique nos pontos e pressione <strong>OK</strong>
                    </div>
                    <PatternLock
                      code={phoneState.password || null}
                      allowEdit={true}
                      onInput={(value) => setPhoneState((s) => ({ ...s, password: String(value || '') }))}
                      onUnlock={() => setEditorState((s) => ({ ...s, showKeypadEditor: false }))}
                    />
                    <div className="ccm-btn-row">
                      <button type="button" className="ccm-btn" onClick={() => setPhoneState((s) => ({ ...s, password: '' }))}>
                        Limpar Padrão
                      </button>
                      <button type="button" className="ccm-btn ccm-btn-primary" onClick={() => setEditorState((s) => ({ ...s, showKeypadEditor: false }))}>
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="ccm-list-stack">
                    <NumericKeypad
                      code={phoneState.password}
                      onInput={(value) => setPhoneState((s) => ({ ...s, password: value }))}
                      onUnlock={() => setEditorState((s) => ({ ...s, showKeypadEditor: false }))}
                    />
                    <button
                      type="button"
                      className="ccm-btn ccm-btn-primary ccm-btn-block"
                      onClick={() => setEditorState((s) => ({ ...s, showKeypadEditor: false }))}
                    >
                      Concluir
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <FakePhoneChatBuilder />
      </section>
    </div>
  );
}
