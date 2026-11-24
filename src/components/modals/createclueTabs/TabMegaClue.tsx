import React, { useState, useEffect } from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { Network, Info, Trash2 } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import { supabase } from '../../../supabaseClient';

interface Props {
  investigationId: string;
}

interface PuzzleItem {
  id: string;
  title: string;
  rewardCode?: string;
}

export default function TabMegaClue({ investigationId }: Props) {
  const { coreState, megaClueState, setMegaClueState, setMediaState, registerUrl, revokeUrl } =
    useClueModal();
  const [availablePuzzles, setAvailablePuzzles] = useState<PuzzleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleMegaImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (megaClueState.megaImagePreview) revokeUrl(megaClueState.megaImagePreview);
      registerUrl(url);
      setMegaClueState((s) => ({ ...s, megaImageFile: file, megaImagePreview: url }));
      setMediaState((s) => ({ ...s, removedMegaImage: false }));
    }
    e.target.value = '';
  };

  const handleRemoveMegaImage = () => {
    revokeUrl(megaClueState.megaImagePreview);
    setMegaClueState((s) => ({ ...s, megaImageFile: null, megaImagePreview: null }));
    setMediaState((s) => ({ ...s, removedMegaImage: true }));
  };

  useEffect(() => {
    const fetchAvailablePuzzles = async () => {
      try {
        const { data, error } = await supabase
          .from('investigation_cards')
          .select('id, title, metadata')
          .eq('investigation_id', investigationId)
          .eq('type', 'glitch_puzzle');

        if (error) {
          console.error('Erro ao buscar puzzles:', error);
          return;
        }

        const puzzles: PuzzleItem[] = (data || []).map((card: any) => {
          let meta = card.metadata;
          if (typeof meta === 'string') {
            try {
              meta = JSON.parse(meta);
            } catch {
              meta = {};
            }
          }
          const rewardCode =
            meta?.glitch_puzzle?.reward_code || meta?.security_layer?.reward_code || undefined;
          return {
            id: card.id,
            title: card.title || 'Sem Título',
            rewardCode,
          };
        });
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
    setMegaClueState((s) => {
      const current = s.megaRequiredPuzzleIds || [];
      const isSelected = current.includes(id);
      if (isSelected) {
        return { ...s, megaRequiredPuzzleIds: current.filter((p) => p !== id) };
      } else {
        return { ...s, megaRequiredPuzzleIds: [...current, id] };
      }
    });
  };

  const filteredPuzzles = availablePuzzles.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="field-block">
      {coreState.evidenceType === 'mega_clue' && (
        <>
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
            <label className="field-title">Texto da Verdade Final *</label>
            <textarea
              className="cc-input"
              style={{ minHeight: 80, resize: 'vertical' }}
              value={megaClueState.megaFinalTruthText}
              onChange={(e) => setMegaClueState((s) => ({ ...s, megaFinalTruthText: e.target.value }))}
              placeholder="O texto revelado quando todas as pistas requeridas forem solucionadas..."
            />
          </div>

          <div style={{ marginTop: 24, padding: 16, border: '1px solid rgba(255,100,0,0.2)', borderRadius: 8, background: 'rgba(0,0,0,0.3)' }}>
            <h4 style={{ color: '#ff6400', marginTop: 0, marginBottom: 12 }}>🖼 IMAGEM DA VERDADE (OPCIONAL)</h4>

            <div style={{ display: 'flex', gap: 10 }}>
              <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleMegaImageSelect} />
              <button type="button" className="cc-btn cc-btn-save" style={{ flex: 1, justifyContent: 'center' }} onClick={() => fileInputRef.current?.click()}>
                📂 SELECIONAR IMAGEM
              </button>
              {megaClueState.megaImagePreview && (
                <button
                  type="button"
                  className="cc-btn cc-btn-cancel"
                  style={{ borderColor: '#ff4444', color: '#ff6666' }}
                  onClick={handleRemoveMegaImage}
                >
                  <Trash2 size={16} /> Remover
                </button>
              )}
            </div>

            {megaClueState.megaImagePreview && (
              <div style={{ marginTop: 16, padding: 10, background: 'rgba(0,0,0,0.5)', borderRadius: 6, border: '1px solid rgba(255,100,0,0.2)' }}>
                <div style={{ color: '#888', fontSize: 11, marginBottom: 8 }}>
                  ✓ Imagem Final{megaClueState.megaImageFile?.name ? `: ${megaClueState.megaImageFile.name}` : ' carregada'}
                </div>
                <img src={megaClueState.megaImagePreview} alt="Imagem Final" style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 4 }} />
              </div>
            )}
          </div>

          <div style={{ marginTop: 24 }}>
            <label className="field-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Network size={16} color="var(--cc-neon)" />
              Puzzles Requeridos * ({(megaClueState.megaRequiredPuzzleIds || []).length} selecionado(s))
            </label>

            <input
              type="text"
              className="cc-input"
              placeholder="Buscar puzzles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginBottom: 12 }}
            />

            <div
              style={{
                maxHeight: 220,
                overflowY: 'auto',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--cc-border)',
                borderRadius: 6,
                padding: 8,
              }}
            >
              {filteredPuzzles.length === 0 ? (
                <div style={{ color: 'var(--cc-text-muted)', fontSize: 13, textAlign: 'center', padding: 10 }}>
                  Nenhum puzzle encontrado.
                </div>
              ) : (
                filteredPuzzles.map((puzzle) => (
                  <label
                    key={puzzle.id}
                    className="cc-checkbox"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '6px 0', padding: '6px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.02)' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={(megaClueState.megaRequiredPuzzleIds || []).includes(puzzle.id)}
                        onChange={() => togglePuzzle(puzzle.id)}
                      />
                      <span style={{ color: 'var(--cc-text)', fontSize: 14 }}>{puzzle.title}</span>
                    </span>
                    {puzzle.rewardCode && (
                      <code
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: 'rgba(0, 255, 255, 0.12)',
                          border: '1px solid rgba(0, 255, 255, 0.35)',
                          color: 'var(--cc-neon)',
                        }}
                      >
                        {puzzle.rewardCode}
                      </code>
                    )}
                  </label>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
