import React, { useState, useEffect } from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { Network, Info, Trash2, Image as ImageIcon, FolderOpen, Check } from 'lucide-react';
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
    <div className="ccm-tab-stack">
      {coreState.evidenceType === 'mega_clue' && (
        <>
          <section className="ccm-section">
            <div className="ccm-section-head">
              <h3 className="ccm-section-title">
                CONFIGURAÇÃO MEGA CLUE
                <span data-tooltip-id="mega-tip" className="ccm-help-icon">
                  <Info size={15} />
                </span>
              </h3>
              <Tooltip id="mega-tip" className="cyber-tooltip ccm-tooltip">
                <span className="cyber-tooltip-title">[ MEGA CLUE ]</span>
                A Mega Clue requer que outras pistas sejam resolvidas para revelar a verdade final.
              </Tooltip>
            </div>

            <div className="ccm-field">
              <label className="ccm-label">Texto da Verdade Final *</label>
              <textarea
                className="ccm-input"
                rows={4}
                value={megaClueState.megaFinalTruthText}
                onChange={(e) => setMegaClueState((s) => ({ ...s, megaFinalTruthText: e.target.value }))}
                placeholder="O texto revelado quando todas as pistas requeridas forem solucionadas..."
              />
            </div>
          </section>

          <section className="ccm-section ccm-section-warn">
            <div className="ccm-section-head">
              <h3 className="ccm-section-title">
                <ImageIcon size={15} /> Imagem da Verdade (Opcional)
              </h3>
            </div>

            <div className="ccm-btn-row">
              <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleMegaImageSelect} />
              <button
                type="button"
                className="ccm-btn ccm-btn-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                <FolderOpen size={14} /> Selecionar Imagem
              </button>
              {megaClueState.megaImagePreview && (
                <button
                  type="button"
                  className="ccm-btn ccm-btn-danger"
                  onClick={handleRemoveMegaImage}
                >
                  <Trash2 size={15} /> Remover
                </button>
              )}
            </div>

            {megaClueState.megaImagePreview && (
              <div className="ccm-preview-box">
                <div className="ccm-preview-head">
                  <span>
                    <Check size={13} /> Imagem Final{megaClueState.megaImageFile?.name ? `: ${megaClueState.megaImageFile.name}` : ' carregada'}
                  </span>
                </div>
                <img src={megaClueState.megaImagePreview} alt="Imagem Final" className="ccm-preview-media" />
              </div>
            )}
          </section>

          <section className="ccm-section">
            <div className="ccm-section-head">
              <h3 className="ccm-section-title">
                <Network size={16} /> Puzzles Requeridos *
              </h3>
              <span className="ccm-code-pill">
                {(megaClueState.megaRequiredPuzzleIds || []).length} selecionado(s)
              </span>
            </div>

            <input
              type="text"
              className="ccm-input"
              placeholder="Buscar puzzles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="ccm-scroll-list">
              {filteredPuzzles.length === 0 ? (
                <div className="ccm-note" style={{ textAlign: 'center', padding: 12 }}>
                  Nenhum puzzle encontrado.
                </div>
              ) : (
                filteredPuzzles.map((puzzle) => (
                  <label key={puzzle.id} className="ccm-toggle-row">
                    <span className="ccm-toggle-text">
                      <span className="ccm-toggle-title">{puzzle.title}</span>
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {puzzle.rewardCode && (
                        <code className="ccm-code-pill">{puzzle.rewardCode}</code>
                      )}
                      <input
                        type="checkbox"
                        className="ccm-checkbox-input"
                        checked={(megaClueState.megaRequiredPuzzleIds || []).includes(puzzle.id)}
                        onChange={() => togglePuzzle(puzzle.id)}
                      />
                    </div>
                  </label>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
