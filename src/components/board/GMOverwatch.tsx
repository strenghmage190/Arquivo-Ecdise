import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import Toast from '../ui/Toast';

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
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; } | null>(null);

  const loadAllCards = async () => {
    setLoading(true);
    console.log('GMOverwatch: Loading all cards for investigation:', investigationId);
    try {
      const { data, error } = await supabase
        .from('investigation_cards')
        .select('id, title, discovery_code, type, image_url, created_at, description_public, description_hidden, is_hidden')
        .eq('investigation_id', investigationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('GMOverwatch: Error loading cards:', error);
        throw error;
      }
      console.log('GMOverwatch: Found cards:', data);
      setAllCards((data as HiddenCard[]) || []);
    } catch (err) {
      console.error('GMOverwatch: Error loading cards:', err);
      setToast({ message: 'Erro ao carregar pistas' });
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

    const channel = supabase.channel(`gm-overwatch:${investigationId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'investigation_cards', 
        filter: `investigation_id=eq.${investigationId}` 
      }, (payload) => {
        const ev = payload.eventType;
        const newRow: any = payload.new;
        const oldRow: any = payload.old;

        if (ev === 'UPDATE' && newRow) {
          // If a card was revealed (is_hidden changed from true to false), remove it from our list
          if (oldRow?.is_hidden === true && newRow.is_hidden === false) {
            setAllCards(prev => prev.filter(c => c.id !== newRow.id));
          }
          // If a card was hidden (is_hidden changed from false to true), add it to our list
          else if (oldRow?.is_hidden === false && newRow.is_hidden === true) {
            setAllCards(prev => {
              if (prev.find(c => c.id === newRow.id)) return prev;
              return [...prev, newRow];
            });
          }
          // If other properties changed but is_hidden stayed true, update the card
          else if (newRow.is_hidden === true) {
            setAllCards(prev => prev.map(c => c.id === newRow.id ? newRow : c));
          }
        } else if (ev === 'INSERT' && newRow && newRow.is_hidden === true) {
          setAllCards(prev => {
            if (prev.find(c => c.id === newRow.id)) return prev;
            return [...prev, newRow];
          });
        } else if (ev === 'DELETE' && oldRow && oldRow.is_hidden === true) {
          setAllCards(prev => prev.filter(c => c.id !== oldRow.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [investigationId, isVisible]);

  const handleReveal = async (cardId: string, title: string) => {
    try {
      // Use a more direct approach to avoid TypeScript issues
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/investigation_cards?id=eq.${cardId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ is_hidden: false })
      });

      if (!response.ok) {
        throw new Error('Failed to update card');
      }

      // Update local state
      setAllCards(prev => prev.map(c => c.id === cardId ? { ...c, is_hidden: false } : c));

      setToast({ message: `Pista "${title}" revelada com sucesso.` });

      // Optional: Play sound
      try {
        const audio = new Audio('/sounds/incoming_transmission.mp3');
        audio.play();
      } catch {}
    } catch (err) {
      console.error('Error revealing card:', err);
      setToast({ message: 'Erro ao revelar pista' });
    }
  };

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'image': return '🖼️';
      case 'video': return '🎥';
      case 'audio': return '🔊';
      case 'text': return '📄';
      default: return '📋';
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '300px',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.9)',
        borderLeft: '2px solid #00ffff',
        zIndex: 1200,
        overflowY: 'auto',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: '#00ffff', margin: 0 }}>GM Overwatch</h3>
          <button onClick={onToggle} style={{ background: 'none', border: 'none', color: '#00ffff', cursor: 'pointer' }}>✕</button>
        </div>

        {loading ? (
          <div style={{ color: '#fff' }}>Carregando...</div>
        ) : !allCards || allCards.length === 0 ? (
          <div style={{ color: '#aaa' }}>Nenhuma pista</div>
        ) : (
          <div>
            {allCards.map(card => (
              <div key={card.id} style={{
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '12px',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: card.is_hidden ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 255, 0, 0.8)',
                  color: '#fff',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  {card.is_hidden ? 'OCULTA' : 'VISÍVEL'}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ marginRight: '8px', fontSize: '16px' }}>{getCardIcon(card.type)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>{card.title}</div>
                    <div style={{ color: '#aaa', fontSize: '11px' }}>
                      Tipo: {card.type} • Criada: {card.created_at ? new Date(card.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                    </div>
                  </div>
                </div>

                <div style={{ color: '#aaa', fontSize: '12px', marginBottom: '8px' }}>
                  <strong>Código de descoberta:</strong> <code style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '2px 4px',
                    borderRadius: '3px',
                    color: '#00ffff'
                  }}>{card.discovery_code || 'Nenhum'}</code>
                </div>

                {(card.description_public || card.description_hidden) && (
                  <div style={{ color: '#ccc', fontSize: '12px', marginBottom: '10px', fontStyle: 'italic' }}>
                    {card.description_public || card.description_hidden}
                  </div>
                )}

                {card.is_hidden && (
                  <button
                    onClick={() => handleReveal(card.id, card.title)}
                    style={{
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      color: '#000',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      width: '100%'
                    }}
                  >
                    🚀 DEPLOY ASSET
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}