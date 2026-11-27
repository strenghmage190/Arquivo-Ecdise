import { X, Image as ImageIcon, Video, Volume2, FileText, ClipboardList, Unlock } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { fetchSolveLog, ClueSolveLogEntry } from '../../api/clueSecurity';
import Toast from '../ui/Toast';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MobileDrawer } from '../ui/MobileDrawer';
import Button from '../ui/Button';

interface GMOverwatchProps {
  investigationId: string;
  isVisible: boolean;
  onToggle: () => void;
}

interface HiddenCard {
  id: string;
  title: string;
  discovery_code: string;
  type: string;
  image_url?: string;
  created_at?: string;
  description_public?: string;
  description_hidden?: string;
  is_hidden: boolean;
}

export default function GMOverwatch({ investigationId, isVisible, onToggle }: GMOverwatchProps) {
  const [allCards, setAllCards] = useState<HiddenCard[]>([]);
  const [solveLog, setSolveLog] = useState<ClueSolveLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'cards' | 'solves'>('cards');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant?: 'success' | 'error' } | null>(null);
  const isMobile = useIsMobile();

  const loadAllCards = async () => {
    setLoading(true);
    try {
      const [{ data, error }, logEntries] = await Promise.all([
        supabase
          .from('investigation_cards')
          .select('id, title, discovery_code, type, image_url, created_at, description_public, description_hidden, is_hidden')
          .eq('investigation_id', investigationId)
          .order('created_at', { ascending: false }),
        fetchSolveLog(investigationId, 30),
      ]);

      if (error) throw error;
      setAllCards((data as HiddenCard[]) || []);
      setSolveLog(logEntries);
    } catch (err) {
      console.error('GMOverwatch: Error loading cards:', err);
      setToast({ message: 'Erro ao carregar pistas', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      loadAllCards();
    }
  }, [investigationId, isVisible]);

  // Realtime updates for hidden cards
  useEffect(() => {
    if (!investigationId || !isVisible) return;

    const channel = supabase
      .channel(`gm-overwatch:${investigationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investigation_cards',
          filter: `investigation_id=eq.${investigationId}`,
        },
        (payload) => {
          const ev = payload.eventType;
          const newRow: any = payload.new;
          const oldRow: any = payload.old;

          if (ev === 'UPDATE' && newRow) {
            if (oldRow?.is_hidden === true && newRow.is_hidden === false) {
              setAllCards((prev) => prev.map((c) => (c.id === newRow.id ? { ...c, is_hidden: false } : c)));
            } else if (oldRow?.is_hidden === false && newRow.is_hidden === true) {
              setAllCards((prev) => {
                if (prev.find((c) => c.id === newRow.id)) {
                  return prev.map((c) => (c.id === newRow.id ? newRow : c));
                }
                return [newRow, ...prev];
              });
            } else {
              setAllCards((prev) => prev.map((c) => (c.id === newRow.id ? newRow : c)));
            }
          } else if (ev === 'INSERT' && newRow) {
            setAllCards((prev) => {
              if (prev.find((c) => c.id === newRow.id)) return prev;
              return [newRow, ...prev];
            });
          } else if (ev === 'DELETE' && oldRow) {
            setAllCards((prev) => prev.filter((c) => c.id !== oldRow.id));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clue_solve_log',
          filter: `investigation_id=eq.${investigationId}`,
        },
        (payload) => {
          const entry = payload.new as ClueSolveLogEntry;
          if (entry?.id) {
            setSolveLog((prev) => [entry, ...prev.filter((x) => x.id !== entry.id)].slice(0, 30));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [investigationId, isVisible]);

  const handleReveal = async (cardId: string, title: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/investigation_cards?id=eq.${cardId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ is_hidden: false }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update card');
      }

      setAllCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, is_hidden: false } : c)));
      setToast({ message: `Pista "${title}" revelada com sucesso.`, variant: 'success' });

      try {
        const audio = new Audio('/sounds/incoming_transmission.mp3');
        audio.play();
      } catch {
        // ignore autoplay blocks
      }
    } catch (err) {
      console.error('Error revealing card:', err);
      setToast({ message: 'Erro ao revelar pista', variant: 'error' });
    }
  };

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon size={15} />;
      case 'video':
        return <Video size={15} />;
      case 'audio':
        return <Volume2 size={15} />;
      case 'text':
        return <FileText size={15} />;
      default:
        return <ClipboardList size={15} />;
    }
  };

  if (!isVisible) return null;

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: isMobile ? '8px 12px 0' : '0 0 10px',
          borderBottom: '1px solid var(--border, #29313d)',
          marginBottom: 10,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('cards')}
          style={{
            flex: 1,
            padding: '6px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid var(--border, #29313d)',
            background: activeTab === 'cards' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
            color: activeTab === 'cards' ? '#e0f2fe' : '#94a3b8',
          }}
        >
          PISTAS ({allCards.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('solves')}
          style={{
            flex: 1,
            padding: '6px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid var(--border, #29313d)',
            background: activeTab === 'solves' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            color: activeTab === 'solves' ? '#d1fae5' : '#94a3b8',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <Unlock size={12} /> DESBLOQUEIOS ({solveLog.length})
        </button>
      </div>

      {activeTab === 'solves' ? (
        <div
          className="overscroll-contain"
          style={{
            overflowY: 'auto',
            padding: isMobile ? 'var(--space-3, 12px)' : '0',
            paddingBottom: isMobile ? 'max(var(--space-4, 16px), env(safe-area-inset-bottom, 0px))' : 'var(--space-4, 16px)',
          }}
        >
          {solveLog.length === 0 ? (
            <div style={{ color: 'var(--text-secondary, #94a3b8)', padding: '16px', fontSize: 12 }}>
              Nenhum enigma resolvido ou override registrado ainda.
            </div>
          ) : (
            solveLog.map((entry) => {
              const cardTitle = allCards.find((c) => c.id === entry.card_id)?.title || 'Evidência';
              const methodLabel =
                entry.method === 'player_solution'
                  ? 'RESOLVIDO PELO GRUPO'
                  : entry.method === 'gm_override'
                  ? 'OVERRIDE DO MESTRE'
                  : 'CALIBRAÇÃO ASSISTIDA';
              return (
                <div
                  key={entry.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.78)',
                    border: '1px solid var(--border, #29313d)',
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 8,
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
                    <strong style={{ color: '#e2e8f0' }}>{cardTitle}</strong>
                    <span style={{ fontSize: 10, color: '#6ee7b7', fontFamily: 'monospace' }}>
                      {methodLabel}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    Por <strong>{entry.solver_name}</strong> ·{' '}
                    {new Date(entry.created_at).toLocaleString('pt-BR')}
                  </div>
                  {entry.unlocked_reward_ids?.length > 0 && (
                    <div style={{ fontSize: 11, color: '#d8b4fe', marginTop: 4 }}>
                      +{entry.unlocked_reward_ids.length} recompensa(s) revelada(s) automaticamente
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : loading ? (
        <div style={{ color: 'var(--text-secondary, #94a3b8)', padding: 'var(--space-4, 16px)' }}>
          Carregando pistas...
        </div>
      ) : !allCards || allCards.length === 0 ? (
        <div style={{ color: 'var(--text-secondary, #94a3b8)', padding: 'var(--space-4, 16px)' }}>
          Nenhuma pista encontrada.
        </div>
      ) : (
        <div
          className="overscroll-contain"
          style={{
            overflowY: 'auto',
            padding: isMobile ? 'var(--space-3, 12px)' : '0',
            paddingBottom: isMobile ? 'max(var(--space-4, 16px), env(safe-area-inset-bottom, 0px))' : 'var(--space-4, 16px)',
          }}
        >
          {allCards.map((card) => (
            <div
              key={card.id}
              style={{
                background: 'rgba(15, 23, 42, 0.78)',
                border: '1px solid var(--border, #29313d)',
                borderRadius: 'var(--radius-md, 8px)',
                padding: 'var(--space-3, 12px)',
                marginBottom: 'var(--space-3, 12px)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: card.is_hidden ? 'rgba(230, 57, 70, 0.85)' : 'rgba(16, 185, 129, 0.85)',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full, 9999px)',
                  fontSize: '10px',
                  fontFamily: 'var(--font-system, monospace)',
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                }}
              >
                {card.is_hidden ? 'OCULTA' : 'VISÍVEL'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', gap: '8px', paddingRight: '68px' }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{getCardIcon(card.type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: 'var(--text-primary, #f1f5f9)',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {card.title}
                  </div>
                  <div
                    style={{
                      color: 'var(--text-secondary, #94a3b8)',
                      fontSize: '11px',
                      fontFamily: 'var(--font-system, monospace)',
                    }}
                  >
                    Tipo: {card.type} •{' '}
                    {card.created_at ? new Date(card.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                  </div>
                </div>
              </div>

              <div style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '12px', marginBottom: '8px' }}>
                <strong>Código:</strong>{' '}
                <code
                  style={{
                    background: 'rgba(0, 0, 0, 0.5)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm, 4px)',
                    color: 'var(--nexus-blue, #cbd5e1)',
                    fontFamily: 'var(--font-terminal, monospace)',
                  }}
                >
                  {card.discovery_code || 'Nenhum'}
                </code>
              </div>

              {(card.description_public || card.description_hidden) && (
                <div
                  style={{
                    color: '#cbd5e1',
                    fontSize: '12px',
                    marginBottom: '10px',
                    fontStyle: 'italic',
                    lineHeight: 1.4,
                    overflowWrap: 'anywhere',
                  }}
                >
                  {card.description_public || card.description_hidden}
                </div>
              )}

              {card.is_hidden && (
                <Button
                  variant="primary"
                  size={isMobile ? 'md' : 'sm'}
                  fullWidth
                  onClick={() => handleReveal(card.id, card.title)}
                  style={{
                    justifyContent: 'center',
                    marginTop: '4px',
                  }}
                >
                  REVELAR PISTA (DEPLOY)
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {isMobile ? (
        <MobileDrawer
          isOpen={isVisible}
          onClose={onToggle}
          position="right"
          title="GM Overwatch"
          width="min(92vw, 380px)"
        >
          {content}
        </MobileDrawer>
      ) : (
        <aside
          aria-label="GM Overwatch"
          className="overscroll-contain"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: 'min(340px, 92vw)',
            height: '100dvh',
            background: 'var(--surface, #11141b)',
            borderLeft: '1px solid var(--border, #29313d)',
            zIndex: 'var(--z-modals, 2000)',
            overflowY: 'auto',
            padding:
              'max(var(--space-4, 16px), env(safe-area-inset-top, 0px)) max(var(--space-4, 16px), env(safe-area-inset-right, 0px)) max(var(--space-4, 16px), env(safe-area-inset-bottom, 0px)) var(--space-4, 16px)',
            boxSizing: 'border-box',
            boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.8)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-4, 16px)',
              borderBottom: '1px solid var(--border, #29313d)',
              paddingBottom: 'var(--space-2, 8px)',
            }}
          >
            <h3
              style={{
                color: 'var(--text-primary, #f1f5f9)',
                margin: 0,
                fontSize: '15px',
                fontFamily: 'var(--font-hud, sans-serif)',
                letterSpacing: '1px',
              }}
            >
              GM OVERWATCH
            </h3>
            <button
              type="button"
              onClick={onToggle}
              style={{
                background: 'none',
                border: '1px solid var(--border, #29313d)',
                borderRadius: 'var(--radius-sm, 4px)',
                color: 'var(--text-secondary, #94a3b8)',
                cursor: 'pointer',
                width: '32px',
                height: '32px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Fechar Overwatch"
            >
              <X size={18} />
            </button>
          </div>
          {content}
        </aside>
      )}

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
