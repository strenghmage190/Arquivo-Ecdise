import {
  Lock,
  Settings,
  Pen,
  Eye,
  EyeOff,
  Search,
  Lightbulb,
  Copy,
  Zap,
  FileText,
  Music,
  KeyRound,
  Smartphone,
  Sparkles,
  SlidersHorizontal,
  Puzzle,
  Video,
  Image as ImageIcon,
  Pin,
  Wrench,
  ClipboardList,
  Gift,
  ChevronUp,
  ChevronDown,
  LucideIcon,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';
import {
  fetchCardsForInvestigation,
  fetchInvestigationDetails,
  InvestigationCard,
} from '../../api/investigations';
import { supabase } from '../../supabaseClient';
import CreateClueModal from './CreateClueModal';
import GMToolkitPanel from './GMToolkitPanel';
import './CreatorHub.css';

type CreatorArchetype =
  | 'quick'
  | 'forensic_doc'
  | 'secret_audio'
  | 'puzzle_lock'
  | 'fake_phone'
  | 'mega_clue'
  | 'complete';

const ARCHETYPE_BUTTONS: Array<{ id: CreatorArchetype; label: string; icon: LucideIcon }> = [
  { id: 'quick', label: 'Pista Rápida', icon: Zap },
  { id: 'forensic_doc', label: 'Documento Forense', icon: FileText },
  { id: 'secret_audio', label: 'Áudio / Espectrograma', icon: Music },
  { id: 'puzzle_lock', label: 'Enigma / Senha', icon: KeyRound },
  { id: 'fake_phone', label: 'Celular Falso', icon: Smartphone },
  { id: 'mega_clue', label: 'Mega-Pista', icon: Sparkles },
  { id: 'complete', label: 'Avançado: Todas as 10 Abas', icon: SlidersHorizontal },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  investigationId: string;
  onOpenLegacyModal?: () => void;
  onPuzzleCreated: (card?: Record<string, any> | null) => void;
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
  fullCard: InvestigationCard;
}

export default function CreatorHub({
  isOpen,
  onClose,
  investigationId,
  onPuzzleCreated,
}: Props) {
  const [cards, setCards] = useState<CardSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [createHiddenClue, setCreateHiddenClue] = useState(false);
  const [editingCard, setEditingCard] = useState<InvestigationCard | null>(null);
  const [duplicateCard, setDuplicateCard] = useState<InvestigationCard | null>(null);
  const [selectedArchetype, setSelectedArchetype] = useState<CreatorArchetype | undefined>(undefined);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [showGMToolkit, setShowGMToolkit] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadCards();
      checkOwnership();
      setSelectedCardIds([]);
      window.dispatchEvent(new Event('modal-opened'));
    } else {
      window.dispatchEvent(new Event('modal-closed'));
    }
  }, [isOpen, investigationId]);

  const checkOwnership = async () => {
    setOwnerLoading(true);
    try {
      const [{ data: userData }, details] = await Promise.all([
        supabase.auth.getUser(),
        fetchInvestigationDetails(investigationId) as Promise<Record<string, any> | null>,
      ]);
      const uid = userData?.user?.id;
      setIsOwner(Boolean(uid && details?.owner_id && details.owner_id === uid));
    } catch {
      setIsOwner(false);
    } finally {
      setOwnerLoading(false);
    }
  };

  const toggleCardSelection = (cardId: string) => {
    setSelectedCardIds((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  };

  const handleSelectAllCards = () => {
    setSelectedCardIds(cards.map((c) => c.id));
  };

  const handleClearSelection = () => {
    setSelectedCardIds([]);
  };

  const loadCards = async () => {
    setLoading(true);
    try {
      const data = await fetchCardsForInvestigation(investigationId);

      const summaries: CardSummary[] = (data || []).map((card: any) => {
        let meta = card.metadata;
        if (typeof meta === 'string') {
          try {
            meta = JSON.parse(meta);
          } catch {
            meta = {};
          }
        }

        const summary: CardSummary = {
          id: card.id,
          title: card.title || 'Sem título',
          type: card.type || 'unknown',
          description: card.description_public || card.description_hidden || '',
          is_hidden: card.is_hidden || false,
          discovery_code: card.discovery_code,
          fullCard: card as InvestigationCard,
        };

        if (card.type === 'glitch_puzzle' && meta?.glitch_puzzle) {
          summary.rewardCode = meta.glitch_puzzle.reward_code;
        } else if (card.type === 'mega_clue' && meta?.mega_clue) {
          summary.requiredPuzzleIds = meta.mega_clue.required_puzzle_ids || [];
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
    // Pass the FULL InvestigationCard object so no fields/metadata/URLs are lost
    setEditingCard(card.fullCard);
    setDuplicateCard(null);
    setSelectedArchetype(undefined);
    setShowCreatorModal(true);
  };

  const handleDuplicateCard = (card: CardSummary) => {
    setEditingCard(null);
    setDuplicateCard(card.fullCard);
    setSelectedArchetype(undefined);
    setCreateHiddenClue(Boolean(card.is_hidden));
    setShowCreatorModal(true);
  };

  const handleCreateWithArchetype = (archetype: CreatorArchetype) => {
    setCreateHiddenClue(false);
    setEditingCard(null);
    setDuplicateCard(null);
    setSelectedArchetype(archetype);
    setShowCreatorModal(true);
  };

  const handleToggleHidden = async (card: CardSummary) => {
    const newHiddenStatus = !card.is_hidden;
    try {
      const updatePayload = { is_hidden: newHiddenStatus };
      const { error } = await (supabase as any)
        .from('investigation_cards')
        .update(updatePayload as any)
        .eq('id', card.id)
        .select();

      if (error) throw error;

      setCards((prev) =>
        prev.map((c) =>
          c.id === card.id
            ? {
                ...c,
                is_hidden: newHiddenStatus,
                fullCard: { ...c.fullCard, is_hidden: newHiddenStatus },
              }
            : c
        )
      );
    } catch (err: any) {
      console.error('CreatorHub: Error toggling hidden status:', err);
      alert('Erro ao alterar status da pista: ' + (err?.message || 'Erro desconhecido'));
    }
  };

  const handleClose = () => {
    if (showCreatorModal) {
      setShowCreatorModal(false);
      return;
    }
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      if (showCreatorModal) {
        setShowCreatorModal(false);
      } else {
        onClose();
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'glitch_puzzle':
        return <Puzzle size={16} />;
      case 'mega_clue':
        return <Lock size={16} />;
      case 'video':
        return <Video size={16} />;
      case 'audio':
        return <Music size={16} />;
      case 'image':
        return <ImageIcon size={16} />;
      case 'text':
        return <FileText size={16} />;
      default:
        return <Pin size={16} />;
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
        return 'Documento / Pista';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="creator-hub-overlay" onClick={handleOverlayClick}>
        <div className="creator-hub-modal" onClick={(e) => e.stopPropagation()}>
          <div className="creator-hub-header">
            <h2>
              <Settings className="lucide-icon inline-icon" size={16} /> HUB DE CRIAÇÃO DE INVESTIGAÇÃO
            </h2>
            <button className="close-btn" onClick={handleClose}>
              ×
            </button>
          </div>

          <div className="creator-hub-body">
            {/* Botão unificado de criação */}
            <div className="create-section">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                <button
                  className="btn-create-new primary"
                  onClick={() => {
                    setCreateHiddenClue(false);
                    setEditingCard(null);
                    setDuplicateCard(null);
                    setSelectedArchetype(undefined);
                    setShowCreatorModal(true);
                  }}
                >
                  <Sparkles size={15} /> CRIAR NOVA PISTA
                </button>
                <button
                  className="btn-create-new"
                  onClick={() => {
                    setCreateHiddenClue(true);
                    setEditingCard(null);
                    setDuplicateCard(null);
                    setSelectedArchetype(undefined);
                    setShowCreatorModal(true);
                  }}
                >
                  <EyeOff size={15} /> CRIAR PISTA OCULTA
                </button>
              </div>

              <div className="archetype-bar">
                <span className="archetype-bar-label">Criar por Arquétipo:</span>
                <div className="archetype-buttons">
                  {ARCHETYPE_BUTTONS.map((arch) => {
                    const ArchIcon = arch.icon;
                    return (
                      <button
                        key={arch.id}
                        type="button"
                        className="btn-archetype"
                        onClick={() => handleCreateWithArchetype(arch.id)}
                      >
                        <ArchIcon size={14} /> {arch.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Utilitários do Mestre (GM Toolkit) */}
            <div className="gm-toolkit-wrapper">
              <button
                type="button"
                className="gm-toolkit-toggle-btn"
                onClick={() => setShowGMToolkit((prev) => !prev)}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Wrench size={14} /> UTILITÁRIOS DO MESTRE (BACKUP, LOTE & RESET)</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{showGMToolkit ? <><ChevronUp size={14} /> Recolher</> : <><ChevronDown size={14} /> Expandir</>}</span>
              </button>
              {showGMToolkit && (
                <GMToolkitPanel
                  investigationId={investigationId}
                  isOwner={isOwner}
                  ownerLoading={ownerLoading}
                  cards={cards}
                  selectedCardIds={selectedCardIds}
                  onSelectAll={handleSelectAllCards}
                  onClearSelection={handleClearSelection}
                  onCardsUpdated={() => {
                    loadCards();
                    onPuzzleCreated(null);
                  }}
                />
              )}
            </div>

            {/* Lista de pistas existentes */}
            <div className="cards-list-section">
              <h3><ClipboardList className="lucide-icon inline-icon" size={16} /> PISTAS EXISTENTES ({cards.filter((c) => !c.is_hidden).length})</h3>

              {loading ? (
                <div className="loading-state">
                  <p>Carregando pistas...</p>
                </div>
              ) : cards.filter((c) => !c.is_hidden).length === 0 ? (
                <div className="empty-state">
                  <p>Nenhuma pista visível criada ainda.</p>
                  <p>Clique em "Criar Nova Pista" para começar.</p>
                </div>
              ) : (
                <VirtuosoGrid
                  style={{ height: '400px', width: '100%' }}
                  listClassName="cards-grid"
                  data={cards.filter((c) => !c.is_hidden)}
                  itemContent={(_index, card) => (
                    <div
                      className={`card-summary${
                        selectedCardIds.includes(card.id) ? ' selected' : ''
                      }`}
                    >
                      <div className="card-summary-header">
                        <input
                          type="checkbox"
                          className="card-select-checkbox"
                          checked={selectedCardIds.includes(card.id)}
                          disabled={!isOwner}
                          onChange={() => toggleCardSelection(card.id)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Selecionar ${card.title}`}
                        />
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
                            <span className="meta-label"><Gift className="lucide-icon inline-icon" size={14} /> Recompensa:</span>
                            <code className="reward-code">{card.rewardCode}</code>
                          </div>
                        )}

                        {card.requiredPuzzleIds && card.requiredPuzzleIds.length > 0 && (
                          <div className="card-meta">
                            <span className="meta-label">
                              <Lock className="lucide-icon inline-icon" size={16} /> Requer:
                            </span>
                            <span className="required-count">
                              {card.requiredPuzzleIds.length} quebra-cabeça
                              {card.requiredPuzzleIds.length !== 1 ? 's' : ''} vinculado
                              {card.requiredPuzzleIds.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="card-actions">
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleEditCard(card)}
                          title="Editar pista"
                        >
                          <Pen className="lucide-icon inline-icon" size={16} />
                        </button>
                        <button
                          className="btn-action btn-duplicate"
                          onClick={() => handleDuplicateCard(card)}
                          title="Duplicar Pista"
                        >
                          <Copy className="lucide-icon inline-icon" size={15} />
                          <span>Duplicar Pista</span>
                        </button>
                        <button
                          className={`btn-action ${card.is_hidden ? 'btn-show' : 'btn-hide'}`}
                          onClick={() => handleToggleHidden(card)}
                          title={card.is_hidden ? 'Tornar visível' : 'Tornar oculta'}
                        >
                          {card.is_hidden ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>
                      </div>
                    </div>
                  )}
                />
              )}

              {/* Pistas Ocultas */}
              {cards.filter((c) => c.is_hidden).length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h3>
                    <Eye className="lucide-icon inline-icon" size={16} /> PISTAS OCULTAS (
                    {cards.filter((c) => c.is_hidden).length})
                  </h3>
                  <VirtuosoGrid
                    style={{ height: '300px', width: '100%' }}
                    listClassName="cards-grid"
                    data={cards.filter((c) => c.is_hidden)}
                    itemContent={(_index, card) => (
                      <div
                        className={`card-summary hidden-clue${
                          selectedCardIds.includes(card.id) ? ' selected' : ''
                        }`}
                      >
                        <div className="card-summary-header">
                          <input
                            type="checkbox"
                            className="card-select-checkbox"
                            checked={selectedCardIds.includes(card.id)}
                            disabled={!isOwner}
                            onChange={() => toggleCardSelection(card.id)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Selecionar ${card.title}`}
                          />
                          <span className="card-icon"><EyeOff size={16} /></span>
                          <div className="card-title-section">
                            <h4>{card.title}</h4>
                            <span className="card-type">OCULTA - {getTypeLabel(card.type)}</span>
                          </div>
                        </div>

                        <div className="card-summary-body">
                          {card.discovery_code && (
                            <div className="card-meta">
                              <span className="meta-label">
                                <Search className="lucide-icon inline-icon" size={16} /> Código:
                              </span>
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
                            <Pen className="lucide-icon inline-icon" size={16} />
                          </button>
                          <button
                            className="btn-action btn-duplicate"
                            onClick={() => handleDuplicateCard(card)}
                            title="Duplicar Pista"
                          >
                            <Copy className="lucide-icon inline-icon" size={15} />
                            <span>Duplicar Pista</span>
                          </button>
                          <button
                            className={`btn-action ${card.is_hidden ? 'btn-show' : 'btn-hide'}`}
                            onClick={() => handleToggleHidden(card)}
                            title={card.is_hidden ? 'Tornar visível' : 'Tornar oculta'}
                          >
                            {card.is_hidden ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>
                        </div>
                      </div>
                    )}
                  />
                </div>
              )}
            </div>

            <div className="hub-info">
              <h4>
                <Lightbulb className="lucide-icon inline-icon" size={16} /> DICAS RÁPIDAS
              </h4>
              <ul>
                <li>
                  <strong>Quebra-cabeças de Glitch:</strong> Fornecem códigos de recompensa quando resolvidos
                </li>
                <li>
                  <strong>Mega-Pista:</strong> Você vincula os puzzles específicos que devem ser resolvidos para desbloqueá-la
                </li>
                <li>
                  <strong>Sistema Inteligente:</strong> A Mega-Pista só aceita códigos dos puzzles que você vinculou a ela
                </li>
                <li>
                  <strong>Ordem Recomendada:</strong> Crie primeiro todos os Glitch Puzzles, depois crie a Mega-Pista vinculando-os
                </li>
              </ul>
            </div>
          </div>

          <div className="creator-hub-footer">
            <button className="btn btn-secondary" onClick={handleClose}>
              FECHAR
            </button>
          </div>
        </div>
      </div>

      {showCreatorModal && (
        <CreateClueModal
          isOpen={showCreatorModal}
          onClose={() => {
            setShowCreatorModal(false);
            setEditingCard(null);
            setDuplicateCard(null);
            setSelectedArchetype(undefined);
          }}
          investigationId={investigationId}
          onSaved={(card) => {
            loadCards();
            onPuzzleCreated(card);
            setShowCreatorModal(false);
            setEditingCard(null);
            setDuplicateCard(null);
            setSelectedArchetype(undefined);
          }}
          defaultHidden={createHiddenClue}
          existingCard={editingCard}
          duplicateFromCard={duplicateCard}
          initialArchetype={selectedArchetype}
        />
      )}
    </>
  );
}
