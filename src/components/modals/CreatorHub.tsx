import React, { useState, useEffect } from 'react';
import { fetchCardsForInvestigation } from '../../api/investigations';
import { supabase } from '../../supabaseClient';
import CreateClueModal_Refactored from './CreateClueModal_Refactored';
import './CreatorHub.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  investigationId: string;
  onOpenLegacyModal: () => void;
  onPuzzleCreated: () => void;
}

interface CardSummary {
  id: string;
  title: string;
  type: string;
  rewardCode?: string;
  requiredPuzzleIds?: string[];
  description: string;
  is_hidden?: boolean;
  discovery_code?: string;
}

export default function CreatorHub({ isOpen, onClose, investigationId, onOpenLegacyModal, onPuzzleCreated }: Props) {
  const [cards, setCards] = useState<CardSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<'refactored' | 'legacy'>('refactored');
  const [createHiddenClue, setCreateHiddenClue] = useState(false);
  const [showCommonClueModal, setShowCommonClueModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CardSummary | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCards();
      window.dispatchEvent(new Event('modal-opened'));
    } else {
      window.dispatchEvent(new Event('modal-closed'));
    }
  }, [isOpen, investigationId]);

  const loadCards = async () => {
    console.log('CreatorHub: Loading cards for investigation:', investigationId);
    setLoading(true);
    try {
      const data = await fetchCardsForInvestigation(investigationId);
      console.log('CreatorHub: Raw data from API:', data);
      
      const summaries: CardSummary[] = data.map((card: any) => {
        let summary: CardSummary = {
          id: card.id,
          title: card.title || 'Sem título',
          type: card.type || 'unknown',
          description: card.description_public || card.description_hidden || '',
          is_hidden: card.is_hidden || false,
          discovery_code: card.discovery_code,
        };
        console.log(`CreatorHub: Card ${card.id} - is_hidden: ${card.is_hidden}`);

        // Extrair informações específicas baseadas no tipo
        if (card.type === 'glitch_puzzle' && card.metadata?.glitch_puzzle) {
          summary.rewardCode = card.metadata.glitch_puzzle.reward_code;
        } else if (card.type === 'mega_clue' && card.metadata?.mega_clue) {
          // Nova estrutura: usar required_puzzle_ids se disponível, senão usar required_code_count (compatibilidade)
          summary.requiredPuzzleIds = card.metadata.mega_clue.required_puzzle_ids || [];
        }

        return summary;
      });

      setCards(summaries);
    } catch (err) {
      console.error('Erro ao carregar pistas', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCard = (card: CardSummary) => {
    setEditingCard(card);
    setShowCreatorModal(true);
    onClose(); // Close CreatorHub when opening modal
  };

  const handleToggleHidden = async (card: CardSummary) => {
    const newHiddenStatus = !card.is_hidden;

    console.log('CreatorHub: Toggling hidden status for card:', card.id, 'from', card.is_hidden, 'to', newHiddenStatus);

    try {
      // Use Supabase client instead of direct fetch for better reliability
      const { data, error } = await supabase
        .from('investigation_cards')
        .update({ is_hidden: newHiddenStatus })
        .eq('id', card.id)
        .select();

      if (error) {
        console.error('CreatorHub: Supabase update error:', error);
        throw error;
      }

      console.log('CreatorHub: Supabase update success:', data);

      // Update local state immediately instead of reloading all cards
      setCards(prev => prev.map(c =>
        c.id === card.id ? { ...c, is_hidden: newHiddenStatus } : c
      ));

      console.log('CreatorHub: Local state updated successfully');
    } catch (err) {
      console.error('CreatorHub: Error toggling hidden status:', err);
      alert('Erro ao alterar status da pista: ' + err.message);
    }
  };

  const handleCommonClueClick = () => {
    setShowCommonClueModal(true);
  };

  const handleClose = () => {
    // Se o modal de puzzle unificado estiver aberto, feche-o primeiro.
    if (showCreatorModal) {
      setShowCreatorModal(false);
      return;
    }
    // Se o modal de pista comum estiver aberto, feche-o primeiro.
    if (showCommonClueModal) {
      setShowCommonClueModal(false);
      return;
    }
    // Se nenhum modal secundário estiver aberto, feche o Hub principal.
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Só fechar se clicar diretamente no overlay (fundo), não em elementos internos
    if (e.target === e.currentTarget) {
      // Fechar modais secundários primeiro
      if (showCreatorModal) {
        setShowCreatorModal(false);
      } else if (showCommonClueModal) {
        setShowCommonClueModal(false);
      } else {
        onClose();
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'glitch_puzzle':
        return '🧩';
      case 'mega_clue':
        return '🔐';
      case 'video':
        return '📹';
      case 'audio':
        return '🎵';
      case 'image':
        return '🖼';
      case 'text':
        return '📄';
      default:
        return '📌';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'glitch_puzzle':
        return 'Quebra-cabeça de Glitch';
      case 'mega_clue':
        return 'Mega-Pista (Verdade Final)';
      case 'video':
        return 'Vídeo';
      case 'audio':
        return 'Áudio';
      case 'image':
        return 'Imagem';
      case 'text':
        return 'Texto';
      default:
        return 'Desconhecido';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="creator-hub-overlay" onClick={handleOverlayClick}>
        <div className="creator-hub-modal" onClick={e => e.stopPropagation()}>
          <div className="creator-hub-header">
            <h2>⚙️ HUB DE CRIAÇÃO DE INVESTIGAÇÃO</h2>
            <button className="close-btn" onClick={handleClose}>×</button>
          </div>

          <div className="creator-hub-body">
            {/* Botões de criação */}
            <div className="create-section">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className={`btn-create-new${selectedCreator === 'refactored' ? ' selected' : ''}`}
                    onClick={() => setSelectedCreator('refactored')}
                  >
                    🧩 REFACTORADO
                  </button>
                  <button
                    className={`btn-create-new${selectedCreator === 'legacy' ? ' selected' : ''}`}
                    onClick={() => setSelectedCreator('legacy')}
                  >
                    📝 LEGADO
                  </button>
                </div>

                <button
                  className="btn-create-new primary"
                  onClick={() => {
                    if (selectedCreator === 'refactored') {
                      console.log('Opening refactored modal');
                      setCreateHiddenClue(false);
                      setEditingCard(null);
                      setShowCreatorModal(true);
                      onClose(); // Close CreatorHub when opening modal
                    } else {
                      console.log('Opening legacy modal');
                      onOpenLegacyModal();
                      onClose(); // Close CreatorHub when opening modal
                    }
                  }}
                >
                  ✨ CRIAR NOVA PISTA
                </button>
              </div>
            </div>

            {/* Lista de pistas existentes */}
            <div className="cards-list-section">
              <h3>📋 PISTAS EXISTENTES ({cards.filter(c => !c.is_hidden).length})</h3>
              
              {loading ? (
                <div className="loading-state">
                  <p>Carregando pistas...</p>
                </div>
              ) : cards.filter(c => !c.is_hidden).length === 0 ? (
                <div className="empty-state">
                  <p>Nenhuma pista visível criada ainda.</p>
                  <p>Clique em "Criar Nova Pista" para começar.</p>
                </div>
              ) : (
                <div className="cards-grid">
                  {cards.filter(c => !c.is_hidden).map(card => (
                    <div key={card.id} className="card-summary">
                      <div className="card-summary-header">
                        <span className="card-icon">{getTypeIcon(card.type)}</span>
                        <div className="card-title-section">
                          <h4>{card.title}</h4>
                          <span className="card-type">{getTypeLabel(card.type)}</span>
                        </div>
                      </div>
                      
                      <div className="card-summary-body">
                        {card.description && (
                          <p className="card-description">
                            {card.description.substring(0, 80)}
                            {card.description.length > 80 ? '...' : ''}
                          </p>
                        )}
                        
                        {card.rewardCode && (
                          <div className="card-meta">
                            <span className="meta-label">🎁 Recompensa:</span>
                            <code className="reward-code">{card.rewardCode}</code>
                          </div>
                        )}
                        
                        {card.requiredPuzzleIds && card.requiredPuzzleIds.length > 0 && (
                          <div className="card-meta">
                            <span className="meta-label">🔒 Requer:</span>
                            <span className="required-count">{card.requiredPuzzleIds.length} quebra-cabeça{card.requiredPuzzleIds.length !== 1 ? 's' : ''} vinculado{card.requiredPuzzleIds.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>

                      <div className="card-actions">
                        <button 
                          className="btn-action btn-edit" 
                          onClick={() => handleEditCard(card)}
                          title="Editar pista"
                        >
                          ✏️
                        </button>
                        <button 
                          className={`btn-action ${card.is_hidden ? 'btn-show' : 'btn-hide'}`} 
                          onClick={() => handleToggleHidden(card)}
                          title={card.is_hidden ? 'Tornar visível' : 'Tornar oculta'}
                        >
                          {card.is_hidden ? '👁️' : '👻'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pistas Ocultas */}
              {cards.filter(c => c.is_hidden).length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h3>👁️ PISTAS OCULTAS ({cards.filter(c => c.is_hidden).length})</h3>
                  <div className="cards-grid">
                    {cards.filter(c => c.is_hidden).map(card => (
                      <div key={card.id} className="card-summary hidden-clue">
                        <div className="card-summary-header">
                          <span className="card-icon">👻</span>
                          <div className="card-title-section">
                            <h4>{card.title}</h4>
                            <span className="card-type">OCULTA - {getTypeLabel(card.type)}</span>
                          </div>
                        </div>
                        
                        <div className="card-summary-body">
                          {card.discovery_code && (
                            <div className="card-meta">
                              <span className="meta-label">🔍 Código:</span>
                              <code className="reward-code">{card.discovery_code}</code>
                            </div>
                          )}
                          
                          {card.description && (
                            <p className="card-description">
                              {card.description.substring(0, 80)}
                              {card.description.length > 80 ? '...' : ''}
                            </p>
                          )}
                        </div>

                        <div className="card-actions">
                          <button 
                            className="btn-action btn-edit" 
                            onClick={() => handleEditCard(card)}
                            title="Editar pista"
                          >
                            ✏️
                          </button>
                          <button 
                            className={`btn-action ${card.is_hidden ? 'btn-show' : 'btn-hide'}`} 
                            onClick={() => handleToggleHidden(card)}
                            title={card.is_hidden ? 'Tornar visível' : 'Tornar oculta'}
                          >
                            {card.is_hidden ? '👁️' : '👻'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Informações úteis */}
            <div className="hub-info">
              <h4>💡 DICAS RÁPIDAS</h4>
              <ul>
                <li><strong>Quebra-cabeças de Glitch:</strong> Fornecem códigos de recompensa quando resolvidos</li>
                <li><strong>Mega-Pista:</strong> Você vincula os puzzles específicos que devem ser resolvidos para desbloqueá-la</li>
                <li><strong>Sistema Inteligente:</strong> A Mega-Pista só aceita códigos dos puzzles que você vinculou a ela</li>
                <li><strong>Ordem Recomendada:</strong> Crie primeiro todos os Glitch Puzzles, depois crie a Mega-Pista vinculando-os</li>
              </ul>
            </div>
          </div>

          <div className="creator-hub-footer">
            <button 
              className="btn btn-secondary" 
              onClick={handleClose}
            >
              FECHAR
            </button>
          </div>
        </div>
      </div>

      {/* Modal de criação unificado - CreateClueModal agora suporta tudo */}
      {showCreatorModal && (
        <CreateClueModal_Refactored
          isOpen={showCreatorModal}
          onClose={() => {
            setShowCreatorModal(false);
            setEditingCard(null);
          }}
          investigationId={investigationId}
          onSaved={(card) => {
            loadCards(); // Recarregar a lista
            onPuzzleCreated(); // Notificar o componente pai
            setShowCreatorModal(false);
            setEditingCard(null);
          }}
          defaultHidden={createHiddenClue}
          existingCard={editingCard}
        />
      )}
    </>
  );
}
