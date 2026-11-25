import React, { useMemo, useState } from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { ShieldAlert, Info, Grid, Copy, ArrowDownToLine, FileText, Eye, Lock } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import { toast } from 'sonner';
import { CipherType, encodeWithCipher } from '../../../utils/ciphers';

const CIPHER_OPTIONS: Array<{ value: CipherType; label: string }> = [
  { value: 'caesar', label: 'César (Deslocamento)' },
  { value: 'rot13', label: 'ROT13' },
  { value: 'atbash', label: 'Atbash (Espelho)' },
  { value: 'vigenere', label: 'Vigenère (Com Chave)' },
  { value: 'a1z26', label: 'A1Z26 (Números)' },
  { value: 'hex', label: 'Hexadecimal' },
  { value: 'binary', label: 'Binário (8-bit)' },
  { value: 'morse', label: 'Código Morse' },
  { value: 'enigma', label: 'Enigma Simples (Com Chave)' },
  { value: 'base64', label: 'Base64' },
];

export default function TabCipher() {
  const { cipherState, setCipherState, coreState, setCoreState, mediaState, setActiveTab } =
    useClueModal();

  const [plainInput, setPlainInput] = useState('');
  const [cipherType, setCipherType] = useState<CipherType>('caesar');
  const [caesarShift, setCaesarShift] = useState<number>(3);
  const [cipherKey, setCipherKey] = useState<string>('ECDISE');
  const [saveOriginalToGmNotes, setSaveOriginalToGmNotes] = useState<boolean>(true);

  const cipherPreview = useMemo(() => {
    return encodeWithCipher(plainInput, cipherType, {
      shift: caesarShift,
      key: cipherKey,
    });
  }, [plainInput, cipherType, caesarShift, cipherKey]);

  const maybeSaveOriginalToGmNotes = (original: string) => {
    if (!saveOriginalToGmNotes || !original.trim()) return;
    const noteEntry = `[Texto Original (${cipherType.toUpperCase()})]:\n${original.trim()}`;
    setCoreState((s) => {
      if (s.descHidden && s.descHidden.includes(original.trim())) return s;
      const nextHidden = s.descHidden?.trim()
        ? `${s.descHidden.trim()}\n\n${noteEntry}`
        : noteEntry;
      return { ...s, descHidden: nextHidden };
    });
  };

  const handleCopyCipher = async () => {
    if (!cipherPreview) {
      toast.error('Digite um texto original primeiro.');
      return;
    }
    try {
      await navigator.clipboard.writeText(cipherPreview);
      toast.success('Texto cifrado copiado!');
    } catch {
      toast.error('Não foi possível copiar automaticamente.');
    }
  };

  const handleApplyToPublicDesc = () => {
    if (!cipherPreview) {
      toast.error('Digite um texto original primeiro.');
      return;
    }
    setCoreState((s) => ({ ...s, descPublic: cipherPreview }));
    maybeSaveOriginalToGmNotes(plainInput);
    toast.success('Texto cifrado aplicado na Descrição Pública!');
  };

  const handleApplyToDecoderLens = () => {
    if (!plainInput.trim() || !cipherPreview) {
      toast.error('Digite um texto original primeiro.');
      return;
    }
    setCipherState((s) => ({
      ...s,
      realText: plainInput,
      cipherText: cipherPreview,
    }));
    maybeSaveOriginalToGmNotes(plainInput);
    toast.success('Texto aplicado na Lente Decifradora!');
  };

  const hasBaseImage = Boolean(mediaState.imgFile || mediaState.previewUrl);
  const isNotDocument = coreState.evidenceType !== 'document';
  const totalPieces = (cipherState.shredRows || 1) * (cipherState.shredCols || 1);

  return (
    <div className="ccm-tab-stack">
      <section className="ccm-section ccm-section-accent">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            <Lock size={16} /> Cifrador Embutido
          </h3>
          <button
            type="button"
            className="ccm-btn ccm-btn-sm"
            onClick={() => {
              if (!coreState.descPublic?.trim()) {
                toast.error('A Descrição Pública está vazia.');
                return;
              }
              setPlainInput(coreState.descPublic);
            }}
          >
            <ArrowDownToLine size={13} /> Puxar da Descrição Pública
          </button>
        </div>

        <div className="ccm-field">
          <label className="ccm-label">Texto Original (Para Cifrar)</label>
          <textarea
            className="ccm-input"
            rows={3}
            value={plainInput}
            onChange={(e) => setPlainInput(e.target.value)}
            placeholder="Digite aqui a mensagem secreta que deseja cifrar..."
          />
        </div>

        <div className="ccm-grid-2">
          <div className="ccm-field">
            <label className="ccm-label">Cifra</label>
            <select
              className="ccm-input"
              value={cipherType}
              onChange={(e) => setCipherType(e.target.value as CipherType)}
            >
              {CIPHER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {cipherType === 'caesar' && (
            <div className="ccm-field">
              <label className="ccm-label">Shift (Deslocamento)</label>
              <input
                type="number"
                className="ccm-input"
                value={caesarShift}
                min={-25}
                max={25}
                onChange={(e) => setCaesarShift(parseInt(e.target.value, 10) || 0)}
              />
            </div>
          )}

          {(cipherType === 'vigenere' || cipherType === 'enigma') && (
            <div className="ccm-field">
              <label className="ccm-label">Chave</label>
              <input
                type="text"
                className="ccm-input"
                value={cipherKey}
                onChange={(e) => setCipherKey(e.target.value)}
                placeholder="Ex: ECDISE"
              />
            </div>
          )}
        </div>

        <div className="ccm-field">
          <label className="ccm-label">Preview em Tempo Real (Texto Cifrado)</label>
          <textarea
            className="ccm-input ccm-input-mono"
            readOnly
            rows={3}
            value={cipherPreview}
            placeholder="O resultado cifrado aparecerá aqui automaticamente..."
          />
        </div>

        <label className="ccm-toggle-row">
          <span className="ccm-toggle-text">
            <span className="ccm-toggle-title">
              Guardar texto original nas Notas Confidenciais do GM
            </span>
          </span>
          <input
            type="checkbox"
            className="ccm-checkbox-input"
            checked={saveOriginalToGmNotes}
            onChange={(e) => setSaveOriginalToGmNotes(e.target.checked)}
          />
        </label>

        <div className="ccm-btn-row">
          <button type="button" className="ccm-btn ccm-btn-sm" onClick={handleCopyCipher}>
            <Copy size={13} /> Copiar
          </button>
          <button
            type="button"
            className="ccm-btn ccm-btn-sm ccm-btn-primary"
            onClick={handleApplyToPublicDesc}
          >
            <FileText size={13} /> Aplicar na descrição pública
          </button>
          <button
            type="button"
            className="ccm-btn ccm-btn-sm ccm-btn-primary"
            onClick={handleApplyToDecoderLens}
          >
            <Eye size={13} /> Aplicar na Lente Decifradora
          </button>
        </div>
      </section>

      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            SHREDDER & LENTE DECIFRADORA
            <span data-tooltip-id="cipher-tip" className="ccm-help-icon">
              <Info size={15} />
            </span>
          </h3>
          <label className="ccm-toggle-row" style={{ minHeight: 34, padding: '4px 10px' }}>
            <span className="ccm-toggle-title">Ativar Shredder</span>
            <input
              type="checkbox"
              className="ccm-checkbox-input"
              checked={cipherState.isShredded}
              onChange={(e) => setCipherState((s) => ({ ...s, isShredded: e.target.checked }))}
            />
          </label>
          <Tooltip id="cipher-tip" className="cyber-tooltip ccm-tooltip">
            <span className="cyber-tooltip-title">[ CIFRA SHREDDER ]</span>
            O Shredder fragmenta a imagem do documento em tiras/peças para o jogador remontar.
          </Tooltip>
        </div>

        {cipherState.isShredded && isNotDocument && (
          <div className="ccm-callout ccm-callout-danger">
            <div className="ccm-callout-left">
              <ShieldAlert size={18} />
              <strong>Shredder exige subtipo "Documento Padrão"</strong>
            </div>
            <button
              type="button"
              className="ccm-btn ccm-btn-sm ccm-btn-primary"
              onClick={() => setCoreState((s) => ({ ...s, evidenceType: 'document' }))}
            >
              Corrigir para Documento
            </button>
          </div>
        )}

        {cipherState.isShredded && !hasBaseImage && (
          <div className="ccm-callout ccm-callout-danger">
            <div className="ccm-callout-left">
              <ShieldAlert size={18} />
              <strong>Shredder requer uma imagem base selecionada</strong>
            </div>
            <button
              type="button"
              className="ccm-btn ccm-btn-sm ccm-btn-primary"
              onClick={() => setActiveTab('visual')}
            >
              Ir para aba Visual
            </button>
          </div>
        )}

        {cipherState.isShredded && (
          <>
            <div className="ccm-btn-row">
              <span className="ccm-note" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Grid size={14} /> Presets:
              </span>
              <button
                type="button"
                className="ccm-btn ccm-btn-sm"
                onClick={() => setCipherState((s) => ({ ...s, shredRows: 1, shredCols: 8 }))}
              >
                1×8 (Horizontais)
              </button>
              <button
                type="button"
                className="ccm-btn ccm-btn-sm"
                onClick={() => setCipherState((s) => ({ ...s, shredRows: 4, shredCols: 4 }))}
              >
                4×4 (Grade)
              </button>
              <button
                type="button"
                className="ccm-btn ccm-btn-sm"
                onClick={() => setCipherState((s) => ({ ...s, shredRows: 8, shredCols: 1 }))}
              >
                8×1 (Verticais)
              </button>
              <span className="ccm-code-pill" style={{ marginLeft: 'auto' }}>
                {totalPieces} peças
              </span>
            </div>

            <div className="ccm-grid-2">
              <div className="ccm-field">
                <label className="ccm-label">Linhas do Shredder</label>
                <input
                  type="number"
                  className="ccm-input"
                  value={cipherState.shredRows}
                  onChange={(e) =>
                    setCipherState((s) => ({ ...s, shredRows: Math.max(1, parseInt(e.target.value, 10) || 1) }))
                  }
                  min={1}
                  max={12}
                />
              </div>
              <div className="ccm-field">
                <label className="ccm-label">Colunas do Shredder</label>
                <input
                  type="number"
                  className="ccm-input"
                  value={cipherState.shredCols}
                  onChange={(e) =>
                    setCipherState((s) => ({ ...s, shredCols: Math.max(1, parseInt(e.target.value, 10) || 1) }))
                  }
                  min={1}
                  max={12}
                />
              </div>
            </div>
          </>
        )}

        <div className="ccm-grid-2">
          <div className="ccm-field">
            <label className="ccm-label">Texto Real (Decifrado — Lente Decifradora)</label>
            <textarea
              className="ccm-input"
              rows={3}
              value={cipherState.realText}
              onChange={(e) => setCipherState((s) => ({ ...s, realText: e.target.value }))}
              placeholder="O texto quando o puzzle é resolvido..."
            />
          </div>

          <div className="ccm-field">
            <label className="ccm-label">Texto Cifrado (Inicial — Lente Decifradora)</label>
            <textarea
              className="ccm-input"
              rows={3}
              value={cipherState.cipherText}
              onChange={(e) => setCipherState((s) => ({ ...s, cipherText: e.target.value }))}
              placeholder="O texto embaralhado que o usuário vê..."
            />
          </div>
        </div>
      </section>

      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            HEX VIEWER & ENCODING
            <span data-tooltip-id="hex-tip" className="ccm-help-icon">
              <Info size={15} />
            </span>
          </h3>
          <Tooltip id="hex-tip" className="cyber-tooltip ccm-tooltip">
            Configura o código oculto no Inspetor Hexadecimal.
          </Tooltip>
        </div>

        <div className="ccm-grid-2">
          <div className="ccm-field ccm-col-full">
            <label className="ccm-label">Comentário Oculto / Texto Original para Hex</label>
            <textarea
              className="ccm-input"
              rows={2}
              value={cipherState.hexCode}
              onChange={(e) => setCipherState((s) => ({ ...s, hexCode: e.target.value }))}
              placeholder="Ex: SECTOR_7G_COMPROMISED"
            />
          </div>

          <div className="ccm-field">
            <label className="ccm-label">Método de Encoding Hex</label>
            <select
              className="ccm-input"
              value={cipherState.hexEncodingMethod}
              onChange={(e) => setCipherState((s) => ({ ...s, hexEncodingMethod: e.target.value as any }))}
            >
              <option value="plain">Texto Puro (Plain)</option>
              <option value="utf8hex">UTF-8 para Hex (Padrão)</option>
              <option value="xor">Cifra XOR</option>
              <option value="enigma">Cifra Enigma Simples</option>
            </select>
          </div>

          {cipherState.hexEncodingMethod !== 'plain' && cipherState.hexEncodingMethod !== 'utf8hex' && (
            <div className="ccm-field">
              <label className="ccm-label">Chave do Encoding</label>
              <input
                type="text"
                className="ccm-input"
                value={cipherState.hexEncodingKey}
                onChange={(e) => setCipherState((s) => ({ ...s, hexEncodingKey: e.target.value }))}
                placeholder="Ex: 42 ou CHAVE_SECRETA"
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
