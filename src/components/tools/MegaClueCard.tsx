import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchCards, updateInvestigationCard } from '../../api/investigations';
import CodePromptModal, { CodePromptResult } from '../modals/CodePromptModal';
import './MegaClueCard.css';

interface Props {
  cardId: string;
  investigationId: string;
  title: string;
  description: string;
  imageUrl?: string;
  requiredCodes: number;
  finalTruthText?: string;
  collectedCodes?: string[];
  metadata?: any;
  onClose?: () => void;
  onRefresh?: () => void;
}

export default function MegaClueCard({
  cardId,
  investigationId,
  title,
  description,
  imageUrl,
  requiredCodes,
  finalTruthText,
  collectedCodes: collectedCodesProp = [],
  metadata,
  onClose,
  onRefresh,
}: Props) {
  const safeMetadata = useMemo(() => {
    if (!metadata) return {} as any;
    if (typeof metadata === 'string') {
      try {
        return JSON.parse(metadata);
      } catch (err) {
        console.error('Falha ao parsear metadata da mega-pista', err);
        return {} as any;
      }
    }
    return metadata;
  }, [metadata]);

  const initialCollected = (collectedCodesProp || safeMetadata?.mega_clue?.collected_codes || []).map((c) =>
    String(c).toUpperCase()
  );
  const [collectedCodes, setCollectedCodes] = useState<string[]>(initialCollected);
  const [unlocked, setUnlocked] = useState<boolean>(
    initialCollected.length >= requiredCodes || Boolean(safeMetadata?.mega_clue?.unlocked)
  );
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [validCodes, setValidCodes] = useState<string[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);

  useEffect(() => {
    const normalized = (collectedCodesProp || safeMetadata?.mega_clue?.collected_codes || []).map((c) =>
      String(c).toUpperCase()
    );
    setCollectedCodes(normalized);
    setUnlocked(normalized.length >= requiredCodes || Boolean(safeMetadata?.mega_clue?.unlocked));
  }, [collectedCodesProp, safeMetadata, requiredCodes]);

  const loadValidRewardCodes = useCallback(async () => {
    setLoadingCodes(true);
    try {
      const cards = await fetchCards(investigationId);
      const rewards = (cards || [])
        .filter((c: any) => c.type === 'glitch_puzzle')
        .map((c: any) => {
          try {
            const meta = c.metadata || (c.data && c.data.metadata) || {};
            return meta?.glitch_puzzle?.reward_code;
          } catch (err) {
            console.error('Erro ao ler metadata do puzzle', err);
            return null;
          }
        })
        .filter(Boolean)
        .map((c: any) => String(c).toUpperCase());

      setValidCodes(Array.from(new Set(rewards)));
    } catch (err) {
      console.error('Erro ao buscar códigos válidos', err);
    } finally {
      setLoadingCodes(false);
    }
  }, [investigationId]);

  useEffect(() => {
    loadValidRewardCodes();
  }, [loadValidRewardCodes]);

  useEffect(() => {
    if (!unlocked && !hasPrompted) {
      setShowPrompt(true);
      setHasPrompted(true);
    }
  }, [unlocked, hasPrompted]);

  const handleSubmitCode = async (submittedCode: string): Promise<CodePromptResult> => {
    const code = submittedCode.trim().toUpperCase();
    setFeedback(null);

    if (!code) {
      const message = '✗ DIGITE UM CÓDIGO VÁLIDO';
      setFeedback({ type: 'error', message });
      return { success: false, message };
    }

    if (collectedCodes.includes(code)) {
      const message = '✗ CÓDIGO JÁ UTILIZADO';
      setFeedback({ type: 'error', message });
      return { success: false, message };
    }

    if (validCodes.length > 0 && !validCodes.includes(code)) {
      const message = '✗ CÓDIGO INVÁLIDO';
      setFeedback({ type: 'error', message });
      return { success: false, message };
    }

    setSubmitting(true);

    try {
      const megaMeta = safeMetadata?.mega_clue || {};
      const newCollectedCodes = [...collectedCodes, code];
      const nowUnlocked = newCollectedCodes.length >= requiredCodes;

      const updatedMetadata = {
        ...(safeMetadata || {}),
        mega_clue: {
          ...megaMeta,
          final_truth_text: megaMeta.final_truth_text ?? finalTruthText,
          required_code_count: megaMeta.required_code_count ?? requiredCodes,
          collected_codes: newCollectedCodes,
          unlocked: nowUnlocked,
          unlocked_at: nowUnlocked ? new Date().toISOString() : megaMeta.unlocked_at,
        },
      };

      await updateInvestigationCard(cardId, { metadata: updatedMetadata });

      setCollectedCodes(newCollectedCodes);
      setUnlocked(nowUnlocked);
      const successMessage = nowUnlocked
        ? `✓ DESBLOQUEIO COMPLETO! (${newCollectedCodes.length}/${requiredCodes})`
        : `✓ CÓDIGO ACEITO! PROGRESSO: ${newCollectedCodes.length}/${requiredCodes}`;
      setFeedback({ type: 'success', message: successMessage });

      if (nowUnlocked) {
        setShowPrompt(false);
      }

      if (onRefresh) {
        await onRefresh();
      }

      return { success: true, message: successMessage, closeModal: nowUnlocked };
    } catch (err) {
      console.error('Erro ao submeter código:', err);
      const message = '✗ ERRO AO PROCESSAR CÓDIGO';
      setFeedback({ type: 'error', message });
      return { success: false, message };
    } finally {
      setSubmitting(false);
    }
  };

  const missingCodes = Math.max(0, requiredCodes - collectedCodes.length);
  const progressPct = requiredCodes > 0 ? Math.min(100, (collectedCodes.length / requiredCodes) * 100) : 0;

  const renderPrompt = () =>
    showPrompt && (
      <CodePromptModal
        onSubmit={handleSubmitCode}
        onClose={() => setShowPrompt(false)}
        title="ARQUIVO CRIPTOGRAFADO"
        description={`CÓDIGOS COLETADOS: ${collectedCodes.length}/${requiredCodes}. Digite um código de recompensa para continuar.`}
      />
    );

  if (unlocked) {
    return (
      <>
        <div className="mega-clue-card">
          <div className="mega-header">
            <h2>{title}</h2>
            {onClose && (
              <button className="close-btn" onClick={onClose}>✖</button>
            )}
          </div>

          <div className="mega-content unlocked">
            <div className="unlock-banner">
              <div className="unlock-icon">🔓</div>
              <div className="unlock-text">MEGA-PISTA DESBLOQUEADA</div>
            </div>

            <div className="truth-intro">
              <div className="intro-label">ARQUIVO REVELADO</div>
              <div className="intro-text">Todos os códigos foram validados. A verdade está acessível.</div>
            </div>

            {imageUrl && (
              <div className="truth-image">
                <img src={imageUrl} alt="Verdade Final" />
                <div className="truth-label">A VERDADE REVELADA</div>
              </div>
            )}

            <div className="truth-box">
              <h3>📖 A VERDADE COMPLETA</h3>
              <div className="truth-content">{finalTruthText || description}</div>
            </div>

            <div className="codes-collected">
              <h4>🎯 CÓDIGOS DESBLOQUEADOS:</h4>
              <div className="codes-list">
                {collectedCodes.map((code, idx) => (
                  <div key={idx} className="code-badge">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            {onClose && (
              <button className="btn btn-close" onClick={onClose}>
                FECHAR
              </button>
            )}
          </div>
        </div>

        {renderPrompt()}
      </>
    );
  }

  return (
    <>
      <div className="mega-clue-card">
        <div className="mega-header">
          <h2>{title}</h2>
          {onClose && (
            <button className="close-btn" onClick={onClose}>✖</button>
          )}
        </div>

        <div className="mega-content locked">
          <div className="lock-banner">
            <div className="lock-icon">🔐</div>
            <div className="lock-text">MEGA-PISTA PROTEGIDA</div>
            <div className="lock-boot-lines">
              <div className="boot-line">&gt; FIREWALL: ATIVO</div>
              <div className="boot-line">&gt; CRIPTOGRAFIA: AES-256</div>
              <div className="boot-line">&gt; CHAVES DE ACESSO REQUERIDAS</div>
              <div className="boot-line error">&gt; ACESSO NEGADO</div>
            </div>
          </div>

          <div className="locked-description">
            <p>{description}</p>
            <p className="locked-progress-text">
              ARQUIVO CRIPTOGRAFADO — CÓDIGOS COLETADOS: {collectedCodes.length}/{requiredCodes}
            </p>
          </div>

          <div className="progress-section">
            <h3>DESBLOQUEIO REQUER TODOS OS CÓDIGOS:</h3>

            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progressPct}%` }}></div>
            </div>

            <div className="progress-text">
              <strong>{collectedCodes.length}</strong> de <strong>{requiredCodes}</strong> códigos coletados
            </div>
          </div>

          <div className="codes-needed">
            <h4>CÓDIGOS COLETADOS:</h4>
            <div className="codes-grid">
              {Array.from({ length: requiredCodes }).map((_, idx) => {
                const code = collectedCodes[idx];
                return (
                  <div key={idx} className={`code-slot ${code ? 'unlocked' : 'locked'}`}>
                    {code ? (
                      <>
                        <div className="slot-icon">✓</div>
                        <div className="slot-code">{code}</div>
                      </>
                    ) : (
                      <>
                        <div className="slot-icon">?</div>
                        <div className="slot-text">Falta</div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="code-submit-section">
            <h4>📥 SUBMETER CÓDIGO:</h4>

            {feedback && <div className={`feedback-message ${feedback.type}`}>{feedback.message}</div>}

            <button
              className="btn btn-submit-code"
              data-text="INSERIR CÓDIGO"
              onClick={() => setShowPrompt(true)}
              disabled={submitting || loadingCodes}
            >
              {submitting ? 'VALIDANDO...' : 'INSERIR CÓDIGO'}
            </button>

            <small className="input-hint">
              {loadingCodes
                ? 'Carregando códigos válidos...'
                : 'Resolva os glitch puzzles e insira os códigos de recompensa aqui.'}
            </small>
          </div>

          {collectedCodes.length < requiredCodes && (
            <div className="missing-message">
              Você ainda precisa encontrar <strong>{missingCodes}</strong> código{missingCodes !== 1 ? 's' : ''} para desbloquear a verdade...
            </div>
          )}

          {onClose && (
            <button className="btn btn-close" onClick={onClose}>
              FECHAR
            </button>
          )}
        </div>
      </div>

      {renderPrompt()}
    </>
  );
}
