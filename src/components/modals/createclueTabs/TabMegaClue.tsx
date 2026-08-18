import React, { useState, useEffect } from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { Network, Info } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import { supabase } from '../../../supabaseClient';

interface Props {
  investigationId: string;
}

export default function TabMegaClue({ investigationId }: Props) {
  const { megaClueState, setMegaClueState } = useClueModal();
  const [availablePuzzles, setAvailablePuzzles] = useState<{ id: string; title: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAvailablePuzzles = async () => {
      try {
        const { data, error } = await supabase
          .from('investigation_cards')
          .select('id, title')
          .eq('investigation_id', investigationId)
          .eq('type', 'glitch_puzzle');
        
        if (error) {
          console.error('Erro ao buscar puzzles:', error);
          return;
        }

        const puzzles = (data || []).map((card: any) => ({ id: card.id, title: card.title }));
        setAvailablePuzzles(puzzles);
      } catch (err) {
        console.error('fetchAvailablePuzzles error:', err);
      }
    };

    if (investigationId) {
      fetchAvailablePuzzles();
    }
  }, [investigationId]);

  const togglePuzzle = (id: string) => {
    setMegaClueState(s => {
      const current = s.megaRequiredPuzzleIds || [];
      const isSelected = current.includes(id);
      if (isSelected) {
        return { ...s, megaRequiredPuzzleIds: current.filter(p => p !== id) };
      } else {
        return { ...s, megaRequiredPuzzleIds: [...current, id] };
      }
    });
  };

  const filteredPuzzles = availablePuzzles.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="field-block">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span className="field-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          CONFIGURAÇÃO MEGA CLUE
          <span data-tooltip-id="mega-tip" style={{ display: 'flex', cursor: 'help' }}>
            <Info size={16} color="#00ffff" />
          </span>
        </span>
      </div>
      <Tooltip id="mega-tip" className="cyber-tooltip">
        <span className="cyber-tooltip-title">[ MEGA CLUE ]</span>
        A Mega Clue requer que outras pistas sejam resolvidas para revelar a verdade final.
      </Tooltip>

      <div style={{ marginTop: 16 }}>
        <label className="field-title">Texto da Verdade Final</label>
        <textarea
          className="cc-input"
          style={{ minHeight: 80, resize: 'vertical' }}
          value={megaClueState.megaFinalTruthText}
          onChange={(e) => setMegaClueState(s => ({ ...s, megaFinalTruthText: e.target.value }))}
          placeholder="O texto revelado quando todas as pistas requeridas forem solucionadas..."
        />
      </div>

      <div style={{ marginTop: 24 }}>
        <label className="field-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Network size={16} color="var(--cc-neon)" />
          Puzzles Requeridos (Checklist)
        </label>
        
        <input
          type="text"
          className="cc-input"
          placeholder="Buscar puzzles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: 12 }}
        />

        <div style={{
          maxHeight: 200,
          overflowY: 'auto',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--cc-border)',
          borderRadius: 6,
          padding: 8
        }}>
          {filteredPuzzles.length === 0 ? (
            <div style={{ color: 'var(--cc-text-muted)', fontSize: 13, textAlign: 'center', padding: 10 }}>
              Nenhum puzzle encontrado.
            </div>
          ) : (
            filteredPuzzles.map(puzzle => (
              <label key={puzzle.id} className="cc-checkbox" style={{ display: 'flex', margin: '8px 0', padding: '4px 8px' }}>
                <input
                  type="checkbox"
                  checked={(megaClueState.megaRequiredPuzzleIds || []).includes(puzzle.id)}
                  onChange={() => togglePuzzle(puzzle.id)}
                />
                <span className="checkmark"></span>
                <span style={{ color: 'var(--cc-text)', fontSize: 14 }}>{puzzle.title || 'Sem Título'}</span>
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
