import React from 'react';
import { InvestigationCardInsight } from '../../../api/investigations';

interface InvestigationBasicsTabProps {
  title: string;
  setTitle: (title: string) => void;
  descriptionPublic: string;
  setDescriptionPublic: (desc: string) => void;
  descriptionHidden: string;
  setDescriptionHidden: (desc: string) => void;
  insights: InvestigationCardInsight[];
  setInsights: (insights: InvestigationCardInsight[]) => void;
  isGameMaster: boolean;
}

const emptyInsight = (): InvestigationCardInsight => ({
  id: String(Date.now()),
  skill: '',
  cost: 1,
  text: '',
  visibility: 'hidden',
  reveal_to: [],
});

export default function InvestigationBasicsTab({
  title,
  setTitle,
  descriptionPublic,
  setDescriptionPublic,
  descriptionHidden,
  setDescriptionHidden,
  insights,
  setInsights,
  isGameMaster,
}: InvestigationBasicsTabProps) {
  const addInsight = () => setInsights([...insights, emptyInsight()]);
  const updateInsight = (idx: number, patch: Partial<InvestigationCardInsight>) =>
    setInsights(insights.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const removeInsight = (idx: number) => setInsights(insights.filter((_, i) => i !== idx));

  return (
    <div style={{ flex: 1, marginRight: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>Título</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%',
            border: !isGameMaster ? 'none' : '1px solid #444',
            background: !isGameMaster ? 'transparent' : '#111',
            color: '#fff',
            padding: '8px',
            borderRadius: 6,
          }}
          disabled={!isGameMaster}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>
          Descrição Visível para Jogadores
        </label>
        <textarea
          value={descriptionPublic}
          onChange={(e) => setDescriptionPublic(e.target.value)}
          style={{
            width: '100%',
            height: 100,
            border: !isGameMaster ? 'none' : '1px solid #444',
            background: !isGameMaster ? 'transparent' : '#111',
            color: '#fff',
            padding: '8px',
            borderRadius: 6,
            resize: 'vertical',
          }}
          disabled={!isGameMaster}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>
          Descrição Oculta (Apenas GM)
        </label>
        <textarea
          value={descriptionHidden}
          onChange={(e) => setDescriptionHidden(e.target.value)}
          style={{
            width: '100%',
            height: 100,
            border: !isGameMaster ? 'none' : '1px solid #444',
            background: !isGameMaster ? 'transparent' : '#111',
            color: '#fff',
            padding: '8px',
            borderRadius: 6,
            resize: 'vertical',
          }}
          disabled={!isGameMaster}
        />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <label style={{ fontWeight: 'bold' }}>✨ Insights / Habilidades</label>
          {isGameMaster && (
            <button
              onClick={addInsight}
              style={{
                padding: '6px 12px',
                background: '#27ae60',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              + Adicionar
            </button>
          )}
        </div>

        <div style={{ maxHeight: 300, overflowY: 'auto', borderLeft: '2px solid #444', paddingLeft: 12 }}>
          {insights.length === 0 ? (
            <div style={{ color: '#666', fontSize: 13 }}>Nenhum insight adicionado.</div>
          ) : (
            insights.map((ins, i) => (
              <div
                key={ins.id}
                style={{
                  marginBottom: 12,
                  padding: '10px',
                  background: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: 6,
                }}
              >
                <input
                  placeholder="Habilidade necessária"
                  value={ins.skill}
                  onChange={(e) => updateInsight(i, { skill: e.target.value })}
                  disabled={!isGameMaster}
                  style={{
                    width: '100%',
                    marginBottom: 8,
                    padding: '6px',
                    border: !isGameMaster ? 'none' : '1px solid #444',
                    background: !isGameMaster ? 'transparent' : '#111',
                    color: '#fff',
                    borderRadius: 4,
                  }}
                />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: '#aaa' }}>Custo</label>
                    <input
                      type="number"
                      value={ins.cost}
                      onChange={(e) => updateInsight(i, { cost: Number(e.target.value) })}
                      disabled={!isGameMaster}
                      style={{
                        width: '100%',
                        padding: '6px',
                        border: !isGameMaster ? 'none' : '1px solid #444',
                        background: !isGameMaster ? 'transparent' : '#111',
                        color: '#fff',
                        borderRadius: 4,
                      }}
                    />
                  </div>
                  {isGameMaster && (
                    <button
                      onClick={() => removeInsight(i)}
                      style={{
                        marginTop: 18,
                        padding: '6px 10px',
                        background: '#e74c3c',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      🗑️ Remover
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
