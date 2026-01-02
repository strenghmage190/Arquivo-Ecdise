import React from 'react';

interface InvestigationMegaClueTabProps {
  existing: any;
  isEditingMegaClue: boolean;
  setIsEditingMegaClue: (editing: boolean) => void;
  tempMegaClueData: any;
  setTempMegaClueData: (data: any) => void;
  newRequiredId: string;
  setNewRequiredId: (id: string) => void;
  isGameMaster: boolean;
  onSaveMegaClue: () => Promise<void>;
}

export default function InvestigationMegaClueTab({
  existing,
  isEditingMegaClue,
  setIsEditingMegaClue,
  tempMegaClueData,
  setTempMegaClueData,
  newRequiredId,
  setNewRequiredId,
  isGameMaster,
  onSaveMegaClue,
}: InvestigationMegaClueTabProps) {
  if (!isGameMaster || !(existing as any)?.metadata?.mega_clue) {
    return (
      <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>
        🔐 Nenhuma Mega-Pista configurada neste card
      </div>
    );
  }

  const handleRemoveRequiredId = (index: number) => {
    setTempMegaClueData((prev: any) => ({
      ...prev,
      required_puzzle_ids: prev.required_puzzle_ids.filter((_: string, i: number) => i !== index),
    }));
  };

  const handleAddRequiredId = () => {
    if (!newRequiredId.trim()) return;
    setTempMegaClueData((prev: any) => ({
      ...prev,
      required_puzzle_ids: [...prev.required_puzzle_ids, newRequiredId.trim()],
    }));
    setNewRequiredId('');
  };

  const handleInitializeEdit = () => {
    const metadata = (existing as any)?.metadata;
    const megaClueData = metadata?.mega_clue || {};
    setTempMegaClueData({
      final_truth_text: megaClueData.final_truth_text || '',
      final_image_url: megaClueData.final_image_url || '',
      required_puzzle_ids: Array.isArray(megaClueData.required_puzzle_ids)
        ? [...megaClueData.required_puzzle_ids]
        : [],
    });
    setIsEditingMegaClue(true);
  };

  const handleCancel = () => {
    setIsEditingMegaClue(false);
    setTempMegaClueData(null);
    setNewRequiredId('');
  };

  return (
    <div style={{ flex: 1 }}>
      <div style={{ marginBottom: 12, borderBottom: '1px solid #333', paddingBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>🔐 Editor de Mega-Pista</strong>
          <button
            type="button"
            onClick={() => {
              if (isEditingMegaClue) {
                handleCancel();
              } else {
                handleInitializeEdit();
              }
            }}
            style={{
              padding: '6px 12px',
              background: isEditingMegaClue ? '#333' : '#27ae60',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            {isEditingMegaClue ? '✕ Cancelar' : '✏️ Editar'}
          </button>
        </div>
      </div>

      {!isEditingMegaClue ? (
        <div style={{ fontSize: 13, color: '#ccc' }}>
          <div style={{ marginBottom: 12 }}>
            <strong>Texto da Verdade:</strong>
            <p style={{ color: '#aaa', marginTop: 6, wordBreak: 'break-word' }}>
              {((existing as any)?.metadata?.mega_clue?.final_truth_text || 'Não definido').substring(
                0,
                150
              )}
              {((existing as any)?.metadata?.mega_clue?.final_truth_text || '').length > 150
                ? '...'
                : ''}
            </p>
          </div>
          <div>
            <strong>IDs Obrigatórios:</strong>
            <div style={{ marginTop: 6, color: '#aaa' }}>
              {Array.isArray((existing as any)?.metadata?.mega_clue?.required_puzzle_ids)
                ? (existing as any)?.metadata?.mega_clue?.required_puzzle_ids.length
                : 0}{' '}
              puzzle(s) requirido(s)
            </div>
          </div>
        </div>
      ) : (
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 'bold' }}>
            Texto da Verdade Final ({(tempMegaClueData?.final_truth_text || '').length}/2000)
          </label>
          <textarea
            value={tempMegaClueData?.final_truth_text || ''}
            onChange={(e) => {
              const text = e.target.value.substring(0, 2000);
              setTempMegaClueData((prev: any) => ({ ...prev, final_truth_text: text }));
            }}
            style={{
              width: '100%',
              minHeight: 100,
              marginBottom: 12,
              padding: 8,
              border: '1px solid #444',
              borderRadius: 6,
              background: '#111',
              color: '#fff',
              fontSize: 13,
              resize: 'vertical',
            }}
            placeholder="Escreva o texto final da verdade..."
          />

          <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 'bold' }}>
            URL da Imagem Final (opcional)
          </label>
          <input
            type="text"
            value={tempMegaClueData?.final_image_url || ''}
            onChange={(e) =>
              setTempMegaClueData((prev: any) => ({ ...prev, final_image_url: e.target.value }))
            }
            style={{
              width: '100%',
              marginBottom: 12,
              padding: '8px',
              border: '1px solid #444',
              borderRadius: 6,
              background: '#111',
              color: '#fff',
              fontSize: 13,
            }}
            placeholder="https://..."
          />

          <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 'bold' }}>
            UUIDs dos Puzzles Obrigatórios
          </label>
          <div
            style={{
              maxHeight: 180,
              overflowY: 'auto',
              border: '1px solid #333',
              padding: 8,
              marginBottom: 12,
              borderRadius: 6,
              background: '#0a0a0a',
            }}
          >
            {(!tempMegaClueData?.required_puzzle_ids ||
              tempMegaClueData.required_puzzle_ids.length === 0) && (
              <div style={{ color: '#666', fontSize: 12, textAlign: 'center', padding: 20 }}>
                Nenhum puzzle adicionado
              </div>
            )}
            {tempMegaClueData?.required_puzzle_ids?.map((id: string, index: number) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  marginBottom: 8,
                  padding: '8px',
                  background: '#111',
                  borderRadius: 4,
                }}
              >
                <span
                  style={{
                    flex: 1,
                    fontSize: 12,
                    color: '#aaa',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                  }}
                >
                  {id}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveRequiredId(index)}
                  style={{
                    padding: '4px 8px',
                    background: '#e74c3c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              type="text"
              value={newRequiredId}
              onChange={(e) => setNewRequiredId(e.target.value)}
              style={{
                flex: 1,
                padding: '8px',
                border: '1px solid #444',
                borderRadius: 6,
                background: '#111',
                color: '#fff',
                fontSize: 12,
              }}
              placeholder="Cole o UUID do puzzle..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddRequiredId();
              }}
            />
            <button
              type="button"
              onClick={handleAddRequiredId}
              style={{
                padding: '8px 12px',
                background: '#27ae60',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              ➕ Adicionar
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                flex: 1,
                padding: '10px',
                background: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              ✕ Cancelar
            </button>
            <button
              type="button"
              onClick={onSaveMegaClue}
              style={{
                flex: 1,
                padding: '10px',
                background: '#27ae60',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              ✓ Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
