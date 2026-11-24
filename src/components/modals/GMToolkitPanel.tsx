import React, { useRef, useState } from 'react';
import {
  Download,
  Upload,
  Eye,
  EyeOff,
  RotateCcw,
  CheckSquare,
  Square,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import {
  batchSetCardsVisibility,
  CaseBackupPayload,
  downloadCaseBackupJson,
  exportCaseBackup,
  importCaseBackup,
  resetLocalPuzzleProgress,
  validateCaseBackupPayload,
} from '../../utils/caseBackup';

export interface GMToolkitCardSummary {
  id: string;
  title: string;
  is_hidden?: boolean;
}

interface GMToolkitPanelProps {
  investigationId: string;
  isOwner: boolean;
  ownerLoading?: boolean;
  cards: GMToolkitCardSummary[];
  selectedCardIds: string[];
  onSelectAll: () => void;
  onClearSelection: () => void;
  onCardsUpdated: () => void;
}

export default function GMToolkitPanel({
  investigationId,
  isOwner,
  ownerLoading = false,
  cards,
  selectedCardIds,
  onSelectAll,
  onClearSelection,
  onCardsUpdated,
}: GMToolkitPanelProps) {
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'current' | 'new'>('current');
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canAct = isOwner && !ownerLoading && !busy;

  const clearFeedback = () => {
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const handleExport = async () => {
    if (!canAct) return;
    clearFeedback();
    setBusy(true);
    try {
      const backup = await exportCaseBackup(investigationId);
      downloadCaseBackupJson(backup);
      setStatusMessage(
        `Backup exportado: ${backup.cards.length} pista(s) e ${backup.connections.length} conexão(ões).`
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao exportar backup do caso.');
    } finally {
      setBusy(false);
    }
  };

  const handleImportFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !canAct) return;

    clearFeedback();
    setBusy(true);
    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error('Arquivo JSON inválido ou corrompido.');
      }

      const validatedBackup: CaseBackupPayload = validateCaseBackupPayload(parsed);

      if (importMode === 'new' && !newCaseTitle.trim()) {
        throw new Error('Informe o título do novo caso antes de importar.');
      }

      const result = await importCaseBackup({
        targetInvestigationId:
          importMode === 'current' ? investigationId : undefined,
        newInvestigationTitle:
          importMode === 'new' ? newCaseTitle.trim() : undefined,
        backup: validatedBackup,
      });

      if (importMode === 'current') {
        onCardsUpdated();
      } else {
        setNewCaseTitle('');
      }

      setStatusMessage(
        `Importação concluída: ${result.importedCards} pista(s) e ${result.importedConnections} conexão(ões) no caso ${result.investigationId}.`
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao importar backup do caso.');
    } finally {
      setBusy(false);
    }
  };

  const handleBatchVisibility = async (isHidden: boolean) => {
    if (!canAct || selectedCardIds.length === 0) return;
    clearFeedback();
    setBusy(true);
    try {
      const count = await batchSetCardsVisibility(
        investigationId,
        selectedCardIds,
        isHidden
      );
      onCardsUpdated();
      setStatusMessage(
        isHidden
          ? `${count} pista(s) ocultada(s) com sucesso.`
          : `${count} pista(s) revelada(s) com sucesso.`
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao atualizar visibilidade em lote.');
    } finally {
      setBusy(false);
    }
  };

  const handleResetLocalProgress = () => {
    if (!canAct) return;
    clearFeedback();
    const targetIds = selectedCardIds.length > 0 ? selectedCardIds : undefined;
    const removed = resetLocalPuzzleProgress(investigationId, targetIds);
    setStatusMessage(
      removed > 0
        ? `${removed} chave(s) de progresso local removida(s).`
        : 'Nenhuma chave de progresso local encontrada para esta investigação.'
    );
  };

  return (
    <div className="gm-toolkit-panel">
      <div className="gm-toolkit-header">
        <div className="gm-toolkit-title">
          <Wrench size={16} className="lucide-icon inline-icon" />
          <span>UTILITÁRIOS DO MESTRE</span>
        </div>
        <span className="gm-toolkit-selection-count">
          {selectedCardIds.length} / {cards.length} selecionada(s)
        </span>
      </div>

      {!ownerLoading && !isOwner && (
        <div className="gm-toolkit-warning">
          <ShieldAlert size={16} className="lucide-icon inline-icon" />
          <span>
            Acesso restrito: apenas o proprietário da investigação pode exportar,
            importar ou executar ações em lote.
          </span>
        </div>
      )}

      <div className="gm-toolkit-grid">
        {/* Ações em Lote */}
        <div className="gm-toolkit-group">
          <span className="gm-toolkit-group-label">Seleção & Visibilidade em Lote</span>
          <div className="gm-toolkit-actions">
            <button
              type="button"
              className="gm-btn"
              disabled={!canAct || cards.length === 0}
              onClick={onSelectAll}
            >
              <CheckSquare size={14} /> Selecionar Tudo
            </button>
            <button
              type="button"
              className="gm-btn"
              disabled={!canAct || selectedCardIds.length === 0}
              onClick={onClearSelection}
            >
              <Square size={14} /> Limpar Seleção
            </button>
            <button
              type="button"
              className="gm-btn gm-btn-reveal"
              disabled={!canAct || selectedCardIds.length === 0}
              onClick={() => handleBatchVisibility(false)}
            >
              <Eye size={14} /> 👁️ Revelar Selecionadas
            </button>
            <button
              type="button"
              className="gm-btn gm-btn-hide"
              disabled={!canAct || selectedCardIds.length === 0}
              onClick={() => handleBatchVisibility(true)}
            >
              <EyeOff size={14} /> 👻 Ocultar Selecionadas
            </button>
          </div>
        </div>

        {/* Backup & Restore JSON */}
        <div className="gm-toolkit-group">
          <span className="gm-toolkit-group-label">Backup do Caso (.JSON)</span>
          <div className="gm-toolkit-actions">
            <button
              type="button"
              className="gm-btn gm-btn-primary"
              disabled={!canAct}
              onClick={handleExport}
            >
              <Download size={14} /> Exportar Caso (.json)
            </button>

            <select
              className="gm-select"
              value={importMode}
              disabled={!canAct}
              onChange={(e) =>
                setImportMode(e.target.value as 'current' | 'new')
              }
              aria-label="Modo de importação"
            >
              <option value="current">Importar neste caso</option>
              <option value="new">Criar novo caso</option>
            </select>

            {importMode === 'new' && (
              <input
                type="text"
                className="gm-input"
                placeholder="Título do novo caso..."
                value={newCaseTitle}
                disabled={!canAct}
                onChange={(e) => setNewCaseTitle(e.target.value)}
              />
            )}

            <button
              type="button"
              className="gm-btn"
              disabled={!canAct}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} /> Importar JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleImportFileChange}
            />
          </div>
        </div>

        {/* Reset Local */}
        <div className="gm-toolkit-group">
          <span className="gm-toolkit-group-label">Testes do Mestre (LocalStorage)</span>
          <div className="gm-toolkit-actions">
            <button
              type="button"
              className="gm-btn gm-btn-warn"
              disabled={!canAct}
              onClick={handleResetLocalProgress}
            >
              <RotateCcw size={14} />{' '}
              {selectedCardIds.length > 0
                ? `Resetar Progresso (${selectedCardIds.length} selecionada(s))`
                : 'Resetar Progresso Local do Caso'}
            </button>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="gm-toolkit-feedback success">{statusMessage}</div>
      )}
      {errorMessage && (
        <div className="gm-toolkit-feedback error">{errorMessage}</div>
      )}
    </div>
  );
}
