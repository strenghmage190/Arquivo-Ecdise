import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchCards, updateInvestigationCard } from '../../api/investigations';
import CodePromptModal, { CodePromptResult } from '../modals/CodePromptModal';
import { validateMegaClueData } from '../../utils/validationSchemas';
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
  isGameMaster?: boolean;
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
  isGameMaster = false,
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

  const requiredPuzzleIds = useMemo(() => {
    const ids = safeMetadata?.mega_clue?.required_puzzle_ids;
    if (!Array.isArray(ids)) return [] as string[];
    return ids.map((id: any) => String(id));
  }, [safeMetadata]);

  const initialSolvedIds = useMemo(() => {
    const ids = safeMetadata?.mega_clue?.solved_puzzle_ids;
    if (!Array.isArray(ids)) return [] as string[];
    return ids.map((id: any) => String(id));
  }, [safeMetadata]);

  const requiredTotal = requiredPuzzleIds.length || requiredCodes;

  const initialCollected = (collectedCodesProp || safeMetadata?.mega_clue?.collected_codes || []).map((c) =>
    String(c).toUpperCase()
  );
  const [collectedCodes, setCollectedCodes] = useState<string[]>(initialCollected);
  const [solvedIds, setSolvedIds] = useState<string[]>(initialSolvedIds);
  const [unlocked, setUnlocked] = useState<boolean>(
    initialCollected.length >= requiredTotal || initialSolvedIds.length >= requiredTotal || Boolean(safeMetadata?.mega_clue?.unlocked)
  );
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [validCodes, setValidCodes] = useState<string[]>([]);
  const [codeToPuzzleId, setCodeToPuzzleId] = useState<Record<string, string>>({});
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);

  // ✅ EDIÇÃO DE MEGA-PISTA - Estados de Edição
  const [isEditing, setIsEditing] = useState(false);
  const [editedMetadata, setEditedMetadata] = useState<any>({
    finalTruthText: finalTruthText || '',
    requiredPuzzleIds: requiredPuzzleIds || [],
  });

  useEffect(() => {
    const normalized = (collectedCodesProp || safeMetadata?.mega_clue?.collected_codes || []).map((c) =>
      String(c).toUpperCase()
    );
    setCollectedCodes(normalized);
    setSolvedIds(initialSolvedIds);
    setUnlocked(
      normalized.length >= requiredTotal ||
      initialSolvedIds.length >= requiredTotal ||
      Boolean(safeMetadata?.mega_clue?.unlocked)
    );
  }, [collectedCodesProp, safeMetadata, requiredTotal, initialSolvedIds]);

  const loadValidRewardCodes = useCallback(async () => {
    setLoadingCodes(true);
    try {
      const cards = await fetchCards(investigationId);
      const rewards: string[] = [];
      const codeMap: Record<string, string> = {};

      (cards || [])
        .filter((c: any) => c.type === 'glitch_puzzle')
        .forEach((c: any) => {
          try {
            const meta = c.metadata || (c.data && c.data.metadata) || {};
            const reward = meta?.glitch_puzzle?.reward_code;
            if (reward) {
              const upper = String(reward).toUpperCase();
              rewards.push(upper);
              codeMap[upper] = String(c.id);
            }
          } catch (err) {
            console.error('Erro ao ler metadata do puzzle', err);
          }
        });

      setValidCodes(Array.from(new Set(rewards)));
      setCodeToPuzzleId(codeMap);
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
      const matchedPuzzleId = codeToPuzzleId[code];
      const enforceIds = requiredPuzzleIds.length > 0;
      if (enforceIds && (!matchedPuzzleId || !requiredPuzzleIds.includes(matchedPuzzleId))) {
        const message = '✗ CÓDIGO NÃO PERTENCE À LISTA DE QUEBRA-CABEÇAS EXIGIDOS';
        setFeedback({ type: 'error', message });
        return { success: false, message };
      }

      const newCollectedCodes = Array.from(new Set([...collectedCodes, code]));
      const nextSolvedIds = matchedPuzzleId
        ? Array.from(new Set([...(megaMeta.solved_puzzle_ids || []).map((id: any) => String(id)), matchedPuzzleId]))
        : (megaMeta.solved_puzzle_ids || []).map((id: any) => String(id));
      const progressCount = Math.max(newCollectedCodes.length, nextSolvedIds.length);
      const totalRequired = requiredTotal || newCollectedCodes.length;
      const nowUnlocked = totalRequired > 0 ? progressCount >= totalRequired : false;

      const updatedMetadata = {
        ...(safeMetadata || {}),
        mega_clue: {
          ...megaMeta,
          final_truth_text: megaMeta.final_truth_text ?? finalTruthText,
          required_code_count: totalRequired,
          required_puzzle_ids: requiredPuzzleIds,
          solved_puzzle_ids: nextSolvedIds,
          collected_codes: newCollectedCodes,
          unlocked: nowUnlocked,
          unlocked_at: nowUnlocked ? new Date().toISOString() : megaMeta.unlocked_at,
        },
      };

      await updateInvestigationCard(cardId, { metadata: updatedMetadata });

      setCollectedCodes(newCollectedCodes);
      setSolvedIds(nextSolvedIds);
      setUnlocked(nowUnlocked);
      const successMessage = nowUnlocked
        ? `✓ DESBLOQUEIO COMPLETO! (${progressCount}/${totalRequired || progressCount})`
        : `✓ CÓDIGO ACEITO! PROGRESSO: ${progressCount}/${totalRequired || progressCount}`;
      setFeedback({ type: 'success', message: successMessage });

      if (nowUnlocked) {
        setShowPrompt(false);
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

  // ✅ EDIÇÃO DE MEGA-PISTA - Handler para atualizar campos editados
  const handleEditChange = (field: string, value: any) => {
    setEditedMetadata((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ✅ EDIÇÃO DE MEGA-PISTA - Handler para adicionar/remover puzzle
  const handleTogglePuzzle = (puzzleId: string) => {
    setEditedMetadata((prev: any) => {
      const currentIds = prev.requiredPuzzleIds || [];
      if (currentIds.includes(puzzleId)) {
        return {
          ...prev,
          requiredPuzzleIds: currentIds.filter((id: string) => id !== puzzleId),
        };
      } else {
        return {
          ...prev,
          requiredPuzzleIds: [...currentIds, puzzleId],
        };
      }
    });
  };

  // ✅ EDIÇÃO DE MEGA-PISTA - Handler para salvar mudanças
  const handleSaveChanges = async () => {
    setSubmitting(true);
    try {
      // Preparar dados para validação
      const megaClueData = {
        final_truth_text: editedMetadata.finalTruthText,
        required_puzzle_ids: editedMetadata.requiredPuzzleIds || [],
      };

      // ✅ Validação com Zod
      const validation = validateMegaClueData(megaClueData);
      if (!validation.success) {
        const errorMsg = (validation.errors || []).join('\n');
        alert(`❌ Erro de validação:\n${errorMsg}`);
        setSubmitting(false);
        return;
      }

      const updates = {
        metadata: {
          mega_clue: {
            ...safeMetadata.mega_clue,
            final_truth_text: editedMetadata.finalTruthText,
            required_puzzle_ids: editedMetadata.requiredPuzzleIds || [],
          },
        },
      };

      // ✅ Chamada Supabase para atualizar o card
      await updateInvestigationCard(cardId, updates);

      console.log('📝 Mudanças salvas (Mega-Pista):', updates);
      alert('✅ Configurações da Mega-Pista salvas com sucesso!');
      setIsEditing(false);
      onRefresh?.();
    } catch (err) {
      console.error('Erro ao salvar mudanças da Mega-Pista:', err);
      alert('❌ Erro ao salvar mudanças. Veja o console.');
    } finally {
      setSubmitting(false);
    }
  };

  const progressCount = Math.max(collectedCodes.length, solvedIds.length);
  const displayRequired = requiredTotal || progressCount || 1;
  const missingCodes = Math.max(0, displayRequired - progressCount);
  const progressPct = displayRequired > 0 ? Math.min(100, (progressCount / displayRequired) * 100) : 0;

  const renderPrompt = () =>
    showPrompt && (
      <CodePromptModal
        onSubmit={handleSubmitCode}
        onClose={() => setShowPrompt(false)}
        title="ARQUIVO CRIPTOGRAFADO"
        description={`CÓDIGOS COLETADOS: ${progressCount}/${displayRequired}. Digite um código de recompensa para continuar.`}
      />
    );

  if (unlocked) {
    return (
      <>
        <div className="mega-clue-card">
          <div className="mega-header">
            <h2>{title}</h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* ✅ Botão de Edição - Visível apenas para GMs */}
              {isGameMaster && (
                <button 
                  className="btn-edit" 
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    background: 'rgba(0, 150, 136, 0.8)',
                    border: '1px solid rgba(0, 200, 180, 0.3)',
                    color: '#00ff88',
                    cursor: 'pointer',
                    borderRadius: '4px',
                  }}
                  title="Editar configurações da mega-pista"
                >
                  ⚙️ Editar
                </button>
              )}
              {onClose && (
                <button className="close-btn" onClick={onClose}>✖</button>
              )}
            </div>
          </div>

          <div className="mega-content unlocked">
            {/* ✅ MODO DE EDIÇÃO - Renderizado quando isEditing === true */}
            {isEditing && (
              <div style={{
                background: 'rgba(0, 150, 136, 0.05)',
                border: '2px solid rgba(0, 200, 180, 0.3)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
              }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#00ff88' }}>⚙️ EDITAR MEGA-PISTA</h3>
                
                {/* Texto da Verdade Final */}
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#ccc', fontSize: '12px' }}>TEXTO DA VERDADE FINAL</h4>
                  <textarea
                    value={editedMetadata.finalTruthText}
                    onChange={(e) => handleEditChange('finalTruthText', e.target.value)}
                    placeholder="Digite o texto de verdade final (até 2000 caracteres)..."
                    maxLength={2000}
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      padding: '8px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(0,200,180,0.2)',
                      color: '#0f0',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      borderRadius: '4px',
                    }}
                  />
                  <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>
                    {editedMetadata.finalTruthText.length}/2000 caracteres
                  </small>
                </div>

                {/* Puzzles Necessários */}
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#ccc', fontSize: '12px' }}>PUZZLES NECESSÁRIOS</h4>
                  <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#aaa' }}>
                    Selecione quais puzzles de glitch devem ser resolvidos para desbloquear a verdade:
                  </p>
                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(0,200,180,0.2)',
                    borderRadius: '4px',
                    padding: '8px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}>
                    {requiredPuzzleIds.length === 0 ? (
                      <div style={{ color: '#666', fontSize: '11px', padding: '8px' }}>
                        Nenhum puzzle configurado ainda.
                      </div>
                    ) : (
                      requiredPuzzleIds.map((puzzleId: string) => (
                        <div key={puzzleId} style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px 0',
                          borderBottom: '1px solid rgba(0,200,180,0.1)',
                        }}>
                          <input
                            type="checkbox"
                            checked={editedMetadata.requiredPuzzleIds?.includes(puzzleId) || false}
                            onChange={() => handleTogglePuzzle(puzzleId)}
                            style={{ marginRight: '8px', cursor: 'pointer' }}
                          />
                          <label style={{ cursor: 'pointer', flex: 1, fontSize: '12px', color: '#0f0' }}>
                            Puzzle: {puzzleId}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Botões de Ação */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setIsEditing(false)}
                    style={{
                      padding: '8px 16px',
                      fontSize: '11px',
                      background: 'rgba(200, 50, 50, 0.8)',
                      border: '1px solid rgba(255, 100, 100, 0.3)',
                      color: '#fff',
                      cursor: 'pointer',
                      borderRadius: '4px',
                    }}
                    disabled={submitting}
                  >
                    ✕ Cancelar
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    style={{
                      padding: '8px 16px',
                      fontSize: '11px',
                      background: 'rgba(0, 150, 136, 0.8)',
                      border: '1px solid rgba(0, 200, 180, 0.3)',
                      color: '#00ff88',
                      cursor: 'pointer',
                      borderRadius: '4px',
                    }}
                    disabled={submitting}
                  >
                    💾 Salvar Mudanças
                  </button>
                </div>
              </div>
            )}

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
                <img src={imageUrl} alt="Verdade Final" loading="lazy" />
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
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* ✅ Botão de Edição - Visível apenas para GMs */}
            {isGameMaster && (
              <button 
                className="btn-edit" 
                onClick={() => setIsEditing(true)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  background: 'rgba(0, 150, 136, 0.8)',
                  border: '1px solid rgba(0, 200, 180, 0.3)',
                  color: '#00ff88',
                  cursor: 'pointer',
                  borderRadius: '4px',
                }}
                title="Editar configurações da mega-pista"
              >
                ⚙️ Editar
              </button>
            )}
            {onClose && (
              <button className="close-btn" onClick={onClose}>✖</button>
            )}
          </div>
        </div>

        <div className="mega-content locked">
          {/* ✅ MODO DE EDIÇÃO - Renderizado quando isEditing === true */}
          {isEditing && (
            <div style={{
              background: 'rgba(0, 150, 136, 0.05)',
              border: '2px solid rgba(0, 200, 180, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#00ff88' }}>⚙️ EDITAR MEGA-PISTA</h3>
              
              {/* Texto da Verdade Final */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#ccc', fontSize: '12px' }}>TEXTO DA VERDADE FINAL</h4>
                <textarea
                  value={editedMetadata.finalTruthText}
                  onChange={(e) => handleEditChange('finalTruthText', e.target.value)}
                  placeholder="Digite o texto de verdade final (até 2000 caracteres)..."
                  maxLength={2000}
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(0,200,180,0.2)',
                    color: '#0f0',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    borderRadius: '4px',
                  }}
                />
                <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>
                  {editedMetadata.finalTruthText.length}/2000 caracteres
                </small>
              </div>

              {/* Puzzles Necessários */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#ccc', fontSize: '12px' }}>PUZZLES NECESSÁRIOS</h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#aaa' }}>
                  Selecione quais puzzles de glitch devem ser resolvidos para desbloquear a verdade:
                </p>
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(0,200,180,0.2)',
                  borderRadius: '4px',
                  padding: '8px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}>
                  {requiredPuzzleIds.length === 0 ? (
                    <div style={{ color: '#666', fontSize: '11px', padding: '8px' }}>
                      Nenhum puzzle configurado ainda.
                    </div>
                  ) : (
                    requiredPuzzleIds.map((puzzleId: string) => (
                      <div key={puzzleId} style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px 0',
                        borderBottom: '1px solid rgba(0,200,180,0.1)',
                      }}>
                        <input
                          type="checkbox"
                          checked={editedMetadata.requiredPuzzleIds?.includes(puzzleId) || false}
                          onChange={() => handleTogglePuzzle(puzzleId)}
                          style={{ marginRight: '8px', cursor: 'pointer' }}
                        />
                        <label style={{ cursor: 'pointer', flex: 1, fontSize: '12px', color: '#0f0' }}>
                          Puzzle: {puzzleId}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Botões de Ação */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '11px',
                    background: 'rgba(200, 50, 50, 0.8)',
                    border: '1px solid rgba(255, 100, 100, 0.3)',
                    color: '#fff',
                    cursor: 'pointer',
                    borderRadius: '4px',
                  }}
                  disabled={submitting}
                >
                  ✕ Cancelar
                </button>
                <button
                  onClick={handleSaveChanges}
                  style={{
                    padding: '8px 16px',
                    fontSize: '11px',
                    background: 'rgba(0, 150, 136, 0.8)',
                    border: '1px solid rgba(0, 200, 180, 0.3)',
                    color: '#00ff88',
                    cursor: 'pointer',
                    borderRadius: '4px',
                  }}
                  disabled={submitting}
                >
                  💾 Salvar Mudanças
                </button>
              </div>
            </div>
          )}

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
              ARQUIVO CRIPTOGRAFADO — CÓDIGOS COLETADOS: {progressCount}/{displayRequired}
            </p>
          </div>

          <div className="progress-section">
            <h3>DESBLOQUEIO REQUER TODOS OS CÓDIGOS:</h3>

            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progressPct}%` }}></div>
            </div>

            <div className="progress-text">
              <strong>{progressCount}</strong> de <strong>{displayRequired}</strong> códigos coletados
            </div>
          </div>

          <div className="codes-needed">
            <h4>CÓDIGOS COLETADOS:</h4>
            <div className="codes-grid">
              {Array.from({ length: displayRequired }).map((_, idx) => {
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

          {progressCount < displayRequired && (
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
